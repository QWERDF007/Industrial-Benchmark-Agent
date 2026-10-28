from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AuditConsistencyEvidenceReference, AnalysisModel
from iad_core.consistency.evidence_models import ConsistencyResult
from iad_core.consistency.errors import ConsistencyErrorCode
from iad_core.consistency.models import ConsistencyCoverage, Identifier, Mode


class AuditResultReference(AuditConsistencyEvidenceReference):
    sample_id: Identifier


class AuditConsistencyRecord(AnalysisModel):
    check_id: Identifier
    run_id: Identifier
    sample_id: Identifier
    scope_id: Identifier
    mode: Mode
    profile_id: Identifier | None = None
    status: Literal['COMPLETE', 'PARTIAL', 'FAILED']
    coverage: ConsistencyCoverage | None = None
    references: list[AuditResultReference] = Field(default_factory=list)
    error_code: ConsistencyErrorCode | None = None
    reason: str | None = None


class AuditConsistencyView(AuditConsistencyRecord):
    results: list[ConsistencyResult]
