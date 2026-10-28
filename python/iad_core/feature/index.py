import hashlib
import json
import os
import sqlite3
import threading
import time
import uuid
import zipfile
from collections import OrderedDict
from collections.abc import Mapping
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from types import MappingProxyType

from filelock import FileLock
from pydantic import TypeAdapter, ValidationError

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import CorpusScope, CoverageCount, FrozenScope
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.feature.flat_index import CpuFlatIndex
from iad_core.feature.index_artifacts import IndexArtifacts
from iad_core.feature.index_models import CorpusIndexInfo, IndexLimits, IndexStats
from iad_core.feature.profiles import ImageEncoders
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository


@dataclass(frozen=True)
class CorpusState:
    scope_id: str
    signature: str
    sample_ids: tuple[str,...]
    group_ids: tuple[str,...]
    members: Mapping[str,tuple[str,...]]
    coverage: CoverageCount

    def resident_bytes(self, dim: int) -> int:
        return 4096+len(self.group_ids)*(dim*4+128)+sum(len(value.encode())+96 for values in self.members.values() for value in values)


@dataclass(eq=False)
class IndexEntry:
    info: CorpusIndexInfo
    engine: CpuFlatIndex
    version: int
    pins: int = 0


class IndexLease:
    def __init__(self, entry: IndexEntry, completed, slots):
        self._entry=entry
        self._completed=completed
        self._slots=slots
        self._lock=threading.RLock()

    def _live(self) -> IndexEntry:
        if self._entry is None:
            raise RuntimeError('Index lease is closed')
        return self._entry

    @property
    def info(self) -> CorpusIndexInfo:
        with self._lock:return self._live().info.model_copy(deep=True)

    @property
    def group_ids(self) -> tuple[str,...]:
        with self._lock:return self._live().engine.group_ids

    def members(self, group_id: str) -> tuple[str,...]:
        with self._lock:return self._live().engine.members.get(group_id,())

    def vectors(self, start: int, count: int):
        with self._lock:return self._live().engine.vectors(start,count)

    def search(self, vectors, top_k: int = 50):
        with self._lock,self._slots:
            started=time.perf_counter()
            result=self._live().engine.search(vectors,top_k)
            self._completed(len(result),time.perf_counter()-started)
            return result

    def close(self):
        with self._lock:self._entry=None


class CorpusIndexes:
    """Bounded leases over immutable, content-level CPU indexes."""

    def __init__(self, db: Database, cache_dir: str | Path | None = None, limits: IndexLimits | None = None):
        self.db=db
        self.limits=limits or IndexLimits()
        database=Path(db.db_path).resolve()
        self.artifacts=IndexArtifacts(Path(cache_dir) if cache_dir else database.with_name(database.name+'.image-indexes'))
        self.repository=FeatureRepository(db)
        self._mutex=threading.RLock()
        self._condition=threading.Condition(self._mutex)
        self._probe=sqlite3.connect(db.db_path,check_same_thread=False)
        self._entries=OrderedDict()
        self._reserved_keys=set()
        self._retired=set()
        self._stats=IndexStats()
        self._resident=self._reserved=self._scratch=self._building=0
        self._closed=False
        self._builders=threading.BoundedSemaphore(2)
        self._queries=threading.BoundedSemaphore(2)

    def __enter__(self):return self

    def __exit__(self,*args):self.close()

    def _version(self) -> int:
        with self._mutex:
            if self._closed:raise RuntimeError('Index cache is closed')
            return self._probe.execute('PRAGMA data_version').fetchone()[0]

    def _capture(self, selector, profile_id: str, expected: FrozenScope | None = None, connection=None) -> CorpusState:
        if connection is None:
            with self.db.connection() as connection:
                connection.execute('BEGIN')
                return self._capture(selector,profile_id,expected,connection)
        scope=ConsistencyScopes(self.db).resolve(selector,connection)
        if expected is not None and scope.scope_id!=expected.scope_id:
            raise ConsistencyError('SOURCE_UNAVAILABLE','Frozen corpus changed; freeze the current scope again')
        sample_ids=tuple(sample.sample_id for sample in scope.samples)
        rows=self.repository.corpus_metadata(list(sample_ids),profile_id,connection)
        members={}
        states={'completed':0,'failed':0,'unsupported':0,'pending':0}
        for row in rows:
            if row['decode_status']=='UNSUPPORTED':state='unsupported'
            elif row['decode_status']=='UNAVAILABLE' or row['feature_status']=='FAILED':state='failed'
            elif row['content_group_id'] is not None and row['feature_status']=='COMPLETE':
                state='completed'
                members.setdefault(row['content_group_id'],[]).append(row['sample_id'])
            else:state='pending'
            states[state]+=1
        if len(rows)!=scope.sample_count:
            raise ConsistencyError('SOURCE_UNAVAILABLE','Corpus membership changed during capture')
        signature=hashlib.sha256(json.dumps([scope.scope_id,profile_id,rows],sort_keys=True).encode()).hexdigest()
        return CorpusState(scope.scope_id,signature,sample_ids,tuple(sorted(members)),
            MappingProxyType({group:tuple(values) for group,values in members.items()}),CoverageCount(total=len(rows),**states))

    def _reserve(self, size: int, scratch: int, protect) -> None:
        with self._mutex:
            if self._closed:raise RuntimeError('Index cache is closed')
            if self._scratch+scratch>self.limits.max_build_bytes:
                raise ConsistencyError('RESOURCE_LIMIT','Index construction exceeds the scratch-memory budget')
            while self._resident+self._reserved+size>self.limits.max_resident_bytes or len(set(self._entries)|self._reserved_keys|{protect})>self.limits.max_entries:
                victim=next((key for key,entry in self._entries.items() if key!=protect and entry.pins==0),None)
                if victim is None:
                    raise ConsistencyError('RESOURCE_LIMIT','Index cache is full; active queries retain their snapshots')
                entry=self._entries.pop(victim)
                self._resident-=entry.info.resident_bytes
                self._stats.evictions+=1
            self._reserved+=size;self._scratch+=scratch;self._building+=1
            self._reserved_keys.add(protect)

    def _get(self, corpus_scope, profile_id: str | None, force: bool = False) -> IndexEntry:
        expected=corpus_scope if isinstance(corpus_scope,FrozenScope) else None
        try:
            selector=TypeAdapter(CorpusScope).validate_python(expected.selector if expected else corpus_scope)
        except ValidationError as error:
            raise ConsistencyError('INVALID_SCOPE','Corpus indexes require registered dataset scopes') from error
        if selector.kind=='datasets':selector=selector.model_copy(update={'dataset_ids':sorted(selector.dataset_ids)})
        profile=ImageEncoders(self.db).profile(profile_id)
        range_id='corpus_'+hashlib.sha256(json.dumps(selector.model_dump(),sort_keys=True).encode()).hexdigest()
        key=(range_id,profile.profile_id)
        version=self._version()
        with self._mutex:
            entry=self._entries.get(key)
            if entry is not None and entry.version==version and not force:
                if expected is not None and entry.info.scope_id!=expected.scope_id:
                    raise ConsistencyError('SOURCE_UNAVAILABLE','Frozen corpus is no longer current')
                entry.pins+=1;self._entries.move_to_end(key);self._stats.cache_hits+=1
                return entry
        path=self.artifacts.path(*key)
        with FileLock(str(path)+'.lock',timeout=30),self._builders:
            version=self._version()
            state=self._capture(selector,profile.profile_id,expected)
            with self._mutex:
                entry=self._entries.get(key)
                if entry is not None and entry.info.signature==state.signature and not force:
                    entry.version=version;entry.pins+=1
                    self._entries.move_to_end(key);self._stats.cache_hits+=1
                    return entry
            size=state.resident_bytes(profile.dim)
            scratch=2*len(state.group_ids)*profile.dim*4+size+4096
            self._reserve(size,scratch,key)
            temporary=None
            reserved=True
            try:
                info=CorpusIndexInfo(scope_id=state.scope_id,range_id=range_id,profile_id=profile.profile_id,
                    signature=state.signature,generation=uuid.uuid4().hex,vector_count=len(state.group_ids),
                    member_count=sum(len(values) for values in state.members.values()),dim=profile.dim,
                    vector_bytes=len(state.group_ids)*profile.dim*4,resident_bytes=size,coverage=state.coverage,index_path=str(path))
                loaded=None
                if path.exists() and not force:
                    try:
                        loaded=self.artifacts.load(path,info,state.group_ids,state.members,self.limits)
                    except ConsistencyError:
                        raise
                    except (OSError,ValueError,KeyError,RuntimeError,zipfile.BadZipFile):
                        with self._mutex:self._stats.invalid_artifacts+=1
                if loaded is not None:
                    info,engine=loaded
                    with self._mutex:self._stats.disk_loads+=1
                else:
                    try:
                        with self.db.connection() as connection:
                            connection.execute('BEGIN')
                            if self._capture(selector,profile.profile_id,expected,connection).signature!=state.signature:
                                raise ConsistencyError('SOURCE_UNAVAILABLE','Corpus changed before index construction')
                            engine=CpuFlatIndex.build(self.repository.iter_vectors(state.group_ids,profile.profile_id,connection),
                                state.group_ids,state.members,profile.dim,self.limits)
                    except ImportError as error:
                        raise ConsistencyError('INDEX_NOT_READY','Install the retrieval optional dependency to use visual indexes') from error
                    temporary=self.artifacts.stage(path,info,engine)
                    with self.db.connection() as connection:
                        connection.execute('BEGIN IMMEDIATE')
                        if self._capture(selector,profile.profile_id,expected,connection).signature!=state.signature:
                            raise ConsistencyError('SOURCE_UNAVAILABLE','Corpus changed during index construction')
                        version=self._version()
                        os.replace(temporary,path)
                    with self._mutex:self._stats.builds+=1
                entry=IndexEntry(info,engine,version,pins=1)
                with self._mutex:
                    previous=self._entries.pop(key,None)
                    if previous is not None:
                        if previous.pins:self._retired.add(previous)
                        else:self._resident-=previous.info.resident_bytes
                    self._entries[key]=entry;self._resident+=size
                    self._reserved-=size;reserved=False
                return entry
            except BaseException:
                with self._mutex:self._stats.build_failures+=1
                raise
            finally:
                if temporary is not None:temporary.unlink(missing_ok=True)
                with self._condition:
                    if reserved:self._reserved-=size
                    self._reserved_keys.discard(key)
                    self._scratch-=scratch;self._building-=1
                    self._condition.notify_all()

    def _release(self, entry: IndexEntry):
        with self._mutex:
            entry.pins-=1
            if entry.pins==0 and entry in self._retired:
                self._retired.remove(entry);self._resident-=entry.info.resident_bytes

    def _queried(self, count: int, elapsed: float):
        with self._mutex:
            self._stats.queries+=count
            self._stats.search_batches+=1
            self._stats.query_seconds+=elapsed

    def prepare(self, corpus_scope, profile_id: str | None = None, *, force: bool = False) -> CorpusIndexInfo:
        entry=self._get(corpus_scope,profile_id,force)
        try:return entry.info.model_copy(deep=True)
        finally:self._release(entry)

    @contextmanager
    def acquire(self, corpus_scope, profile_id: str | None = None):
        entry=self._get(corpus_scope,profile_id)
        lease=IndexLease(entry,self._queried,self._queries)
        try:yield lease
        finally:lease.close();self._release(entry)

    def stats(self) -> IndexStats:
        with self._mutex:
            return self._stats.model_copy(update=dict(resident_bytes=self._resident,reserved_bytes=self._reserved,
                reserved_build_bytes=self._scratch,cache_entries=len(self._entries),
                pinned_entries=sum(entry.pins>0 for entry in [*self._entries.values(),*self._retired])))

    def close(self):
        with self._condition:
            while self._building:self._condition.wait()
            if self._closed:return
            self._closed=True;self._probe.close()
            for entry in self._entries.values():
                if entry.pins:self._retired.add(entry)
                else:self._resident-=entry.info.resident_bytes
            self._entries.clear()
