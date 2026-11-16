from uuid import uuid4

import pytest

from tests.audit_support import save_image


def test_new_jobs_freeze_scoring_and_preview_tracks_effective_versions(native_audit):
    from iad_core.audit.quality_reports import AuditQualityReports
    from iad_core.workbench.module_settings import ModuleSettings
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    snapshot = jobs.snapshot(run_id)
    assert snapshot.quality_score_version == '1.3'
    ModuleSettings(jobs.db).save(dict(module='audit', expected_revision=1, settings={'quality_score_weights': {'consistency': 9}}))
    assert jobs.snapshot(run_id).settings.quality_score_weights.consistency == .8
    for sample in jobs.samples(run_id):
        save_image(jobs, run_id, sample)
    service = AuditQualityReports(jobs.db)
    preview = service.preview(run_id, {'redundancy_reviewed': False})
    assert preview.score.total is None
    assert preview.score.dimensions['consistency'].score == 100
    assert preview.assessment.preview_id
    assert service.finalize(run_id, preview.assessment) == preview.score
    changed = preview.assessment.model_copy(update={'redundancy_reviewed': True})
    with pytest.raises(ValueError, match='预览'):
        service.finalize(run_id, changed)


def test_consistency_score_uses_frozen_upstream_not_independent_audit_suspicions(native_audit):
    from iad_core.audit.quality_reports import AuditQualityReports
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    for sample in jobs.samples(run_id):
        assert sample.consistency.categories == []
        save_image(jobs, run_id, sample, findings=('independent',))
    preview = AuditQualityReports(jobs.db).preview(run_id, {'redundancy_reviewed': False})
    assert preview.score.dimensions['consistency'].score == 100
    assert all(item.count == 0 for item in preview.score.items if item.dimension == 'consistency')
    assert all(sample.result.state == 'suspect' and sample.result.findings for sample in jobs.samples(run_id))


def test_quality_observations_must_cover_real_original_annotations(dataset):
    from iad_core.audit.quality_reports import AuditQualityReports
    from iad_core.audit.quality_models import QualityObservation
    from iad_core.workbench.analysis_manifest import AnalysisManifests
    db, _, config = dataset
    manifest = AnalysisManifests(db).freeze([config.dataset.id])
    record = next(record for record in manifest.records if record.annotations)
    with pytest.raises(ValueError, match='原始标注'):
        AuditQualityReports.validate_observation(record, QualityObservation(complete=True, defects=[]))


def test_final_report_stores_program_score_and_legacy_preview_is_rejected(native_audit):
    from iad_core.audit.quality_reports import AuditQualityReports
    from iad_core.audit.queries import AuditQueries
    from iad_core.audit.reports import AuditReports
    from tests.audit_support import publish_batch, master_observed, report_submission
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    for sample in jobs.samples(run_id):
        save_image(jobs, run_id, sample, quality_observation=dict(complete=True,
            defects=[], normal=dict(hard=True, hard_type='结构边缘', confusable=False, texture=None)))
    publish_batch(jobs, run_id)
    reports = AuditReports(jobs.db)
    reports.begin(run_id)
    from iad_core.audit.evidence import AuditEvidence
    master_observed(jobs, run_id, reports.records(run_id, {}),
        [AuditEvidence(jobs).prepare(run_id, sample.sample_id, sample.sample_id).evidence_id for sample in jobs.samples(run_id)])
    preview = AuditQualityReports(jobs.db).preview(run_id, dict(redundancy_reviewed=True))
    assert preview.score.total is not None
    assert preview.score.dimensions['diversity'].score < 100
    reports.commit(run_id, report_submission(quality_assessment=preview.assessment.model_dump()))
    view = AuditQueries(jobs.db).report(run_id)
    assert view.quality_score == preview.score
    assert {item.sample_id for item in view.evidence_groups['score:D1']} == set(next(item for item in preview.score.items if item.code == 'D1').sample_ids[:4])
    assert view.evidence_groups['score:'+dataset_id+':D1'] == view.evidence_groups['score:D1']
    with jobs.db.connection() as connection:
        connection.execute("UPDATE audit_workflow_runs SET snapshot_json=json_remove(snapshot_json,'$.quality_score_version') WHERE job_id=?", (run_id,))
    assert jobs.snapshot(run_id).quality_score_version is None
    with pytest.raises(ValueError, match='历史'):
        AuditQualityReports(jobs.db).preview(run_id, dict(redundancy_reviewed=True))


def test_score_galleries_use_frozen_observations_without_master_image_reloads(native_audit):
    from iad_core.audit.evidence import AuditEvidence
    from iad_core.audit.quality_reports import AuditQualityReports
    from iad_core.audit.queries import AuditQueries
    from iad_core.audit.reports import AuditReports
    from tests.audit_support import publish_batch, master_observed, report_submission
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    samples = jobs.samples(run_id)
    for sample in samples:
        save_image(jobs, run_id, sample, quality_observation=dict(complete=True,
            defects=[], normal=dict(hard=True, hard_type='结构边缘', confusable=True, texture='正常纵纹')))
    publish_batch(jobs, run_id)
    reports = AuditReports(jobs.db)
    reports.begin(run_id)
    master_observed(jobs, run_id, reports.records(run_id, {}))
    assert reports.observed(run_id) == set()
    assert all(AuditEvidence(jobs).observed(run_id, sample.sample_id) for sample in samples)
    preview = AuditQualityReports(jobs.db).preview(run_id, dict(redundancy_reviewed=True))
    assert next(item for item in preview.score.items if item.code == 'D2').deduction == 0
    reports.commit(run_id, report_submission(quality_assessment=preview.assessment.model_dump()))
    view = AuditQueries(jobs.db).report(run_id)
    for code in ('D1', 'D2', 'D3', 'D4'):
        item = next(item for item in preview.score.items if item.code == code)
        gallery = view.evidence_groups['score:' + code]
        assert [image.sample_id for image in gallery] == item.sample_ids[:4]
        assert gallery == view.evidence_groups['score:' + dataset_id + ':' + code]
        assert all(image.image.is_whole_image and image.image.representation == 'raw' for image in gallery)
    assert all(not view.evidence_groups.get('score:' + item.code)
        for item in preview.score.items if not item.sample_ids)
    assert reports.observed(run_id) == set()


def test_recalculate_updates_completed_report_and_export_from_frozen_observations(native_audit):
    import json
    from iad_core.audit.quality_reports import AuditQualityReports
    from iad_core.audit.queries import AuditQueries
    from iad_core.audit.reports import AuditReports
    from iad_core.workbench.module_settings import ModuleSettings
    from tests.audit_support import publish_batch, master_observed, report_submission
    from iad_core.audit.evidence import AuditEvidence
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    service = AuditQualityReports(jobs.db)
    with pytest.raises(ValueError, match='已完成'):
        service.recalculate(run_id)
    for sample in jobs.samples(run_id):
        save_image(jobs, run_id, sample, quality_observation=dict(complete=True,
            defects=[], normal=dict(hard=True, hard_type='结构边缘', confusable=False, texture=None)))
    publish_batch(jobs, run_id)
    reports = AuditReports(jobs.db)
    reports.begin(run_id)
    master_observed(jobs, run_id, reports.records(run_id, {}),
        [AuditEvidence(jobs).prepare(run_id, sample.sample_id, sample.sample_id).evidence_id for sample in jobs.samples(run_id)])
    preview = service.preview(run_id, dict(redundancy_reviewed=True))
    reports.commit(run_id, report_submission(quality_assessment=preview.assessment.model_dump()))
    assert jobs.finish(run_id)['status'] == 'COMPLETED'
    originals = [sample.model_dump_json() for sample in jobs.samples(run_id)]
    original_report = AuditQueries(jobs.db).report(run_id)
    ModuleSettings(jobs.db).save(dict(module='audit', expected_revision=1, settings={'quality_score_weights': {'consistency': 9}}))
    with jobs.db.connection() as connection:
        connection.execute("UPDATE audit_workflow_runs SET snapshot_json=json_set(snapshot_json,'$.quality_score_version','1.1') WHERE job_id=?", (run_id,))
    with pytest.raises(ValueError, match='评分规则'):
        service.finalize(run_id, preview.assessment)
    score = service.recalculate(run_id)
    assert score.version == '1.3'
    assert score.weights == pytest.approx({'consistency': .8, 'diversity': .15, 'redundancy': .05})
    assert jobs.snapshot(run_id).quality_score_version == '1.3'
    assert reports.session(run_id).result.quality_score == score
    view = AuditQueries(jobs.db).report(run_id)
    assert view.quality_score == score
    assert view.export_ready
    assert view.conclusion == original_report.conclusion
    assert view.report_cases == original_report.report_cases
    assert view.evidence_groups.keys() == original_report.evidence_groups.keys()
    exported = AuditQueries(jobs.db).export(run_id)['html']
    payload = json.loads(exported.split('<script id="audit-report-data" type="application/json">')[1].split('</script>')[0])
    assert payload['report']['quality_score'] == score.model_dump(mode='json')
    assert [sample.model_dump_json() for sample in jobs.samples(run_id)] == originals
    assert service.recalculate(run_id) == score
