from iad_core.dataset.folder_preview import preview_folder_dataset
import json

import pytest
from PIL import Image

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.storage.database import Database


def test_folder_subsets_share_root_only_when_their_selected_images_are_disjoint(tmp_path):
    from iad_core.task.config import FolderRule
    root=tmp_path/'shared'
    folders={'maleOK':'normal','maleNG':'anomaly','femaleOK':'normal','femaleNG':'anomaly'}
    for index,name in enumerate(folders):
        (root/name).mkdir(parents=True)
        Image.new('RGB',(32,24),(index*40,70,90)).save(root/name/'image.png')
    db=Database(str(tmp_path/'subsets.db'))
    registry=DatasetRegistry(db)
    configs=[]
    for owner in ('male','female'):
        rules=[FolderRule(path=name,role=role if name.startswith(owner) else 'excluded') for name,role in folders.items()]
        preview=preview_folder_dataset(str(root),rules)
        config=registry.import_dataset(dict(format='folder_classification',name=owner,root_dir=str(root),
            rules=[rule.model_dump() for rule in rules],preview_fingerprint=preview.preview_fingerprint))
        configs.append(config)
        with db.connection() as conn:
            paths=conn.execute('SELECT relative_path,quality_status FROM samples WHERE dataset_id=? ORDER BY relative_path',(config.dataset.id,)).fetchall()
        assert {path.split('/')[0] for path,_ in paths}=={owner+'OK',owner+'NG'}
        assert {status for _,status in paths}=={'PASS','FAIL'}
    overlapping=[FolderRule(path=name,role=role) for name,role in folders.items()]
    preview=preview_folder_dataset(str(root),overlapping)
    with pytest.raises(ValueError,match='already'):
        registry.rescan(configs[1].dataset.id,folder_rules=overlapping,preview_fingerprint=preview.preview_fingerprint)
    assert registry.get(configs[1].dataset.id).folder_rules==configs[1].folder_rules
    with db.connection() as conn:
        assert conn.execute('SELECT count(*) FROM datasets').fetchone()[0]==2
        assert conn.execute('SELECT count(*) FROM samples').fetchone()[0]==4


def test_import_rename_and_dataset_isolation(dataset, tmp_path):
    db, registry, config = dataset
    assert registry.get(config.dataset.id).dataset.name == "生产线 A"
    assert registry.get(config.dataset.id).dataset.format == "labelme"
    from iad_core.workbench.query import WorkbenchQuery
    summary = WorkbenchQuery(db).datasets()["datasets"][0]
    assert summary["format"] == "labelme"
    assert summary["total_samples"] == 4
    assert summary["annotation_count"] == 2
    registry.rename(config.dataset.id, "线 A 复检")
    assert registry.get(config.dataset.id).dataset.name == "线 A 复检"
    with db.connection() as conn:
        assert conn.execute("SELECT count(*) FROM samples").fetchone()[0] == 4
        assert conn.execute("SELECT count(*) FROM annotations").fetchone()[0] == 2
    with pytest.raises(ValueError, match="already"):
        registry.import_labelme(DatasetImport(format="labelme", name="重复", image_dir=config.root, annotation_dir=config.annotations.root))


def test_folder_classification_preview_and_conflicts(tmp_path):
    from iad_core.dataset.folder_preview import preview_folder_dataset
    from iad_core.task.config import FolderRule

    root = tmp_path / "folder_ds"
    (root / "OK").mkdir(parents=True)
    (root / "ng").mkdir(parents=True)
    (root / "other").mkdir(parents=True)
    (root / "other/sub").mkdir(parents=True)
    Image.new("RGB", (100, 100), "green").save(root / "OK/good.png")
    Image.new("RGB", (100, 100), "red").save(root / "ng/bad.png")
    Image.new("RGB", (100, 100), "gray").save(root / "other/sub/sample.png")
    Image.new("RGB", (100, 100), "blue").save(root / "root.png")

    preview = preview_folder_dataset(str(root))
    assert preview.format == "folder_classification"
    assert preview.total_images == 4
    items_by_path = {item.path: item for item in preview.items}
    assert items_by_path["OK"].suggested_role == "normal"
    assert items_by_path["ng"].suggested_role == "anomaly"
    assert items_by_path["other/sub"].suggested_role == "unlabeled"
    assert items_by_path["."].suggested_role == "unlabeled"
    assert len(preview.conflicts) == 0

    # Ancestor conflict: mapping "other" to normal and "other/sub" to anomaly
    conflict_rules = [
        FolderRule(path="other", role="normal"),
        FolderRule(path="other/sub", role="anomaly"),
    ]
    conflicted = preview_folder_dataset(str(root), rules=conflict_rules)
    assert len(conflicted.conflicts) > 0


def test_folder_classification_import_and_query(tmp_path):
    from iad_core.dataset.registry import DatasetRegistry, FolderClassificationImport
    from iad_core.task.config import FolderRule
    from iad_core.storage.database import Database
    from iad_core.workbench.query import WorkbenchQuery, SampleQuery

    root = tmp_path / "prod_line"
    (root / "good").mkdir(parents=True)
    (root / "defect").mkdir(parents=True)
    (root / "unlabeled").mkdir(parents=True)
    (root / "excluded_dir").mkdir(parents=True)
    Image.new("RGB", (100, 100), "green").save(root / "good/pass.png")
    Image.new("RGB", (100, 100), "red").save(root / "defect/fail.png")
    Image.new("RGB", (100, 100), "gray").save(root / "unlabeled/unknown.png")
    Image.new("RGB", (100, 100), "yellow").save(root / "excluded_dir/ignore.png")
    Image.new("RGB", (100, 100), "blue").save(root / "root.png")
    # corrupted image
    (root / "good/corrupted.png").write_bytes(b"not an image")

    db = Database(str(tmp_path / "folder.db"))
    registry = DatasetRegistry(db)
    rules = [
        FolderRule(path="good", role="normal"),
        FolderRule(path="defect", role="anomaly"),
        FolderRule(path="unlabeled", role="unlabeled"),
        FolderRule(path="excluded_dir", role="excluded"),
        FolderRule(path=".", role="unlabeled"),
    ]
    config = registry.import_dataset(FolderClassificationImport(
        format="folder_classification",
        name="产线异常检测",
        root_dir=str(root),
        rules=rules,
        preview_fingerprint=preview_folder_dataset(str(root), rules).preview_fingerprint,
    ))

    assert config.dataset.format == "folder_classification"
    summary = WorkbenchQuery(db).datasets()["datasets"][0]
    assert summary["format"] == "folder_classification"
    assert summary["annotation_count"] == 0
    # 4 valid images (good/pass, defect/fail, unlabeled/unknown, root.png); excluded_dir is not imported
    assert summary["total_samples"] == 4
    # 2 labeled samples (good/pass is PASS, defect/fail is FAIL)
    assert summary["labeled_sample_count"] == 2

    # Query samples
    query = WorkbenchQuery(db)
    samples = query.samples(SampleQuery(dataset_id=config.dataset.id))["items"]
    by_rel = {s["relative_path"]: s for s in samples}
    assert by_rel["good/pass.png"]["quality_status"] == "PASS"
    assert by_rel["defect/fail.png"]["quality_status"] == "FAIL"
    assert by_rel["unlabeled/unknown.png"]["quality_status"] == "UNCERTAIN"
    assert by_rel["root.png"]["quality_status"] == "UNCERTAIN"
    assert "excluded_dir/ignore.png" not in by_rel

    # Import issue for corrupted image
    with db.connection() as conn:
        issues = conn.execute("SELECT issue_type, severity FROM import_issues WHERE dataset_id=?", (config.dataset.id,)).fetchall()
        assert any(i[0] == "INVALID_IMAGE" for i in issues)
        assert not any(i[0] == "ANNOTATION_PARSE_ERROR" for i in issues)

    # Cross-format duplicate root rejection
    from iad_core.dataset.registry import LabelmeImport
    with pytest.raises(ValueError, match="already"):
        registry.import_dataset(LabelmeImport(
            format="labelme", name="尝试重复导入",
            image_dir=str(root), annotation_dir=str(root),
        ))

    from iad_core.dataset.registry import DatasetImport, LabelmeImport, FolderClassificationImport
    from iad_core.storage.database import Database

    # 1. Validation error on missing format
    with pytest.raises(ValueError, match="format is required"):
        DatasetImport.model_validate({"name": "未指定格式", "image_dir": "/tmp/img", "annotation_dir": "/tmp/ann"})

    # 2. Validation error on unsupported format
    with pytest.raises(ValueError, match="Unsupported dataset format"):
        DatasetImport.model_validate({"format": "yolo_unsupported", "name": "无效格式", "image_dir": "/tmp/img"})

    # 3. Labelme rejects folder classification fields
    with pytest.raises(ValueError, match="extra|Extra"):
        DatasetImport.model_validate({
            "format": "labelme", "name": "多余字段",
            "image_dir": "/tmp/img", "annotation_dir": "/tmp/ann",
            "root_dir": "/tmp/root",
        })

    # 4. Folder classification rejects labelme fields
    with pytest.raises(ValueError, match="extra|Extra"):
        DatasetImport.model_validate({
            "format": "folder_classification", "name": "多余字段",
            "root_dir": "/tmp/root",
            "annotation_dir": "/tmp/ann",
        })

    # 5. Legacy database migration
    legacy_dir = tmp_path / "legacy_images"
    legacy_dir.mkdir()
    db_file = tmp_path / "legacy.db"
    db = Database(str(db_file))
    with db.connection() as conn:
        conn.execute(f"""
            INSERT INTO datasets (dataset_id, task_id, config_json)
            VALUES ('legacy_ds', 'legacy_task', '{{"dataset":{{"id":"legacy_ds","name":"旧版数据集"}},"root":"{legacy_dir}","task":{{"task_id":"legacy_task","inspection_target":"surface"}},"annotations":{{"format":"labelme"}}}}')
        """)
    # Re-open database to trigger schema migrations
    db2 = Database(str(db_file))
    from iad_core.dataset.registry import DatasetRegistry
    reg = DatasetRegistry(db2)
    loaded = reg.get("legacy_ds")
    assert loaded.dataset.format == "labelme"
    from iad_core.workbench.query import WorkbenchQuery
    summaries = WorkbenchQuery(db2).datasets()["datasets"]
    assert any(s["dataset_id"] == "legacy_ds" and s["format"] == "labelme" for s in summaries)


def test_raw_label_filters_and_mapping_rescan(tmp_path):
    from iad_core.dataset.registry import DatasetRegistry, FolderClassificationImport
    from iad_core.task.config import FolderRule
    from iad_core.storage.database import Database
    from iad_core.workbench.query import WorkbenchQuery, SampleQuery
    from iad_core.storage.review_repository import ReviewRepository
    from iad_core.storage.models import ReviewDecisionRecord

    root = tmp_path / "filter_rescan_prod"
    (root / "OK").mkdir(parents=True)
    (root / "NG").mkdir(parents=True)
    (root / "other").mkdir(parents=True)
    Image.new("RGB", (100, 100), "green").save(root / "OK/p1.png")
    Image.new("RGB", (100, 100), "red").save(root / "NG/f1.png")
    Image.new("RGB", (100, 100), "gray").save(root / "other/u1.png")

    db = Database(str(tmp_path / "rescan.db"))
    registry = DatasetRegistry(db)
    rules = [
        FolderRule(path="OK", role="normal"),
        FolderRule(path="NG", role="anomaly"),
        FolderRule(path="other", role="unlabeled"),
    ]
    config = registry.import_dataset(FolderClassificationImport(
        format="folder_classification",
        name="产线测试",
        root_dir=str(root),
        rules=rules,
        preview_fingerprint=preview_folder_dataset(str(root), rules).preview_fingerprint,
    ))

    query = WorkbenchQuery(db)

    # 1. Filter by raw label single
    pass_res = query.samples(SampleQuery(dataset_id=config.dataset.id, raw_label_filters=["PASS"]))
    assert pass_res["total"] == 1
    assert pass_res["items"][0]["relative_path"] == "OK/p1.png"

    # 2. Filter with alias normalization ("OK", "NG")
    union_res = query.samples(SampleQuery(dataset_id=config.dataset.id, raw_label_filters=["OK", "NG"]))
    assert union_res["total"] == 2
    assert {i["relative_path"] for i in union_res["items"]} == {"OK/p1.png", "NG/f1.png"}

    # 3. Filter by UNCERTAIN ("unlabeled")
    unc_res = query.samples(SampleQuery(dataset_id=config.dataset.id, raw_label_filters=["unlabeled"]))
    assert unc_res["total"] == 1
    assert unc_res["items"][0]["relative_path"] == "other/u1.png"

    # 4. Cross-dimension filter (raw label + search)
    cross_res = query.samples(SampleQuery(dataset_id=config.dataset.id, raw_label_filters=["PASS"], search="other"))
    assert cross_res["total"] == 0

    # 5. Add a human review record to OK/p1.png
    sample_id = pass_res["items"][0]["sample_id"]
    sample_uuid = pass_res["items"][0]["sample_uuid"]
    ReviewRepository(db).append_decision(ReviewDecisionRecord(
        sample_id=sample_id, decision="PASS", reviewer="tester"
    ))

    # 6. Change rule: map "other" to normal role
    new_rules = [
        FolderRule(path="OK", role="normal"),
        FolderRule(path="NG", role="anomaly"),
        FolderRule(path="other", role="normal"),
    ]
    scan_result = registry.rescan(config.dataset.id, folder_rules=new_rules,
        preview_fingerprint=preview_folder_dataset(str(root), new_rules).preview_fingerprint)
    assert scan_result.image_count == 3

    # Check updated dataset query
    ds_summary = query.datasets()["datasets"][0]
    assert ds_summary["labeled_sample_count"] == 3
    assert len(ds_summary["folder_rules"]) == 3

    # Check sample identities and review records preserved
    rescanned_samples = query.samples(SampleQuery(dataset_id=config.dataset.id))["items"]
    by_rel = {s["relative_path"]: s for s in rescanned_samples}
    assert by_rel["other/u1.png"]["quality_status"] == "PASS"
    assert by_rel["OK/p1.png"]["sample_id"] == sample_id
    assert by_rel["OK/p1.png"]["sample_uuid"] == sample_uuid
    assert by_rel["OK/p1.png"]["reviewed"] is True
    assert by_rel["OK/p1.png"]["review_decision"] == "PASS"



def test_combined_filters_and_report_share_counts(dataset):
    from iad_core.workbench.query import SampleQuery, WorkbenchQuery
    db, _, config = dataset
    query = WorkbenchQuery(db)
    unannotated = query.samples(SampleQuery(dataset_id=config.dataset.id, annotation_filters=["none"]))
    assert unannotated["total"] == 2
    dent = query.samples(SampleQuery(dataset_id=config.dataset.id, annotation_filters=["category:dent"]))
    assert dent["total"] == 1
    assert dent["items"][0]["annotation_categories"] == ["dent"]
    empty = query.samples(SampleQuery(dataset_id=config.dataset.id, annotation_filters=["none", "category:dent"]))
    assert empty["total"] == 3
    assert query.report(dataset_id=config.dataset.id)["technical_quality_issues"] == 0


def test_reference_pool_excludes_target_and_human_fail(dataset):
    from iad_core.storage.models import ReviewDecisionRecord
    from iad_core.storage.review_repository import ReviewRepository
    db, registry, config = dataset
    refs = registry.references(config.dataset.id)
    assert len(refs) == 2
    assert all("normal" in sid for sid in refs)
    assert refs[0] not in registry.references(config.dataset.id, exclude=refs[0])
    ReviewRepository(db).append_decision(ReviewDecisionRecord(sample_id=refs[0], decision="FAIL"))
    assert refs[0] not in registry.references(config.dataset.id)


def test_manual_reference_selection_survives_reload_and_human_correction(dataset):
    from iad_core.storage.models import ReviewDecisionRecord
    from iad_core.storage.review_repository import ReviewRepository
    db, registry, config = dataset
    selected = [f"{config.dataset.id}:dent.png"]
    registry.set_references(config.dataset.id, selected)
    reloaded = DatasetRegistry(Database(db.db_path))
    assert reloaded.references(config.dataset.id) == selected
    assert reloaded.references(config.dataset.id, exclude=selected[0]) == []
    ReviewRepository(db).append_decision(ReviewDecisionRecord(sample_id=selected[0], reviewer="alice", decision="FAIL"))
    assert reloaded.references(config.dataset.id) == []


def test_import_rejects_blank_name_before_creating_dataset(dataset):
    _, _, config = dataset
    with pytest.raises(ValueError):
        DatasetImport(name="  ", image_dir=config.root, annotation_dir=config.annotations.root)
