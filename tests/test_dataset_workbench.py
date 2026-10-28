from iad_core.dataset.folder_preview import preview_folder_dataset
import json
import threading

import httpx
import pytest
from PIL import Image

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.storage.database import Database


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


@pytest.mark.parametrize("endpoint,expected_url", [(None, "http://127.0.0.1:8000/v1/chat/completions"), ("https://mllm.example.invalid/v1", "https://mllm.example.invalid/v1/chat/completions")])
def test_real_audit_job_uses_references_and_persists_confidence(dataset, monkeypatch, mllm_api, endpoint, expected_url):
    from iad_core.workbench.audit import AuditService, VlmClient
    db, registry, config = dataset
    if endpoint is None:
        monkeypatch.delenv("LIVE_VLM_ENDPOINT", raising=False)
    else:
        monkeypatch.setenv("LIVE_VLM_ENDPOINT", endpoint)
    http_client, bodies, responses = mllm_api
    responses['GlobalAnalysis']['illumination_analysis'] = '高亮是反光'
    responses['ViewAnalysis']['position_analysis'] = '位置偏移已比较'
    responses['VlmResult'].update(suggested_label='FAIL', reason_category='SCRATCH', confidence=0.61)
    def check_endpoint(request):
        expected = expected_url if request.url.path.endswith('/chat/completions') else expected_url.removesuffix('/v1/chat/completions') + '/tokenize'
        assert str(request.url) == expected
    http_client.event_hooks['request'].append(check_endpoint)
    monkeypatch.setenv('LIVE_VLM_REQUEST_PARAMETERS', json.dumps({'chat_template_kwargs': {'enable_thinking': False}}))
    client = VlmClient(http_client=http_client)
    service = AuditService(db, client)
    target = f"{config.dataset.id}:scratch.png"
    job = service.start(dataset_id=config.dataset.id, sample_ids=[target, f"{config.dataset.id}:dent.png"], model_name="test-vlm")
    service.wait(job["run_id"], timeout=5)
    result = service.status(job["run_id"])
    assert result["status"] == "COMPLETED"
    assert result["completed"] == 2
    assert result["progress"] == 1
    content = bodies[0]["messages"][0]["content"]
    assert sum(item["type"] == "image_url" for item in content) == 2
    assert "可见蓝色表面" in bodies[1]["messages"][0]["content"][0]["text"]
    audit_body = next(body for body in bodies if body['response_format']['json_schema']['name'] == 'JointAnalysis')
    assert audit_body["chat_template_kwargs"] == {"enable_thinking": False}
    from iad_core.advisory.repository import AuditSuggestionRepository
    suggestion = AuditSuggestionRepository(db).list_by_sample(target)[0]
    assert suggestion.confidence == 0.61
    assert len(suggestion.reference_sample_ids) == 2
    assert suggestion.audit_run_id == job["run_id"]
    assert suggestion.analysis.normal_version_id
    assert suggestion.analysis.regions[0].crop_bbox == [6, 6, 34, 34]
    assert suggestion.analysis.global_view.illumination_analysis == "高亮是反光"
    assert suggestion.analysis.regions[0].observation.position_analysis == "位置偏移已比较"
    from iad_core.entry import knowledge_get
    assert knowledge_get({"dataset_id": config.dataset.id, "kind": "normal"}, db.db_path)["knowledge"]["version_id"] == suggestion.analysis.normal_version_id


def test_job_cancel_prevents_late_suggestion(dataset, mllm_api):
    from iad_core.workbench.audit import AuditService, VlmClient
    from iad_core.advisory.repository import AuditSuggestionRepository
    db, _, config = dataset
    entered, release = threading.Event(), threading.Event()
    client, _, _ = mllm_api
    def hold_roi(request):
        if request.url.path.endswith("/chat/completions") and json.loads(request.content)["response_format"]["json_schema"]["name"] == "JointAnalysis":
            entered.set()
            release.wait(5)
    client.event_hooks['request'].append(hold_roi)
    service = AuditService(db, VlmClient(http_client=client))
    target = f"{config.dataset.id}:dent.png"
    job = service.start(dataset_id=config.dataset.id, sample_ids=[target], model_name="test")
    try:
        assert entered.wait(3)
        assert service.status(job["run_id"])["phase"] == "SYNTHESIS"
        service.cancel(job["run_id"])
    finally:
        release.set()
    service.wait(job["run_id"], timeout=5)
    assert service.status(job["run_id"])["status"] == "CANCELLED"
    assert not AuditSuggestionRepository(db).list_by_sample(target)


@pytest.mark.parametrize("finish_reason,content,expected", [
    ("length", None, "token 上限"),
    ("stop", None, "no final answer"),
    ("length", json.dumps({"structure":"连续","texture":"平整","position_variation":"平移","illumination_variation":"反光","normal_allowances":[],"cautions":[]}), "token 上限"),
])
def test_empty_model_answer_records_failure_without_suggestion(dataset, mllm_api, finish_reason, content, expected):
    from iad_core.workbench.audit import AuditService, VlmClient
    from iad_core.advisory.repository import AuditSuggestionRepository
    db, _, config = dataset
    client = httpx.Client(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"count":1000,"max_model_len":262144} if request.url.path.endswith("/tokenize") else {
        "choices": [{"finish_reason": finish_reason, "message": {"content": content, "reasoning_content": "thinking"}}],
    })))
    service = AuditService(db, VlmClient(http_client=client))
    target = f"{config.dataset.id}:dent.png"
    job = service.start(dataset_id=config.dataset.id, sample_ids=[target])
    service.wait(job["run_id"], timeout=5)
    result = service.status(job["run_id"])
    assert result["status"] == "FAILED"
    assert result["failed"] == 1 and result["completed"] == 0
    assert expected in result["errors"][0]["message"]
    assert not AuditSuggestionRepository(db).list_by_sample(target)


def test_workbench_maps_overview_coordinates_and_exposes_lossless_roi_evidence(dataset, mllm_api):
    from pathlib import Path
    from iad_core.dataset.scanner import scan_dataset
    from iad_core.entry import sample_get, audit_evidence
    from iad_core.workbench.audit import AuditService, VlmClient
    db, registry, config = dataset
    Image.new('RGB', (3600,1800), 'blue').save(Path(config.root)/'dent.png')
    (Path(config.annotations.root)/'dent.json').write_text(json.dumps({'imageWidth':3600,'imageHeight':1800,'shapes':[{'label':'dent','shape_type':'rectangle','points':[[100,100],[200,200]]}]}))
    scan_dataset(config=config, db_path=db.db_path)
    client, bodies, responses = mllm_api
    responses['GlobalAnalysis'] = {**responses['GlobalAnalysis'], 'suspect_regions':[{'bbox_1000':[500,250,600,500], 'reason':'细小异常'}]}
    service = AuditService(db,VlmClient(http_client=client))
    target=f'{config.dataset.id}:dent.png'
    job=service.start(dataset_id=config.dataset.id,sample_ids=[target],model_name='test')
    service.wait(job['run_id'],10)
    assert service.status(job['run_id'])['status']=='COMPLETED'
    detail=sample_get({'sample_id':target},db.db_path)
    trace=detail['suggestion']['analysis']
    assert trace['overview']['original_size']==[3600,1800]
    assert trace['overview']['sent_size']==[1280,640]
    candidate=next(r for r in trace['regions'] if r['source']=='model')
    assert candidate['bbox']==[1800,450,2160,900]
    assert candidate['crop_bbox']==[1728,360,2232,990]
    assert candidate['image']['sent_size']==[504,630]
    assert candidate['image']['media_type']=='image/png'
    info=audit_evidence({'suggestion_id':detail['suggestion']['suggestion_id'],'evidence_id':candidate['image']['evidence_id']},db.db_path)
    with Image.open(info['path']) as roi:
        assert roi.size==(504,630)
        assert roi.getpixel((1,1))==(0,0,255)
    assert trace['coverage']['complete']
    assert any(r['source']=='coverage' for r in trace['regions'])


def test_workbench_analyzes_overview_and_all_roi_in_one_multimodal_request(dataset, mllm_api):
    import base64
    import hashlib
    from pathlib import Path
    from iad_core.dataset.scanner import scan_dataset
    from iad_core.entry import sample_get
    from iad_core.workbench.audit import AuditService, VlmClient
    db, _, config = dataset
    Image.new('RGB',(6000,1800),'blue').save(Path(config.root)/'fresh.png')
    scan_dataset(config=config,db_path=db.db_path)
    client, bodies, _ = mllm_api
    service=AuditService(db,VlmClient(http_client=client))
    target=f'{config.dataset.id}:fresh.png'
    try:
        job=service.start(dataset_id=config.dataset.id,sample_ids=[target],model_name='test')
        service.wait(job['run_id'],30)
        assert service.status(job['run_id'])['status']=='COMPLETED'
        visual=[body for body in bodies if body['response_format']['json_schema']['name']!='KnowledgeDraft']
        assert len(visual)==1, 'Full image and all ROI must share one analysis, without separate overview or per-ROI generations'
        assert visual[0]['response_format']['json_schema']['name']=='JointAnalysis'
        content=visual[0]['messages'][0]['content']
        metadata=[json.loads(part['text'].split('视觉证据：')[1]) for part in content if part['type']=='text' and part['text'].startswith('视觉证据：')]
        assert [image['role'] for image in metadata]==['overview']+['roi']*16
        encoded_images=[part['image_url']['url'].split(',',1)[1] for part in content if part['type']=='image_url']
        assert len(encoded_images)==17
        assert [hashlib.sha256(base64.b64decode(image)).hexdigest() for image in encoded_images]==[image['sha256'] for image in metadata]
        trace=sample_get({'sample_id':target},db.db_path)['suggestion']['analysis']
        assert trace['coverage']['complete'] and len(trace['regions'])==16
        assert len(trace['joint_steps'])==1
        assert {image['evidence_id'] for image in metadata}==set(trace['conclusion']['evidence_ids'])
        assert all(region['observation']['position_analysis'] for region in trace['regions'])
    finally:
        service.close()


@pytest.mark.parametrize("first_batch_label", ["PASS", "FAIL"])
def test_workbench_inspects_all_roi_and_preserves_batched_joint_evidence(dataset, mllm_api, first_batch_label):
    from pathlib import Path
    from iad_core.dataset.scanner import scan_dataset
    from iad_core.entry import sample_get
    from iad_core.workbench.audit import AuditService, VlmClient
    db, _, config=dataset
    Image.new('RGB',(6000,1800),'blue').save(Path(config.root)/'fresh.png')
    scan_dataset(config=config,db_path=db.db_path)
    client,bodies,responses=mllm_api
    responses['Tokenize'] = {'tokens_per_image':1000, 'max_model_len':26000}
    joint_calls = []
    def mark_first_batch(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/chat/completions') and body['response_format']['json_schema']['name'] == 'JointAnalysis':
            joint_calls.append(body)
            responses['VlmResult']['suggested_label'] = first_batch_label if len(joint_calls) == 1 else 'PASS'
    client.event_hooks['request'].append(mark_first_batch)
    service=AuditService(db,VlmClient(http_client=client))
    target=f'{config.dataset.id}:fresh.png'
    try:
        job=service.start(dataset_id=config.dataset.id,sample_ids=[target],model_name='test')
        service.wait(job['run_id'],30)
        status=service.status(job['run_id'])
        assert status['status']=='COMPLETED',status['errors']
        trace=sample_get({'sample_id':target},db.db_path)['suggestion']['analysis']
        assert trace['coverage']['complete']
        assert trace['coverage']['planned_regions']==trace['coverage']['inspected_regions']==16
        ids={region['image']['evidence_id'] for region in trace['regions']}
        leaves=[step for step in trace['joint_steps'] if not step['child_step_ids']]
        assert len(leaves)>1
        assert ids <= {eid for step in leaves for eid in step['input_evidence_ids']}
        assert set(trace['joint_steps'][-1]['child_step_ids'])=={step['step_id'] for step in leaves}
        assert all(step['input_evidence_ids'][0]==trace['overview']['evidence_id'] for step in trace['joint_steps'])
        assert all(len(step['input_evidence_ids'])<17 for step in trace['joint_steps'])
        assert status['completed_batches']==status['total_batches']==len(trace['joint_steps'])
        if first_batch_label == 'FAIL':
            assert trace['conclusion']['suggested_label']=='UNCERTAIN'
            assert trace['conclusion']['conflicts']
            assert trace['joint_steps'][-1]['result']['suggested_label']=='PASS'

    finally:
        service.close()


def test_workbench_rejects_unknown_visual_citation_without_saving_suggestion(dataset, mllm_api):
    from iad_core.entry import sample_get
    from iad_core.workbench.audit import AuditService, VlmClient
    db,_,config=dataset
    client,_,responses=mllm_api
    responses['VlmResult']['evidence_ids']=['invented-evidence']
    service=AuditService(db,VlmClient(http_client=client))
    target=f'{config.dataset.id}:dent.png'
    job=service.start(dataset_id=config.dataset.id,sample_ids=[target],model_name='test')
    service.wait(job['run_id'],5)
    status=service.status(job['run_id'])
    assert status['status']=='FAILED'
    assert 'unknown visual evidence' in status['errors'][0]['message']
    assert sample_get({'sample_id':target},db.db_path)['suggestion'] is None


def test_identical_roi_is_inspected_once_with_all_origins(dataset, mllm_api):
    from pathlib import Path
    from iad_core.dataset.scanner import scan_dataset
    from iad_core.entry import sample_get
    from iad_core.workbench.audit import AuditService, VlmClient
    db, _, config = dataset
    (Path(config.annotations.root) / 'dent.json').write_text(json.dumps({'imageWidth':320,'imageHeight':240,'shapes':[{'label':'dent','shape_type':'rectangle','points':[[32,24],[64,48]]}]}))
    scan_dataset(config=config, db_path=db.db_path)
    client, bodies, responses = mllm_api
    responses['GlobalAnalysis'] = {**responses['GlobalAnalysis'], 'suspect_regions':[{'bbox_1000':[100,100,200,200],'reason':'同一线索'}]}
    service = AuditService(db,VlmClient(http_client=client))
    target = f'{config.dataset.id}:dent.png'
    job = service.start(dataset_id=config.dataset.id,sample_ids=[target])
    service.wait(job['run_id'],5)
    regions = sample_get({'sample_id':target},db.db_path)['suggestion']['analysis']['regions']
    assert len(regions) == 1
    assert {origin['source'] for origin in regions[0]['origins']} == {'annotation','model'}


@pytest.mark.parametrize("invalid_response", [False, True])
def test_audit_uses_server_enforced_schema_for_roi_results(dataset, mllm_api, invalid_response):
    from iad_core.advisory.analysis import JointAnalysis
    from iad_core.entry import sample_get
    from iad_core.workbench.audit import AuditService, VlmClient
    db, _, config = dataset
    bodies = []
    view = {'description':'真实局部观察','position_analysis':'位置合理','illumination_analysis':'已考虑反光'}
    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        bodies.append(body)
        constrained = body.get('response_format', {}).get('json_schema', {})
        schema = constrained.get('schema') or json.loads(body['messages'][0]['content'][0]['text'].split('JSON Schema 的 JSON，不要 Markdown：\n')[1])
        title = schema['title']
        answer = dict(view)
        if title == 'JointAnalysis':
            metadata = [json.loads(p['text'][5:]) for p in body['messages'][0]['content'] if p['type']=='text' and p['text'].startswith('视觉证据：')]
            checks = json.loads(body['messages'][0]['content'][0]['text'].split('冻结知识：')[1].split('\n')[0])['checks']
            answer.update(suggested_label='PASS',reason_category='NORMAL',confidence=0.8,
                          check_assessments=[{**view,'check_id':check['check_id'],'status':'normal','evidence_ids':[metadata[0]['evidence_id']]} for check in checks],
                          evidence_ids=[image['evidence_id'] for image in metadata], global_view=view,
                          region_observations=[{**view,'region_index':index} for index, image in enumerate(
                              [image for image in metadata if image['role'] == 'roi' and image['representation'] == 'raw'], 1)])
            if not constrained or invalid_response:
                answer = JointAnalysis.model_json_schema()
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(answer)}}]})
    service = AuditService(db,VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    target = f'{config.dataset.id}:dent.png'
    try:
        job = service.start(dataset_id=config.dataset.id,sample_ids=[target])
        service.wait(job['run_id'],5)
        status = service.status(job['run_id'])
        detail = sample_get({'sample_id':target},db.db_path)
        if invalid_response:
            assert status['status']=='FAILED'
            assert detail['suggestion'] is None
            assert 'MLLM JointAnalysis 输出格式错误' in status['errors'][0]['message']
            assert 'description: missing' in status['errors'][0]['message']
            assert 'input_value=' not in status['errors'][0]['message']
        else:
            assert status['status']=='COMPLETED', status['errors']
            assert detail['suggestion']['analysis']['regions'][0]['observation']['description']=='真实局部观察'
        for body in bodies:
            contract = body['response_format']
            assert contract['type']=='json_schema'
            assert contract['json_schema']['strict'] is True
            assert contract['json_schema']['schema']['additionalProperties'] is False
    finally:
        service.close()


def test_default_audit_includes_every_filtered_image_across_query_pages(dataset, mllm_api):
    from iad_core.entry import sample_get
    from pathlib import Path
    from iad_core.dataset.scanner import scan_dataset
    from iad_core.workbench.audit import AuditService, VlmClient
    db, _, config = dataset
    for index in range(203):
        Image.new('RGB',(24,24),'blue').save(Path(config.root)/f'all-{index:02}.png')
    scan_dataset(config=config,db_path=db.db_path)
    client, _, _ = mllm_api
    service = AuditService(db,VlmClient(http_client=client))
    try:
        job=service.start(dataset_id=config.dataset.id,filters={'search':'all-'})
        assert job['total_samples']==203
        service.wait(job['run_id'],60)
        result=service.status(job['run_id'])
        assert result['status']=='COMPLETED',result['errors']
        assert result['completed']==203
        detail = sample_get({'sample_id': config.dataset.id + ':all-00.png'}, db.db_path)
        assert detail['consistency']['coverage']['verification']['total'] == 202
        assert detail['consistency']['coverage']['verification']['completed'] == 202
        assert detail['consistency']['results'] == []
    finally:
        service.close()


def test_joint_discovery_keeps_existing_coverage_when_adding_candidate(dataset, mllm_api):
    from iad_core.entry import sample_get
    from iad_core.workbench.audit import AuditService, VlmClient
    db, _, config = dataset
    client, bodies, responses = mllm_api
    responses['GlobalAnalysis'] = {**responses['GlobalAnalysis'], 'suspect_regions':[{'bbox_1000':[400,400,600,600], 'reason':'待验证局部'}]}
    service = AuditService(db, VlmClient(http_client=client))
    target = f'{config.dataset.id}:normal.png'
    try:
        job = service.start(dataset_id=config.dataset.id, sample_ids=[target], model_name='test')
        service.wait(job['run_id'], 10)
        assert service.status(job['run_id'])['status'] == 'COMPLETED', service.status(job['run_id'])['errors']
        trace = sample_get({'sample_id':target}, db.db_path)['suggestion']['analysis']
        assert {r['source'] for r in trace['regions']} == {'coverage', 'model'}
        assert trace['coverage']['planned_regions'] == trace['coverage']['inspected_regions'] == 2
        assert len(trace['joint_steps']) == 2
        assert len(trace['joint_steps'][-1]['input_evidence_ids']) == 2
    finally:
        service.close()


def test_joint_review_continues_until_all_new_candidates_have_actual_detail(dataset, mllm_api):
    from iad_core.entry import sample_get
    from iad_core.workbench.audit import AuditService, VlmClient
    db, _, config = dataset
    client, _, responses = mllm_api
    calls = []
    def propose(request):
        if request.url.path.endswith('/chat/completions') and json.loads(request.content)['response_format']['json_schema']['name'] == 'JointAnalysis':
            calls.append(request)
            box = [400,400,600,600] if len(calls) == 1 else [800,800,900,900]
            responses['GlobalAnalysis'] = {**responses['GlobalAnalysis'], 'suspect_regions':[{'bbox_1000':box, 'reason':'仍需补充证据'}]}
    client.event_hooks['request'].append(propose)
    service = AuditService(db, VlmClient(http_client=client))
    target = f'{config.dataset.id}:dent.png'
    try:
        job = service.start(dataset_id=config.dataset.id, sample_ids=[target], model_name='test')
        service.wait(job['run_id'], 10)
        assert service.status(job['run_id'])['status'] == 'COMPLETED'
        trace = sample_get({'sample_id':target}, db.db_path)['suggestion']['analysis']
        assert trace['coverage']['complete']
        assert trace['coverage']['planned_regions'] == trace['coverage']['inspected_regions'] == 3
        assert len(trace['joint_steps']) == 3
        assert [len(step['input_evidence_ids']) for step in trace['joint_steps']] == [3, 2, 2]
        assert trace['conclusion']['suggested_label'] == 'PASS'
        assert trace['joint_steps'][-1]['result']['suggested_label'] == 'PASS'
    finally:
        service.close()
