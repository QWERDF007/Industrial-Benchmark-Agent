import json
import threading

import httpx
import pytest


@pytest.fixture
def model_http(monkeypatch):
    client_type = httpx.Client

    def install(respond):
        class ModelHttpClient(client_type):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **{**kwargs, 'transport':httpx.MockTransport(respond)})
        monkeypatch.setattr(httpx, 'Client', ModelHttpClient)

    return install


def test_mixed_examples_produce_selectable_directions_without_publishing_knowledge(dataset, monkeypatch, model_http):
    from iad_core.entry import (direction_exploration_start, direction_exploration_status,
                               direction_exploration_get, knowledge_prompt_get, knowledge_prompt_save,
                               knowledge_directions_adopt, knowledge_get, workbench)

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

    model_http(respond)
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
def test_exploration_handles_missing_evidence_capacity_and_empty_results(dataset, monkeypatch, model_http, case):
    from iad_core.entry import direction_exploration_start, direction_exploration_get, workbench

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

    model_http(respond)
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
def test_cancelled_exploration_keeps_frozen_sources_for_explicit_retry(dataset, monkeypatch, model_http, changed):
    from pathlib import Path
    from PIL import Image
    from iad_core.entry import (direction_exploration_start, direction_exploration_cancel,
                               direction_exploration_retry, direction_exploration_get, workbench)

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

    model_http(respond)
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


def test_exploration_reports_real_preparation_capacity_and_joint_request(dataset, monkeypatch, model_http):
    from iad_core.entry import direction_exploration_start, direction_exploration_status, workbench

    db, _, config = dataset
    capacity_entered, allow_capacity = threading.Event(), threading.Event()
    generation_entered, allow_generation = threading.Event(), threading.Event()

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            capacity_entered.set()
            assert allow_capacity.wait(5)
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        generation_entered.set()
        assert allow_generation.wait(5)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            {'summary': '图组不足以形成方向', 'directions': [], 'limitations': []})}}]})

    model_http(respond)
    runtime = workbench(db.db_path)
    try:
        prefix = config.dataset.id + ':'
        job = direction_exploration_start({'request': {'dataset_id': config.dataset.id,
            'normal_images': [prefix + 'normal.png', prefix + 'normal2.png'],
            'defect_images': [prefix + 'dent.png', prefix + 'scratch.png']}}, db.db_path)
        assert capacity_entered.wait(3)
        checking = direction_exploration_status({'run_id': job['run_id']}, db.db_path)
        assert checking['phase'] == 'CHECKING_CAPACITY'
        assert checking['prepared_sources'] == 4 and checking['completed'] == 0
        assert checking['phase_started_at'] and checking['submitted_at']
        assert checking['model_calls'][0]['phase'] == 'CHECKING_CAPACITY'
        allow_capacity.set()
        assert generation_entered.wait(3)
        generating = direction_exploration_status({'run_id': job['run_id']}, db.db_path)
        assert generating['phase'] == 'EXPLORING_DIRECTIONS'
        assert generating['phase_started_at'] >= checking['phase_started_at']
        assert generating['completed'] == 0 and generating['progress'] == 0
        assert generating['model_calls'][-1]['operation'] == 'generate'
        allow_generation.set(); runtime.jobs.wait(job['run_id'], 5)
        finished = direction_exploration_status({'run_id': job['run_id']}, db.db_path)
        assert finished['status'] == 'COMPLETED' and finished['completed'] == 4
        assert finished['phase'] == 'DIRECTIONS_PUBLISHED'
    finally:
        allow_capacity.set(); allow_generation.set(); runtime.close()


def test_exploration_fifo_keeps_pending_clients_and_waits_for_running_cancel(dataset, monkeypatch, model_http):
    from iad_core.entry import (direction_exploration_start, direction_exploration_status,
        direction_exploration_cancel, direction_exploration_list, direction_exploration_get, workbench)

    db, _, config = dataset
    entered = {name: threading.Event() for name in 'ABC'}
    release = {name: threading.Event() for name in 'ABC'}
    calls, finished_callbacks = [], []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        text = json.loads(request.content)['messages'][0]['content'][0]['text']
        name = next(name for name in 'ABC' if '用户探索目标：' + name + '\n' in text)
        calls.append(name); entered[name].set()
        assert release[name].wait(5)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            {'summary': name, 'directions': [], 'limitations': []})}}]})

    model_http(respond)
    execution = {'profile': {'endpoint': 'http://model.test/v1', 'model_id': 'frozen-model', 'capacity_mode': 'vllm_tokenize'}}
    prefix = config.dataset.id + ':'
    request = {'dataset_id': config.dataset.id, 'normal_images': [prefix + 'normal.png'], 'defect_images': [prefix + 'dent.png']}
    runtime = workbench(db.db_path)
    try:
        a = direction_exploration_start({'request': {**request, 'objective': 'A'}, '_model_execution': execution}, db.db_path)
        assert entered['A'].wait(3)
        b = direction_exploration_start({'request': {**request, 'objective': 'B'}, '_model_execution': execution}, db.db_path)
        c = direction_exploration_start({'request': {**request, 'objective': 'C'}, '_model_execution': execution}, db.db_path)
        assert b['status'] == c['status'] == 'PENDING'
        assert b['started_at'] is None and b['queue_position'] == 1 and c['queue_position'] == 2
        runtime.jobs.after_finished(b['run_id'], lambda: finished_callbacks.append('B'))
        assert finished_callbacks == []
        listing = direction_exploration_list({'dataset_id': config.dataset.id}, db.db_path)
        assert listing['pending_count'] == 2
        assert listing['jobs'][0]['run_id'] == a['run_id']
        assert direction_exploration_cancel({'run_id': b['run_id']}, db.db_path)['status'] == 'CANCELLED'
        assert finished_callbacks == ['B']
        assert direction_exploration_status({'run_id': c['run_id']}, db.db_path)['queue_position'] == 1
        stopping = direction_exploration_cancel({'run_id': a['run_id']}, db.db_path)
        assert stopping['status'] == 'RUNNING' and stopping['cancel_requested']
        assert not entered['C'].is_set() and calls == ['A']
        release['A'].set(); runtime.jobs.wait(a['run_id'], 5)
        assert entered['C'].wait(3), 'C must run using the client retained while pending'
        assert direction_exploration_status({'run_id': a['run_id']}, db.db_path)['status'] == 'CANCELLED'
        assert direction_exploration_get({'dataset_id': config.dataset.id}, db.db_path)['versions'] == []
        release['C'].set(); runtime.jobs.wait(c['run_id'], 5)
        assert direction_exploration_status({'run_id': c['run_id']}, db.db_path)['status'] == 'COMPLETED'
        assert calls == ['A', 'C']
        assert direction_exploration_list({'dataset_id': config.dataset.id}, db.db_path)['pending_count'] == 0
    finally:
        for event in release.values(): event.set()
        runtime.close()


def test_exploration_concurrent_fifo_keeps_running_visible_beyond_recent_30(dataset, monkeypatch, model_http):
    from concurrent.futures import ThreadPoolExecutor
    from iad_core.entry import direction_exploration_start, direction_exploration_list, direction_exploration_status, workbench

    db, _, config = dataset
    entered, release = threading.Event(), threading.Event()
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        text = json.loads(request.content)['messages'][0]['content'][0]['text']
        objective = text.split('用户探索目标：')[1].split('\n')[0]
        calls.append(objective)
        if objective == 'first':
            entered.set(); assert release.wait(15)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            {'summary': objective, 'directions': [], 'limitations': []})}}]})

    model_http(respond)
    runtime = workbench(db.db_path);prefix = config.dataset.id + ':'
    request = {'dataset_id': config.dataset.id, 'normal_images': [prefix + 'normal.png'], 'defect_images': [prefix + 'dent.png']}
    try:
        first = direction_exploration_start({'request': {**request, 'objective': 'first'}}, db.db_path)
        assert entered.wait(3)
        with ThreadPoolExecutor(max_workers=4) as pool:
            queued = list(pool.map(lambda index: direction_exploration_start({'request': {**request, 'objective': str(index)}}, db.db_path), range(32)))
        assert all(job['status'] == 'PENDING' for job in queued)
        queued.sort(key=lambda job: job['queue_position'])
        assert [job['queue_position'] for job in queued] == list(range(1, 33))
        listing = direction_exploration_list({'dataset_id': config.dataset.id}, db.db_path)
        assert listing['pending_count'] == 32 and len(listing['jobs']) == 31
        assert listing['jobs'][0]['run_id'] == first['run_id']
        assert calls == ['first']
        release.set()
        runtime.jobs.wait(queued[-1]['run_id'], 10)
        assert direction_exploration_status({'run_id': queued[-1]['run_id']}, db.db_path)['status'] == 'COMPLETED'
        assert calls == ['first'] + [job['request']['exploration_request']['objective'] for job in queued]
    finally:
        release.set(); runtime.close()


def test_closing_exploration_worker_interrupts_pending_without_dispatch(dataset, monkeypatch, model_http):
    from iad_core.entry import direction_exploration_start, direction_exploration_status, workbench
    from iad_core.workbench.runtime import WorkbenchRuntime

    db, _, config = dataset
    entered, release = threading.Event(), threading.Event()
    calls, cleaned = [], []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        calls.append(request); entered.set(); assert release.wait(5)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            {'summary': '', 'directions': [], 'limitations': []})}}]})

    model_http(respond)
    runtime = workbench(db.db_path);prefix = config.dataset.id + ':'
    request = {'dataset_id': config.dataset.id, 'normal_images': [prefix + 'normal.png'], 'defect_images': [prefix + 'dent.png']}
    try:
        a = direction_exploration_start({'request': request}, db.db_path);assert entered.wait(3)
        b = direction_exploration_start({'request': request}, db.db_path)
        runtime.jobs.after_finished(b['run_id'], lambda: cleaned.append('pending-client'))
        runtime.jobs.close()
        assert cleaned == ['pending-client']
        assert direction_exploration_status({'run_id': b['run_id']}, db.db_path)['status'] == 'INTERRUPTED'
        release.set();runtime.jobs.wait(a['run_id'], 5)
        assert len(calls) == 1
        fresh = WorkbenchRuntime(db)
        try:
            assert fresh.jobs.status(b['run_id'])['status'] == 'INTERRUPTED'
            assert fresh.jobs.status(a['run_id'])['status'] == 'CANCELLED'
        finally:
            fresh.close()
    finally:
        release.set();runtime.close()


def test_exploration_presets_persist_and_edited_body_is_the_execution_input(dataset, monkeypatch, model_http):
    from iad_core.entry import (direction_exploration_presets, direction_exploration_preset_save,
        direction_exploration_start, direction_exploration_status, direction_exploration_get, workbench)

    db, _, config = dataset
    presets = direction_exploration_presets({}, db.db_path)['presets']
    assert [p['name'] for p in presets] == ['通用对比探索', '正常变化与成像差异', '表面与局部差异', '结构与装配关系']
    assert all(p['builtin'] and p['text'].strip() for p in presets)
    custom = direction_exploration_preset_save({'name': '连接器反光对比', 'text': '仅联合比较本次反光位置，保留不确定性。'}, db.db_path)
    assert not custom['builtin']
    assert custom in direction_exploration_presets({}, db.db_path)['presets']
    with pytest.raises(ValueError, match='同名'):
        direction_exploration_preset_save({'name': ' 连接器反光对比 ', 'text': '不能覆盖'}, db.db_path)
    with pytest.raises(ValueError):
        direction_exploration_preset_save({'name': '空白', 'text': '  '}, db.db_path)
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        calls.append(json.loads(request.content))
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            {'summary': '', 'directions': [], 'limitations': []})}}]})

    model_http(respond)
    runtime = workbench(db.db_path);prefix = config.dataset.id + ':'
    prompt = {'preset_id': custom['id'], 'preset_name': custom['name'], 'text': custom['text'] + ' 识别句子：不要推断内部材质。'}
    try:
        job = direction_exploration_start({'request': {'dataset_id': config.dataset.id,
            'normal_images': [prefix + 'normal.png'], 'defect_images': [prefix + 'dent.png'], 'prompt': prompt}}, db.db_path)
        runtime.jobs.wait(job['run_id'], 5)
        done = direction_exploration_status({'run_id': job['run_id']}, db.db_path)
        assert done['status'] == 'COMPLETED', done['errors']
        assert done['exploration_prompt'] == prompt
        assert len(calls) == 1
        instruction = calls[0]['messages'][0]['content'][0]['text']
        assert instruction.startswith(prompt['text'])
        assert '识别句子：不要推断内部材质。' in instruction
        assert '联合观察全部候选良品与异常图，自行提出这个数据集值得深入挖掘的检查方向。' not in instruction
        assert direction_exploration_get({'dataset_id': config.dataset.id}, db.db_path)['exploration']['request']['prompt'] == prompt
        default = direction_exploration_start({'request': {'dataset_id': config.dataset.id,
            'normal_images': [prefix + 'normal.png'], 'defect_images': [prefix + 'dent.png']}}, db.db_path)
        runtime.jobs.wait(default['run_id'], 5)
        assert direction_exploration_status({'run_id': default['run_id']}, db.db_path)['exploration_prompt']['text'] == presets[0]['text']
    finally:
        runtime.close()


def test_queued_exploration_freezes_prompt_and_revalidates_sources(dataset, monkeypatch, model_http):
    from pathlib import Path
    from PIL import Image
    from iad_core.entry import direction_exploration_start, direction_exploration_status, direction_exploration_get, workbench

    db, _, config = dataset
    entered, release = threading.Event(), threading.Event()
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        body = json.loads(request.content);text = body['messages'][0]['content'][0]['text'];calls.append(text)
        if len(calls) == 1:
            entered.set();assert release.wait(5)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            {'summary': '', 'directions': [], 'limitations': []})}}]})

    model_http(respond)
    runtime = workbench(db.db_path);prefix = config.dataset.id + ':'
    request = {'dataset_id': config.dataset.id, 'normal_images': [prefix + 'normal.png'], 'defect_images': [prefix + 'dent.png'],
               'prompt': {'text': '入队时的正文。'}}
    try:
        direction_exploration_start({'request': {**request, 'defect_images': [prefix + 'scratch.png']}}, db.db_path)
        assert entered.wait(3)
        b = direction_exploration_start({'request': request}, db.db_path)
        c = direction_exploration_start({'request': {**request, 'defect_images': [prefix + 'scratch.png']}}, db.db_path)
        request['prompt']['text'] = '后续修改的页面草稿。'
        Image.new('RGB', (320, 240), 'green').save(Path(db.db_path).parent / 'images' / 'dent.png')
        release.set();runtime.jobs.wait(c['run_id'], 5)
        assert direction_exploration_status({'run_id': b['run_id']}, db.db_path)['status'] == 'FAILED'
        assert '变化' in direction_exploration_status({'run_id': b['run_id']}, db.db_path)['errors'][0]['message']
        assert direction_exploration_status({'run_id': c['run_id']}, db.db_path)['status'] == 'COMPLETED'
        assert len(calls) == 2 and all(text.startswith('入队时的正文。') for text in calls)
        assert len(direction_exploration_get({'dataset_id': config.dataset.id}, db.db_path)['versions']) == 2
    finally:
        release.set();runtime.close()
