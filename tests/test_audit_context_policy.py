import json
from uuid import uuid4

from iad_core.audit.batches import AuditBatches
from iad_core.audit.evidence import AuditEvidence
from iad_core.audit.reports import AuditReports
from iad_core.workbench.module_settings import ModuleSettings
from tests.audit_support import save_image, master_observed, report_submission
import pytest


def test_new_audits_freeze_on_demand_and_missing_historical_policy_is_not_rewritten(native_audit):
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    assert jobs.snapshot(run_id).context_policy == 'evidence-on-demand-v1'
    with jobs.db.connection() as connection:
        original = json.loads(connection.execute('SELECT snapshot_json FROM audit_workflow_runs WHERE job_id=?', (run_id,)).fetchone()[0])
        original.pop('context_policy')
        frozen = json.dumps(original, ensure_ascii=False)
        connection.execute('UPDATE audit_workflow_runs SET snapshot_json=? WHERE job_id=?', (frozen, run_id))
    assert jobs.snapshot(run_id).context_policy == 'legacy'
    assert AuditBatches(jobs).context(run_id)['items']
    with jobs.db.connection() as connection:
        assert connection.execute('SELECT snapshot_json FROM audit_workflow_runs WHERE job_id=?', (run_id,)).fetchone()[0] == frozen


def test_incremental_discoveries_keep_complete_evidence_without_repeating_it_in_context(native_audit):
    jobs, dataset_id, upstream, role = native_audit
    ModuleSettings(jobs.db).save(dict(module='audit', expected_revision=1, settings=dict(batch_size=2)))
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    batches, reports = AuditBatches(jobs), AuditReports(jobs.db)
    samples = jobs.samples(run_id)
    for sample in samples[:2]: save_image(jobs, run_id, sample)
    first = samples[0]
    page = AuditEvidence(jobs).read(run_id, first.sample_id, dict(sample_id=first.sample_id))
    master_observed(jobs, run_id, batches.context(run_id), [page.evidence_id])
    ref = dict(sample_id=first.sample_id, result_revision=1, kind='image', index=None)
    body = dict(group_id='edge', kind='visual_pattern', dimension='visual_coverage', status='pending', title='主体边缘',
        description='主体边缘可辨，不能由可见外观直接认定标注错误。', visual_signature='可辨的主体外缘',
        annotation_relation='沿原始标注核查', scope='冻结已审范围')
    submission = dict(commit_key='first', batch_number=1, base_revision=0, discoveries=[body],
        evidence_changes=[dict(group_id='edge', action='add', role='support', reference=ref, reason='完整主图可见主体外缘。')],
        representative_changes=[dict(group_id='edge', representatives=[dict(sample_id=first.sample_id, role='representative', reason='保留了主体与背景关系。')])])
    first_state = batches.publish(run_id, submission)
    assert first_state.discoveries[0].support_refs[0].model_dump() == ref
    assert batches.publish(run_id, submission) == first_state
    context = batches.context(run_id)
    assert 'support_refs' not in context['discoveries'][0]
    assert 'description' not in context['discoveries'][0]
    assert context['discoveries'][0]['support_image_count'] == 1
    for sample in samples[2:4]: save_image(jobs, run_id, sample)
    master_observed(jobs, run_id, batches.context(run_id))
    second_ref = dict(sample_id=samples[2].sample_id, result_revision=1, kind='image', index=None)
    changes = dict(commit_key='second', batch_number=2, base_revision=1, discoveries=[],
        evidence_changes=[dict(group_id='edge', action='add', role='support', reference=second_ref, reason='另一张完整主图也可辨主体外缘。')])
    invalid = {**changes, 'evidence_changes':[dict(group_id='absent', action='add', role='support', reference=second_ref, reason='不存在的发现。')]}
    with pytest.raises(ValueError, match='发现'): batches.publish(run_id, invalid)
    assert reports.session(run_id).revision == 1
    second_state = batches.publish(run_id, changes)
    assert second_state.discoveries[0].description == body['description']
    assert second_state.discoveries[0].affected_image_count == 2
    assert len(second_state.discoveries[0].representatives) == 1
    assert batches.publish(run_id, submission) == first_state
    with pytest.raises(ValueError, match='提交键'): batches.publish(run_id, {**changes, 'discoveries':[body]})
    detail = reports.discovery(run_id, dict(group_id='edge', page=1, page_size=1))
    assert detail['total'] == 2 and len(detail['items']) == 1
    assert detail['discovery']['description'] == body['description']
    for sample in samples[4:]: save_image(jobs, run_id, sample)
    master_observed(jobs, run_id, batches.context(run_id))
    revised = {**body, 'description':'主体边缘可辨，但需在相同标注组织下比较。'}
    final_delta = dict(commit_key='third', batch_number=3, base_revision=2, discoveries=[revised])
    with pytest.raises(ValueError, match='逐项复核'): batches.publish(run_id, final_delta)
    final_delta['evidence_changes'] = [dict(group_id='edge', action='keep', role='support', reference=item,
        reason='重新核查已有原图结果，仍支持限定后的主张。') for item in (ref, second_ref)]
    batches.publish(run_id, final_delta)
    assert batches.context(run_id)['items'] == []
    reports.begin(run_id)
    reports.commit(run_id, report_submission(discovery_ids=['edge']))
    assert reports.session(run_id).state == 'COMPLETED'


def test_child_selected_candidates_use_observed_whole_images_and_one_reasoned_list(native_audit):
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    sample = jobs.samples(run_id)[0]
    with pytest.raises(ValueError, match='候选|实发'):
        save_image(jobs, run_id, sample, selected_evidence=[dict(evidence_id='unobserved', reason='未经观察的候选。')])
    assert jobs.sample(run_id, sample.sample_id).state != 'COMPLETED'
    page = AuditEvidence(jobs).read(run_id, sample.sample_id, dict(sample_id=sample.sample_id))
    selected = [dict(evidence_id=page.evidence_id, reason='完整原图保留了边缘与背景的关系。')]
    saved = save_image(jobs, run_id, sample, selected_evidence=selected)
    assert [item.model_dump() for item in saved.selected_evidence] == selected
    assert 'key_evidence_ids' not in saved.model_dump()


def test_compaction_calls_are_recorded_without_marking_business_evidence_observed(native_audit, request):
    from iad_core.audit.operations import audit_agent_model_call_start, audit_agent_model_call_end
    from iad_core.workbench.runtime import workbench, close_workbenches
    jobs, dataset_id, upstream, role = native_audit
    jobs.runtime.close()
    jobs = type(jobs)(workbench(jobs.db.db_path))
    request.addfinalizer(close_workbenches)
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    sample = jobs.samples(run_id)[0]
    save_image(jobs, run_id, sample)
    reports = AuditReports(jobs.db)
    page = AuditEvidence(jobs).read(run_id, sample.sample_id, dict(sample_id=sample.sample_id))
    context = AuditBatches(jobs).context(run_id)
    for purpose in ('compaction', None):
        call_id = 'call_'+uuid4().hex
        request = dict(sessionId=reports.session(run_id).session_id,
            messages=[dict(role='user', content=[dict(type='text', text=json.dumps(context))])])
        if purpose: request['purpose'] = purpose
        audit_agent_model_call_start(dict(run_id=run_id, evidence_ids=[page.evidence_id],
            request=dict(call_id=call_id, started_at='2026-11-11T12:00:00Z', request=request)), jobs.db.db_path)
        audit_agent_model_call_end(dict(run_id=run_id, result=dict(call_id=call_id,
            finished_at='2026-11-11T12:00:01Z', elapsed_ms=1000, finish_reason='stop')), jobs.db.db_path)
        if purpose:
            assert reports.observed(run_id) == set()
            assert reports.read_versions(run_id) == set()
        else:
            assert reports.observed(run_id) == {page.evidence_id}
            assert (sample.sample_id, 1) in reports.read_versions(run_id)


def test_reread_defaults_to_whole_but_initial_delivery_still_contains_every_annotation_roi(native_audit, tmp_path):
    from PIL import Image
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    jobs, _, _, role = native_audit
    source = tmp_path/'annotated'
    source.mkdir()
    Image.new('RGB', (80, 60), '#cccccc').save(source/'part.png')
    (source/'part.json').write_text(json.dumps(dict(imagePath='part.png', imageWidth=80, imageHeight=60,
        shapes=[dict(label='part', shape_type='rectangle', points=[[10, 10], [35, 40]]),
                dict(label='part', shape_type='rectangle', points=[[40, 10], [65, 40]])])))
    dataset = DatasetRegistry(jobs.db).import_dataset(dict(format='labelme', name='完整标注输入', image_dir=str(source), annotation_dir=str(source)))
    checks = ConsistencyAgentJobs(jobs.runtime)
    upstream = checks.start(dict(submission_id=str(uuid4()), dataset_ids=[dataset.dataset.id], mode='exact'))
    for anchor in checks.anchors(upstream['run_id']):
        checks.session_created(upstream['run_id'], anchor.anchor_id)
        checks.retrieve(upstream['run_id'], anchor.anchor_id)
        checks.submit_empty(upstream['run_id'], anchor.anchor_id)
    jobs.jobs.finish_external(upstream['run_id'])
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset.dataset.id], consistency_job_id=upstream['run_id']), agent=role)['run_id']
    sample = jobs.samples(run_id)[0]
    evidence = AuditEvidence(jobs)
    whole = evidence.read(run_id, sample.sample_id, dict(sample_id=sample.sample_id))
    assert len(whole.images) == 1 and whole.images[0].image.is_whole_image
    initial = evidence.read(run_id, sample.sample_id, dict(sample_id=sample.sample_id, view='all'))
    assert len(initial.images) == initial.total == 3
    local = evidence.read(run_id, sample.sample_id, dict(sample_id=sample.sample_id, view='annotation_rois'))
    assert len(local.images) == 2 and all(not item.image.is_whole_image for item in local.images)
    assert local.evidence_id == whole.evidence_id
    with pytest.raises(ValueError, match='必需ROI'):
        save_image(jobs, run_id, sample, media_view='whole')
