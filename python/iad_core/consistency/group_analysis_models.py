from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.gallery import GalleryReference, GalleryImage, GalleryMember
from iad_core.consistency.models import Identifier
from iad_core.consistency.result_models import FactState
from iad_core.workbench.job_models import JobStatus


class GroupAnalysisStart(GalleryReference):
    request_id: Identifier


class GroupAnalysisComparison(AnalysisModel):
    result_id: Identifier
    evidence_id: Identifier
    difference_id: Identifier | None = None


class GroupAnalysisReference(AnalysisModel):
    candidate_id: Identifier
    comparison: GroupAnalysisComparison | None = None


class GroupAnalysisConclusion(AnalysisModel):
    text: str = Field(min_length=1, max_length=8000)
    references: list[GroupAnalysisReference] = Field(min_length=1, max_length=100)


class GroupAnalysisDraft(AnalysisModel):
    conclusions: list[GroupAnalysisConclusion] = Field(min_length=1, max_length=100)
    limitations: list[str] = Field(default_factory=list, max_length=100)


class FrozenAnalysisGroup(AnalysisModel):
    kind: Literal['conflicts','groups']
    group_id: Identifier
    facts_state: FactState
    anchor: GalleryImage
    members: list[GalleryMember]


class GroupAnalysisView(AnalysisModel):
    group_id: Identifier
    status: JobStatus | Literal['NOT_ANALYZED']
    run_id: Identifier | None = None
    model_name: str | None = None
    result: GroupAnalysisDraft | None = None
    error: str | None = None
    candidate_offsets: dict[str,int] = Field(default_factory=dict)
