import abc
import time
from typing import List, Optional, Tuple, Dict, Any
import numpy as np

from iad_core.storage.models import Sample
from iad_core.evaluation.contracts import PredictionRecord, EvaluationInvariantError


class BaselineProtocol:
    """Standard evaluation protocols (NV-06, NS-06)."""
    UNSUPERVISED_NORMAL = "UNSUPERVISED_NORMAL"
    PRETRAINED_INFERENCE = "PRETRAINED_INFERENCE"
    SUPERVISED = "SUPERVISED"


def validate_predictions(
    predictions: List[PredictionRecord],
    expected_samples: List[Sample],
    split_name: str,
) -> None:
    """
    Unified Prediction Contract Validator (NV-07, NS-07).
    Guarantees count equality, unique IDs, exact ID set match, correct split name,
    and finite real anomaly scores (rejects NaN, +Inf, -Inf).

    Raises:
        ValueError / EvaluationInvariantError on violation.
    """
    if len(predictions) != len(expected_samples):
        raise ValueError(
            f"Baseline prediction completeness invariant violated! Count mismatch for split '{split_name}': "
            f"expected {len(expected_samples)} predictions, got {len(predictions)}."
        )

    seen_ids = set()
    pred_ids = []
    for p in predictions:
        if p.sample_id in seen_ids:
            raise ValueError(
                f"Baseline prediction completeness invariant violated! Duplicate sample_id '{p.sample_id}' "
                f"found in '{split_name}' predictions."
            )
        seen_ids.add(p.sample_id)
        pred_ids.append(p.sample_id)

    expected_ids = {s.sample_id for s in expected_samples}
    if seen_ids != expected_ids:
        missing = expected_ids - seen_ids
        extra = seen_ids - expected_ids
        raise ValueError(
            f"Baseline prediction completeness invariant violated! ID mismatch for split '{split_name}': "
            f"missing={len(missing)} {list(missing)[:5]}, unexpected={len(extra)} {list(extra)[:5]}."
        )

    for p in predictions:
        if p.split_name != split_name:
            raise ValueError(
                f"Prediction split_name mismatch: sample '{p.sample_id}' expected '{split_name}', got '{p.split_name}'."
            )

        val = p.image_score
        if not isinstance(val, (int, float)) or not np.isfinite(val):
            raise ValueError(
                f"Baseline produced non-finite score ({val}) for sample '{p.sample_id}' in split '{split_name}'."
            )


class BaselineRunner(abc.ABC):
    """
    Abstract interface for all Anomaly Detection Baseline Runners (R603, NS-06).
    """

    implementation_name: str = "baseline"
    implementation_source: str = "internal"
    implementation_revision: Optional[str] = None
    protocol: str = BaselineProtocol.UNSUPERVISED_NORMAL
    runtime_config: Dict[str, Any] = {}

    def __init__(self, name: str, **kwargs):
        self.name = name
        self.config = kwargs
        self.runtime_config = dict(kwargs)
        self.runtime_config["protocol"] = getattr(self, "protocol", BaselineProtocol.UNSUPERVISED_NORMAL)

    @abc.abstractmethod
    def prepare(
        self,
        task_id: str,
        build_id: str,
        train_samples: List[Sample],
        **kwargs,
    ) -> None:
        """
        Prepare baseline model: train, fit memory bank, or load pretrained weights.
        For UNSUPERVISED_NORMAL protocol, train_samples contains ONLY normal/hard-normal samples.
        """
        pass

    @abc.abstractmethod
    def predict(
        self,
        samples: List[Sample],
        split_name: str,
        **kwargs,
    ) -> List[PredictionRecord]:
        """
        Run inference and return standard PredictionRecords.
        Split name must be accurately tagged ('val' or 'test').
        """
        pass

    def run(
        self,
        task_id: str,
        build_id: str,
        train_samples: List[Sample],
        val_samples: List[Sample],
        test_samples: List[Sample],
        **kwargs,
    ) -> Tuple[List[PredictionRecord], List[PredictionRecord]]:
        """
        End-to-end execution: prepare on train, predict on val, predict on test.
        Returns: (val_predictions, test_predictions)
        Enforces unified prediction validation (NV-07, NS-07).
        """
        self.prepare(task_id, build_id, train_samples, **kwargs)
        val_preds = self.predict(val_samples, split_name="val", **kwargs)
        validate_predictions(val_preds, val_samples, split_name="val")

        test_preds = self.predict(test_samples, split_name="test", **kwargs)
        validate_predictions(test_preds, test_samples, split_name="test")

        return val_preds, test_preds
