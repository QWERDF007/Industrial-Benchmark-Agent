import sqlite3
from collections import deque
from contextlib import ExitStack
from pathlib import Path
from typing import Callable,Literal

import numpy as np
from filelock import FileLock,Timeout
from pydantic import Field,computed_field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.decoding import DecodeGroup, DecodeSource, ImageDecoding, UnavailableImage
from iad_core.duplicate.index import PixelIndex
from iad_core.feature.base import FeatureExtractor
from iad_core.feature.encoder import ImageEncoderRuntime
from iad_core.feature.profiles import ImageEncoderConfig, ImageEncoders
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository
from iad_core.storage.models import FeatureRecord


class FeatureSamplePreparation(AnalysisModel):
    sample_id: str
    status: Literal['COMPLETE','FAILED','UNINDEXED','UNAVAILABLE']
    error_code: str | None = None
    error_message: str | None = None


class FeaturePreparation(AnalysisModel):
    profile_id: str
    samples: list[FeatureSamplePreparation]
    total_content: int = Field(ge=0)
    encoded_content_count: int = Field(ge=0)
    encoded_pixels: int = Field(ge=0)
    decode_reserved_peak_bytes: int = Field(ge=0)
    cache_hit_count: int = Field(ge=0)
    failed_count: int = Field(ge=0)
    storage_bytes: int = Field(ge=0)

    @computed_field
    @property
    def total_samples(self) -> int:return len(self.samples)

    @computed_field
    @property
    def unindexed_count(self) -> int:return sum(sample.status=='UNINDEXED' for sample in self.samples)

    @computed_field
    @property
    def unavailable_samples(self) -> int:return sum(sample.status=='UNAVAILABLE' for sample in self.samples)

    @computed_field
    @property
    def completed_samples(self) -> int:return sum(sample.status=='COMPLETE' for sample in self.samples)


class ContentFeatureCache:
    def __init__(self, db: Database, encoder_runtime: ImageEncoderRuntime | None = None):
        self.db=db
        self.repository=FeatureRepository(db)
        self.runtime=encoder_runtime

    def prepare(self, sample_ids: list[str], config: ImageEncoderConfig, *, extractor: FeatureExtractor | None = None,
                force: bool = False, checkpoint: Callable[[],None] | None = None) -> FeaturePreparation:
        if checkpoint:checkpoint()
        profile=config.profile
        if extractor is not None and (extractor.model_id,extractor.profile_id,extractor.dim)!=(profile.model_id,profile.profile_id,profile.dim):
            raise ValueError('Extractor must match the requested immutable embedding profile')
        ImageEncoders(self.db).register(profile)
        runtime=self.runtime or ImageEncoderRuntime()
        try:
            with ExitStack() as locks:
                feature_lock=FileLock(str(Path(self.db.db_path).resolve())+'.features.'+profile.profile_id+'.lock')
                while True:
                    if checkpoint:checkpoint()
                    try:
                        locks.enter_context(feature_lock.acquire(timeout=.2))
                        break
                    except Timeout:continue
                if checkpoint:checkpoint()
                sources=self.repository.sources(sample_ids)
                if len(sources)!=len(set(sample_ids)):
                    raise ConsistencyError('INVALID_SCOPE','Feature subjects contain missing or excluded samples')
                if any(source['scan_ref'] is None for source in sources):
                    raise ConsistencyError('INDEX_NOT_READY','Publish the image content index before preparing features')
                groups={}
                valid_samples=set()
                for source in sources:
                    if checkpoint:checkpoint()
                    group=source['content_group_id']
                    if group is None:
                        continue
                    groups.setdefault(group,[])
                    try:
                        stat=Path(source['image_path']).stat()
                        if (stat.st_size,stat.st_mtime_ns)==(source['file_size'],source['mtime_ns']):
                            groups[group].append(source)
                            valid_samples.add(source['sample_id'])
                    except OSError:
                        pass
                existing={row['content_group_id']:row for row in self.repository.records(list(groups),profile.profile_id)}
                hits={group for group,row in existing.items() if row['status']=='COMPLETE' and groups[group] and not force}
                missing=[group for group in groups if group not in hits
                    and (groups[group] or existing.get(group,{}).get('status')!='COMPLETE')]
                decoder=locks.enter_context(ImageDecoding(config.decode_workers,config.decode_memory_mb*1024**2))
                requests={group:DecodeGroup(group,tuple(DecodeSource(source['image_path'],PixelIndex.entry(source))
                    for source in groups[group])) for group in missing}
                pending=deque(decoder.partition(list(requests.values()),config.batch_size))
                encoded=set()
                encoded_sizes={}
                while pending:
                    if checkpoint:checkpoint()
                    batch=pending.popleft()
                    records=[]
                    ready=[]
                    with ExitStack() as stack:
                        images=[]
                        decoded=decoder.load(batch,checkpoint)
                        stack.callback(decoded.clear)
                        for content in decoded:
                            valid_samples.difference_update(content.failed_sample_ids)
                            group=content.group_id
                            if isinstance(content,UnavailableImage):
                                if existing.get(group,{}).get('status')!='COMPLETE':
                                    records.append(FeatureRecord(content_group_id=group,profile_id=profile.profile_id,
                                        dim=profile.dim,dtype=profile.storage_dtype,status='FAILED',error_code=content.error.code,
                                        error_message=str(content.error)))
                            else:
                                images.append(stack.enter_context(content.pixels.image()))
                                ready.append(group)
                        if decoded:
                            del content
                        if records:
                            self.repository.upsert_batch(records)
                        if not ready:
                            continue
                        try:
                            if checkpoint:checkpoint()
                            vectors=extractor.encode_batch(images) if extractor else runtime.encode(config,images)
                            if checkpoint:checkpoint()
                            vectors=np.asarray(vectors,dtype=profile.storage_dtype)
                            if vectors.shape!=(len(ready),profile.dim):
                                raise ConsistencyError('ENCODER_UNAVAILABLE','Encoder returned invalid dimensions')
                            self.repository.upsert_batch([FeatureRecord(content_group_id=group,profile_id=profile.profile_id,
                                dim=profile.dim,dtype=profile.storage_dtype,embedding_blob=vector.tobytes()) for group,vector in zip(ready,vectors)])
                            encoded.update(ready)
                            encoded_sizes.update({group:image.width*image.height for group,image in zip(ready,images)})
                        except Exception as error:
                            if isinstance(error,InterruptedError):raise
                            if isinstance(error,ConsistencyError) and error.code=='UNSUPPORTED_IMAGE' and len(ready)>1:
                                middle=len(ready)//2
                                pending.appendleft([requests[group] for group in ready[middle:]]);pending.appendleft([requests[group] for group in ready[:middle]])
                                continue
                            if isinstance(error,sqlite3.IntegrityError):
                                raise ConsistencyError('SOURCE_UNAVAILABLE','Content index changed during encoding; prepare the current scope again') from error
                            code=error.code if isinstance(error,ConsistencyError) else 'ENCODER_UNAVAILABLE'
                            self.repository.upsert_batch([FeatureRecord(content_group_id=group,profile_id=profile.profile_id,
                                dim=profile.dim,dtype=profile.storage_dtype,status='FAILED',error_code=code,error_message=str(error)) for group in ready])
                            if code!='UNSUPPORTED_IMAGE':
                                raise ConsistencyError(code,str(error)) from error
                current_sources=self.repository.sources(sample_ids)
                if checkpoint:checkpoint()
                if {(source['sample_id'],source['content_group_id']) for source in current_sources}!={(source['sample_id'],source['content_group_id']) for source in sources}:
                    raise ConsistencyError('SOURCE_UNAVAILABLE','Content subjects changed during encoding; prepare the current scope again')
                for source in sources:
                    if source['sample_id'] not in valid_samples:
                        continue
                    try:
                        stat=Path(source['image_path']).stat()
                    except OSError as error:
                        raise ConsistencyError('SOURCE_UNAVAILABLE','Source became unavailable during encoding; rescan the dataset') from error
                    if (stat.st_size,stat.st_mtime_ns)!=(source['file_size'],source['mtime_ns']):
                        raise ConsistencyError('SOURCE_UNAVAILABLE','Source changed during encoding; rescan the dataset')
                records=self.repository.records(list(groups),profile.profile_id)
                complete={row['content_group_id'] for row in records if row['status']=='COMPLETE'
                    and any(source['sample_id'] in valid_samples for source in groups[row['content_group_id']])}
                indexed={row['content_group_id']:row for row in records}
                outcomes=[]
                for source in sources:
                    row=indexed.get(source['content_group_id'],{})
                    status=('UNINDEXED' if source['content_group_id'] is None else 'UNAVAILABLE' if source['sample_id'] not in valid_samples
                        else 'COMPLETE' if source['content_group_id'] in complete else 'FAILED')
                    outcomes.append(FeatureSamplePreparation(sample_id=source['sample_id'],status=status,
                        error_code=row.get('error_code') if status=='FAILED' else None,
                        error_message=row.get('error_message') if status=='FAILED' else None))
                return FeaturePreparation(profile_id=profile.profile_id,samples=outcomes,total_content=len(groups),
                    encoded_content_count=len(encoded),encoded_pixels=sum(encoded_sizes.values()),decode_reserved_peak_bytes=decoder.peak_reserved_bytes,cache_hit_count=len(hits),failed_count=len(set(groups)-complete),
                    storage_bytes=sum(len(row['embedding_blob']) for row in records if row['status']=='COMPLETE'))
        finally:
            if self.runtime is None:
                runtime.close()
