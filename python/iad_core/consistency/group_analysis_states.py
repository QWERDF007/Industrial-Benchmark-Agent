import json
from collections.abc import Iterable

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.group_models import GalleryKind, GroupAnalysisIdentity
from iad_core.consistency.models import ModelAssessmentState, ModelAssessmentVerdict
from iad_core.consistency.result_models import BatchSelection, FactState, ResultSelection
from iad_core.storage.database import Database
from iad_core.workbench.job_models import JobStatus


class GroupAnalysisRecord(AnalysisModel):
    run_id: str
    status: JobStatus
    verdict: ModelAssessmentVerdict | None

    @property
    def model_state(self) -> ModelAssessmentState:
        if self.status == 'COMPLETED':
            if self.verdict is None:
                raise ValueError('已完成图组缺少冻结模型结论')
            return self.verdict
        return 'RUNNING' if self.status in ('RUNNING','PENDING') else 'FAILED'


class GroupAnalysisStates:
    """Resolve gallery cards and details against the selected job and frozen facts."""

    def __init__(self, db: Database):
        self.db = db

    def read(self, selection: ResultSelection, identities: Iterable[GroupAnalysisIdentity]
             ) -> dict[tuple[GalleryKind,str,FactState],GroupAnalysisRecord]:
        facts = list(identities)
        if not facts:
            return {}
        grouped = {}
        for identity in facts:
            grouped.setdefault((identity.kind,identity.group_id),[]).append(identity)
        with self.db.connection() as connection:
            owner = connection.execute('''SELECT json_extract(payload_json,'$.root_run_id') root
                FROM job_runs WHERE job_type='ANALYSIS_WORKFLOW'
                    AND json_extract(payload_json,'$.program_batch_id')=? ORDER BY id DESC LIMIT 1''',
                (selection.batch_id,)).fetchone() if isinstance(selection,BatchSelection) else None
            if owner:
                clause = "json_extract(payload_json,'$.request.analysis_request_id')=wanted.value"
                args = [json.dumps(sorted({owner['root']+'_gallery_'+identity.group_id for identity in facts}))]
            else:
                clause = "json_extract(payload_json,'$.request.frozen_group.group_id')=wanted.value"
                args = [json.dumps(sorted({identity.group_id for identity in facts}))]
                if isinstance(selection,BatchSelection):
                    clause += " AND json_extract(payload_json,'$.request.analysis_selection.kind')='batch' AND json_extract(payload_json,'$.request.analysis_selection.batch_id')=?"
                    args.append(selection.batch_id)
            rows = connection.execute('''SELECT job_id,status,
                json_extract(payload_json,'$.request.frozen_group.kind') kind,
                json_extract(payload_json,'$.request.frozen_group.group_id') group_id,
                json_extract(payload_json,'$.request.frozen_group.facts_state') facts_state,
                json_extract(payload_json,'$.request.group_fingerprint') fingerprint,
                json_extract(payload_json,'$.request.analysis_schema') schema,
                json_extract(payload_json,'$.group_analysis.overall.verdict') verdict
                FROM json_each(?) wanted CROSS JOIN job_runs WHERE job_type='CONSISTENCY_ANALYSIS' AND deleted_at IS NULL AND '''+clause+' ORDER BY job_runs.id DESC',args).fetchall()
        selected = {}
        for row in rows:
            for identity in grouped.get((row['kind'],row['group_id']),[]):
                if identity.key not in selected and identity.fingerprint(row['schema'],facts_state=row['facts_state']) == row['fingerprint']:
                    selected[identity.key] = GroupAnalysisRecord(run_id=row['job_id'],status=row['status'],verdict=row['verdict'])
        return selected
