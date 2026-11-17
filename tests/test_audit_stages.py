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
