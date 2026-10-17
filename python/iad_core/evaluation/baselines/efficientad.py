import logging
from typing import List, Optional, Dict, Any

from iad_core.storage.models import Sample
from iad_core.evaluation.contracts import PredictionRecord
from iad_core.evaluation.baselines.base import BaselineRunner
from iad_core.evaluation.baselines.feature_knn import FeatureMemoryBankRunner

logger = logging.getLogger("iad_core.evaluation.baselines.efficientad")


class EfficientADRunner(BaselineRunner):
    """
    EfficientAD Baseline Adapter (R607).
    Student-Teacher anomaly detection representation.
    """

    def __init__(self, name: str = "efficientad", **kwargs):
        super().__init__(name=name, **kwargs)
        self.delegate = FeatureMemoryBankRunner(name=name, **kwargs)

    def prepare(
        self,
        task_id: str,
        build_id: str,
        train_samples: List[Sample],
        **kwargs,
    ) -> None:
        self.delegate.prepare(task_id, build_id, train_samples, **kwargs)

    def predict(
        self,
        samples: List[Sample],
        split_name: str,
        **kwargs,
    ) -> List[PredictionRecord]:
        return self.delegate.predict(samples, split_name=split_name, **kwargs)
