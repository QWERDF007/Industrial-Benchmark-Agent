import json
import pytest
from PIL import Image

from iad_core.entry import audit_evidence, dataset_scan, knowledge_get, sample_get
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


def test_audit_findings_keep_actual_local_and_global_evidence_without_writing_human_truth(dataset, mllm_api):
    db, _, config = dataset
    client, _, responses = mllm_api
    target = config.dataset.id + ':dent.png'
    before = sample_get({'sample_id': target}, db.db_path)
    check_id = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']['checks'][0]['check_id']
    responses['VlmResult'].update(suggested_label='FAIL', description='请复核主体左上角色差，并核对整体对称性。')

    def reply(request):
        if not request.url.path.endswith('/chat/completions'):
            return
        content = json.loads(request.content)['messages'][0]['content']
        views = [json.loads(part['text'][5:]) for part in content if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        roi = next(view for view in views if view['role'] == 'roi' and view['representation'] == 'raw')
        responses['Findings'] = [{
            'check_ids': [check_id], 'location': {'scope': 'local', 'bbox': [10, 10, 30, 30], 'description': '主体左上角'},
            'description': '局部颜色不均', 'hypothesis': '可能有异色污染',
            'normal_explanation': '也可能是局部反光', 'limitations': ['无法判断材质'],
            'review_action': '对照全图与原始局部，核对反光方向', 'priority': 'high',
            'evidence_ids': [views[0]['evidence_id'], roi['evidence_id']],
        }, {
            'check_ids': [check_id], 'location': {'scope': 'global', 'bbox': None, 'description': '整体结构'},
            'description': '整体分布不对称', 'hypothesis': '可能有部件偏移',
            'normal_explanation': '拍摄角度可能造成透视', 'limitations': ['缺少正视角'],
            'review_action': '核对相机角度与结构关系', 'priority': 'medium',
            'evidence_ids': [views[0]['evidence_id']],
        }]

    client.event_hooks['request'].append(reply)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        assert runtime.audit.status(job['run_id'])['status'] == 'COMPLETED'
        after = sample_get({'sample_id': target}, db.db_path)
        analysis = after['suggestion']['analysis']
        assert analysis['conclusion']['description'] == '请复核主体左上角色差，并核对整体对称性。'
        assert len(analysis['findings']) == 2
        local, global_finding = analysis['findings']
        assert local['finding_id'].startswith('finding_')
        assert local['finding_id'] != global_finding['finding_id']
        assert local['check_ids'] == [check_id]
        assert local['location']['bbox'] == [10, 10, 30, 30]
        assert local['normal_explanation'] == '也可能是局部反光'
        assert local['review_action'] == '对照全图与原始局部，核对反光方向'
        assert global_finding['location']['bbox'] is None
        assert analysis['joint_steps'][-1]['result']['findings'][0]['description'] == local['description']
        media = audit_evidence({'suggestion_id': after['suggestion']['suggestion_id'], 'evidence_id': local['evidence_ids'][1]}, db.db_path)
        with Image.open(media['path']) as image:
            assert image.size == (28, 28)
        assert after['annotations'] == before['annotations']
        assert after['review_decision'] == before['review_decision']
    finally:
        runtime.close()


@pytest.mark.parametrize('case,error', [
    ('unknown_check', 'unknown check'),
    ('unknown_evidence', 'unknown visual evidence'),
    ('mask_only', 'raw visual evidence'),
    ('outside_image', 'outside the original image'),
    ('reversed_box', 'outside the original image'),
    ('unrelated_crop', 'does not cover the finding'),
    ('global_without_overview', 'requires overview evidence'),
    ('missing_anomaly', 'must explain every anomalous check'),
    ('local_without_box', 'findings.0.location.local.bbox: missing'),
])
def test_finding_cannot_claim_unrelated_or_nonexistent_visual_evidence(dataset, mllm_api, case, error):
    db, _, config = dataset
    client, _, responses = mllm_api
    check_id = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']['checks'][0]['check_id']

    def reply(request):
        if not request.url.path.endswith('/chat/completions'):
            return
        content = json.loads(request.content)['messages'][0]['content']
        views = [json.loads(part['text'][5:]) for part in content if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        roi = next(view for view in views if view['role'] == 'roi' and view['representation'] == 'raw')
        finding = {'check_ids': [check_id], 'location': {'scope': 'local', 'bbox': [10, 10, 30, 30], 'description': '左上角'},
            'description': '可见色差', 'hypothesis': '污染', 'normal_explanation': '反光',
            'review_action': '核对照明', 'priority': 'high', 'evidence_ids': [roi['evidence_id']]}
        if case == 'unknown_check':
            finding['check_ids'] = ['not_a_frozen_check']
        elif case == 'unknown_evidence':
            finding['evidence_ids'] = ['not_observed']
        elif case == 'mask_only':
            finding['evidence_ids'] = [next(view['evidence_id'] for view in views if view['representation'] == 'annotation_mask')]
        elif case == 'outside_image':
            finding['location']['bbox'] = [10, 10, 500, 500]
        elif case == 'reversed_box':
            finding['location']['bbox'] = [30, 30, 10, 10]
        elif case == 'unrelated_crop':
            finding['location']['bbox'] = [100, 100, 120, 120]
        elif case == 'global_without_overview':
            finding['location'].update(scope='global', bbox=None)
        elif case == 'local_without_box':
            del finding['location']['bbox']
        responses['Findings'] = [] if case == 'missing_anomaly' else [finding]
        if case == 'missing_anomaly':
            responses['CheckAssessments'] = [{**responses['ViewAnalysis'], 'check_id': check_id,
                'status': 'anomaly', 'evidence_ids': [roi['evidence_id']]}]

    client.event_hooks['request'].append(reply)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    target = config.dataset.id + ':dent.png'
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'FAILED', status
        assert error in status['errors'][0]['message']
        assert sample_get({'sample_id': target}, db.db_path)['suggestion'] is None
    finally:
        runtime.close()


def test_child_batch_finding_survives_a_later_summary_that_omits_it(dataset, mllm_api):
    db, _, config = dataset
    client, _, responses = mllm_api
    Image.new('RGB', (6000, 1800), 'blue').save(config.root + '/large.png')
    dataset_scan({'dataset_id': config.dataset.id}, db.db_path)
    check_id = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']['checks'][0]['check_id']
    responses['Tokenize'] = {'tokens_per_image': 1000, 'max_model_len': 26000}
    calls = []

    def reply(request):
        if request.url.path.endswith('/chat/completions'):
            content = json.loads(request.content)['messages'][0]['content']
            overview = next(json.loads(part['text'][5:]) for part in content if part['type'] == 'text' and part['text'].startswith('视觉证据：'))
            calls.append(content)
            responses['Findings'] = [] if len(calls) > 1 else [{
                'check_ids': [check_id], 'location': {'scope': 'local', 'bbox': [100, 100, 120, 120], 'description': '左上部'},
                'description': '局部异色', 'hypothesis': '可能污染', 'normal_explanation': '需排除反光',
                'review_action': '检查局部原图', 'priority': 'high', 'evidence_ids': [overview['evidence_id']],
            }]

    client.event_hooks['request'].append(reply)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[config.dataset.id + ':large.png'])
        runtime.audit.wait(job['run_id'], 10)
        assert runtime.audit.status(job['run_id'])['status'] == 'COMPLETED'
        analysis = sample_get({'sample_id': config.dataset.id + ':large.png'}, db.db_path)['suggestion']['analysis']
        assert len(calls) == 3
        assert analysis['joint_steps'][-1]['result']['findings'] == []
        assert len(analysis['findings']) == 1
        assert analysis['findings'][0]['description'] == '局部异色'
        assert analysis['findings'][0]['source_step_ids'] == ['joint_1']
        assert analysis['conclusion']['suggested_label'] == 'UNCERTAIN'
    finally:
        runtime.close()


@pytest.mark.parametrize('mode,reference_step,repeat,error,expected', [
    ('refine', 'joint_1', 1, None, 'FAIL'),
    ('resolve', 'joint_1', 1, None, 'PASS'),
    ('refine', 'not_observed', 1, 'unknown pending finding', None),
    ('refine', 'joint_1', 2, 'more than one transition', None),
    ('resolve', 'not_observed', 1, 'unknown pending finding', None),
])
def test_followup_updates_or_resolves_the_same_finding_using_its_actual_source(dataset, mllm_api, mode, reference_step, repeat, error, expected):
    db, _, config = dataset
    client, _, responses = mllm_api
    check_id = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']['checks'][0]['check_id']
    calls = []

    def reply(request):
        if not request.url.path.endswith('/chat/completions'):
            return
        content = json.loads(request.content)['messages'][0]['content']
        views = [json.loads(part['text'][5:]) for part in content if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        calls.append(views)
        detail = len(calls) > 1
        roi = next(view for view in views if view['role'] == 'roi' and view['representation'] == 'raw')
        reference = {'step_id': reference_step, 'finding_index': 1}
        responses['VlmResult']['suggested_label'] = 'PASS' if detail and mode == 'resolve' else 'FAIL'
        responses['GlobalAnalysis'] = {**responses['ViewAnalysis'], 'suspect_regions': [] if detail else [
            {'bbox_1000': [0, 0, 200, 200], 'reason': '需要更大邻域排除反光', 'check_ids': [check_id]}]}
        finding = {'check_ids': [check_id],
            'location': {'scope': 'local', 'bbox': [12, 12, 28, 28] if detail else [10, 10, 30, 30], 'description': '左上角'},
            'description': '更大邻域可见小块异色' if detail else '局部疑似异色', 'hypothesis': '可能污染',
            'normal_explanation': '需排除反光', 'limitations': [], 'review_action': '核对实际局部',
            'priority': 'medium' if detail else 'high', 'evidence_ids': [views[0]['evidence_id'], roi['evidence_id']]}
        if detail:
            finding['related_findings'] = [reference] * repeat
        responses['Findings'] = [] if detail and mode == 'resolve' else [finding]
        responses['ResolvedFindings'] = [{'related_findings': [reference], 'description': '更大邻域显示连续反光，原异色疑点已排除',
            'normal_explanation': '与周围光照方向一致', 'evidence_ids': [views[0]['evidence_id'], roi['evidence_id']]}] if detail and mode == 'resolve' else []

    client.event_hooks['request'].append(reply)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    target = config.dataset.id + ':dent.png'
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        if error:
            assert status['status'] == 'FAILED'
            assert error in status['errors'][0]['message']
            assert sample_get({'sample_id': target}, db.db_path)['suggestion'] is None
            return
        assert status['status'] == 'COMPLETED', status
        analysis = sample_get({'sample_id': target}, db.db_path)['suggestion']['analysis']
        assert len(calls) == 2
        assert analysis['conclusion']['suggested_label'] == expected
        if mode == 'refine':
            finding, = analysis['findings']
            assert analysis['joint_steps'][0]['result']['findings'][0]['location']['bbox'] == [10, 10, 30, 30]
            assert finding['location']['bbox'] == [12, 12, 28, 28]
            assert finding['source_step_ids'] == ['joint_1', 'joint_2']
            assert finding['priority'] == 'high'
            assert set(analysis['joint_steps'][0]['result']['findings'][0]['evidence_ids']) <= set(finding['evidence_ids'])
        else:
            assert analysis['findings'] == []
            assert analysis['joint_steps'][1]['result']['resolved_findings'][0]['normal_explanation'] == '与周围光照方向一致'
    finally:
        runtime.close()
