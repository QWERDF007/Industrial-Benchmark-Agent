import json
import threading
from pathlib import Path

import httpx
import pytest
from PIL import Image, ImageDraw

from iad_core.entry import audit_evidence, knowledge_get, sample_get
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


def test_audit_requires_learned_knowledge_before_creating_a_job(knowledge_dataset):
    db, config = knowledge_dataset
    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(
        lambda _: pytest.fail('缺少知识时不应调用模型')))))
    try:
        with pytest.raises(ValueError, match='请先挖掘'):
            runtime.audit.start(dataset_id=config.dataset.id)
        assert runtime.audit.list(config.dataset.id) == []
    finally:
        runtime.close()


def test_audit_rejects_cross_dataset_knowledge_and_wrong_kind(dataset, mllm_api, tmp_path):
    from iad_core.entry import dataset_import
    db, _, config = dataset
    client, _, _ = mllm_api
    normal = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
    images, labels = tmp_path / 'other-images', tmp_path / 'other-labels'
    images.mkdir()
    labels.mkdir()
    Image.new('RGB', (40, 40), 'gray').save(images / 'other.png')
    other = dataset_import({'name': '另一产品', 'image_dir': str(images), 'annotation_dir': str(labels)}, db.db_path)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    try:
        with pytest.raises(ValueError, match='同数据集良品知识'):
            runtime.audit.start(dataset_id=other['dataset_id'], normal_version_id=normal['version_id'])
        with pytest.raises(ValueError, match='不良知识必须'):
            runtime.audit.start(dataset_id=config.dataset.id, defect_version_id=normal['version_id'])
        assert runtime.audit.list(config.dataset.id) == []
        assert runtime.audit.list(other['dataset_id']) == []
    finally:
        runtime.close()


def test_missing_frozen_visual_support_fails_without_saving_a_suggestion(dataset, mllm_api):
    from iad_core.entry import knowledge_evidence
    db, _, config = dataset
    client, bodies, _ = mllm_api
    normal = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
    evidence = normal['evidence'][0]['image']
    media = knowledge_evidence({'version_id': normal['version_id'], 'evidence_id': evidence['evidence_id']}, db.db_path)
    Path(media['path']).write_bytes(b'changed content')
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    target = config.dataset.id + ':dent.png'
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 3)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'FAILED'
        assert 'Visual evidence is missing or its content changed' in status['errors'][0]['message']
        assert sample_get({'sample_id': target}, db.db_path)['suggestion'] is None
        assert len(bodies) == 1
    finally:
        runtime.close()


def test_operator_audits_using_frozen_learned_rules_without_relearning(knowledge_dataset, finding_response):
    db, config = knowledge_dataset
    target = config.dataset.id + ':part-2.png'
    with Image.open(config.root + '/part-2.png') as image:
        ImageDraw.Draw(image).rectangle((90, 110, 110, 130), fill='red')
        image.save(config.root + '/part-2.png')
    calls = []

    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        content = body['messages'][0]['content']
        images = [json.loads(item['text'][5:]) for item in content if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        kind = body['response_format']['json_schema']['name']
        calls.append((kind, images, content[0]['text']))
        if kind == 'KnowledgeDraft':
            result = {'summary': '孔内可见背景', 'checks': [{
                'title': '孔内外观', 'subject': '孔', 'location': '主体中部', 'criterion': '孔内部可见背景',
                'allowed_variations': ['均匀亮度变化'], 'support_evidence_ids': [image['evidence_id'] for image in images],
                'counter_evidence_ids': [], 'limitations': [], 'status': 'supported',
            }], 'suspects': [], 'limitations': [], 'revisions': []}
        else:
            assert kind == 'JointAnalysis'
            view = {'description': '孔内红色区域遮挡背景', 'position_analysis': '位于主体左孔', 'illumination_analysis': '需排除有色反光'}
            checks = json.loads(content[0]['text'].split('冻结知识：')[1].split('\n')[0])['checks']
            result = {**view, 'suggested_label': 'FAIL', 'reason_category': 'OCCLUSION', 'confidence': 0.7,
                'evidence_ids': [image['evidence_id'] for image in images], 'global_view': view,
                'check_assessments': [{**view, 'check_id': check['check_id'], 'status': 'anomaly', 'evidence_ids': [images[0]['evidence_id']]} for check in checks],
                'findings': [{**finding_response, 'check_ids': [check['check_id'] for check in checks], 'evidence_ids': [images[0]['evidence_id']]}],
                'region_observations': [{**view, 'region_index': index} for index in range(1, len(images))]}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        mining = runtime.knowledge.start(dataset_id=config.dataset.id, kind='normal', sample_ids=[config.dataset.id + ':part-0.png', config.dataset.id + ':part-1.png'])
        runtime.knowledge.wait(mining['run_id'], 5)
        normal = knowledge_get({'version_id': runtime.knowledge.status(mining['run_id'])['knowledge_version_id']}, db.db_path)['knowledge']
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target], normal_version_id=normal['version_id'])
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        analysis = sample_get({'sample_id': target}, db.db_path)['suggestion']['analysis']
        assert analysis['normal_version_id'] == normal['version_id']
        assert analysis['defect_version_id'] is None
        assert status['normal_version_id'] == normal['version_id']
        assert analysis['conclusion']['suggested_label'] == 'FAIL'
        assert [kind for kind, _, _ in calls] == ['KnowledgeDraft', 'JointAnalysis']
        assert [image['role'] for image in calls[-1][1]] == ['overview', 'roi']
        assert normal['checks'][0]['check_id'] in calls[-1][2]
        assert normal['checks'][0]['criterion'] in calls[-1][2]
        assert any('不良知识' in limitation for limitation in analysis['knowledge_limitations'])
    finally:
        runtime.close()


@pytest.mark.parametrize('model_label', ['PASS', 'FAIL'])
def test_target_cannot_be_its_own_only_knowledge_support(knowledge_dataset, model_label, finding_response):
    db, config = knowledge_dataset
    target = config.dataset.id + ':part-0.png'

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        body = json.loads(request.content)
        images = [json.loads(item['text'][5:]) for item in body['messages'][0]['content']
                  if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        if body['response_format']['json_schema']['name'] == 'KnowledgeDraft':
            result = {'summary': '孔位', 'checks': [{'title': '孔位', 'subject': '孔', 'location': '中部',
                'criterion': '双孔横向排列', 'allowed_variations': [], 'support_evidence_ids': [images[0]['evidence_id']],
                'counter_evidence_ids': [], 'limitations': [], 'status': 'supported'}], 'suspects': [], 'limitations': []}
        else:
            view = {'description': '仅有目标自身的正常知识', 'position_analysis': '中部', 'illumination_analysis': '未发现反光'}
            checks = json.loads(body['messages'][0]['content'][0]['text'].split('冻结知识：')[1].split('\n')[0])['checks']
            result = {**view, 'suggested_label': model_label, 'reason_category': 'NORMAL', 'confidence': 0.9,
                'check_assessments': [{**view, 'check_id': check['check_id'], 'status': 'normal' if model_label == 'PASS' else 'anomaly', 'evidence_ids': [images[0]['evidence_id']]} for check in checks],
                'findings': [] if model_label == 'PASS' else [{**finding_response, 'check_ids': [check['check_id'] for check in checks], 'evidence_ids': [images[0]['evidence_id']]}],
                'evidence_ids': [item['evidence_id'] for item in images], 'global_view': view,
                'region_observations': [{**view, 'region_index': index} for index in range(1, len(images))]}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        mining = runtime.knowledge.start(dataset_id=config.dataset.id, kind='normal', sample_ids=[target])
        runtime.knowledge.wait(mining['run_id'], 5)
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        assert runtime.audit.status(job['run_id'])['status'] == 'COMPLETED'
        analysis = sample_get({'sample_id': target}, db.db_path)['suggestion']['analysis']
        assert analysis['conclusion']['suggested_label'] == 'UNCERTAIN'
        assert analysis['conclusion']['missing_evidence']
        assert analysis['reference_sample_ids'] == []
        assert analysis['joint_steps'][-1]['result']['suggested_label'] == model_label
    finally:
        runtime.close()


def test_defect_version_remains_frozen_in_job_progress_and_analysis(defect_dataset, finding_response):
    db, dataset, original, _ = defect_dataset
    target = original['sample']['sample_id']
    normal = None
    entered, release = threading.Event(), threading.Event()
    audit_inputs = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        images = [json.loads(item['text'][5:]) for item in content if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        kind = body['response_format']['json_schema']['name']
        if kind == 'KnowledgeVerification':
            payload = json.loads(content[0]['text'].split('待核验疑点：')[1].split('\n请根据图像')[0])
            raw = next(item for item in images if item['role'] == 'roi' and item['representation'] == 'raw')
            reference = next(item for item in images if item['role'] == 'normal')
            result = {'findings': [{'finding_id': item['finding_id'], 'status': 'supported',
                'affected_check_titles': ['孔内外观'], 'description': '孔内遮挡', 'normal_explanation': '需排除反光',
                'limitations': [], 'evidence_ids': [raw['evidence_id'], reference['evidence_id']], 'conflicts': [],
            } for item in payload['findings']]}
        elif kind == 'KnowledgeDraft':
            defect = normal is not None
            result = {'summary': '孔内外观', 'checks': [{'title': '孔内遮挡' if defect else '孔内外观',
                'subject': '孔', 'location': '左侧', 'criterion': '孔内实体遮挡' if defect else '孔内部可见背景',
                'allowed_variations': [], 'support_evidence_ids': [item['evidence_id'] for item in images
                    if not defect or (item['role'] == 'roi' and item['representation'] == 'raw')],
                'counter_evidence_ids': [], 'limitations': [], 'status': 'supported'}], 'suspects': [], 'limitations': []}
        else:
            audit_inputs.extend(images)
            entered.set()
            assert release.wait(5)
            view = {'description': '孔内红色遮挡', 'position_analysis': '左孔', 'illumination_analysis': '未排除反光'}
            checks = json.loads(content[0]['text'].split('冻结知识：')[1].split('\n')[0])['checks']
            result = {**view, 'suggested_label': 'FAIL', 'reason_category': 'OCCLUSION', 'confidence': 0.8,
                'check_assessments': [{**view, 'check_id': check['check_id'], 'status': 'anomaly', 'evidence_ids': [images[0]['evidence_id']]} for check in checks],
                'findings': [{**finding_response, 'check_ids': [check['check_id'] for check in checks], 'evidence_ids': [images[0]['evidence_id']]}],
                'evidence_ids': [item['evidence_id'] for item in images], 'global_view': view,
                'region_observations': [{**view, 'region_index': index} for index, item in enumerate(
                    [item for item in images if item['role'] == 'roi' and item['representation'] == 'raw'], 1)]}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = runtime.knowledge.start(dataset_id=dataset['dataset_id'], kind='normal')
        runtime.knowledge.wait(first['run_id'], 5)
        normal = knowledge_get({'version_id': runtime.knowledge.status(first['run_id'])['knowledge_version_id']}, db.db_path)['knowledge']
        second = runtime.knowledge.start(dataset_id=dataset['dataset_id'], kind='defect', normal_version_id=normal['version_id'])
        runtime.knowledge.wait(second['run_id'], 5)
        defect_id = runtime.knowledge.status(second['run_id'])['knowledge_version_id']
        job = runtime.audit.start(dataset_id=dataset['dataset_id'], sample_ids=[target], normal_version_id=normal['version_id'], defect_version_id=defect_id)
        assert entered.wait(3)
        assert runtime.audit.status(job['run_id'])['defect_version_id'] == defect_id
        release.set()
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        assert status['defect_version_id'] == defect_id
        assert status['normal_version_id'] == normal['version_id']
        detail = sample_get({'sample_id': target}, db.db_path)
        assert detail['suggestion']['analysis']['defect_version_id'] == defect_id
        assert detail['defect_knowledge']['version_id'] == defect_id
        binary, = [item for item in audit_inputs if item['representation'] == 'annotation_mask']
        raw, = [item for item in audit_inputs if item['role'] == 'roi' and item['representation'] == 'raw']
        assert binary['crop_bbox'] == raw['crop_bbox'] == [72, 78, 129, 163]
        assert detail['suggestion']['analysis']['coverage']['inspected_regions'] == 1
        media = audit_evidence({'suggestion_id': detail['suggestion']['suggestion_id'], 'evidence_id': binary['evidence_id']}, db.db_path)
        with Image.open(media['path']) as image:
            assert image.getpixel((28, 42)) == (255, 255, 255)
            assert image.getpixel((10, 10)) == (0, 0, 0)
    finally:
        release.set()
        runtime.close()


def test_audit_capacity_batches_keep_annotation_pixels_paired_with_roi(dataset, mllm_api):
    from pathlib import Path
    from iad_core.dataset.scanner import scan_dataset
    from iad_core.entry import sample_get
    from iad_core.workbench.audit import AuditService, VlmClient
    db, _, config = dataset
    shapes = [{'label': '待验证', 'shape_type': 'rectangle', 'points': [[x, 20], [x + 20, 40]]}
              for x in [10, 80, 150, 220]]
    (Path(config.annotations.root) / 'dent.json').write_text(json.dumps({'imageWidth': 320, 'imageHeight': 240, 'shapes': shapes}))
    scan_dataset(config=config, db_path=db.db_path)
    client, bodies, responses = mllm_api
    responses['Tokenize'] = {'tokens_per_image': 1000, 'max_model_len': 22384}
    service = AuditService(db, VlmClient(http_client=client))
    try:
        job = service.start(dataset_id=config.dataset.id, sample_ids=[config.dataset.id + ':dent.png'])
        service.wait(job['run_id'], 5)
        assert service.status(job['run_id'])['status'] == 'COMPLETED', service.status(job['run_id'])
        trace = sample_get({'sample_id': config.dataset.id + ':dent.png'}, db.db_path)['suggestion']['analysis']
        assert trace['coverage']['inspected_regions'] == trace['coverage']['planned_regions'] == 4
        assert len(trace['auxiliary_evidence']) == 4
        calls = [body for body in bodies if body['response_format']['json_schema']['name'] == 'JointAnalysis']
        assert len(calls) == 3
        for body in calls:
            views = [json.loads(part['text'][5:]) for part in body['messages'][0]['content']
                     if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
            assert views[0]['role'] == 'overview'
            assert len(views) == 5
            for raw, mask in zip(views[1::2], views[2::2]):
                assert raw['representation'] == 'raw'
                assert mask['representation'] == 'annotation_mask'
                assert raw['crop_bbox'] == mask['crop_bbox']
    finally:
        service.close()



def test_audit_keeps_frozen_rules_when_new_knowledge_is_published_mid_batch(dataset, mllm_api):
    from pathlib import Path
    from iad_core.dataset.scanner import scan_dataset
    from iad_core.entry import knowledge_get, sample_get
    from iad_core.workbench.runtime import WorkbenchRuntime
    from iad_core.workbench.vision import VlmClient
    db, _, config = dataset
    client, bodies, responses = mllm_api
    old = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
    entered, release = threading.Event(), threading.Event()
    requests = []

    def hold_first(request):
        if request.url.path.endswith('/chat/completions'):
            body = json.loads(request.content)
            if body['response_format']['json_schema']['name'] == 'JointAnalysis':
                requests.append(body)
                if len(requests) == 1:
                    entered.set()
                    assert release.wait(5)

    client.event_hooks['request'].append(hold_first)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    try:
        targets = [config.dataset.id + ':dent.png', config.dataset.id + ':scratch.png']
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=targets)
        assert entered.wait(3)
        Image.new('RGB', (320, 240), (0, 0, 210)).save(Path(config.root) / 'new-normal.png')
        scan_dataset(config=config, db_path=db.db_path)
        responses['KnowledgeDraft']['revisions'] = [{'previous_check_id': old['checks'][0]['check_id'],
            'current_check_titles': ['表面外观'], 'reason': '新来源继续支持表面判据'}]
        mining = runtime.knowledge.start(dataset_id=config.dataset.id, kind='normal', sample_ids=[config.dataset.id + ':new-normal.png'])
        runtime.knowledge.wait(mining['run_id'], 3)
        current = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
        assert current['version_id'] != old['version_id'], runtime.knowledge.status(mining['run_id'])
        assert runtime.audit.status(job['run_id'])['normal_version_id'] == old['version_id']
        release.set()
        runtime.audit.wait(job['run_id'], 5)
        assert runtime.audit.status(job['run_id'])['status'] == 'COMPLETED'
        for sample_id in targets:
            detail = sample_get({'sample_id': sample_id}, db.db_path)
            assert detail['normal_knowledge']['version_id'] == old['version_id']
            assert detail['suggestion']['analysis']['normal_version_id'] == old['version_id']
        assert len(requests) == 2
        assert all(old['version_id'] in body['messages'][0]['content'][0]['text'] for body in requests)
        assert all(current['version_id'] not in body['messages'][0]['content'][0]['text'] for body in requests)
    finally:
        release.set()
        runtime.close()



def test_historical_analysis_migration_preserves_evidence_and_human_decision(dataset, mllm_api):
    from iad_core.entry import audit_evidence, sample_get
    from iad_core.workbench.audit import AuditService, VlmClient
    from iad_core.workbench.review import HumanReview, ReviewSubmission
    db, _, config = dataset
    client, _, _ = mllm_api
    service = AuditService(db, VlmClient(http_client=client))
    target = config.dataset.id + ':dent.png'
    try:
        job = service.start(dataset_id=config.dataset.id, sample_ids=[target])
        service.wait(job['run_id'], 5)
        detail = sample_get({'sample_id': target}, db.db_path)
        suggestion = detail['suggestion']
        historical = {key: value for key, value in suggestion['analysis'].items()
                      if key not in {'normal_version_id', 'defect_version_id', 'legacy_profile_id', 'knowledge_limitations',
                                     'reference_sample_ids', 'auxiliary_evidence'}}
        historical['profile_id'] = 'normal_historical'
        with db.connection() as conn:
            conn.execute('UPDATE audit_suggestions SET analysis_json=? WHERE suggestion_id=?',
                         (json.dumps(historical), suggestion['suggestion_id']))
        human = HumanReview(db)
        session = human.start(config.dataset.id, 'inspector', config.task.task_id)
        human.submit(ReviewSubmission(session_id=session['session_id'], sample_id=target, decision='PASS', comment='人工核对'))
        before = sample_get({'sample_id': target}, db.db_path)
        for _ in range(2):
            reopened = sample_get({'sample_id': target}, db.db_path)
            assert reopened['normal_knowledge'] is reopened['defect_knowledge'] is None
            assert reopened['suggestion']['analysis']['legacy_profile_id'] == 'normal_historical'
            assert reopened['suggestion']['analysis']['normal_version_id'] is None
            assert reopened['suggestion']['suggestion_id'] == suggestion['suggestion_id']
            assert reopened['suggestion']['analysis']['overview'] == historical['overview']
            assert reopened['review_decision'] == before['review_decision']
            assert reopened['annotations'] == before['annotations']
            evidence = audit_evidence({'suggestion_id': suggestion['suggestion_id'],
                'evidence_id': historical['overview']['evidence_id']}, db.db_path)
            with Image.open(evidence['path']) as image:
                assert image.size == (320, 240)
    finally:
        service.close()
