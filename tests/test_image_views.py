import os
import pytest
from PIL import Image

from iad_core.storage.database import Database
from iad_core.storage.models import InspectionTask, Sample, Annotation
from iad_core.storage.repositories import TaskRepository, SampleRepository, AnnotationRepository
from iad_core.tools.image_tools import sample_view, region_view, samples_compare
from iad_core.contracts import ToolStatus


@pytest.fixture
def image_test_db(tmp_path):
    db_file = str(tmp_path / "test_image.db")
    db = Database(db_file)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    anno_repo = AnnotationRepository(db)

    task_repo.upsert(InspectionTask(task_id="t_img", inspection_target="surface"))

    img_dir = tmp_path / "images"
    img_dir.mkdir()
    img1_path = str(img_dir / "img1.png")
    img2_path = str(img_dir / "img2.png")

    Image.new("RGB", (100, 100), color="white").save(img1_path)
    Image.new("RGB", (100, 100), color="gray").save(img2_path)

    sample_repo.upsert(
        Sample(
            sample_id="t_img:s1",
            task_id="t_img",
            dataset_id="ds1",
            image_path=img1_path,
            relative_path="img1.png",
            width=100,
            height=100,
            quality_status="PASS",
        )
    )
    sample_repo.upsert(
        Sample(
            sample_id="t_img:s2",
            task_id="t_img",
            dataset_id="ds1",
            image_path=img2_path,
            relative_path="img2.png",
            width=100,
            height=100,
            quality_status="FAIL",
        )
    )

    anno_repo.upsert(
        Annotation(
            annotation_id="ann_img1",
            sample_id="t_img:s1",
            annotation_type="bbox",
            raw_label="scratch",
            phenomenon="hairline scratch",
            bbox=[10, 10, 50, 50],
            source_width=100,
            source_height=100,
        )
    )

    return db_file


def test_sample_view_raw_and_overlay(image_test_db):
    # Raw view
    res_raw = sample_view("t_img", "t_img:s1", view="raw", db_path=image_test_db)
    assert res_raw.status == ToolStatus.OK
    assert res_raw.metrics["view_type"] == "raw"
    assert os.path.exists(res_raw.metrics["view_path"])

    # Overlay view
    res_overlay = sample_view("t_img", "t_img:s1", view="annotation_overlay", db_path=image_test_db)
    assert res_overlay.status == ToolStatus.OK
    assert res_overlay.metrics["view_type"] == "annotation_overlay"
    assert os.path.exists(res_overlay.metrics["view_path"])
    assert res_overlay.metrics["annotations_count"] == 1


def test_region_view(image_test_db):
    res = region_view("t_img", "t_img:s1", bbox_xyxy=[10, 10, 50, 50], padding_ratio=0.1, db_path=image_test_db)
    assert res.status == ToolStatus.OK
    assert os.path.exists(res.metrics["view_path"])
    # 40 width + 10% on each side = 40 + 4 + 4 = 48
    assert res.metrics["crop_width"] == 48
    assert res.metrics["crop_height"] == 48


def test_samples_compare(image_test_db):
    res = samples_compare("t_img", ["t_img:s1", "t_img:s2"], roles=["candidate", "reference"], db_path=image_test_db)
    assert res.status == ToolStatus.OK
    samples = res.metrics["samples"]
    assert len(samples) == 2
    assert samples[0]["role"] == "candidate"
    assert samples[1]["role"] == "reference"
