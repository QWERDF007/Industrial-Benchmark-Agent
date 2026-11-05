import pytest
import httpx
import json
import threading
import subprocess
import sys
from uuid import uuid4

from iad_core.entry import audit_list, audit_job_samples, audit_job_sample, audit_job_report
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.job_snapshots import JobSnapshots
from iad_core.workbench.audit_results import AuditResults


def test_audit_list_and_status_are_readable_in_an_independent_query_worker(dataset, mllm_api):
    db, _, config = dataset
    client, _, _ = mllm_api
    runtime = WorkbenchRuntime(db, VlmClient(client))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[config.dataset.id+':dent.png'])
        runtime.audit.wait(job['run_id'], 5)
        requests = [dict(request_id='status',operation='audit_status',arguments=dict(run_id=job['run_id']),db_path=db.db_path),
            dict(request_id='list',operation='audit_list',arguments=dict(dataset_id=config.dataset.id),db_path=db.db_path),
            dict(request_id='frozen',operation='analysis_node',arguments=dict(run_id=job['run_id']),db_path=db.db_path)]
        process = subprocess.run([sys.executable,'-m','iad_core.entry','--query-worker'],
            input=''.join(json.dumps(request)+'\n' for request in requests), capture_output=True,text=True,timeout=15,check=True)
        responses = {item['request_id']:item for item in map(json.loads,process.stdout.splitlines())}
        assert all(item['event']=='result' for item in responses.values()), responses
        assert responses['status']['data']['completed'] == 1
        assert responses['list']['data']['jobs'][0]['run_id'] == job['run_id']
        frozen=responses['frozen']['data']
        assert frozen['request']['input_sources']
        for view in [responses['status']['data'], responses['list']['data']['jobs'][0]]:
            assert not set(view) & {'request','submission','input_sources','consistency_scopes','model_reference_bindings','instruction'}, '页面状态轮询只返回声明的展示字段'
            assert view['model_profile']==frozen['model_profile']
            assert view['errors']==frozen['errors'] and view['model_calls']==frozen['model_calls']
    finally:
        runtime.close()


def test_published_audit_and_owner_progress_are_committed_together(dataset, mllm_api, monkeypatch):
    db, _, config = dataset
    client, _, _ = mllm_api
    entered, release, allow_model = threading.Event(), threading.Event(), threading.Event()
    connect = db.get_connection

    def before_child_finished():
        entered.set()
        assert release.wait(5)

    def connection():
        value = connect()
        value.create_function('before_child_finished', 0, before_child_finished)
        return value

    monkeypatch.setattr(db, 'get_connection', connection)
    with db.connection() as value:
        value.execute("""CREATE TRIGGER observe_child_finish BEFORE UPDATE OF status ON job_runs
            WHEN NEW.job_type='MODEL_AUDIT_SAMPLE' AND NEW.status='COMPLETED'
            BEGIN SELECT before_child_finished(); END""")
    def respond(request):
        assert allow_model.wait(5)
        return client.send(request)

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    sid = config.dataset.id + ':dent.png'
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[sid])
        allow_model.set()
        assert entered.wait(5)
        assert AuditResults(db).sample(job['run_id'],sid).suggestion
        state = JobSnapshots(db).snapshot(job['run_id'])
        assert state.completed_sample_ids == [sid], '已发布结果必须同时推进根作业，进程中断后不得重复审计'
    finally:
        allow_model.set()
        release.set()
        runtime.close()


@pytest.mark.parametrize('prompt',[None,'用户完整审计提示词：结合冻结知识与真实图像，逐项记录可见依据和限制。'])
def test_independent_audit_images_run_together_and_keep_one_job_and_trace(dataset, mllm_api,prompt):
    db, _, config = dataset
    original, _, _ = mllm_api
    together = threading.Barrier(2)

    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/chat/completions') and body['response_format']['json_schema']['name'] == 'JointAnalysis':
            if prompt:
                text=body['messages'][0]['content'][0]['text']
                assert text.startswith(prompt)
                assert '依据冻结的数据集知识联合分析真实全图与全部ROI' not in text[len(prompt):]
                assert '在同一次分析中同时观察全图' not in text[len(prompt):]
            together.wait(timeout=3)
        return original.send(request)

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    ids = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=ids,**({'instruction':prompt} if prompt else {}))
        runtime.audit.wait(job['run_id'], 8)
        state = runtime.audit.status(job['run_id'])
        assert state['status'] == 'COMPLETED', state['errors']
        assert set(state['completed_sample_ids']) == set(ids)
        assert [item['run_id'] for item in runtime.audit.list(config.dataset.id)] == [job['run_id']]
        assert {call['sample_id'] for call in state['model_calls']} == set(ids)
        assert all(call['run_id'] == job['run_id'] and call['phase'] == 'SYNTHESIS' for call in state['model_calls'])
        for sample_id in ids:
            detail = audit_job_sample(dict(run_id=job['run_id'], sample_id=sample_id), db.db_path)
            assert detail['suggestion']['audit_run_id'] == job['run_id']
            assert detail['consistency']['run_id'] == job['run_id']
        assert audit_job_report(dict(run_id=job['run_id']), db.db_path)['audited_samples'] == 2
    finally:
        runtime.close()


def test_cancelling_parallel_audit_stops_all_active_images_and_retry_keeps_frozen_results(dataset, mllm_api):
    db, _, config = dataset
    original, _, _ = mllm_api
    entered, release = threading.Event(), threading.Event()
    generated = []

    def respond(request):
        if request.url.path.endswith('/chat/completions'):
            generated.append(request)
            if len(generated) == 2:
                entered.set()
            assert release.wait(5)
        return original.send(request)

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    ids = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch', 'normal2')]
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=ids)
        assert entered.wait(5)
        runtime.audit.cancel(job['run_id'])
        release.set()
        runtime.audit.wait(job['run_id'], 5)
        state = runtime.audit.status(job['run_id'])
        assert (state['status'],state['completed'],state['failed'],state['unprocessed']) == ('CANCELLED',0,0,3)
        assert len(generated) == 2
        assert all(audit_job_sample(dict(run_id=job['run_id'],sample_id=sid), db.db_path)['suggestion'] is None for sid in ids)
        retry = runtime.audit.retry(job['run_id'])
        runtime.audit.wait(retry['run_id'], 5)
        resumed = runtime.audit.status(retry['run_id'])
        assert (resumed['status'],resumed['completed']) == ('COMPLETED',3), resumed['errors']
        assert audit_job_report(dict(run_id=job['run_id']),db.db_path)['audited_samples'] == 3
        assert audit_job_report(dict(run_id=retry['run_id']),db.db_path)['audited_samples'] == 3
    finally:
        release.set()
        runtime.close()


def test_partial_audit_retries_keep_one_full_scope_job_and_each_samples_actual_source(dataset, mllm_api, monkeypatch):
    db, _, config = dataset
    original, _, _ = mllm_api
    ids = [config.dataset.id+':'+name+'.png' for name in ('dent', 'scratch', 'normal2')]
    failing = set(ids[1:])
    inspected = []

    def respond(request):
        if request.url.path.endswith('/chat/completions'):
            body = json.loads(request.content)
            if body['response_format']['json_schema']['name'] == 'JointAnalysis':
                view = next(json.loads(item['text'][5:]) for item in body['messages'][0]['content']
                    if item['type']=='text' and item['text'].startswith('视觉证据：'))
                source = view['annotations'][0]['sample_id'] if view['annotations'] else ids[2]
                inspected.append(source)
                if source in failing:
                    return httpx.Response(503, json={'error':{'message':'当前图像的模型分析失败'}})
        return original.send(request)

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        root = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=ids)
        runtime.audit.wait(root['run_id'], 5)
        first = audit_job_sample(dict(run_id=root['run_id'],sample_id=ids[0]), db.db_path)
        assert first['suggestion'] and first['consistency'], runtime.audit.status(root['run_id'])['errors']
        assert runtime.audit.status(root['run_id'])['status'] == 'PARTIAL'
        failing.clear()
        second = runtime.audit.retry(root['run_id'], sample_ids=[ids[1]])
        runtime.audit.wait(second['run_id'], 5)
        state = runtime.audit.status(root['run_id'])
        assert (state['status'],state['completed'],state['failed'],state['total_samples']) == ('PARTIAL',2,1,3)
        assert state['request'] == root['request']
        assert len(runtime.audit.list(config.dataset.id)) == 1
        options = runtime.jobs.retry_options(second['run_id'], ('MODEL_AUDIT',))
        assert [item['sample_id'] for item in options['samples']] == [ids[2]]
        third = runtime.audit.retry(second['run_id'])
        runtime.audit.wait(third['run_id'], 5)
        state = runtime.audit.status(root['run_id'])
        assert (state['status'],state['completed'],state['failed'],state['total_samples']) == ('COMPLETED',3,0,3)
        assert state['errors'] == [] and state['completed_sample_ids'] == sorted(ids)
        assert runtime.jobs.status(third['run_id'])['sample_ids'] == [ids[2]], '执行只处理剩余样本'
        assert inspected.count(ids[0]) == 1, '补跑不能重新分析已成功图像'
        assert len(runtime.audit.list(config.dataset.id)) == 1
        repeated = runtime.audit.start(**root['request']['submission'])
        assert repeated['run_id'] == state['run_id'] and repeated['completed'] == repeated['total_samples'] == 3
        for handle in (root['run_id'], second['run_id'], third['run_id']):
            page = audit_job_samples(dict(run_id=handle), db.db_path)
            assert page['total'] == 3 and page['distribution']['normal'] == 3
            report = audit_job_report(dict(run_id=handle), db.db_path)
            assert report['total_samples'] == report['audited_samples'] == 3
        for sid, origin in zip(ids, (root['run_id'],second['run_id'],third['run_id'])):
            detail = audit_job_sample(dict(run_id=third['run_id'],sample_id=sid), db.db_path)
            assert detail['sample']['run_id'] == detail['suggestion']['audit_run_id'] == detail['consistency']['run_id'] == origin
            assert detail['source_current'] is True
        assert audit_job_sample(dict(run_id=root['run_id'],sample_id=ids[0]),db.db_path) == first

        queries = []
        connect = Database.get_connection
        def traced_connection(database):
            connection = connect(database)
            if database.db_path == db.db_path:
                connection.set_trace_callback(queries.append)
            return connection
        with monkeypatch.context() as tracing:
            tracing.setattr(Database, 'get_connection', traced_connection)
            listed = audit_list(dict(dataset_id=config.dataset.id), db.db_path)['jobs']
        assert len(listed) == 1 and listed[0]['root_run_id'] == root['run_id']
        assert listed[0]['completed'] == listed[0]['total_samples'] == 3
        assert listed[0]['model_calls'] == state['model_calls']
        payload_reads = [query for query in queries if query.startswith('SELECT * FROM job_runs WHERE job_id=')]
        assert len(payload_reads) <= 3, '列表只为读取根ID而重复加载冻结请求和调用记录：' + str(payload_reads)
    finally:
        runtime.close()


def test_job_results_and_report_keep_their_own_frozen_scope_after_reaudit(dataset, mllm_api):
    db, _, config = dataset
    client, _, responses = mllm_api
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    dent, scratch = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    try:
        request = dict(submission_id=str(uuid4()), dataset_id=config.dataset.id, sample_ids=[dent, scratch])
        first = runtime.audit.start(**request)
        runtime.audit.wait(first['run_id'], 5)
        assert runtime.audit.status(first['run_id'])['status'] == 'COMPLETED'
        assert runtime.audit.start(**request)['run_id'] == first['run_id']
        with pytest.raises(ValueError, match='提交ID'):
            runtime.audit.start(**dict(request, sample_ids=[dent]))
        original = audit_job_sample({'run_id': first['run_id'], 'sample_id': dent}, db.db_path)
        responses['VlmResult'].update(suggested_label='UNCERTAIN', missing_evidence=['需要补充观察角度'])
        second = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[dent])
        runtime.audit.wait(second['run_id'], 5)
        assert runtime.audit.status(second['run_id'])['status'] == 'COMPLETED'
        first_page = audit_job_samples({'run_id': first['run_id']}, db.db_path)
        assert first_page['total'] == 2
        assert {item['audit_state'] for item in first_page['items']} == {'normal'}
        second_page = audit_job_samples({'run_id': second['run_id']}, db.db_path)
        assert second_page['total'] == 1
        assert second_page['items'][0]['audit_state'] == 'insufficient'
        assert audit_job_sample({'run_id': first['run_id'], 'sample_id': dent}, db.db_path) == original
        assert original['suggestion']['audit_run_id'] == first['run_id']
        assert original['knowledge']['version_id'] == first['knowledge_version_id']
        report = audit_job_report({'run_id': first['run_id']}, db.db_path)
        assert report['total_samples'] == 2 and report['audited_samples'] == 2
        assert report['coverage_percent'] == 100
        assert report['insufficient_samples'] == 0
        assert audit_job_report({'run_id': second['run_id']}, db.db_path)['insufficient_samples'] == 1
        filtered = audit_job_samples({'run_id': first['run_id'], 'search': 'scratch', 'status': 'normal'}, db.db_path)
        assert [item['sample_id'] for item in filtered['items']] == [scratch]
        responses['VlmResult']['confidence'] = 2
        failed = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[dent])
        runtime.audit.wait(failed['run_id'], 5)
        assert runtime.audit.status(failed['run_id'])['status'] == 'FAILED'
        pending = audit_job_samples({'run_id': failed['run_id']}, db.db_path)
        assert pending['items'][0]['audit_state'] == 'unprocessed'
        detail = audit_job_sample({'run_id': failed['run_id'], 'sample_id': dent}, db.db_path)
        assert detail['suggestion'] is None and detail['errors']
        assert detail['consistency']['run_id'] == failed['run_id']
        assert audit_job_report({'run_id': failed['run_id']}, db.db_path)['coverage_percent'] == 0
        with pytest.raises(LookupError):
            audit_job_sample({'run_id': second['run_id'], 'sample_id': scratch}, db.db_path)
    finally:
        runtime.close()


def test_job_html_export_uses_embedded_frozen_evidence_and_escapes_model_text(dataset, mllm_api):
    from iad_core.entry import audit_job_export
    db, _, config = dataset
    client, _, responses = mllm_api
    responses['VlmResult']['description'] = '<img src=x onerror=alert(1)>'
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[config.dataset.id + ':dent.png'])
        runtime.audit.wait(job['run_id'], 5)
        assert runtime.audit.status(job['run_id'])['status'] == 'COMPLETED'
        exported = audit_job_export({'run_id': job['run_id']}, db.db_path)
        html = exported['html']
        assert 'data:image/png;base64,' in html
        assert '&lt;img src=x onerror=alert(1)&gt;' in html
        assert '<img src=x onerror=alert(1)>' not in html
        assert db.db_path not in html and config.root not in html
        assert '/api/iad/' not in html
        assert job['run_id'] in html and job['knowledge_version_id'] in html
        assert exported['filename'].endswith('.html')
    finally:
        runtime.close()


@pytest.mark.parametrize('malformed',['description','assessment_type','missing_assessment','duplicate_assessment','missing_roi','missing_findings','mask_only'])
@pytest.mark.parametrize('corrected',[True,False])
def test_audit_model_corrects_its_output_without_program_fallback(dataset,mllm_api,malformed,corrected):
    db,_,config=dataset
    original,_,responses=mllm_api
    responses['VlmResult']['suggested_label']='FAIL'
    generated=[]
    def respond(request):
        if request.url.path.endswith('/chat/completions'):
            body=json.loads(request.content)
            if body['response_format']['json_schema']['name']=='JointAnalysis':
                result=original.send(request).json();generated.append(body)
                value=json.loads(result['choices'][0]['message']['content'])
                assert value['findings']
                if len(generated)==1 or not corrected:
                    if malformed=='description':value['findings'][0].pop('description')
                    elif malformed=='assessment_type':value['check_assessments'].append('findings')
                    elif malformed=='missing_assessment':value['check_assessments'].pop()
                    elif malformed=='duplicate_assessment':value['check_assessments'].append(value['check_assessments'][0])
                    elif malformed=='missing_roi':value['region_observations'].pop()
                    elif malformed=='missing_findings':value['findings']=[]
                    else:
                        views=[json.loads(part['text'].removeprefix('视觉证据：')) for part in body['messages'][0]['content']
                            if part['type']=='text' and part['text'].startswith('视觉证据：')]
                        mask=next(view['evidence_id'] for view in views if view['representation']=='annotation_mask')
                        for assessment in value['check_assessments']:assessment['evidence_ids']=[mask]
                else:value['findings'][0]['description']='模型重新核对后给出的可见异常描述'
                result['choices'][0]['message']['content']=json.dumps(value)
                result['choices'][0]['finish_reason']='stop'
                return httpx.Response(200,json=result)
        return original.send(request)
    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        sid=config.dataset.id+':dent.png'
        job=runtime.audit.start(dataset_id=config.dataset.id,sample_ids=[sid])
        runtime.audit.wait(job['run_id'],8)
        result=runtime.audit.status(job['run_id'])
        assert len(generated)==2 and '输出校验结果：' in generated[1]['messages'][-1]['content']
        if not corrected:
            assert result['status']=='FAILED' and result['completed']==0 and result['failed']==1
            assert audit_job_sample(dict(run_id=job['run_id'],sample_id=sid),db.db_path)['suggestion'] is None
            return
        assert result['status']=='COMPLETED',result['errors']
        assert result['completed']==1 and result['failed']==0
        detail=audit_job_sample(dict(run_id=job['run_id'],sample_id=sid),db.db_path)
        assert detail['suggestion']['analysis']['findings'][0]['description']=='模型重新核对后给出的可见异常描述'
    finally:runtime.close()


@pytest.mark.parametrize('failed_stage',['JointAnalysis','AuditConclusion'])
def test_audit_failure_keeps_the_actual_image_step_and_phase_in_the_owner_drawer(dataset, mllm_api, failed_stage):
    db, _, config = dataset
    original, _, _ = mllm_api

    def respond(request):
        if request.url.path.endswith('/chat/completions') and json.loads(request.content)['response_format']['json_schema']['name'] == failed_stage:
            return httpx.Response(503, json={'error': {'message': '真实模型步骤不可用'}})
        return original.send(request)

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[config.dataset.id+':dent.png'])
        runtime.audit.wait(job['run_id'], 5)
        owner = runtime.audit.status(job['run_id'])
        assert owner['status'] == 'FAILED' and owner['failed'] == 1
        child = runtime.jobs.status(owner['batch_runs'][0])
        assert owner['errors'][0]['source_run_id'] == child['run_id']
        assert owner['errors'][0]['source_phase'] == child['errors'][0]['source_phase'] == 'SYNTHESIS'
    finally:
        runtime.close()
