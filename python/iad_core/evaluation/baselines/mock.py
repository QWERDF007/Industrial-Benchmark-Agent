import random
import time
from typing import List, Optional, Dict, Any

from iad_core.storage.models import Sample
from iad_core.evaluation.contracts import PredictionRecord
from iad_core.evaluation.baselines.base import BaselineRunner


class MockBaselineRunner(BaselineRunner):
    """
    Deterministic mock baseline runner for unit testing and fast integration tests.
    Assigns higher anomaly scores to samples with 'fail' / 'anomaly' in quality_status or labels.
    """

    def __init__(self, name: str = "mock_baseline", seed: int = 42, **kwargs):
        super().__init__(name=name, **kwargs)
        self.seed = seed
        self.prepared = False

    def prepare(
        self,
        task_id: str,
        build_id: str,
        train_samples: List[Sample],
        **kwargs,
    ) -> None:
        self.prepared = True

    def predict(
        self,
        samples: List[Sample],
        split_name: str,
        **kwargs,
    ) -> List[PredictionRecord]:
        rng = random.Random(self.seed + (0 if split_name == "val" else 100))
        preds = []
        for s in samples:
            # Baseline heuristic: if quality_status is FAIL, score is around 0.8~0.95
            # if PASS, score is around 0.05~0.25
            # if HARD_NORMAL, score is around 0.35~0.55
            qs = (s.quality_status or "PASS").upper()
            if "FAIL" in qs:
                base = 0.80 + rng.uniform(0.0, 0.15)
            elif "HARD" in qs:
                base = 0.40 + rng.uniform(0.0, 0.15)
            else:
                base = 0.10 + rng.uniform(0.0, 0.15)

            preds.append(
                PredictionRecord(
                    sample_id=s.sample_id,
                    image_score=float(base),
                    pixel_score_path=None,
                    latency_ms=rng.uniform(10.0, 25.0),
                    split_name=split_name,
                )
            )
        return preds
