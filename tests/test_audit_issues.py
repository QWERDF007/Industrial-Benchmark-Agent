import pytest
from iad_core.storage.database import Database
from iad_core.storage.models import InspectionTask, Sample, Annotation
from iad_core.storage.repositories import TaskRepository, SampleRepository, AnnotationRepository
from iad_domain_server.tools.audit_tools import (
    audit_issue_query,
    audit_recheck,
    audit_suggestion_save,
)
from iad_domain_server.contracts import ToolStatus


@pytest.fixture
def audit_test_db(tmp_path):
    db_file = str(tmp_path / "test_audit_tools.db")
    db = Database(db_file)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    anno_repo = AnnotationRepository(db)

    task_repo.upsert(InspectionTask(task_id="t_audit", inspection_target="surface"))

    # Sample 1: Normal pass with matching size
    sample_repo.upsert(
        Sample(
            sample_id="t_audit:s1",
            task_id="t_audit",
            dataset_id="ds1",
            image_path="/data1/images/ok/s1.png",
            relative_path="ok/s1.png",
            width=200,
            height=200,
            quality_status="PASS",
            batch_id="batch_A",
        )
    )
    anno_repo.upsert(
        Annotation(
            annotation_id="ann1",
            sample_id="t_audit:s1",
            annotation_type="bbox",
            raw_label="scratch",
            bbox=[10, 10, 50, 50],
            source_width=200,
            source_height=200,
            geometry_status="VALID",
        )
    )

    # Sample 2: Size mismatch and path discrepancy (path says /ng/ but status is PASS)
    sample_repo.upsert(
        Sample(
            sample_id="t_audit:s2",
            task_id="t_audit",
            dataset_id="ds1",
            image_path="/data1/images/ng/s2_defect.png",
            relative_path="ng/s2_defect.png",
            width=100,
            height=100,
            quality_status="PASS",
            batch_id="batch_B",
        )
    )
    anno_repo.upsert(
        Annotation(
            annotation_id="ann2",
            sample_id="t_audit:s2",
            annotation_type="bbox",
            raw_label="bubble",
            bbox=[0, 0, 150, 150],  # Out of bounds for 100x100
            source_width=500,  # Mismatch with 100
            source_height=500,
            geometry_status="CLIPPED",
        )
    )

    # Insert import issues
    with db.connection() as conn:
        c = conn.cursor()
        c.execute(
            """
            INSERT INTO import_issues (task_id, dataset_id, sample_id, issue_type, severity, message)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("t_audit", "ds1", "t_audit:s2", "bbox_geometry", "WARNING", "BBox exceeds image bounds"),
        )
        c.execute(
            """
            INSERT INTO import_issues (task_id, dataset_id, sample_id, issue_type, severity, message)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("t_audit", "ds1", "t_audit:s2", "source_size_mismatch", "ERROR", "Source size 500x500 vs 100x100"),
        )

    return db_file


def test_audit_issue_query(audit_test_db):
    res = audit_issue_query(task_id="t_audit", db_path=audit_test_db)
    assert res.status == ToolStatus.OK
    metrics = res.metrics
    assert metrics["total_matching_issues"] == 2
    assert len(metrics["samples"]) == 2
    assert "bbox_geometry" in metrics["issue_types_breakdown"]


def test_audit_recheck_hypotheses(audit_test_db):
    # 1. bbox_source_size
    res1 = audit_recheck(
        task_id="t_audit",
        kind="bbox_source_size",
        sample_ids=["t_audit:s1", "t_audit:s2"],
        db_path=audit_test_db,
    )
    assert res1.status == ToolStatus.OK
    assert res1.metrics["discrepancy_count"] == 1
    findings = {f["sample_id"]: f["status"] for f in res1.metrics["findings"]}
    assert findings["t_audit:s1"] == "CONFIRMED_MATCH"
    assert findings["t_audit:s2"] == "DISCREPANCY_FOUND"

    # 2. bbox_bounds
    res2 = audit_recheck(
        task_id="t_audit",
        kind="bbox_bounds",
        sample_ids=["t_audit:s1", "t_audit:s2"],
        db_path=audit_test_db,
    )
    assert res2.metrics["discrepancy_count"] == 1

    # 3. quality_path_mapping
    res3 = audit_recheck(
        task_id="t_audit",
        kind="quality_path_mapping",
        sample_ids=["t_audit:s1", "t_audit:s2"],
        db_path=audit_test_db,
    )
    assert res3.metrics["discrepancy_count"] == 1
    assert res3.metrics["findings"][1]["sample_id"] == "t_audit:s2"
    assert res3.metrics["findings"][1]["status"] == "DISCREPANCY_FOUND"


def test_audit_suggestion_save(audit_test_db):
    res = audit_suggestion_save(
        task_id="t_audit",
        suggestion={
            "suggestion_id": "sug_test_unique_01",
            "sample_id": "t_audit:s2",
            "observations": [{"phenomenon": "dimension mismatch", "description": "Annotated for 500x500 instead of 100x100"}],
            "conclusion_status": "EVIDENCE_SUPPORTED",
            "recommended_action": "RECHECK",
        },
        db_path=audit_test_db,
    )
    assert res.status == ToolStatus.OK
    assert res.metrics["sample_id"] == "t_audit:s2"
    assert res.metrics["recommended_action"] == "RECHECK"

    # NXM-06: Duplicate suggestion ID cannot overwrite
    with pytest.raises(Exception):
        audit_suggestion_save(
            task_id="t_audit",
            suggestion={
                "suggestion_id": "sug_test_unique_01",
                "sample_id": "t_audit:s2",
                "conclusion_status": "EVIDENCE_SUPPORTED",
                "recommended_action": "RECHECK",
            },
            db_path=audit_test_db,
        )

    # NXM-06: Invalid conclusion_status strictly rejected (no silent fallback)
    with pytest.raises(ValueError, match="Invalid conclusion_status"):
        audit_suggestion_save(
            task_id="t_audit",
            suggestion={
                "sample_id": "t_audit:s2",
                "conclusion_status": "HYPOTHESIS_ONLY",
                "recommended_action": "RECHECK",
            },
            db_path=audit_test_db,
        )

    # NXM-06: Invalid recommended_action strictly rejected (no silent fallback)
    with pytest.raises(ValueError, match="Invalid recommended_action"):
        audit_suggestion_save(
            task_id="t_audit",
            suggestion={
                "sample_id": "t_audit:s2",
                "conclusion_status": "EVIDENCE_SUPPORTED",
                "recommended_action": "HARD_NORMAL",
            },
            db_path=audit_test_db,
        )

    # NXM-06: Verify Sample.quality_status was NOT mutated
    db = Database(audit_test_db)
    sample_repo = SampleRepository(db)
    s2 = sample_repo.get("t_audit:s2")
    assert s2.quality_status.value == "PASS"

