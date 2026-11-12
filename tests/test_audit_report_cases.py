from uuid import uuid4

import pytest

from iad_core.audit.evidence import AuditEvidence
from iad_core.audit.queries import AuditQueries
from iad_core.audit.reports import AuditReports
from tests.audit_support import master_observed, publish_batch, report_submission, save_image


def test_scope_gallery_contract_identifies_missing_versioned_references():
    from pydantic import ValidationError
    from iad_core.audit.report_models import AuditReportCommit
    scope=dict(source_status='NO_CANDIDATES',analysis='没有找到另一张对照图。',
        representatives=[dict(sample_id='original',reason='展示当前图像和标注。')],evidence_refs=[])
    with pytest.raises(ValidationError) as error:
        AuditReportCommit.model_validate(report_submission(consistency_scopes=[scope]))
    assert error.value.errors()[0]['loc']==('consistency_scopes',0)
    assert '每张精选原图' in str(error.value)
    scope['evidence_refs']=[dict(sample_id='original',result_revision=1,kind='image')]
    assert AuditReportCommit.model_validate(report_submission(consistency_scopes=[scope])).consistency_scopes[0].evidence_refs[0].result_revision==1


@pytest.mark.parametrize('submission_kind', ['valid', 'frozen', 'missing', 'unselected', 'duplicate', 'unobserved'])
def test_knowledge_chapter_preserves_selected_entries_and_uses_real_counts_and_originals(native_audit, submission_kind):
    from iad_core.analysis.jobs import AnalysisAgentJobs
    from iad_core.analysis.commits import AnalysisCommits
    from iad_core.analysis.evidence import AnalysisEvidence
    from iad_core.knowledge.instructions import default_directions
    from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd
    from iad_core.workbench.module_settings import ModuleSettings
    jobs, dataset_id, upstream, role = native_audit
    ModuleSettings(jobs.db).save(dict(module='knowledge', expected_revision=0,
        settings=dict(model=dict(provider_id='swift-30003', model_id='fixture'), batch_size=2)))
    mining = AnalysisAgentJobs(jobs.runtime)
    source = mining.start(dict(submission_id=str(uuid4()), analysis_kind='knowledge', dataset_ids=[dataset_id],
        mining_prompt=dict(objective='核对外缘。', instruction='根据原图比较外缘。', directions=[default_directions()[0].model_dump(mode='json')])), agent=role)['run_id']
    context = mining.context(source)
    evidence = AnalysisEvidence(mining)
    pages = [evidence.read(source, dict(sample_id=target.sample_id)) for target in context.round.targets]
    call_id = 'call_'+uuid4().hex
    calls = ModelCalls(jobs.db)
    calls.start_native(source, NativeModelCallStart(call_id=call_id, started_at='2026-11-11T12:00:00Z', request={}),
        sample_id=None, session_id=context.session_id, attempt=1)
    evidence.delivered(source, call_id, [image.image.evidence_id for page in pages for image in page.images])
    calls.finish_native(source, None, NativeModelCallEnd(call_id=call_id, finished_at='2026-11-11T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
    check = dict(check_id='K1', title='沿外缘比较连续性', subject='主体', location='外缘', criterion='沿可辨外缘检查连续性。',
        allowed_variations=['平顺转弯'], limitations=[], status='supported', dataset_ids=[dataset_id], direction_refs=['D1'],
        support_evidence_ids=[page.evidence_id for page in pages], counter_evidence_ids=[])
    AnalysisCommits(mining).accept(source, dict(commit_key='observed', base_revision=0, round_id=1,
        checks=[{key:value for key,value in check.items() if key not in ('support_evidence_ids','counter_evidence_ids')}],
        arguments=[dict(entry_id='K1', evidence_id=page.evidence_id, role='support', reason='外缘可见。') for page in pages],
        observations=[dict(sample_id=page.sample_id, dataset_id=dataset_id, description='外缘连续可辨。', evidence_ids=[page.evidence_id],
            directions=[dict(direction_ref='D1', status='applicable', reason='外缘可见。')]) for page in pages],
        summary='保留外缘检查。', limitations=[], unresolved_questions=[]))
    version = mining.cancel(source)['analysis_version_id']
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream,
        knowledge=dict(job_id=source, version_id=version, entry_ids=['K1'])), agent=role)['run_id']
    samples = jobs.samples(run_id)
    originals = [AuditEvidence(jobs).read(run_id, sample.sample_id, dict(sample_id=sample.sample_id)).evidence_id for sample in samples]
    for sample, image_id, status in zip(samples, originals, ['consistent', 'consistent', 'deviates', 'unobservable', 'not_applicable', 'not_applicable']):
        save_image(jobs, run_id, sample, check_assessments=[dict(check_id='K1', status=status, description='按本图可见外缘核对。', evidence_ids=[image_id])])
    publish_batch(jobs, run_id)
    reports = AuditReports(jobs.db)
    reports.begin(run_id)
    master_observed(jobs, run_id, reports.records(run_id, {}), originals[:3])
    analysis = dict(check_id='K1', description='比较外缘直线与转弯处的连续性。', applicability='外缘清楚时适用。',
        analysis='直线与平顺转弯可分开核对。', audit_impact='帮助定位需要复看的边缘变化。',
        evidence_refs=[dict(sample_id=sample.sample_id, result_revision=1, kind='image') for sample in samples[:3]],
        representatives=[dict(sample_id=sample.sample_id, reason='平顺转弯与相邻外缘。') for sample in samples[:3]])
    submission = report_submission(knowledge_analyses=[analysis])
    if submission_kind == 'missing': submission['knowledge_analyses'] = []
    elif submission_kind == 'unselected': analysis['check_id'] = 'unselected'
    elif submission_kind == 'duplicate': submission['knowledge_analyses'].append(analysis)
    elif submission_kind == 'unobserved':
        analysis['evidence_refs'][0]['sample_id'] = analysis['representatives'][0]['sample_id'] = samples[3].sample_id
    if submission_kind not in ('valid', 'frozen'):
        with pytest.raises(ValueError, match='知识|重复|实际观察'):
            reports.commit(run_id, submission)
        return
    reports.commit(run_id, submission)
    report = AuditQueries(jobs.db).report(run_id)
    item, = report.knowledge_entries
    assert item.entry.check.title == check['title']
    assert item.entry.check.criterion == check['criterion']
    assert item.analysis.description == analysis['description']
    assert report.statistics.knowledge_assessments['K1'] == dict(consistent=2, deviates=1, unobservable=1, not_applicable=2)
    assert report.statistics.upstream_issue_types == {}
    assert report.evidence_groups['knowledge:K1'][0].reason == '平顺转弯与相邻外缘。'
    assert report.evidence_groups['knowledge:K1'][0].image.is_whole_image
    sources = report.evidence_groups['knowledge-source:K1']
    assert {item.image.evidence_id for item in sources} == set(check['support_evidence_ids'])
    assert len(sources) == len(pages)
    assert all(item.image.is_whole_image and item.source.sample.sample_id == item.sample_id for item in sources)
    assert {item.source.sample.relative_path for item in sources} == {page.sample_id.split(':', 1)[1] for page in pages}
    assert jobs.finish(run_id)['status'] == 'COMPLETED'
    assert AuditQueries(jobs.db).report(run_id).knowledge_entries == report.knowledge_entries
    if submission_kind == 'frozen':
        import json
        with jobs.db.connection() as connection:
            frozen = json.loads(connection.execute('SELECT summary_json FROM audit_workflow_runs WHERE job_id=?', (run_id,)).fetchone()[0])
            del frozen['evidence_groups']['knowledge-source:K1']
            connection.execute('UPDATE audit_workflow_runs SET summary_json=? WHERE job_id=?', (json.dumps(frozen), run_id))
        assert 'knowledge-source:K1' not in AuditQueries(jobs.db).report(run_id).evidence_groups


def test_completed_report_keeps_its_frozen_artifact_without_reauditing(native_audit):
    import json
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    for sample in jobs.samples(run_id):
        save_image(jobs, run_id, sample)
    publish_batch(jobs, run_id)
    reports = AuditReports(jobs.db)
    reports.begin(run_id)
    reports.commit(run_id, report_submission())
    assert jobs.finish(run_id)['status'] == 'COMPLETED'
    before = [sample.model_dump_json() for sample in jobs.samples(run_id)]
    with jobs.db.connection() as connection:
        summary = connection.execute('SELECT summary_json FROM audit_workflow_runs WHERE job_id=?', (run_id,)).fetchone()[0]
        connection.execute('UPDATE audit_workflow_runs SET report_html=? WHERE job_id=?', ('<p>旧展示</p>', run_id))
        calls = connection.execute('SELECT count(*) FROM model_calls WHERE run_id=?', (run_id,)).fetchone()[0]
    reports.finalize(run_id)
    assert AuditQueries(jobs.db).export(run_id)['html'] == '<p>旧展示</p>'
    with jobs.db.connection() as connection:
        assert json.loads(connection.execute('SELECT summary_json FROM audit_workflow_runs WHERE job_id=?', (run_id,)).fetchone()[0]) == json.loads(summary)
        assert connection.execute('SELECT count(*) FROM model_calls WHERE run_id=?', (run_id,)).fetchone()[0] == calls
    assert [sample.model_dump_json() for sample in jobs.samples(run_id)] == before



@pytest.mark.parametrize('count', [1, 3])
def test_consistency_scope_selects_at_least_three_images_from_its_own_group(native_audit, count):
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    samples = jobs.samples(run_id)
    for sample in samples:
        save_image(jobs, run_id, sample)
    publish_batch(jobs, run_id)
    reports = AuditReports(jobs.db)
    reports.begin(run_id)
    originals = [AuditEvidence(jobs).read(run_id, sample.sample_id, dict(sample_id=sample.sample_id)).evidence_id for sample in samples[:count]]
    master_observed(jobs, run_id, reports.records(run_id, {}), originals)
    scope = dict(source_status='NO_CANDIDATES', analysis='这组没有找到可以比较标注的另一张图。',
        evidence_refs=[dict(sample_id=sample.sample_id, result_revision=1, kind='image') for sample in samples[:count]],
        representatives=[dict(sample_id=sample.sample_id, reason='查看这组图的可见内容和现有标注。') for sample in samples[:count]])
    if count<3:
        with pytest.raises(ValueError, match='3至8'):
            reports.commit(run_id, report_submission(consistency_scopes=[scope]))
        return
    reports.commit(run_id, report_submission(consistency_scopes=[scope]))
    gallery = AuditQueries(jobs.db).report(run_id).evidence_groups['scope:NO_CANDIDATES']
    assert [image.sample_id for image in gallery] == [sample.sample_id for sample in samples[:3]]


def test_report_cases_publish_observed_originals_without_repeating_the_discovery_gallery(native_audit):
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    samples = jobs.samples(run_id)
    for sample in samples:
        save_image(jobs, run_id, sample)
    refs = [dict(sample_id=sample.sample_id, result_revision=1, kind='image') for sample in samples[:3]]
    representatives = [dict(sample_id=sample.sample_id, reason=reason) for sample, reason in zip(samples, ['顶部边缘横向延伸。', '侧边轮廓弯曲。', '转角处的边缘走向。'])]
    discovery = dict(group_id='edge', kind='visual_pattern', dimension='visual_coverage', status='supported',
        title='边缘形态', description='内部记录保留86×16 vs 83×20。', visual_signature='可见边缘',
        annotation_relation='原始几何3.55×4.28。', scope='已观察图像', support_refs=refs, representatives=representatives)
    publish_batch(jobs, run_id, [discovery])
    reports = AuditReports(jobs.db)
    reports.begin(run_id)
    master_observed(jobs, run_id, reports.records(run_id, {}))
    before = [jobs.sample(run_id, sample.sample_id).result.model_dump_json() for sample in samples]
    case = dict(case_id='edge-comparison', title='不同方向的边缘', home_section='consistency',
        observation='一张图的边缘横向延伸，另一张沿侧边弯曲。', comparison='两处边缘的方向和转折形态不同。',
        significance='这些形态差异解释了原始标注的覆盖变化。', evidence_refs=refs, representatives=representatives)
    topic = dict(title='不同方向的连续定位', summary='边缘的延伸方向和弯曲程度有所变化。', capability_tags=['structural_relation'],
        points=[dict(title='转折处的连续定位', observation_and_comparison='横向边缘平直，侧边包含弯曲转折。',
            evaluation_value='可研究模型在转折处的定位连续性。', case_ids=['edge-comparison'])], missing_conditions=['需要经过确认的参考标注。'])
    submitted = report_submission(discovery_ids=['edge'], report_cases=[case], capability_topics=[topic],
        coverage_topics=[dict(title='边缘方向', analysis='观察到横向和弯曲边缘。', evidence_refs=refs,
            related_case_ids=['edge-comparison'])])
    assert reports.commit(run_id, submitted).state == 'COMPLETED'
    report = AuditQueries(jobs.db).report(run_id)
    assert report.report_cases[0].observation == case['observation']
    assert report.capability_topics[0].points[0].case_ids == ['edge-comparison']
    assert report.coverage_topics[0].related_case_ids == ['edge-comparison']
    gallery = report.evidence_groups['case:edge-comparison']
    assert [item.reason for item in gallery] == ['顶部边缘横向延伸。', '侧边轮廓弯曲。', '转角处的边缘走向。']
    assert all(item.image.is_whole_image and item.image.representation == 'raw' for item in gallery)
    assert 'edge' not in report.evidence_groups
    assert 'coverage:0' not in report.evidence_groups
    assert report.discoveries[0].description == discovery['description']
    assert [jobs.sample(run_id, sample.sample_id).result.model_dump_json() for sample in samples] == before
    assert jobs.finish(run_id)['status'] == 'COMPLETED'
    frozen = AuditQueries(jobs.db).report(run_id)
    assert frozen.report_cases == report.report_cases
    assert frozen.capability_topics == report.capability_topics
    assert frozen.evidence_groups == report.evidence_groups


@pytest.mark.parametrize(('defect', 'message'), [
    ('duplicate', '案例.*重复'), ('unknown_point', '案例'), ('unknown_coverage', '案例'),
    ('foreign', '冻结范围'), ('stale', '当前有效'), ('unrelated', '实际支持'),
    ('unobserved', '实际观察'), ('counter_only', '典型完整原图'),
])
def test_report_rejects_invalid_case_links_and_unobserved_or_obsolete_images(native_audit, defect, message):
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    samples = jobs.samples(run_id)
    for sample in samples:
        save_image(jobs, run_id, sample)
    publish_batch(jobs, run_id, review_requests=[dict(sample_id=samples[0].sample_id, result_revision=1,
        reason='两处轮廓的解释需要重新比较。', conflict_refs=[dict(sample_id=samples[1].sample_id, result_revision=1, kind='image')])]
        if defect == 'stale' else [])
    if defect == 'stale':
        save_image(jobs, run_id, samples[0], commit_key='second-final', analysis='重新核查主体边缘。')
        publish_batch(jobs, run_id)
    reports = AuditReports(jobs.db)
    reports.begin(run_id)
    originals = [AuditEvidence(jobs).read(run_id, sample.sample_id, dict(sample_id=sample.sample_id)).evidence_id for sample in samples[:2]]
    case = dict(case_id='edge', title='主体边缘', home_section='capability', observation='主体边缘可见。',
        significance='可研究边缘定位。', evidence_refs=[dict(sample_id=samples[0].sample_id, result_revision=1, kind='image')],
        representatives=[dict(sample_id=samples[0].sample_id, reason='主体边缘与背景相邻。')])
    submission = report_submission(report_cases=[case], capability_topics=[dict(title='边缘定位', summary='主体轮廓可辨。',
        points=[dict(title='边缘与背景区分', observation_and_comparison='轮廓旁的背景较均匀。',
            evaluation_value='可研究背景处的误报。', case_ids=['edge'])])])
    if defect == 'duplicate':
        submission['report_cases'].append(case)
    elif defect == 'unknown_point':
        submission['capability_topics'][0]['points'][0]['case_ids'] = ['absent']
    elif defect == 'unknown_coverage':
        submission['coverage_topics'] = [dict(title='轮廓', analysis='轮廓可见。', evidence_refs=case['evidence_refs'], related_case_ids=['absent'])]
    elif defect == 'foreign':
        case['evidence_refs'][0]['sample_id'] = 'foreign'
    elif defect == 'unrelated':
        case['representatives'][0]['sample_id'] = samples[1].sample_id
    elif defect == 'unobserved':
        case['representatives'][0]['sample_id'] = case['evidence_refs'][0]['sample_id'] = samples[2].sample_id
    elif defect == 'counter_only':
        case['representatives'][0]['role'] = 'counter'
    master_observed(jobs, run_id, reports.records(run_id, {}), originals)
    with pytest.raises(ValueError, match=message):
        reports.commit(run_id, submission)
    assert reports.session(run_id).state == 'RUNNING'
