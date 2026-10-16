import os
import json
import pytest

from app.storage.database import Database
from app.storage.repositories import (
    TaskRepository,
    SampleRepository,
    AnnotationRepository,
    IssueRepository,
)
from app.schemas.task import InspectionTask
from app.schemas.sample import Sample, QualityStatus
from app.schemas.annotation import Annotation, AnnotationType
from app.schemas.issue import ImportIssue, IssueType, Severity
from app.services.audit_service import audit_dataset


@pytest.fixture
def mock_audit_db(tmp_path):
    db_file = tmp_path / "audit_test.db"
    db = Database(str(db_file))

    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    ann_repo = AnnotationRepository(db)
    issue_repo = IssueRepository(db)

    # Task
    task_repo.upsert(
        InspectionTask(
            task_id="task_audit_01",
            product="graphite",
            inspection_target="surface",
        )
    )

    # 15 samples:
    # 10 PASS, 2 FAIL, 3 UNCERTAIN
    # 2 distinct batches ("B01", "B02") -> Domain Shift PARTIAL
    # 2 missing batch_id
    for i in range(15):
        if i < 10:
            status = QualityStatus.PASS
        elif i < 12:
            status = QualityStatus.FAIL
        else:
            status = QualityStatus.UNCERTAIN

        batch = "B01" if i < 6 else ("B02" if i < 13 else None)
        sample_repo.upsert(
            Sample(
                sample_id=f"sample_{i}",
                task_id="task_audit_01",
                image_path=f"/data/img_{i}.png",
                relative_path=f"img_{i}.png",
                batch_id=batch,
                physical_sample_id=f"phys_{i // 2}" if i < 12 else None,
                width=1920,
                height=1080,
                quality_status=status,
            )
        )

    # Annotations: 4 bbox annotations on 2 samples (sample_10, sample_11)
    ann_repo.upsert(
        Annotation(
            annotation_id="ann_0",
            sample_id="sample_10",
            annotation_type=AnnotationType.BBOX,
            raw_label="scratch",
            phenomenon="scratch",
            bbox=[10, 20, 30, 40],
        )
    )
    ann_repo.upsert(
        Annotation(
            annotation_id="ann_1",
            sample_id="sample_10",
            annotation_type=AnnotationType.BBOX,
            raw_label="stain",
            phenomenon="stain",
            bbox=[50, 60, 70, 80],
        )
    )
    ann_repo.upsert(
        Annotation(
            annotation_id="ann_2",
            sample_id="sample_11",
            annotation_type=AnnotationType.BBOX,
            raw_label="scratch",
            phenomenon="scratch",
            bbox=[15, 25, 35, 45],
        )
    )

    # Issues: 1 invalid_bbox
    issue_repo.add(
        ImportIssue(
            task_id="task_audit_01",
            sample_id="sample_10",
            issue_type=IssueType.INVALID_BBOX,
            severity=Severity.WARNING,
            message="Test issue",
        )
    )

    return str(db_file), str(tmp_path / "runs")


def test_audit_dataset(mock_audit_db):
    db_path, run_dir = mock_audit_db
    audit = audit_dataset(task_id="task_audit_01", db_path=db_path, output_dir=run_dir)

    assert audit.task_id == "task_audit_01"

    # Samples check
    assert audit.samples["total"] == 15
    assert audit.samples["pass"] == 10
    assert audit.samples["fail"] == 2
    assert audit.samples["uncertain"] == 3

    # Annotations check
    assert audit.annotations["total"] == 3
    assert audit.annotations["bbox"] == 3
    assert audit.annotations["annotated_samples"] == 2
    assert audit.annotations["unannotated_samples"] == 13

    # Metadata check: missing batch_id = 2 / 15 = 0.1333
    assert abs(audit.metadata["missing_batch_id"] - (2 / 15)) < 1e-3

    # Track readiness check
    assert audit.track_readiness["Standard AD"] == "READY"
    assert audit.track_readiness["Open Normal"] == "NOT_EVALUATED"
    assert audit.track_readiness["Domain Shift"] == "PARTIAL"
    assert audit.track_readiness["Small / Weak"] == "PARTIAL"
    assert audit.track_readiness["Global / Logical"] == "NOT_EVALUATED"

    # Reports check
    json_path = os.path.join(run_dir, "audit_report.json")
    md_path = os.path.join(run_dir, "audit_report.md")
    assert os.path.exists(json_path)
    assert os.path.exists(md_path)

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["samples"]["total"] == 15
    assert data["samples"]["pass"] == 10

    with open(md_path, "r", encoding="utf-8") as f:
        md = f.read()
    assert "Standard AD" in md
    assert "READY" in md
