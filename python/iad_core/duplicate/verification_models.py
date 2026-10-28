from typing import ClassVar, Literal

from pydantic import ConfigDict, Field, FiniteFloat, JsonValue, model_validator

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import Count, PixelComparison, Relation


class RegionPixelStatistics(AnalysisModel):
    MAX_REGIONS: ClassVar[int] = 1000
    status: Literal['COMPLETE','INCOMPATIBLE','UNAVAILABLE','UNSUPPORTED','NOT_OBSERVABLE']
    regions: list[tuple[int,int,int,int]]
    compared_pixels: Count = 0
    changed_pixels: Count | None = None
    max_abs_diff: Count | None = None
    reason: str | None = None

    @model_validator(mode='after')
    def truthful_statistics(self):
        if self.status=='COMPLETE':
            if not self.compared_pixels or self.changed_pixels is None or self.max_abs_diff is None:
                raise ValueError('Complete local statistics require observed pixels')
            if self.changed_pixels>self.compared_pixels or (self.changed_pixels==0)!=(self.max_abs_diff==0):
                raise ValueError('Local statistics must agree')
        elif self.compared_pixels or self.changed_pixels is not None or self.max_abs_diff is not None or not self.reason:
            raise ValueError('Unobserved local statistics must remain unknown with a reason')
        return self


class Registration(AnalysisModel):
    status: Literal['UNSUPPORTED'] = 'UNSUPPORTED'
    reason: str = 'Local feature registration is not enabled; thumbnail translation is not an original-coordinate transform'


class NearComparisonConfig(AnalysisModel):
    model_config=ConfigDict(extra='forbid',frozen=True)
    target_size: tuple[int,int] = (256,256)
    pixel_cosine_threshold: float = Field(default=.990,ge=-1,le=1,allow_inf_nan=False)
    ncc_threshold: float = Field(default=.980,ge=-1,le=1,allow_inf_nan=False)
    max_mean_abs_diff: float = Field(default=.0060,ge=0,le=1,allow_inf_nan=False)
    max_high_diff_ratio: float = Field(default=.0015,ge=0,le=1,allow_inf_nan=False)
    diff_pixel_threshold: float = Field(default=.08,ge=0,le=1,allow_inf_nan=False)
    enable_translation_search: bool = True

    @model_validator(mode='after')
    def bounded_thumbnail(self):
        if any(size<8 or size>1024 for size in self.target_size):
            raise ValueError('Thumbnail dimensions must be between 8 and 1024 pixels')
        return self


class NearVerification(AnalysisModel):
    verified: bool = Field(description='Configured pair acceptance; relation distinguishes original identity from a thumbnail-only near candidate')
    dino_cosine: FiniteFloat | None = None
    pixel_cosine: FiniteFloat | None = None
    ncc: FiniteFloat | None = None
    mean_abs_diff: FiniteFloat | None = None
    high_diff_ratio: FiniteFloat | None = None
    best_shift: tuple[int,int] | None = None
    details: dict[str,JsonValue] = Field(default_factory=dict)


class VerificationResult(NearVerification):
    relation: Relation
    pixel: PixelComparison
    local: RegionPixelStatistics | None = None
    registration: Registration = Field(default_factory=Registration)

    @model_validator(mode='after')
    def truthful_relation(self):
        if (self.relation=='EXACT')!=(self.pixel.exact_equal is True):
            raise ValueError('EXACT requires complete original-pixel identity')
        if (self.relation=='UNCHECKED')!=(self.pixel.exact_equal is None):
            raise ValueError('Unknown original comparison must remain unchecked')
        if self.verified!=(self.relation in ('EXACT','NEAR_CANDIDATE')):
            raise ValueError('Configured pair acceptance must agree with the relation')
        if self.pixel.exact_equal is None and any(value is not None for value in
                (self.pixel_cosine,self.ncc,self.mean_abs_diff,self.high_diff_ratio,self.best_shift)):
            raise ValueError('Unchecked thumbnail metrics must remain unknown')
        if self.local and self.local.status=='COMPLETE':
            if self.pixel.status!='COMPLETE' or self.local.compared_pixels>self.pixel.compared_pixels:
                raise ValueError('Observed local regions require compatible originals')
            if self.local.changed_pixels>self.pixel.changed_pixels or self.local.max_abs_diff>self.pixel.max_abs_diff:
                raise ValueError('Local differences cannot exceed full-image facts')
        return self
