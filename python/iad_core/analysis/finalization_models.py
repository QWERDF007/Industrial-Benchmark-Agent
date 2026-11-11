from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.analysis.argument_models import AnalysisKeyEvidence
from iad_core.analysis.finalization_state import AnalysisDirectionReview, AnalysisFinalizationProgress
from iad_core.analysis.models import (AnalysisCatalogUpdate, AnalysisCoverageSummary, FrozenAnalysisDirection,
    CATALOG_EDITS_DESCRIPTION, KNOWLEDGE_EDITS_DESCRIPTION, ProposedAnalysisDirection, ProposedAnalysisCheck)


class FinalizedAnalysisDirection(ProposedAnalysisDirection):
    key_evidence: list[AnalysisKeyEvidence] = Field(min_length=1, max_length=4)


class FinalizedAnalysisCheck(ProposedAnalysisCheck):
    key_evidence: list[AnalysisKeyEvidence] = Field(min_length=1, max_length=4)


class AnalysisFinalize(AnalysisCatalogUpdate):
    complete: bool = Field(default=False, description='全部条目已复核后，最后提交作业全局摘要并设为true。')


class ExplorationFinalize(AnalysisFinalize):
    directions: list[FinalizedAnalysisDirection] = Field(description=CATALOG_EDITS_DESCRIPTION)


class KnowledgeFinalize(AnalysisFinalize):
    checks: list[FinalizedAnalysisCheck] = Field(description=KNOWLEDGE_EDITS_DESCRIPTION)
    direction_reviews: list[AnalysisDirectionReview] = Field(default_factory=list,
        description='逐selected_directions.ref说明实际产出或零产出的原因；不能填新生成的知识check_id，最终提交前必须全部核对。')


class AnalysisFinalizationEntry(AnalysisModel):
    entry_id: str
    title: str
    dataset_ids: list[str]
    direction_refs: list[str]
    predecessor_ids: list[str]
    argument_count: int
    issues: list[str]


class AnalysisDirectionCoverage(AnalysisModel):
    direction_ref: str
    applicable: int
    not_applicable: int
    uncertain: int
    failed: int
    entry_ids: list[str]


class AnalysisFinalizationContext(AnalysisFinalizationProgress):
    phase: Literal['finalize'] = 'finalize'
    job_id: str
    session_id: str
    revision: int
    coverage: AnalysisCoverageSummary
    entries: list[AnalysisFinalizationEntry]
    selected_directions: list[FrozenAnalysisDirection]
    directions: list[AnalysisDirectionCoverage]
    summary: str
    limitations: list[str]
    unresolved_questions: list[str]


class AnalysisFinalizationReceipt(AnalysisFinalizationProgress):
    commit_key: str
    revision: int
