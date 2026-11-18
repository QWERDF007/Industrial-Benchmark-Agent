from uuid import uuid4

import pytest

from iad_core.audit.quality_models import QualityImage, AuditScoreWeights
from iad_core.audit.quality_scoring import AuditQualityScorer
from iad_core.workbench.module_settings import ModuleSettings, AuditSettingsValues


def test_consistency_scope_uses_only_frozen_categories_and_full_hundred_points():
    settings = AuditSettingsValues(audit_scope='consistency')
    assert settings.audit_scope == 'consistency'
    assert AuditSettingsValues().audit_scope == 'full'
    score = AuditQualityScorer().score([
        QualityImage(sample_id='a', dataset_id='one', consistency_categories=['少类别']),
        QualityImage(sample_id='b', dataset_id='one', consistency_categories=['多标内容', '位置差异']),
    ], AuditScoreWeights(consistency=0, diversity=1, redundancy=0), scope=settings.audit_scope)
    assert score.status == 'complete'
    assert score.total == pytest.approx(35)
    assert score.weights == {'consistency': 1}
    assert set(score.dimensions) == {'consistency'}
    assert {item.dimension for item in score.items} == {'consistency'}
    assert not score.limitations
    assert score.observed_images == 0
    assert score.dataset_scores[0].total == score.total


def test_consistency_job_imports_upstream_without_independent_image_sessions(native_audit):
    from iad_core.audit.consistency_summary import ConsistencyAudit
    from iad_core.audit.queries import AuditQueries
    jobs, dataset_id, upstream_id, role = native_audit
    ModuleSettings(jobs.db).save(dict(module='audit', expected_revision=1,
        settings={'audit_scope': 'consistency'}))
    request = dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream_id)
    created = jobs.start(request, agent=role)
    run_id = created['run_id']
    assert jobs.snapshot(run_id).settings.audit_scope == 'consistency'
    assert jobs.samples(run_id) == []
    summary = ConsistencyAudit(jobs.db)
    prepared = summary.prepare(run_id)
    assert prepared['needs_analysis'] is False
    assert prepared['context']['problem_groups'] == []
    assert len(summary.records(run_id)) == 6
    summary.commit(run_id, None, jobs=jobs.jobs)
    finished = jobs.finish(run_id)
    assert finished['status'] == 'COMPLETED'
    report = AuditQueries(jobs.db).report(run_id)
    assert report.audit_scope == 'consistency'
    assert report.audited_samples == report.total_samples == 6
    assert report.statistics.normal_images == 6
    assert report.distribution == {'normal': 6, 'suspect': 0}
    assert '完成跨图比较' not in report.conclusion
    assert report.quality_score.total == 100
    assert report.quality_score.observed_images == 0
    assert not report.coverage_topics
    assert not report.evidence_pairs
    assert not report.report_session_id
    assert jobs.start(request, agent=role)['created'] is False


def test_consistency_scope_keeps_imported_samples_and_source_status_visible(native_audit):
    from iad_core.audit.queries import AuditQueries
    from iad_core.workbench.audit_result_models import AuditSampleQuery
    jobs, dataset_id, upstream_id, role = native_audit
    ModuleSettings(jobs.db).save(dict(module='audit', expected_revision=1, settings={'audit_scope': 'consistency'}))
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream_id), agent=role)['run_id']
    page = AuditQueries(jobs.db).samples(AuditSampleQuery(run_id=run_id))
    assert page.total == 6
    assert page.distribution == {'normal': 6, 'suspect': 0}
    assert all(item.audit_state == 'normal' for item in page.items)
    assert AuditQueries(jobs.db).samples(AuditSampleQuery(run_id=run_id, status='normal')).total == 6
    assert all(item.session_id is None and item.audit_scope == 'consistency' for item in page.items)
    detail = AuditQueries(jobs.db).sample(run_id, page.items[0].sample_id)
    assert detail.final is None
    assert detail.upstream_conclusion.summary.reason == 'NO_CANDIDATES'
    assert detail.consistency is None
    assert detail.registration is not None
    assert detail.registration == next(r for r in jobs.snapshot(run_id).manifest.records if r.sample.sample_id == page.items[0].sample_id)


@pytest.mark.parametrize('count', [2, 6, 10, 12])
def test_summary_uses_problem_records_only_and_preserves_actual_pairs(native_audit, tmp_path, count):
    import json
    from PIL import Image
    from iad_core.audit.consistency_summary import ConsistencyAudit
    from iad_core.audit.report_evidence import AuditReportEvidence
    from iad_core.audit.queries import AuditQueries
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from iad_core.consistency.agent_preparation import ConsistencyAgentPreparation
    from iad_core.consistency.agent_review import ConsistencyAgentReview
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.dataset.folder_preview import preview_folder_dataset
    from iad_core.task.config import FolderRule
    from tests.test_consistency_agent_preparation import wait_for_preparation
    jobs, _, _, role = native_audit
    root = tmp_path / 'scope-pairs'
    for index in range(count*2):
        folder = root / ('normal' if index % 2 == 0 else 'defect')
        folder.mkdir(parents=True, exist_ok=True)
        Image.new('RGB', (40, 40), (20*(index//2), 0, 255)).save(folder / f'{index//2}.png')
    rules = [FolderRule(path='normal', role='normal'), FolderRule(path='defect', role='anomaly')]
    preview = preview_folder_dataset(str(root), rules=rules)
    config = DatasetRegistry(jobs.db).import_dataset(dict(format='folder_classification', name='成对问题', root_dir=str(root),
        rules=[r.model_dump() for r in rules], preview_fingerprint=preview.preview_fingerprint))
    checks = ConsistencyAgentJobs(jobs.runtime)
    source = checks.start(dict(submission_id=str(uuid4()), dataset_ids=[config.dataset.id], mode='exact'))['run_id']
    wait_for_preparation(ConsistencyAgentPreparation(jobs.runtime), source)
    review = ConsistencyAgentReview(jobs.runtime)
    for anchor in checks.anchors(source):
        checks.session_created(source, anchor.anchor_id)
        checks.retrieve(source, anchor.anchor_id)
        review.verify(source, anchor.anchor_id)
        review.finish_rules(source, anchor.anchor_id)
    checks.finish(source)
    ModuleSettings(jobs.db).save(dict(module='audit', expected_revision=1, settings={'audit_scope': 'consistency'}))
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[config.dataset.id], consistency_job_id=source), agent=role)['run_id']
    summary = ConsistencyAudit(jobs.db)
    prepared = summary.prepare(run_id)
    assert prepared['needs_analysis'], [(r.summary.reason, r.summary.categories, r.result.model_dump()) for r in summary.records(run_id)]
    assert [g['issue_type'] for g in prepared['context']['problem_groups']] == ['image_label_mismatch']
    assert prepared['context']['problem_groups'][0]['priority'] == 0
    assert len(json.dumps(prepared['context'])) < 16000
    assert all(set(example) == {'description'} for group in prepared['context']['problem_groups'] for example in group['examples'])
    with pytest.raises(ValueError, match='覆盖'):
        summary.commit(run_id, dict(conclusion='差异', consistency_analysis='存在标签冲突', analyses=[]), jobs=jobs.jobs)
    summary.commit(run_id, dict(conclusion='相同内容被标为不同整图标签。', consistency_analysis='上游存在整图标签冲突。',
        analyses=[dict(issue_type='image_label_mismatch', analysis='同一内容在正常和异常目录间标签不一致。')]), jobs=jobs.jobs)
    pairs = AuditReportEvidence(jobs.db).groups(run_id)['consistency:image_label_mismatch']
    assert len(pairs) == min(count, 10)
    assert len({p.pair_id for p in pairs}) == len(pairs)
    assert all(p.main.sample_id != p.candidate.sample_id for p in pairs)
    assert all(p.source_job_id == source and p.issue_ids for p in pairs)
    for pair in pairs:
        assert AuditQueries(jobs.db).evidence(run_id, pair.main.sample_id, pair.candidate.image.evidence_id)['path']
    assert jobs.finish(run_id)['status'] == 'COMPLETED'
    report = AuditQueries(jobs.db).report(run_id)
    assert report.quality_score.total == 0
    assert report.quality_score.weights == {'consistency': 1}
    assert len(report.evidence_pairs['consistency:image_label_mismatch']) == min(count, 10)
    assert set(report.evidence_pairs) == {'consistency:image_label_mismatch'}
    html = AuditQueries(jobs.db).export(run_id)['html']
    assert 'data:image/png;base64,' in html
    payload = json.loads(html.split('id="audit-report-data" type="application/json">',1)[1].split('</script>',1)[0])
    assert len(payload['images']) == min(count,10)
    assert 'image_label_mismatch' in html
