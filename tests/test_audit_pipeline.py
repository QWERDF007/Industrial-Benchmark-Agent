from uuid import uuid4

import pytest

from iad_core.audit.batches import AuditBatches
from iad_core.audit.reports import AuditReports
from iad_core.workbench.module_settings import ModuleSettings
from tests.audit_support import save_image, master_observed, report_submission


def test_observations_cross_batch_boundaries_without_master_review(native_audit):
    jobs, dataset, upstream, role = native_audit
    ModuleSettings(jobs.db).save(dict(module='audit', expected_revision=1, settings=dict(batch_size=2)))
    run = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset], consistency_job_id=upstream), agent=role)['run_id']
    batches = AuditBatches(jobs)
    batches.prepare(run)
    samples = jobs.samples(run)
    assert len(batches.list(run)) == 3
    assert all(batch.state == 'AUDITING' and batch.clues == [] for batch in batches.list(run))
    for sample in reversed(samples):
        save_image(jobs, run, sample)
    batches.settle(run)
    assert all(batch.state == 'COMPLETED' for batch in batches.list(run))
    assert AuditReports(jobs.db).session(run).revision == 0
    assert batches.context(run)['items'] == []
    assert batches.context(run)['record_index']['unread'] == 6
    assert batches.context(run)['batch'] is None


def test_report_draft_validates_changed_fields_and_keeps_saved_sections(native_audit):
    from iad_core.audit.report_drafts import AuditReportDrafts
    jobs, dataset, upstream, role = native_audit
    run = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset], consistency_job_id=upstream), agent=role)['run_id']
    for sample in jobs.samples(run):
        save_image(jobs, run, sample)
    AuditBatches(jobs).settle(run)
    reports = AuditReports(jobs.db)
    reports.begin(run)
    master_observed(jobs, run, reports.records(run, {}))
    drafts = AuditReportDrafts(jobs.db)
    first = drafts.save(run, dict(base_revision=0, fields={'conclusion':'可用于观察主体边缘。'}))
    assert first.revision == 1
    with pytest.raises(ValueError, match='实际图级记录'):
        drafts.save(run, dict(base_revision=1, fields={'capabilities':[
            dict(tag='tiny_defect', coverage_status='observed', reason='细痕', evidence_refs=[])]}))
    assert drafts.read(run) == first
    with pytest.raises(ValueError, match='版本'):
        drafts.save(run, dict(base_revision=0, fields={'conclusion':'过期正文'}))
    payload = report_submission()
    payload.pop('commit_key')
    payload.pop('conclusion')
    second = drafts.save(run, dict(base_revision=1, fields=payload))
    assert second.revision == 2
    assert second.fields['conclusion'] == '可用于观察主体边缘。'
    with pytest.raises(ValueError, match='版本'):
        drafts.finalize(run, dict(commit_key='final', draft_revision=1))
    result = drafts.finalize(run, dict(commit_key='final', draft_revision=2))
    assert result.state == 'COMPLETED'
    assert result.result.conclusion == first.fields['conclusion']
    assert drafts.finalize(run, dict(commit_key='final', draft_revision=2)) == result


def test_observation_notes_only_save_seen_images_and_survive_context_reload(native_audit):
    from iad_core.audit.observation_notes import AuditObservationNotes
    jobs, dataset, upstream, role = native_audit
    run = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset], consistency_job_id=upstream), agent=role)['run_id']
    sample = jobs.samples(run)[0]
    result = save_image(jobs, run, sample)
    notes = AuditObservationNotes(jobs.db)
    with pytest.raises(ValueError, match='实际观察'):
        notes.save(run, sample.session_id, dict(evidence_ids=['unseen'], facts=['未经观察']))
    note = dict(evidence_ids=result.evidence_ids, facts=['已看清主图外缘连续，背景较均匀。'])
    assert notes.save(run, sample.session_id, note) == dict(saved=True, ordinal=1)
    assert jobs.context(run, sample.sample_id).observation_notes[0].model_dump() == note
    assert len(AuditObservationNotes(jobs.db).read(run, sample.session_id)) == 1
    jobs.cancel(run)
    with pytest.raises(ValueError, match='停止'):
        notes.save(run, sample.session_id, note)


def test_master_context_only_delivers_unread_effective_versions(native_audit):
    from tests.audit_support import publish_batch
    jobs, dataset, upstream, role = native_audit
    run = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset], consistency_job_id=upstream), agent=role)['run_id']
    samples = jobs.samples(run)
    for sample in samples:
        save_image(jobs, run, sample)
    batches = AuditBatches(jobs)
    initial = batches.context(run)
    assert initial['items'] == []
    assert initial['record_index']['unread'] == 6
    master_observed(jobs, run, initial)
    assert batches.context(run)['items'] == []
    publish_batch(jobs, run, review_requests=[dict(sample_id=samples[0].sample_id, result_revision=1,
        reason='核对相同位置的判断分歧。', conflict_refs=[dict(sample_id=samples[1].sample_id, result_revision=1, kind='image')])])
    save_image(jobs, run, samples[0], commit_key='reviewed')
    updated = batches.context(run)
    assert [(item['sample_id'], item['result_revision']) for item in AuditReports(jobs.db).records(run, {})['items']] == [(samples[0].sample_id, 2)]
    master_observed(jobs, run, updated)
    assert batches.context(run)['items'] == []


def test_explicit_failed_image_submission_is_terminal_and_preserves_structured_reason(native_audit):
    from iad_core.audit.commits import AuditCommits
    jobs, dataset, upstream, role = native_audit
    run = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset], consistency_job_id=upstream), agent=role)['run_id']
    sample = jobs.samples(run)[0]
    jobs.session_created(run, sample.sample_id)
    final = dict(execution_status='failed', state=None, analysis='缺少区分结构亮边和实际破损的依据。',
        conclusion='', basis=[], evidence_ids=[], check_assessments=[], consistency_review=[], findings=[], limitations=['无法给出有依据的独立结论'])
    saved = AuditCommits(jobs).accept(run, sample.sample_id, dict(commit_key='failed-final', final=final))
    current = jobs.sample(run, sample.sample_id)
    assert current.state == 'FAILED'
    assert current.result == saved and saved.execution_status == 'failed'
    assert current.result.analysis == final['analysis']
    assert jobs.jobs.status(run)['failed'] == 1


def test_report_tool_reads_section_index_then_bounded_saved_content(native_audit):
    from iad_core.audit.report_drafts import AuditReportDrafts
    from iad_core.audit.tool_pages import AuditToolPages
    import json
    jobs, dataset, upstream, role = native_audit
    run = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset], consistency_job_id=upstream), agent=role)['run_id']
    for sample in jobs.samples(run):
        save_image(jobs, run, sample)
    AuditReports(jobs.db).begin(run)
    drafts = AuditReportDrafts(jobs.db)
    facts = ['视野未覆盖侧面。' * 100, '同一批次缺少独立样本。' * 100, '缺少其他光照条件。' * 100]
    drafts.save(run, dict(base_revision=0, fields={'limitations':facts,'conclusion':'限定于已观察范围。'}))
    index = AuditToolPages.draft(drafts, run, {})
    assert index['revision'] == 1 and index['fields']['limitations']['count'] == 3
    assert len(json.dumps(index)) < 500
    page = AuditToolPages.draft(drafts, run, dict(field='limitations', page_size=1, max_chars=4000))
    assert page['items'] == facts[:1] and page['next_cursor'] == 1
    following = AuditToolPages.draft(drafts, run, dict(field='limitations', cursor=page['next_cursor'], page_size=2))
    assert following['items'] == facts[1:] and following['next_cursor'] is None
    assert drafts.read(run).fields['limitations'] == facts
