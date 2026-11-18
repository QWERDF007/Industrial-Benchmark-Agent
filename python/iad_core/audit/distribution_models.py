from typing import Literal

from pydantic import AliasChoices, Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.audit.profile_models import AuditQuantiles
from iad_core.dataset.heatmap import DistributionHeatmap


class AuditDistributionQuery(AnalysisModel):
    dataset_id: str | None = None
    category: str | None = None


class AuditDistributionToolQuery(AuditDistributionQuery):
    scoring: bool = False

class AuditClassCount(AnalysisModel):
    category: str
    image_count: int
    annotation_count: int | None = Field(validation_alias=AliasChoices('annotation_count', 'box_count'))


class AuditHistogram(AnalysisModel):
    edges: list[float]
    counts: list[int]
    density: list[tuple[float, float]]


class AuditBoxSummary(AuditQuantiles):
    count: int
    lower_whisker: float
    upper_whisker: float
    outliers: list[tuple[float, int]]


class AuditCategoryBox(AnalysisModel):
    category: str
    statistics: AuditBoxSummary


class AuditDistributionSlice(AuditDistributionQuery):
    image_count: int
    annotation_count: int | None = Field(validation_alias=AliasChoices('annotation_count', 'box_count'))
    invalid_annotation_count: int = Field(validation_alias=AliasChoices('invalid_annotation_count', 'invalid_box_count'))
    geometry_types: dict[str, int] = Field(default_factory=dict)
    unannotated_images: int
    classes: list[AuditClassCount]
    instance_counts: dict[str, int]
    datasets: dict[str, int]
    quality: dict[str, int]
    metadata: dict[str, dict[str, int]]
    heatmaps: dict[str, DistributionHeatmap]
    histograms: dict[str, AuditHistogram]
    summaries: dict[str, AuditBoxSummary]
    area_by_category: list[AuditCategoryBox]


class AuditDataDistribution(AnalysisModel):
    dataset_format: Literal['labelme', 'folder_classification']
    datasets: list[str]
    categories: list[str]
    slices: list[AuditDistributionSlice] = Field(min_length=1)
    category_area_samples: dict[str, dict[str, list[float]]] = Field(default_factory=dict)
