import json
import threading

import httpx
import pytest
from PIL import Image

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.storage.database import Database


@pytest.fixture
def dataset(tmp_path):
    images = tmp_path / "images"
    labels = tmp_path / "labels"
    images.mkdir()
    labels.mkdir()
    for name in ["normal", "normal2", "dent", "scratch"]:
        Image.new("RGB", (320, 240), "blue").save(images / f"{name}.png")
    for name in ["dent", "scratch"]:
        (labels / f"{name}.json").write_text(json.dumps({
            "imageWidth": 320, "imageHeight": 240,
            "shapes": [{"label": name, "shape_type": "rectangle", "points": [[10, 10], [30, 30]]}],
        }))
    db = Database(str(tmp_path / "test.db"))
    registry = DatasetRegistry(db)
    config = registry.import_labelme(DatasetImport(name="生产线 A", image_dir=str(images), annotation_dir=str(labels)))
    return db, registry, config


def test_import_rename_and_dataset_isolation(dataset, tmp_path):
    db, registry, config = dataset
    assert registry.get(config.dataset.id).dataset.name == "生产线 A"
    registry.rename(config.dataset.id, "线 A 复检")
    assert registry.get(config.dataset.id).dataset.name == "线 A 复检"
    with db.connection() as conn:
        assert conn.execute("SELECT count(*) FROM samples").fetchone()[0] == 4
        assert conn.execute("SELECT count(*) FROM annotations").fetchone()[0] == 2
    with pytest.raises(ValueError, match="already"):
        registry.import_labelme(DatasetImport(name="重复", image_dir=config.root, annotation_dir=config.annotations.root))


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
    from iad_core.storage.repositories import ReviewRepository
    db, registry, config = dataset
    refs = registry.references(config.dataset.id)
    assert len(refs) == 2
    assert all("normal" in sid for sid in refs)
    assert refs[0] not in registry.references(config.dataset.id, exclude=refs[0])
    ReviewRepository(db).save_decision(ReviewDecisionRecord(sample_id=refs[0], decision="FAIL"))
    assert refs[0] not in registry.references(config.dataset.id)


def test_manual_reference_selection_survives_reload_and_human_correction(dataset):
    from iad_core.storage.models import ReviewDecisionRecord
    from iad_core.storage.repositories import ReviewRepository
    db, registry, config = dataset
    selected = [f"{config.dataset.id}:dent.png"]
    registry.set_references(config.dataset.id, selected)
    reloaded = DatasetRegistry(Database(db.db_path))
    assert reloaded.references(config.dataset.id) == selected
    assert reloaded.references(config.dataset.id, exclude=selected[0]) == []
    ReviewRepository(db).save_decision(ReviewDecisionRecord(sample_id=selected[0], reviewer="alice", decision="FAIL"))
    assert reloaded.references(config.dataset.id) == []


def test_import_rejects_blank_name_before_creating_dataset(dataset):
    _, _, config = dataset
    with pytest.raises(ValueError):
        DatasetImport(name="  ", image_dir=config.root, annotation_dir=config.annotations.root)


def test_real_audit_job_uses_references_and_persists_confidence(dataset):
    from iad_core.workbench.audit import AuditService, VlmClient
    db, registry, config = dataset
    bodies = []
    patterns = {"structure": "正常胶线连续", "texture": "平整", "position_variation": "允许平移", "illumination_variation": "允许反光", "normal_allowances": ["亮度变化"], "cautions": ["细小裂纹需局部检查"]}
    view = {"description": "胶线连续", "position_analysis": "位置偏移已比较", "illumination_analysis": "高亮是反光"}
    result = {**view, "suggested_label": "FAIL", "reason_category": "SCRATCH", "confidence": 0.61, "defect_location": "bottom"}
    responses = [patterns, view, view, result, view, view, result]
    def respond(request):
        body = json.loads(request.content)
        bodies.append(body)
        answer = dict(responses[len(bodies)-1])
        if 'suggested_label' in answer:
            answer['evidence_ids'] = [json.loads(c['text'].split('视觉证据：')[1])['evidence_id'] for c in body['messages'][0]['content'] if c['type']=='text' and c['text'].startswith('视觉证据：')]
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(answer)}}]})
    client = VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond)))
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
    assert "正常胶线连续" in bodies[1]["messages"][0]["content"][0]["text"]
    assert bodies[0]["chat_template_kwargs"] == {"enable_thinking": False}
    from iad_core.advisory.repository import AuditSuggestionRepository
    suggestion = AuditSuggestionRepository(db).list_by_sample(target)[0]
    assert suggestion.confidence == 0.61
    assert len(suggestion.reference_sample_ids) == 2
    assert suggestion.audit_run_id == job["run_id"]
    assert suggestion.analysis.profile_id
    assert suggestion.analysis.regions[0].crop_bbox == [6, 6, 34, 34]
    assert suggestion.analysis.global_view.illumination_analysis == "高亮是反光"
    assert suggestion.analysis.regions[0].observation.position_analysis == "位置偏移已比较"
    from iad_core.workbench.normal import NormalProfiles
    assert NormalProfiles(db, client).current(config.dataset.id, "test-vlm").profile_id == suggestion.analysis.profile_id


def test_job_cancel_prevents_late_suggestion(dataset, mllm_api):
    from iad_core.workbench.audit import AuditService, VlmClient
    from iad_core.advisory.repository import AuditSuggestionRepository
    db, _, config = dataset
    entered, release = threading.Event(), threading.Event()
    client, _, _ = mllm_api
    def hold_roi(request):
        if '"title": "ViewAnalysis"' in json.loads(request.content)['messages'][0]['content'][0]['text']:
            entered.set()
            release.wait(5)
    client.event_hooks['request'].append(hold_roi)
    service = AuditService(db, VlmClient(http_client=client))
    target = f"{config.dataset.id}:dent.png"
    job = service.start(dataset_id=config.dataset.id, sample_ids=[target], model_name="test")
    try:
        assert entered.wait(3)
        assert service.status(job["run_id"])["phase"] == "REGIONS"
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
def test_empty_model_answer_records_failure_without_suggestion(dataset, finish_reason, content, expected):
    from iad_core.workbench.audit import AuditService, VlmClient
    from iad_core.advisory.repository import AuditSuggestionRepository
    db, _, config = dataset
    client = httpx.Client(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={
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


def test_normal_profile_reuses_learning_and_invalidates_when_references_change(dataset):
    from iad_core.workbench.normal import NormalProfiles
    from iad_core.workbench.vision import VlmClient
    db, registry, config = dataset
    calls = []
    patterns = {"structure": "连续", "texture": "平整", "position_variation": "平移", "illumination_variation": "反光", "normal_allowances": [], "cautions": []}
    def respond(request):
        calls.append(request)
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(patterns)}}]})
    client = VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond)))
    profiles = NormalProfiles(db, client)
    refs = registry.references(config.dataset.id)
    first = profiles.ensure(config.dataset.id, "test", refs)
    assert NormalProfiles(Database(db.db_path), client).ensure(config.dataset.id, "test", refs).profile_id == first.profile_id
    assert len(calls) == 1
    registry.set_references(config.dataset.id, refs[:1])
    assert profiles.current(config.dataset.id, "test") is None
    second = profiles.ensure(config.dataset.id, "test", refs[:1])
    assert second.profile_id != first.profile_id
    assert profiles.get(first.profile_id).patterns.structure == "连续"
    assert len(calls) == 2
    Image.new("RGB", (320, 240), "red").save(config.root + "/normal.png")
    assert profiles.current(config.dataset.id, "test") is None


def test_workbench_exposes_mllm_knowledge_sources_and_invalidates_changed_content(dataset):
    import os
    from pathlib import Path
    from iad_core.entry import audit_profile, sample_get
    from iad_core.workbench.audit import AuditService, VlmClient
    db, registry, config = dataset
    patterns = {"structure": "连续", "texture": "平整", "position_variation": "平移", "illumination_variation": "反光", "normal_allowances": [], "cautions": ["参考未人工确认"]}
    view = {"description": "完整", "position_analysis": "正常", "illumination_analysis": "正常"}
    responses = {"NormalPatterns": patterns, "GlobalAnalysis": view, "ViewAnalysis": view,
                 "VlmResult": {**view, "suggested_label": "PASS", "reason_category": "NORMAL", "confidence": 0.8}}
    def respond(request):
        text = json.loads(request.content)["messages"][0]["content"][0]["text"]
        schema = json.loads(text.split("JSON Schema 的 JSON，不要 Markdown：\n")[1])
        answer = dict(responses[schema['title']])
        if schema['title'] == 'VlmResult':
            answer.setdefault('evidence_ids', [json.loads(c['text'].split('视觉证据：')[1])['evidence_id'] for c in json.loads(request.content)['messages'][0]['content'] if c['type']=='text' and c['text'].startswith('视觉证据：')])
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(answer)}}]})
    service = AuditService(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    job = service.start(dataset_id=config.dataset.id, sample_ids=[f"{config.dataset.id}:dent.png"], model_name="test")
    service.wait(job['run_id'], 5)
    assert service.status(job['run_id'])['status'] == 'COMPLETED'
    detail = sample_get({'sample_id':f"{config.dataset.id}:dent.png"}, db.db_path)
    profile_id = detail['suggestion']['analysis']['profile_id']
    knowledge = audit_profile({'profile_id':profile_id}, db.db_path)['profile']
    assert knowledge['knowledge_kind'] == 'mllm_semantic'
    assert knowledge['generation_version']
    assert len(knowledge['sources']) == 2
    assert all(s['qualification'] == 'initial_unannotated' and len(s['sha256']) == 64 for s in knowledge['sources'])
    assert detail['normal_profile']['profile_id'] == profile_id
    reference = Path(config.root) / 'normal.png'
    stat = reference.stat()
    data = reference.read_bytes()
    # A valid file can change while preserving both size and timestamp.
    assert b'IDAT' in data
    reference.write_bytes(data.replace(b'IDAT', b'JUNK', 1))
    os.utime(reference, ns=(stat.st_atime_ns, stat.st_mtime_ns))
    assert audit_profile({'dataset_id': config.dataset.id, 'model_name':'test'}, db.db_path)['profile'] is None
    assert audit_profile({'profile_id':profile_id}, db.db_path)['profile']['patterns']['structure'] == '连续'


@pytest.fixture
def mllm_api():
    bodies = []
    patterns = {"structure": "连续", "texture": "平整", "position_variation": "允许平移", "illumination_variation": "允许反光", "normal_allowances": [], "cautions": []}
    view = {"description": "可观察证据", "position_analysis": "位置合理", "illumination_analysis": "反光已核实"}
    responses = {"NormalPatterns": patterns, "GlobalAnalysis": view, "ViewAnalysis": view,
                 "VlmResult": {**view, "suggested_label": "PASS", "reason_category": "NORMAL", "confidence": 0.8}}
    def respond(request):
        body = json.loads(request.content); bodies.append(body)
        schema = json.loads(body['messages'][0]['content'][0]['text'].split("JSON Schema 的 JSON，不要 Markdown：\n")[1])
        answer = dict(responses[schema['title']])
        if schema['title'] == 'VlmResult':
            answer.setdefault('evidence_ids', [json.loads(c['text'].split('视觉证据：')[1])['evidence_id'] for c in json.loads(request.content)['messages'][0]['content'] if c['type']=='text' and c['text'].startswith('视觉证据：')])
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(answer)}}]})
    return httpx.Client(transport=httpx.MockTransport(respond)), bodies, responses


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


def test_workbench_final_verdict_receives_global_and_roi_images(dataset, mllm_api):
    from iad_core.entry import sample_get
    from iad_core.workbench.audit import AuditService, VlmClient
    db, _, config = dataset
    client, bodies, _ = mllm_api
    service=AuditService(db,VlmClient(http_client=client))
    target=f'{config.dataset.id}:dent.png'
    job=service.start(dataset_id=config.dataset.id,sample_ids=[target],model_name='test')
    service.wait(job['run_id'],5)
    detail=sample_get({'sample_id':target},db.db_path)
    final=next(body for body in reversed(bodies) if '"title": "VlmResult"' in body['messages'][0]['content'][0]['text'])
    parts=final['messages'][0]['content']
    assert len([part for part in parts if part['type']=='image_url'])==2
    assert '已学习的良品模式' in parts[0]['text']
    trace=detail['suggestion']['analysis']
    available={trace['overview']['evidence_id'],trace['regions'][0]['image']['evidence_id']}
    assert set(trace['conclusion']['evidence_ids'])==available
    assert detail['sample']['quality_status']=='UNCERTAIN'


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
    joint_calls = []
    def mark_first_batch(request):
        body = json.loads(request.content)
        if body['response_format']['json_schema']['name'] == 'VlmResult':
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


def test_reference_change_during_learning_does_not_save_stale_knowledge(dataset):
    from pathlib import Path
    from iad_core.workbench.audit import AuditService, VlmClient
    db, _, config = dataset
    def respond(request):
        Image.new('RGB',(320,240),'red').save(Path(config.root)/'normal.png')
        patterns = {'structure':'连续','texture':'平整','position_variation':'平移','illumination_variation':'反光','normal_allowances':[],'cautions':[]}
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(patterns)}}]})
    service = AuditService(db,VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    job=service.start(dataset_id=config.dataset.id,sample_ids=[f'{config.dataset.id}:dent.png'])
    service.wait(job['run_id'],5)
    assert service.status(job['run_id'])['status']=='FAILED'
    assert 'Reference images changed' in service.status(job['run_id'])['errors'][0]['message']
    with db.connection() as conn:
        assert conn.execute('SELECT COUNT(*) FROM normal_profiles').fetchone()[0]==0


@pytest.mark.parametrize("invalid_response", [False, True])
def test_audit_uses_server_enforced_schema_for_roi_results(dataset, invalid_response):
    from iad_core.advisory.analysis import ViewAnalysis
    from iad_core.entry import sample_get
    from iad_core.workbench.audit import AuditService, VlmClient
    db, _, config = dataset
    bodies = []
    patterns = {'structure':'连续','texture':'平整','position_variation':'平移','illumination_variation':'反光','normal_allowances':[],'cautions':[]}
    view = {'description':'真实局部观察','position_analysis':'位置合理','illumination_analysis':'已考虑反光'}
    def respond(request):
        body = json.loads(request.content)
        bodies.append(body)
        constrained = body.get('response_format', {}).get('json_schema', {})
        schema = constrained.get('schema') or json.loads(body['messages'][0]['content'][0]['text'].split('JSON Schema 的 JSON，不要 Markdown：\n')[1])
        title = schema['title']
        answer = dict(patterns if title == 'NormalPatterns' else view)
        if title == 'ViewAnalysis' and (not constrained or invalid_response):
            answer = ViewAnalysis.model_json_schema()
        if title == 'VlmResult':
            answer.update(suggested_label='PASS',reason_category='NORMAL',confidence=0.8,evidence_ids=[json.loads(p['text'][5:])['evidence_id'] for p in body['messages'][0]['content'] if p['type']=='text' and p['text'].startswith('视觉证据：')])
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
            assert 'MLLM ViewAnalysis 输出格式错误' in status['errors'][0]['message']
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
    finally:
        service.close()
