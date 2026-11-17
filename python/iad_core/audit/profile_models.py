from typing import Literal
from pydantic import AliasChoices, Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.benchmark.readiness import BenchmarkReadiness
from iad_core.split.leakage import LeakageReport


class AuditQuantiles(AnalysisModel):
    minimum: float
    q25: float
    median: float
    q75: float
    maximum: float


class AuditGeometryProfile(AnalysisModel):
    annotation_count: int = Field(validation_alias=AliasChoices('annotation_count', 'box_count'))
    invalid_annotation_count: int = 0
    geometry_types: dict[str, int] = Field(default_factory=dict)
    annotated_images: int
    instance_distribution: dict[str,int]
    relative_area: AuditQuantiles | None
    relative_width: AuditQuantiles | None
    relative_height: AuditQuantiles | None
    aspect_ratio: AuditQuantiles | None
    center_x: AuditQuantiles | None
    center_y: AuditQuantiles | None


class AuditMetadataCoverage(AnalysisModel):
    covered_images: int
    distinct_count: int | None
    distribution: dict[str,int]


class AuditBenchmarkSource(AnalysisModel):
    build_id: str
    source_image_count: int
    covered_images: int
    source_matches_scope: bool
    split_distribution: dict[str,int]
    confirmed_gold_images: int
    pixel_gold_images: int
    leakage: LeakageReport
    readiness: BenchmarkReadiness
    source_hashes: dict[str,str]


class AuditDatasetProfile(AnalysisModel):
    total_images: int
    dataset_format: Literal['labelme','folder_classification']
    registered_quality: dict[str,int]
    geometry: AuditGeometryProfile | None
    metadata: dict[str,AuditMetadataCoverage]
    strict_duplicate_members: list[list[str]] | None = None
    near_candidate_members: list[list[str]] = Field(default_factory=list)
    strict_duplicate_groups: int | None
    strict_duplicate_images: int | None
    near_candidate_pairs: int
    benchmark: AuditBenchmarkSource | None
    contrast_measurement: None = None
