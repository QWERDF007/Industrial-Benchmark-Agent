from uuid import uuid4

import pytest

from tests.audit_support import save_image


def test_normal_work_waits_for_defect_audit_and_master_profile(native_audit):
    from iad_core.audit.stages import AuditStages
    from iad_core.audit.stage_models import AuditStageSample
    from iad_core.storage.models import Annotation
    jobs, dataset, upstream, role = native_audit
    run = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset], consistency_job_id=upstream), agent=role)['run_id']
    snapshot, samples = jobs.snapshot(run), jobs.samples(run)
    record = snapshot.manifest.records[0]
    record.sample = record.sample.model_copy(update={'annotation_availability':
        record.sample.annotation_availability.model_copy(update={'status':'VALID_NONEMPTY'})})
    record.annotations = [Annotation(annotation_id='actual', sample_id=record.sample.sample_id,
        annotation_type='bbox', raw_label='划痕', bbox=[10, 10, 20, 20])]
    plan = AuditStages.resolve(snapshot, [AuditStageSample.capture(sample) for sample in samples], None)
    assert plan.phase == 'defects'
    assert plan.pending_sample_ids == [record.sample.sample_id]
    completed = save_image(jobs, run, samples[0])
    samples[0] = samples[0].model_copy(update={'state':'COMPLETED', 'result':completed, 'result_revision':1})
    assert AuditStages.resolve(snapshot, [AuditStageSample.capture(sample) for sample in samples], None).phase == 'defect_profile'
    samples[0] = samples[0].model_copy(update={'state':'FAILED'})
    assert AuditStages.resolve(snapshot, [AuditStageSample.capture(sample) for sample in samples], None).phase == 'blocked'


def test_hard_normal_requires_real_defect_comparison_before_rarity(native_audit):
    from iad_core.audit.quality_models import QualityObservation
    from iad_core.audit.stages import AuditStages
    from iad_core.audit.stage_models import AuditStageSample
    jobs, dataset, upstream, role = native_audit
    run = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset], consistency_job_id=upstream), agent=role)['run_id']
    sample = jobs.samples(run)[0]
    observation = QualityObservation(complete=True, normal=dict(hard=True, hard_type='暗线', confusable=True))
    with pytest.raises(ValueError, match='缺陷|困难良品'):
        AuditStages(jobs).validate_observation(run, sample.sample_id, observation, set())


@pytest.fixture
def mixed_audit(native_audit):
    import json
    from pathlib import Path
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from tests.consistency_support import start_prepared
    jobs, dataset, _, role = native_audit
    registry = DatasetRegistry(jobs.db)
    config = registry.get(dataset)
    (Path(config.annotations.root)/'part-0.json').write_text(json.dumps(dict(imageWidth=320, imageHeight=240,
        shapes=[dict(label='划痕', shape_type='rectangle', points=[[40, 60], [60, 80]])])))
    registry.rescan(dataset)
    checks = ConsistencyAgentJobs(jobs.runtime)
    upstream = start_prepared(checks, dict(submission_id=str(uuid4()), dataset_ids=[dataset], mode='exact'))['run_id']
    for anchor in checks.anchors(upstream):
        checks.session_created(upstream, anchor.anchor_id)
        checks.retrieve(upstream, anchor.anchor_id)
        checks.submit_empty(upstream, anchor.anchor_id)
    jobs.runtime.jobs.finish_external(upstream)
    run = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset], consistency_job_id=upstream), agent=role)['run_id']
    return jobs, run


def test_published_defect_profile_controls_normal_evidence_and_survives_reload(mixed_audit):
    from iad_core.audit.stages import AuditStages
    from iad_core.audit.stage_models import AuditStageSample
    from iad_core.audit.state import AuditState
    from iad_core.audit.reports import AuditReports
    from iad_core.audit.quality_models import QualityObservation
    from iad_core.audit.evidence import AuditEvidence
    from tests.audit_support import master_observed
    jobs, run = mixed_audit
    stages = AuditStages(jobs)
    phase = stages.status(run)
    assert phase.phase == 'defects' and len(phase.pending_sample_ids) == 1
    defect_id = phase.pending_sample_ids[0]
    normal = next(sample for sample in jobs.samples(run) if sample.sample_id != defect_id)
    with pytest.raises(ValueError, match='缺陷审计'):
        save_image(jobs, run, normal)
    record = next(record for record in jobs.snapshot(run).manifest.records if record.sample.sample_id == defect_id)
    save_image(jobs, run, jobs.sample(run, defect_id), quality_observation=dict(complete=True,
        defects=[dict(annotation_id=record.annotations[0].annotation_id, basis=['表面可见短细暗痕'],
            morphology='短线', appearance='暗线', size='small', location='center', contrast='low')]))
    assert stages.status(run).phase == 'defect_profile'
    with pytest.raises(ValueError, match='所有主图'):
        AuditReports(jobs.db).begin(run)
    AuditReports(jobs.db).begin(run, phase='defect_profile')
    context = stages.context(run)
    reference = dict(sample_id=defect_id, result_revision=1, kind='image')
    submission = dict(commit_key='profile', base_revision=0, features=[dict(feature_id='scratch', category='划痕',
        signature='表面短细暗线', normal_distinctions='接缝沿结构连续，划痕为局部中断线。', references=[reference])])
    with pytest.raises(ValueError, match='实际读取'):
        stages.publish(run, submission)
    image = AuditEvidence(jobs).prepare(run, defect_id, defect_id)
    master_observed(jobs, run, context, [image.evidence_id])
    profile = stages.publish(run, submission)
    assert stages.publish(run, submission) == profile
    assert AuditStages(AuditState(jobs.db)).status(run).phase == 'normals'
    assert jobs.context(run, normal.sample_id).defect_profile == profile
    observation = QualityObservation(complete=True, normal=dict(hard=True, hard_type='接缝暗线', profile_revision=1,
        qualification=dict(feature_id='scratch', reference=reference, similar_features=['短段均呈细暗线'],
            normal_reason='沿结构边缘连续，表面未见局部破损', difficulty_reason='孤立短段与浅划痕形态接近')))
    with pytest.raises(ValueError, match='实际观察'):
        stages.validate_observation(run, normal.sample_id, observation, set())
    stages.validate_observation(run, normal.sample_id, observation, {image.evidence_id})
    from iad_core.audit.stage_models import AuditDefectProfile
    stale = AuditDefectProfile(**{**profile.model_dump(), 'source_versions': {defect_id:2}})
    assert AuditStages.resolve(jobs.snapshot(run), [AuditStageSample.capture(sample) for sample in jobs.samples(run)], stale).phase == 'defect_profile'


def test_equivalent_profile_refresh_reuses_normals_and_semantic_change_merges_reviews(mixed_audit):
    from copy import deepcopy
    from iad_core.audit.stages import AuditStages
    from iad_core.audit.batches import AuditBatches
    from iad_core.audit.reports import AuditReports
    from iad_core.audit.evidence import AuditEvidence
    from iad_core.audit.delegation_models import AuditReviewRequest
    from tests.audit_support import master_observed, batch_submission

    jobs, run = mixed_audit
    stages, reports, batches = AuditStages(jobs), AuditReports(jobs.db), AuditBatches(jobs)
    defect = stages.status(run).pending_sample_ids[0]
    save_image(jobs, run, jobs.sample(run, defect))
    reports.begin(run, phase='defect_profile')
    master_observed(jobs, run, stages.context(run), [AuditEvidence(jobs).prepare(run, defect, defect).evidence_id])
    feature = dict(feature_id='scratch', category='划痕', signature='局部细暗线', normal_distinctions='接缝连续',
        references=[dict(sample_id=defect, result_revision=1, kind='image')])
    first = stages.publish(run, dict(commit_key='p1', base_revision=0, features=[feature]))
    assert first.semantic_revision == 1
    for sample in jobs.samples(run):
        if sample.sample_id != defect:
            save_image(jobs, run, sample)
    master_observed(jobs, run, batches.context(run))
    request = dict(sample_id=defect, result_revision=1, reason='复看缺陷', conflict_refs=feature['references'])
    batches.publish(run, batch_submission(jobs, run, review_requests=[request]))
    review = batches.rechecks(run)[0]
    jobs.session_created(run, defect, review_id=review.review_id)
    from iad_core.audit.commits import AuditCommits
    AuditCommits(jobs).accept(run, defect, dict(commit_key='defect-v2', final=jobs.sample(run, defect).result.model_dump()), review_id=review.review_id)
    context = stages.context(run)
    assert context['record_index']['unread'] == 1
    page = reports.records(run, dict(scope='defects'))
    assert [(item['sample_id'],item['result_revision']) for item in page['items']] == [(defect,2)]
    master_observed(jobs, run, page)
    feature2 = deepcopy(feature)
    feature2['references'][0]['result_revision'] = 2
    second = stages.publish(run, dict(commit_key='p2', base_revision=1, features=[feature2]))
    assert second.semantic_revision == first.semantic_revision
    assert batches.rechecks(run) == []
    assert stages.compatible(run, first.revision)

    master_observed(jobs, run, batches.context(run))
    request['result_revision'] = 2
    request['conflict_refs'] = feature2['references']
    batches.publish(run, batch_submission(jobs, run, review_requests=[request]))
    review = batches.rechecks(run)[0]
    jobs.session_created(run, defect, review_id=review.review_id)
    AuditCommits(jobs).accept(run, defect, dict(commit_key='defect-v3', final=jobs.sample(run, defect).result.model_dump()), review_id=review.review_id)
    master_observed(jobs, run, reports.records(run, dict(scope='defects')))
    feature3 = deepcopy(feature2)
    feature3['references'][0]['result_revision'] = 3
    feature3['normal_distinctions'] = '连续性不足以区分，还需对照局部破损'
    third = stages.publish(run, dict(commit_key='p3', base_revision=2, features=[feature3]))
    assert third.semantic_revision == 2
    normals = [sample for sample in jobs.samples(run) if sample.sample_id != defect]
    assert {item.sample_id for item in batches.rechecks(run)} == {sample.sample_id for sample in normals}
    assert not stages.compatible(run, first.revision)
    queued = batches.rechecks(run)[0]
    with jobs.db.connection() as connection:
        from iad_core.audit.rechecks import AuditRechecks
        AuditRechecks.enqueue(connection, run, AuditReviewRequest(sample_id=queued.sample_id,
            result_revision=queued.result_revision, reason='额外核对外观', conflict_refs=feature3['references']), queued.batch_number)
    assert len([item for item in batches.rechecks(run) if item.sample_id == queued.sample_id]) == 1
    jobs.session_created(run, queued.sample_id, review_id=queued.review_id)
    active = [item for item in batches.rechecks(run) if item.sample_id == queued.sample_id]
    assert len(active) == 1 and active[0].state == 'RUNNING'
    assert '额外核对外观' in active[0].reason
    with pytest.raises(ValueError, match='复核'):
        AuditCommits(jobs).accept(run, queued.sample_id, dict(commit_key='wrong-review', final=jobs.sample(run, queued.sample_id).result.model_dump()), review_id='wrong')
