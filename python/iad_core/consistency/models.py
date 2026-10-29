from typing import Annotated, Literal, Optional, Union

from pydantic import AwareDatetime, Field, FiniteFloat, StringConstraints, model_validator

from iad_core.advisory.analysis import AnalysisModel
from iad_core.storage.models import QualityStatus
from iad_core.workbench.query import SampleFilters
from iad_core.consistency.policy import PolicyRelation, AnnotationRole, AnnotationCoverage


Identifier = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Digest = Annotated[str, StringConstraints(pattern=r'^[a-f0-9]{64}$')]
Count = Annotated[int, Field(ge=0, strict=True)]
Mode = Literal['exact', 'visual', 'combined']
Relation = Literal['EXACT', 'NEAR_CANDIDATE', 'VISUAL_REFERENCE', 'DIFFERENT', 'UNCHECKED']
DifferenceType = Literal['QUALITY_LABEL', 'CATEGORY', 'ONE_SIDED_REGION', 'GEOMETRY',
    'SPLIT_MERGE', 'AMBIGUOUS_MATCH', 'POLICY_UNCONFIRMED', 'ANNOTATION_UNREADABLE']


class AllRegisteredScope(AnalysisModel):
    kind: Literal['all_registered'] = 'all_registered'


class DatasetScope(AnalysisModel):
    kind: Literal['datasets'] = 'datasets'
    dataset_ids: list[Identifier] = Field(min_length=1)

    @model_validator(mode='after')
    def distinct_datasets(self):
        if len(set(self.dataset_ids)) != len(self.dataset_ids):
            raise ValueError('Dataset references must be distinct')
        return self


class SampleScope(AnalysisModel):
    kind: Literal['samples'] = 'samples'
    sample_ids: list[Identifier] = Field(min_length=1)

    @model_validator(mode='after')
    def distinct_samples(self):
        if len(set(self.sample_ids)) != len(self.sample_ids):
            raise ValueError('Sample references must be distinct')
        return self


class FilteredScope(AnalysisModel):
    kind: Literal['filtered'] = 'filtered'
    dataset_id: Identifier
    filters: SampleFilters = Field(default_factory=SampleFilters)


CorpusScope = Annotated[Union[AllRegisteredScope, DatasetScope], Field(discriminator='kind')]
ScopeSelector = Annotated[Union[AllRegisteredScope, DatasetScope, SampleScope, FilteredScope], Field(discriminator='kind')]


class FrozenSample(AnalysisModel):
    sample_id: Identifier
    dataset_id: Identifier
    task_id: Identifier
    source_fingerprint: Optional[str]
    quality_status: QualityStatus
    quality_source: Optional[str]


class ScanReference(AnalysisModel):
    dataset_id: Identifier
    scan_ref: Identifier


class ScopeSummary(AnalysisModel):
    scope_id: Identifier
    dataset_ids: list[Identifier]
    frozen_at: AwareDatetime
    sample_count: Count


class FrozenScope(ScopeSummary):
    selector: ScopeSelector
    samples: list[FrozenSample]
    scans: list[ScanReference]

    @model_validator(mode='after')
    def complete_membership(self):
        if self.sample_count != len(self.samples) or len({sample.sample_id for sample in self.samples}) != self.sample_count:
            raise ValueError('Frozen sample count must match distinct members')
        datasets = set(self.dataset_ids)
        if len(datasets) != len(self.dataset_ids) or {scan.dataset_id for scan in self.scans} != datasets:
            raise ValueError('Frozen datasets must have matching scan references')
        if any(sample.dataset_id not in datasets for sample in self.samples):
            raise ValueError('Frozen samples must belong to the declared datasets')
        return self


class ConsistencyScopesSummary(AnalysisModel):
    subjects: ScopeSummary
    corpus: ScopeSummary


class ConsistencyScopesSnapshot(ConsistencyScopesSummary):
    subjects: FrozenScope
    corpus: FrozenScope


class SampleImageQuery(AnalysisModel):
    kind: Literal['sample'] = 'sample'
    sample_id: Identifier


class TemporaryImageQuery(AnalysisModel):
    kind: Literal['temporary'] = 'temporary'
    image_ref: Identifier


ImageQuery = Annotated[Union[SampleImageQuery, TemporaryImageQuery], Field(discriminator='kind')]


class ConsistencyStart(AnalysisModel):
    subjects: ScopeSelector
    corpus_scope: CorpusScope = Field(default_factory=AllRegisteredScope)
    mode: Mode = 'exact'
    profile_id: Optional[Identifier] = None
    request_id: Identifier


class ImageRetrieve(AnalysisModel):
    query: ImageQuery
    corpus_scope: CorpusScope = Field(default_factory=AllRegisteredScope)
    mode: Mode = 'combined'
    profile_id: Optional[Identifier] = None
    top_k: int = Field(default=50, ge=1, le=200, strict=True)
    cursor: Optional[Identifier] = None


class ImageIndexPrepare(AnalysisModel):
    corpus_scope: CorpusScope = Field(default_factory=AllRegisteredScope)
    profile_id: Optional[Identifier] = None
    request_id: Identifier


class CoverageCount(AnalysisModel):
    total: Count
    completed: Count = 0
    failed: Count = 0
    unsupported: Count = 0
    pending: Count = 0

    @model_validator(mode='after')
    def partition(self):
        if self.completed + self.failed + self.unsupported + self.pending != self.total:
            raise ValueError('Coverage states must partition the requested total')
        return self


class ConsistencyCoverage(AnalysisModel):
    corpus: CoverageCount
    verification: CoverageCount
    annotation: CoverageCount


class PixelDescriptor(AnalysisModel):
    compare_profile: Literal['raw-decoded-v1'] = 'raw-decoded-v1'
    width: Optional[Count] = None
    height: Optional[Count] = None
    channel_semantics: Optional[Literal['L', 'LA', 'RGB', 'RGBA']] = None
    dtype: Optional[Literal['uint8', 'uint16']] = None
    bit_depth: Optional[Literal[8, 16]] = None
    pixel_key: Optional[Identifier] = None
    decode_status: Literal['COMPLETE', 'UNAVAILABLE', 'UNSUPPORTED']
    reason: Optional[str] = None
    annotation_coordinates: Literal['RAW', 'EXIF_AMBIGUOUS'] = 'RAW'


class PixelComparison(AnalysisModel):
    status: Literal['COMPLETE', 'INCOMPATIBLE', 'UNAVAILABLE', 'UNSUPPORTED', 'PENDING']
    compare_profile: Literal['raw-decoded-v1'] = 'raw-decoded-v1'
    exact_equal: Optional[bool] = None
    compared_pixels: Count = 0
    changed_pixels: Optional[Count] = None
    max_abs_diff: Optional[Count] = None
    reason: Optional[str] = None

    @model_validator(mode='after')
    def truthful_comparison(self):
        if self.status == 'COMPLETE':
            if self.compared_pixels == 0 or self.changed_pixels is None or self.max_abs_diff is None:
                raise ValueError('Complete comparisons require actual pixel statistics')
            if self.changed_pixels > self.compared_pixels:
                raise ValueError('Changed pixels cannot exceed compared pixels')
            if self.exact_equal is not (self.changed_pixels == 0) or (self.max_abs_diff == 0) != self.exact_equal:
                raise ValueError('Exact equality must agree with pixel statistics')
        else:
            if self.compared_pixels or self.changed_pixels is not None or self.max_abs_diff is not None:
                raise ValueError('Unavailable statistics must remain unknown')
            if self.status == 'INCOMPATIBLE':
                if self.exact_equal is not False:
                    raise ValueError('Incompatible pixel representations are not equal')
            elif self.exact_equal is not None:
                raise ValueError('Unchecked equality must remain unknown')
            if self.status != 'PENDING' and not self.reason:
                raise ValueError('Unavailable comparisons require a reason')
        return self


class RetrievalCandidate(AnalysisModel):
    sample_id: Identifier
    content_group_id: Identifier
    retrieval_branch: Literal['exact', 'visual']
    rank: int = Field(ge=1, strict=True)
    score: Optional[FiniteFloat] = None
    profile_id: Optional[Identifier] = None
    relation: Relation
    evidence_id: Optional[Identifier] = None

GalleryDifferenceKind = Literal['category','geometry','presence','instances','quality','multiple']
GalleryFilterKind = Literal['all','category','geometry','presence','instances','quality','multiple']
