import json
import re
import threading

import httpx
import pytest

from tests.knowledge_scenarios import selected_group


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
                                   'configuration': {'objective': '检查两孔关系以及孔内背景，不分析标识。', 'directions': [
                                       {'direction_id': 'holes', 'title': '两孔关系', 'instruction': '检查孔位与数量'}]}}, db.db_path)
    entered, release = threading.Event(), threading.Event()
    prompts = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 5000, 'max_model_len': 262144})
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        prompts.append(content[0]['text'])
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
        job = service.start(request=selected_group(db, config.dataset.id, 'normal'), kind='normal', model_name='test-mllm')
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
            assert knowledge_get(query, db.db_path)['knowledge'] is None
            return
        assert finished['status'] == 'COMPLETED', finished['errors']
        snapshot = knowledge_get({'version_id': finished['knowledge_version_id']}, db.db_path)['knowledge']
        assert snapshot['mining_prompt']['instruction'] == chosen['instruction']
        assert chosen['instruction'] in prompts[0]
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


def test_stop_with_incomplete_json_is_reported_without_repair_or_retry(knowledge_dataset):
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
        job = service.start(request=selected_group(db, config.dataset.id, 'normal'), kind='normal', model_name='test-mllm')
        service.wait(job['run_id'], 5)
        finished = service.status(job['run_id'])
        assert finished['status'] == 'FAILED' and len(calls) == 1
        assert 'JSON语法无效' in finished['errors'][0]['message']
        assert 'EOF' in finished['errors'][0]['message']
        assert knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge'] is None
        generated = next(call for call in finished['model_calls'] if call['operation'] == 'generate')
        detail = model_call_get({'run_id': job['run_id'], 'call_id': generated['call_id']}, db.db_path)
        assert json.loads(detail['response_body'])['choices'][0]['message']['content'] == malformed
    finally:
        service.close()


@pytest.mark.parametrize('invalid_link', [None, 'unknown_part', 'empty_formed'])
def test_mining_links_visual_observations_using_frozen_name_enumerations(knowledge_dataset, invalid_link):
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
            assert all(eid in content[0]['text'] for eid in supplied[:3])
            result = {'area_0': {'status': '已形成知识', 'subjects': ['圆形开口' if invalid_link == 'unknown_part' else '圆孔'],
                                 'check_titles': ['孔内背景可见']},
                      'area_1': {'status': '已形成知识' if invalid_link == 'empty_formed' else '证据不足',
                                 'subjects': ['圆孔'], 'check_titles': []}}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(request=selected_group(db, config.dataset.id, 'normal'), kind='normal', model_name='test-mllm')
        service.wait(job['run_id'], 5)
        finished = service.status(job['run_id'])
        assert len(generated) == 2, finished['errors']
        assert [call['schema_name'] for call in finished['model_calls'] if call['operation'] == 'generate'] == ['KnowledgeDraft', 'KnowledgeDiscoveryLinks']
        snapshot = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
        if invalid_link:
            assert finished['status'] == 'FAILED' and snapshot is None
            assert ('literal_error' if invalid_link == 'unknown_part' else '形成知识的观察方向必须关联判据') in finished['errors'][0]['message']
        else:
            assert finished['status'] == 'COMPLETED', finished['errors']
            area = snapshot['mining_steps'][0]['result']['discovery']['areas'][0]
            assert area['subjects'] == ['圆孔'] and area['check_titles'] == ['孔内背景可见']
            assert area['evidence_ids'] == supplied[:3]
            unresolved = snapshot['mining_steps'][0]['result']['discovery']['areas'][1]
            assert unresolved['status'] == '证据不足' and unresolved['check_titles'] == []
            assert unresolved['reason'] == '三个来源可见外缘，但本次增量未建立外缘判据'
            assert unresolved['evidence_ids'] == supplied[:3]
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
