import json

import httpx
import pytest

from iad_core.exploration.models import ExplorationStart
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


def test_exploration_schema_exposes_existing_conclusion_and_evidence_roles(dataset):
    db,_,config=dataset
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json=dict(count=1000,max_model_len=262144))
        body=json.loads(request.content)
        fields=body['response_format']['json_schema']['schema']['properties']
        assert '图像编号' in fields['summary'].get('description','')
        assert '图像编号' in fields['limitations'].get('description','')
        assert 'rationale' in fields['limitations']['description']
        return httpx.Response(200,json=dict(choices=[dict(finish_reason='stop',message=dict(content=json.dumps(
            dict(summary='可见结构差异',directions=[],limitations=['部分来源存在重复，独立样本数量有限']))))]))
    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job=runtime.exploration.start(ExplorationStart(dataset_id=config.dataset.id,
            normal_images=[config.dataset.id+':normal.png'],defect_images=[config.dataset.id+':dent.png']))
        runtime.jobs.wait(job['run_id'],5)
        state=runtime.jobs.status(job['run_id'])
        assert state['status']=='COMPLETED',state['errors']
    finally:runtime.close()


@pytest.mark.parametrize('invalid', [None, 'foreign_evidence', 'copied_direction_id'])
def test_exploration_uses_bound_short_visual_references_and_noncopyable_history(dataset, invalid):
    db, _, config = dataset
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json=dict(count=1000, max_model_len=262144))
        body = json.loads(request.content)
        parts = body['messages'][0]['content']
        images = [json.loads(part['text'][5:]) for part in parts if part['type']=='text' and part['text'].startswith('视觉证据：')]
        assert all(item['evidence_id'] == f'@v{index}' for index, item in enumerate(images)), '模型只需返回本轮短引用'
        schema = body['response_format']['json_schema']['schema']
        evidence_schema = next(value['properties']['evidence_ids'] for value in schema['$defs'].values()
            if 'evidence_ids' in value.get('properties', {}))
        assert evidence_schema['items']['enum'] == [item['evidence_id'] for item in images]
        direction = dict(title='边缘完整性', instruction='比较边缘', applies_to='both',
            rationale='@v0 展示本轮边缘结构', evidence_ids=['@v0'], limitations=[])
        if calls:
            previous = json.JSONDecoder().raw_decode(parts[0]['text'].split('历史方向：')[1])[0]
            inherited = previous['directions'][0]
            assert 'direction_id' not in inherited
            assert 'evidence_ids' not in inherited
            assert set(inherited) == {'previous_direction_id','title','instruction','applies_to','limitations'}
            direction['previous_direction_id'] = inherited['previous_direction_id']
        if invalid == 'foreign_evidence':
            direction['evidence_ids'] = ['@v999']
        elif invalid == 'copied_direction_id':
            direction['direction_id'] = 'historical-copy'
        calls.append(images)
        return httpx.Response(200, json=dict(choices=[dict(finish_reason='stop', message=dict(content=json.dumps(
            dict(summary='本轮边缘方向', directions=[direction], limitations=[]))))]))

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        snapshots = []
        for normal, defect in [('normal','dent'),('normal2','scratch')]:
            job = runtime.exploration.start(ExplorationStart(dataset_id=config.dataset.id,
                normal_images=[config.dataset.id+f':{normal}.png'], defect_images=[config.dataset.id+f':{defect}.png'],
                parent_version_id=snapshots[-1].version_id if snapshots else None))
            runtime.jobs.wait(job['run_id'],5)
            state = runtime.jobs.status(job['run_id'])
            if invalid:
                assert state['status']=='FAILED'
                assert state['exploration_version_id'] is None
                return
            assert state['status']=='COMPLETED',state['errors']
            snapshot = runtime.exploration.repository.get(state['exploration_version_id'])
            snapshots.append(snapshot)
            original = {item.image.evidence_id:item for item in snapshot.evidence}
            assert snapshot.directions[0].evidence_ids == [snapshot.visual_references['@v0']]
            assert snapshot.directions[0].rationale == snapshot.visual_references['@v0']+' 展示本轮边缘结构'
            assert all(ref in original for ref in snapshot.visual_references.values())
            assert all(original[snapshot.visual_references[item['evidence_id']]].image.sha256 == item['sha256'] for item in calls[-1])
        assert snapshots[1].directions[0].previous_direction_id == snapshots[0].directions[0].direction_id
        assert snapshots[1].directions[0].evidence_ids != snapshots[0].directions[0].evidence_ids
    finally:
        runtime.close()


@pytest.mark.parametrize('corrected',[True,False])
def test_exploration_model_corrects_references_in_conclusion_limitations(dataset,corrected):
    db,_,config=dataset
    calls=[]
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json=dict(count=1000,max_model_len=262144))
        body=json.loads(request.content);calls.append(body)
        if len(calls)==2:
            assert 'evidence_in_conclusion' in body['messages'][0]['content'][0]['text']
        result=dict(summary='可见边缘结构',directions=[],
            limitations=['局部图像不足以确认结构'] if len(calls)>1 and corrected else ['仍需核对 @v0'])
        return httpx.Response(200,json=dict(choices=[dict(finish_reason='stop',message=dict(content=json.dumps(result)))]))
    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job=runtime.exploration.start(ExplorationStart(dataset_id=config.dataset.id,
            normal_images=[config.dataset.id+':normal.png'],defect_images=[config.dataset.id+':dent.png']))
        runtime.jobs.wait(job['run_id'],5)
        result=runtime.jobs.status(job['run_id'])
        assert len(calls)==2
        if corrected:
            assert result['status']=='COMPLETED',result['errors']
            snapshot=runtime.exploration.repository.get(result['exploration_version_id'])
            assert snapshot.limitations==['局部图像不足以确认结构']
        else:
            assert result['status']=='FAILED' and result['exploration_version_id'] is None
    finally:
        runtime.close()
