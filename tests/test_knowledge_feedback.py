import json
import threading
from pathlib import Path

import httpx
import pytest
from PIL import Image, ImageDraw

from iad_core.entry import dataset_scan, knowledge_get, sample_get
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.fixture
def feedback_workbench(knowledge_dataset):
    db, config = knowledge_dataset
    sample_ids = [config.dataset.id + f':part-{index}.png' for index in range(6)]
    path = Path(config.root) / 'part-5.png'
    with Image.open(path) as image:
        ImageDraw.Draw(image).rectangle((90, 110, 110, 130), fill='red')
        image.save(path)
    dataset_scan({'dataset_id': config.dataset.id}, db.db_path)
    before = sample_get({'sample_id': sample_ids[-1]}, db.db_path)
    normal = None
    verified = []
    responses = {'judgment_status': 'supported', 'include_finding': True}
    view = {'description': '孔内有色差', 'position_analysis': '主体左孔', 'illumination_analysis': '需排除反光'}

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        evidence = [json.loads(part['text'][5:]) for part in content
                    if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        kind = body['response_format']['json_schema']['name']
        if kind == 'JointAnalysis':
            result = {**view, 'suggested_label': 'UNCERTAIN', 'reason_category': 'APPEARANCE', 'confidence': .6,
                'evidence_ids': [item['evidence_id'] for item in evidence], 'global_view': view,
                'region_observations': [{**view, 'region_index': index} for index, item in enumerate(
                    [item for item in evidence if item['role'] == 'roi'], 1)],
                'check_assessments': [{**view, 'check_id': normal['checks'][0]['check_id'], 'status': 'insufficient',
                    'evidence_ids': [evidence[0]['evidence_id']]}],
                'findings': [{'check_ids': [normal['checks'][0]['check_id']],
                    'location': {'scope': 'local', 'bbox': [85, 105, 115, 135], 'description': '左孔内'},
                    'description': '左孔颜色不同', 'hypothesis': '可能有覆盖物', 'normal_explanation': '可能是反光',
                    'review_action': '核对原始像素', 'priority': 'high', 'evidence_ids': [evidence[0]['evidence_id']]}]}
            if not responses['include_finding']:
                result['findings'] = []
            elif 'location' in responses:
                result['findings'][0]['location'] = responses['location']
        elif kind == 'KnowledgeVerification':
            payload = json.loads(content[0]['text'].split('待核验疑点：', 1)[1].split('\n请根据图像', 1)[0])
            verified.extend(payload['findings'])
            comparison = next(item for item in evidence if item['role'] == 'normal')
            result = {'findings': []}
            for target in payload['findings']:
                raw = next(region['image'] for region in target['regions'] if region['image']['representation'] == 'raw')
                result['findings'].append({'finding_id': target['finding_id'], 'status': responses['judgment_status'],
                    'affected_check_titles': ['孔内外观'], 'description': '真实局部支持遮挡疑点',
                    'normal_explanation': '已结合全图比较光照', 'limitations': ['仍需人工确认'],
                    'evidence_ids': [raw['evidence_id'], comparison['evidence_id']], 'conflicts': []})
        else:
            defect = '已核验异常' in content[0]['text']
            result = {'summary': '孔内外观', 'checks': [{
                'title': '孔内遮挡' if defect else '孔内外观', 'subject': '孔', 'location': '左侧',
                'criterion': '孔内出现覆盖区域' if defect else '孔内可见背景', 'allowed_variations': ['光照'],
                'support_evidence_ids': [item['evidence_id'] for item in evidence if not defect or item['role'] == 'roi'],
                'counter_evidence_ids': [], 'limitations': [], 'status': 'supported',
            }], 'suspects': [], 'limitations': []}
            if normal and not defect:
                result['revisions'] = [{'previous_check_id': normal['checks'][0]['check_id'],
                    'current_check_titles': ['孔内外观'], 'reason': '增加来源并重新核验相同判据'}]
        return httpx.Response(200, json={'choices': [{'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.knowledge.start(dataset_id=config.dataset.id, kind='normal', sample_ids=sample_ids[:3])
        runtime.knowledge.wait(job['run_id'], 5)
        assert runtime.knowledge.status(job['run_id'])['status'] == 'COMPLETED'
        normal = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
        audit = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=sample_ids[-1:])
        runtime.audit.wait(audit['run_id'], 5)
        assert runtime.audit.status(audit['run_id'])['status'] == 'COMPLETED'
        advice = sample_get({'sample_id': sample_ids[-1]}, db.db_path)['suggestion']
        assert knowledge_get({'dataset_id': config.dataset.id, 'kind': 'defect'}, db.db_path)['knowledge'] is None
        yield db, config, sample_ids, before, normal, advice, runtime, verified, responses
    finally:
        runtime.close()


@pytest.mark.parametrize('mining_kind', ['defect', 'normal'])
@pytest.mark.parametrize('judgment_status', ['supported', 'refuted', 'insufficient'])
def test_unannotated_audit_finding_is_reverified_before_supporting_knowledge(feedback_workbench, mining_kind, judgment_status):
    db, config, sample_ids, before, normal, advice, runtime, verified, responses = feedback_workbench
    responses['judgment_status'] = judgment_status
    args = {'normal_version_id': normal['version_id']} if mining_kind == 'defect' else {'sample_ids': sample_ids[-1:]}
    job = runtime.knowledge.start(dataset_id=config.dataset.id, kind=mining_kind, **args)
    runtime.knowledge.wait(job['run_id'], 5)
    status = runtime.knowledge.status(job['run_id'])
    assert status['status'] == 'COMPLETED', status
    snapshot = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
    source = next(item for item in snapshot['sources'] if item['sample_id'] == sample_ids[-1])
    assert source['qualification'] == ('audit_suspect' if mining_kind == 'defect' else 'initial_unannotated')
    assert source['audit_suggestion_ids'] == [advice['suggestion_id']]
    finding, = snapshot['findings']
    assert finding['origin_suggestion_id'] == advice['suggestion_id']
    assert finding['origin_finding_id'] == advice['analysis']['findings'][0]['finding_id']
    assert finding['audit_finding'] == advice['analysis']['findings'][0]
    assert finding['bbox'] == [85, 105, 115, 135]
    assert verified[0]['origin_suggestion_id'] == advice['suggestion_id']
    assert finding['regions'][0]['crop_bbox'] == [79, 99, 121, 141]
    assert finding['judgment']['status'] == judgment_status
    if mining_kind == 'defect':
        assert snapshot['checks'][0]['status'] == ('supported' if judgment_status == 'supported' else 'provisional')
        assert snapshot['checks'][0]['finding_ids'] == ([finding['finding_id']] if judgment_status == 'supported' else [])
        if judgment_status != 'supported':
            assert snapshot['checks'][0]['support_evidence_ids'] == []
    else:
        contaminated = {item['image']['evidence_id'] for item in snapshot['evidence'] if item['sample_id'] == sample_ids[-1]}
        assert snapshot['checks'][0]['status'] == ('conflicted' if judgment_status == 'insufficient' else 'supported')
        if judgment_status == 'refuted':
            assert contaminated.intersection(snapshot['checks'][0]['support_evidence_ids'])
            assert '已结合全图比较光照' in snapshot['checks'][0]['allowed_variations']
        else:
            assert not contaminated.intersection(snapshot['checks'][0]['support_evidence_ids'])
            assert contaminated.intersection(snapshot['checks'][0]['counter_evidence_ids'])
        assert snapshot['checks'][0]['check_id'] == normal['checks'][0]['check_id']
    assert knowledge_get({'version_id': normal['version_id']}, db.db_path)['knowledge'] == normal
    after = sample_get({'sample_id': sample_ids[-1]}, db.db_path)
    assert after['suggestion'] == advice
    assert after['annotations'] == before['annotations']
    assert after['review_decision'] == before['review_decision']


def test_changed_image_cannot_reuse_an_old_audit_as_a_knowledge_candidate(feedback_workbench):
    db, config, sample_ids, _, normal, advice, runtime, _, _ = feedback_workbench
    path = Path(config.root) / 'part-5.png'
    with Image.open(path) as image:
        image.putpixel((90, 110), (0, 255, 0))
        image.save(path)
    dataset_scan({'dataset_id': config.dataset.id}, db.db_path)
    with pytest.raises(ValueError, match='eligible knowledge sources'):
        runtime.knowledge.start(dataset_id=config.dataset.id, kind='defect', normal_version_id=normal['version_id'])
    assert sample_get({'sample_id': sample_ids[-1]}, db.db_path)['suggestion'] == advice
    assert knowledge_get({'dataset_id': config.dataset.id, 'kind': 'defect'}, db.db_path)['knowledge'] is None


def test_new_audit_omission_cannot_erase_an_unresolved_knowledge_candidate(feedback_workbench):
    db, config, sample_ids, _, normal, advice, runtime, _, responses = feedback_workbench
    first = runtime.knowledge.start(dataset_id=config.dataset.id, kind='normal', sample_ids=sample_ids[-1:])
    runtime.knowledge.wait(first['run_id'], 5)
    initial = knowledge_get({'version_id': runtime.knowledge.status(first['run_id'])['knowledge_version_id']}, db.db_path)['knowledge']
    assert len(initial['findings']) == 1
    responses['include_finding'] = False
    audit = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=sample_ids[-1:])
    runtime.audit.wait(audit['run_id'], 5)
    assert runtime.audit.status(audit['run_id'])['status'] == 'COMPLETED'
    latest = sample_get({'sample_id': sample_ids[-1]}, db.db_path)['suggestion']
    assert latest['suggestion_id'] != advice['suggestion_id']
    assert latest['analysis']['findings'] == []
    second = runtime.knowledge.start(dataset_id=config.dataset.id, kind='normal', sample_ids=sample_ids[-1:])
    runtime.knowledge.wait(second['run_id'], 5)
    status = runtime.knowledge.status(second['run_id'])
    assert status['status'] == 'COMPLETED', status
    current = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
    assert current['version_id'] == initial['version_id']
    assert current['findings'] == initial['findings']
    assert next(item for item in current['sources'] if item['sample_id'] == sample_ids[-1])['audit_suggestion_ids'] == [advice['suggestion_id']]
    assert knowledge_get({'version_id': initial['version_id']}, db.db_path)['knowledge'] == initial


def test_new_audit_during_mining_cannot_publish_a_mixed_candidate_snapshot(feedback_workbench):
    db, config, sample_ids, _, normal, _, runtime, _, responses = feedback_workbench
    entered, release = threading.Event(), threading.Event()

    def pause_verification(request):
        body = json.loads(request.content)
        if (request.url.path.endswith('/chat/completions')
                and body['response_format']['json_schema']['name'] == 'KnowledgeVerification'):
            entered.set()
            assert release.wait(5)

    runtime.client.client.event_hooks['request'].append(pause_verification)
    try:
        mining = runtime.knowledge.start(dataset_id=config.dataset.id, kind='defect', normal_version_id=normal['version_id'])
        assert entered.wait(3)
        audit = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=sample_ids[-1:])
        runtime.audit.wait(audit['run_id'], 5)
        assert runtime.audit.status(audit['run_id'])['status'] == 'COMPLETED'
    finally:
        release.set()
    runtime.knowledge.wait(mining['run_id'], 5)
    status = runtime.knowledge.status(mining['run_id'])
    assert status['status'] == 'FAILED', status
    assert 'sources changed' in status['errors'][0]['message']
    assert knowledge_get({'dataset_id': config.dataset.id, 'kind': 'defect'}, db.db_path)['knowledge'] is None


def test_later_versions_keep_one_audit_candidate_identity_across_both_mining_kinds(feedback_workbench):
    db, config, sample_ids, _, _, advice, runtime, _, _ = feedback_workbench
    snapshots = []
    for additions in [sample_ids[-1:], sample_ids[3:4]]:
        job = runtime.knowledge.start(dataset_id=config.dataset.id, kind='normal', sample_ids=additions)
        runtime.knowledge.wait(job['run_id'], 5)
        status = runtime.knowledge.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        snapshot = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
        finding, = snapshot['findings']
        assert finding['origin_suggestion_id'] == advice['suggestion_id']
        assert finding['origin_finding_id'] == advice['analysis']['findings'][0]['finding_id']
        snapshots.append(snapshot)
    assert snapshots[1]['findings'][0]['finding_id'] == snapshots[0]['findings'][0]['finding_id']
    job = runtime.knowledge.start(dataset_id=config.dataset.id, kind='defect', normal_version_id=snapshots[1]['version_id'])
    runtime.knowledge.wait(job['run_id'], 5)
    status = runtime.knowledge.status(job['run_id'])
    assert status['status'] == 'COMPLETED', status
    defect = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
    finding, = defect['findings']
    assert finding['origin_finding_id'] == advice['analysis']['findings'][0]['finding_id']
    assert finding['origin_suggestion_id'] == advice['suggestion_id']


def test_successor_accumulates_new_audit_sources_without_forgetting_existing_candidates(feedback_workbench):
    db, config, sample_ids, _, normal, advice, runtime, _, _ = feedback_workbench
    first = runtime.knowledge.start(dataset_id=config.dataset.id, kind='normal', sample_ids=sample_ids[-1:])
    runtime.knowledge.wait(first['run_id'], 5)
    previous = knowledge_get({'version_id': runtime.knowledge.status(first['run_id'])['knowledge_version_id']}, db.db_path)['knowledge']
    audit = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=sample_ids[-1:])
    runtime.audit.wait(audit['run_id'], 5)
    latest = sample_get({'sample_id': sample_ids[-1]}, db.db_path)['suggestion']
    assert latest['suggestion_id'] != advice['suggestion_id']
    second = runtime.knowledge.start(dataset_id=config.dataset.id, kind='normal', sample_ids=sample_ids[-1:])
    runtime.knowledge.wait(second['run_id'], 5)
    status = runtime.knowledge.status(second['run_id'])
    assert status['status'] == 'COMPLETED', status
    current = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
    assert current['parent_version_id'] == previous['version_id']
    assert {item['origin_suggestion_id'] for item in current['findings']} == {advice['suggestion_id'], latest['suggestion_id']}
    source = next(item for item in current['sources'] if item['sample_id'] == sample_ids[-1])
    assert set(source['audit_suggestion_ids']) == {advice['suggestion_id'], latest['suggestion_id']}
    assert knowledge_get({'version_id': previous['version_id']}, db.db_path)['knowledge'] == previous


def test_global_relationship_candidate_keeps_its_scope_during_knowledge_verification(feedback_workbench):
    db, config, sample_ids, _, normal, _, runtime, _, responses = feedback_workbench
    responses['location'] = {'scope': 'global', 'bbox': None, 'description': '双孔与主体的整体关系'}
    audit = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=sample_ids[-1:])
    runtime.audit.wait(audit['run_id'], 5)
    assert runtime.audit.status(audit['run_id'])['status'] == 'COMPLETED'
    advice = sample_get({'sample_id': sample_ids[-1]}, db.db_path)['suggestion']
    mining = runtime.knowledge.start(dataset_id=config.dataset.id, kind='defect', normal_version_id=normal['version_id'])
    runtime.knowledge.wait(mining['run_id'], 5)
    status = runtime.knowledge.status(mining['run_id'])
    assert status['status'] == 'COMPLETED', status
    snapshot = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
    finding, = [item for item in snapshot['findings'] if item['origin_suggestion_id'] == advice['suggestion_id']]
    assert finding['audit_finding']['location'] == responses['location']
    assert finding['bbox'] == [0, 0, 320, 240]
    assert finding['regions'][0]['crop_bbox'] == [0, 0, 320, 240]
