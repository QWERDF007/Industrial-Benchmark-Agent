import json
from functools import lru_cache
from datetime import datetime,timedelta,timezone
from uuid import uuid4

from iad_core.consistency.batch_repository import BatchRepository
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import EvidenceBlob,EvidenceSourceStates
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.consistency.result_models import BatchSelection,ConsistencyQuery,FactCounts,ResultSnapshot
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.consistency.query_coverage import QueryCoverage
from iad_core.consistency.result_statistics import ResultStatistics
from iad_core.consistency.review_repository import ConsistencyDecisionRepository
from iad_core.consistency.review_states import ReviewStates
from iad_core.storage.review_repository import ReviewRepository
from iad_core.gold.readiness import GoldAvailability
from iad_core.evidence.current_sources import CurrentSource
from iad_core.evidence.retained import RetainedImages
from iad_core.storage.database import Database


class ResultSnapshots:
    METADATA_BYTES=128*1024*1024
    TTL=timedelta(hours=1)

    def __init__(self,db: Database):self.db=db

    def get(self,query_id: str) -> ResultSnapshot:
        with self.db.connection() as connection:
            row=connection.execute('SELECT snapshot_json,expires_at FROM consistency_queries WHERE query_id=?',(query_id,)).fetchone()
        if row is None or datetime.fromisoformat(row['expires_at'])<=datetime.now(timezone.utc):
            raise ConsistencyError('REFERENCE_NOT_FOUND','Result snapshot is unavailable or expired; reopen results')
        return ResultSnapshot.model_validate_json(row['snapshot_json'])

    def create(self,request: ConsistencyQuery,fingerprint: str) -> ResultSnapshot:
        observed=datetime.now(timezone.utc)
        selection=request.selection
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            watermark=connection.execute('SELECT COALESCE(MAX(rowid),0) FROM consistency_results').fetchone()[0]
            decision_watermark=connection.execute('SELECT COALESCE(MAX(id),0) FROM consistency_decisions').fetchone()[0]
            correction_watermark=connection.execute('SELECT COALESCE(MAX(id),0) FROM consistency_correction_checks').fetchone()[0]
            clauses=['r.rowid<=?'];args=[watermark]
            if isinstance(selection,BatchSelection):
                plan,_=BatchRepository(self.db).get(selection.batch_id,connection)
                scopes=plan.scopes
                link=connection.execute('SELECT COALESCE(MAX(rowid),0) FROM consistency_batch_results WHERE batch_id=?',(selection.batch_id,)).fetchone()[0]
                clauses.append('EXISTS(SELECT 1 FROM consistency_batch_results b WHERE b.batch_id=? AND b.rowid<=? AND b.evidence_id=r.evidence_id)')
                args.extend((selection.batch_id,link))
            else:
                scopes=ConsistencyScopes(self.db).freeze(selection.subjects,selection.corpus_scope,connection)
                subjects=json.dumps([sample.sample_id for sample in scopes.subjects.samples])
                corpus=json.dumps([sample.sample_id for sample in scopes.corpus.samples])
                left="json_extract(r.snapshot_json,'$.parameters.sample_a')"
                right="json_extract(r.snapshot_json,'$.parameters.sample_b')"
                clauses.append(f'''(({left} IN (SELECT value FROM json_each(?)) AND {right} IN (SELECT value FROM json_each(?)))
                    OR ({right} IN (SELECT value FROM json_each(?)) AND {left} IN (SELECT value FROM json_each(?))))''')
                args.extend((subjects,corpus,subjects,corpus))
            source='FROM consistency_results r WHERE '+' AND '.join(clauses)
            identity_sql="SELECT json_extract(r.snapshot_json,'$.parameters.sample_a') identity "+source+" UNION SELECT json_extract(r.snapshot_json,'$.parameters.sample_b') identity "+source
            identities=[row[0] for row in connection.execute(identity_sql,(*args,*args))]
            current={};size=0
            for identity in identities:
                value=CurrentSource.capture(self.db,identity,connection)
                size+=value.metadata_bytes
                if size>self.METADATA_BYTES:raise ConsistencyError('RESOURCE_LIMIT','Result source metadata exceeds the query budget; narrow the scope')
                current[identity]=value
            coverage=QueryCoverage.capture(self.db,selection,scopes,connection)
            gold=GoldAvailability.capture(self.db,scopes.subjects,connection)
        counts={'current':0,'historical':0,'unknown':0};total=0
        images=RetainedImages(self.db)
        @lru_cache(maxsize=8192)
        def available_blob(sha256: str,byte_count: int) -> bool:
            try:images.path(EvidenceBlob(sha256=sha256,byte_count=byte_count));return True
            except ConsistencyError:return False
        with self.db.connection() as connection:
            connection.execute('PRAGMA temp_store=FILE')
            connection.execute('CREATE TEMP TABLE selected_items(position INTEGER PRIMARY KEY,evidence_id TEXT,facts_state TEXT,source_states_json TEXT,evidence_available INTEGER)')
            connection.execute('CREATE TEMP TABLE current_pairs(sample_a TEXT,sample_b TEXT,PRIMARY KEY(sample_a,sample_b))')
            statistics=ResultStatistics(connection)
            rows=connection.execute("SELECT r.snapshot_json,r.snapshot_sha256 "+source+" ORDER BY json_extract(r.snapshot_json,'$.checked_at') DESC,r.rowid DESC",args)
            for row in rows:
                saved=ConsistencyRepository.deserialize(row['snapshot_json'],row['snapshot_sha256'])
                states=EvidenceSourceStates(**{side:current[getattr(saved.sources,side).sample.sample_id].state(getattr(saved.sources,side)) for side in ('left','right')})
                available=True
                for frozen in (saved.sources.left,saved.sources.right):
                    for blob in (frozen.image,*frozen.masks.values()):
                        available=available and available_blob(blob.sha256,blob.byte_count)
                state=('UNKNOWN' if not available or 'UNKNOWN' in (states.left,states.right) else 'CURRENT' if states.left==states.right=='CURRENT' else 'HISTORICAL')
                if not isinstance(selection,BatchSelection) and state=='CURRENT':
                    pair=tuple(sorted((saved.parameters.sample_a,saved.parameters.sample_b)))
                    if not connection.execute('INSERT OR IGNORE INTO current_pairs VALUES(?,?)',pair).rowcount:continue
                if request.relation is not None and saved.result.verification.relation!=request.relation:continue
                if request.confirmed_conflict is not None and saved.result.annotation.confirmed_conflict!=request.confirmed_conflict:continue
                if request.difference_type is not None and not any(difference.type==request.difference_type for difference in saved.result.annotation.differences):continue
                decisions=ConsistencyDecisionRepository(self.db).history(saved.result.evidence_id,connection,watermark=decision_watermark)
                corrections=ConsistencyDecisionRepository(self.db).corrections(saved.result.evidence_id,connection,watermark=correction_watermark)
                events={identity:event for decision in decisions for identity in decision.review_decision_ids
                    if (event:=ReviewRepository(self.db).get_event(identity,connection)) is not None}
                reviews=ReviewStates.project(saved,decisions,corrections,events)
                if (request.review_state is not None or request.correction_state is not None) and not any(
                        (request.review_state is None or review.review_state==request.review_state)
                        and (request.correction_state is None or review.correction_state==request.correction_state) for review in reviews):continue
                counts[state.lower()]+=1
                if not isinstance(selection,BatchSelection) and state!=selection.facts:continue
                statistics.add(saved,state,available,reviews)
                total+=1
                connection.execute('INSERT INTO selected_items VALUES(?,?,?,?,?)',(total,saved.result.evidence_id,state,states.model_dump_json(),available))
            snapshot=ResultSnapshot(query_id='query_'+uuid4().hex,query_hash=fingerprint,request=request.model_copy(update={'cursor':None}),
                scopes=scopes,observed_at=observed,expires_at=observed+self.TTL,facts=FactCounts(**counts),total=total,
                execution=coverage.execution,corpus=coverage.corpus,mode=coverage.mode,profile_id=coverage.profile_id,
                retrieval_completeness=coverage.retrieval_completeness,statistics=statistics.finish(),gold=gold)
            connection.commit()
            connection.execute('BEGIN IMMEDIATE')
            connection.execute('DELETE FROM consistency_queries WHERE expires_at<=?',(observed.isoformat(),))
            connection.execute('INSERT INTO consistency_queries VALUES(?,?,?)',(snapshot.query_id,snapshot.expires_at.isoformat(),snapshot.model_dump_json()))
            connection.execute('INSERT INTO consistency_query_items SELECT ?,position,evidence_id,facts_state,source_states_json,evidence_available FROM selected_items',(snapshot.query_id,))
        return snapshot
