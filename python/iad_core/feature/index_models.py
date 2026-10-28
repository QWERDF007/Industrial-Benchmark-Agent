from dataclasses import dataclass

from pydantic import ConfigDict, Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import CoverageCount


class IndexLimits(AnalysisModel):
    model_config=ConfigDict(frozen=True,extra='forbid',strict=True)
    max_resident_bytes: int = Field(default=256*1024**2,ge=1)
    max_build_bytes: int = Field(default=128*1024**2,ge=1)
    max_entries: int = Field(default=8,ge=1)
    query_batch_size: int = Field(default=128,ge=1,le=256)
    max_neighbors: int = Field(default=256,ge=1,le=1024)
    cpu_threads: int = Field(default=2,ge=1,le=2)


class CorpusIndexInfo(AnalysisModel):
    model_config=ConfigDict(frozen=True,extra='forbid')
    scope_id: str
    range_id: str
    profile_id: str
    signature: str
    generation: str
    vector_count: int
    member_count: int
    dim: int
    vector_bytes: int
    resident_bytes: int
    coverage: CoverageCount
    index_path: str


class IndexStats(AnalysisModel):
    builds: int = 0
    disk_loads: int = 0
    invalid_artifacts: int = 0
    build_failures: int = 0
    cache_hits: int = 0
    evictions: int = 0
    queries: int = 0
    search_batches: int = 0
    query_seconds: float = 0
    resident_bytes: int = 0
    reserved_bytes: int = 0
    reserved_build_bytes: int = 0
    cache_entries: int = 0
    pinned_entries: int = 0


@dataclass(frozen=True)
class GroupHit:
    group_id: str
    score: float
    rank: int
