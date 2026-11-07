import json
from shutil import copyfile
from uuid import uuid4

import httpx
import pytest

from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.gallery import GalleryQueries, GalleryQuery
from iad_core.consistency.group_analysis import GroupAnalyses
from iad_core.consistency.group_analysis_models import GroupAnalysisStart
from iad_core.consistency.result_models import ConsistencyQuery
from iad_core.consistency.result_queries import ResultQueries
from iad_core.consistency.review import ConsistencyReview
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize('change', ['none', 'instruction', 'model_profile', 'batch_size', 'review_context', 'legacy_text'])
def test_new_group_execution_reuses_only_qualified_identical_visual_batches(dataset, tmp_path, change):
    db, registry, config = dataset
    copyfile(tmp_path/'images/dent.png', tmp_path/'images/third.png')
    copyfile(tmp_path/'labels/dent.json', tmp_path/'labels/third.json')
    registry.rescan(config.dataset.id)
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count':1000, 'max_model_len':262144})
        body = json.loads(request.content)
        calls.append(body['response_format']['json_schema']['name'])
        text = body['messages'][0]['content'][0]['text']
        visual = calls[-1] == 'GroupAnalysisDraft'
        facts = json.JSONDecoder().raw_decode(text.split('冻结图组：' if visual else '冻结批次分析：', 1)[1])[0]
        refs = [dict(candidate_id=sid, comparison=dict(result_id=member['comparison']['result_id'], evidence_id=member['comparison']['evidence_id']))
            for sid, member in facts['candidates'].items()] if visual else [ref for node in facts['summaries'] for ref in node['result']['overall']['references']]
        result = dict(overall=dict(verdict='UNCERTAIN', text=None, references=refs),
            conclusions=[dict(text='保留所选图像的标注比较依据', references=refs)], limitations=[])
        if visual:
            result['assessments'] = [dict(candidate_id=ref['candidate_id'], verdict='UNCERTAIN', categories=[],conclusion=None, explanation='原始标注的对应关系尚需核对', findings=[]) for ref in refs]
        return httpx.Response(200, json={'choices':[{'finish_reason':'stop', 'message':{'content':json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        comparisons = [runtime.consistency_service.compare(ConsistencyCompare(sample_a=config.dataset.id+':dent.png', sample_b=config.dataset.id+':'+name+'.png'))
            for name in ('scratch', 'third')]
        page = ResultQueries(db).query(ConsistencyQuery(selection={'kind':'scope', 'subjects':{'kind':'all_registered'}}))
        group = GalleryQueries(db).query(GalleryQuery(query_id=page.query_id, kind='groups')).items[0]
        analyses = GroupAnalyses(runtime, runtime.client)
        first_request = GroupAnalysisStart(query_id=page.query_id, kind='groups', group_id=group.group_id,
            request_id='first-execution', batch_size=1)
        first = analyses.start(first_request)
        runtime.jobs.wait(first.run_id, 5)
        assert analyses.read(first_request).status == 'COMPLETED'
        first_batches = runtime.jobs.status(first.run_id)['group_analysis_batches']
        if change == 'legacy_text':
            with db.connection() as connection:
                connection.execute("UPDATE job_runs SET payload_json=json_set(payload_json,'$.group_analysis_batches[0].result.conclusions[0].text',?) WHERE job_id=?",
                    ('part.png 的既有分析', first.run_id))
        with db.connection() as connection:
            original = connection.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (first.run_id,)).fetchone()[0]
        if change == 'review_context':
            comparison = next(item for item in comparisons if item.evidence_id != group.anchor.evidence_id)
            ConsistencyReview(db).submit(dict(client_request_id=uuid4(), evidence_id=comparison.evidence_id,
                result_id=comparison.result_id, difference_ids=[item.difference_id for item in comparison.annotation.differences],
                reviewer='复核人', action={'kind':'REJECT_DIFFERENCE'}, comment='已查看当前比较的图像与标注'))
        if change == 'model_profile':
            runtime.client.profile = runtime.client.profile.model_copy(update={'request_parameters':{'temperature':0.2}})
        second_request = first_request.model_copy(update={'request_id':'new-execution',
            **({'instruction':'用户重新指定的完整比较提示词'} if change == 'instruction' else {}),
            **({'batch_size':2} if change == 'batch_size' else {})})
        start = len(calls)
        second = analyses.start(second_request)
        runtime.jobs.wait(second.run_id, 5)
        view = analyses.read(second_request)
        assert view.status == 'COMPLETED', view.error
        assert view.run_id != first.run_id and len(view.result.assessments) == 2
        fresh_calls = calls[start:]
        expected_visual = {'none':0, 'instruction':2, 'model_profile':2, 'batch_size':1, 'review_context':1, 'legacy_text':1}[change]
        assert fresh_calls.count('GroupAnalysisDraft') == expected_visual, '仅复用同指纹、同配置且格式合格的视觉批次'
        assert fresh_calls.count('GroupAnalysisSummary') == (0 if change == 'batch_size' else 1), '新作业重新汇总实际采用的批次结果'
        batches = runtime.jobs.status(second.run_id)['group_analysis_batches']
        assert sum(batch['run_id'] == first.run_id for batch in batches) == (2-expected_visual if change != 'batch_size' else 0)
        if change == 'none':
            assert batches == first_batches
        with db.connection() as connection:
            assert connection.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (first.run_id,)).fetchone()[0] == original
    finally:
        runtime.close()


@pytest.mark.parametrize('mutation', ['visual', 'summary', 'summary_with_parent'])
def test_retry_revalidates_legacy_text_and_drops_summaries_of_changed_batch_results(dataset, tmp_path, mutation):
    db, registry, config = dataset
    for index in range(8):
        copyfile(tmp_path/'images/dent.png', tmp_path/f'images/candidate-{index}.png')
        copyfile(tmp_path/'labels/dent.json', tmp_path/f'labels/candidate-{index}.json')
    registry.rescan(config.dataset.id)
    calls, retrying = [], False

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count':1000, 'max_model_len':262144})
        body = json.loads(request.content)
        name = body['response_format']['json_schema']['name']
        calls.append(name)
        text = body['messages'][0]['content'][0]['text']
        visual = name == 'GroupAnalysisDraft'
        facts = json.JSONDecoder().raw_decode(text.split('冻结图组：' if visual else '冻结批次分析：', 1)[1])[0]
        if not visual and len(facts['summaries']) == 2 and not retrying and mutation != 'summary_with_parent':
            return httpx.Response(200, json={'choices':[{'message':{'content':'{}'}}]})
        refs = [dict(candidate_id=sid, comparison=dict(result_id=member['comparison']['result_id'], evidence_id=member['comparison']['evidence_id']))
            for sid, member in facts['candidates'].items()] if visual else [ref for node in facts['summaries'] for ref in node['result']['overall']['references']]
        verdict = ('MATERIAL' if retrying and mutation == 'visual' else 'UNCERTAIN') if visual else facts['expected_verdict']
        result = dict(overall=dict(verdict=verdict, text='类别不一致' if verdict=='MATERIAL' else None, references=refs),
            conclusions=[dict(text='基于当前批次保留差异和未知项', references=refs)], limitations=[])
        if visual:
            result['assessments'] = [dict(candidate_id=ref['candidate_id'], verdict=verdict, categories=['类别不一致'] if verdict=='MATERIAL' else [], conclusion='类别不一致' if verdict=='MATERIAL' else None, explanation='保留可见的标注对应依据', findings=[]) for ref in refs]
        return httpx.Response(200, json={'choices':[{'finish_reason':'stop', 'message':{'content':json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        for name in ['scratch', *[f'candidate-{index}' for index in range(8)]]:
            runtime.consistency_service.compare(ConsistencyCompare(sample_a=config.dataset.id+':dent.png', sample_b=config.dataset.id+':'+name+'.png'))
        page = ResultQueries(db).query(ConsistencyQuery(selection={'kind':'scope', 'subjects':{'kind':'all_registered'}}))
        group = GalleryQueries(db).query(GalleryQuery(query_id=page.query_id, kind='groups')).items[0]
        assert group.candidate_count == 9
        analyses = GroupAnalyses(runtime, runtime.client)
        request = GroupAnalysisStart(query_id=page.query_id, kind='groups', group_id=group.group_id,
            request_id='summary-dependency-retry', batch_size=1)
        first = analyses.start(request)
        runtime.jobs.wait(first.run_id, 10)
        failed = runtime.jobs.status(first.run_id)
        assert failed['status'] == ('COMPLETED' if mutation == 'summary_with_parent' else 'PARTIAL'), failed['errors']
        assert len(failed['group_analysis_batches']) == 9
        assert len(failed['group_summary_steps']) == (2 if mutation == 'summary_with_parent' else 1)
        field = '$.group_analysis_batches[0].result.conclusions[0].text' if mutation == 'visual' else '$.group_summary_steps[0].result.conclusions[0].text'
        with db.connection() as connection:
            if mutation == 'summary_with_parent':
                # Restore the persisted checkpoint immediately before the final anchor record.
                payload = json.loads(connection.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (first.run_id,)).fetchone()[0])
                payload.pop('group_analysis')
                payload['completed_sample_ids'].remove(group.anchor.sample.sample_id)
                connection.execute("UPDATE job_runs SET status='INTERRUPTED',payload_json=? WHERE job_id=?",
                    (json.dumps(payload), first.run_id))
            connection.execute('UPDATE job_runs SET payload_json=json_set(payload_json,?,?) WHERE job_id=?',
                (field, 'part.png 的既有分析', first.run_id))
            original = connection.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (first.run_id,)).fetchone()[0]
        boundary, retrying = len(calls), True
        resumed = analyses.retry(first.run_id)
        runtime.jobs.wait(resumed['run_id'], 10)
        view = analyses.read(request)
        assert view.status == 'COMPLETED', view.error
        assert calls[boundary:].count('GroupAnalysisDraft') == (1 if mutation == 'visual' else 0), '合格的视觉批次不能重做'
        assert calls[boundary:].count('GroupAnalysisSummary') == 2, '输入批次结果变化或正文不合格时，旧汇总不得直接复用'
        assert view.result.overall.verdict == ('MATERIAL' if mutation == 'visual' else 'UNCERTAIN')
        saved = runtime.jobs.status(resumed['run_id'])
        assert sum(batch['run_id'] == first.run_id for batch in saved['group_analysis_batches']) == (8 if mutation == 'visual' else 9)
        with db.connection() as connection:
            assert connection.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (first.run_id,)).fetchone()[0] == original
    finally:
        runtime.close()
