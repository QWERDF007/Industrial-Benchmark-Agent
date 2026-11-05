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
        text = '标注类别不同' if verdict == 'MATERIAL' else '标注视觉基本一致'
        result = {'assessments': [{'candidate_id':citation['candidate_id'],
            'verdict':verdict,'explanation':text,'findings':[text] if verdict == 'MATERIAL' else []}],
            'overall':{'verdict':verdict,'text':text,'references':[citation.copy()]},
            'conclusions': [{'text': text, 'references': [citation.copy()]}], 'limitations': []}
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
        bad = analyses.start(request.model_copy(update={'request_id': 'reject-invented-reference'}))
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            result = analyses.read(request)
            if result.status not in ('PENDING', 'RUNNING'):
                break
            time.sleep(.01)
        assert result.run_id == bad.run_id and result.status == 'FAILED' and result.result is None
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
    responses=[]
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(responses[0])}}]})
    runtime=WorkbenchRuntime(db,VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        anchor=config.dataset.id+':dent.png'
        pairs=[runtime.consistency_service.compare(ConsistencyCompare(sample_a=anchor,sample_b=config.dataset.id+':'+name+'.png')) for name in ['scratch','third']]
        assessments=[{'candidate_id':config.dataset.id+':'+name+'.png',
            'verdict':'UNCERTAIN','explanation':'需核对','findings':[]} for name in ['scratch','third']]
        conclusions=[{'text':'需逐图核对','references':[{'candidate_id':assessments[0]['candidate_id'],
            'comparison':{'result_id':pairs[0].result_id,'evidence_id':pairs[0].evidence_id}}]}]
        if mode=='missing':assessments.pop()
        elif mode=='duplicate':assessments[1]=assessments[0].copy()
        else:conclusions[0]['references'][0]['comparison']={'result_id':pairs[1].result_id,'evidence_id':pairs[1].evidence_id}
        responses.append({'assessments':assessments,'overall':{'verdict':'UNCERTAIN','text':'整组需核对','references':conclusions[0]['references']},'conclusions':conclusions,'limitations':[]})
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
@pytest.mark.parametrize('error_kind', ['candidate_coverage', 'crossed_comparison', 'overall_verdict'])
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
        if error_kind == 'crossed_comparison':
            reference_schema = body['response_format']['json_schema']['schema']['$defs']['GroupAnalysisReference']
            assert 'anyOf' in reference_schema, '生成约束必须绑定候选与自己的比较记录，不能独立枚举后任意串配'
            branches = reference_schema['anyOf']
            for ref in refs:
                branch = next(item for item in branches if item['properties']['candidate_id']['enum']==[ref['candidate_id']])
                comparisons = [item for item in branch['properties']['comparison']['anyOf'] if item.get('type')=='object']
                assert any(item['properties']['evidence_id']['enum']==[ref['comparison']['evidence_id']]
                    and item['properties']['result_id']['enum']==[ref['comparison']['result_id']] for item in comparisons)
                foreign = next(item for item in refs if item['candidate_id']!=ref['candidate_id'])['comparison']['evidence_id']
                assert all(foreign not in item['properties']['evidence_id']['enum'] for item in comparisons)
        result = dict(overall=dict(verdict='MATERIAL', text='标注存在差异', references=deepcopy(refs)),
            assessments=[dict(candidate_id=ref['candidate_id'], verdict='MATERIAL', explanation='对应标注存在差异', findings=['标注差异']) for ref in refs],
            conclusions=[dict(text='保留对应标注的差异与实际证据', references=deepcopy(refs))], limitations=[])
        if len(calls) == 1 or not corrected:
            if error_kind == 'candidate_coverage':
                result['assessments'].pop()
            elif error_kind == 'crossed_comparison':
                result['overall']['references'][0]['comparison'] = deepcopy(refs[1]['comparison'])
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
        feedback = json.loads(calls[1]['messages'][0]['content'][0]['text'].split('输出校验结果：', 1)[1])
        assert all(issue['ctx']['repairable_output'] for issue in feedback['schema_validation_errors'])
        assert feedback['previous_response']
        if corrected:
            assert view.status == 'COMPLETED', view.error
            assert view.result.overall.verdict == 'MATERIAL'
            assert [ref.model_dump(exclude_none=True) for ref in view.result.overall.references] == refs
            assert len(view.result.assessments) == 2
        else:
            assert view.status == 'FAILED' and view.result is None
    finally:
        runtime.close()
