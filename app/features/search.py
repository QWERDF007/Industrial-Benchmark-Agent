import os
import logging
from typing import Optional, List, Dict, Any
import numpy as np
import faiss
from pydantic import BaseModel

from app.storage.database import Database
from app.storage.repositories import FeatureRepository, SampleRepository
from app.features.index import load_faiss_index

logger = logging.getLogger("iad_benchmark.features.search")


class SearchResult(BaseModel):
    rank: int
    sample_id: str
    score: float
    image_path: str
    relative_path: str
    quality_status: str
    data_origin: str
    batch_id: Optional[str] = None


def search_by_sample(
    sample_id: str,
    task_id: str,
    top_k: int = 20,
    exclude_self: bool = True,
    index_dir: Optional[str] = None,
    db_path: str = "data/benchmark.db",
    filter_data_origin: Optional[str] = None,
    filter_quality_status: Optional[str] = None,
) -> List[SearchResult]:
    """
    Perform visual search in FAISS index given a query sample_id.
    """
    idx_dir = index_dir or os.path.join("runs", "features", task_id)
    index, sample_ids, metadata = load_faiss_index(idx_dir)

    model_id = metadata.get("model_id", "dinov2_vitb14_reg")
    preprocess_key = metadata.get("preprocess_key", "dinov2_224_norm")

    # Fetch query vector
    db = Database(db_path)
    feat_repo = FeatureRepository(db)
    query_record = feat_repo.get(sample_id, model_id, preprocess_key)
    if not query_record:
        raise ValueError(
            f"Query sample '{sample_id}' not found in feature cache for model '{model_id}' and preprocess '{preprocess_key}'"
        )

    np_dtype = np.float16 if query_record.dtype == "fp16" else np.float32
    query_vec = np.frombuffer(query_record.embedding_blob, dtype=np_dtype).astype(np.float32)
    query_vec = np.expand_dims(query_vec, axis=0)
    faiss.normalize_L2(query_vec)

    # Search top candidates (request more to account for self and filters)
    fetch_k = min(len(sample_ids), top_k + 50 if (exclude_self or filter_data_origin or filter_quality_status) else top_k)
    scores, indices = index.search(query_vec, fetch_k)

    scores = scores[0]
    indices = indices[0]

    # Batch lookup sample metadata from SQLite
    sample_repo = SampleRepository(db)
    candidate_ids = [sample_ids[idx] for idx in indices if 0 <= idx < len(sample_ids)]
    samples_map = {s.sample_id: s for s in sample_repo.get_many(candidate_ids)}

    results: List[SearchResult] = []
    current_rank = 1

    for score, idx in zip(scores, indices):
        if idx < 0 or idx >= len(sample_ids):
            continue
        cand_id = sample_ids[idx]

        if exclude_self and cand_id == sample_id:
            continue

        sample_obj = samples_map.get(cand_id)
        if not sample_obj:
            continue

        if filter_data_origin and sample_obj.data_origin.value != filter_data_origin:
            continue

        if filter_quality_status and sample_obj.quality_status.value != filter_quality_status:
            continue

        results.append(
            SearchResult(
                rank=current_rank,
                sample_id=cand_id,
                score=round(float(score), 4),
                image_path=sample_obj.image_path,
                relative_path=sample_obj.relative_path,
                quality_status=sample_obj.quality_status.value,
                data_origin=sample_obj.data_origin.value,
                batch_id=sample_obj.batch_id,
            )
        )
        current_rank += 1
        if len(results) >= top_k:
            break

    return results
