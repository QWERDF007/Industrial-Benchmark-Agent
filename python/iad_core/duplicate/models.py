from typing import Dict, List, TypeAlias

from pydantic import AwareDatetime, BaseModel, Field, JsonValue

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import CoverageCount, Digest, Identifier
from iad_core.duplicate.verification_models import NearComparisonConfig, VerificationResult

Pair: TypeAlias = tuple[str,str,float,dict[str,JsonValue] | None]


class PairObservation(AnalysisModel):
    sample_id_a: Identifier
    sample_id_b: Identifier
    image_sha256_a: Digest
    image_sha256_b: Digest
    verification: VerificationResult
    config: NearComparisonConfig
    checked_at: AwareDatetime


class DuplicateGroup(BaseModel):
    group_id: str
    size: int
    sample_ids: List[str]
    origin_counts: Dict[str, int]
    is_cross_origin: bool
    max_similarity: float
    min_similarity: float
    avg_similarity: float
    is_verified: bool = False
    representative_pairs: list[dict[str,JsonValue]] = Field(default_factory=list)


class DuplicateMiningResult(BaseModel):
    task_id: str
    similarity_threshold: float
    total_samples: int
    candidate_group_count: int
    candidate_sample_count: int
    candidate_cross_origin_group_count: int
    verified_group_count: int
    verified_sample_count: int
    verified_cross_origin_group_count: int
    cross_origin_pairs: Dict[str, int]
    verified_cross_origin_pairs: Dict[str, int]
    candidate_groups_json_path: str
    verified_groups_json_path: str
    verified_pairs_json_path: str
    near_pairs_json_path: str
    near_candidate_pair_count: int
    verification_requested: bool
    verification_failed_count: int
    corpus_coverage: CoverageCount
    report_md_path: str
    elapsed_seconds: float

    @property
    def group_count(self) -> int:
        return self.candidate_group_count

    @property
    def duplicate_sample_count(self) -> int:
        return self.candidate_sample_count

    @property
    def cross_origin_group_count(self) -> int:
        return self.candidate_cross_origin_group_count

    @property
    def groups_json_path(self) -> str:
        return self.candidate_groups_json_path

