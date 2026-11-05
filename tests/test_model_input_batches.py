import base64
import io
import json

import httpx
import pytest
from PIL import Image

from iad_core.exploration.models import ExplorationStart
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient
from iad_core.entry import dataset_import, dataset_preview
from iad_core.entry import direction_exploration_get
from iad_core.storage.database import Database
from tests.knowledge_scenarios import selected_group
from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.gallery import GalleryQueries, GalleryQuery, GalleryMemberQuery
from iad_core.consistency.result_models import ConsistencyQuery
from iad_core.consistency.result_queries import ResultQueries
from iad_core.consistency.group_analysis import GroupAnalyses
from iad_core.consistency.group_analysis_models import GroupAnalysisStart
from iad_core.exploration.models import DirectionDraft


@pytest.mark.parametrize('explicit_schema',[False,True])
def test_model_transport_preserves_the_complete_editable_prompt(explicit_schema):
    prompt='只比较轮廓，保留证据不足；这是用户编辑的完整提示词。'
    if explicit_schema:
        prompt+='\n{{response_schema}}\n'
    transport=httpx.MockTransport(lambda request:httpx.Response(200,json={'count':100,'max_model_len':65536}))
    with httpx.Client(transport=transport) as http:
        client=VlmClient(http_client=http)
        plan=client.plan(DirectionDraft,prompt,[],'fixture-model')
    expected=prompt.replace('{{response_schema}}',json.dumps(DirectionDraft.model_json_schema(),ensure_ascii=False)) if explicit_schema else prompt
    assert plan.body['messages'][0]['content']==[{'type':'text','text':expected}]
    assert plan.body['response_format']['json_schema']['name']=='DirectionDraft'


@pytest.mark.parametrize('corrected', [True, False])
def test_model_rechecks_out_of_range_coordinates_without_rescaling_or_clipping(corrected):
    from iad_core.advisory.analysis import RegionProposal

    calls = []
    invalid = [8564, 8979, 9068, 9068]
    revised = [120, 210, 360, 480]

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 100, 'max_model_len': 65536})
        body = json.loads(request.content); calls.append(body)
        box = revised if corrected and len(calls) == 2 else invalid
        result = dict(bbox_1000=box, reason='观察到局部外观差异', check_ids=[])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    with httpx.Client(transport=httpx.MockTransport(respond)) as http:
        client = VlmClient(http_client=http)
        plan = client.plan(RegionProposal, '结合实际图像返回疑点；格式错误时按反馈重新检查。\n{{response_schema}}', [], 'fixture-model')
        if corrected:
            assert client.generate(plan).bbox_1000 == revised
        else:
            with pytest.raises(ValueError, match='less_than_equal'):
                client.generate(plan)
    assert len(calls) == 2, '只允许模型自行纠正一次，不由程序改写坐标'
    feedback = json.loads(calls[1]['messages'][0]['content'][0]['text'].split('输出校验结果：', 1)[1])
    assert json.loads(feedback['previous_response'])['bbox_1000'] == invalid
    assert all(issue['type'] == 'less_than_equal' for issue in feedback['schema_validation_errors'])


@pytest.mark.parametrize('corrected',[True,False])
@pytest.mark.parametrize('initial_shape',['extra','other_object','empty','scalar'])
def test_model_repairs_structural_errors_once(corrected,initial_shape):
    calls=[]
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':100,'max_model_len':65536})
        body=json.loads(request.content);calls.append(body)
        result=dict(summary='边缘结构可见',directions=[],limitations=[])
        if len(calls)==1 or not corrected:
            if initial_shape=='extra':result['checks']=[]
            elif initial_shape=='other_object':result={'checks':[]}
            elif initial_shape=='empty':result={}
            else:result='本次未返回结构化结果'
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})
    with httpx.Client(transport=httpx.MockTransport(respond)) as http:
        client=VlmClient(http_client=http)
        plan=client.plan(DirectionDraft,'按完整格式返回方向；校验失败时根据反馈自行修正。\n{{response_schema}}',[],'fixture-model')
        if corrected:
            assert client.generate(plan).summary=='边缘结构可见'
        else:
            with pytest.raises(ValueError,match='extra_forbidden|missing|model_type'):client.generate(plan)
    assert len(calls)==2
    assert '输出校验结果：' in calls[1]['messages'][0]['content'][0]['text']


def test_folder_consistency_sends_original_labels_without_synthetic_crops(tmp_path):
    root = tmp_path / 'same-image-different-label'
    rules = [{'path': 'OK', 'role': 'normal'}, {'path': 'NG', 'role': 'anomaly'}]
    for folder in ('OK', 'NG'):
        (root / folder).mkdir(parents=True)
        Image.new('RGB', (320, 240), 'blue').save(root / folder / 'part.png')
    db_path = str(tmp_path / 'consistency.db')
    preview = dataset_preview({'root_dir': str(root), 'rules': rules}, db_path)
    imported = dataset_import({'format': 'folder_classification', 'name': '同图标签差异', 'root_dir': str(root),
        'rules': rules, 'preview_fingerprint': preview['preview_fingerprint']}, db_path)
    db, calls, citation = Database(db_path), [], {}

    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        calls.append(body)
        return httpx.Response(200, json={'choices': [{'message': {'content': json.dumps({
            'overall': {'verdict': 'MATERIAL', 'text': '图像级标签不同', 'references': [citation]},
            'assessments': [{'candidate_id': citation['candidate_id'], 'verdict': 'MATERIAL',
                'explanation': '相同图像对应不同原始标签', 'findings': ['OK与NG不同']}],
            'conclusions': [{'text': '仅比较标签差异', 'references': [citation]}], 'limitations': [],
        })}}]})

    runtime = WorkbenchRuntime(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        left, right = [imported['dataset_id'] + ':' + folder + '/part.png' for folder in ('OK', 'NG')]
        compared = runtime.consistency_service.compare(ConsistencyCompare(sample_a=left, sample_b=right))
        query = ResultQueries(db).query(ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}}))
        group = GalleryQueries(db).query(GalleryQuery(query_id=query.query_id, kind='conflicts')).items[0]
        members = GalleryQueries(db).members(GalleryMemberQuery(query_id=query.query_id, kind='conflicts', group_id=group.group_id))
        citation.update(candidate_id=members.items[0].image.sample.sample_id,
            comparison={'result_id': compared.result_id, 'evidence_id': compared.evidence_id})
        analyses = GroupAnalyses(runtime, runtime.client)
        started = analyses.start(GroupAnalysisStart(query_id=query.query_id, kind='conflicts',
            group_id=group.group_id, request_id='image-level-input'))
        runtime.jobs.wait(started.run_id, 5)
        finished = runtime.jobs.status(started.run_id)
        assert finished['status'] == 'COMPLETED', finished['errors']
        content = calls[0]['messages'][0]['content']
        instruction = content[0]['text']
        assert '"image_label":"OK"' in instruction and '"image_label":"NG"' in instruction
        descriptors = [json.loads(p['text'].removeprefix('视觉证据：')) for p in content
                       if p['type'] == 'text' and p['text'].startswith('视觉证据：')]
        assert all(item['role'] == 'overview' for item in descriptors)
    finally:
        runtime.close()


def test_labelme_exploration_sends_annotations_full_images_and_matching_crops(dataset):
    db, registry, config = dataset
    Image.new('RGB', (1920, 1080), 'blue').save(config.root + '/normal.png')
    registry.rescan(config.dataset.id)
    calls = []

    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        calls.append(body)
        return httpx.Response(200, json={'choices': [{'message': {'content': json.dumps({
            'summary': '本批证据不足以形成方向', 'directions': [], 'limitations': ['样本有限'],
        })}}]})

    runtime = WorkbenchRuntime(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.exploration.start(ExplorationStart(dataset_id=config.dataset.id,
            normal_images=[config.dataset.id + ':normal.png'],
            defect_images=[config.dataset.id + ':dent.png']))
        runtime.jobs.wait(job['run_id'], 5)
        assert runtime.jobs.status(job['run_id'])['status'] == 'COMPLETED'
        content = calls[0]['messages'][0]['content']
        evidence = [json.loads(p['text'].removeprefix('视觉证据：')) for p in content
                    if p['type'] == 'text' and p['text'].startswith('视觉证据：')]
        annotated = [item for item in evidence if item.get('annotations')]
        assert annotated, 'Labelme 人工标注须与图像一起进入真实模型请求'
        assert any(item['annotations'][0]['raw_label'] == 'dent' for item in annotated)
        assert any(item['role'] == 'overview' and item['crop_bbox'] == [0, 0, 320, 240] for item in annotated)
        assert any(item['role'] == 'roi' and item['representation'] == 'raw'
                   and item['crop_bbox'] == [6, 6, 34, 34] for item in annotated)
        images = [Image.open(io.BytesIO(base64.b64decode(p['image_url']['url'].split(',', 1)[1])))
                  for p in content if p['type'] == 'image_url']
        assert [1920, 1080] == list(images[0].size)
        assert (28, 28) in [image.size for image in images]
    finally:
        runtime.close()


def test_exploration_later_batch_inherits_frozen_directions_and_uses_its_own_evidence(dataset):
    db, _, config = dataset
    calls, prior = [], {}

    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        calls.append(body)
        evidence = [json.loads(part['text'].removeprefix('视觉证据：')) for part in body['messages'][0]['content']
                    if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        result = {'summary': '逐批比较结构', 'limitations': [], 'directions': [{
            'title': '边缘连续性', 'instruction': '比较边缘并保留反光解释', 'applies_to': 'both',
            'rationale': '本批有可观察边缘', 'evidence_ids': [evidence[0]['evidence_id']],
            'limitations': [],
        }]}
        if prior:
            result['directions'][0]['previous_direction_id'] = prior['direction_id']
        return httpx.Response(200, json={'choices': [{'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = runtime.exploration.start(ExplorationStart(dataset_id=config.dataset.id,
            normal_images=[config.dataset.id + ':normal.png'], defect_images=[config.dataset.id + ':dent.png']))
        runtime.jobs.wait(first['run_id'], 5)
        initial = direction_exploration_get({'dataset_id': config.dataset.id}, db.db_path)['exploration']
        prior.update(initial['directions'][0])
        second = runtime.exploration.start(ExplorationStart(dataset_id=config.dataset.id,
            normal_images=[config.dataset.id + ':normal2.png'], defect_images=[config.dataset.id + ':scratch.png'],
            parent_version_id=initial['version_id']))
        runtime.jobs.wait(second['run_id'], 5)
        finished = runtime.jobs.status(second['run_id'])
        assert finished['status'] == 'COMPLETED', finished['errors']
        current = direction_exploration_get({'dataset_id': config.dataset.id}, db.db_path)['exploration']
        assert current['request']['parent_version_id'] == initial['version_id']
        assert current['directions'][0]['previous_direction_id'] == prior['direction_id']
        assert prior['direction_id'] in calls[1]['messages'][0]['content'][0]['text']
        assert '比较边缘并保留反光解释' in calls[1]['messages'][0]['content'][0]['text']
        assert current['directions'][0]['evidence_ids'] != initial['directions'][0]['evidence_ids']
        assert direction_exploration_get({'dataset_id': config.dataset.id,
            'version_id': initial['version_id']}, db.db_path)['exploration'] == initial
    finally:
        runtime.close()


def test_folder_mining_sends_only_images_and_original_ok_ng_labels(tmp_path, mllm_api):
    root = tmp_path / 'classification'
    for folder in ('OK', 'NG'):
        (root / folder).mkdir(parents=True)
    for name, color in [('OK/one.png', '#cccccc'), ('OK/two.png', '#dddddd'), ('NG/three.png', 'red')]:
        Image.new('RGB', (320, 240), color).save(root / name)
    db_path = str(tmp_path / 'folder.db')
    rules = [{'path': 'OK', 'role': 'normal'}, {'path': 'NG', 'role': 'anomaly'}]
    preview = dataset_preview({'root_dir': str(root), 'rules': rules}, db_path)
    imported = dataset_import({'format': 'folder_classification', 'name': '图像级异常检测',
        'root_dir': str(root), 'rules': rules, 'preview_fingerprint': preview['preview_fingerprint']}, db_path)
    client, calls, _ = mllm_api
    calls.clear()
    db = Database(db_path)

    def respond(request):
        response = client.send(request)
        if request.url.path.endswith('/tokenize'):
            return response
        body = json.loads(request.content)
        result = response.json()
        answer = json.loads(result['choices'][0]['message']['content'])
        if body['response_format']['json_schema']['name'] == 'KnowledgeDraft':
            evidence = next(json.loads(part['text'].removeprefix('视觉证据：'))
                for part in body['messages'][0]['content'] if part['type'] == 'text'
                and part['text'].startswith('视觉证据：'))
            answer['suspects'] = [{'evidence_id': evidence['evidence_id'], 'bbox_1000': [100, 100, 200, 200],
                'description': '需要核对正常替代解释', 'normal_explanation': '可能是正常反光'}]
        if body['response_format']['json_schema']['name'] == 'KnowledgeVerification':
            for finding in answer['findings']:
                finding['status'] = 'refuted'
        result['choices'][0]['message']['content'] = json.dumps(answer)
        return httpx.Response(200, json=result)

    runtime = WorkbenchRuntime(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPromptConfiguration
        job = runtime.knowledge.start(request=dict(images=[imported['dataset_id']+':'+name
            for name in ['OK/one.png','OK/two.png','NG/three.png']],image_count=3),
            mining_prompt=FrozenMiningPrompt.capture(MiningPromptConfiguration(objective='联合观察所有图像和原始OK/NG',directions=[])))
        runtime.jobs.wait(job['run_id'], 5)
        saved = runtime.knowledge.status(job['run_id'])
        assert saved['status'] == 'COMPLETED', saved['errors']
        visual = [json.loads(part['text'].removeprefix('视觉证据：')) for call in calls
                  for part in call['messages'][0]['content']
                  if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        assert visual
        assert all(item['role'] != 'roi' for item in visual), '目录式数据不应产生人工标注裁剪输入'
        assert {item.get('image_label') for item in visual} == {'OK', 'NG'}
        assert all('annotations' not in item for item in visual)
    finally:
        runtime.close()


@pytest.mark.parametrize('valid',[True,False])
def test_json_object_mode_preserves_visible_schema_and_validates_the_result(valid):
    from iad_core.workbench.model_profile import ModelProfile
    from iad_core.workbench.completion import ModelOutputError
    prompt='用户完整提示词：输出本批真实观察。\n{{response_schema}}\n'
    def respond(request):
        body=json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':100,'max_model_len':65536})
        assert body['response_format']=={'type':'json_object'}
        assert json.dumps(DirectionDraft.model_json_schema(),ensure_ascii=False) in body['messages'][0]['content'][0]['text']
        value=dict(summary='仅记录实际观察',directions=[],limitations=[]) if valid else {'summary':'缺少必填字段'}
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(value)}}]})
    profile=ModelProfile(endpoint='http://model/v1',model_id='fixture-model',capacity_mode='vllm_tokenize',
        request_parameters={'response_format':{'type':'json_object'}})
    with httpx.Client(transport=httpx.MockTransport(respond)) as http:
        client=VlmClient(http_client=http,profile=profile)
        plan=client.plan(DirectionDraft,prompt,[],'fixture-model')
        if valid:assert client.generate(plan).summary=='仅记录实际观察'
        else:
            with pytest.raises(ModelOutputError,match='missing'):client.generate(plan)
