import json
import logging
import os
import subprocess
import tempfile
from typing import List, Optional, Dict, Any

from iad_core.storage.models import Sample
from iad_core.evaluation.contracts import PredictionRecord
from iad_core.evaluation.baselines.base import BaselineRunner

logger = logging.getLogger("iad_core.evaluation.baselines.command")


class ExternalCommandBaselineRunner(BaselineRunner):
    """
    Adapter that executes baseline evaluation via an external command/process (R604).
    Passes train/val/test manifests via temporary files and reads standard predictions JSONL.
    """

    implementation_name: str = "external_command"
    implementation_source: str = "external_process"

    def __init__(
        self,
        name: str,
        command_template: str,
        env: Optional[Dict[str, str]] = None,
        working_dir: Optional[str] = None,
        implementation_source: Optional[str] = None,
        implementation_revision: Optional[str] = None,
        **kwargs,
    ):
        super().__init__(name=name, **kwargs)
        self.command_template = command_template
        self.implementation_name = name
        if implementation_source:
            self.implementation_source = implementation_source
        self.implementation_revision = implementation_revision
        self.runtime_config = {
            "command_template": command_template,
            "working_dir": working_dir,
            **kwargs,
        }
        self.env = env or dict(os.environ)
        self.working_dir = working_dir
        self.temp_dir: Optional[tempfile.TemporaryDirectory] = None

    def prepare(
        self,
        task_id: str,
        build_id: str,
        train_samples: List[Sample],
        **kwargs,
    ) -> None:
        pass

    def predict(
        self,
        samples: List[Sample],
        split_name: str,
        **kwargs,
    ) -> List[PredictionRecord]:
        if not samples:
            return []

        with tempfile.TemporaryDirectory() as tmp_dir:
            manifest_path = os.path.join(tmp_dir, f"{split_name}_manifest.jsonl")
            preds_out_path = os.path.join(tmp_dir, f"{split_name}_preds.jsonl")

            with open(manifest_path, "w", encoding="utf-8") as f:
                for s in samples:
                    f.write(json.dumps({"sample_id": s.sample_id, "image_path": s.image_path}) + "\n")

            cmd = self.command_template.format(
                manifest=manifest_path,
                output=preds_out_path,
                split=split_name,
            )

            logger.info(f"Running external baseline command: {cmd}")
            res = subprocess.run(
                cmd,
                shell=True,
                cwd=self.working_dir,
                env=self.env,
                capture_output=True,
                text=True,
            )

            if res.returncode != 0:
                logger.error(f"External baseline command exited with code {res.returncode}: {res.stderr}")
                raise RuntimeError(
                    f"External baseline '{self.name}' command failed with exit code {res.returncode}:\n{res.stderr}"
                )

            if not os.path.exists(preds_out_path):
                raise RuntimeError(
                    f"External baseline '{self.name}' did not produce expected predictions output at: {preds_out_path}"
                )

            preds = []
            with open(preds_out_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if not line.strip():
                            continue
                        data = json.loads(line)
                        preds.append(
                            PredictionRecord(
                                sample_id=data["sample_id"],
                                image_score=float(data.get("image_score", 0.0)),
                                pixel_score_path=data.get("pixel_score_path"),
                                latency_ms=data.get("latency_ms"),
                                split_name=split_name,
                            )
                        )
            return preds
