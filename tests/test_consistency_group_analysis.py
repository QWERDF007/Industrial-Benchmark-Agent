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
        entered.set()
        assert release.wait(10)
        result = {'conclusions': [{'text': '像素一致，类别定义需要人工核对。', 'references': [citation.copy()]}], 'limitations': ['未进行人工质量裁决']}
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
