from typing import Literal

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import Identifier
from iad_core.consistency.result_models import FactState
from iad_core.storage.models import Sample

GalleryKind = Literal['conflicts', 'groups']


class GalleryImage(AnalysisModel):
    sample: Sample
    evidence_id: Identifier
    side: Literal['left', 'right']
    available: bool

    @property
    def sample_id(self) -> str:
        return self.sample.sample_id


class GalleryComparison(AnalysisModel):
    evidence_id: Identifier
    result_id: Identifier
    anchor_side: Literal['left', 'right']


class GalleryMember(AnalysisModel):
    image: GalleryImage
    comparison: GalleryComparison | None


class FrozenAnalysisGroup(AnalysisModel):
    kind: GalleryKind
    group_id: Identifier
    facts_state: FactState
    anchor: GalleryImage
    members: list[GalleryMember]
