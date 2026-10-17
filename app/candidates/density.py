import logging
import numpy as np
import faiss

logger = logging.getLogger("iad_benchmark.candidates.density")


def compute_density_outlier_scores(
    embeddings: np.ndarray,
    k: int = 15,
) -> np.ndarray:
    """
    Compute local density outlier scores using KNN over embeddings.
    Outlier score = normalized mean cosine distance to K nearest neighbors.
    Higher score indicates lower local density (isolated/rare visual features).
    Explicitly filters self via indices[i] != i to handle duplicate embeddings safely.
    """
    n_samples, dim = embeddings.shape
    if n_samples <= 1:
        return np.zeros((n_samples,), dtype=np.float32)

    actual_k = min(k + 2, n_samples)
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    # Search top k+2 to ensure k valid neighbors after excluding self
    scores, indices = index.search(embeddings, actual_k)

    mean_dists = np.zeros(n_samples, dtype=np.float32)
    for i in range(n_samples):
        mask = (indices[i] != i) & (indices[i] >= 0)
        sims = scores[i][mask][:k]
        if len(sims) == 0:
            mean_dists[i] = 0.0
        else:
            cosine_dists = np.clip(1.0 - sims, 0.0, 2.0)
            mean_dists[i] = float(np.mean(cosine_dists))

    min_d = np.min(mean_dists)
    max_d = np.max(mean_dists)

    if max_d - min_d < 1e-6:
        return np.full((n_samples,), 0.5, dtype=np.float32)

    norm_scores = (mean_dists - min_d) / (max_d - min_d)
    return np.clip(norm_scores, 0.0, 1.0).astype(np.float32)
