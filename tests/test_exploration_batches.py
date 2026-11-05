import json
from uuid import uuid4

import httpx
import pytest

from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize('candidate_role',['normal','defect'])
def test_full_scope_exploration_keeps_available_sources_when_only_one_group_exists(knowledge_dataset,candidate_role):
    from pathlib import Path
    from iad_core.entry import dataset_scan
    db,config=knowledge_dataset
    if candidate_role=='defect':
        for path in Path(config.root).glob('*.png'):
            (Path(config.annotations.root)/(path.stem+'.json')).write_text(json.dumps(dict(imageWidth=320,imageHeight=240,
                shapes=[dict(label='candidate',shape_type='rectangle',points=[[10,10],[30,30]])])))
        dataset_scan({'dataset_id':config.dataset.id},db.db_path)
    calls=[]
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json=dict(count=1000,max_model_len=262144))
        prompt=json.loads(request.content)['messages'][0]['content'][0]['text']
        current=json.JSONDecoder().raw_decode(prompt.split('本次图组：')[1])[0];calls.append(current)
        direction=dict(title='可见轮廓',instruction='核对可见轮廓及成像变化',applies_to=candidate_role,
            rationale='本批有实际可见轮廓',evidence_ids=[current[0]['evidence_id']],limitations=['缺少另一类独立对照'])
        if '历史方向：' in prompt:
            prior=json.JSONDecoder().raw_decode(prompt.split('历史方向：')[1])[0]
            direction['previous_direction_id']=prior['directions'][0]['previous_direction_id']
        result=dict(summary='保留可见规律和缺证边界',directions=[direction],limitations=['当前范围只有一类候选来源'])
        return httpx.Response(200,json=dict(choices=[dict(finish_reason='stop',message=dict(content=json.dumps(result)))]))
    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job=runtime.models.analysis_workflows.start(dict(analysis_kind='exploration',dataset_ids=[config.dataset.id],initial_batch_size=3,batch_size=2))
        runtime.jobs.wait(job['run_id'],8)
        result=runtime.jobs.status(job['run_id']);assert result['status']=='COMPLETED',result['errors']
        assert result['completed']==6 and result['failed']==0
        assert [{item['candidate_role'] for item in call} for call in calls]==[{candidate_role}]*3
        assert [len({item['sample_id'] for item in call}) for call in calls]==[3,2,1]
        assert len({item['sample_id'] for call in calls for item in call})==6
    finally:runtime.close()


def test_scope_freeze_reuses_verified_pixels_but_detects_changed_source(dataset, monkeypatch):
    from PIL import Image
    import pytest
    from iad_core.duplicate.pixels import PixelContent
    from iad_core.exploration.models import ExplorationStart
    from iad_core.storage.repositories import SampleRepository

    db, _, config = dataset
    runtime = WorkbenchRuntime(db, VlmClient())
    try:
        request = ExplorationStart(dataset_id=config.dataset.id,
            normal_images=[config.dataset.id+':normal.png'], defect_images=[config.dataset.id+':dent.png'])
        def reject_decode(*args, **kwargs):
            raise AssertionError('Unchanged indexed sources must not be decoded again')
        with monkeypatch.context() as patch:
            patch.setattr(PixelContent, 'read', reject_decode)
            frozen = runtime.exploration.freeze(request)
        Image.new('RGB', (320, 240), 'red').save(SampleRepository(db).get(request.normal_images[0]).image_path)
        changed = runtime.exploration.freeze(request)
        assert changed['normal_sources'][0]['sha256'] != frozen['normal_sources'][0]['sha256']
        assert changed['normal_sources'][0]['pixel_sha256'] != frozen['normal_sources'][0]['pixel_sha256']
        with pytest.raises(ValueError, match='来源已变化'):
            runtime.exploration.validate(dict(frozen, exploration_request=request.model_dump()))
    finally:
        runtime.close()


def test_exploration_scope_uses_larger_first_batch_then_inherits_directions_and_resumes(dataset):
    db, _, config = dataset
    calls=[]

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        content=json.loads(request.content)['messages'][0]['content']
        prompt=content[0]['text']
        current=json.JSONDecoder().raw_decode(prompt.split('本次图组：')[1])[0]
        calls.append(current)
        if len(calls)==2:
            return httpx.Response(503,json={'error':{'message':'模型服务暂不可用'}})
        direction=dict(title='边缘连续性',instruction='比较边缘和光照变化',applies_to='both',rationale='当前图组有可见边缘',
                       evidence_ids=[current[0]['evidence_id']],limitations=[])
        if '历史方向：' in prompt:
            prior=json.JSONDecoder().raw_decode(prompt.split('历史方向：')[1])[0]
            direction['previous_direction_id']=prior['directions'][0]['previous_direction_id']
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(dict(summary='本批方向',directions=[direction],limitations=[]))}}]})

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        request=dict(submission_id=str(uuid4()),dataset_id=config.dataset.id,
            normal_images=[config.dataset.id+':normal.png',config.dataset.id+':normal2.png'],
            defect_images=[config.dataset.id+':dent.png',config.dataset.id+':scratch.png'],initial_batch_size=3,batch_size=2)
        job=runtime.models.exploration_batches.start(request)
        assert runtime.models.exploration_batches.start(request)['run_id']==job['run_id']
        runtime.jobs.wait(job['run_id'],5)
        failed=runtime.jobs.status(job['run_id'])
        assert failed['status']=='PARTIAL',failed['errors']
        assert failed['completed']==3 and failed['failed']==1
        assert [item['run_id'] for item in runtime.jobs.list(config.dataset.id, ('EXPLORATION_BATCH', 'DIRECTION_EXPLORATION'))] == [job['run_id']]
        assert all(runtime.jobs.status(run_id)['job_type'] == 'DIRECTION_EXPLORATION' for run_id in failed['batch_runs'])
        first=runtime.exploration.repository.get(failed['exploration_version_id'])
        assert len({item['sample_id'] for item in calls[0]})==3
        assert len({item['sample_id'] for item in calls[1]})==2
        resumed=runtime.models.exploration_batches.retry(job['run_id'])
        runtime.jobs.wait(resumed['run_id'],5)
        completed=runtime.jobs.status(resumed['run_id'])
        assert completed['status']=='COMPLETED',completed['errors']
        assert completed['completed']==1
        final=runtime.exploration.repository.get(completed['exploration_version_id'])
        assert final.request.parent_version_id==first.version_id
        assert final.directions[0].previous_direction_id==first.directions[0].direction_id
        assert runtime.exploration.repository.get(first.version_id)==first
        assert set(failed['completed_sample_ids']+completed['completed_sample_ids'])==set(request['normal_images']+request['defect_images'])
    finally:
        runtime.close()
