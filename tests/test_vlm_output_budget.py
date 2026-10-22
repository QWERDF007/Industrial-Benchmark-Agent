import json

import httpx
import pytest
from PIL import Image

from iad_core.entry import dataset_import, knowledge_get
from iad_core.knowledge.service import KnowledgeService
from iad_core.storage.database import Database
from iad_core.workbench.vision import VlmClient
from tests.knowledge_scenarios import frozen_observation_response, selected_group


@pytest.mark.parametrize('output_cap', [None, 32768])
@pytest.mark.parametrize('initial_count', [20, 50])
def test_selected_groups_use_actual_context_for_complete_knowledge(tmp_path, monkeypatch, output_cap, initial_count):
    monkeypatch.setenv('IAD_VLM_MAX_VISUAL_INPUTS', str(initial_count))
    if output_cap is None:
        monkeypatch.delenv('LIVE_VLM_MAX_OUTPUT_TOKENS', raising=False)
    else:
        monkeypatch.setenv('LIVE_VLM_MAX_OUTPUT_TOKENS', str(output_cap))
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    images.mkdir()
    labels.mkdir()
    for index in range(initial_count + 10):
        Image.new('RGB', (222, 401), (100 + index, 120, 140)).save(images / f'{index}.png')
    db = Database(str(tmp_path / 'benchmark.db'))
    dataset = dataset_import(dict(format='labelme', name='连续输出预算', image_dir=str(images), annotation_dir=str(labels)), db.db_path)
    ids = [dataset['dataset_id'] + f':{index}.png' for index in range(initial_count + 10)]
    budgets, sizes = [], []

    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 18015, 'max_model_len': 262144})
        budgets.append(body['max_tokens'])
        sizes.append(sum(part['type'] == 'image_url' for part in body['messages'][0]['content']))
        if body['max_tokens'] < 16384:
            return httpx.Response(200, json={'usage': {'prompt_tokens': 18015, 'completion_tokens': 8192, 'total_tokens': 26207},
                'choices': [{'finish_reason': 'length', 'message': {'content': '{"summary":"未完成'}}]})
        observation = frozen_observation_response(request)
        if observation is not None:
            return observation
        content = body['messages'][0]['content']
        refs = [json.loads(part['text'][5:])['evidence_id'] for part in content
                if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps({
            'summary': '图组完整归纳', 'checks': [{'title': '主体轮廓', 'subject': '主体', 'location': '全图',
            'criterion': '矩形连续轮廓', 'allowed_variations': [], 'support_evidence_ids': refs,
            'counter_evidence_ids': [], 'limitations': [], 'status': 'supported'}], 'suspects': [], 'limitations': [],
        })}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = service.start(request=selected_group(db, dataset['dataset_id'], 'normal', ids[:initial_count]), kind='normal', model_name='configured-mllm')
        service.wait(first['run_id'], 10)
        status = service.status(first['run_id'])
        assert status['status'] == 'COMPLETED', status['errors']
        v1 = status['knowledge_version_id']
        second = service.start(request=selected_group(db, dataset['dataset_id'], 'normal', ids[initial_count:], [v1]), kind='normal', model_name='configured-mllm')
        service.wait(second['run_id'], 10)
        status = service.status(second['run_id'])
        assert status['status'] == 'COMPLETED', status['errors']
        knowledge = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
        assert knowledge['parent_version_id'] == v1
        assert len(knowledge['sources']) == initial_count + 10
        assert sizes == [initial_count, 10, 10]
        assert budgets == [output_cap or 244129] * 3
    finally:
        service.close()


def test_explicit_output_cap_preserves_truncated_response_and_rejects_changed_retry(knowledge_dataset, monkeypatch):
    monkeypatch.setenv('LIVE_VLM_MAX_OUTPUT_TOKENS', '8192')
    db, config = knowledge_dataset
    calls = []

    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 18015, 'max_model_len': 262144})
        calls.append(body)
        return httpx.Response(200, json={'usage': {'completion_tokens': 8192}, 'choices': [
            {'finish_reason': 'length', 'message': {'content': '{"summary":"未完成'}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        started = service.start(request=selected_group(db, config.dataset.id, 'normal'), kind='normal', model_name='configured-mllm')
        service.wait(started['run_id'], 5)
        status = service.status(started['run_id'])
        assert status['status'] == 'FAILED'
        assert status['knowledge_version_id'] is None
        assert len(calls) == 1, '输出受限时不盲重试、不接受截断'
        assert calls[0]['max_tokens'] == 8192
        assert '本次输出预算 8192' in status['errors'][0]['message']
        assert status['model_calls'][-1]['finish_reason'] == 'length'
        assert status['request']['model_profile']['max_output_tokens'] == 8192
    finally:
        service.close()
    monkeypatch.setenv('LIVE_VLM_MAX_OUTPUT_TOKENS', '32768')
    changed = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        with pytest.raises(ValueError, match='模型配置或知识生成规则已变化'):
            changed.retry(started['run_id'])
        assert len(calls) == 1
    finally:
        changed.close()
