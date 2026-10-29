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


def test_group_model_analysis_is_completed_only_after_saved_valid_citations(dataset):
    from iad_core.consistency.group_analysis import GroupAnalyses
    from iad_core.consistency.group_analysis_models import GroupAnalysisStart
    db, _, config = dataset
    entered, release = threading.Event(), threading.Event()
    requests = []
    citation = {}
    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        requests.append(body)
        instruction = body['messages'][0]['content'][0]['text']
        assert '不限于工具已报出的差异' in instruction
        assert 'overall.text只写一句简短的差异结论' in instruction
        schema = body['response_format']['json_schema']['schema']
        assert schema['$defs']['GroupOverallConclusion']['properties']['text']['maxLength'] == 80
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
        result = {'assessments': [{'candidate_id':citation['candidate_id'],
            'verdict':'EQUIVALENT','explanation':'视觉对象与覆盖一致，类别名称需核对。','findings':[]}],
            'overall':{'verdict':'EQUIVALENT','text':'整组视觉基本一致，保留标注差异待核对。','references':[citation.copy()]},
            'conclusions': [{'text': '像素一致，类别定义需要人工核对。', 'references': [citation.copy()]}], 'limitations': ['未进行人工质量裁决']}
        return httpx.Response(200, json={'id': 'real-protocol-test', 'model': 'test-mllm', 'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})
    runtime = WorkbenchRuntime(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        a, b = (config.dataset.id + ':' + name + '.png' for name in ['dent', 'scratch'])
        compared = runtime.consistency_service.compare(ConsistencyCompare(sample_a=a, sample_b=b))
        citation.update(candidate_id=b, comparison={'result_id':compared.result_id, 'evidence_id':compared.evidence_id, 'difference_id':compared.annotation.differences[0].difference_id})
        snapshot = ResultQueries(db).query(ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}}))
        group = GalleryQueries(db).query(GalleryQuery(query_id=snapshot.query_id, kind='conflicts')).items[0]
        request = GroupAnalysisStart(query_id=snapshot.query_id, kind='conflicts', group_id=group.group_id, request_id='one-group-analysis')
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
        assert result.result.assessments[0].verdict == 'EQUIVALENT'
        assert result.result.overall.verdict == 'EQUIVALENT'
        gallery = GalleryQueries(db)
        query = GalleryQuery(query_id=snapshot.query_id,kind='conflicts')
        assert gallery.query(query).total == 1, 'MLLM基本一致不得从默认问题网格删除'
        assert gallery.query(query).items[0].model_state == 'EQUIVALENT'
        assert gallery.query(query.model_copy(update={'model_filter':'EQUIVALENT'})).total == 1
        assert gallery.query(query.model_copy(update={'model_filter':'MATERIAL'})).total == 0
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
