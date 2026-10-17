import numpy as np
from app.candidates.schemas import CandidateScoringWeights


def aggregate_candidate_scores(
    normal_distance: np.ndarray,
    density_outlier: np.ndarray,
    domain_novelty: np.ndarray,
    annotation_signal: np.ndarray,
    weights: CandidateScoringWeights,
) -> np.ndarray:
    """
    Weighted linear combination of the candidate mining feature signals.
    Output bounded in [0, 1].
    """
    w = weights.normalized()

    composite = (
        w.normal_distance * normal_distance
        + w.density_outlier * density_outlier
        + w.domain_novelty * domain_novelty
        + w.annotation_signal * annotation_signal
    )
    return np.clip(composite, 0.0, 1.0).astype(np.float32)
