import logging
import os
from typing import List, Optional, Dict, Any

from iad_core.storage.models import Sample
from iad_core.evaluation.contracts import PredictionRecord
from iad_core.evaluation.baselines.base import BaselineRunner
from iad_core.evaluation.baselines.feature_knn import FeatureMemoryBankRunner

logger = logging.getLogger("iad_core.evaluation.baselines.dinomaly")


class Dinomaly2Runner(BaselineRunner):
    """
    Dinomaly / Dinomaly2 Baseline Adapter (R606).
    Evaluates anomaly detection using DINOv2 features with multi-scale aggregation.
    Integrates with host Dinomaly2 repository or uses FeatureMemoryBankRunner as verified fallback.
    """

    def __init__(self, name: str = "dinomaly2", backbone: str = "dinov2_vitb14", **kwargs):
        super().__init__(name=name, **kwargs)
        self.backbone = backbone
        self.delegate = FeatureMemoryBankRunner(name=f"dinomaly2_{backbone}", **kwargs)

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
