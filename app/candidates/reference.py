import logging
from typing import List, Tuple, Optional, Set
import numpy as np

from app.storage.database import Database
from app.storage.repositories import FeatureRepository

logger = logging.getLogger("iad_benchmark.candidates.reference")

MIN_RECOMMENDED_REFERENCES = 30


def get_normal_reference_set(
    task_id: str,
    db: Database,
    model_id: str = "dinov2_vitb14_reg",
    preprocess_key: str = "dinov2_224_norm",
    include_hard_normal: bool = False,
) -> Tuple[List[str], np.ndarray, bool]:
    """
    Retrieve reference normal samples and their feature embeddings.
    Derived dynamically from confirmed PASS samples and review decisions.
    
    Returns:
        (reference_sample_ids, reference_embeddings [M, D], is_low_reference)
    """
    normal_sample_ids: Set[str] = set()

    with db.connection() as conn:
        cursor = conn.cursor()
        # 1. Samples with quality_status == 'PASS'
        cursor.execute(
            "SELECT sample_id FROM samples WHERE task_id = ? AND quality_status = 'PASS'",
            (task_id,),
        )
        for row in cursor.fetchall():
            normal_sample_ids.add(row[0])

        # 2. Check review_decisions table if it exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='review_decisions'")
        if cursor.fetchone():
            decisions = ("PASS", "HARD_NORMAL") if include_hard_normal else ("PASS",)
            placeholders = ",".join("?" for _ in decisions)
            cursor.execute(
                f"""
                SELECT r.sample_id 
                FROM review_decisions r
                JOIN samples s ON r.sample_id = s.sample_id
                WHERE s.task_id = ? AND r.decision IN ({placeholders})
                """,
                (task_id, *decisions),
            )
            for row in cursor.fetchall():
                normal_sample_ids.add(row[0])

    ref_ids = sorted(normal_sample_ids)
    is_low_reference = len(ref_ids) < MIN_RECOMMENDED_REFERENCES

    if is_low_reference:
        logger.warning(
            f"Low reference coverage for task {task_id}: only {len(ref_ids)} confirmed normal references available (recommended >= {MIN_RECOMMENDED_REFERENCES})."
        )

    if not ref_ids:
        return [], np.empty((0, 768), dtype=np.float32), True

    feat_repo = FeatureRepository(db)
    vectors = []
    valid_ids = []

    for s_id in ref_ids:
        rec = feat_repo.get(s_id, model_id, preprocess_key)
        if rec:
            np_dtype = np.float16 if rec.dtype == "fp16" else np.float32
            v = np.frombuffer(rec.embedding_blob, dtype=np_dtype).astype(np.float32)
            norm = np.linalg.norm(v)
            if norm > 0:
                v = v / norm
            vectors.append(v)
            valid_ids.append(s_id)

    if not vectors:
        return [], np.empty((0, 768), dtype=np.float32), True

    ref_embeddings = np.stack(vectors, axis=0)
    return valid_ids, ref_embeddings, is_low_reference


def compute_normal_distance(
    query_embeddings: np.ndarray,
    reference_embeddings: np.ndarray,
) -> np.ndarray:
    """
    Compute normal distance: 1 - max_cosine(query, reference_set).
    Output normalized in [0, 1].
    """
    if query_embeddings.shape[0] == 0:
        return np.empty((0,), dtype=np.float32)

    if reference_embeddings.shape[0] == 0:
        # No normal references available: assign uniform neutral distance 0.5
        return np.full((query_embeddings.shape[0],), 0.5, dtype=np.float32)

    # Cosine similarities: query_embeddings [N, D] x reference_embeddings.T [D, M] -> [N, M]
    sims = np.dot(query_embeddings, reference_embeddings.T)
    max_sims = np.max(sims, axis=1)
    dists = 1.0 - max_sims
    return np.clip(dists, 0.0, 1.0).astype(np.float32)
