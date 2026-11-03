import pytest
import json
from PIL import Image
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry
from iad_core.workbench.query import SampleQuery, WorkbenchQuery
from iad_core.task.config import FolderRule
from iad_core.dataset.registry import FolderClassificationImport
from iad_core.dataset.folder_preview import preview_folder_dataset


def test_sample_query_dataset_ids(tmp_path):
    root1 = tmp_path / "ds1"
    (root1 / "good").mkdir(parents=True)
    Image.new("RGB", (50, 50), "blue").save(root1 / "good/sample1.png")

    root2 = tmp_path / "ds2"
    (root2 / "good").mkdir(parents=True)
    Image.new("RGB", (50, 50), "green").save(root2 / "good/sample2.png")

    root3 = tmp_path / "ds3"
    (root3 / "good").mkdir(parents=True)
    Image.new("RGB", (50, 50), "red").save(root3 / "good/sample3.png")

    db = Database(str(tmp_path / "test_multi.db"))
    registry = DatasetRegistry(db)
    rules = [FolderRule(path="good", role="normal")]

    cfg1 = registry.import_dataset(FolderClassificationImport(
        format="folder_classification", name="子数据集1", root_dir=str(root1), rules=rules,
        preview_fingerprint=preview_folder_dataset(str(root1), rules).preview_fingerprint,
    ))
    cfg2 = registry.import_dataset(FolderClassificationImport(
        format="folder_classification", name="子数据集2", root_dir=str(root2), rules=rules,
        preview_fingerprint=preview_folder_dataset(str(root2), rules).preview_fingerprint,
    ))
    cfg3 = registry.import_dataset(FolderClassificationImport(
        format="folder_classification", name="子数据集3", root_dir=str(root3), rules=rules,
        preview_fingerprint=preview_folder_dataset(str(root3), rules).preview_fingerprint,
    ))

    wq = WorkbenchQuery(db)

    # 1. Single dataset_id
    res1 = wq.samples(SampleQuery(dataset_id=cfg1.dataset.id))
    assert res1["total"] == 1

    # 2. Multi dataset_ids: query 2 of the 3 datasets
    res_multi = wq.samples(SampleQuery(dataset_ids=[cfg1.dataset.id, cfg2.dataset.id]))
    assert res_multi["total"] == 2
    ds_ids = {item["dataset_id"] for item in res_multi["items"]}
    assert ds_ids == {cfg1.dataset.id, cfg2.dataset.id}

    # 3. Multi dataset_ids with JSON string normalization
    res_json = wq.samples(SampleQuery(dataset_ids=json.dumps([cfg2.dataset.id, cfg3.dataset.id])))
    assert res_json["total"] == 2
    ds_ids_json = {item["dataset_id"] for item in res_json["items"]}
    assert ds_ids_json == {cfg2.dataset.id, cfg3.dataset.id}
