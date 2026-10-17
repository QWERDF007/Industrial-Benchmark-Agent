import os
import logging
from typing import Optional, List, Dict, Any, Set
from collections import defaultdict
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
    physical_sample_id: Optional[str] = None
    phenomenon_summary: Optional[str] = None


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
    Implements Progressive Over-Fetch (F04) to avoid missing sparse classes.
    """
    idx_dir = index_dir or os.path.join("runs", "features", task_id)
    index, sample_ids, metadata = load_faiss_index(idx_dir)

    total_samples = len(sample_ids)
    if total_samples == 0:
        return []

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

    # Progressive Over-Fetch Tiers
    needs_filter = bool(filter_data_origin or filter_quality_status)
    if not needs_filter:
        fetch_tiers = [min(total_samples, top_k + (1 if exclude_self else 0))]
    else:
        fetch_tiers = [
            min(total_samples, max(64, top_k)),
            min(total_samples, max(256, top_k * 4)),
            min(total_samples, max(1024, top_k * 16)),
            total_samples,
        ]
        # De-duplicate tiers keeping order
        seen_tiers = set()
        dedup_tiers = []
        for t in fetch_tiers:
            if t not in seen_tiers:
                seen_tiers.add(t)
                dedup_tiers.append(t)
        fetch_tiers = dedup_tiers

    sample_repo = SampleRepository(db)
    results: List[SearchResult] = []
    already_evaluated_indices: Set[int] = set()

    for fetch_k in fetch_tiers:
        scores, indices = index.search(query_vec, fetch_k)
        scores = scores[0]
        indices = indices[0]

        # Find new candidate indices not yet checked
        new_indices = []
        new_scores = []
        for s, idx in zip(scores, indices):
            if idx >= 0 and idx < total_samples and idx not in already_evaluated_indices:
                new_indices.append(idx)
                new_scores.append(s)
                already_evaluated_indices.add(idx)

        if not new_indices:
            continue

        cand_ids = [sample_ids[idx] for idx in new_indices]
        samples_map = {s.sample_id: s for s in sample_repo.get_many(cand_ids)}

        # Fetch phenomenon summaries for these candidate samples
        phenomenon_map: Dict[str, str] = defaultdict(str)
        if cand_ids:
            with db.connection() as conn:
                cursor = conn.cursor()
                placeholders = ",".join("?" for _ in cand_ids)
                cursor.execute(
                    f"""
                    SELECT sample_id, phenomenon, COUNT(*) 
                    FROM annotations 
                    WHERE sample_id IN ({placeholders}) 
                    GROUP BY sample_id, phenomenon
                    """,
                    cand_ids,
                )
                phenom_counts: Dict[str, List[str]] = defaultdict(list)
                for s_id, phenom, cnt in cursor.fetchall():
                    tag = phenom or "unspecified"
                    phenom_counts[s_id].append(f"{tag}({cnt})")
                for s_id, tags in phenom_counts.items():
                    phenomenon_map[s_id] = ", ".join(tags)

        for score, idx in zip(new_scores, new_indices):
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
                    rank=len(results) + 1,
                    sample_id=cand_id,
                    score=round(float(score), 4),
                    image_path=sample_obj.image_path,
                    relative_path=sample_obj.relative_path,
                    quality_status=sample_obj.quality_status.value,
                    data_origin=sample_obj.data_origin.value,
                    batch_id=sample_obj.batch_id,
                    physical_sample_id=sample_obj.physical_sample_id,
                    phenomenon_summary=phenomenon_map.get(cand_id),
                )
            )

            if len(results) >= top_k:
                break

        if len(results) >= top_k:
            break

    return results[:top_k]
