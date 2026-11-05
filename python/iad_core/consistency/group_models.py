import hashlib
import json
from dataclasses import dataclass

from typing import Literal

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import Identifier
from iad_core.consistency.result_models import FactState, ResultSelection
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


@dataclass(frozen=True)
class GroupAnalysisIdentity:
    kind: GalleryKind
    group_id: str
    facts_state: FactState
    anchor: GalleryImage
    evidence_ids: tuple[str, ...]

    @property
    def key(self) -> tuple[GalleryKind, str, FactState]:
        return self.kind, self.group_id, self.facts_state

    def fingerprint(self, schema: str, *, facts_state: FactState | None = None) -> str:
        return hashlib.sha256(json.dumps({'schema':schema,
            'group':{'kind':self.kind,'group_id':self.group_id,'facts_state':facts_state or self.facts_state},
            'anchor':{'evidence_id':self.anchor.evidence_id,'side':self.anchor.side},
            'evidence_ids':sorted(set(self.evidence_ids))},sort_keys=True).encode()).hexdigest()


@dataclass(frozen=True)
class FrozenGalleryGroup:
    group: FrozenAnalysisGroup
    identity: GroupAnalysisIdentity
    selection: ResultSelection
