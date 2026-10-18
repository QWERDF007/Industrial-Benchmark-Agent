import time
import logging
from typing import List, Optional, Dict, Any
import numpy as np

from iad_core.storage.database import Database
from iad_core.storage.models import Sample
from iad_core.storage.repositories import FeatureRepository
from iad_core.evaluation.contracts import PredictionRecord
from iad_core.evaluation.baselines.base import BaselineRunner, BaselineProtocol, validate_predictions
from iad_core.feature.dino import DINOFeatureExtractor

logger = logging.getLogger("iad_core.evaluation.baselines.feature_knn")


class FeatureMemoryBankRunner(BaselineRunner):
    """
    Standard DINOv2 Feature Memory Bank / Nearest-Neighbor Anomaly Baseline.
    Builds a normal feature memory bank from training normals and scores test samples
    by distance (1.0 - max_cosine_similarity) to the normal distribution.
    Zero-training, high-speed, 100% reproducible.
    """

    implementation_name: str = "feature_knn_dinov2"
    implementation_source: str = "facebookresearch/dinov2"
    implementation_revision: Optional[str] = "dinov2_vitb14_reg"
    protocol: str = BaselineProtocol.UNSUPERVISED_NORMAL

    def __init__(
        self,
        name: str = "feature_knn_dinov2",
        model_id: str = "dinov2_vitb14_reg",
        preprocess_key: str = "dinov2_224_norm",
        db_path: str = "data/benchmark.db",
        **kwargs,
    ):
        super().__init__(name=name, **kwargs)
        self.model_id = model_id
        self.preprocess_key = preprocess_key
        self.implementation_name = name
        self.runtime_config = {
            "model_id": model_id,
            "preprocess_key": preprocess_key,
            **kwargs,
        }
        self.db = Database(db_path)
        self.feat_repo = FeatureRepository(self.db)
        self.extractor: Optional[DINOFeatureExtractor] = None
        self.normal_bank: Optional[np.ndarray] = None

    def _get_features(self, samples: List[Sample]) -> np.ndarray:
        if not samples:
            return np.empty((0, 768), dtype=np.float32)

        features = []
        missing_samples = []
        missing_indices = []

        for idx, s in enumerate(samples):
            rec = self.feat_repo.get(s.sample_id, self.model_id, self.preprocess_key)
            if rec and rec.get("embedding_blob"):
                dtype = np.float16 if rec.get("dtype") == "fp16" else np.float32
                arr = np.frombuffer(rec["embedding_blob"], dtype=dtype).astype(np.float32)
                features.append(arr)
            else:
                features.append(None)
                missing_samples.append(s)
                missing_indices.append(idx)

        if missing_samples:
            if self.extractor is None:
                self.extractor = DINOFeatureExtractor(
                    model_id=self.model_id,
                    preprocess_key=self.preprocess_key,
                )
            paths = [s.image_path for s in missing_samples]
            try:
                extracted = self.extractor.encode_batch(paths)
                for i, arr in enumerate(extracted):
                    orig_idx = missing_indices[i]
                    features[orig_idx] = arr.astype(np.float32)
            except Exception as e:
                logger.error(f"Could not extract DINO features for {len(missing_samples)} samples: {e}")
                raise RuntimeError(
                    f"DINO visual feature extraction failed for {len(missing_samples)} samples: {e}"
                )

        matrix = np.stack(features, axis=0)
        # Normalize rows to unit vectors
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms = np.maximum(norms, 1e-8)
        return matrix / norms

    def prepare(
        self,
        task_id: str,
        build_id: str,
        train_samples: List[Sample],
        **kwargs,
    ) -> None:
        logger.info(f"Preparing memory bank with {len(train_samples)} training samples...")
        if not train_samples:
            self.normal_bank = None
            return

        self.normal_bank = self._get_features(train_samples)

    def predict(
        self,
        samples: List[Sample],
        split_name: str,
        **kwargs,
    ) -> List[PredictionRecord]:
        if not samples:
            return []

        if self.normal_bank is None or len(self.normal_bank) == 0:
            raise ValueError(
                f"FeatureMemoryBankRunner '{self.name}' has no fitted normal feature bank. "
                f"prepare() must be called with training normal samples prior to predict()."
            )

        query_feats = self._get_features(samples)

        sims = np.matmul(query_feats, self.normal_bank.T)  # (M, N)
        max_sims = np.max(sims, axis=1)  # (M,)
        # Anomaly score: 1.0 - max_cosine_sim
        scores = 1.0 - max_sims

        preds = []
        for i, s in enumerate(samples):
            preds.append(
                PredictionRecord(
                    sample_id=s.sample_id,
                    image_score=float(scores[i]),
                    pixel_score_path=None,
                    latency_ms=5.0,
                    split_name=split_name,
                )
            )
        validate_predictions(preds, samples, split_name)
        return preds
