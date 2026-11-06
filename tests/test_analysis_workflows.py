import json
import shutil
import threading
from pathlib import Path
from uuid import uuid4

import httpx
import pytest

from iad_core.dataset.registry import DatasetImport
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient
from tests.knowledge_scenarios import frozen_observation_response


def test_consistency_workflow_finishes_without_model_calls_when_no_pair_reaches_threshold(dataset,tmp_path):
    import numpy as np
    from PIL import Image
    from iad_core.duplicate.index import PixelIndex
    from iad_core.storage.features import FeatureRepository
    from iad_core.storage.models import FeatureRecord
    from tests.feature_fixtures import configure_test_encoder

    db,registry,_=dataset
    root=tmp_path/'distinct-images';root.mkdir()
    for name,color in [('first','red'),('second','green')]:Image.new('RGB',(32,32),color).save(root/(name+'.png'))
    config=registry.import_labelme(DatasetImport(format='labelme',name='无合格候选',image_dir=str(root),annotation_dir=str(root)))
    encoder=configure_test_encoder(db,tmp_path)
    for index,name in enumerate(['first','second']):
        vector=np.zeros(encoder.profile.dim,dtype=encoder.profile.storage_dtype);vector[index]=1
        group=PixelIndex(db).get(config.dataset.id+':'+name+'.png').content_group_id
        FeatureRepository(db).upsert(FeatureRecord(content_group_id=group,profile_id=encoder.profile.profile_id,
            dim=encoder.profile.dim,dtype=encoder.profile.storage_dtype,embedding_blob=vector.tobytes()))
    calls=[]
    def unexpected_call(request):
        calls.append(str(request.url.path))
        return httpx.Response(500,json={'error':'不应调用模型'})
    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(unexpected_call))))
    try:
        frozen_prompt='核对创建时标注。\n保留原始换行。'
        started=runtime.models.analysis_workflows.start(dict(analysis_kind='consistency',dataset_ids=[config.dataset.id],instruction=frozen_prompt))
        runtime.jobs.wait(started['run_id'],10)
        final=runtime.models.analysis_workflows.status(started['run_id'])
        assert final['status']=='COMPLETED',final['errors']
        assert final['completed']==2 and final['total_gallery_groups']==0
        assert final['request']['submission']['min_similarity']==.95
        assert len(final['no_candidate_sample_ids'])==2 and not final['unit_runs']
        assert calls==[]
        for status in ('RUNNING','COMPLETED','FAILED'):
            with db.connection() as conn:
                conn.execute('UPDATE job_runs SET status=? WHERE job_id=?',(status,started['run_id']))
            assert runtime.models.analysis_workflows.status(started['run_id'])['consistency_prompt']==frozen_prompt
    finally:
        runtime.close()


@pytest.mark.parametrize('fail_second', [False, True])
def test_one_exploration_workflow_covers_multiple_subsets_and_keeps_iterating(dataset, tmp_path, fail_second):
    db, registry, first = dataset
    image_dir = Path(SampleRepository(db).get(first.dataset.id+':normal.png').image_path).parent
    shutil.copytree(image_dir, tmp_path/'second-images')
    shutil.copytree(tmp_path/'labels', tmp_path/'second-labels')
    second = registry.import_labelme(DatasetImport(format='labelme', name='第二子集',
        image_dir=str(tmp_path/'second-images'), annotation_dir=str(tmp_path/'second-labels')))
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count':1000,'max_model_len':262144})
        prompt = json.loads(request.content)['messages'][0]['content'][0]['text']
        current = json.JSONDecoder().raw_decode(prompt.split('本次图组：')[1])[0]
        previous = json.JSONDecoder().raw_decode(prompt.split('历史方向：')[1])[0] if '历史方向：' in prompt else None
        calls.append((current, previous))
        first_updates = [call for call in calls if call[0][0]['sample_id'].startswith(first.dataset.id+':') and call[1]]
        if fail_second and current[0]['sample_id'].startswith(first.dataset.id+':') and previous and len(first_updates)<=2:
            return httpx.Response(200,json={'choices':[{'message':{'content':'{}'}}]})
        direction = dict(title='本轮更新的边缘方向', instruction='继续比较边缘', applies_to='both',
            rationale='本轮图组证据', evidence_ids=[current[0]['evidence_id']], limitations=[])
        if previous:
            direction['previous_direction_id'] = previous['directions'][0]['previous_direction_id']
        return httpx.Response(200, json={'choices':[{'message':{'content':json.dumps(dict(
            summary='本轮方向', directions=[direction], limitations=[]))}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        request = dict(submission_id=str(uuid4()), analysis_kind='exploration',
            dataset_ids=[first.dataset.id, second.dataset.id], initial_batch_size=3, batch_size=2)
        job = runtime.models.analysis_workflows.start(request)
        assert runtime.models.analysis_workflows.start(request)['run_id'] == job['run_id']
        runtime.jobs.wait(job['run_id'], 10)
        state = runtime.jobs.status(job['run_id'])
        if fail_second:
            assert state['status']=='PARTIAL' and state['completed']==7 and state['failed']==1
            assert all(error['message'].count('MLLM DirectionDraft 输出格式错误') == 1 for error in state['errors'])
            retry=runtime.models.analysis_workflows.retry(job['run_id'])
            runtime.jobs.wait(retry['run_id'],10)
            state=runtime.models.analysis_workflows.status(job['run_id'])
        assert state['status'] == 'COMPLETED', state['errors']
        assert state['completed'] == state['total_samples'] == 8
        assert set(state['dataset_ids']) == {first.dataset.id, second.dataset.id}
        assert len(state['dataset_results']) == 2
        assert len(calls) == (6 if fail_second else 4)
        for dataset_id in request['dataset_ids']:
            subset_calls = [call for call in calls if call[0][0]['sample_id'].startswith(dataset_id+':')]
            retried = fail_second and dataset_id==first.dataset.id
            assert [len({item['sample_id'] for item in call[0]}) for call in subset_calls] == ([3,2,2,2] if retried else [3,2])
            assert [bool(call[1]) for call in subset_calls] == ([False,True,True,True] if retried else [False,True])
        for dataset_id in request['dataset_ids']:
            listed=runtime.models.analysis_workflows.list(dataset_id,'exploration')
            assert len(listed)==1 and listed[0]['root_run_id']==job['run_id']
            assert listed[0]['completed']==8
            assert not runtime.jobs.list(dataset_id, ('EXPLORATION_BATCH','DIRECTION_EXPLORATION'))
    finally:
        runtime.close()


def test_one_knowledge_workflow_mines_every_qualified_source_of_selected_subsets(knowledge_dataset, tmp_path):
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.knowledge.repository import KnowledgeRepository
    from iad_core.knowledge.instructions import MiningPromptConfiguration, MiningDirection
    from iad_core.knowledge.prompts import KnowledgePrompts, MiningPromptQuery, MiningPromptEdit
    db, first = knowledge_dataset
    shutil.copytree(tmp_path/'images', tmp_path/'second-images')
    shutil.copytree(tmp_path/'labels', tmp_path/'second-labels')
    second = DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='第二子集',
        image_dir=str(tmp_path/'second-images'),annotation_dir=str(tmp_path/'second-labels')))
    private = MiningPromptConfiguration(objective='本作业只检查轮廓关系',
        instruction='用户完整提示词：联合检查本次选中的轮廓关系，保留正反证据和待确认项。',
        directions=[MiningDirection(direction_id='outline', title='轮廓关系', instruction='观察轮廓连续性')])
    prompts = KnowledgePrompts(db)
    shared_before = {dataset_id: prompts.read(MiningPromptQuery(dataset_id=dataset_id, kind='normal'))
                     for dataset_id in [first.dataset.id, second.dataset.id]}
    entered, release = threading.Event(), threading.Event()
    generated = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        text = json.loads(request.content)['messages'][0]['content'][0]['text']
        generated.append(text)
        assert text.startswith(private.instruction)
        if len(generated) == 2:
            entered.set()
        assert release.wait(5)
        observation = frozen_observation_response(request)
        if observation is not None:
            return observation
        content = json.loads(request.content)['messages'][0]['content']
        refs = [json.loads(part['text'][5:])['evidence_id'] for part in content
            if part['type']=='text' and part['text'].startswith('视觉证据：')]
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(dict(summary='完整图组知识',
            checks=[dict(title='主体轮廓',subject='主体',location='全图',criterion='连续轮廓',allowed_variations=[],
                support_evidence_ids=refs,counter_evidence_ids=[],limitations=[],status='supported')],suspects=[],limitations=[]))}}]})

    runtime = WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.models.analysis_workflows.start(dict(analysis_kind='knowledge',
            dataset_ids=[first.dataset.id,second.dataset.id],batch_size=3,mining_prompt=private.model_dump()))
        assert entered.wait(5)
        for dataset_id, before in shared_before.items():
            assert prompts.read(MiningPromptQuery(dataset_id=dataset_id, kind='normal')) == before
            prompts.save(MiningPromptEdit(dataset_id=dataset_id, kind='normal', expected_revision=before.revision,
                configuration=MiningPromptConfiguration(objective='另一次共享配置修改', directions=[], instruction='后续作业的新提示词')))
        release.set()
        runtime.jobs.wait(job['run_id'],15)
        state = runtime.jobs.status(job['run_id'])
        assert state['status']=='COMPLETED',state['errors']
        assert state['completed']==state['total_samples']==12
        assert len(state['dataset_results'])==2
        for item in state['dataset_results']:
            version=KnowledgeRepository(db).get(item['knowledge_version_id'])
            assert version.dataset_id==item['dataset_id'] and len(version.sources)==6
            assert version.mining_prompt.configuration == private
            assert version.mining_prompt.instruction == private.instruction
            assert prompts.read(MiningPromptQuery(dataset_id=item['dataset_id'],kind='normal')).instruction == '后续作业的新提示词'
            assert not runtime.knowledge.list(item['dataset_id'])
    finally:
        release.set()
        runtime.close()


@pytest.mark.parametrize('submitted', [None, {'objective': '只提供目标', 'directions': []}])
def test_knowledge_workflow_requires_the_complete_submitted_prompt_before_allocating_a_scope(dataset, submitted):
    db, _, config = dataset
    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(
        lambda request: pytest.fail('缺少完整提示词时不能发送模型请求')))))
    try:
        request = dict(analysis_kind='knowledge', dataset_ids=[config.dataset.id])
        if submitted is not None:
            request['mining_prompt'] = submitted
        with pytest.raises(ValueError, match='mining_prompt|完整'):
            runtime.models.analysis_workflows.start(request)
        assert runtime.models.analysis_workflows.list(config.dataset.id, 'knowledge') == []
    finally:
        runtime.close()


@pytest.mark.parametrize('invalid_annotation',[False,True])
@pytest.mark.parametrize('mode',['combined','exact'])
def test_consistency_workflow_contains_program_comparison_and_eligible_visual_analysis(dataset,tmp_path,monkeypatch,invalid_annotation,mode):
    db, _, config = dataset
    if invalid_annotation:
        label=tmp_path/'labels/dent.json'
        value=json.loads(label.read_text());value['shapes'][0]['points'][0][0]=-1
        label.write_text(json.dumps(value));dataset[1].rescan(config.dataset.id)
    from tests.feature_fixtures import configure_test_encoder,MockFeatureExtractor
    configure_test_encoder(db,tmp_path)
    observed_groups=[]

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        body=json.loads(request.content)
        prompt=body['messages'][0]['content'][0]['text']
        group=json.JSONDecoder().raw_decode(prompt.split('冻结图组：')[1])[0]
        names={source['sample_id']:config.dataset.id+':'+source['name'] for source in group['sources'].values()}
        observed_groups.append((names[group['anchor']['sample_id']],frozenset(names[sid] for sid in group['candidates'])))
        refs=[dict(candidate_id=sid,comparison=dict(result_id=member['comparison']['result_id'],
            evidence_id=member['comparison']['evidence_id'])) for sid,member in group['candidates'].items()]
        result=dict(overall=dict(verdict='UNCERTAIN',text='需核查标注策略',references=refs),
            assessments=[dict(candidate_id=ref['candidate_id'],verdict='UNCERTAIN',conclusion='缺少标注对象对应依据',explanation='现有标注策略未确认',findings=[]) for ref in refs],
            conclusions=[dict(text='需人工核查策略',references=refs)],limitations=['标签非人工真值'])
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(result)}}]})

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    monkeypatch.setattr(runtime.images,'encode',lambda selection,images:MockFeatureExtractor(profile=selection.profile).encode_batch(images))
    from contextlib import contextmanager
    queries=[]
    connect=db.connection
    @contextmanager
    def traced_connection():
        with connect() as connection:
            connection.set_trace_callback(queries.append)
            yield connection
    monkeypatch.setattr(db,'connection',traced_connection)
    try:
        job=runtime.models.analysis_workflows.start(dict(analysis_kind='consistency',mode=mode,dataset_ids=[config.dataset.id],batch_size=4))
        runtime.jobs.wait(job['run_id'],10)
        state=runtime.jobs.status(job['run_id'])
        assert state['status']=='COMPLETED',state['errors']
        assert state['completed']==state['total_samples']==4
        assert sum(query.lstrip().startswith('WITH pairs AS MATERIALIZED') for query in queries)<=1, '完整范围冻结不能逐图组重扫同一份比较快照'
        planned_groups=[(unit['group']['anchor']['sample']['sample_id'],frozenset(member['image']['sample']['sample_id']
            for member in unit['group']['members'])) for unit in state['gallery_plan']]
        summary=runtime.models.analysis_workflows.list(config.dataset.id,'consistency')[0]
        assert summary['completed_gallery_groups']==summary['total_gallery_groups']==len(planned_groups), '公开状态须保留实际图组进度，不能只显示最终样本完成数'
        assert sorted(observed_groups)==sorted(planned_groups), '只分析通过检索条件的候选，不随机补组'
        assert not state['unit_runs']
        assert state['program_batch_id']
        program=runtime.consistency.status(state['program_batch_id'])
        assert program.status==('PARTIAL' if invalid_annotation else 'COMPLETED')
        from iad_core.consistency.reports import ConsistencyReports
        from iad_core.consistency.result_models import ConsistencyQuery
        full=ConsistencyReports(db).report(ConsistencyQuery(selection=dict(kind='batch',batch_id=state['program_batch_id'])))
        assert full.page.mode==mode
        pairs=runtime.consistency.results(state['program_batch_id'])
        if mode=='combined':
            assert any(runtime.consistency_service.evidence(item.evidence_id).result.verification.relation!='EXACT' for item in pairs)
        from iad_core.consistency.reports import ConsistencyReports
        from iad_core.consistency.result_models import ConsistencyQuery
        from iad_core.consistency.gallery import GalleryQueries, GalleryQuery
        from iad_core.consistency.group_analysis_models import GroupAnalysisStart
        report=full
        groups=GalleryQueries(db).query(GalleryQuery(query_id=report.page.query_id,kind='conflicts'))
        assert groups.total>0
        assert program.conflict_count==groups.total, '作业计数和当前候选卡片共用筛选口径'
        if mode=='combined':
            assert any(not group.difference_types for group in groups.items), '相似图未确认标注差异时也须进入模型核对'
        for group in groups.items:
            view=runtime.models.consistency_model_batches.analyses.read(GroupAnalysisStart(query_id=report.page.query_id,
                kind='conflicts',group_id=group.group_id,facts_state=group.facts_state,request_id='read-only'))
            assert view.status=='COMPLETED'
        assert len(runtime.models.analysis_workflows.list(config.dataset.id,'consistency'))==1
    finally:
        runtime.close()


@pytest.mark.parametrize('invalid_annotation',[False,True])
def test_consistency_retry_keeps_samples_without_candidates_and_rechecks_only_the_failed_group(dataset,tmp_path,invalid_annotation):
    db,registry,config=dataset
    if invalid_annotation:
        label=tmp_path/'labels/dent.json'
        value=json.loads(label.read_text());value['shapes'][0]['points'][0][0]=-1
        label.write_text(json.dumps(value));registry.rescan(config.dataset.id)
    calls=[]
    repaired=False
    first_group=None

    def respond(request):
        nonlocal first_group
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        body=json.loads(request.content)
        group=json.JSONDecoder().raw_decode(body['messages'][0]['content'][0]['text'].split('冻结图组：')[1])[0]
        key=(group['anchor']['sample_id'],frozenset(group['candidates']))
        first_group=first_group or key
        calls.append(key)
        if key==first_group and not repaired:
            return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':'{}'}}]})
        refs=[dict(candidate_id=sid,comparison=dict(result_id=member['comparison']['result_id'],evidence_id=member['comparison']['evidence_id']))
            for sid,member in group['candidates'].items()]
        result=dict(overall=dict(verdict='UNCERTAIN',text='缺少标注对象对应依据',references=refs),
            assessments=[dict(candidate_id=ref['candidate_id'],verdict='UNCERTAIN',conclusion='缺少标注对象对应依据',explanation='保留实际标注依据与未知项',findings=[]) for ref in refs],
            conclusions=[dict(text='保留该图组的真实比较依据',references=refs)],limitations=[])
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        started=runtime.models.analysis_workflows.start(dict(analysis_kind='consistency',mode='exact',dataset_ids=[config.dataset.id]))
        runtime.jobs.wait(started['run_id'],10)
        first=runtime.models.analysis_workflows.status(started['run_id'])
        assert first['status']=='PARTIAL',first['errors']
        assert first['completed']==first['failed']==2
        for failure in first['errors']:
            source=runtime.jobs.status(failure['source_run_id'])
            assert source['job_type']=='CONSISTENCY_ANALYSIS'
            assert failure['source_phase']==source['phase']=='ANALYZING_GROUP_BATCHES'
            assert failure['source_phase']!=first['phase'],'子作业失败不能归因于父作业后续阶段'
        succeeded=set(first['completed_sample_ids'])
        assert len(calls)==2
        assert succeeded==set(first['no_candidate_sample_ids'])
        assert not first['unit_runs']
        repaired=True
        retried=runtime.models.analysis_workflows.retry(started['run_id'])
        runtime.jobs.wait(retried['run_id'],10)
        final=runtime.models.analysis_workflows.status(started['run_id'])
        assert final['status']=='COMPLETED',final['errors']
        assert final['completed']==final['total_samples']==4 and final['failed']==0
        assert len(calls)==3 and calls[-1]==first_group
        assert set(runtime.jobs.status(retried['run_id'])['sample_ids']).isdisjoint(succeeded)
        assert runtime.jobs.status(started['run_id'])['completed_sample_ids']==first['completed_sample_ids']
        assert final['dataset_results'][0]['status']=='COMPLETED'
        from iad_core.consistency.gallery import GalleryQueries,GalleryQuery
        from iad_core.consistency.reports import ConsistencyReports
        from iad_core.consistency.result_models import ConsistencyQuery
        report=ConsistencyReports(db).report(ConsistencyQuery(selection=dict(kind='batch',batch_id=final['program_batch_id'])))
        assert GalleryQueries(db).query(GalleryQuery(query_id=report.page.query_id,kind='conflicts')).total==len(first['gallery_plan'])
    finally:
        runtime.close()


def test_selected_scope_cancellation_protects_every_subset_and_stops_internal_batches(dataset,tmp_path):
    db,registry,first=dataset
    shutil.copytree(tmp_path/'images',tmp_path/'second-images')
    shutil.copytree(tmp_path/'labels',tmp_path/'second-labels')
    second=registry.import_labelme(DatasetImport(format='labelme',name='第二子集',image_dir=str(tmp_path/'second-images'),annotation_dir=str(tmp_path/'second-labels')))
    entered,release=threading.Event(),threading.Event()
    calls=[]

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        calls.append(request)
        if len(calls)==2:
            entered.set()
        assert release.wait(5)
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(dict(summary='候选观察',checks=[],suspects=[],limitations=[]))}}]})

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job=runtime.models.analysis_workflows.start(dict(analysis_kind='knowledge',
            dataset_ids=[first.dataset.id,second.dataset.id],batch_size=2,
            mining_prompt=dict(objective='验证范围取消',directions=[],instruction='联合观察本次图组并保留实际证据。')))
        assert entered.wait(5)
        with pytest.raises(ValueError,match='作业'):
            registry.delete(second.dataset.id)
        runtime.jobs.cancel(job['run_id'],('ANALYSIS_WORKFLOW',))
        release.set()
        runtime.jobs.wait(job['run_id'],5)
        state=runtime.models.analysis_workflows.status(job['run_id'])
        assert state['status']=='CANCELLED'
        assert state['completed']==0 and state['unprocessed']==8
        assert len(calls)==2
        registry.delete(second.dataset.id)
        assert registry.get(first.dataset.id).dataset.id==first.dataset.id
        with pytest.raises(LookupError):
            runtime.jobs.status(job['run_id'])
    finally:
        release.set()
        runtime.close()


def test_retry_counts_pending_sources_instead_of_previous_attempt_failures(dataset):
    db, _, config = dataset
    entered, release = threading.Event(), threading.Event()
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json=dict(count=1000,max_model_len=262144))
        body=json.loads(request.content)
        prompt=body['messages'][0]['content'][0]['text']
        current=json.JSONDecoder().raw_decode(prompt.split('本次图组：')[1])[0]
        calls.append(current)
        if len(calls) in (2,3):
            return httpx.Response(200,json=dict(choices=[dict(message=dict(content='{}'))]))
        if len(calls)==4:
            entered.set()
            assert release.wait(5)
        direction=dict(title='边缘方向',instruction='比较边缘',applies_to='both',rationale='实际本轮证据',
            evidence_ids=[current[0]['evidence_id']],limitations=[])
        if '历史方向：' in prompt:
            previous=json.JSONDecoder().raw_decode(prompt.split('历史方向：')[1])[0]
            direction['previous_direction_id']=previous['directions'][0]['previous_direction_id']
        return httpx.Response(200,json=dict(choices=[dict(message=dict(content=json.dumps(dict(summary='本轮方向',directions=[direction],limitations=[]))))]))

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job=runtime.models.analysis_workflows.start(dict(analysis_kind='exploration',dataset_ids=[config.dataset.id],initial_batch_size=3,batch_size=2))
        runtime.jobs.wait(job['run_id'],5)
        assert runtime.models.analysis_workflows.status(job['run_id'])['failed']==1
        retry=runtime.models.analysis_workflows.retry(job['run_id'])
        assert entered.wait(5)
        state=runtime.models.analysis_workflows.status(job['run_id'])
        assert state['status']=='RUNNING'
        assert (state['completed'],state['failed'],state['unprocessed'])==(3,0,1)
        assert state['errors']==[]
        release.set()
        runtime.jobs.wait(retry['run_id'],5)
        assert runtime.models.analysis_workflows.status(job['run_id'])['completed']==4
    finally:
        release.set()
        runtime.close()


@pytest.mark.parametrize('overlapping_phase',[True,False])
def test_active_selected_scope_excludes_overlapping_workflows_of_the_same_phase(dataset,tmp_path,overlapping_phase):
    db,registry,first=dataset
    shutil.copytree(tmp_path/'images',tmp_path/'other-images')
    shutil.copytree(tmp_path/'labels',tmp_path/'other-labels')
    second=registry.import_labelme(DatasetImport(format='labelme',name='另一子集',
        image_dir=str(tmp_path/'other-images'),annotation_dir=str(tmp_path/'other-labels')))
    entered,release=threading.Event(),threading.Event()

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json=dict(count=1000,max_model_len=262144))
        entered.set()
        assert release.wait(5)
        body=json.loads(request.content)
        value=dict(summary='当前未归纳判据',limitations=[])
        if body['response_format']['json_schema']['name']=='DirectionDraft':
            value['directions']=[]
        else:
            value.update(checks=[],suspects=[])
        return httpx.Response(200,json=dict(choices=[dict(message=dict(content=json.dumps(value)))]))

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        original=runtime.models.analysis_workflows.start(dict(analysis_kind='exploration',dataset_ids=[first.dataset.id,second.dataset.id]))
        assert entered.wait(5)
        if overlapping_phase:
            with pytest.raises(ValueError,match='active job|活动作业'):
                runtime.models.analysis_workflows.start(dict(analysis_kind='exploration',dataset_ids=[second.dataset.id]))
        else:
            independent=runtime.models.analysis_workflows.start(dict(analysis_kind='knowledge',dataset_ids=[first.dataset.id],
                mining_prompt=dict(objective='验证独立范围',directions=[],instruction='联合观察当前范围。')))
            assert independent['run_id']!=original['run_id']
    finally:
        release.set()
        runtime.close()


def test_independent_subsets_run_together_within_one_workflow(dataset,tmp_path):
    db,registry,first=dataset
    shutil.copytree(tmp_path/'images',tmp_path/'parallel-images')
    shutil.copytree(tmp_path/'labels',tmp_path/'parallel-labels')
    second=registry.import_labelme(DatasetImport(format='labelme',name='并行子集',
        image_dir=str(tmp_path/'parallel-images'),annotation_dir=str(tmp_path/'parallel-labels')))
    together=threading.Barrier(2)

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json=dict(count=1000,max_model_len=262144))
        together.wait(3)
        return httpx.Response(200,json=dict(choices=[dict(message=dict(content=json.dumps(
            dict(summary='当前证据不足以归纳方向',directions=[],limitations=['保留范围限制']))))]))

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job=runtime.models.analysis_workflows.start(dict(analysis_kind='exploration',dataset_ids=[first.dataset.id,second.dataset.id]))
        runtime.jobs.wait(job['run_id'],8)
        state=runtime.models.analysis_workflows.status(job['run_id'])
        assert state['status']=='COMPLETED',state['errors']
        assert state['completed']==state['total_samples']==8
        assert len(state['dataset_results'])==2
        assert len(runtime.models.analysis_workflows.list(first.dataset.id,'exploration'))==1
        assert not runtime.jobs.list(second.dataset.id,('EXPLORATION_BATCH','DIRECTION_EXPLORATION'))
    finally:
        runtime.close()


def test_full_exploration_keeps_images_with_invalid_original_annotation_geometry(tmp_path):
    from PIL import Image
    from iad_core.dataset.registry import DatasetRegistry
    images, labels = tmp_path/'images', tmp_path/'labels'
    images.mkdir(); labels.mkdir()
    for name in ['plain', 'valid', 'out-of-bounds']:
        Image.new('RGB', (64, 48), 'gray').save(images/f'{name}.png')
    original = {'imageWidth':64, 'imageHeight':48, 'shapes':[
        {'label':'scratch', 'shape_type':'rectangle', 'points':[[20,10],[67,20]]}]}
    (labels/'out-of-bounds.json').write_text(json.dumps(original))
    (labels/'valid.json').write_text(json.dumps({**original, 'shapes':[
        {'label':'scratch', 'shape_type':'rectangle', 'points':[[20,10],[60,20]]}]}))
    from iad_core.storage.database import Database
    from iad_core.storage.repositories import AnnotationRepository
    db = Database(str(tmp_path/'scope.db'))
    config = DatasetRegistry(db).import_labelme(DatasetImport(format='labelme', name='含原标越界的完整范围',
        image_dir=str(images), annotation_dir=str(labels)))
    source_id = config.dataset.id+':out-of-bounds.png'
    before = AnnotationRepository(db).list_by_sample(source_id)
    assert before[0].geometry_status == 'INVALID'
    sent = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        sent.append(json.loads(request.content))
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(
            {'summary':'图组可见的表面与边缘规律', 'directions':[], 'limitations':[]})}}]})

    runtime = WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.models.analysis_workflows.start(dict(analysis_kind='exploration', dataset_ids=[config.dataset.id],
            initial_batch_size=3, batch_size=2))
        assert job['total_samples'] == 3
        runtime.jobs.wait(job['run_id'],10)
        state = runtime.models.analysis_workflows.status(job['run_id'])
        assert state['status'] == 'COMPLETED', state['errors']
        assert state['completed'] == 3
        visuals = [json.loads(part['text'][5:]) for body in sent for part in body['messages'][0]['content']
                   if part['type']=='text' and part['text'].startswith('视觉证据：')]
        assert any(annotation['bbox'] == [20,10,67,20] for visual in visuals for annotation in visual.get('annotations',[]))
        assert AnnotationRepository(db).list_by_sample(source_id) == before
        assert json.loads((labels/'out-of-bounds.json').read_text()) == original
    finally:
        runtime.close()
