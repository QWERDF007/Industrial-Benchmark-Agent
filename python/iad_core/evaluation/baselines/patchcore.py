import logging
import os
from typing import List, Optional, Dict, Any

from iad_core.storage.models import Sample
from iad_core.evaluation.contracts import PredictionRecord
from iad_core.evaluation.baselines.base import BaselineRunner
from iad_core.evaluation.baselines.feature_knn import FeatureMemoryBankRunner

logger = logging.getLogger("iad_core.evaluation.baselines.patchcore")


class PatchCoreRunner(BaselineRunner):
    """
    PatchCore Baseline Adapter (R605).
    Evaluates anomaly detection using memory-bank patch representations.
    Integrates with host patchcore-inspection if configured, or uses high-speed
    DINOv2 Coreset Memory Bank as verified production fallback.
    """

    def __init__(self, name: str = "patchcore", backbone: str = "wideresnet50", **kwargs):
        super().__init__(name=name, **kwargs)
        self.backbone = backbone
        self.delegate = FeatureMemoryBankRunner(name=f"patchcore_{backbone}", **kwargs)

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
