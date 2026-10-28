import logging
from typing import List, Tuple, Optional, Set
import numpy as np

from iad_core.storage.database import Database
from iad_core.feature.profiles import ImageEncoders
from iad_core.storage.repositories import FeatureRepository

logger = logging.getLogger("iad_core.candidate.reference")

MIN_RECOMMENDED_REFERENCES = 30


def get_normal_reference_set(
    task_id: str,
    db: Database,
    profile_id: Optional[str] = None,
    include_raw_pass: bool = True,
    include_review_pass: bool = True,
    include_hard_normal: bool = False,
    return_breakdown: bool = False,
):
    """
    Retrieve reference normal samples and their feature embeddings.
    Derived dynamically from confirmed PASS samples and review decisions (including Hard Normal feedback loop).
    """
    selection=ImageEncoders(db).read().selection
    dim=ImageEncoders(db).profile(profile_id).dim if profile_id else selection.profile.dim if selection else 0
    raw_pass_ids: Set[str] = set()
    review_pass_ids: Set[str] = set()
    hard_normal_ids: Set[str] = set()

    with db.connection() as conn:
        cursor = conn.cursor()
        if include_raw_pass:
            cursor.execute(
                "SELECT sample_id FROM samples WHERE task_id = ? AND quality_status = 'PASS'",
                (task_id,),
            )
            for row in cursor.fetchall():
                raw_pass_ids.add(row[0])

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='review_decisions'")
        if cursor.fetchone():
            if include_review_pass:
                cursor.execute(
                    """
                    SELECT r.sample_id 
                    FROM current_review_decisions r
                    JOIN samples s ON r.sample_id = s.sample_id
                    WHERE s.task_id = ? AND r.decision = 'PASS'
                    """,
                    (task_id,),
                )
                for row in cursor.fetchall():
                    review_pass_ids.add(row[0])

            if include_hard_normal:
                cursor.execute(
                    """
                    SELECT r.sample_id 
                    FROM current_review_decisions r
                    JOIN samples s ON r.sample_id = s.sample_id
                    WHERE s.task_id = ? AND r.decision = 'HARD_NORMAL'
                    """,
                    (task_id,),
                )
                for row in cursor.fetchall():
                    hard_normal_ids.add(row[0])

    normal_sample_ids = raw_pass_ids | review_pass_ids | hard_normal_ids
    ref_ids = sorted(normal_sample_ids)
    is_low_reference = len(ref_ids) < MIN_RECOMMENDED_REFERENCES

    if is_low_reference:
        logger.warning(
            f"Low reference coverage for task {task_id}: only {len(ref_ids)} confirmed normal references available (recommended >= {MIN_RECOMMENDED_REFERENCES})."
        )

    empty_breakdown = {"raw_pass": 0, "review_pass": 0, "hard_normal": 0, "total": 0}
    if not ref_ids:
        if return_breakdown:
            return [], np.empty((0, dim), dtype=np.float32), True, empty_breakdown
        return [], np.empty((0, dim), dtype=np.float32), True

    feat_repo = FeatureRepository(db)
    vectors = []
    valid_ids = []

    for s_id in ref_ids:
        rec = feat_repo.get_for_sample(s_id, profile_id)
        if rec:
            np_dtype = np.float16 if rec["dtype"] == "float16" else np.float32
            v = np.frombuffer(rec["embedding_blob"], dtype=np_dtype).astype(np.float32)
            norm = np.linalg.norm(v)
            if norm > 0:
                v = v / norm
            vectors.append(v)
            valid_ids.append(s_id)

    valid_id_set = set(valid_ids)
    breakdown = {
        "raw_pass": len(raw_pass_ids & valid_id_set),
        "review_pass": len(review_pass_ids & valid_id_set),
        "hard_normal": len(hard_normal_ids & valid_id_set),
        "total": len(valid_ids),
    }

    if not vectors:
        if return_breakdown:
            return [], np.empty((0, dim), dtype=np.float32), True, breakdown
        return [], np.empty((0, dim), dtype=np.float32), True

    ref_embeddings = np.stack(vectors, axis=0)
    if return_breakdown:
        return valid_ids, ref_embeddings, is_low_reference, breakdown
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
        return np.full((query_embeddings.shape[0],), 0.5, dtype=np.float32)

    sims = np.dot(query_embeddings, reference_embeddings.T)
    max_sims = np.max(sims, axis=1)
    dists = 1.0 - max_sims
    return np.clip(dists, 0.0, 1.0).astype(np.float32)
