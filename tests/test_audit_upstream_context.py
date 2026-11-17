from uuid import uuid4

import pytest

from iad_core.audit.master_models import AuditMasterRecord
from iad_core.consistency.agent_models import ReviewedResult


@pytest.mark.parametrize('reason', ['MODEL_REVIEWED', 'PROGRAM_REVIEWED'])
@pytest.mark.parametrize('verdict', ['MATERIAL', 'EQUIVALENT', 'UNCERTAIN'])
def test_reviewed_upstream_reaches_image_and_master_context(native_audit, reason, verdict):
    jobs, dataset, upstream, role = native_audit
    run = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset], consistency_job_id=upstream), agent=role)['run_id']
    sample = jobs.samples(run)[0]
    references = [dict(candidate_id='actual-candidate')]
    issues = [dict(issue_id='actual-issue', type='position_difference', main_annotation_ids=['actual-object'],
        description='同一对象的边界偏移。', supporting_assessment_ids=[1], evidence=[], limitations=[],
        review_suggestion='核对原始轮廓。')] if verdict == 'MATERIAL' else []
    result = ReviewedResult(reason=reason, fingerprint='a'*64, observation_ids={}, issues=issues,
        overall=dict(text='位置差异' if issues else '一致' if verdict == 'EQUIVALENT' else None,
            verdict=verdict, references=references),
        conclusions=[dict(text='原始标注核对结论。', references=references)],
        assessments=[dict(candidate_id='actual-candidate', verdict=verdict, explanation='两侧对象已核对。')])
    source = sample.consistency.model_copy(update={'result':result, 'reason':reason, 'verdict':verdict})
    with jobs.db.connection() as connection:
        connection.execute('UPDATE audit_sample_runs SET consistency_json=? WHERE job_id=? AND sample_id=?',
            (source.model_dump_json(exclude_computed_fields=True), run, sample.sample_id))
    child = jobs.context(run, sample.sample_id).consistency
    master = AuditMasterRecord.capture(jobs.sample(run, sample.sample_id)).consistency
    for context in (child, master):
        assert context.result.reason == reason
        assert context.result.verdict == verdict
        assert context.result.issues == result.issues
        assert set(context.result.model_dump()) == {'reason', 'verdict', 'issues'}
