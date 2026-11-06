import json
from typing import Any, Mapping, Sequence

from pydantic import ValidationError

from iad_core.consistency.group_analysis_contract import GroupAnalysisContract
from iad_core.consistency.group_analysis_models import GroupAnalysisBatch
from iad_core.storage.database import Database


class GroupBatchReuse:
    """Read qualified visual batches with identical frozen inputs and model policy."""

    def __init__(self, db: Database, request: Mapping[str, Any], run_id: str):
        self.db, self.request, self.run_id = db, request, run_id
        self.batches: dict[tuple[tuple[str, ...], str], GroupAnalysisBatch] | None = None

    def find(self, candidate_ids: Sequence[str], input_fingerprint: str) -> GroupAnalysisBatch | None:
        if self.batches is None:
            parameters = {key: self.request[key] for key in ('analysis_schema', 'group_fingerprint',
                'frozen_group_sha256', 'model_name', 'analysis_instruction', 'analysis_batch_size')}
            parameters.update(group_id=self.request['frozen_group']['group_id'], run_id=self.run_id)
            with self.db.connection() as connection:
                rows = connection.execute('''SELECT json_extract(payload_json,'$.request.model_profile') profile,
                    json_extract(payload_json,'$.group_analysis_batches') batches
                    FROM job_runs WHERE job_type='CONSISTENCY_ANALYSIS' AND deleted_at IS NULL
                    AND status IN ('COMPLETED','PARTIAL','FAILED','CANCELLED','INTERRUPTED') AND job_id<>:run_id
                    AND json_extract(payload_json,'$.request.frozen_group.group_id')=:group_id
                    AND json_extract(payload_json,'$.request.analysis_schema')=:analysis_schema
                    AND json_extract(payload_json,'$.request.group_fingerprint')=:group_fingerprint
                    AND json_extract(payload_json,'$.request.frozen_group_sha256')=:frozen_group_sha256
                    AND json_extract(payload_json,'$.request.model_name')=:model_name
                    AND json_extract(payload_json,'$.request.analysis_instruction')=:analysis_instruction
                    AND json_extract(payload_json,'$.request.analysis_batch_size')=:analysis_batch_size
                    AND json_type(payload_json,'$.group_analysis_batches')='array' ORDER BY id DESC''', parameters).fetchall()
            self.batches = {}
            for row in rows:
                if json.loads(row['profile']) != self.request['model_profile']:
                    continue
                for value in json.loads(row['batches']):
                    batch = GroupAnalysisBatch.model_validate(value)
                    try:
                        GroupAnalysisContract.validate_descriptions(batch.result)
                    except ValidationError:
                        continue
                    self.batches.setdefault((tuple(batch.candidate_ids), batch.input_fingerprint), batch)
        return self.batches.get((tuple(candidate_ids), input_fingerprint))
