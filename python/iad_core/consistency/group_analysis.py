import json

from iad_core.consistency.gallery import GalleryQueries, GalleryReference
from iad_core.consistency.group_analysis_states import GroupAnalysisStates
from iad_core.consistency.group_analysis_models import GroupAnalysisDraft, GroupAnalysisView
from iad_core.storage.database import Database


class GroupAnalysisQueries:
    def __init__(self, db: Database):
        self.db = db

    def read(self, reference: GalleryReference) -> GroupAnalysisView:
        frozen = GalleryQueries(self.db).freeze(reference)
        record = GroupAnalysisStates(self.db).read(frozen.selection,[frozen.identity]).get(frozen.identity.key)
        if record is None:
            return GroupAnalysisView(group_id=reference.group_id, status='NOT_ANALYZED')
        with self.db.connection() as connection:
            row = connection.execute('SELECT * FROM job_runs WHERE job_id=?',(record.run_id,)).fetchone()
        return self.view(row)

    @staticmethod
    def view(row) -> GroupAnalysisView:
        payload = json.loads(row['payload_json'])
        result = GroupAnalysisDraft.model_validate(payload['group_analysis']) if row['status'] == 'COMPLETED' else None
        return GroupAnalysisView(completed_batches=payload.get('completed_batches',0), total_batches=payload.get('total_batches'), group_id=payload['request']['frozen_group']['group_id'], status=row['status'], run_id=row['job_id'],
            model_name=payload['request']['model_name'], result=result,
            error=(payload['errors'][0]['message'] if payload['errors'] else row['message']) if row['status'] in ('FAILED','PARTIAL','CANCELLED','INTERRUPTED') else None)
