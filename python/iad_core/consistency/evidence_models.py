from typing import Literal

from pydantic import AwareDatetime, Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.annotation_models import AnnotationComparison, AnnotationMatchingConfig
from iad_core.consistency.annotations import AnnotationSet
from iad_core.consistency.models import Count, Digest, Identifier, PixelDescriptor
from iad_core.duplicate.verification_models import NearComparisonConfig, VerificationResult
from iad_core.storage.models import ReviewDecisionRecord, Sample


class ConsistencyCompare(AnalysisModel):
    sample_a: Identifier
    sample_b: Identifier
    matching: AnnotationMatchingConfig = Field(default_factory=AnnotationMatchingConfig)
    near: NearComparisonConfig = Field(default_factory=NearComparisonConfig)


class ConsistencyEvidenceReference(AnalysisModel):
    evidence_id: Identifier


class ConsistencyEvidenceMediaReference(ConsistencyEvidenceReference):
    media_id: Identifier


class EvidenceBlob(AnalysisModel):
    sha256: Digest
    byte_count: Count


class FrozenEvidenceSource(AnalysisModel):
    sample: Sample
    annotations: AnnotationSet
    review: ReviewDecisionRecord | None
    source_sha256: Digest
    scan_ref: Identifier | None = None
    content_group_id: Identifier | None = None
    descriptor: PixelDescriptor
    image: EvidenceBlob
    masks: dict[str,EvidenceBlob] = Field(default_factory=dict)
    issues: list[str] = Field(default_factory=list)


class EvidenceSources(AnalysisModel):
    left: FrozenEvidenceSource
    right: FrozenEvidenceSource


class ConsistencyResult(AnalysisModel):
    result_id: Identifier
    evidence_id: Identifier
    verification: VerificationResult
    annotation: AnnotationComparison


class EvidenceMedia(AnalysisModel):
    media_id: Identifier
    side: Literal['left','right']
    representation: Literal['original','preview','annotation_overlay','annotation_mask','reference_overlay']
    bbox: tuple[int,int,int,int]
    difference_id: Identifier | None = None
    reference_from_other: Literal['left','right'] | None = None
    annotation_id: Identifier | None = None
    normalization: Literal['RAW','UINT8_DISPLAY','UINT16_FULL_RANGE_DISPLAY'] = 'RAW'
    available: bool = True
    reason: str | None = None


class FrozenEvidence(AnalysisModel):
    result: ConsistencyResult
    sources: EvidenceSources
    parameters: ConsistencyCompare
    algorithm_fingerprint: Digest
    checked_at: AwareDatetime
    media: list[EvidenceMedia]


SourceState = Literal['CURRENT','CHANGED','MISSING','UNKNOWN']


class EvidenceSourceStates(AnalysisModel):
    left: SourceState
    right: SourceState


class EvidenceBundle(FrozenEvidence):
    source_states: EvidenceSourceStates
