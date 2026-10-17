import logging
from typing import List, Dict, Optional
from collections import defaultdict
import numpy as np

logger = logging.getLogger("iad_core.candidate.domain")


def compute_domain_novelty_scores(
    embeddings: np.ndarray,
    domain_labels: List[Optional[str]],
) -> np.ndarray:
    """
    Compute domain novelty scores for candidates.
    Compares domain (e.g. production_date) centroid and sample embedding against global centroid.
    Normalized in [0, 1].
    """
    n_samples, dim = embeddings.shape
    if n_samples == 0:
        return np.empty((0,), dtype=np.float32)

    global_vec = np.mean(embeddings, axis=0)
    g_norm = np.linalg.norm(global_vec)
    if g_norm > 0:
        global_centroid = global_vec / g_norm
    else:
        global_centroid = global_vec

    domain_indices: Dict[str, List[int]] = defaultdict(list)
    for idx, d in enumerate(domain_labels):
        key = d or "unknown"
        domain_indices[key].append(idx)

    domain_novelty_map: Dict[str, float] = {}
    for d_name, idx_list in domain_indices.items():
        sub_vecs = embeddings[idx_list]
        d_mean = np.mean(sub_vecs, axis=0)
        d_norm = np.linalg.norm(d_mean)
        if d_norm > 0:
            d_centroid = d_mean / d_norm
            novelty = 1.0 - float(np.dot(d_centroid, global_centroid))
        else:
            novelty = 0.5
        domain_novelty_map[d_name] = max(0.0, novelty)

    sample_dots = np.dot(embeddings, global_centroid)
    sample_drifts = np.clip(1.0 - sample_dots, 0.0, 2.0)

    raw_scores = np.empty((n_samples,), dtype=np.float32)
    for idx in range(n_samples):
        key = domain_labels[idx] or "unknown"
        d_score = domain_novelty_map.get(key, 0.0)
        s_score = sample_drifts[idx]
        raw_scores[idx] = 0.5 * d_score + 0.5 * s_score

    min_s = float(np.min(raw_scores))
    max_s = float(np.max(raw_scores))

    if max_s - min_s < 1e-6:
        return np.full((n_samples,), 0.5, dtype=np.float32)

    norm_scores = (raw_scores - min_s) / (max_s - min_s)
    return np.clip(norm_scores, 0.0, 1.0).astype(np.float32)
