import json

import httpx
import pytest

from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.consistency.identity import CandidateIdentity
from iad_core.workbench.vision import VlmClient
from tests.test_consistency_identity import similar_job, identity_response


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_gate_retains_actual_paired_media_and_all_required_regions(similar_job):
    runtime, _, run_id, anchor = similar_job
    delivered = set()

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        for window in context['windows']:
            assert window['region_pair_id']
            assert window['main_media_id'] != window['candidate_media_id']
            delivered.add(window['region_pair_id'])
        answer = identity_response(context, 'transformed_same_content', '实际成对内容相同。')
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state = ConsistencyAgentReview(runtime, client).verify(run_id, anchor)
    finally:
        client.close()

    assert state.completed
    for gate in state.gates:
        assert gate.source == 'vision'
        assert gate.required_region_pair_ids
        assert set(gate.required_region_pair_ids) <= delivered
        assert {check.region_pair_id for check in gate.region_checks} == set(gate.required_region_pair_ids)
        assert all(check.visual_relation == 'same' for check in gate.region_checks)
        media = {view.evidence_id for view in gate.media}
        assert all({check.main_media_id, check.candidate_media_id} <= media for check in gate.region_checks)
        assert all(pair.source_annotations for pair in gate.region_pairs)
        from iad_core.consistency.agent_results import ConsistencyAgentResults
        media = ConsistencyAgentResults(runtime.db).media(run_id, anchor, gate.region_checks[0].main_media_id)
        assert media['media_type']=='image/png'
        with pytest.raises(LookupError):
            ConsistencyAgentResults(runtime.db).media(run_id, anchor, 'unobserved-media')


def test_position_tolerance_uses_program_geometry_and_preserves_tiny_coverage():
    from iad_core.consistency.position import PositionComparison, PositionTolerancePolicy

    policy = PositionTolerancePolicy(policy_version='verified-fixture', absolute_boundary_px=3,
        relative_boundary_fraction=.05, min_coverage_consistency=.95)
    large = PositionComparison.measure([10,10,210,90], [12,10,212,90], policy=policy, uncertainty_px=0)
    tiny = PositionComparison.measure([10,10,13,13], [12,10,15,13], policy=policy, uncertainty_px=0)
    assert large.tolerance_result == 'within_tolerance'
    assert tiny.tolerance_result == 'outside_tolerance'
    assert large.edge_offsets_px == (2,0,2,0)
    assert tiny.main_overlap_fraction == pytest.approx(1/3)
    uncalibrated = PositionComparison.measure([10,10,210,90], [12,10,212,90],
        policy=PositionTolerancePolicy(), uncertainty_px=0)
    assert uncalibrated.tolerance_result == 'borderline'
    uncertain = PositionComparison.measure([10,10,210,90], [12,10,212,90],policy=policy,uncertainty_px=5)
    assert uncertain.tolerance_result=='borderline'


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
@pytest.mark.parametrize('field,value', [('required_region_pair_ids', []), ('region_checks', [])])
def test_gate_save_refuses_incomplete_region_coverage(similar_job, field, value):
    runtime, _, run_id, anchor = similar_job

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        return httpx.Response(200, json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(
            identity_response(context, 'transformed_same_content', '成对局部相同。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        identity = CandidateIdentity(runtime, client)
        gate = identity.verify(run_id, anchor).gates[0]
        with pytest.raises(ValueError, match='区域'):
            identity.commit(run_id, anchor, gate.model_copy(update={field:value}),
                expected_revision=gate.revision, request_id='incomplete')
    finally:
        client.close()


@pytest.mark.parametrize('local_relation,expected', [('content_different','rejected'),('transformed_same_content','eligible')])
@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_single_sided_regions_determine_eligibility_before_annotation_audit(similar_job, local_relation, expected):
    runtime, checks, run_id, anchor = similar_job

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        answer = identity_response(context, local_relation,
            '比较可靠对应位置的实际细节，不根据标注数量判断。')
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        review = ConsistencyAgentReview(runtime,client)
        state = review.verify(run_id,anchor)
        single = [gate for gate in state.gates if all({origin.side for origin in pair.source_annotations}=={'main'} for pair in gate.region_pairs)]
        assert single and all(gate.gate_status == expected for gate in single)
        assert all(pair.main_media and pair.candidate_media for gate in single for pair in gate.region_pairs)
        if expected=='rejected':
            result = review.finish_rules(run_id,anchor)
            assert result.result=='passed' and result.pass_reason=='no_valid_candidate'
            assert result.issues==[] and result.assessments==[]
    finally:
        client.close()


def test_missing_mapping_retains_unpaired_sources_without_fabricated_correspondence(similar_job):
    runtime, _, run_id, anchor = similar_job
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        assert context['scope']=='joint' and context['windows']==[]
        answer=identity_response(context,'unverified','没有可靠的对应关系。')
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(answer)}}]})
    client=VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state=ConsistencyAgentReview(runtime,client).verify(run_id,anchor)
        gates=[gate for gate in state.gates if gate.source=='vision']
        assert gates and all(gate.gate_status=='unverified' for gate in gates)
        assert any(pair.main_window is None or pair.candidate_window is None for gate in gates for pair in gate.region_pairs)
        assert all(not gate.region_checks for gate in gates)
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_visual_gate_dispute_invalidates_previous_audit_immediately(similar_job):
    runtime, _, run_id, anchor=similar_job
    dispute=False
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':32768})
        context=json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        if 'facts' not in context:
            answer=identity_response(context,'transformed_same_content','实际局部初次对应。')
        else:
            facts=context['facts'];answer={'observations':[{'candidate_id':identity,'description':'当前观察。',
                'media_ids':facts['required_image_ids'][identity],
                **({'gate_dispute':{'reason':'局部新发现无法解释的内容差异。','region_pair_ids':[]}} if dispute else {})}
                for identity in facts['candidates']]}
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(answer)}}]})
    client=VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        review=ConsistencyAgentReview(runtime,client);state=review.verify(run_id,anchor);candidate=state.eligible_ids[0]
        observed=review.observe(run_id,anchor,{'request_id':'before','fingerprint':state.fingerprint,
            'candidate_ids':[candidate],'question':'核对实际覆盖。'})
        review.assess(run_id,anchor,{'fingerprint':state.fingerprint,'observation_ids':[observed.observation_id],
            'assessment':{'candidate_id':candidate,'verdict':'UNCERTAIN','explanation':'覆盖尚不明确。'}})
        assert len(review.assessments(run_id,anchor))==1
        dispute=True
        review.observe(run_id,anchor,{'request_id':'disputed','fingerprint':state.fingerprint,
            'candidate_ids':[candidate],'question':'复查实际内容矛盾。'})
        assert review.assessments(run_id,anchor)==[]
        assert next(gate for gate in CandidateIdentity(runtime).read(run_id,anchor).gates if gate.candidate_id==candidate).execution_status=='pending'
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_position_coverage_is_required_for_new_reviews_but_not_historical_readers(similar_job):
    import io
    from iad_core.consistency.agent_results import ConsistencyAgentResults

    runtime, checks, run_id, anchor = similar_job

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count':1000,'max_model_len':32768})
        context=json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        answer=(identity_response(context,'transformed_same_content','实际成对内容相同。') if 'facts' not in context else
            {'observations':[{'candidate_id':identity,'description':'已观察真实缺陷覆盖。',
                'media_ids':context['facts']['required_image_ids'][identity]} for identity in context['facts']['candidates']]})
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(answer)}}]})

    client=VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        review=ConsistencyAgentReview(runtime,client)
        state=review.verify(run_id,anchor)
        observed=review.observe(run_id,anchor,{'request_id':'coverage','fingerprint':state.fingerprint,
            'candidate_ids':state.eligible_ids,'question':'核对当前对象的实际覆盖。'})
        records=[]
        for candidate in state.eligible_ids:
            decision={'candidate_id':candidate,'verdict':'UNCERTAIN','explanation':'其他对象尚未确认。'}
            if candidate.endswith(':scratch.png'):
                gate=next(gate for gate in state.gates if gate.candidate_id==candidate)
                main_box=next(origin.annotation_id for pair in gate.region_pairs for origin in pair.source_annotations if origin.side=='main')
                candidate_box=next(origin.annotation_id for pair in gate.region_pairs for origin in pair.source_annotations if origin.side=='candidate')
                decision.update(verdict='MATERIAL',explanation='记录同一对象的覆盖变化。',issues=[{
                    'type':'position_difference','main_annotation_ids':[main_box],'candidate_annotation_ids':[candidate_box],
                    'media_ids':next(item.media_ids for item in observed.result.observations if item.candidate_id==candidate),
                    'description':'局部缺陷的端部未被有效覆盖。','coverage_effect':'material_change',
                    'coverage_reason':'对应缺陷端部存在明确漏盖。'}])
                for effect in (None,'unchanged','unverified'):
                    invalid={**decision,'issues':[{**decision['issues'][0],'coverage_effect':effect}]}
                    with pytest.raises(ValueError,match='覆盖'):
                        review.assess(run_id,anchor,{'fingerprint':state.fingerprint,
                            'observation_ids':[observed.observation_id],'assessment':invalid})
                assert all(record.submission.assessment.candidate_id!=candidate for record in review.assessments(run_id,anchor))
            records.append(review.assess(run_id,anchor,{'fingerprint':state.fingerprint,
                'observation_ids':[observed.observation_id],'assessment':decision}).assessment_id)
        review.finalize(run_id,anchor,{'fingerprint':state.fingerprint,'assessment_ids':records})
        runtime.jobs.finish_external(run_id)
        # A persisted v5 fixture has its original fields; public readers must not re-audit it.
        with runtime.db.connection() as connection:
            payload=json.loads(connection.execute('SELECT payload_json FROM job_runs WHERE job_id=?',(run_id,)).fetchone()[0])
            payload['request']['consistency_check'].update(review_pipeline='identity-v5',prompt_version='consistency-unified-v5')
            connection.execute('UPDATE job_runs SET payload_json=? WHERE job_id=?',(json.dumps(payload),run_id))
            result=json.loads(connection.execute('SELECT result_json FROM consistency_anchor_runs WHERE job_id=?',(run_id,)).fetchone()[0])
            result['schema_version']='5.0'
            for assessment in result['assessments']:
                for issue in assessment['issues']:
                    for field in ('coverage_effect','coverage_reason','region_pair_ids'):issue.pop(field,None)
            original=json.dumps(result)
            connection.execute('UPDATE consistency_anchor_runs SET result_json=? WHERE job_id=?',(original,run_id))
        results=ConsistencyAgentResults(runtime.db)
        detail=results.detail(run_id,anchor)
        issue=next(issue for assessment in detail.result.assessments for issue in assessment.issues)
        assert issue.type=='position_difference' and issue.coverage_effect is None
        assert results.page(run_id).items[0].model_conclusion=='位置差异'
        exported=io.StringIO();results.export(run_id,exported)
        assert json.loads(exported.getvalue())['schema_version']=='5.0'
        with runtime.db.connection() as connection:
            assert connection.execute('SELECT result_json FROM consistency_anchor_runs WHERE job_id=?',(run_id,)).fetchone()[0]==original
    finally:
        client.close()


@pytest.mark.parametrize('overview_relation', ['transformed_same_content','content_different'])
@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_gate_sends_originals_annotations_and_every_roi_together_even_when_overview_differs(similar_job, overview_relation):
    import base64
    import io
    from PIL import Image
    import numpy as np

    runtime, _, run_id, anchor=similar_job
    generated=[]
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':2000,'max_model_len':32768})
        body=json.loads(request.content);parts=body['messages'][1]['content'];context=json.loads(parts[1]['text'])
        assert context['scope']=='joint'
        assert set(context['annotations'])=={'main','candidate'}
        assert context['annotations']['main'] and context['annotations']['main'][0]['raw_label']
        assert all(item['bbox'] and item['annotation_id'] for items in context['annotations'].values() for item in items)
        pictures=[Image.open(io.BytesIO(base64.b64decode(part['image_url']['url'].split(',',1)[1])))
            for part in parts if part['type']=='image_url']
        assert len(pictures)==2+2*len(context['windows'])
        assert context['windows'] and len(context['windows'])==len(context['required_region_pair_ids'])
        for index,window in enumerate(context['windows']):
            for side_index,side in enumerate(('main','candidate')):
                x1,y1,x2,y2=window[side+'_window']
                np.testing.assert_array_equal(np.asarray(pictures[2+index*2+side_index]),np.asarray(pictures[side_index])[y1:y2,x1:x2])
            assert window['source_annotations']
        answer=identity_response(context,'transformed_same_content','实际局部完整对应。')
        answer['overview']={**answer['windows'][0]}
        for key in ('window_index','region_pair_id','main_media_id','candidate_media_id'):answer['overview'].pop(key)
        answer['overview']['relation']=overview_relation
        generated.append(context)
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(answer)}}]})
    client=VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state=ConsistencyAgentReview(runtime,client).verify(run_id,anchor)
        assert state.completed and len(generated)==len(state.gates)
        assert all(len(gate.region_checks)==len(gate.required_region_pair_ids)>0 for gate in state.gates)
        assert all(gate.gate_status==('rejected' if overview_relation=='content_different' else 'eligible') for gate in state.gates)
        if overview_relation=='content_different':
            gate=state.gates[0]
            with pytest.raises(ValueError,match='局部'):
                CandidateIdentity(runtime).commit(run_id,anchor,gate.model_copy(update={'region_checks':[]}),
                    expected_revision=gate.revision,request_id='omit-rejected-regions')
    finally:
        client.close()
