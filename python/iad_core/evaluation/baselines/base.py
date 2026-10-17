import abc
import time
from typing import List, Optional, Tuple, Dict, Any

from iad_core.storage.models import Sample
from iad_core.evaluation.contracts import PredictionRecord


class BaselineRunner(abc.ABC):
    """
    Abstract interface for all Anomaly Detection Baseline Runners (R603).
    """

    def __init__(self, name: str, **kwargs):
        self.name = name
        self.config = kwargs

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
        """
        self.prepare(task_id, build_id, train_samples, **kwargs)
        val_preds = self.predict(val_samples, split_name="val", **kwargs)
        test_preds = self.predict(test_samples, split_name="test", **kwargs)
        return val_preds, test_preds
