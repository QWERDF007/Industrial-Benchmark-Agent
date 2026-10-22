import json
import threading

import httpx
import pytest


def test_mixed_examples_produce_selectable_directions_without_publishing_knowledge(dataset, monkeypatch):
    from iad_core.entry import (direction_exploration_start, direction_exploration_status,
                               direction_exploration_get, knowledge_prompt_get, knowledge_prompt_save,
                               knowledge_directions_adopt, knowledge_get, workbench)
    from iad_core.workbench.vision import VlmClient

    db, _, config = dataset
    prefix = config.dataset.id + ':'
    normal = [prefix + 'normal.png', prefix + 'normal2.png']
    abnormal = [prefix + 'dent.png', prefix + 'scratch.png']
    calls = []
    monkeypatch.delenv('LIVE_VLM_MODEL', raising=False)

    def respond(request):
        if request.method == 'GET' and request.url.path.endswith('/models'):
            return httpx.Response(200, json={'data': [{'id': 'actual-provider-model'}]})
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 5000, 'max_model_len': 262144})
        calls.append(body)
        assert body['model'] == 'actual-provider-model'
        content = body['messages'][0]['content']
        assert sum(part['type'] == 'image_url' for part in content) == 4
        assert all(sid in content[0]['text'] for sid in normal + abnormal)
        ids = [json.loads(p['text'].removeprefix('视觉证据：'))['evidence_id']
               for p in content if p['type'] == 'text' and p['text'].startswith('视觉证据：')]
        result = {'summary': '观察两组样例提出待选方向', 'limitations': ['样例有限'], 'directions': [
            {'title': '表面色泽分布', 'instruction': '比较主体颜色分布与光照影响', 'applies_to': 'both',
             'rationale': '两组均存在可比较表面', 'evidence_ids': ids, 'limitations': ['缺少标定']},
            {'title': '局部变化', 'instruction': '定位与正常外观不一致的局部并排除反光', 'applies_to': 'defect',
             'rationale': '异常候选存在局部差异', 'evidence_ids': ids[2:], 'limitations': []}]}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    monkeypatch.setattr('iad_core.workbench.runtime.VlmClient', lambda: VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        before = knowledge_prompt_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)
        job = direction_exploration_start({'request': {'dataset_id': config.dataset.id,
            'normal_images': normal, 'defect_images': abnormal}}, db.db_path)
        workbench(db.db_path).jobs.wait(job['run_id'], 5)
        finished = direction_exploration_status({'run_id': job['run_id']}, db.db_path)
        assert finished['status'] == 'COMPLETED', finished['errors']
        assert finished['completed'] == 4 and len(calls) == 1
        catalog = direction_exploration_get({'dataset_id': config.dataset.id}, db.db_path)
        snapshot = catalog['exploration']
        assert len(snapshot['directions']) == 2
        assert snapshot['run_id'] == job['run_id']
        assert snapshot['request']['normal_images'] == normal
        assert knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge'] is None
        assert knowledge_prompt_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path) == before
        direction = snapshot['directions'][0]
        configuration = before['configuration']
        configuration['directions'].append({'direction_id': direction['direction_id'], 'title': direction['title'],
            'instruction': '比较表面颜色，尤其排除光照差异', 'origin': 'explored', 'enabled': True})
        saved = knowledge_prompt_save({'dataset_id': config.dataset.id, 'kind': 'normal',
            'expected_revision': before['revision'], 'configuration': configuration}, db.db_path)
        assert '尤其排除光照差异' in saved['instruction']
        with pytest.raises(ValueError):
            knowledge_directions_adopt({'dataset_id': config.dataset.id, 'kind': 'normal',
                'expected_revision': saved['revision'], 'directions': [{'direction_id': direction['direction_id'],
                    'title': saved['configuration']['directions'][0]['title']}]}, db.db_path)
        assert knowledge_prompt_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path) == saved
        adopted = knowledge_directions_adopt({'dataset_id': config.dataset.id, 'kind': 'normal',
            'expected_revision': saved['revision'], 'directions': [{'direction_id': direction['direction_id'],
                'instruction': '结合光照对照比较颜色'}]}, db.db_path)
        assert len(adopted['configuration']['directions']) == len(saved['configuration']['directions'])
        assert '结合光照对照比较颜色' in adopted['instruction']
        with pytest.raises(ValueError, match='不适用'):
            knowledge_directions_adopt({'dataset_id': config.dataset.id, 'kind': 'normal',
                'expected_revision': adopted['revision'], 'directions': [{'direction_id': snapshot['directions'][1]['direction_id']}]}, db.db_path)
        assert knowledge_prompt_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path) == adopted
        assert direction_exploration_get({'dataset_id': config.dataset.id}, db.db_path)['exploration'] == snapshot
        next_job = direction_exploration_start({'request': {'dataset_id': config.dataset.id,
            'normal_images': normal, 'defect_images': abnormal, 'objective': '重新比较本组外观'}}, db.db_path)
        workbench(db.db_path).jobs.wait(next_job['run_id'], 5)
        history = direction_exploration_get({'dataset_id': config.dataset.id, 'direction_id': direction['direction_id']}, db.db_path)
        assert len(history['versions']) == 2
        assert history['exploration'] == snapshot, '已采用方向按稳定ID追溯原探索版本，不能替换成最新版本'
    finally:
        workbench(db.db_path).close()


@pytest.mark.parametrize('case', ['unknown_evidence', 'capacity', 'empty'])
def test_exploration_handles_missing_evidence_capacity_and_empty_results(dataset, monkeypatch, case):
    from iad_core.entry import direction_exploration_start, direction_exploration_get, workbench
    from iad_core.workbench.vision import VlmClient

    db, _, config = dataset
    prefix = config.dataset.id + ':'
    calls = []
    if case == 'capacity':
        monkeypatch.setenv('IAD_VLM_MAX_VISUAL_INPUTS', '1')

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        calls.append(request)
        result = {'summary': '没有可可靠归纳的方向', 'limitations': ['样例不足'], 'directions': []}
        if case == 'unknown_evidence':
            result['directions'] = [{'title': '颜色', 'instruction': '观察颜色', 'applies_to': 'both',
                'rationale': '需要比较', 'evidence_ids': ['not-supplied'], 'limitations': []}]
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    monkeypatch.setattr('iad_core.workbench.runtime.VlmClient', lambda: VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    runtime = workbench(db.db_path)
    try:
        request = {'dataset_id': config.dataset.id, 'normal_images': [prefix + 'normal.png'], 'defect_images': [prefix + 'dent.png']}
        with pytest.raises(ValueError):
            direction_exploration_start({'request': {**request, 'normal_images': request['defect_images']}}, db.db_path)
        job = direction_exploration_start({'request': request}, db.db_path)
        runtime.jobs.wait(job['run_id'], 5)
        done = runtime.jobs.status(job['run_id'])
        assert done['status'] == ('COMPLETED' if case == 'empty' else 'FAILED')
        assert len(calls) == (0 if case == 'capacity' else 1)
        catalog = direction_exploration_get({'dataset_id': config.dataset.id}, db.db_path)
        assert bool(catalog['versions']) == (case == 'empty')
        if case == 'empty':
            assert catalog['exploration']['directions'] == []
        else:
            assert done['errors']
    finally:
        runtime.close()


@pytest.mark.parametrize('changed', [False, True])
def test_cancelled_exploration_keeps_frozen_sources_for_explicit_retry(dataset, monkeypatch, changed):
    from pathlib import Path
    from PIL import Image
    from iad_core.entry import (direction_exploration_start, direction_exploration_cancel,
                               direction_exploration_retry, direction_exploration_get, workbench)
    from iad_core.workbench.vision import VlmClient

    db, _, config = dataset
    entered, release = threading.Event(), threading.Event()
    prefix = config.dataset.id + ':'
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        calls.append(request)
        entered.set()
        assert release.wait(5)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            {'summary': '不能形成方向', 'directions': [], 'limitations': ['仍需更多证据']})}}]})

    monkeypatch.setattr('iad_core.workbench.runtime.VlmClient', lambda: VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    runtime = workbench(db.db_path)
    try:
        job = direction_exploration_start({'request': {'dataset_id': config.dataset.id,
            'normal_images': [prefix + 'normal.png'], 'defect_images': [prefix + 'dent.png']}}, db.db_path)
        assert entered.wait(3)
        direction_exploration_cancel({'run_id': job['run_id']}, db.db_path)
        release.set(); runtime.jobs.wait(job['run_id'], 5)
        assert runtime.jobs.status(job['run_id'])['status'] == 'CANCELLED'
        assert direction_exploration_get({'dataset_id': config.dataset.id}, db.db_path)['versions'] == []
        if changed:
            Image.new('RGB', (320, 240), 'green').save(Path(db.db_path).parent / 'images' / 'dent.png')
            with pytest.raises(ValueError, match='变化'):
                direction_exploration_retry({'run_id': job['run_id']}, db.db_path)
            assert len(calls) == 1
        else:
            retry = direction_exploration_retry({'run_id': job['run_id']}, db.db_path)
            runtime.jobs.wait(retry['run_id'], 5)
            assert runtime.jobs.status(retry['run_id'])['status'] == 'COMPLETED'
            assert retry['root_run_id'] == job['run_id'] and retry['parent_run_id'] == job['run_id']
            assert len(calls) == 2
    finally:
        release.set(); runtime.close()
