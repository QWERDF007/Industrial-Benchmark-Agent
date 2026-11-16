from uuid import uuid4

import pytest

from tests.audit_support import save_image


def test_new_jobs_freeze_scoring_and_preview_tracks_effective_versions(native_audit):
    from iad_core.audit.quality_reports import AuditQualityReports
    from iad_core.workbench.module_settings import ModuleSettings
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    snapshot = jobs.snapshot(run_id)
    assert snapshot.quality_score_version == '1.1'
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
