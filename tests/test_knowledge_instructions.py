import json
import re
import threading

import httpx
import pytest

from tests.knowledge_scenarios import selected_group
from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPromptConfiguration


def test_operator_edits_mining_directions_per_dataset_and_kind(knowledge_dataset):
    from iad_core.entry import knowledge_prompt_get, knowledge_prompt_save

    db, config = knowledge_dataset
    query = {'dataset_id': config.dataset.id, 'kind': 'normal'}
    original = knowledge_prompt_get(query, db.db_path)
    assert not original['customized']
    assert all(term in original['instruction'] for term in ['装配', '标识', '工艺', '成像'])
    edited = knowledge_prompt_save({**query, 'expected_revision': original['revision'],
                                   'configuration': {'objective': '只研究两个孔的相对位置，暂不分析颜色。', 'directions': []}}, db.db_path)
    assert edited['configuration']['objective'] == '只研究两个孔的相对位置，暂不分析颜色。'
    assert edited['customized']
    assert knowledge_prompt_get(query, db.db_path) == edited
    assert not knowledge_prompt_get({**query, 'kind': 'defect'}, db.db_path)['customized']
    with pytest.raises(ValueError, match='已变化'):
        knowledge_prompt_save({**query, 'expected_revision': original['revision'], 'configuration': {'objective': '过期修改', 'directions': []}}, db.db_path)
    with pytest.raises(ValueError):
        knowledge_prompt_save({**query, 'expected_revision': edited['revision'], 'configuration': {'objective': '  ', 'directions': []}}, db.db_path)
    restored = knowledge_prompt_save({**query, 'expected_revision': edited['revision'], 'configuration': None}, db.db_path)
    assert restored == original


@pytest.mark.parametrize('invalid', [None, 'unknown_part', 'unknown_check', 'unsupplied_image', 'unselected_direction'])
def test_mining_freezes_edited_prompt_and_validates_observation_scope(knowledge_dataset, invalid):
    from iad_core.entry import knowledge_details, knowledge_get, knowledge_prompt_get, knowledge_prompt_save
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.vision import VlmClient

    db, config = knowledge_dataset
    query = {'dataset_id': config.dataset.id, 'kind': 'normal'}
    original = knowledge_prompt_get(query, db.db_path)
    chosen = knowledge_prompt_save({**query, 'expected_revision': original['revision'],
                                   'configuration': {'objective': '检查两孔关系以及孔内背景，不分析标识。',
                                       'instruction':'用户完整提示词：联合核对两孔关系与背景，保留实际支持、反对和不可观察项。', 'directions': [
                                       {'direction_id': 'holes', 'title': '两孔关系', 'instruction': '检查孔位与数量'}]}}, db.db_path)
    entered, release = threading.Event(), threading.Event()
    prompts = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 5000, 'max_model_len': 262144})
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        prompts.append(content[0]['text'])
        context_label='冻结视觉提取：' if body['response_format']['json_schema']['name']=='KnowledgeDiscoveryLinks' else '冻结父版本候选：'
        runtime_context=json.JSONDecoder().raw_decode(content[0]['text'].split(context_label,1)[1])[0]
        assert next(iter(runtime_context))=='phase','当前阶段应先于大量历史来源上下文，避免末尾阶段被忽略'
        if body['response_format']['json_schema']['name'] == 'KnowledgeDiscoveryLinks':
            result = {'area_0': {'status': '已形成知识', 'subjects': ['虚构基座' if invalid == 'unknown_part' else '孔板'],
                'check_titles': ['未归纳的判据'] if invalid == 'unknown_check' else ['两孔数量', '孔位排列']},
                'area_1': {'status': '不可观察', 'subjects': ['孔板'], 'check_titles': []}}
            return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})
        entered.set()
        assert release.wait(5)
        ids = [json.loads(item['text'].removeprefix('视觉证据：'))['evidence_id']
               for item in content if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        checks = [{'title': title, 'subject': '孔板', 'location': '主体', 'criterion': criterion,
                   'allowed_variations': [], 'limitations': [], 'status': 'supported',
                   'support_evidence_ids': ids[:2], 'counter_evidence_ids': []} for title, criterion in [
                       ('两孔数量', '有两个孔'), ('孔位排列', '两孔水平排列'), ('孔内背景', '孔内可见背景'),
                       ('闭合外轮廓', '外轮廓闭合'), ('孔周边完整', '孔周边无可见缺口')]]
        result = {'summary': '孔板可见规律', 'checks': checks, 'suspects': [], 'limitations': [],
                  'discovery': {'parts': [{'name': '孔板', 'location': '主体', 'evidence_ids': ids[:2]}],
                      'areas': [{'direction_id': 'holes', 'direction': '两孔关系：孔位与数量', 'status': '已形成知识',
                                 'reason': '两个独立来源均可见\n仍需保留成像变化限制', 'evidence_ids': ids[:2]},
                                {'direction': '精密孔径', 'status': '不可观察',
                                 'reason': '无标尺和标定', 'evidence_ids': []}]}}
        definitions = body['response_format']['json_schema']['schema']['$defs']
        assert set(definitions['ObservedArea']['properties']['direction_id']['enum']) == {None, 'holes'}
        # The deployed grammar backend uses full-string matching for patterns.
        for model, field, value in [('ObservedPart', 'name', '孔板'), ('ObservedArea', 'direction', '两孔关系'),
                                    ('ObservedArea', 'reason', '两个独立来源均可见\n仍需保留成像变化限制')]:
            assert re.fullmatch(definitions[model]['properties'][field]['pattern'], value), f'生成约束无法表达完整的{field}'
        area = result['discovery']['areas'][0]
        if invalid == 'unsupplied_image':
            area['evidence_ids'] = ['img_' + '0' * 64]
        elif invalid == 'unselected_direction':
            area['direction_id'] = 'shape'
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(request=selected_group(db, config.dataset.id, 'normal'), mining_prompt=FrozenMiningPrompt.capture(MiningPromptConfiguration.model_validate(chosen['configuration'])), model_name='test-mllm')
        assert entered.wait(3)
        knowledge_prompt_save({**query, 'expected_revision': chosen['revision'], 'configuration': {'objective': '仅观察轮廓。', 'directions': []}}, db.db_path)
        release.set()
        service.wait(job['run_id'], 5)
        finished = service.status(job['run_id'])
        assert finished['mining_prompt']['instruction'] == chosen['instruction']
        if invalid:
            assert finished['status'] == 'FAILED'
            if invalid in ('unknown_part', 'unknown_check'):
                assert 'literal_error' in finished['errors'][0]['message']
            assert knowledge_get({'dataset_id':config.dataset.id}, db.db_path)['knowledge'] is None
            return
        assert finished['status'] == 'COMPLETED', finished['errors']
        snapshot = knowledge_get({'version_id': finished['knowledge_version_id']}, db.db_path)['knowledge']
        assert snapshot['mining_prompt']['instruction'] == chosen['instruction']
        assert chosen['instruction'] in prompts[0]
        assert all(prompt.startswith(chosen['instruction']) for prompt in prompts),'视觉提取和关联阶段都应使用冻结的完整提示词'
        assert all('逐部件联动全图与真实局部' not in prompt for prompt in prompts),'不得暗中追加默认分析指令'
        assert '仅观察轮廓。' not in prompts[0]
        assert '柔性部件与包装' not in prompts[0], '自定义提示完整替换默认方向，删除的内容不应暗中加回'
        assert len(snapshot['checks']) == 5, '独立知识不截为固定条数'
        page = knowledge_details({'version_id': snapshot['version_id'], 'section': 'discovery', 'page_size': 1}, db.db_path)
        assert page['recorded'] and page['total'] == 2
        assert page['items'][0]['direction_id'] == 'holes'
        assert page['items'][0]['direction'] == '两孔关系：孔位与数量'
        assert page['items'][0]['reason'] == '两个独立来源均可见\n仍需保留成像变化限制'
        assert knowledge_details({'version_id': snapshot['version_id'], 'section': 'discovery', 'page': 2,
                                  'page_size': 1}, db.db_path)['items'][0]['status'] == '不可观察'
        assert snapshot['mining_steps'][0]['result']['discovery']['parts'][0]['name'] == '孔板'
    finally:
        release.set()
        service.close()


def test_stop_with_incomplete_json_is_reported_without_repair_or_retry(knowledge_dataset, self_discovery_prompt):
    from iad_core.entry import knowledge_get, model_call_get
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.vision import VlmClient

    db, config = knowledge_dataset
    malformed = '{"summary":"观察结果","checks":[],"suspects":[],"limitations":[]'
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        calls.append(request)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': malformed}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(request=selected_group(db, config.dataset.id, 'normal'), mining_prompt=self_discovery_prompt, model_name='test-mllm')
        service.wait(job['run_id'], 5)
        finished = service.status(job['run_id'])
        assert finished['status'] == 'FAILED' and len(calls) == 1
        assert 'JSON语法无效' in finished['errors'][0]['message']
        assert 'EOF' in finished['errors'][0]['message']
        assert knowledge_get({'dataset_id': config.dataset.id}, db.db_path)['knowledge'] is None
        generated = next(call for call in finished['model_calls'] if call['operation'] == 'generate')
        detail = model_call_get({'run_id': job['run_id'], 'call_id': generated['call_id']}, db.db_path)
        assert json.loads(detail['response_body'])['choices'][0]['message']['content'] == malformed
    finally:
        service.close()


@pytest.mark.parametrize('invalid_link', [None, 'unknown_part', 'empty_formed'])
def test_mining_links_visual_observations_using_frozen_name_enumerations(knowledge_dataset, self_discovery_prompt, invalid_link):
    from iad_core.entry import knowledge_get
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.vision import VlmClient

    db, config = knowledge_dataset
    generated = []
    supplied = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        body = json.loads(request.content)
        generated.append(body)
        schema = body['response_format']['json_schema']['schema']
        content = body['messages'][0]['content']
        if len(generated) == 1:
            supplied.extend(json.loads(item['text'].removeprefix('视觉证据：'))['evidence_id']
                for item in content if item['type'] == 'text' and item['text'].startswith('视觉证据：'))
            area = next(value for value in schema['$defs'].values()
                        if 'direction' in value.get('properties', {}))
            assert 'subjects' not in area['properties'], '视觉提取阶段不要求同份输出中的自由文本跨引用'
            assert set(area['properties']['evidence_ids']['items']['enum']) == set(supplied)
            result = {'summary': '可见双孔', 'checks': [{'title': '孔内背景可见', 'subject': '圆形开口',
                'location': '主体', 'criterion': '开口内可见背景', 'allowed_variations': [],
                'limitations': [], 'status': 'supported', 'support_evidence_ids': supplied[:3],
                'counter_evidence_ids': []}], 'suspects': [], 'limitations': [],
                'discovery': {'parts': [{'name': '圆孔', 'location': '主体', 'evidence_ids': supplied[:3]}],
                    'areas': [{'direction_id': None, 'direction': '开口内部外观', 'status': '已形成知识',
                        'reason': '三个来源均可见开口内背景', 'evidence_ids': supplied[:3]},
                        {'direction_id': None, 'direction': '圆孔外缘完整性', 'status': '已形成知识',
                         'reason': '三个来源可见外缘，但本次增量未建立外缘判据', 'evidence_ids': supplied[:3]}]}}
        else:
            assert not any(item['type'] == 'image_url' for item in content), '关联只使用已冻结的文本，不重复读取图像'
            links = schema['$defs']['DiscoveryLinks']['properties']
            assert links['subjects']['items']['const'] == '圆孔'
            assert links['check_titles']['items']['const'] == '孔内背景可见'
            assert set(links['status']['enum']) == {'已形成知识', '证据不足', '不可观察', '不适用'}
            extraction=json.JSONDecoder().raw_decode(content[0]['text'].split('冻结视觉提取：',1)[1])[0]
            restored=extraction['discovery']['parts'][0]['evidence_ids']
            assert len(restored)==len(supplied[:3]) and all(eid.startswith('img_') for eid in restored)
            result = {'area_0': {'status': '已形成知识', 'subjects': ['圆形开口' if invalid_link == 'unknown_part' else '圆孔'],
                                 'check_titles': ['孔内背景可见']},
                      'area_1': {'status': '已形成知识' if invalid_link == 'empty_formed' else '证据不足',
                                 'subjects': ['圆孔'], 'check_titles': []}}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(request=selected_group(db, config.dataset.id, 'normal'), model_name='test-mllm', mining_prompt=self_discovery_prompt)
        service.wait(job['run_id'], 5)
        finished = service.status(job['run_id'])
        expected_calls=['KnowledgeDraft','KnowledgeDiscoveryLinks'] + (['KnowledgeDiscoveryLinks'] if invalid_link=='empty_formed' else [])
        assert len(generated) == len(expected_calls), finished['errors']
        assert [call['schema_name'] for call in finished['model_calls'] if call['operation'] == 'generate'] == expected_calls
        snapshot = knowledge_get({'dataset_id': config.dataset.id}, db.db_path)['knowledge']
        if invalid_link:
            assert finished['status'] == 'FAILED' and snapshot is None
            assert ('literal_error' if invalid_link == 'unknown_part' else '形成知识的观察方向必须关联判据') in finished['errors'][0]['message']
        else:
            assert finished['status'] == 'COMPLETED', finished['errors']
            area = snapshot['mining_steps'][0]['result']['discovery']['areas'][0]
            assert area['subjects'] == ['圆孔'] and area['check_titles'] == ['孔内背景可见']
            assert len(area['evidence_ids'])==len(supplied[:3])
            assert all(eid.startswith('img_') for eid in area['evidence_ids'])
            assert set(area['evidence_ids']) <= {item['image']['evidence_id'] for item in snapshot['evidence']}
            unresolved = snapshot['mining_steps'][0]['result']['discovery']['areas'][1]
            assert unresolved['status'] == '证据不足' and unresolved['check_titles'] == []
            assert unresolved['reason'] == '三个来源可见外缘，但本次增量未建立外缘判据'
            assert unresolved['evidence_ids'] == area['evidence_ids']
            assert snapshot['checks'][0]['subject'] == '圆形开口', '关联不得篡改已经提取的图像知识'
    finally:
        service.close()


@pytest.mark.parametrize('kind,expected', [('normal', 5), ('defect', 1)])
def test_source_paging_uses_a_bounded_read_snapshot_after_human_qualification_changes(knowledge_dataset, monkeypatch, kind, expected):
    from uuid import uuid4
    from iad_core.knowledge.query import KnowledgeReader
    from iad_core.knowledge.models import KnowledgeSourceQuery
    from iad_core.workbench.review import HumanReview, ReviewSubmission

    db, config = knowledge_dataset
    target = config.dataset.id + ':part-0.png'
    HumanReview(db).submit(ReviewSubmission(submission_id=str(uuid4()), dataset_id=config.dataset.id,
        sample_id=target, reviewer='operator', decision='FAIL', comment='测试中的实际人审事件'))
    connect = db.get_connection
    opened = []

    def observe():
        connection = connect()
        opened.append(connection)
        return connection

    monkeypatch.setattr(db, 'get_connection', observe)
    result = KnowledgeReader(db).source_page(KnowledgeSourceQuery(dataset_id=config.dataset.id, kind=kind, page_size=2))
    assert result.total == expected
    assert (target in [item.sample_id for item in result.items]) == (kind == 'defect')
    assert len(opened) <= 4, '资格分页不能为每张来源重新建立数据库连接'


def test_discovery_linking_rechecks_inconsistent_model_status_before_publication(knowledge_dataset, self_discovery_prompt):
    from iad_core.workbench.runtime import WorkbenchRuntime
    from iad_core.workbench.vision import VlmClient
    from iad_core.knowledge.repository import KnowledgeRepository
    db,config=knowledge_dataset
    linked=[]
    def respond(request):
        body=json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        content=body['messages'][0]['content']
        if body['response_format']['json_schema']['name']=='KnowledgeDiscoveryLinks':
            linked.append(content[0]['text'])
            result={f'area_{i}':dict(status='已形成知识' if len(linked)==1 else '证据不足',subjects=[],check_titles=[]) for i in range(2)}
            if len(linked)==2:
                feedback=content[0]['text'].split('输出校验结果：',1)[1]
                assert 'area_0' in feedback and 'area_1' in feedback
        else:
            refs=[json.loads(part['text'].removeprefix('视觉证据：'))['evidence_id'] for part in content
                  if part['type']=='text' and part['text'].startswith('视觉证据：')]
            result=dict(summary='本轮未形成判据',checks=[],suspects=[],limitations=[],discovery=dict(parts=[],areas=[dict(
                direction_id=None,direction='边缘观察',status='已形成知识',reason='可见外观尚不足以建立判据',evidence_ids=refs),dict(
                direction_id=None,direction='部件观察',status='已形成知识',reason='可见部件仍不足以建立判据',evidence_ids=refs)]))
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})
    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job=runtime.knowledge.start(request=selected_group(db,config.dataset.id,'normal'),mining_prompt=self_discovery_prompt)
        runtime.jobs.wait(job['run_id'],5)
        result=runtime.jobs.status(job['run_id'])
        assert result['status']=='COMPLETED',result['errors']
        assert len(linked)==2 and '输出校验结果：' in linked[-1]
        snapshot=KnowledgeRepository(db).get(result['knowledge_version_id'])
        assert snapshot.mining_steps[0].result.discovery.areas[0].status=='证据不足'
        assert snapshot.checks==[]
    finally:runtime.close()


@pytest.mark.parametrize('observation', ['missing', 'partial'])
@pytest.mark.parametrize('custom_instruction', [False, True])
def test_mining_uses_selected_directions_without_requiring_one_result_per_direction(dataset, observation, custom_instruction):
    from iad_core.workbench.runtime import WorkbenchRuntime
    from iad_core.workbench.vision import VlmClient
    from iad_core.exploration.models import ExplorationStart
    from iad_core.exploration.repository import ExplorationRepository
    from iad_core.knowledge.repository import KnowledgeRepository
    from iad_core.knowledge.prompts import KnowledgePrompts, MiningPromptQuery, MiningPromptEdit

    db, _, config = dataset
    selected = []; learned = []; schemas = []

    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        name = body['response_format']['json_schema']['name']; content = body['messages'][0]['content']
        refs = [json.loads(part['text'].removeprefix('视觉证据：'))['evidence_id'] for part in content
                if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        if name == 'DirectionDraft':
            result = dict(summary='可观察的结构方向', limitations=[], directions=[dict(title=title, instruction=text,
                applies_to='both', rationale='本批存在可见结构', evidence_ids=refs[:1], limitations=[])
                for title, text in [('主体轮廓', '比较主体轮廓连续性'), ('边缘分布', '比较边缘形状分布')]])
        elif name == 'KnowledgeDiscoveryLinks':
            result = {'area_0': dict(status='证据不足', subjects=[], check_titles=[])}
        else:
            learned.append(content[0]['text'])
            schemas.append(body['response_format']['json_schema']['schema'])
            result = dict(summary='保留实际观察', checks=[], suspects=[], limitations=[])
            if observation == 'partial':
                result['discovery'] = dict(parts=[], areas=[dict(direction_id=selected[0].direction_id,
                    direction=selected[0].title, status='证据不足', reason='本组尚未形成可复用判据', evidence_ids=[])])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.exploration.start(ExplorationStart(dataset_id=config.dataset.id,
            normal_images=[config.dataset.id+':normal.png'], defect_images=[config.dataset.id+':dent.png']))
        runtime.jobs.wait(job['run_id'], 5)
        explored = ExplorationRepository(db).catalog(config.dataset.id).exploration.directions
        prompts = KnowledgePrompts(db)
        prompt = prompts.read(MiningPromptQuery(dataset_id=config.dataset.id, kind='normal'))
        configuration = prompt.configuration
        chosen_ids = {'shape', explored[0].direction_id}
        for direction in configuration.directions:
            direction.enabled = direction.direction_id in chosen_ids
        selected[:] = [direction for direction in configuration.directions if direction.enabled]
        assert len(selected) == 2
        if custom_instruction:
            configuration.instruction = '联合观察主体轮廓，按实际图像保留发现与分歧。'
        saved = prompts.save(MiningPromptEdit(dataset_id=config.dataset.id, kind='normal',
            expected_revision=prompt.revision, configuration=configuration))
        instruction = saved.instruction
        ids = list(runtime.knowledge.sources.registered(config.dataset.id).qualifications)
        job = runtime.knowledge.start(request=dict(images=ids, image_count=len(ids)), mining_prompt=FrozenMiningPrompt.capture(configuration))
        runtime.jobs.wait(job['run_id'], 5)
        result = runtime.jobs.status(job['run_id'])
        assert result['status'] == 'COMPLETED', result['errors']
        assert len(learned) == 1, '不应因模型未逐项返回方向观察而触发补写重试'
        assert learned[0].startswith(instruction.split('{{response_schema}}', 1)[0])
        snapshot = KnowledgeRepository(db).get(result['knowledge_version_id'])
        frozen = snapshot.mining_prompt
        assert frozen.instruction == instruction
        assert {direction.direction_id for direction in frozen.configuration.directions if direction.enabled} == chosen_ids
        if not custom_instruction:
            assert all(direction.direction_id + ' | ' in instruction for direction in selected)
            assert all(direction.direction_id + ' | ' not in instruction for direction in configuration.directions if not direction.enabled)
            assert '必须覆盖' not in instruction
            assert '逐项记录全部已选' not in instruction
        discovery = snapshot.mining_steps[0].result.discovery
        assert (discovery is None) if observation == 'missing' else len(discovery.areas) == 1
        assert schemas[0]['$defs']['ObservedDiscovery']['properties']['areas'].get('minItems', 0) == 0
    finally:
        runtime.close()
