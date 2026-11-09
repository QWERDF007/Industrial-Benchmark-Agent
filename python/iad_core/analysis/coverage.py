import json
from contextlib import nullcontext
from sqlite3 import Connection

from iad_core.analysis.models import (AnalysisCoverage, AnalysisObservationRecord, AnalysisRecordCoverage,
    AnalysisWorkflowSnapshot, AnalysisObservationQuery, AnalysisObservationHistoryPage)
from iad_core.evidence.registrations import PreparedRegistration


class AnalysisCoverageReader:
    def __init__(self, db):
        self.db = db

    def observations(self, run_id: str, round_id: int | None = None, revision: int | None = None) -> list[AnalysisObservationRecord]:
        with self.db.connection() as connection:
            rows = connection.execute('''SELECT observation_id,round_id,revision,observation_json FROM analysis_sample_observations
                WHERE job_id=? AND (? IS NULL OR round_id=?) AND (? IS NULL OR revision<=?)
                ORDER BY revision,rowid''', (run_id,round_id,round_id,revision,revision)).fetchall()
        return [AnalysisObservationRecord(**json.loads(row['observation_json']),observation_id=row['observation_id'],
            round_id=row['round_id'],revision=row['revision']) for row in rows]

    def history(self, run_id: str, query: AnalysisObservationQuery, revision: int) -> AnalysisObservationHistoryPage:
        records = [item for item in self.observations(run_id,round_id=query.round_id,revision=revision)
            if (query.sample_id is None or item.sample_id == query.sample_id)
            and (query.direction_ref is None or any(direction.direction_ref == query.direction_ref for direction in item.directions))]
        start = (query.page-1)*query.page_size
        return AnalysisObservationHistoryPage(job_id=run_id,revision=revision,total=len(records),
            page=query.page,page_size=query.page_size,items=records[start:start+query.page_size])

    def read(self, run_id: str, connection: Connection | None = None) -> AnalysisCoverage:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            if connection is None:
                conn.execute('BEGIN')
            row = conn.execute('''SELECT r.snapshot_json,j.payload_json FROM analysis_workflow_runs r
                JOIN job_runs j ON j.job_id=r.job_id WHERE r.job_id=?''', (run_id,)).fetchone()
            if row is None:
                raise LookupError('原生分析作业不存在')
            snapshot = AnalysisWorkflowSnapshot.model_validate_json(row['snapshot_json'])
            payload = json.loads(row['payload_json'])
            completed, failed = set(payload['completed_sample_ids']), set(payload['failed_sample_ids'])
            media = {value.sample_id:value for item in conn.execute('SELECT media_json FROM analysis_sample_media WHERE job_id=?', (run_id,))
                for value in [PreparedRegistration.model_validate_json(item[0])]}
            observed = {}
            for item in conn.execute('SELECT sample_id,observation_json FROM analysis_sample_observations WHERE job_id=?', (run_id,)):
                observed.setdefault(item['sample_id'],set()).update(json.loads(item['observation_json'])['evidence_ids'])
        records = [AnalysisRecordCoverage(dataset_id=record.sample.dataset_id,sample_id=record.sample.sample_id,
            state='completed' if record.sample.sample_id in completed else 'failed' if record.sample.sample_id in failed else 'unprocessed',
            required_media=[image.image for image in media[record.sample.sample_id].images if image.required] if record.sample.sample_id in media else [],
            supplemental_media=[image.image for image in media[record.sample.sample_id].images if not image.required] if record.sample.sample_id in media else [],
            observed_evidence_ids=sorted(observed.get(record.sample.sample_id,set())),
            source_error=media[record.sample.sample_id].error if record.sample.sample_id in media else None) for record in snapshot.manifest.records]
        return AnalysisCoverage(total=len(records),completed=len(completed),failed=len(failed),unprocessed=len(records)-len(completed)-len(failed),
            records=records,prepared_visuals=sum(len(record.media) for record in records),
            whole_images_observed=sum(any(image.role=='overview' and image.evidence_id in record.observed_evidence_ids
                for image in record.required_media) for record in records),observed_visuals=sum(len(record.observed_evidence_ids) for record in records))
