import logging
from typing import List
import numpy as np

logger = logging.getLogger("iad_benchmark.candidates.diversity")


def apply_diversity_suppression(
    sorted_candidate_indices: List[int],
    embeddings: np.ndarray,
    top_k: int,
    diversity_threshold: float = 0.95,
) -> List[int]:
    """
    Greedy similarity suppression for candidate diversity.
    Iterates through candidate items ranked by score:
    If a candidate has cosine similarity > diversity_threshold to any already selected sample,
    it is suppressed to avoid redundant visual clustering in the review queue.
    """
    if not sorted_candidate_indices or top_k <= 0:
        return []

    selected: List[int] = []
    selected_embeddings: List[np.ndarray] = []

    for idx in sorted_candidate_indices:
        vec = embeddings[idx]  # L2 normalized [D]

        if not selected_embeddings:
            selected.append(idx)
            selected_embeddings.append(vec)
        else:
            # Vectorized dot product against all currently selected vectors
            selected_matrix = np.stack(selected_embeddings, axis=0)  # [M, D]
            sims = np.dot(selected_matrix, vec)
            max_sim = float(np.max(sims))

            if max_sim <= diversity_threshold:
                selected.append(idx)
                selected_embeddings.append(vec)

        if len(selected) >= top_k:
            break

    logger.info(
        f"Diversity suppression: selected {len(selected)} diverse candidates from {len(sorted_candidate_indices)} (threshold={diversity_threshold})"
    )
    return selected
