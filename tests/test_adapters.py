import os
import json
import pytest
from PIL import Image

from app.schemas.config import DatasetConfig, DatasetInfo, TaskConfig, QualityConfig, AnnotationsConfig, ImagesConfig
from app.schemas.sample import QualityStatus
from app.schemas.annotation import AnnotationType
from app.adapters import GenericFolderAdapter, LabelmeAdapter, YOLOAdapter, get_adapter


def create_dummy_image(path, width=100, height=100):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    img.save(path)


def test_generic_folder_adapter(tmp_path):
    # Setup test structure: good/ 5 images, bad/ 3 images
    root = tmp_path / "dataset"
    for i in range(5):
        create_dummy_image(root / "good" / f"img_good_{i}.png")
    for i in range(3):
        create_dummy_image(root / "bad" / f"img_bad_{i}.png")

    config = DatasetConfig(
        dataset=DatasetInfo(id="test_ds"),
        root=str(root),
        task=TaskConfig(task_id="test_task", inspection_target="defect"),
        quality=QualityConfig(
            source="folder",
            mapping={"good": "PASS", "bad": "FAIL"},
        ),
    )

    adapter = GenericFolderAdapter(config)
    images = list(adapter.scan_images())
    assert len(images) == 8

    pass_count = 0
    fail_count = 0
    for img in images:
        q = adapter.load_quality(img)
        if q.quality_status == QualityStatus.PASS:
            pass_count += 1
        elif q.quality_status == QualityStatus.FAIL:
            fail_count += 1

    assert pass_count == 5
    assert fail_count == 3


def test_labelme_adapter(tmp_path):
    root = tmp_path / "labelme_dataset"
    img_path = root / "ExportImage_test" / "sample_01.png"
    lbl_path = root / "ExportLabel_test" / "sample_01.json"
    create_dummy_image(img_path, width=200, height=200)

    label_data = {
        "version": "5.0.0",
        "shapes": [
            {
                "label": "18",
                "shape_type": "rectangle",
                "points": [[20.0, 30.0], [50.0, 80.0]],
            },
            {
                "label": "13",
                "shape_type": "polygon",
                "points": [[10.0, 10.0], [30.0, 10.0], [20.0, 40.0]],
            },
        ],
    }
    os.makedirs(os.path.dirname(lbl_path), exist_ok=True)
    with open(lbl_path, "w", encoding="utf-8") as f:
        json.dump(label_data, f)

    config = DatasetConfig(
        dataset=DatasetInfo(id="labelme_ds"),
        root=str(root),
        task=TaskConfig(task_id="test_task", inspection_target="defect"),
        annotations=AnnotationsConfig(
            format="labelme",
            labels={"18": "glue_overflow", "13": "foreign_object"},
            folder_replace={"ExportImage_": "ExportLabel_"},
        ),
    )

    adapter = get_adapter(config)
    assert isinstance(adapter, LabelmeAdapter)

    images = list(adapter.scan_images())
    assert len(images) == 1

    raw_img = images[0]
    anns = adapter.load_annotations(raw_img, width=200, height=200)
    assert len(anns) == 2

    # Verify rectangle
    assert anns[0].annotation_type == AnnotationType.BBOX
    assert anns[0].raw_label == "18"
    assert anns[0].phenomenon == "glue_overflow"
    assert anns[0].bbox == [20.0, 30.0, 50.0, 80.0]

    # Verify polygon
    assert anns[1].annotation_type == AnnotationType.POLYGON
    assert anns[1].raw_label == "13"
    assert anns[1].phenomenon == "foreign_object"
    assert anns[1].polygon == [[10.0, 10.0], [30.0, 10.0], [20.0, 40.0]]


def test_yolo_adapter(tmp_path):
    root = tmp_path / "yolo_dataset"
    img_path = root / "images" / "test_01.png"
    lbl_path = root / "labels" / "test_01.txt"
    create_dummy_image(img_path, width=200, height=100)

    # YOLO line: class_id x_center y_center width height (normalized)
    # 0 0.5 0.5 0.2 0.4 -> xc=100, yc=50, w=40, h=40 -> [80, 30, 120, 70]
    os.makedirs(os.path.dirname(lbl_path), exist_ok=True)
    with open(lbl_path, "w") as f:
        f.write("0 0.5 0.5 0.2 0.4\n")

    config = DatasetConfig(
        dataset=DatasetInfo(id="yolo_ds"),
        root=str(root),
        task=TaskConfig(task_id="test_task", inspection_target="defect"),
        annotations=AnnotationsConfig(
            format="yolo",
            labels={"0": "scratch"},
        ),
    )

    adapter = get_adapter(config)
    assert isinstance(adapter, YOLOAdapter)

    images = list(adapter.scan_images())
    assert len(images) == 1

    anns = adapter.load_annotations(images[0], width=200, height=100)
    assert len(anns) == 1
    assert anns[0].annotation_type == AnnotationType.BBOX
    assert anns[0].raw_label == "0"
    assert anns[0].phenomenon == "scratch"
    assert anns[0].bbox == [80.0, 30.0, 120.0, 70.0]
