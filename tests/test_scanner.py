import os
import json
import pytest
from PIL import Image

from app.schemas.config import DatasetConfig, DatasetInfo, TaskConfig, QualityConfig, AnnotationsConfig, MetadataConfig, MetadataRule
from app.services.dataset_service import scan_dataset
from app.storage.database import Database
from app.storage.repositories import SampleRepository, AnnotationRepository, IssueRepository


@pytest.fixture
def test_dataset(tmp_path):
    root = tmp_path / "synthetic_dataset"
    os.makedirs(root / "good", exist_ok=True)
    os.makedirs(root / "bad", exist_ok=True)
    os.makedirs(root / "unknown", exist_ok=True)

    # 15 total images:
    # 8 PASS (in good/)
    # 4 FAIL (in bad/)
    # 3 UNCERTAIN (in unknown/)
    #
    # Details:
    # - 1 damaged image (good/img_07.png corrupted bytes)
    # - 1 unknown label (bad/img_bad_01.json has label "unknown_defect_99")
    # - 2 missing batch (in unknown/img_unk_01.png and img_unk_02.png, filename has no batch)
    # - 6 bbox annotations across bad images
    #
    # Valid batch naming pattern: "batch_20260901_img_xxx.png"

    # PASS: 8 images in good/
    for i in range(7):
        img = Image.new("RGB", (100, 100), (200, 200, 200))
        img.save(root / "good" / f"batch_20260901_img_pass_{i}.png")
    # 1 damaged image
    with open(root / "good" / "batch_20260901_img_pass_corrupt.png", "wb") as f:
        f.write(b"NOT_A_VALID_IMAGE_HEADER_BYTES")

    # FAIL: 4 images in bad/
    for i in range(4):
        img = Image.new("RGB", (100, 100), (50, 50, 50))
        img_name = f"batch_20260901_img_fail_{i}.png"
        img.save(root / "bad" / img_name)

        # Annotations:
        # img_fail_0: 2 bboxes (labels: scratch, bubble)
        # img_fail_1: 1 bbox (label: unknown_defect_99 -> unknown label issue)
        # img_fail_2: 2 bboxes (label: scratch, stain)
        # img_fail_3: 1 bbox with out-of-bounds coords (trigger invalid_bbox)
        shapes = []
        if i == 0:
            shapes = [
                {"label": "scratch", "shape_type": "rectangle", "points": [[10, 10], [30, 30]]},
                {"label": "bubble", "shape_type": "rectangle", "points": [[40, 40], [60, 60]]},
            ]
        elif i == 1:
            shapes = [
                {"label": "unknown_defect_99", "shape_type": "rectangle", "points": [[20, 20], [50, 50]]},
            ]
        elif i == 2:
            shapes = [
                {"label": "scratch", "shape_type": "rectangle", "points": [[5, 5], [25, 25]]},
                {"label": "stain", "shape_type": "rectangle", "points": [[35, 35], [75, 75]]},
            ]
        elif i == 3:
            shapes = [
                {"label": "scratch", "shape_type": "rectangle", "points": [[-10, 50], [150, 120]]},
            ]

        with open(root / "bad" / f"batch_20260901_img_fail_{i}.json", "w") as f:
            json.dump({"shapes": shapes}, f)

    # UNCERTAIN: 3 images in unknown/
    # 2 have NO batch_id in filename
    for i in range(2):
        img = Image.new("RGB", (100, 100), (128, 128, 128))
        img.save(root / "unknown" / f"no_batch_unk_{i}.png")
    # 1 has batch_id
    img = Image.new("RGB", (100, 100), (128, 128, 128))
    img.save(root / "unknown" / "batch_20260902_unk_2.png")

    # Config
    cfg_path = tmp_path / "test_config.yaml"
    import yaml
    cfg_data = {
        "dataset": {"id": "synth_ds", "description": "Synthetic Dataset"},
        "root": str(root),
        "task": {
            "task_id": "synth_task_01",
            "product": "test_product",
            "inspection_target": "defect",
        },
        "quality": {
            "source": "folder",
            "default": "UNCERTAIN",
            "mapping": {"good": "PASS", "bad": "FAIL"},
        },
        "annotations": {
            "format": "labelme",
            "labels": {
                "scratch": "scratch",
                "bubble": "bubble",
                "stain": "stain",
            },
            "location_mode": "sidecar",
        },
        "metadata": {
            "batch_id": {
                "source": "filename_regex",
                "pattern": "(?P<batch_id>batch_\\d+)",
            }
        },
    }
    with open(cfg_path, "w") as f:
        yaml.dump(cfg_data, f)

    return cfg_path, str(tmp_path / "test.db")


def test_scanner_integration(test_dataset):
    cfg_path, db_path = test_dataset

    # Run scan
    res = scan_dataset(config_path=str(cfg_path), db_path=db_path)
    assert res.task_id == "synth_task_01"
    assert res.image_count == 15
    assert res.annotation_count == 6

    # Verify DB content
    db = Database(db_path)
    sample_repo = SampleRepository(db)
    ann_repo = AnnotationRepository(db)
    issue_repo = IssueRepository(db)

    # 14 valid samples saved (1 corrupt image logged as issue)
    samples = sample_repo.list_by_task("synth_task_01")
    assert len(samples) == 14

    pass_samples = [s for s in samples if s.quality_status.value == "PASS"]
    fail_samples = [s for s in samples if s.quality_status.value == "FAIL"]
    uncertain_samples = [s for s in samples if s.quality_status.value == "UNCERTAIN"]

    assert len(pass_samples) == 7  # 8 good - 1 corrupt = 7
    assert len(fail_samples) == 4
    assert len(uncertain_samples) == 3

    # Check issues logged
    issues = issue_repo.list_by_task("synth_task_01")
    issue_types = [i.issue_type.value for i in issues]
    assert "invalid_image" in issue_types
    assert "unknown_label" in issue_types
    assert "invalid_bbox" in issue_types


def test_scanner_idempotency(test_dataset):
    cfg_path, db_path = test_dataset

    # Scan 1st time
    res1 = scan_dataset(config_path=str(cfg_path), db_path=db_path)
    db = Database(db_path)
    sample_repo = SampleRepository(db)
    ann_repo = AnnotationRepository(db)

    count1 = sample_repo.count_by_task("synth_task_01")
    ann1 = ann_repo.count_by_task("synth_task_01")

    # Scan 2nd time
    res2 = scan_dataset(config_path=str(cfg_path), db_path=db_path)
    count2 = sample_repo.count_by_task("synth_task_01")
    ann2 = ann_repo.count_by_task("synth_task_01")

    assert count1 == count2
    assert ann1 == ann2
