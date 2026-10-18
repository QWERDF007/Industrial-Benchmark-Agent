import pytest
import numpy as np

from iad_core.storage.models import Sample, QualityStatus
from iad_core.evaluation.contracts import PredictionRecord, EvaluationInvariantError
from iad_core.evaluation.baselines.base import validate_predictions, BaselineRunner


def make_sample(sample_id: str) -> Sample:
    return Sample(
        sample_id=sample_id,
        task_id="task_test",
        dataset_id="ds_test",
        image_path=f"/fake/{sample_id}.png",
        relative_path=f"{sample_id}.png",
        width=100,
        height=100,
        quality_status=QualityStatus.PASS,
    )


def test_validate_predictions_success():
    samples = [make_sample("s1"), make_sample("s2")]
    preds = [
        PredictionRecord(sample_id="s1", image_score=0.1, split_name="val"),
        PredictionRecord(sample_id="s2", image_score=0.9, split_name="val"),
    ]
    # Should succeed without error
    validate_predictions(preds, samples, split_name="val")


def test_validate_predictions_length_mismatch():
    samples = [make_sample("s1"), make_sample("s2")]
    preds = [PredictionRecord(sample_id="s1", image_score=0.1, split_name="val")]
    with pytest.raises(ValueError, match="(?i)count mismatch"):
        validate_predictions(preds, samples, split_name="val")


def test_validate_predictions_duplicate_sample_id():
    samples = [make_sample("s1"), make_sample("s2")]
    preds = [
        PredictionRecord(sample_id="s1", image_score=0.1, split_name="val"),
        PredictionRecord(sample_id="s1", image_score=0.2, split_name="val"),
    ]
    with pytest.raises(ValueError, match="(?i)duplicate sample_id"):
        validate_predictions(preds, samples, split_name="val")


def test_validate_predictions_missing_or_extra_ids():
    samples = [make_sample("s1"), make_sample("s2")]
    preds = [
        PredictionRecord(sample_id="s1", image_score=0.1, split_name="val"),
        PredictionRecord(sample_id="s3", image_score=0.3, split_name="val"),
    ]
    with pytest.raises(ValueError, match="ID mismatch"):
        validate_predictions(preds, samples, split_name="val")


def test_validate_predictions_wrong_split():
    samples = [make_sample("s1")]
    preds = [PredictionRecord(sample_id="s1", image_score=0.1, split_name="test")]
    with pytest.raises(ValueError, match="split_name mismatch"):
        validate_predictions(preds, samples, split_name="val")


def test_validate_predictions_nan_score():
    samples = [make_sample("s1")]
    preds = [PredictionRecord(sample_id="s1", image_score=float("nan"), split_name="val")]
    with pytest.raises(ValueError, match="non-finite"):
        validate_predictions(preds, samples, split_name="val")


def test_validate_predictions_inf_score():
    samples = [make_sample("s1")]
    preds = [PredictionRecord(sample_id="s1", image_score=float("inf"), split_name="val")]
    with pytest.raises(ValueError, match="non-finite"):
        validate_predictions(preds, samples, split_name="val")

    preds_neg_inf = [PredictionRecord(sample_id="s1", image_score=float("-inf"), split_name="val")]
    with pytest.raises(ValueError, match="non-finite"):
        validate_predictions(preds_neg_inf, samples, split_name="val")
