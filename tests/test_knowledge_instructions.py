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
                                   'configuration': {'objective': '检查两孔关系以及孔内背景，不分析标识。', 'directions': []}}, db.db_path)
    entered, release = threading.Event(), threading.Event()
    prompts = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 5000, 'max_model_len': 262144})
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        prompts.append(content[0]['text'])
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
                      'areas': [{'direction': '两孔关系', 'subjects': ['孔板'], 'status': '已形成知识',
                                 'reason': '两个独立来源均可见\n仍需保留成像变化限制', 'check_titles': ['两孔数量', '孔位排列'], 'evidence_ids': ids[:2]},
                                {'direction': '精密孔径', 'subjects': ['孔板'], 'status': '不可观察',
                                 'reason': '无标尺和标定', 'check_titles': [], 'evidence_ids': []}]}}
        definitions = body['response_format']['json_schema']['schema']['$defs']
        # The deployed grammar backend uses full-string matching for patterns.
        for model, field, value in [('ObservedPart', 'name', '孔板'), ('DiscoveryArea', 'direction', '两孔关系'),
                                    ('DiscoveryArea', 'reason', '两个独立来源均可见\n仍需保留成像变化限制')]:
            assert re.fullmatch(definitions[model]['properties'][field]['pattern'], value), f'生成约束无法表达完整的{field}'
        area = result['discovery']['areas'][0]
        if invalid == 'unknown_part':
            area['subjects'] = ['虚构基座']
        elif invalid == 'unknown_check':
            area['check_titles'] = ['未归纳的判据']
        elif invalid == 'unsupplied_image':
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
                assert ('虚构基座' if invalid == 'unknown_part' else '未归纳的判据') in finished['errors'][0]['message']
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
        assert page['items'][0]['direction'] == '两孔关系'
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
