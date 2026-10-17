import abc
import time
from typing import List, Optional, Tuple, Dict, Any

from iad_core.storage.models import Sample
from iad_core.evaluation.contracts import PredictionRecord


class BaselineRunner(abc.ABC):
    """
    Abstract interface for all Anomaly Detection Baseline Runners (R603).
    """

    implementation_name: str = "baseline"
    implementation_source: str = "internal"
    implementation_revision: Optional[str] = None
    runtime_config: Dict[str, Any] = {}

    def __init__(self, name: str, **kwargs):
        self.name = name
        self.config = kwargs
        self.runtime_config = dict(kwargs)

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
        Enforces Tickets F001, F002 (Fail-closed & prediction set completeness).
        """
        self.prepare(task_id, build_id, train_samples, **kwargs)
        val_preds = self.predict(val_samples, split_name="val", **kwargs)
        test_preds = self.predict(test_samples, split_name="test", **kwargs)

        # Integrity Check: Val
        val_input_ids = {s.sample_id for s in val_samples}
        val_output_ids = {p.sample_id for p in val_preds}
        if val_input_ids != val_output_ids:
            missing = val_input_ids - val_output_ids
            extra = val_output_ids - val_input_ids
            raise ValueError(
                f"Baseline '{self.name}' Val prediction completeness invariant violated! "
                f"Missing: {len(missing)}, Unexpected: {len(extra)}"
            )

        # Integrity Check: Test
        test_input_ids = {s.sample_id for s in test_samples}
        test_output_ids = {p.sample_id for p in test_preds}
        if test_input_ids != test_output_ids:
            missing = test_input_ids - test_output_ids
            extra = test_output_ids - test_input_ids
            raise ValueError(
                f"Baseline '{self.name}' Test prediction completeness invariant violated! "
                f"Missing: {len(missing)}, Unexpected: {len(extra)}"
            )

        # Score Invariant Check: Finite numbers
        for p in val_preds + test_preds:
            if not isinstance(p.image_score, (int, float)) or not (p.image_score == p.image_score):
                raise ValueError(
                    f"Baseline '{self.name}' produced non-finite score ({p.image_score}) for sample '{p.sample_id}'."
                )

        return val_preds, test_preds
