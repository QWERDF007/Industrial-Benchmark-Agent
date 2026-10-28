import time
import logging
from typing import List, Optional, Dict, Any
import numpy as np

from iad_core.storage.database import Database
from iad_core.storage.models import Sample
from iad_core.storage.repositories import FeatureRepository
from iad_core.evaluation.contracts import PredictionRecord
from iad_core.evaluation.baselines.base import BaselineRunner, BaselineProtocol, validate_predictions
from iad_core.feature.cache import ContentFeatureCache
from iad_core.feature.profiles import ImageEncoders
from iad_core.consistency.errors import ConsistencyError

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
        profile_id: Optional[str] = None,
        db_path: str = "data/benchmark.db",
        **kwargs,
    ):
        super().__init__(name=name, **kwargs)
        self.profile_id = profile_id
        self.implementation_name = name
        self.runtime_config = {
            "profile_id": profile_id,
            **kwargs,
        }
        self.db = Database(db_path)
        self.feat_repo = FeatureRepository(self.db)
        self.normal_bank: Optional[np.ndarray] = None

    def _get_features(self, samples: List[Sample]) -> np.ndarray:
        profile=ImageEncoders(self.db).profile(self.profile_id)
        self.profile_id=profile.profile_id
        self.implementation_revision=profile.profile_id
        self.implementation_source=('huggingface/transformers' if profile.backend=='transformers' else
            'facebookresearch/sscd-copy-detection' if profile.backend=='torchscript' else 'facebookresearch/'+profile.model_id.split('_')[0])
        self.runtime_config.update(profile_id=profile.profile_id,model_id=profile.model_id)
        if not samples:
            return np.empty((0,profile.dim),dtype=np.float32)
        missing=[sample.sample_id for sample in samples if self.feat_repo.get_for_sample(sample.sample_id,profile.profile_id) is None]
        if missing:
            selection=ImageEncoders(self.db).read().selection
            if selection is None or selection.profile.profile_id!=profile.profile_id:
                raise ConsistencyError('PROFILE_NOT_CONFIGURED','Evaluation must use its configured immutable embedding profile')
            from iad_core.workbench.runtime import workbench
            ContentFeatureCache(self.db,workbench(self.db.db_path).images).prepare(missing,selection)
        vectors=[]
        for sample in samples:
            record=self.feat_repo.get_for_sample(sample.sample_id,profile.profile_id)
            if record is None:
                raise ConsistencyError('INDEX_NOT_READY','Feature preparation did not cover '+sample.sample_id)
            vectors.append(np.frombuffer(record['embedding_blob'],dtype=record['dtype']).astype(np.float32))
        matrix=np.stack(vectors)
        return matrix/np.linalg.norm(matrix,axis=1,keepdims=True)

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

        started=time.perf_counter()
        query_feats = self._get_features(samples)

        sims = np.matmul(query_feats, self.normal_bank.T)  # (M, N)
        max_sims = np.max(sims, axis=1)  # (M,)
        # Anomaly score: 1.0 - max_cosine_sim
        scores = 1.0 - max_sims
        latency_ms=(time.perf_counter()-started)*1000/len(samples)

        preds = []
        for i, s in enumerate(samples):
            preds.append(
                PredictionRecord(
                    sample_id=s.sample_id,
                    image_score=float(scores[i]),
                    pixel_score_path=None,
                    latency_ms=latency_ms,
                    split_name=split_name,
                )
            )
        validate_predictions(preds, samples, split_name)
        return preds
