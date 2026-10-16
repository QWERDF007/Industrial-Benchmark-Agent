from app.features.base import FeatureExtractor
from app.features.dino import DINOFeatureExtractor, MockFeatureExtractor
from app.features.builder import build_features, get_feature_stats, FeatureBuildResult
from app.features.index import build_faiss_index, load_faiss_index, IndexBuildResult
from app.features.search import search_by_sample, SearchResult
from app.features.duplicate import (
    mine_near_duplicates,
    DuplicateGroup,
    DuplicateMiningResult,
)

__all__ = [
    "FeatureExtractor",
    "DINOFeatureExtractor",
    "MockFeatureExtractor",
    "build_features",
    "get_feature_stats",
    "FeatureBuildResult",
    "build_faiss_index",
    "load_faiss_index",
    "IndexBuildResult",
    "search_by_sample",
    "SearchResult",
    "mine_near_duplicates",
    "DuplicateGroup",
    "DuplicateMiningResult",
]
