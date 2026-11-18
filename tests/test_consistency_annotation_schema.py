import json
from uuid import uuid4

import httpx
import pytest

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.identity import CandidateIdentity
from iad_core.consistency.workflow import ConsistencyWorkflow
from iad_core.workbench.model_profile import ModelProfile
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient
from tests.consistency_support import start_prepared


@pytest.fixture
def merged_annotation_pair(dataset, tmp_path):
    database, registry, config = dataset
    for name, boxes in (('dent', [[[10, 10], [70, 30]]]),
            ('scratch', [[[10, 10], [40, 30]], [[40, 10], [70, 30]]])):
        (tmp_path / 'labels' / (name + '.json')).write_text(json.dumps({
            'imageWidth': 320, 'imageHeight': 240, 'shapes': [
                {'label': 'defect', 'shape_type': 'rectangle', 'points': points} for points in boxes]}))
    registry.rescan(config.dataset.id)
    runtime = WorkbenchRuntime(database)
    checks = ConsistencyAgentJobs(runtime)
    anchor = config.dataset.id + ':dent.png'
    run_id = start_prepared(checks, {'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id],
        'mode': 'exact', 'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
    checks.session_created(run_id, anchor)
    checks.retrieve(run_id, anchor)
    assert CandidateIdentity(runtime).prepare(run_id, anchor).completed
    try:
        yield runtime, checks, run_id, anchor
    finally:
        runtime.close()


@pytest.mark.parametrize('protocol', ['openai-completions', 'openai-responses'])
@pytest.mark.parametrize('invalid_first', [False, True])
def test_annotation_schema_enforces_real_object_counts_and_merge_direction(merged_annotation_pair, protocol, invalid_first, record_property):
    runtime, checks, run_id, anchor = merged_annotation_pair
    requests = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        messages = body['input'] if protocol == 'openai-responses' else body['messages']
        content = next(item['content'] for item in messages if item['role'] == 'user' and isinstance(item['content'], list))
        facts = json.loads(content[1]['text'])['facts']
        schema = body['text']['format']['schema'] if protocol == 'openai-responses' else body['response_format']['json_schema']['schema']
        record_property('schema_bytes', len(json.dumps(schema).encode()))

        def resolve(value):
            return schema['$defs'][value['$ref'].rsplit('/', 1)[-1]] if '$ref' in value else value

        candidate = next(iter(facts['candidates']))
        review = resolve(resolve(schema['properties']['reviews'])['properties'][candidate])
        items = review['properties']['issues']['items']
        assert 'anyOf' in items, '模型输出合同须按差异类型约束两侧对象数量'
        variants = {resolve(item)['properties']['type'].get('const'): resolve(item) for item in items['anyOf']}
        assert 'split' not in variants, '主图只有一个标注时，不能输出主图拆分'
        merge = variants['merge']['properties']
        assert merge['main_annotation_ids']['minItems'] == merge['main_annotation_ids']['maxItems'] == 1
        assert merge['candidate_annotation_ids']['minItems'] == 2
        assert merge['same_main_object_as']['maxItems'] == 0
        missing = variants['missing_annotation']['properties']
        assert missing['main_annotation_ids']['maxItems'] == 0
        assert missing['candidate_annotation_ids']['minItems'] == 1
        assert missing['same_main_object_as']['maxItems'] == 0, '没有其他候选时不能填写跨候选对象归并'
        requests.append(body)
        answer = {'reviews': {candidate: {'verdict': 'MATERIAL',
            'explanation': '同一条缺陷在主图用一个框，候选用两个相邻框，主图合并了两个实例。',
            'issues': [{'type': 'merge', 'main_annotation_ids': ['main_a0'],
                'candidate_annotation_ids': [candidate + '_a0', candidate + '_a1'],
                'description': '主图一个框对应候选两个框。', 'region_pair_ids': [], 'same_main_object_as': []}],
            'limitations': [], 'disputed_regions': [], 'disputed_windows': []}}}
        if invalid_first and len(requests) == 1:
            issue = answer['reviews'][candidate]['issues'][0]
            issue['type'] = 'split'
            issue['same_main_object_as'] = [{'candidate_id': candidate, 'annotation_ids': [candidate + '_a0']}]
        elif invalid_first:
            correction = messages[-1]['content']
            correction = correction if isinstance(correction, str) else correction[0]['text']
            assert 'schema_validation_errors' in correction and 'annotation_structure' in correction
        if protocol == 'openai-responses':
            return httpx.Response(200, json={'status': 'completed', 'output': [{'type': 'message', 'role': 'assistant',
                'content': [{'type': 'output_text', 'text': json.dumps(answer), 'annotations': []}]}]})
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)), profile=ModelProfile(
        endpoint='http://model.invalid/v1', api=protocol, model_id='vision',
        capacity_mode='provider_managed' if protocol == 'openai-responses' else 'vllm_tokenize', context_tokens=32768))
    try:
        workflow = ConsistencyWorkflow(runtime, client)
        assert workflow.audit(run_id, anchor)['ready']
        result = workflow.finish(run_id, anchor)
        assert result.result == 'discrepancy'
        assert [issue.type for issue in result.issues] == ['merge']
        assert checks.anchor(run_id, anchor).state == 'COMPLETED'
        assert len(requests) == (2 if invalid_first else 1)
    finally:
        client.close()
