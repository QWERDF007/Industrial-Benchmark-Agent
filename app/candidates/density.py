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
    """
    n_samples, dim = embeddings.shape
    if n_samples <= 1:
        return np.zeros((n_samples,), dtype=np.float32)

    actual_k = min(k + 1, n_samples)
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    # Search top k+1 (includes self at distance ~ 1.0)
    scores, indices = index.search(embeddings, actual_k)

    # Distances to neighbors (excluding self at index 0)
    # Cosine distance = 1.0 - cosine similarity
    neighbor_sims = scores[:, 1:]
    cosine_dists = np.clip(1.0 - neighbor_sims, 0.0, 2.0)

    mean_dists = np.mean(cosine_dists, axis=1)

    min_d = np.min(mean_dists)
    max_d = np.max(mean_dists)

    if max_d - min_d < 1e-6:
        return np.full((n_samples,), 0.5, dtype=np.float32)

    norm_scores = (mean_dists - min_d) / (max_d - min_d)
    return np.clip(norm_scores, 0.0, 1.0).astype(np.float32)
