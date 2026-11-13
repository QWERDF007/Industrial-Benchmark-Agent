from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.audit.profile_models import AuditQuantiles


class AuditDistributionQuery(AnalysisModel):
    dataset_id: str | None = None
    category: str | None = None


class AuditHeatmap(AnalysisModel):
    x_edges: list[float]
    y_edges: list[float]
    cells: list[tuple[int, int, int]]


class AuditClassCount(AnalysisModel):
    category: str
    image_count: int
    box_count: int | None


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
    box_count: int | None
    invalid_box_count: int
    unannotated_images: int
    classes: list[AuditClassCount]
    instance_counts: dict[str, int]
    datasets: dict[str, int]
    quality: dict[str, int]
    metadata: dict[str, dict[str, int]]
    heatmaps: dict[str, AuditHeatmap]
    histograms: dict[str, AuditHistogram]
    summaries: dict[str, AuditBoxSummary]
    area_by_category: list[AuditCategoryBox]


class AuditDataDistribution(AnalysisModel):
    dataset_format: Literal['labelme', 'folder_classification']
    datasets: list[str]
    categories: list[str]
    slices: list[AuditDistributionSlice] = Field(min_length=1)
