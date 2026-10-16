import pytest
from pydantic import ValidationError

from app.schemas.task import InspectionTask
from app.schemas.sample import Sample, QualityStatus
from app.schemas.annotation import Annotation, AnnotationType, AnnotationSource
from app.schemas.issue import ImportIssue, IssueType, Severity
from app.schemas.audit import DatasetAudit, TrackReadiness, TrackReadinessStatus
from app.schemas.config import DatasetConfig, load_config


def test_inspection_task():
    task = InspectionTask(
        task_id="task_001",
        product="graphite",
        station="station_01",
        camera="cam_01",
        inspection_target="surface_defect",
        description="test task",
    )
    assert task.task_id == "task_001"
    assert task.product == "graphite"


def test_sample_valid():
    sample = Sample(
        sample_id="img_001",
        task_id="task_001",
        image_path="/path/to/img_001.png",
        relative_path="img_001.png",
        width=1920,
        height=1080,
        quality_status=QualityStatus.PASS,
    )
    assert sample.quality_status == QualityStatus.PASS
    assert sample.width == 1920


def test_sample_case_insensitive_status():
    sample = Sample(
        sample_id="img_002",
        task_id="task_001",
        image_path="/path/to/img_002.png",
        relative_path="img_002.png",
        width=100,
        height=100,
        quality_status="pass",
    )
    assert sample.quality_status == QualityStatus.PASS


def test_sample_invalid_quality_status():
    with pytest.raises(ValidationError):
        Sample(
            sample_id="img_003",
            task_id="task_001",
            image_path="/path/to/img_003.png",
            relative_path="img_003.png",
            width=100,
            height=100,
            quality_status="BAD",
        )


def test_annotation_schema():
    ann = Annotation(
        annotation_id="ann_001",
        sample_id="img_001",
        annotation_type=AnnotationType.BBOX,
        raw_label="scratch_deep",
        phenomenon="scratch",
        bbox=[10.0, 20.0, 50.0, 80.0],
    )
    assert ann.annotation_type == AnnotationType.BBOX
    assert ann.source == AnnotationSource.IMPORTED


def test_issue_schema():
    issue = ImportIssue(
        sample_id="img_001",
        issue_type=IssueType.INVALID_BBOX,
        severity=Severity.WARNING,
        message="BBox coordinates inverted",
    )
    assert issue.issue_type == IssueType.INVALID_BBOX
    assert issue.severity == Severity.WARNING


def test_load_example_config():
    cfg = load_config("configs/example.yaml")
    assert cfg.dataset.id == "example_surface"
    assert cfg.task.task_id == "example_surface_01"
    assert "good" in cfg.quality.mapping
    assert cfg.quality.mapping["good"] == "PASS"
