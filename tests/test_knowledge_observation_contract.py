import copy
import json

import httpx
import pytest

from iad_core.evidence.images import EvidenceImages
from iad_core.knowledge.mining import KnowledgeInput
from iad_core.knowledge.models import KnowledgeCheck
from iad_core.knowledge.observation import KnowledgeObserver
from iad_core.knowledge.sources import KnowledgeSources
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize('mode', ['complete', 'missing_cell', 'foreign_evidence', 'extra_source'])
def test_observation_matrix_binds_every_cell_to_frozen_real_references(knowledge_dataset, mode):
    db, config = knowledge_dataset
    sample_ids = [config.dataset.id + ':part-0.png', config.dataset.id + ':part-1.png']
    sources = KnowledgeSources(db).collect(config.dataset.id, sample_ids, 'normal')
    images = EvidenceImages(db.db_path)
    from iad_core.storage.repositories import SampleRepository
    inputs = []
    for index, source in enumerate(sources):
        sample = SampleRepository(db).get(source.sample_id)
        prepared = [images.capture(sample, 'normal', 'reference', source_sha256=source.sha256)]
        if index == 0:
            prepared.append(images.capture(sample, 'roi', 'annotation', [80, 90, 120, 150], source.sha256))
        inputs.append(KnowledgeInput(source, prepared))
    checks = [KnowledgeCheck(check_id='check_' + letter * 64, title=title, subject='主体', location='全图',
        criterion=title, allowed_variations=[], limitations=[], status='supported',
        support_evidence_ids=[inputs[0].images[0].evidence.evidence_id], counter_evidence_ids=[])
        for letter, title in [('a', '外轮廓完整'), ('b', '孔内可见背景')]]
    cell = {'status': 'supports', 'description': '可见结构符合判据', 'position_analysis': '主体区域',
        'illumination_analysis': '照明均匀', 'normal_explanation': '未见反例', 'suspects': []}
    requests = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        body = json.loads(request.content)
        requests.append(body)
        schema = body['response_format']['json_schema']['schema']
        assert set(schema['required']) == {'s0', 's1'}
        assert not any(check.check_id in json.dumps(schema) for check in checks)
        content = body['messages'][0]['content']
        metadata = [json.loads(part['text'].removeprefix('视觉证据：')) for part in content
            if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        assert [item['evidence_id'] for item in metadata] == ['v0', 'v1', 'v2']
        assert [item['sha256'] for item in metadata] == [image.evidence.sha256 for item in inputs for image in item.images]
        matrix = {'s0': {'c0': {**cell, 'evidence_ids': ['v0']}, 'c1': {**cell, 'evidence_ids': ['v1']}},
            's1': {'c0': {**cell, 'evidence_ids': ['v2']}, 'c1': {**cell, 'evidence_ids': ['v2']}}}
        matrix['s1']['c1'] = {**matrix['s1']['c1'], 'status': 'contradicts',
            'suspects': [{'evidence_id': 'v2', 'bbox_1000': [100, 100, 200, 200],
                'description': '局部需核对', 'normal_explanation': '需排除反光'}]}
        if mode == 'missing_cell':
            del matrix['s0']['c1']
        elif mode == 'foreign_evidence':
            matrix['s0']['c0']['evidence_ids'] = ['v2']
        elif mode == 'extra_source':
            matrix['s2'] = copy.deepcopy(matrix['s0'])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
            'message': {'content': json.dumps(matrix, ensure_ascii=False)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    runtime = WorkbenchRuntime(db, client)
    try:
        def execute(context):
            observer = KnowledgeObserver(client, context)
            observer.evaluate('frozen-version', checks, inputs, 'test-mllm')
            context.record(sample_ids, observation_result=observer.steps[0].result.model_dump(mode='json'))

        job = runtime.jobs.start('NORMAL_KNOWLEDGE', config.task.task_id,
            {'dataset_id': config.dataset.id, 'sample_ids': sample_ids}, execute, '完整图组观察')
        runtime.jobs.wait(job['run_id'], 10)
        saved = runtime.jobs.status(job['run_id'])
        if mode != 'complete':
            assert saved['status'] == 'FAILED' and saved['completed'] == 0
            assert saved['errors']
            return
        assert saved['status'] == 'COMPLETED', saved['errors']
        observed = saved['observation_result']['observations']
        assert [(item['sample_id'], item['check_id']) for item in observed] == [
            (sample_id, check.check_id) for sample_id in sample_ids for check in checks]
        assert observed[1]['evidence_ids'] == [inputs[0].images[1].evidence.evidence_id]
        assert observed[3]['suspects'][0]['evidence_id'] == inputs[1].images[0].evidence.evidence_id
        assert observed[3]['status'] == 'contradicts'
        assert len(requests) == 1
        assert all(call['error'] is None for call in saved['model_calls'])
    finally:
        runtime.close()
