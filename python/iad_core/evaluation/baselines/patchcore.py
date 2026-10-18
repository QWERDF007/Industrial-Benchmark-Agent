import os
import sys
import time
import logging
from typing import List, Optional, Dict, Any
import numpy as np

from iad_core.storage.models import Sample
from iad_core.evaluation.contracts import PredictionRecord
from iad_core.evaluation.baselines.base import BaselineRunner, BaselineProtocol, validate_predictions

logger = logging.getLogger("iad_core.evaluation.baselines.patchcore")

DEFAULT_PATCHCORE_REPO = "/data1/yuneng/patchcore-inspection-main"


class PatchCoreRunner(BaselineRunner):
    """
    Real PatchCore Baseline Adapter (Amazon Science patchcore-inspection) (Tickets G001~G005, Spec S11).
    Evaluates anomaly detection using memory-bank patch representations.
    Does NOT wrap or delegate to FeatureMemoryBankRunner.
    """

    implementation_name: str = "patchcore"
    implementation_source: str = "amazon-science/patchcore-inspection"
    implementation_revision: Optional[str] = "main"
    protocol: str = BaselineProtocol.UNSUPERVISED_NORMAL

    def __init__(
        self,
        name: str = "patchcore",
        repo_path: str = DEFAULT_PATCHCORE_REPO,
        backbone: str = "wideresnet50",
        image_size: int = 448,
        coreset_percentage: float = 0.1,
        device: Optional[str] = None,
        batch_size: int = 8,
        **kwargs,
    ):
        if not backbone:
            raise ValueError(
                "PatchCore requires an explicit valid backbone name (e.g. 'wideresnet50'), got None or empty."
            )
        super().__init__(name=name, **kwargs)
        self.repo_path = repo_path
        self.backbone = backbone
        self.image_size = image_size
        self.coreset_percentage = coreset_percentage
        self.device_str = device
        self.batch_size = batch_size
        self.runtime_config = {
            "repo_path": repo_path,
            "backbone": backbone,
            "image_size": image_size,
            "coreset_percentage": coreset_percentage,
            "batch_size": batch_size,
            "protocol": self.protocol,
            **kwargs,
        }
        self.model = None
        self.transform = None

        if not os.path.isdir(self.repo_path):
            raise RuntimeError(
                f"PatchCore repository path does not exist: {self.repo_path}. "
                f"PatchCore runner fails closed (Ticket G001)."
            )

    def _init_patchcore(self):
        src_path = os.path.join(self.repo_path, "src")
        if src_path not in sys.path:
            sys.path.insert(0, src_path)

        try:
            import torch
            import torchvision.transforms as transforms
            import patchcore.patchcore
            import patchcore.backbones
            import patchcore.sampler
            import patchcore.common
        except ImportError as e:
            raise RuntimeError(f"Failed to import patchcore modules from {src_path}: {e}")

        if self.device_str:
            device = torch.device(self.device_str)
        else:
            device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.device = device

        sampler = patchcore.sampler.ApproximateGreedyCoresetSampler(
            percentage=self.coreset_percentage, device=device
        )
        self.model = patchcore.patchcore.PatchCore(device)
        nn_method = patchcore.common.FaissNN(False, 4)

        backbone_mod = patchcore.backbones.load(self.backbone)
        if backbone_mod is None:
            raise RuntimeError(f"Failed to load PatchCore backbone '{self.backbone}' from upstream library.")
        layers = ["layer2", "layer3"]
        feat_dim = 1024

        self.model.load(
            backbone=backbone_mod,
            layers_to_extract_from=layers,
            device=device,
            input_shape=[3, self.image_size, self.image_size],
            pretrain_embed_dimension=feat_dim,
            target_embed_dimension=feat_dim,
            patchsize=3,
            featuresampler=sampler,
            nn_method=nn_method,
        )

        self.transform = transforms.Compose([
            transforms.Resize((self.image_size, self.image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def prepare(
        self,
        task_id: str,
        build_id: str,
        train_samples: List[Sample],
        **kwargs,
    ) -> None:
        if not train_samples:
            raise ValueError("PatchCore prepare requires non-empty training samples.")

        self._init_patchcore()
        logger.info(f"Fitting PatchCore memory bank on {len(train_samples)} normal samples...")

        import torch
        from PIL import Image

        tensors = []
        for s in train_samples:
            if not os.path.exists(s.image_path):
                raise RuntimeError(f"Sample image path does not exist: {s.image_path}")
            img = Image.open(s.image_path).convert("RGB")
            tensors.append(self.transform(img))

        # Train in batches
        batches = []
        for i in range(0, len(tensors), self.batch_size):
            batch = torch.stack(tensors[i : i + self.batch_size], dim=0).to(self.device)
            batches.append(batch)

        self.model.fit(batches)
        logger.info(f"PatchCore memory bank fitted successfully on {len(train_samples)} samples.")

    def predict(
        self,
        samples: List[Sample],
        split_name: str,
        **kwargs,
    ) -> List[PredictionRecord]:
        if not samples:
            return []

        if self.model is None:
            raise ValueError(
                f"PatchCoreRunner '{self.name}' model has not been prepared. "
                f"Call prepare() before predict()."
            )

        import torch
        from PIL import Image

        preds = []
        for s in samples:
            if not os.path.exists(s.image_path):
                raise RuntimeError(f"Sample image path does not exist for inference: {s.image_path}")

            t0 = time.time()
            img = Image.open(s.image_path).convert("RGB")
            img_tensor = self.transform(img).unsqueeze(0).to(self.device)

            image_scores, masks = self.model._predict(img_tensor)
            elapsed_ms = (time.time() - t0) * 1000.0

            raw_score = float(image_scores[0])
            if not np.isfinite(raw_score):
                raise ValueError(f"PatchCore produced non-finite score ({raw_score}) for sample {s.sample_id}")

            preds.append(
                PredictionRecord(
                    sample_id=s.sample_id,
                    image_score=raw_score,
                    pixel_score_path=None,
                    latency_ms=elapsed_ms,
                    split_name=split_name,
                )
            )

        validate_predictions(preds, samples, split_name)
        return preds
