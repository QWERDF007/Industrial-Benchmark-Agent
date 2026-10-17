import os
import json
import pytest
from PIL import Image

from iad_core.storage.database import Database
from iad_core.storage.repositories import TaskRepository, SampleRepository, AnnotationRepository
from iad_core.storage.models import InspectionTask, Sample, QualityStatus, DataOrigin, Annotation, AnnotationType, GeometryStatus
from iad_core.task.config import (
    DatasetConfig,
    DatasetInfo,
    TaskConfig,
    QualityConfig,
    AnnotationsConfig,
    BBoxPolicyConfig,
    ReadinessPolicyConfig,
    StandardADReadinessPolicy,
)
from iad_core.dataset.adapters.folder import GenericFolderAdapter
from iad_core.dataset.adapters.labelme import LabelmeAdapter
from iad_core.dataset.adapters.base import RawImage
from iad_core.dataset.scanner import scan_dataset
from iad_core.dataset.audit import audit_dataset


def create_dummy_image(path, width=100, height=100):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img = Image.new("RGB", (width, height), (255, 255, 255))
    img.save(path)


def test_multi_dataset_same_relative_path(tmp_path):
    """C01 & 13.1: Two datasets sharing the same task and same relative path should both coexist."""
    db_file = tmp_path / "multi_ds.db"
    db = Database(str(db_file))
    sample_repo = SampleRepository(db)

    # Dataset A
    s_a = Sample(
        sample_id="ds_a:good/001.png",
        task_id="task_shared",
        dataset_id="ds_a",
        image_path="/data/a/good/001.png",
        relative_path="good/001.png",
        width=100,
        height=100,
        quality_status=QualityStatus.PASS,
    )
    # Dataset B with same relative path and same task
    s_b = Sample(
        sample_id="ds_b:good/001.png",
        task_id="task_shared",
        dataset_id="ds_b",
        image_path="/data/b/good/001.png",
        relative_path="good/001.png",
        width=100,
        height=100,
        quality_status=QualityStatus.PASS,
    )

    sample_repo.upsert(s_a)
    sample_repo.upsert(s_b)

    assert sample_repo.count_by_task("task_shared") == 2
    assert sample_repo.get_by_dataset_and_relative_path("ds_a", "good/001.png") is not None
    assert sample_repo.get_by_dataset_and_relative_path("ds_b", "good/001.png") is not None


def test_pass_with_bbox(tmp_path):
    """13.2: An image with PASS quality and bbox annotations must remain PASS (visual anomaly != FAIL)."""
    root = tmp_path / "pass_bbox_ds"
    img_path = root / "good" / "img_01.png"
    lbl_path = root / "good" / "img_01.json"
    create_dummy_image(img_path, width=200, height=200)

    with open(lbl_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "shapes": [
                    {"label": "scratch", "shape_type": "rectangle", "points": [[10, 10], [50, 50]]}
                ]
            },
            f,
        )

    cfg = DatasetConfig(
        dataset=DatasetInfo(id="ds_pass_bbox"),
        root=str(root),
        task=TaskConfig(task_id="task_pass_bbox", inspection_target="defect"),
        quality=QualityConfig(source="folder", mapping={"good": "PASS"}),
        annotations=AnnotationsConfig(
            format="labelme",
            labels={"scratch": "scratch"},
            location_mode="sidecar",
        ),
    )

    cfg_file = tmp_path / "config.yaml"
    import yaml
    with open(cfg_file, "w") as f:
        yaml.dump(cfg.model_dump(mode="json"), f)

    db_path = str(tmp_path / "test.db")
    res = scan_dataset(str(cfg_file), db_path=db_path)
    assert res.image_count == 1
    assert res.annotation_count == 1

    db = Database(db_path)
    sample = SampleRepository(db).get("ds_pass_bbox:good/img_01.png")
    assert sample is not None
    assert sample.quality_status == QualityStatus.PASS  # Must NOT be converted to FAIL!

    anns = AnnotationRepository(db).list_by_sample(sample.sample_id)
    assert len(anns) == 1
    assert anns[0].phenomenon == "scratch"


def test_chinese_folder_exact_match(tmp_path):
    """C08 & 13.3: In exact match mode, '良品' must NOT match '不良品'."""
    root = tmp_path / "chinese_ds"
    create_dummy_image(root / "不良品" / "bad_01.png")

    cfg = DatasetConfig(
        dataset=DatasetInfo(id="ds_chinese"),
        root=str(root),
        task=TaskConfig(task_id="task_chinese", inspection_target="defect"),
        quality=QualityConfig(
            source="folder",
            match_mode="exact",
            default=QualityStatus.UNCERTAIN,
            mapping={"良品": "PASS"},
        ),
    )

    adapter = GenericFolderAdapter(cfg)
    imgs = list(adapter.scan_images())
    assert len(imgs) == 1

    q = adapter.load_quality(imgs[0])
    # Must NOT match "良品" -> should fall back to UNCERTAIN
    assert q.quality_status == QualityStatus.UNCERTAIN


def test_bbox_reject(tmp_path):
    """13.4: With out_of_bounds='reject', out-of-bound coordinates become INVALID."""
    root = tmp_path / "bbox_reject_ds"
    img_path = root / "sample_01.png"
    lbl_path = root / "sample_01.json"
    create_dummy_image(img_path, width=100, height=100)

    with open(lbl_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "shapes": [
                    {"label": "scratch", "shape_type": "rectangle", "points": [[-5.0, 10.0], [50.0, 50.0]]}
                ]
            },
            f,
        )

    cfg = DatasetConfig(
        dataset=DatasetInfo(id="ds_reject"),
        root=str(root),
        task=TaskConfig(task_id="task_reject", inspection_target="defect"),
        annotations=AnnotationsConfig(
            format="labelme",
            labels={"scratch": "scratch"},
            location_mode="sidecar",
            bbox_policy=BBoxPolicyConfig(out_of_bounds="reject"),
        ),
    )

    cfg_file = tmp_path / "config_reject.yaml"
    import yaml
    with open(cfg_file, "w") as f:
        yaml.dump(cfg.model_dump(mode="json"), f)

    db_path = str(tmp_path / "reject.db")
    scan_dataset(str(cfg_file), db_path=db_path)

    db = Database(db_path)
    anns = AnnotationRepository(db).list_by_sample("ds_reject:sample_01.png")
    assert len(anns) == 1
    assert anns[0].geometry_status == GeometryStatus.INVALID


def test_bbox_clip(tmp_path):
    """13.5: With out_of_bounds='clip', slight out-of-bound coordinates are clipped and marked CLIPPED."""
    root = tmp_path / "bbox_clip_ds"
    img_path = root / "sample_01.png"
    lbl_path = root / "sample_01.json"
    create_dummy_image(img_path, width=100, height=100)

    with open(lbl_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "shapes": [
                    {"label": "scratch", "shape_type": "rectangle", "points": [[-2.0, 10.0], [102.0, 50.0]]}
                ]
            },
            f,
        )

    cfg = DatasetConfig(
        dataset=DatasetInfo(id="ds_clip"),
        root=str(root),
        task=TaskConfig(task_id="task_clip", inspection_target="defect"),
        annotations=AnnotationsConfig(
            format="labelme",
            labels={"scratch": "scratch"},
            location_mode="sidecar",
            bbox_policy=BBoxPolicyConfig(out_of_bounds="clip"),
        ),
    )

    cfg_file = tmp_path / "config_clip.yaml"
    import yaml
    with open(cfg_file, "w") as f:
        yaml.dump(cfg.model_dump(mode="json"), f)

    db_path = str(tmp_path / "clip.db")
    scan_dataset(str(cfg_file), db_path=db_path)

    db = Database(db_path)
    anns = AnnotationRepository(db).list_by_sample("ds_clip:sample_01.png")
    assert len(anns) == 1
    assert anns[0].geometry_status == GeometryStatus.CLIPPED
    assert anns[0].bbox == [0.0, 10.0, 100.0, 50.0]


def test_labelme_source_size_scale(tmp_path):
    """13.6: When source image size mismatches and policy is 'scale', coordinates are proportionally scaled."""
    root = tmp_path / "scale_ds"
    img_path = root / "sample_01.png"
    lbl_path = root / "sample_01.json"
    # Actual image is 100x100
    create_dummy_image(img_path, width=100, height=100)

    # Labelme recorded 200x200
    with open(lbl_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "imageWidth": 200,
                "imageHeight": 200,
                "shapes": [
                    {"label": "scratch", "shape_type": "rectangle", "points": [[20.0, 40.0], [80.0, 120.0]]}
                ],
            },
            f,
        )

    cfg = DatasetConfig(
        dataset=DatasetInfo(id="ds_scale"),
        root=str(root),
        task=TaskConfig(task_id="task_scale", inspection_target="defect"),
        annotations=AnnotationsConfig(
            format="labelme",
            labels={"scratch": "scratch"},
            location_mode="sidecar",
            bbox_policy=BBoxPolicyConfig(source_size_mismatch="scale"),
        ),
    )

    cfg_file = tmp_path / "config_scale.yaml"
    import yaml
    with open(cfg_file, "w") as f:
        yaml.dump(cfg.model_dump(mode="json"), f)

    db_path = str(tmp_path / "scale.db")
    scan_dataset(str(cfg_file), db_path=db_path)

    db = Database(db_path)
    anns = AnnotationRepository(db).list_by_sample("ds_scale:sample_01.png")
    assert len(anns) == 1
    assert anns[0].geometry_status == GeometryStatus.SCALED
    # Scaled from 200x200 down to 100x100 (half): [20, 40, 80, 120] -> [10, 20, 40, 60]
    assert anns[0].bbox == [10.0, 20.0, 40.0, 60.0]


def test_standard_readiness_without_policy(tmp_path):
    """C05 & 13.7: When PASS>0 and FAIL>0 but no readiness_policy is configured, Standard AD is PARTIAL, NOT READY."""
    db_file = tmp_path / "readiness_test.db"
    db = Database(str(db_file))
    TaskRepository(db).upsert(
        InspectionTask(task_id="task_no_policy", inspection_target="defect")
    )

    sample_repo = SampleRepository(db)
    # 5 PASS, 4 FAIL, 5065 UNCERTAIN
    for i in range(5):
        sample_repo.upsert(
            Sample(
                sample_id=f"pass_{i}",
                task_id="task_no_policy",
                dataset_id="ds",
                image_path=f"/img_p_{i}.png",
                relative_path=f"img_p_{i}.png",
                width=100,
                height=100,
                quality_status=QualityStatus.PASS,
            )
        )
    for i in range(4):
        sample_repo.upsert(
            Sample(
                sample_id=f"fail_{i}",
                task_id="task_no_policy",
                dataset_id="ds",
                image_path=f"/img_f_{i}.png",
                relative_path=f"img_f_{i}.png",
                width=100,
                height=100,
                quality_status=QualityStatus.FAIL,
            )
        )

    # Audit without policy
    audit = audit_dataset(task_id="task_no_policy", db_path=str(db_file))
    assert audit.track_readiness["Standard AD"] == "PARTIAL"  # Crucial: NOT READY!
