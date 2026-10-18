import os
import sys
import json
import time
import logging
import tempfile
import subprocess
from typing import List, Optional, Dict, Any
import numpy as np

from iad_core.storage.models import Sample
from iad_core.evaluation.contracts import PredictionRecord
from iad_core.evaluation.baselines.base import BaselineRunner, BaselineProtocol, validate_predictions

logger = logging.getLogger("iad_core.evaluation.baselines.dinomaly")

DEFAULT_DINOMALY_PYTHON = "/data1/anaconda3/envs/dinomaly2/bin/python"
DEFAULT_DINOMALY_REPO = "/data1/lzw/anomaly-detection/Dinomaly2"
DEFAULT_DINOMALY_WEIGHTS = (
    "/data1/lzw/data/preout/pipeline_165/dinomaly2_n100_s448_seed2024/20260828151130/model.pth"
)


class Dinomaly2Runner(BaselineRunner):
    """
    Real Dinomaly2 Baseline Adapter (guojiajeremy/Dinomaly2) (Tickets H001~H005, Spec S12).
    Executes official Dinomaly2 inference via dedicated isolated conda environment.
    Does NOT wrap or delegate to FeatureMemoryBankRunner.
    """

    implementation_name: str = "dinomaly2"
    implementation_source: str = "guojiajeremy/Dinomaly2"
    implementation_revision: Optional[str] = "main"
    protocol: str = BaselineProtocol.PRETRAINED_INFERENCE

    def __init__(
        self,
        name: str = "dinomaly2",
        python_bin: str = DEFAULT_DINOMALY_PYTHON,
        repo_path: str = DEFAULT_DINOMALY_REPO,
        weights_path: str = DEFAULT_DINOMALY_WEIGHTS,
        backbone: str = "dinov2reg_vit_small_14",
        image_size: int = 448,
        crop_size: int = 392,
        cuda: str = "0",
        training_origin: str = "TRAIN_ORIGIN_UNVERIFIED",
        **kwargs,
    ):
        super().__init__(name=name, **kwargs)
        self.python_bin = python_bin
        self.repo_path = repo_path
        self.weights_path = weights_path
        self.backbone = backbone
        self.image_size = image_size
        self.crop_size = crop_size
        self.cuda = cuda
        self.training_origin = training_origin
        self.protocol = BaselineProtocol.PRETRAINED_INFERENCE
        self.runtime_config = {
            "python_bin": python_bin,
            "repo_path": repo_path,
            "weights_path": weights_path,
            "backbone": backbone,
            "image_size": image_size,
            "crop_size": crop_size,
            "cuda": cuda,
            "protocol": self.protocol,
            "training_origin": self.training_origin,
            **kwargs,
        }

        # Fail closed validation (Ticket F001, Spec S8.4)
        if not os.path.exists(self.python_bin):
            raise RuntimeError(
                f"Dinomaly2 python environment binary not found at: {self.python_bin}"
            )
        if not os.path.isdir(self.repo_path):
            raise RuntimeError(
                f"Dinomaly2 repository path not found at: {self.repo_path}"
            )
        if not os.path.exists(self.weights_path):
            raise RuntimeError(
                f"Dinomaly2 model weights not found at: {self.weights_path}"
            )

    def prepare(
        self,
        task_id: str,
        build_id: str,
        train_samples: List[Sample],
        **kwargs,
    ) -> None:
        """
        Verify training context and model readiness.
        Train split is only consumed for training/calibration, never Val/Test (Spec S12).
        """
        if not train_samples:
            raise ValueError("Dinomaly2 prepare requires non-empty training samples.")
        logger.info(
            f"Dinomaly2 model '{self.name}' validated on {len(train_samples)} train samples with weights: {self.weights_path}"
        )

    def predict(
        self,
        samples: List[Sample],
        split_name: str,
        **kwargs,
    ) -> List[PredictionRecord]:
        if not samples:
            return []

        bridge_script = os.path.join(os.path.dirname(__file__), "dinomaly_bridge.py")
        if not os.path.exists(bridge_script):
            raise RuntimeError(f"Dinomaly2 bridge script not found at: {bridge_script}")

        with tempfile.TemporaryDirectory() as tmp_dir:
            manifest_path = os.path.join(tmp_dir, f"{split_name}_manifest.jsonl")
            preds_out_path = os.path.join(tmp_dir, f"{split_name}_preds.jsonl")

            with open(manifest_path, "w", encoding="utf-8") as f:
                for s in samples:
                    if not os.path.exists(s.image_path):
                        raise RuntimeError(f"Sample image path does not exist: {s.image_path}")
                    f.write(json.dumps({"sample_id": s.sample_id, "image_path": s.image_path}) + "\n")

            cmd = [
                self.python_bin,
                bridge_script,
                "--repo_path", self.repo_path,
                "--model", self.weights_path,
                "--manifest", manifest_path,
                "--output", preds_out_path,
                "--split", split_name,
                "--backbone", self.backbone,
                "--image_size", str(self.image_size),
                "--crop_size", str(self.crop_size),
                "--cuda", str(self.cuda),
            ]

            logger.info(f"Invoking Dinomaly2 runner on {len(samples)} {split_name} samples...")
            res = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
            )

            if res.returncode != 0:
                logger.error(f"Dinomaly2 inference failed (code {res.returncode}):\n{res.stderr}")
                raise RuntimeError(
                    f"Dinomaly2 runner command failed with exit code {res.returncode}:\n{res.stderr}"
                )

            if not os.path.exists(preds_out_path):
                raise RuntimeError(
                    f"Dinomaly2 runner did not produce output predictions file at: {preds_out_path}"
                )

            preds = []
            with open(preds_out_path, "r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    item = json.loads(line)
                    score = float(item["image_score"])
                    if not np.isfinite(score):
                        raise ValueError(f"Dinomaly2 produced non-finite score ({score}) for sample {item['sample_id']}")
                    preds.append(
                        PredictionRecord(
                            sample_id=item["sample_id"],
                            image_score=score,
                            pixel_score_path=item.get("pixel_score_path"),
                            latency_ms=item.get("latency_ms"),
                            split_name=split_name,
                        )
                    )

            validate_predictions(preds, samples, split_name)
            return preds
