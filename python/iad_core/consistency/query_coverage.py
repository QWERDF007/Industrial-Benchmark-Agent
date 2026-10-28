import json
from dataclasses import dataclass
from pathlib import Path
from sqlite3 import Connection

from iad_core.consistency.batch_repository import BatchRepository
from iad_core.consistency.job_models import BatchPlan
from iad_core.consistency.models import ConsistencyScopesSnapshot,CoverageCount,Mode
from iad_core.consistency.result_models import BatchSelection,ExecutionCompleteness,ResultSelection
from iad_core.feature.profiles import ImageEncoders
from iad_core.storage.database import Database
from iad_core.workbench.job_snapshots import JobSnapshots


@dataclass(frozen=True)
class QueryCoverage:
    execution: CoverageCount
    corpus: CoverageCount
    mode: Mode | None
    profile_id: str | None
    retrieval_completeness: ExecutionCompleteness

    @classmethod
    def capture(cls,db: Database,selection: ResultSelection,scopes: ConsistencyScopesSnapshot,connection: Connection) -> 'QueryCoverage':
        batches=BatchRepository(db);reader=JobSnapshots(db)
        if isinstance(selection,BatchSelection):
            plan,_=batches.get(selection.batch_id,connection)
            plans=[plan]
            mode=plan.request.mode if plan.kind=='consistency' else None
            profile=plan.encoder.profile.profile_id if plan.encoder else None
            targets=scopes.subjects.samples
        else:
            mode=selection.mode
            profile=ImageEncoders(db).profile(selection.profile_id).profile_id if mode!='exact' else None
            plans=(BatchPlan.model_validate_json(row[0]) for row in connection.execute('''SELECT plan_json FROM consistency_runs
                WHERE json_extract(plan_json,'$.kind')='consistency' AND json_extract(plan_json,'$.scopes.corpus.scope_id')=?''',(scopes.corpus.scope_id,)))
            targets=scopes.subjects.samples
        desired={sample.sample_id:sample for sample in targets}
        scans={scan.dataset_id:scan.scan_ref for scan in scopes.subjects.scans}
        identities={sample.sample_id for sample in (*scopes.subjects.samples,*scopes.corpus.samples)}
        rows=connection.execute('''SELECT s.sample_id,s.image_path,p.file_size,p.mtime_ns,
            json_extract(p.descriptor_json,'$.decode_status') decode_status,f.status feature_status,f.error_code
            FROM samples s LEFT JOIN sample_pixel_index p ON p.sample_id=s.sample_id
            LEFT JOIN feature_records f ON f.content_group_id=p.content_group_id AND f.profile_id=? AND f.view_key='full'
            WHERE s.sample_id IN (SELECT value FROM json_each(?))''',(profile,json.dumps(list(identities)))).fetchall()
        clean=set();raw={};vectors={}
        for row in rows:
            state=row['decode_status'] or 'PENDING'
            try:
                stat=Path(row['image_path']).stat()
                if state=='COMPLETE' and (stat.st_size,stat.st_mtime_ns)!=(row['file_size'],row['mtime_ns']):state='PENDING'
            except OSError:state='UNAVAILABLE'
            if state=='COMPLETE':clean.add(row['sample_id'])
            raw[row['sample_id']]=state
            vectors[row['sample_id']]=state if state!='COMPLETE' else ('COMPLETE' if row['feature_status']=='COMPLETE'
                else 'UNSUPPORTED' if row['error_code']=='UNSUPPORTED_IMAGE' else 'UNAVAILABLE' if row['feature_status']=='FAILED' else 'PENDING')
        completed=set();failed=set();unsupported=set()
        for plan in plans:
            if not isinstance(selection,BatchSelection):
                allowed={'exact','combined'} if mode=='exact' else {'visual','combined'} if mode=='visual' else {'combined'}
                if plan.request.mode not in allowed or (profile is not None and (plan.encoder is None or plan.encoder.profile.profile_id!=profile)):continue
                old_scans={scan.dataset_id:scan.scan_ref for scan in plan.scopes.subjects.scans}
                valid={sample.sample_id for sample in plan.scopes.subjects.samples if desired.get(sample.sample_id)==sample and old_scans.get(sample.dataset_id)==scans.get(sample.dataset_id)}
            else:valid=set(desired)
            children=[reader.snapshot(identity,connection=connection) for identity in batches.children(plan.batch_id,connection).values()]
            partition=plan.partition(children)
            completed.update(partition.completed & valid & (clean if not isinstance(selection,BatchSelection) else valid))
            failed.update(partition.failed & valid)
            unsupported.update(partition.unsupported & valid)
        failed-=completed;unsupported&=failed
        execution=CoverageCount(total=len(desired),completed=len(completed),failed=len(failed-unsupported),unsupported=len(unsupported),pending=len(set(desired)-completed-failed))
        values=raw if mode=='exact' else vectors
        corpus_states=[values.get(sample.sample_id,'PENDING') for sample in scopes.corpus.samples]
        corpus=CoverageCount(total=len(corpus_states),completed=corpus_states.count('COMPLETE'),failed=corpus_states.count('UNAVAILABLE'),
            unsupported=corpus_states.count('UNSUPPORTED'),pending=corpus_states.count('PENDING'))
        complete=execution.total>0 and execution.completed==execution.total and corpus.completed==corpus.total
        kind='INDEX_ONLY' if mode is None else 'PARTIAL' if not complete else 'EXACT_SCOPE' if mode=='exact' else 'TOP_K'
        return cls(execution,corpus,mode,profile,kind)
