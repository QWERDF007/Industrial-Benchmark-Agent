import pytest
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry
from iad_core.workbench.query import WorkbenchQuery
from iad_core.task.config import DatasetConfig, DatasetInfo, TaskConfig


def test_dataset_group_lifecycle(tmp_path):
    db_file = tmp_path / "test_groups.db"
    db = Database(str(db_file))
    registry = DatasetRegistry(db)

    # 1. Create group
    group = registry.create_group("测试父级数据集", group_id="group-test-1")
    assert group["group_id"] == "group-test-1"
    assert group["name"] == "测试父级数据集"

    # 2. List groups
    groups = registry.list_groups()
    assert len(groups) == 1
    assert groups[0]["name"] == "测试父级数据集"

    # 3. Update group name
    updated = registry.update_group("group-test-1", "修改后的父级数据集")
    assert updated["name"] == "修改后的父级数据集"
    assert registry.get_group("group-test-1")["name"] == "修改后的父级数据集"

    # 4. Delete empty group
    deleted = registry.delete_group("group-test-1")
    assert deleted["deleted_group_id"] == "group-test-1"
    assert len(registry.list_groups()) == 0


def test_dataset_group_child_protection(tmp_path):
    db_file = tmp_path / "test_protection.db"
    db = Database(str(db_file))
    registry = DatasetRegistry(db)

    group = registry.create_group("框胶大数据集", group_id="group-1")
    
    cfg = DatasetConfig(
        dataset=DatasetInfo(id="ds_child_1", name="框胶_数据增强", format="labelme"),
        root=str(tmp_path / "images"),
        task=TaskConfig(task_id="task_1", inspection_target="surface"),
    )
    registry.save(cfg, group_id="group-1")

    # Cannot delete group while it has children when cascade=False
    with pytest.raises(ValueError, match="子数据集"):
        registry.delete_group("group-1", cascade=False)

    # WorkbenchQuery returns groups and group_id on dataset
    query = WorkbenchQuery(db)
    result = query.datasets()
    assert "groups" in result
    assert len(result["groups"]) == 1
    child = next(d for d in result["datasets"] if d["dataset_id"] == "ds_child_1")
    assert child["group_id"] == "group-1"


def test_dataset_group_cascade_delete(tmp_path):
    db_file = tmp_path / "test_cascade.db"
    db = Database(str(db_file))
    registry = DatasetRegistry(db)

    group = registry.create_group("测试大数据集", group_id="group-cascade-1")
    
    cfg1 = DatasetConfig(
        dataset=DatasetInfo(id="child_1", name="子数据集1", format="labelme"),
        root=str(tmp_path / "images1"),
        task=TaskConfig(task_id="task_1", inspection_target="surface"),
    )
    cfg2 = DatasetConfig(
        dataset=DatasetInfo(id="child_2", name="子数据集2", format="labelme"),
        root=str(tmp_path / "images2"),
        task=TaskConfig(task_id="task_2", inspection_target="surface"),
    )
    registry.save(cfg1, group_id="group-cascade-1")
    registry.save(cfg2, group_id="group-cascade-1")

    assert len(registry.list()) == 2
    assert len(registry.list_groups()) == 1

    # Cascade delete
    res = registry.delete_group("group-cascade-1", cascade=True)
    assert res["deleted_group_id"] == "group-cascade-1"
    assert set(res["deleted_dataset_ids"]) == {"child_1", "child_2"}

    assert len(registry.list_groups()) == 0
    assert len(registry.list()) == 0

