import os
import torch
import pytest
from unittest.mock import patch, MagicMock
from PIL import Image

from iad_core.storage.models import Sample, QualityStatus
from iad_core.evaluation.contracts import PredictionRecord
from iad_core.evaluation.baselines.base import BaselineRunner
from iad_core.evaluation.baselines.command import ExternalCommandBaselineRunner
from iad_core.evaluation.baselines.feature_knn import FeatureMemoryBankRunner
from iad_core.evaluation.baselines.patchcore import PatchCoreRunner
from iad_core.evaluation.baselines.dinomaly import Dinomaly2Runner


def create_sample(sid: str, path: str, quality: QualityStatus = QualityStatus.PASS, width: int = 100, height: int = 100) -> Sample:
    return Sample(
        sample_id=sid,
        task_id="kuangjiao_inspection_01",
        dataset_id="ds1",
        image_path=path,
        relative_path=os.path.basename(path),
        width=width,
        height=height,
        quality_status=quality,
    )


def test_baseline_prediction_completeness_validation():
    """Ticket F002: BaselineRunner.run strictly asserts output sample IDs match input sample IDs."""
    class IncompleteRunner(BaselineRunner):
        def prepare(self, task_id, build_id, train_samples, **kwargs):
            pass

        def predict(self, samples, split_name="test", **kwargs):
            # Omit one sample to simulate incomplete output
            return [
                PredictionRecord(sample_id=samples[0].sample_id, image_score=0.2, split_name=split_name)
            ]

    s1 = create_sample("s1", "/path/1.png")
    s2 = create_sample("s2", "/path/2.png")
    runner = IncompleteRunner(name="incomplete")

    with pytest.raises(ValueError, match="prediction completeness invariant violated"):
        runner.run(
            task_id="kuangjiao_inspection_01",
            build_id="test_build",
            train_samples=[s1],
            val_samples=[s1, s2],
            test_samples=[s1, s2],
        )


def test_baseline_finite_score_validation():
    """Ticket F002: BaselineRunner.run strictly asserts all scores are finite numbers (no NaN or Inf)."""
    class NanRunner(BaselineRunner):
        def prepare(self, task_id, build_id, train_samples, **kwargs):
            pass

        def predict(self, samples, split_name="test", **kwargs):
            return [
                PredictionRecord(sample_id=s.sample_id, image_score=float("nan"), split_name=split_name)
                for s in samples
            ]

    s1 = create_sample("s1", "/path/1.png")
    runner = NanRunner(name="nan_runner")

    with pytest.raises(ValueError, match="produced non-finite score"):
        runner.run(
            task_id="kuangjiao_inspection_01",
            build_id="test_build",
            train_samples=[s1],
            val_samples=[s1],
            test_samples=[s1],
        )


def test_external_command_fails_closed():
    """Ticket F001: External command failure must raise RuntimeError, never return fake 0.5 scores."""
    runner = ExternalCommandBaselineRunner(name="ext_test", command_template="false")
    s1 = create_sample("s1", "/path/1.png")

    with pytest.raises(RuntimeError, match="command failed with exit code"):
        runner.run(
            task_id="kuangjiao_inspection_01",
            build_id="test_build",
            train_samples=[s1],
            val_samples=[s1],
            test_samples=[s1],
        )


def test_feature_knn_fails_closed_on_empty_bank():
    """Ticket F003: Feature KNN must fail closed when normal bank is empty."""
    runner = FeatureMemoryBankRunner(name="feature_knn_dinov2")
    s1 = create_sample("s1", "/path/1.png", quality=QualityStatus.FAIL)

    runner.prepare(task_id="kuangjiao_inspection_01", build_id="test_build", train_samples=[])
    with pytest.raises(ValueError, match="has no fitted normal feature bank"):
        runner.predict(samples=[s1], split_name="test")


def test_patchcore_runner_architecture_and_smoke(tmp_path):
    """Tickets G001~G005: PatchCoreRunner is independent of FeatureMemoryBankRunner and runs real inspection."""
    assert not issubclass(PatchCoreRunner, FeatureMemoryBankRunner)
    assert PatchCoreRunner.implementation_source == "amazon-science/patchcore-inspection"

    real_img = "/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023-11-27_08.20.37.589_1_(18717)_ch_18719_8935719224179730945_3.png"
    if not os.path.exists(real_img):
        dummy_file = str(tmp_path / "smoke.png")
        Image.new("RGB", (224, 224), color=(128, 128, 128)).save(dummy_file)
        real_img = dummy_file

    train_sample = create_sample("train_01", real_img, QualityStatus.PASS, width=224, height=224)
    val_sample = create_sample("val_01", real_img, QualityStatus.PASS, width=224, height=224)
    test_sample = create_sample("test_01", real_img, QualityStatus.FAIL, width=224, height=224)

    dev = "cuda:0" if torch.cuda.is_available() else "cpu"
    runner = PatchCoreRunner(device=dev, coreset_percentage=0.1)
    val_preds, test_preds = runner.run(
        task_id="kuangjiao_inspection_01",
        build_id="test_build",
        train_samples=[train_sample],
        val_samples=[val_sample],
        test_samples=[test_sample],
    )

    assert len(val_preds) == 1
    assert len(test_preds) == 1
    assert isinstance(val_preds[0].image_score, float)
    assert isinstance(test_preds[0].image_score, float)
    assert val_preds[0].image_score >= 0.0
    assert test_preds[0].image_score >= 0.0


def test_dinomaly2_runner_architecture_and_smoke(tmp_path):
    """Tickets H001~H005: Dinomaly2Runner is independent of FeatureMemoryBankRunner and runs real bridge."""
    assert not issubclass(Dinomaly2Runner, FeatureMemoryBankRunner)
    assert Dinomaly2Runner.implementation_source == "guojiajeremy/Dinomaly2"

    real_img = "/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023-11-27_08.20.37.589_1_(18717)_ch_18719_8935719224179730945_3.png"
    if not os.path.exists(real_img):
        dummy_file = str(tmp_path / "smoke.png")
        Image.new("RGB", (224, 224), color=(128, 128, 128)).save(dummy_file)
        real_img = dummy_file

    train_sample = create_sample("train_01", real_img, QualityStatus.PASS, width=224, height=224)
    val_sample = create_sample("val_01", real_img, QualityStatus.PASS, width=224, height=224)
    test_sample = create_sample("test_01", real_img, QualityStatus.FAIL, width=224, height=224)

    runner = Dinomaly2Runner(device="cuda:0")
    val_preds, test_preds = runner.run(
        task_id="kuangjiao_inspection_01",
        build_id="test_build",
        train_samples=[train_sample],
        val_samples=[val_sample],
        test_samples=[test_sample],
    )

    assert len(val_preds) == 1
    assert len(test_preds) == 1
    assert isinstance(val_preds[0].image_score, float)
    assert isinstance(test_preds[0].image_score, float)
    assert val_preds[0].image_score >= 0.0
    assert test_preds[0].image_score >= 0.0
