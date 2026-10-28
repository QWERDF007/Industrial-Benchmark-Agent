from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import Digest, Identifier
from iad_core.feature.profiles import EmbeddingProfile


BenchmarkStratum = Literal['original', 'exact', 'lossless', 'jpeg', 'resize', 'brightness',
    'crop', 'rotation', 'controlled_micro_defect', 'real_micro_defect', 'other_instance', 'repeated_texture']


class BenchmarkImage(AnalysisModel):
    item_id: Identifier
    dataset: Identifier
    relative_path: Identifier
    sha256: Digest
    source_group: Identifier
    split: Literal['tuning', 'acceptance']
    stratum: BenchmarkStratum


class BenchmarkQuery(AnalysisModel):
    query_id: Identifier
    relevant_ids: list[Identifier] = Field(min_length=1)
    strict_ids: list[Identifier]
    hard_negative_ids: list[Identifier]
    verification: Literal['controlled_transforms', 'human_confirmed', 'unverified']


class BenchmarkSource(AnalysisModel):
    sample_id: Identifier
    image_path: Path
    sha256: Digest


class RetrievalBenchmark(AnalysisModel):
    version: Literal[1] = 1
    origin: Literal['industrial', 'synthetic']
    datasets: dict[str, Path]
    corpus: list[Identifier] = Field(min_length=1)
    items: list[BenchmarkImage] = Field(min_length=1)
    queries: list[BenchmarkQuery] = Field(min_length=1)
    profiles: dict[str, EmbeddingProfile]
    sources: dict[str, BenchmarkSource] = Field(default_factory=dict)

    @model_validator(mode='after')
    def coherent(self):
        items = {item.item_id: item for item in self.items}
        if len(items) != len(self.items) or len({query.query_id for query in self.queries}) != len(self.queries):
            raise ValueError('Benchmark IDs must be distinct')
        if len({(item.dataset, item.relative_path) for item in self.items}) != len(self.items):
            raise ValueError('One benchmark item must identify each image path')
        if not set(self.corpus).issubset(self.datasets) or any(item.dataset not in self.datasets for item in self.items):
            raise ValueError('Every image and corpus must belong to a declared dataset')
        source_splits = {}
        for item in self.items:
            if source_splits.setdefault(item.source_group, item.split) != item.split:
                raise ValueError('A source group cannot enter both tuning and acceptance splits')
        for query in self.queries:
            references = [*query.relevant_ids, *query.hard_negative_ids]
            if query.query_id not in items or not set(references).issubset(items):
                raise ValueError('Query relationships must reference declared items')
            if len(set(references)) != len(references) or query.query_id in references:
                raise ValueError('Positive and negative references must be distinct from the query')
            if not set(query.strict_ids).issubset(query.relevant_ids):
                raise ValueError('Strict copies must be declared positive references')
            if any(items[identity].dataset not in self.corpus for identity in references):
                raise ValueError('Query references must belong to the retrieval corpus')
            original = items[query.query_id]
            if any(items[identity].source_group != original.source_group for identity in query.relevant_ids):
                raise ValueError('Positive copy references require the same source group')
        return self
