from uuid import uuid4

import httpx
import json
import pytest

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.consistency.agent_results import ConsistencyAgentResults
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient
from tests.test_consistency_identity import similar_job, identity_response
from tests.consistency_responses import annotation_response


def test_task_and_complete_prompts_are_frozen_without_rewriting_user_text(dataset):
    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        request = {'dataset_ids': [config.dataset.id], 'mode': 'exact'}
        run_id = checks.start({**request, 'submission_id': str(uuid4())})['run_id']
        frozen = checks.snapshot(run_id)
        assert frozen.task_type == 'bbox_defect'
        assert frozen.review_pipeline == 'identity-v8'
        assert '候选' in frozen.system_prompt and '六类' in frozen.system_prompt
        assert '当前候选已通过' not in frozen.system_prompt
        assert 'OK/NG' not in frozen.system_prompt + frozen.instruction
        custom = {'system_prompt': '自定义系统原文\n保留完整内容。', 'instruction': '自定义用户原文。'}
        edited = checks.start({**request, **custom, 'submission_id': str(uuid4())})['run_id']
        saved = checks.snapshot(edited)
        assert saved.system_prompt == custom['system_prompt']
        assert saved.instruction == custom['instruction']
        assert 'system' not in saved.prompts and 'user' not in saved.prompts
    finally:
        runtime.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_recheck_invalidates_old_audit_and_replays_only_matching_requests(similar_job):
    runtime, checks, run_id, anchor = similar_job
    relation = 'transformed_same_content'
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        calls.append(context)
        if 'facts' not in context:
            answer = identity_response(context, relation, '按当前实际像素重新核对。')
        else:
            answer = annotation_response(context['facts'], '当前局部没有充分标注对应证据。', limitations=['局部无法确认。'])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        review = ConsistencyAgentReview(runtime, client)
        state = review.verify(run_id, anchor)
        candidate = state.eligible_ids[0]
        gate = next(item for item in state.gates if item.candidate_id == candidate)
        observed = review.observe(run_id, anchor, {'request_id': 'audit-before-recheck', 'fingerprint': state.fingerprint,
            'candidate_ids': state.eligible_ids, 'question': '核对当前登记实例。'})
        saved = review.assess(run_id, anchor, {'fingerprint': state.fingerprint,
            'observation_ids': [observed.observation_id], 'assessment': {'candidate_id': candidate,
                'verdict': 'UNCERTAIN', 'explanation': '局部对应无法确定。'}})
        review.assess(run_id, anchor, {'fingerprint': state.fingerprint,
            'observation_ids': [observed.observation_id], 'assessment': {'candidate_id': state.eligible_ids[1],
                'verdict': 'UNCERTAIN', 'explanation': '共享观察中的另一候选。'}})
        pending = review.recheck(run_id, anchor, candidate, expected_revision=gate.revision, request_id='recheck-1')
        assert pending.execution_status == 'pending'
        assert review.assessments(run_id, anchor) == []
        detail = ConsistencyAgentResults(runtime.db).detail(run_id, anchor)
        assert detail.requests == [] and detail.observations == []
        assert review.recheck(run_id, anchor, candidate, expected_revision=gate.revision, request_id='recheck-1') == pending
        with pytest.raises(ValueError, match='版本'):
            review.recheck(run_id, anchor, candidate, expected_revision=gate.revision, request_id='recheck-2')
        with pytest.raises(ValueError):
            review.finalize(run_id, anchor, {'fingerprint': state.fingerprint, 'assessment_ids': [saved.assessment_id]})
        before = len(calls)
        relation = 'content_different'
        updated = review.verify(run_id, anchor)
        assert len(calls) > before
        assert candidate not in updated.eligible_ids
        assert next(item for item in updated.gates if item.candidate_id == candidate).revision > pending.revision
        assert review.assessments(run_id, anchor) == []
        history = ConsistencyAgentResults(runtime.db).detail(run_id, anchor).candidate_records
        assert any(item.phase == 'audit' and item.record_id == saved.assessment_id for item in history)
        assert len([item for item in history if item.phase == 'gate' and item.candidate_id == candidate]) == 3
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_public_tools_require_actual_gate_observation_and_current_version(similar_job):
    from iad_core.consistency.workflow import ConsistencyWorkflow
    from iad_core.storage.models import sample_uuid

    runtime, checks, run_id, anchor = similar_job
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        calls.append(body)
        text = json.dumps(body, ensure_ascii=False)
        assert not any(term in text for term in (anchor, '.png', 'quality_status', 'image_path'))
        context = json.loads(body['messages'][-1]['content'][1]['text'])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            identity_response(context, 'content_different', '实际细节不一致。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        workflow = ConsistencyWorkflow(runtime, client)
        assert workflow.prepare(run_id, anchor)['completed'] is False
        context = workflow.context(run_id, anchor, {})
        assert context['phase'] == 'gate'
        assert context['anchor']['anchor_id'] == sample_uuid(anchor)
        with pytest.raises(ValueError):
            workflow.submit(run_id, anchor, {'request_id': 'early', 'fingerprint': context['fingerprint'], 'assessment_ids': []})
        for candidate in context['pending_candidate_ids']:
            version = context['gate_revisions'][candidate]
            submission = dict(phase='gate', request_id='commit-' + candidate, fingerprint=context['fingerprint'],
                candidate_id=candidate, expected_revision=version, observation_ids=['made-up'])
            with pytest.raises(ValueError, match='观察不存在'):
                workflow.assess(run_id, anchor, submission)
            observed = workflow.observe(run_id, anchor, dict(phase='gate', request_id='view-' + candidate,
                fingerprint=context['fingerprint'], candidate_ids=[candidate], gate_revisions={candidate:version}))
            assert workflow.context(run_id, anchor, {})['phase'] == 'gate'
            before = len(calls)
            assert workflow.observe(run_id, anchor, dict(phase='gate', request_id='view-' + candidate,
                fingerprint=context['fingerprint'], candidate_ids=[candidate], gate_revisions={candidate:version})) == observed
            assert len(calls) == before
            submission['observation_ids'] = [observed['observation_id']]
            with pytest.raises(ValueError, match='gate.*assessment'):
                workflow.assess(run_id, anchor, {**submission, 'assessment': {
                    'candidate_id': candidate, 'verdict': 'MATERIAL', 'explanation': '实际图像内容不同。'}})
            assert all(gate['candidate_id'] != candidate for gate in workflow.context(run_id, anchor, {})['gates'])
            receipt = workflow.assess(run_id, anchor, submission)
            assert workflow.assess(run_id, anchor, submission) == receipt
            with pytest.raises(ValueError, match='版本'):
                workflow.assess(run_id, anchor, dict(submission, request_id='stale-' + candidate))
        assert workflow.context(run_id, anchor, {})['phase'] == 'submit'
        submission = dict(request_id='final', fingerprint=context['fingerprint'], assessment_ids=[])
        result = workflow.submit(run_id, anchor, submission)
        assert workflow.submit(run_id, anchor, submission) == result
        assert result['candidate_stats']['rejected'] == len(context['pending_candidate_ids'])
        assert result['pass_reason'] == 'no_valid_candidate'
        assert result['task_type'] == 'bbox_defect'
    finally:
        client.close()


def test_gate_context_contains_only_opaque_image_identities(similar_job):
    from iad_core.consistency.workflow import ConsistencyWorkflow
    runtime, _, run_id, anchor = similar_job
    workflow = ConsistencyWorkflow(runtime)
    workflow.prepare(run_id, anchor)
    context = workflow.context(run_id, anchor, {})
    assert context['phase'] == 'gate'
    wire = json.dumps(context, ensure_ascii=False)
    assert not any(value in wire for value in (':dent.png', 'scratch.png', '"bbox"', '"annotations"', 'quality_status', 'min_similarity'))
    assert context['task_type'] == 'bbox_defect'
    assert context['pending_candidate_ids']
    assert all(':' not in identity for identity in context['candidate_ids'])


@pytest.mark.parametrize('confirmed_same_object', [False, True])
def test_missing_object_merges_only_with_observed_correspondence(dataset, confirmed_same_object):
    from PIL import Image

    database, registry, config = dataset
    from iad_core.storage.repositories import SampleRepository
    Image.new('RGB', (320, 240), 'blue').save(SampleRepository(database).get(config.dataset.id + ':normal.png').image_path)
    registry.rescan(config.dataset.id)
    runtime = WorkbenchRuntime(database)

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        facts = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])['facts']
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            annotation_response(facts, '主图对应的同一实际对象没有标注。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':normal.png'
        run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run_id, anchor)
        selected = checks.retrieve(run_id, anchor)
        review = ConsistencyAgentReview(runtime, client)
        candidates = [candidate.sample_id for candidate in selected.candidates]
        observed = review.observe(run_id, anchor, dict(request_id='both', fingerprint=selected.fingerprint,
            candidate_ids=candidates, question='观察两张候选对应的实际主图对象。'))
        records = []
        first_reference = None
        for candidate in candidates:
            evidence = runtime.consistency_service.evidence(observed.request.facts['candidates'][candidate]['comparison']['evidence_id'])
            ids = [evidence.sources.right.annotations.annotations[0].annotation_id]
            issue = dict(type='missing_annotation', main_annotation_ids=[], candidate_annotation_ids=ids,
                media_ids=next(finding.media_ids for finding in observed.result.observations if finding.candidate_id == candidate),
                description='主图缺少该对象的标注。')
            if confirmed_same_object and first_reference is not None:
                issue['same_main_object_as'] = [first_reference]
            record = review.assess(run_id, anchor, dict(fingerprint=selected.fingerprint, observation_ids=[observed.observation_id],
                assessment=dict(candidate_id=candidate, verdict='MATERIAL', explanation='已核对实际同一对象。', issues=[issue])))
            records.append(record.assessment_id)
            first_reference = dict(candidate_id=candidate, annotation_ids=ids)
        result = review.finalize(run_id, anchor, dict(fingerprint=selected.fingerprint, assessment_ids=records))
        assert len(result.issues) == (1 if confirmed_same_object else 2)
        assert sorted(identity for issue in result.issues for identity in issue.supporting_assessment_ids) == sorted(records)
        assert len([evidence for issue in result.issues for evidence in issue.evidence]) == 2
    finally:
        client.close()
        runtime.close()


def test_frozen_checks_using_previous_visual_inputs_remain_readable_but_cannot_resume(dataset):
    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':normal.png'
        run = checks.start({'submission_id':str(uuid4()),'dataset_ids':[config.dataset.id],'mode':'exact',
            'subjects':{'kind':'samples','sample_ids':[anchor]}})['run_id']
        checks.session_created(run, anchor)
        checks.retrieve(run, anchor)
        checks.interrupt(run)
        before = ConsistencyAgentResults(database).detail(run, anchor)
        with database.connection() as connection:
            payload = json.loads(connection.execute('SELECT payload_json FROM job_runs WHERE job_id=?',(run,)).fetchone()[0])
            payload['request']['consistency_check']['prompt_version'] = 'consistency-unified-v5'
            connection.execute('UPDATE job_runs SET payload_json=? WHERE job_id=?',(json.dumps(payload),run))
        assert ConsistencyAgentResults(database).detail(run, anchor) == before
        with pytest.raises(ValueError, match='历史一致性作业只读'):
            checks.resume(run)
    finally:
        runtime.close()


def test_historical_v4_results_reviews_and_export_stay_readable_and_cannot_resume(dataset):
    import io
    from iad_core.consistency.group_review import ConsistencyGroupReview

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':normal.png'
        run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run_id, anchor)
        checks.retrieve(run_id, anchor)
        checks.submit_empty(run_id, anchor)
        runtime.jobs.finish_external(run_id)
        # Arrange an immutable pre-v5 storage fixture, then exercise public readers only.
        with database.connection() as connection:
            row = connection.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (run_id,)).fetchone()
            payload = json.loads(row[0])
            frozen = payload['request']['consistency_check']
            frozen.update(review_pipeline='identity-v4', prompt_version='consistency-anchor-v8')
            frozen.pop('task_type')
            connection.execute('UPDATE job_runs SET payload_json=? WHERE job_id=?', (json.dumps(payload), run_id))
            raw = json.loads(connection.execute('SELECT result_json FROM consistency_anchor_runs WHERE job_id=?', (run_id,)).fetchone()[0])
            raw['schema_version'] = '4.0'
            raw.pop('task_type');raw.pop('candidate_record_ids')
            connection.execute('UPDATE consistency_anchor_runs SET result_json=? WHERE job_id=?', (json.dumps(raw), run_id))
        reviews = ConsistencyGroupReview(database)
        context = reviews.context(run_id, anchor)
        decision = reviews.submit(run_id, anchor, dict(client_request_id=str(uuid4()), result_fingerprint=context.result_fingerprint,
            reviewer='isolated-test', comment='历史复核记录', action={'kind':'NEEDS_CONTEXT'}))
        before = reviews.context(run_id, anchor)
        detail = ConsistencyAgentResults(database).detail(run_id, anchor)
        assert detail.result.schema_version == '4.0'
        assert detail.candidate_records == []
        with pytest.raises(ValueError, match='历史'):
            checks.resume(run_id)
        from iad_core.consistency.workflow import ConsistencyWorkflow
        with pytest.raises(ValueError, match='历史'):
            ConsistencyWorkflow(runtime).context(run_id, anchor, {})
        exported = io.StringIO()
        ConsistencyAgentResults(database).export(run_id, exported)
        record = json.loads(exported.getvalue())
        assert record['schema_version'] == '4.0'
        assert 'task_type' not in record and 'candidate_record_ids' not in record
        assert reviews.context(run_id, anchor) == before
        assert before.decisions == [decision]
        assert checks.anchor(run_id, anchor).result == detail.result
    finally:
        runtime.close()
