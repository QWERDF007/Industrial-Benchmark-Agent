import json
import threading
import time

import httpx
import pytest

from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.gallery import GalleryQueries, GalleryQuery
from iad_core.consistency.result_models import ConsistencyQuery
from iad_core.consistency.result_queries import ResultQueries
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize('labels,verdict,prompt', [(('15', '18'), 'MATERIAL',None), (('OK', 'NG'), 'MATERIAL',None), (('14', '14'), 'EQUIVALENT',None),
    (('15','18'),'MATERIAL','用户完整提示词：仅比较实际原始标注，保留差异证据。')])
def test_group_model_analysis_is_completed_only_after_saved_valid_citations(dataset, tmp_path, labels, verdict,prompt):
    from iad_core.consistency.group_analysis import GroupAnalyses
    from iad_core.consistency.group_analysis_models import GroupAnalysisStart
    db, registry, config = dataset
    for name, label in zip(('dent', 'scratch'), labels):
        path = tmp_path / 'labels' / (name + '.json')
        content = json.loads(path.read_text())
        content['shapes'][0]['label'] = label
        if verdict == 'EQUIVALENT' and name == 'scratch':
            content['shapes'][0]['points'][0][0] = 10.2
        path.write_text(json.dumps(content))
    registry.rescan(config.dataset.id)
    entered, release = threading.Event(), threading.Event()
    requests = []
    citation = {}
    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        requests.append(body)
        instruction = body['messages'][0]['content'][0]['text']
        if prompt:
            assert instruction.startswith(prompt)
            assert '不限于工具已报出的差异' not in instruction[len(prompt):]
        else:
            assert '不限于工具已报出的差异' in instruction
            assert 'overall.text只写一句简短的差异结论' in instruction
            assert '类别值不同就是标注类别不同' in instruction
            assert '不裁决哪一侧标注正确' in instruction
            assert '不得预设类别映射或语义相近' in instruction
            assert '视觉相近可以写入详细分析，但不能否定类别差异' in instruction
            assert '非同像素的相似图' in instruction
            assert '不能仅因OK/NG不同' in instruction
            assert '不能仅因没有精确配准' in instruction
        assert '明确未核实规范' not in instruction
        for label in labels:
            assert f'"raw_label":"{label}"' in instruction
        schema = body['response_format']['json_schema']['schema']
        assert schema['$defs']['GroupOverallConclusion']['properties']['text']['maxLength'] == 40
        assert list(schema['properties']) == ['assessments','conclusions','limitations','overall'], '先逐候选判断，再作整组结论'
        frozen=json.JSONDecoder().raw_decode(instruction.split('冻结图组：')[1])[0]
        candidate,member=next(iter(frozen['candidates'].items()))
        assert candidate == '@c1' and member['comparison']['evidence_id'].startswith('@e'), '传输引用应短且与本批候选绑定'
        wire_citation=dict(candidate_id=candidate,comparison={**member['comparison'],'difference_id':frozen['evidence'][0]['differences'][0]['difference_id']})
        wire_citation['comparison'].pop('anchor_side',None)
        if citation['comparison']['evidence_id']=='invented-evidence': wire_citation['comparison']['evidence_id']='invented-evidence'
        assert '类别值不同' not in schema['$defs']['GroupPairAssessment']['properties']['verdict']['description'], 'Schema不得另附不可编辑的业务判定规则'
        import base64,io
        from PIL import Image
        descriptors=[json.loads(item['text'].split('视觉证据：',1)[1]) for item in body['messages'][0]['content']
            if item['type']=='text' and item['text'].startswith('视觉证据：')]
        assert descriptors and all(item['representation']=='raw' for item in descriptors)
        assert any(item['role']=='roi' for item in descriptors)
        assert '"annotations"' in instruction
        for item in body['messages'][0]['content']:
            if item['type']=='image_url':
                with Image.open(io.BytesIO(base64.b64decode(item['image_url']['url'].split(',',1)[1]))) as actual:
                    assert actual.convert('RGB').getextrema()==((0,0),(0,0),(255,255)), '模型只接收原图/原始裁剪像素，不得绘制框或文字'
        entered.set()
        assert release.wait(10)
        text = '标注类别不同' if verdict == 'MATERIAL' else '未发现标注差异'
        result = {'assessments': [{'candidate_id':wire_citation['candidate_id'],
            'verdict':verdict,'conclusion':text,'explanation':text,'findings':[text] if verdict == 'MATERIAL' else []}],
            'overall':{'verdict':verdict,'text':text,'references':[wire_citation.copy()]},
            'conclusions': [{'text': text, 'references': [wire_citation.copy()]}], 'limitations': []}
        return httpx.Response(200, json={'id': 'real-protocol-test', 'model': 'test-mllm', 'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})
    runtime = WorkbenchRuntime(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        a, b = (config.dataset.id + ':' + name + '.png' for name in ['dent', 'scratch'])
        compared = runtime.consistency_service.compare(ConsistencyCompare(sample_a=a, sample_b=b))
        citation.update(candidate_id=b, comparison={'result_id':compared.result_id, 'evidence_id':compared.evidence_id, 'difference_id':compared.annotation.differences[0].difference_id})
        snapshot = ResultQueries(db).query(ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}}))
        group = GalleryQueries(db).query(GalleryQuery(query_id=snapshot.query_id, kind='conflicts')).items[0]
        request = GroupAnalysisStart(query_id=snapshot.query_id, kind='conflicts', group_id=group.group_id, request_id='one-group-analysis',
            **({'instruction':prompt} if prompt else {}))
        analyses = GroupAnalyses(runtime, runtime.client)
        assert analyses.read(request).status == 'NOT_ANALYZED'
        started = analyses.start(request)
        assert entered.wait(5), analyses.read(request).model_dump()
        assert GalleryQueries(db).query(GalleryQuery(query_id=snapshot.query_id,kind='conflicts')).items[0].model_state=='RUNNING'
        running = analyses.read(request)
        assert running.status == 'RUNNING' and running.result is None
        assert analyses.start(request).run_id == started.run_id
        release.set()
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            result = analyses.read(request)
            if result.status not in ('PENDING', 'RUNNING'):
                break
            time.sleep(.01)
        assert result.status == 'COMPLETED'
        assert result.result.conclusions[0].references[0].comparison.evidence_id == compared.evidence_id
        assert result.result.assessments[0].verdict == verdict
        assert result.result.overall.verdict == verdict
        saved=runtime.jobs.status(started.run_id)
        bindings=saved['model_reference_bindings'][saved['group_analysis_batches'][0]['input_fingerprint']]
        assert bindings['@c1']==b
        wire=json.JSONDecoder().raw_decode(requests[0]['messages'][0]['content'][0]['text'].split('冻结图组：')[1])[0]
        assert bindings[wire['candidates']['@c1']['comparison']['evidence_id']]==compared.evidence_id
        gallery = GalleryQueries(db)
        query = GalleryQuery(query_id=snapshot.query_id,kind='conflicts')
        assert gallery.query(query).total == 1, 'MLLM基本一致不得从默认问题网格删除'
        assert gallery.query(query).items[0].model_state == verdict
        assert gallery.query(query.model_copy(update={'model_filter':verdict})).total == 1
        assert gallery.query(query.model_copy(update={'model_filter':'UNCERTAIN'})).total == 0
        assert result.model_name == 'test-mllm'
        assert len(requests) == 1
        assert any(part['type'] == 'image_url' for part in requests[0]['messages'][0]['content'])
        assert runtime.jobs.status(started.run_id)['completed'] == 2
        citation['comparison']['evidence_id'] = 'invented-evidence'
        runtime.client.profile = runtime.client.profile.model_copy(update={'request_parameters':{'temperature':0.2}})
        bad = analyses.start(request.model_copy(update={'request_id': 'reject-invented-reference'}))
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            result = analyses.read(request)
            if result.status not in ('PENDING', 'RUNNING'):
                break
            time.sleep(.01)
        assert result.run_id == bad.run_id and result.status == 'FAILED' and result.result is None
        assert len(requests) == 3, '配置变化后应实际生成并执行一次格式纠正，不能使用旧批次'
        assert 'reference' in result.error.lower()
    finally:
        release.set()
        runtime.close()


def test_group_reference_schema_requires_complete_comparison():
    from pydantic import ValidationError
    from iad_core.consistency.group_analysis_models import GroupAnalysisReference
    reference = GroupAnalysisReference.model_validate({'candidate_id':'candidate', 'comparison':{'result_id':'result', 'evidence_id':'evidence'}})
    assert reference.comparison.result_id == 'result'
    assert GroupAnalysisReference(candidate_id='candidate').comparison is None
    comparison_schema = GroupAnalysisReference.model_json_schema()['$defs']['GroupAnalysisComparison']
    assert set(comparison_schema['required']) == {'result_id','evidence_id'}
    with pytest.raises(ValidationError):
        GroupAnalysisReference.model_validate({'candidate_id':'candidate', 'comparison':{'evidence_id':'evidence'}})


@pytest.mark.parametrize('mode',['missing','duplicate','wrong_comparison'])
def test_group_assessments_require_full_unique_candidates_and_their_direct_evidence(dataset,tmp_path,mode):
    from shutil import copyfile
    from iad_core.consistency.group_analysis import GroupAnalyses
    from iad_core.consistency.group_analysis_models import GroupAnalysisStart
    db,registry,config=dataset
    copyfile(tmp_path/'images/dent.png',tmp_path/'images/third.png')
    registry.rescan(config.dataset.id)
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        body=json.loads(request.content)
        frozen=json.JSONDecoder().raw_decode(body['messages'][0]['content'][0]['text'].split('冻结图组：')[1])[0]
        refs=[dict(candidate_id=sid,comparison=dict(result_id=member['comparison']['result_id'],evidence_id=member['comparison']['evidence_id']))
            for sid,member in frozen['candidates'].items()]
        assessments=[dict(candidate_id=ref['candidate_id'],verdict='UNCERTAIN',conclusion='缺少直接比较证据',explanation='当前候选缺少固定主图的直接比较证据',findings=[]) for ref in refs]
        if mode=='missing': assessments.pop()
        elif mode=='duplicate': assessments[1]=assessments[0].copy()
        else: refs[0]={**refs[0],'comparison':refs[1]['comparison']}
        result=dict(assessments=assessments,overall=dict(verdict='UNCERTAIN',text='缺少直接比较证据',references=[refs[0]]),
            conclusions=[dict(text='需逐图核对',references=[refs[0]])],limitations=[])
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})
    runtime=WorkbenchRuntime(db,VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        anchor=config.dataset.id+':dent.png'
        for name in ['scratch','third']:
            runtime.consistency_service.compare(ConsistencyCompare(sample_a=anchor,sample_b=config.dataset.id+':'+name+'.png'))
        page=ResultQueries(db).query(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'}}))
        group=GalleryQueries(db).query(GalleryQuery(query_id=page.query_id,kind='groups')).items[0]
        request=GroupAnalysisStart(query_id=page.query_id,kind='groups',group_id=group.group_id,request_id=mode)
        analyses=GroupAnalyses(runtime,runtime.client);job=analyses.start(request)
        runtime.jobs.wait(job.run_id,5)
        view=analyses.read(request)
        assert view.status=='FAILED' and view.result is None
        assert 'every frozen candidate exactly once' in view.error or 'does not match this candidate' in view.error
        filtered=GalleryQueries(db).query(GalleryQuery(query_id=page.query_id,kind='groups',model_filter='FAILED'))
        assert filtered.total==1
    finally:runtime.close()


@pytest.mark.parametrize('corrected', [True, False])
@pytest.mark.parametrize('error_kind', ['candidate_coverage', 'crossed_comparison', 'overall_verdict', 'descriptive_text', 'assertive_text', 'missing_conclusion'])
def test_group_model_can_correct_frozen_associations_once_without_rewriting_its_output(dataset, tmp_path, error_kind, corrected):
    from copy import deepcopy
    from shutil import copyfile
    from iad_core.consistency.group_analysis import GroupAnalyses
    from iad_core.consistency.group_analysis_models import GroupAnalysisStart

    db, registry, config = dataset
    copyfile(tmp_path/'images/dent.png', tmp_path/'images/third.png')
    registry.rescan(config.dataset.id)
    calls, refs = [], []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        body = json.loads(request.content)
        calls.append(body)
        frozen=json.JSONDecoder().raw_decode(body['messages'][0]['content'][0]['text'].split('冻结图组：')[1])[0]
        wire_refs=[dict(candidate_id=sid,comparison=dict(result_id=member['comparison']['result_id'],evidence_id=member['comparison']['evidence_id']))
            for sid,member in frozen['candidates'].items()]
        if error_kind == 'crossed_comparison':
            reference_schema = body['response_format']['json_schema']['schema']['$defs']['GroupAnalysisReference']
            assert 'anyOf' in reference_schema, '生成约束必须绑定候选与自己的比较记录，不能独立枚举后任意串配'
            branches = reference_schema['anyOf']
            for ref in wire_refs:
                branch = next(item for item in branches if item['properties']['candidate_id']['enum']==[ref['candidate_id']])
                comparisons = [item for item in branch['properties']['comparison']['anyOf'] if item.get('type')=='object']
                assert any(item['properties']['evidence_id']['enum']==[ref['comparison']['evidence_id']]
                    and item['properties']['result_id']['enum']==[ref['comparison']['result_id']] for item in comparisons)
                foreign = next(item for item in wire_refs if item['candidate_id']!=ref['candidate_id'])['comparison']['evidence_id']
                assert all(foreign not in item['properties']['evidence_id']['enum'] for item in comparisons)
        result = dict(overall=dict(verdict='MATERIAL', text='标注存在差异', references=deepcopy(wire_refs)),
            assessments=[dict(candidate_id=ref['candidate_id'], verdict='MATERIAL', conclusion='标注类别不同', explanation='对应标注存在差异', findings=['标注差异']) for ref in wire_refs],
            conclusions=[dict(text='保留对应标注的差异与实际证据', references=deepcopy(wire_refs))], limitations=[])
        if len(calls) == 1 or not corrected:
            if error_kind == 'candidate_coverage':
                result['assessments'].pop()
            elif error_kind == 'crossed_comparison':
                result['overall']['references'][0]['comparison'] = deepcopy(wire_refs[1]['comparison'])
            elif error_kind == 'missing_conclusion':
                result['assessments'][0].pop('conclusion')
            elif error_kind == 'assertive_text':
                result['overall']['text'] = '标注视觉基本一致'
                result['assessments'][0]['conclusion'] = '标注可能一致，仍待核对'
            elif error_kind == 'descriptive_text':
                result['overall']['text'] = '候选@c1存在标注差异'
                result['conclusions'][0]['text'] = 'part.png 的标注存在差异'
                result['assessments'][0]['explanation'] = '图像@c1存在差异'
                result['assessments'][0]['findings'] = ['frame.png 有额外标注']
                result['limitations'] = ['候选@c2尚需核对']
            else:
                result['overall']['verdict'] = 'EQUIVALENT'
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        anchor = config.dataset.id+':dent.png'
        for name in ('scratch', 'third'):
            candidate = config.dataset.id+':'+name+'.png'
            comparison = runtime.consistency_service.compare(ConsistencyCompare(sample_a=anchor, sample_b=candidate))
            refs.append(dict(candidate_id=candidate, comparison=dict(result_id=comparison.result_id, evidence_id=comparison.evidence_id)))
        page = ResultQueries(db).query(ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}}))
        group = GalleryQueries(db).query(GalleryQuery(query_id=page.query_id, kind='groups')).items[0]
        request = GroupAnalysisStart(query_id=page.query_id, kind='groups', group_id=group.group_id, request_id=error_kind)
        analyses = GroupAnalyses(runtime, runtime.client)
        job = analyses.start(request)
        runtime.jobs.wait(job.run_id, 5)
        view = analyses.read(request)
        assert len(calls) == 2, '冻结引用错误应允许模型自行纠正一次，持续错误也不能无限重试'
        feedback = json.loads(calls[1]['messages'][-1]['content'].split('输出校验结果：', 1)[1])
        assert all(issue['ctx']['repairable_output'] for issue in feedback['schema_validation_errors'])
        assert calls[1]['messages'][1]['content']
        if error_kind=='overall_verdict':
            assert 'MATERIAL' in feedback['schema_validation_errors'][0]['msg'] and 'EQUIVALENT' in feedback['schema_validation_errors'][0]['msg']
        if error_kind=='missing_conclusion':
            assert feedback['schema_validation_errors'][0]['loc']==['assessments',0,'conclusion']
        if error_kind=='assertive_text':
            assert {tuple(issue['loc']) for issue in feedback['schema_validation_errors']} == {('overall','text'),('assessments',0,'conclusion')}
            assert json.loads(calls[1]['messages'][1]['content'])['overall']['text']=='标注视觉基本一致', '必须由模型重新给出明确结论，不能把原文字符串替换成确定语气'
        if error_kind=='descriptive_text':
            assert {tuple(issue['loc']) for issue in feedback['schema_validation_errors']} == {
                ('overall','text'),('conclusions',0,'text'),('assessments',0,'explanation'),
                ('assessments',0,'findings',0),('limitations',0)}, '正文违规须逐字段一起反馈，不清洗模型原答'
            original=json.loads(calls[1]['messages'][1]['content'])
            assert original['conclusions'][0]['text']=='part.png 的标注存在差异'
            assert original['overall']['verdict']=='MATERIAL'
        if corrected:
            assert view.status == 'COMPLETED', view.error
            assert view.result.overall.verdict == 'MATERIAL'
            assert [ref.model_dump(exclude_none=True) for ref in view.result.overall.references] == refs
            assert len(view.result.assessments) == 2
            if error_kind=='descriptive_text':
                legacy='part.png 的既有原始分析'
                with db.connection() as connection:
                    connection.execute("UPDATE job_runs SET payload_json=json_set(payload_json,'$.group_analysis.conclusions[0].text',?) WHERE job_id=?",
                        (legacy,job.run_id))
                assert analyses.read(request).result.conclusions[0].text==legacy, '格式校验仅约束新模型输出，历史原答仍须可读'
        else:
            assert view.status == 'FAILED' and view.result is None
    finally:
        runtime.close()


def test_selected_workflow_owns_group_results_across_prompts_running_jobs_and_contract_updates(dataset, tmp_path, monkeypatch):
    from iad_core.consistency.group_analysis import GroupAnalysisQueries
    from iad_core.consistency.gallery import GalleryReference
    import iad_core.consistency.group_analysis_models as contracts
    db, registry, config = dataset
    entered, release = threading.Event(), threading.Event()

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        text=json.loads(request.content)['messages'][0]['content'][0]['text']
        if text.startswith('作业乙'):
            entered.set()
            assert release.wait(10)
        frozen=json.JSONDecoder().raw_decode(text.split('冻结图组：')[1])[0]
        refs=[dict(candidate_id=sid,comparison=dict(result_id=member['comparison']['result_id'],
            evidence_id=member['comparison']['evidence_id'])) for sid,member in frozen['candidates'].items()]
        verdict='MATERIAL' if text.startswith('作业甲') else 'UNCERTAIN'
        label='标注存在差异' if verdict=='MATERIAL' else '缺少直接比较依据'
        result=dict(overall=dict(verdict=verdict,text=label,references=refs),
            assessments=[dict(candidate_id=ref['candidate_id'],verdict=verdict,conclusion=label,explanation=label,findings=[]) for ref in refs],
            conclusions=[dict(text=label,references=refs)],limitations=[])
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first=runtime.models.analysis_workflows.start(dict(analysis_kind='consistency',mode='exact',
            dataset_ids=[config.dataset.id],instruction='作业甲完整提示词：比较原始标注。'))
        runtime.jobs.wait(first['run_id'],10)
        first=runtime.models.analysis_workflows.status(first['run_id'])
        assert first['status']=='COMPLETED', first['errors']
        query_a=ResultQueries(db).query(ConsistencyQuery(selection=dict(kind='batch',batch_id=first['program_batch_id'])))
        gallery=GalleryQueries(db)
        cards_a=gallery.query(GalleryQuery(query_id=query_a.query_id,kind='conflicts'))
        assert cards_a.items
        reference_a=GalleryReference(query_id=query_a.query_id,kind='conflicts',group_id=cards_a.items[0].group_id)
        analyses=GroupAnalysisQueries(db)
        original=analyses.read(reference_a)
        assert original.status=='COMPLETED' and original.result.overall.verdict=='MATERIAL'
        second=runtime.models.analysis_workflows.start(dict(analysis_kind='consistency',mode='exact',
            dataset_ids=[config.dataset.id],instruction='作业乙完整提示词：保留未确认的依据。'))
        assert entered.wait(5)
        assert analyses.read(reference_a)==original, '另一个作业开始分析时不能覆盖选中作业的完成结果'
        assert gallery.query(GalleryQuery(query_id=query_a.query_id,kind='conflicts')).items[0].model_state=='MATERIAL'
        running_b=runtime.models.analysis_workflows.status(second['run_id'])
        pending_query=ResultQueries(db).query(ConsistencyQuery(selection=dict(kind='batch',batch_id=running_b['program_batch_id'])))
        pending_cards=gallery.query(GalleryQuery(query_id=pending_query.query_id,kind='conflicts'))
        assert all(card.model_state in ('RUNNING','NOT_ANALYZED') for card in pending_cards.items), '新作业尚未分析的组不能借用旧作业结论'
        release.set()
        runtime.jobs.wait(second['run_id'],10)
        second=runtime.models.analysis_workflows.status(second['run_id'])
        assert second['status']=='COMPLETED',second['errors']
        query_b=ResultQueries(db).query(ConsistencyQuery(selection=dict(kind='batch',batch_id=second['program_batch_id'])))
        cards_b=gallery.query(GalleryQuery(query_id=query_b.query_id,kind='conflicts'))
        assert cards_b.items[0].group_id==reference_a.group_id
        reference_b=reference_a.model_copy(update={'query_id':query_b.query_id})
        assert analyses.read(reference_a)==original
        assert analyses.read(reference_b).result.overall.verdict=='UNCERTAIN'
        assert analyses.read(reference_b).run_id!=original.run_id
        with db.connection() as connection:
            connection.executemany('''INSERT INTO job_runs(job_id,task_id,job_type,status,progress,message,payload_json)
                SELECT ?,task_id,job_type,status,progress,message,json_set(payload_json,'$.root_run_id',?,
                    '$.request.analysis_request_id',?) FROM job_runs WHERE job_id=?''',
                [(f'unrelated-{index}',f'unrelated-{index}',f'unrelated-request-{index}',original.run_id) for index in range(1200)])
            connection.execute('ANALYZE job_runs')
        connect=db.get_connection
        instructions=0
        def budget():
            nonlocal instructions
            instructions+=100
            return instructions>20000
        def connection():
            value=connect();value.set_progress_handler(budget,100);return value
        with monkeypatch.context() as patch:
            patch.setattr(db,'get_connection',connection)
            assert analyses.read(reference_a)==original,'按所选作业读取不应扫描其他作业的大量冻结负载'
            assert gallery.query(GalleryQuery(query_id=query_a.query_id,kind='conflicts')).items[0].model_state=='MATERIAL'
        monkeypatch.setattr(contracts,'GROUP_ANALYSIS_SCHEMA','a-new-contract-for-future-jobs')
        assert analyses.read(reference_a)==original, '历史结果使用其实际冻结契约，不能因当前默认Schema更新而消失'
        assert gallery.query(GalleryQuery(query_id=query_a.query_id,kind='conflicts')).items[0].model_state=='MATERIAL'
        assert gallery.query(GalleryQuery(query_id=query_b.query_id,kind='conflicts')).items[0].model_state=='UNCERTAIN'
        label=tmp_path/'labels/dent.json'
        changed=json.loads(label.read_text());changed['shapes'][0]['label']='later-label';label.write_text(json.dumps(changed))
        registry.rescan(config.dataset.id)
        historical=ResultQueries(db).query(ConsistencyQuery(selection=dict(kind='batch',batch_id=first['program_batch_id'])))
        historical_cards=gallery.query(GalleryQuery(query_id=historical.query_id,kind='conflicts'))
        assert all(card.facts_state=='HISTORICAL' for card in historical_cards.items)
        old_card=next(card for card in historical_cards.items if card.group_id==reference_a.group_id)
        assert old_card.model_state=='MATERIAL'
        assert analyses.read(reference_a.model_copy(update={'query_id':historical.query_id,'facts_state':old_card.facts_state}))==original
    finally:
        release.set()
        runtime.close()
