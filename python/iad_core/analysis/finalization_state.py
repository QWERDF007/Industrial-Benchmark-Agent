import json
from sqlite3 import Connection

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel, NonBlankText


class AnalysisDirectionReview(AnalysisModel):
    direction_ref: NonBlankText
    reason: NonBlankText


class AnalysisFinalizationProgress(AnalysisModel):
    base_revision: int | None = None
    reviewed_entry_ids: list[str] = Field(default_factory=list)
    pending_entry_ids: list[str] = Field(default_factory=list)
    direction_reviews: list[AnalysisDirectionReview] = Field(default_factory=list)
    complete: bool = False
    version_id: str | None = None

class AnalysisFinalizationState:
    @staticmethod
    def progress(connection: Connection, run_id: str, entry_ids: list[str]) -> AnalysisFinalizationProgress:
        row = connection.execute('SELECT * FROM analysis_finalizations WHERE job_id=?', (run_id,)).fetchone()
        reviewed = set(json.loads(row['reviewed_json'])) if row else set()
        return AnalysisFinalizationProgress(base_revision=row['base_revision'] if row else None,
            reviewed_entry_ids=[eid for eid in entry_ids if eid in reviewed], pending_entry_ids=[eid for eid in entry_ids if eid not in reviewed],
            direction_reviews=json.loads(row['direction_reviews_json']) if row else [],
            complete=bool(row['complete']) if row else False, version_id=row['version_id'] if row else None)
