import json
import threading
from uuid import uuid4
import pytest

import httpx

from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.knowledge.prompts import KnowledgePrompts, MiningPromptEdit, MiningPromptQuery
from iad_core.knowledge.instructions import MiningPromptConfiguration
from tests.knowledge_scenarios import frozen_observation_response


def test_full_scope_mining_batches_resume_from_frozen_remaining_sources(knowledge_dataset,self_discovery_prompt):
    db, config = knowledge_dataset
    calls = []
    fail = True

    def respond(request):
        nonlocal fail
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        observed = frozen_observation_response(request)
        if observed:
            return observed
        content = json.loads(request.content)['messages'][0]['content']
        evidence = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                    if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        calls.append(evidence)
        if fail and len(calls) == 2:
            return httpx.Response(503,json={'error':{'message':'模型服务暂不可用'}})
        result = dict(summary='双孔外观', checks=[dict(title='孔位关系', subject='孔', location='主体',
            criterion='左右可见孔位', allowed_variations=[], support_evidence_ids=[e['evidence_id'] for e in evidence],
            counter_evidence_ids=[], limitations=['当前视角'], status='supported')], suspects=[], limitations=[])
        return httpx.Response(200, json={'choices': [{'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        request = dict(dataset_id=config.dataset.id, mining_prompt=dict(self_discovery_prompt.configuration.model_dump(),instruction=self_discovery_prompt.instruction), batch_size=2, submission_id=str(uuid4()))
        job = runtime.models.knowledge_batches.start(request)
        assert runtime.models.knowledge_batches.start(request)['run_id'] == job['run_id']
        with pytest.raises(ValueError, match='提交ID'):
            runtime.models.knowledge_batches.start(dict(request, batch_size=3))
        runtime.jobs.wait(job['run_id'], 10)
        failed = runtime.jobs.status(job['run_id'])
        assert failed['status'] == 'PARTIAL', failed['errors']
        assert failed['completed'] == 2 and failed['failed'] == 4
        assert len(failed['batch_runs']) == 2
        assert all(len(call) == 2 for call in calls)
        first_version = failed['knowledge_version_id']
        first = KnowledgeRepository(db).get(first_version)
        prompts = KnowledgePrompts(db)
        current = prompts.read(MiningPromptQuery(dataset_id=config.dataset.id, kind='normal'))
        prompts.save(MiningPromptEdit(dataset_id=config.dataset.id, kind='normal', expected_revision=current.revision,
            configuration=MiningPromptConfiguration(objective='以后另用的新目标', directions=[], instruction='以后作业的新提示词')))
        fail = False
        resumed = runtime.models.knowledge_batches.retry(job['run_id'])
        runtime.jobs.wait(resumed['run_id'], 10)
        completed = runtime.jobs.status(resumed['run_id'])
        assert completed['status'] == 'COMPLETED', completed['errors']
        assert set(completed['sample_ids']).isdisjoint(failed['completed_sample_ids'])
        assert completed['completed'] == 4
        scope = runtime.knowledge.scopes.read(completed['request']['scope_run_id'])
        assert scope.total == scope.observed == scope.valid_observed == 6
        assert scope.remaining == 0 and scope.stale == 0
        assert KnowledgeRepository(db).get(first_version) == first
        assert len(scope.version_ids) == 3
        assert KnowledgeRepository(db).get(completed['knowledge_version_id']).mining_prompt == first.mining_prompt
    finally:
        runtime.close()


def test_cancelling_batch_scope_cancels_its_active_child_without_publishing(knowledge_dataset,self_discovery_prompt):
    db, config = knowledge_dataset
    entered, release = threading.Event(), threading.Event()

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        entered.set()
        assert release.wait(5)
        return httpx.Response(200, json={'choices': [{'message': {'content': json.dumps(dict(
            summary='已取消的观察', checks=[], suspects=[], limitations=[]))}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.models.knowledge_batches.start(dict(dataset_id=config.dataset.id, mining_prompt=dict(self_discovery_prompt.configuration.model_dump(),instruction=self_discovery_prompt.instruction), batch_size=2))
        assert entered.wait(5)
        runtime.knowledge.cancel(job['run_id'])
        release.set()
        runtime.jobs.wait(job['run_id'], 5)
        cancelled = runtime.knowledge.status(job['run_id'])
        assert cancelled['status'] == 'CANCELLED', cancelled['errors']
        assert cancelled['completed'] == cancelled['failed'] == 0
        assert cancelled['unprocessed'] == 6
        assert all(runtime.knowledge.status(run_id)['status'] == 'CANCELLED' for run_id in cancelled['batch_runs'])
        assert KnowledgeRepository(db).current(config.dataset.id) is None
    finally:
        release.set()
        runtime.close()


@pytest.mark.parametrize('batch_size',[2,4])
def test_mining_scope_uses_actual_evidence_without_label_based_support_gates(defect_dataset,batch_size,self_discovery_prompt):
    from iad_core.knowledge.sources import KnowledgeSources
    db, dataset, _, _ = defect_dataset
    sources = KnowledgeSources(db)
    normal_ids = set(sources.eligible(dataset['dataset_id'], 'normal').qualifications)
    candidate_ids = set(sources.eligible(dataset['dataset_id'], 'defect').qualifications)
    assert candidate_ids - normal_ids
    seen = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        observed = frozen_observation_response(request)
        if observed:
            return observed
        content = json.loads(request.content)['messages'][0]['content']
        evidence = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                    if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        seen.append(evidence)
        support = [e['evidence_id'] for e in evidence if e['representation'] == 'raw']
        counters = []
        result = dict(summary='对照后形成可见孔位规律', checks=[dict(title='孔位关系', subject='孔', location='主体',
            criterion='左右可见孔位', allowed_variations=[], support_evidence_ids=support,
            counter_evidence_ids=counters, limitations=['候选标注只提供定位线索'], status='supported' if support else 'provisional')],
            suspects=[], limitations=[])
        return httpx.Response(200, json={'choices': [{'finish_reason':'stop','message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.models.knowledge_batches.start(dict(dataset_id=dataset['dataset_id'], mining_prompt=dict(self_discovery_prompt.configuration.model_dump(),instruction=self_discovery_prompt.instruction), batch_size=batch_size))
        assert set(job['request']['sample_ids']) == normal_ids | candidate_ids, '挖掘范围应覆盖全部正常及异常候选'
        runtime.jobs.wait(job['run_id'],10)
        state = runtime.jobs.status(job['run_id'])
        assert state['status']=='COMPLETED', state['errors']
        assert state['completed']==4
        snapshot = KnowledgeRepository(db).get(state['knowledge_version_id'])
        assert set(snapshot.observed_source_ids)<=(normal_ids|candidate_ids)
        assert {source.sample_id for source in snapshot.sources}==normal_ids|candidate_ids
        assert snapshot.comparison_sources==[]
        assert any(item.sample_id in candidate_ids and item.image.evidence_id in snapshot.checks[0].support_evidence_ids for item in snapshot.evidence), '有标注图像可以按实际所见支持判据'
        assert seen and all(any(e['role']=='overview' for e in batch) for batch in seen)
        scope=runtime.knowledge.scopes.read(state['request']['scope_run_id'])
        assert scope.observed==scope.total==4 and scope.stale==scope.remaining==0
        captured=runtime.knowledge.frozen.presets([snapshot.version_id],dataset['dataset_id'])[0]
        assert captured.sources==snapshot.sources
    finally:
        runtime.close()


def test_joint_mining_uses_compact_refs_and_restores_persisted_evidence(knowledge_dataset,self_discovery_prompt):
    db, config=knowledge_dataset
    requests=[]
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        body=json.loads(request.content)
        evidence=[json.loads(part['text'].removeprefix('视觉证据：')) for part in body['messages'][0]['content']
                  if part['type']=='text' and part['text'].startswith('视觉证据：')]
        requests.append(evidence)
        ids=[part['evidence_id'] for part in evidence]
        assert ids and all(ref.startswith('@v') and len(ref)<8 for ref in ids)
        assert '"phase": "learning"' in body['messages'][0]['content'][0]['text']
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(dict(
            summary='孔位关系可观察',checks=[dict(title='孔位',subject='孔',location='主体',criterion='左右对应',
                allowed_variations=[],limitations=[],status='supported',support_evidence_ids=ids,counter_evidence_ids=[])],
            suspects=[],limitations=[]))}}]})
    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        ids=list(runtime.knowledge.sources.eligible(config.dataset.id,'normal').qualifications)[:2]
        job=runtime.knowledge.start(mining_prompt=self_discovery_prompt,request=dict(images=ids,image_count=2))
        runtime.jobs.wait(job['run_id'],5)
        state=runtime.jobs.status(job['run_id'])
        assert state['status']=='COMPLETED',state['errors']
        snapshot=KnowledgeRepository(db).get(state['knowledge_version_id'])
        refs=snapshot.checks[0].support_evidence_ids
        assert refs and all(ref.startswith('img_') for ref in refs)
        assert set(refs)<={item.image.evidence_id for item in snapshot.evidence}
        assert snapshot.mining_steps[0].image_evidence_ids==refs
    finally:
        runtime.close()


@pytest.mark.parametrize('normal_contradicts',[False,True])
def test_comparison_candidates_keep_counter_evidence_without_redundant_conflict_recheck(defect_dataset,normal_contradicts,self_discovery_prompt):
    from iad_core.knowledge.sources import KnowledgeSources
    db,dataset,_,_=defect_dataset
    normal_ids=sorted(KnowledgeSources(db).eligible(dataset['dataset_id'],'normal').qualifications)
    candidate_ids=set(KnowledgeSources(db).eligible(dataset['dataset_id'],'defect').qualifications)-set(normal_ids)
    observed=[];learned=[]
    def respond(request):
        body=json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        text=body['messages'][0]['content'][0]['text']
        if body['response_format']['json_schema']['name']=='KnowledgeObservations':
            context=json.JSONDecoder().raw_decode(text.split('冻结观察请求：',1)[1])[0]
            observed.append(context['purpose'])
            matrix={source['source_key']:{check['check_key']:dict(status='contradicts' if
                source['sample_id'] in candidate_ids or normal_contradicts and source['sample_id']==normal_ids[-1] else 'supports',
                description='保留所见孔位差异',position_analysis='主体区域',illumination_analysis='均匀照明',
                normal_explanation='对照差异不直接裁决真值',evidence_ids=source['raw_evidence_keys'],suspects=[])
                for check in context['checks']} for source in context['sources']}
            result=matrix
        else:
            images=[json.loads(part['text'][5:]) for part in body['messages'][0]['content']
                if part['type']=='text' and part['text'].startswith('视觉证据：')]
            learned.append(images)
            parent=json.JSONDecoder().raw_decode(text.split('冻结父版本候选：',1)[1])[0]
            result=dict(summary='保留正常孔位及比较差异',checks=[dict(title='可见孔位',subject='孔',location='主体',
                criterion='左右可见孔位',allowed_variations=[],limitations=[],status='supported',
                support_evidence_ids=[image['evidence_id'] for image in images if image['representation']=='raw'],
                counter_evidence_ids=[image['evidence_id'] for image in images if image['role']=='overview' and image['representation']=='raw'])],
                suspects=[],limitations=[],revisions=[dict(previous_check_id=check['check_id'],current_check_titles=['可见孔位'],
                    reason='沿用同一正常判据并保留新图差异') for check in parent['checks']])
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})
    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first=runtime.knowledge.start(mining_prompt=self_discovery_prompt,request=dict(images=normal_ids[:2],image_count=2))
        runtime.jobs.wait(first['run_id'],5)
        status=runtime.jobs.status(first['run_id']);assert status['status']=='COMPLETED',status['errors']
        first_version=status['knowledge_version_id']
        images=[normal_ids[-1],*sorted(candidate_ids)]
        second=runtime.knowledge.start(mining_prompt=self_discovery_prompt,request=dict(images=images,image_count=len(images),knowledge_preset=[first_version]))
        runtime.jobs.wait(second['run_id'],8)
        status=runtime.jobs.status(second['run_id']);assert status['status']=='COMPLETED',status['errors']
        snapshot=KnowledgeRepository(db).get(status['knowledge_version_id'])
        assert observed.count('current')==1
        assert observed.count('comparison')==1,'适用判据的反例均须核验，不按来源标签绕过'
        assert snapshot.checks[0].counter_evidence_ids
        assert any(item.status=='contradicts' and item.sample_id in candidate_ids
            for step in snapshot.observation_steps for item in step.result.observations)
        assert snapshot.comparison_sources==[]
        assert any(image['role']=='overview' for image in learned[-1])
    finally:runtime.close()


@pytest.mark.parametrize('corrected',[True,False])
@pytest.mark.parametrize('field',['summary','limitations'])
def test_model_revises_its_own_conclusion_references_before_publication(knowledge_dataset,corrected,field,self_discovery_prompt):
    db,config=knowledge_dataset
    calls=[]
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        body=json.loads(request.content);calls.append(body)
        content=body['messages'][0]['content']
        ids=[json.loads(part['text'].removeprefix('视觉证据：'))['evidence_id'] for part in content
             if part['type']=='text' and part['text'].startswith('视觉证据：')]
        if len(calls)==2:
            assert '输出校验结果：' in content[0]['text']
            assert 'evidence_in_conclusion' in content[0]['text']
        result=dict(summary='主体轮廓与孔位关系可观察',checks=[],suspects=[],limitations=[])
        if len(calls)==1 or not corrected:
            text='主体外观规律见'+ids[0]
            result[field]=text if field=='summary' else [text]
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})
    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        ids=list(runtime.knowledge.sources.eligible(config.dataset.id,'normal').qualifications)[:2]
        job=runtime.knowledge.start(mining_prompt=self_discovery_prompt,request=dict(images=ids,image_count=2))
        runtime.jobs.wait(job['run_id'],5)
        result=runtime.jobs.status(job['run_id'])
        assert len(calls)==2
        if not corrected:
            assert result['status']=='FAILED' and KnowledgeRepository(db).current(config.dataset.id) is None
            return
        assert result['status']=='COMPLETED',result['errors']
        snapshot=KnowledgeRepository(db).get(result['knowledge_version_id'])
        assert snapshot.summary=='主体轮廓与孔位关系可观察'
        assert snapshot.limitations==[]
        assert len([call for call in result['model_calls'] if call['operation']=='generate'])==2
    finally:
        runtime.close()


def test_model_corrects_mask_references_without_accepting_unknown_evidence(defect_dataset,self_discovery_prompt):
    db,dataset,_,_=defect_dataset
    drafts=[]
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        body=json.loads(request.content)
        if body['response_format']['json_schema']['name']=='KnowledgeDiscoveryLinks':
            result={'area_0':dict(status='证据不足',subjects=[],check_titles=[])}
        else:
            content=body['messages'][0]['content'];drafts.append(content)
            evidence=[json.loads(part['text'].removeprefix('视觉证据：')) for part in content
                      if part['type']=='text' and part['text'].startswith('视觉证据：')]
            refs=[item['evidence_id'] for item in evidence if len(drafts)==1 or item['representation']=='raw']
            result=dict(summary='保留可观察范围',checks=[],suspects=[],limitations=[],discovery=dict(parts=[],areas=[dict(
                direction_id=None,direction='主体结构',status='证据不足',reason='标注仅提供定位线索',evidence_ids=refs)]))
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})
    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        ids=list(runtime.knowledge.sources.registered(dataset['dataset_id']).qualifications)
        job=runtime.knowledge.start(mining_prompt=self_discovery_prompt,request=dict(images=ids,image_count=len(ids)))
        runtime.jobs.wait(job['run_id'],5)
        result=runtime.jobs.status(job['run_id'])
        assert result['status']=='COMPLETED',result['errors']
        assert len(drafts)==2
        snapshot=KnowledgeRepository(db).get(result['knowledge_version_id'])
        owners={item.image.evidence_id:item.image for item in snapshot.evidence}
        assert all(owners[ref].representation=='raw' for ref in snapshot.mining_steps[0].result.discovery.areas[0].evidence_ids)
    finally:
        runtime.close()
