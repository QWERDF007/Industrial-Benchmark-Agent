from uuid import uuid4

import pytest

from iad_core.audit.commits import AuditCommits
from iad_core.audit.evidence import AuditEvidence
from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd


from tests.audit_support import save_image, master_observed, publish_batch, batch_submission, report_submission


def test_consistency_statistics_keep_program_matches_separate_from_visual_review(native_audit, tmp_path):
    import json
    import httpx
    from pathlib import Path
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from iad_core.consistency.agent_review import ConsistencyAgentReview
    from iad_core.workbench.vision import VlmClient
    from iad_core.audit.reports import AuditReports

    jobs, dataset_id, _, role = native_audit
    from iad_core.storage.repositories import SampleRepository
    samples = [SampleRepository(jobs.db).get(dataset_id+':part-'+str(index)+'.png') for index in range(3)]
    original = Path(samples[0].image_path).read_bytes()
    for index, sample in enumerate(samples):
        Path(sample.image_path).write_bytes(original)
        Path(tmp_path/'labels'/('part-'+str(index)+'.json')).write_text(json.dumps({
            'imageWidth':320, 'imageHeight':240, 'shapes':[{'shape_type':'rectangle', 'label':'edge',
                'points':[[40+index*15,60],[280-index*15,180]]}]}))
    DatasetRegistry(jobs.db).rescan(dataset_id)
    checks = ConsistencyAgentJobs(jobs.runtime)
    source = checks.start(dict(submission_id=str(uuid4()), dataset_ids=[dataset_id], mode='exact'))['run_id']

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count':1000, 'max_model_len':32768})
        facts = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])['facts']
        answer = {'reviews': {identity: {'verdict': 'EQUIVALENT', 'explanation': '对应边缘的主要覆盖相同。',
            'issues': [], 'limitations': [], 'disputed_regions': []} for identity in facts['candidates']}}
        return httpx.Response(200, json={'choices':[{'finish_reason':'stop', 'message':{'content':json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        review = ConsistencyAgentReview(jobs.runtime, client)
        for anchor in checks.anchors(source):
            checks.session_created(source, anchor.anchor_id)
            retrieved = checks.retrieve(source, anchor.anchor_id)
            if not retrieved.candidates:
                checks.submit_empty(source, anchor.anchor_id)
                continue
            state = review.verify(source, anchor.anchor_id)
            if state.eligible_ids:
                observed = review.observe(source, anchor.anchor_id, dict(request_id='coverage', fingerprint=state.fingerprint,
                    candidate_ids=state.eligible_ids, question='比较实际覆盖。'))
                for candidate in state.eligible_ids:
                    review.assess(source, anchor.anchor_id, dict(fingerprint=state.fingerprint, observation_ids=[observed.observation_id],
                        assessment=dict(candidate_id=candidate, verdict='EQUIVALENT', explanation='对应边缘的主要覆盖相同。')))
                review.finalize(source, anchor.anchor_id, dict(fingerprint=state.fingerprint,
                    assessment_ids=[record.assessment_id for record in review.assessments(source, anchor.anchor_id)]))
            else:
                review.finish_rules(source, anchor.anchor_id)
    finally:
        client.close()
    checks.finish(source)
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=source), agent=role)['run_id']
    stats = AuditReports(jobs.db).statistics(run_id)
    assert stats.program_issue_types == {'position_difference':3}
    assert stats.upstream_issue_types == {}
    assert stats.consistency_cross['MODEL_REVIEWED:EQUIVALENT'] == {'incomplete':3}
    save_image(jobs, run_id, jobs.samples(run_id)[0], ['own-image-issue'])
    stats = AuditReports(jobs.db).statistics(run_id)
    assert stats.issue_types['missing_annotation'].image_count == 1
    assert stats.program_issue_types == {'position_difference':3}
    assert stats.upstream_issue_types == {}
    for sample in jobs.samples(run_id)[1:]:
        save_image(jobs, run_id, sample)
    publish_batch(jobs, run_id)
    reports = AuditReports(jobs.db)
    reports.begin(run_id)
    chosen = jobs.samples(run_id)[:3]
    originals = [AuditEvidence(jobs).read(run_id, sample.sample_id, dict(sample_id=sample.sample_id)).evidence_id for sample in chosen]
    master_observed(jobs, run_id, reports.records(run_id, {}), originals)
    from iad_core.consistency.annotation_issues import ISSUE_TYPES_BY_FORMAT
    analyses = [dict(issue_type=kind, analysis='逐图核对了对应边缘的实际覆盖。', evidence_refs=[])
        for kind in ISSUE_TYPES_BY_FORMAT['labelme']]
    with pytest.raises(ValueError, match='程序或模型发现的差异类型'):
        reports.commit(run_id, report_submission())
    with pytest.raises(ValueError, match='差异分析.*完整原图'):
        reports.commit(run_id, report_submission(consistency_analyses=analyses))
    position = next(item for item in analyses if item['issue_type']=='position_difference')
    position.update(evidence_refs=[dict(sample_id=sample.sample_id, result_revision=1, kind='image') for sample in chosen],
        representatives=[dict(sample_id=sample.sample_id, reason='比较边缘的实际覆盖。') for sample in chosen])
    reports.commit(run_id, report_submission(consistency_analyses=analyses))
    from iad_core.audit.queries import AuditQueries
    report = AuditQueries(jobs.db).report(run_id)
    assert report.statistics.program_issue_types == {'position_difference':3}
    assert len(report.evidence_groups['consistency:position_difference']) == 3


def test_report_saves_job_specific_coverage_and_separate_consistency_analyses_with_whole_evidence(native_audit):
    from iad_core.audit.queries import AuditQueries
    from iad_core.audit.reports import AuditReports
    jobs, dataset_id, upstream, role = native_audit
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream), agent=role)['run_id']
    samples = jobs.samples(run_id)
    for sample in samples:
        save_image(jobs, run_id, sample)
    originals = [AuditEvidence(jobs).read(run_id, sample.sample_id, dict(sample_id=sample.sample_id)).evidence_id for sample in samples[:3]]
    publish_batch(jobs, run_id)
    reports = AuditReports(jobs.db)
    from iad_core.audit.batches import AuditBatches
    context = AuditBatches(jobs).context(run_id)
    assert set(context['applicable_issue_types']) == {
        'category_mismatch', 'position_difference', 'extra_annotation', 'missing_annotation', 'split', 'merge'}
    reports.begin(run_id)
    master_observed(jobs, run_id, reports.records(run_id, {}), originals)
    references = [dict(sample_id=sample.sample_id, result_revision=1, kind='image') for sample in samples[:3]]
    representative = dict(sample_id=samples[0].sample_id, role='representative', reason='转角邻接的完整范围。')
    representatives = [dict(representative,sample_id=sample.sample_id) for sample in samples[:3]]
    topics = [dict(title='转角邻接与低对比纹理', analysis='转角附近的纹理覆盖不能推广到未采集的背面。',
        evidence_refs=references, representatives=representatives)]
    analyses = [dict(issue_type=kind, analysis='本轮未保留该类疑点，不能据此认证全部标注正确。',
        evidence_refs=references, representatives=representatives if kind=='position_difference' else [])
        for kind in ('category_mismatch', 'position_difference', 'extra_annotation', 'missing_annotation', 'split', 'merge')]
    before = [jobs.sample(run_id, sample.sample_id).result.model_dump_json() for sample in samples]
    submitted = report_submission(coverage_topics=topics, consistency_analyses=analyses)
    with pytest.raises(ValueError, match='全部适用差异类型'):
        reports.commit(run_id, report_submission(coverage_topics=topics, consistency_analyses=analyses[:1]))
    with pytest.raises(ValueError, match='不适用：image_label_mismatch'):
        reports.commit(run_id, report_submission(consistency_analyses=[*analyses,
            dict(issue_type='image_label_mismatch', analysis='本数据使用矩形标注。', evidence_refs=[])]))
    with pytest.raises(ValueError, match='冻结范围'):
        reports.commit(run_id, report_submission(coverage_topics=[dict(topics[0], evidence_refs=[
            dict(sample_id='foreign', result_revision=1, kind='image')])], consistency_analyses=analyses))
    with pytest.raises(ValueError, match='实际支持'):
        reports.commit(run_id, report_submission(coverage_topics=[dict(topics[0], representatives=[
            dict(representative, sample_id=samples[3].sample_id)])], consistency_analyses=analyses))
    assert reports.session(run_id).state == 'RUNNING'
    assert reports.commit(run_id, submitted).state == 'COMPLETED'
    report = AuditQueries(jobs.db).report(run_id)
    assert report.coverage_topics[0].title == '转角邻接与低对比纹理'
    assert [entry.issue_type for entry in report.consistency_analyses] == [entry['issue_type'] for entry in analyses]
    assert report.statistics.suspect_images == 0
    assert report.statistics.issue_occurrences == 0
    assert report.evidence_groups['coverage:0'][0].image.evidence_id == originals[0]
    assert report.evidence_groups['consistency:position_difference'][0].image.evidence_id == originals[0]
    assert all(image.image.is_whole_image and image.image.representation=='raw'
        for images in report.evidence_groups.values() for image in images)
    assert [jobs.sample(run_id, sample.sample_id).result.model_dump_json() for sample in samples] == before


def test_observations_are_saved_without_turning_normal_images_into_findings(native_audit):
    from iad_core.audit.reports import AuditReports
    jobs, dataset_id, upstream, role = native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    sample=jobs.samples(run_id)[0]
    whole=AuditEvidence(jobs).read(run_id,sample.sample_id,dict(sample_id=sample.sample_id)).evidence_id
    observation=dict(description='普通亮线尚未形成与现有标注的具体矛盾。',evidence_ids=[whole],annotation_ids=[])
    saved=save_image(jobs,run_id,sample,observations=[observation])
    assert saved.state=='normal'
    assert not saved.findings
    assert saved.observations[0].description==observation['description']
    assert jobs.sample(run_id,sample.sample_id).result.observations==saved.observations
    stats=AuditReports(jobs.db).statistics(run_id)
    assert (stats.normal_images,stats.suspect_images,stats.issue_occurrences)==(1,0,0)
    assert (stats.observation_images,stats.observation_occurrences)==(1,1)
    assert AuditReports(jobs.db).records(run_id,{})['items'][0]['final']['observations'][0]==observation


def test_audit_references_whole_images_while_local_crops_are_still_observed(native_audit):
    jobs, dataset_id, upstream, role = native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    sample=jobs.samples(run_id)[0]
    page=AuditEvidence(jobs).read(run_id,sample.sample_id,dict(sample_id=sample.sample_id))
    local=AuditEvidence(jobs).crop(run_id,sample.sample_id,dict(sample_id=sample.sample_id,bbox=[0,0,5,5]))
    crop=local.images[0].image.evidence_id
    jobs.session_created(run_id,sample.sample_id)
    call=NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-10T12:00:00+08:00',request={'fixture':'supplemental crop'})
    calls=ModelCalls(jobs.db)
    calls.start_native(run_id,call,sample_id=sample.sample_id,session_id=sample.session_id,attempt=1)
    AuditEvidence(jobs).delivered(run_id,sample.sample_id,call.call_id,[crop])
    calls.finish_native(run_id,sample.sample_id,NativeModelCallEnd(call_id=call.call_id,finished_at='2026-11-10T12:00:01+08:00',elapsed_ms=1000,finish_reason='tool-calls'))
    with pytest.raises(ValueError,match='完整原图'):
        save_image(jobs,run_id,sample,observations=[dict(description='局部现象。',evidence_ids=[crop],annotation_ids=[])])
    saved=save_image(jobs,run_id,sample,observations=[dict(description='局部现象关联所属原图。',evidence_ids=[page.evidence_id],annotation_ids=[])])
    assert saved.evidence_ids==[page.evidence_id]
    assert {item.image.evidence_id for item in page.images}.issubset(AuditEvidence(jobs).observed(run_id,sample.sample_id))


def test_report_presentation_uses_originals_and_readable_references_without_mutating_finals(native_audit):
    from iad_core.audit.queries import AuditQueries
    from iad_core.audit.reports import AuditReports
    jobs,dataset_id,upstream,role=native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    samples=jobs.samples(run_id)
    final=save_image(jobs,run_id,samples[0],['F1'])
    for sample in samples[1:]:
        save_image(jobs,run_id,sample)
    discovery=dict(group_id='G1',kind='quality_issue',dimension='annotation_quality',status='supported',
        title='覆盖疑点',description='现有覆盖值得复核。',visual_signature='主体可见边缘',annotation_relation='局部覆盖不确定',scope='已审范围',
        support_refs=[dict(sample_id=samples[0].sample_id,result_revision=1,kind='finding',index=0)],
        counter_refs=[dict(sample_id=samples[1].sample_id,result_revision=1,kind='image')],representatives=[
            dict(sample_id=samples[0].sample_id,role='representative',reason='典型覆盖。'),
            dict(sample_id=samples[1].sample_id,role='counter',reason='相似形态，覆盖关系不同。')])
    publish_batch(jobs,run_id,[discovery])
    reports=AuditReports(jobs.db);reports.begin(run_id)
    reports.commit(run_id,report_submission(discovery_ids=['G1']))
    before=jobs.sample(run_id,samples[0].sample_id).result.model_dump_json()
    presentation=AuditQueries(jobs.db).report(run_id)
    assert 'records' not in presentation.model_dump(), '汇总报告不重复附带全部逐图终稿'
    assert AuditQueries(jobs.db).sample(run_id,samples[0].sample_id).final.conclusion==final.conclusion
    assert presentation.dataset_names[dataset_id] and presentation.dataset_names[dataset_id]!=dataset_id
    gallery=presentation.evidence_groups['G1']
    assert [item.role for item in gallery]==['representative','counter']
    assert all(item.image.is_whole_image and item.image.representation=='raw' for item in gallery)
    assert all(item.source.sample.sample_id==item.sample_id for item in gallery)
    assert [item.caption for item in gallery]==['典型证据 1','对照证据 1']
    assert jobs.sample(run_id,samples[0].sample_id).result.model_dump_json()==before


def test_short_annotation_references_are_readable_without_rewriting_original_ids(native_audit,tmp_path):
    import json
    from PIL import Image
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from iad_core.audit.queries import AuditQueries
    jobs,_,_,role=native_audit
    root=tmp_path/'short-references';root.mkdir()
    Image.new('RGB',(40,40),'blue').save(root/'part.png')
    (root/'part.json').write_text(json.dumps(dict(imageWidth=40,imageHeight=40,shapes=[
        dict(label=str(label),shape_type='rectangle',points=points) for label,points in [(13,[[1,1],[8,8]]),(15,[[10,10],[18,18]])]])))
    config=DatasetRegistry(jobs.db).import_dataset(dict(format='labelme',name='原始框引用',image_dir=str(root),annotation_dir=str(root)))
    checks=ConsistencyAgentJobs(jobs.runtime)
    upstream=checks.start(dict(submission_id=str(uuid4()),dataset_ids=[config.dataset.id],mode='exact'))['run_id']
    anchor=checks.anchors(upstream)[0]
    checks.session_created(upstream,anchor.anchor_id);checks.retrieve(upstream,anchor.anchor_id);checks.submit_empty(upstream,anchor.anchor_id);checks.finish(upstream)
    run=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[config.dataset.id],consistency_job_id=upstream),agent=role)['run_id']
    sample=jobs.samples(run)[0]
    original='ann_0框与ann_1框均覆盖对应可见内容。'
    save_image(jobs,run,sample,analysis=original)
    detail=AuditQueries(jobs.db).sample(run,sample.sample_id)
    assert detail.final.analysis=='标注 1框与标注 2框均覆盖对应可见内容。'
    assert jobs.sample(run,sample.sample_id).result.analysis==original
    assert detail.evidence[0].source.annotations[0].annotation_id.endswith(':ann_0')


def test_report_statistics_separate_images_occurrences_and_unfinished_scope(native_audit):
    from iad_core.audit.reports import AuditReports
    jobs, dataset_id, upstream, role = native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    samples=jobs.samples(run_id)
    for sample, findings in zip(samples,[['F1','F2','F3'],['F1','F2'],['F1','F2'],[]]):
        save_image(jobs,run_id,sample,findings)
    jobs.failure(run_id,samples[4].sample_id,'原图读取失败')
    stats=AuditReports(jobs.db).statistics(run_id)
    assert (stats.total_images,stats.completed_images,stats.normal_images,stats.suspect_images,stats.incomplete_images)==(6,4,1,3,2)
    assert stats.issue_occurrences==7
    assert stats.issue_types['missing_annotation'].image_count==3
    assert stats.issue_types['missing_annotation'].occurrences==7
    assert stats.completion_rate==pytest.approx(4/6)
    assert stats.suspect_rate_among_completed==.75
    assert stats.consistency_cross['NO_CANDIDATES']['suspect']==3
    assert stats.consistency_cross['NO_CANDIDATES']['incomplete']==2
    with pytest.raises(ValueError,match='处理'):
        AuditReports(jobs.db).begin(run_id)


def test_new_completed_final_rejects_insufficient_business_state_and_foreign_upstream_references(native_audit):
    from iad_core.audit.models import AuditFinal
    with pytest.raises(ValueError):
        AuditFinal.model_validate(dict(execution_status='completed',state='insufficient'))
    jobs, dataset_id, upstream, role = native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    first=jobs.samples(run_id)[0]
    accepted=save_image(jobs,run_id,first)
    assert accepted.execution_status=='completed'
    assert accepted.consistency_review==[]
    assert jobs.snapshot(run_id).schema_version==4


def test_report_requires_real_read_versions_and_discoveries_and_retry_preserves_image_finals(native_audit):
    from iad_core.audit.batches import AuditBatches
    from iad_core.audit.reports import AuditReports
    jobs,dataset_id,upstream,role=native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    samples=jobs.samples(run_id)
    save_image(jobs,run_id,samples[0],['F1','F2'])
    for sample in samples[1:]:
        jobs.failure(run_id,sample.sample_id,'本图输入失败')
    original=jobs.sample(run_id,samples[0].sample_id).model_dump_json()
    reports=AuditReports(jobs.db)
    discovery=dict(group_id='G1',kind='quality_issue',dimension='annotation_quality',status='supported',title='覆盖',
        description='有效覆盖疑点。',visual_signature='主体可见边缘',annotation_relation='覆盖不确定',scope='已审范围',
        support_refs=[dict(sample_id=samples[0].sample_id,result_revision=1,kind='finding',index=index) for index in (0,1)],
        representatives=[dict(sample_id=samples[0].sample_id,role='representative',reason='已观察的清楚实例。')])
    with pytest.raises(ValueError,match='不存在'):
        publish_batch(jobs,run_id,[{**discovery,'support_refs':[dict(sample_id=samples[0].sample_id,result_revision=1,kind='finding',index=2)]}])
    batches=AuditBatches(jobs)
    submission=batch_submission(jobs,run_id,[discovery],commit_key='batch')
    published=publish_batch(jobs,run_id,[discovery],commit_key='batch')
    assert batches.publish(run_id,submission)==published
    reports.begin(run_id)
    with pytest.raises(ValueError,match='真实全局发现'):
        reports.commit(run_id,report_submission(discovery_ids=['fake']))
    submission=report_submission(discovery_ids=['G1'],limitations=['其余图像执行失败。'])
    assert reports.commit(run_id,submission).state=='COMPLETED'
    assert reports.commit(run_id,submission).state=='COMPLETED'
    jobs.jobs.update(run_id,completion_pending=False)
    assert jobs.jobs.finish_external(run_id)['status']=='PARTIAL'
    jobs.resume(run_id)
    assert jobs.sample(run_id,samples[0].sample_id).model_dump_json()==original
    assert reports.session(run_id).state=='PENDING'
    assert reports.session(run_id).result is None
    assert reports.session(run_id).revision==1
    assert all(sample.state=='PENDING' for sample in jobs.samples(run_id)[1:])
    with pytest.raises(ValueError,match='处理'):
        reports.begin(run_id)


def test_incomplete_lineage_is_preserved_and_frozen_pixels_survive_original_changes(native_audit):
    from pathlib import Path
    from PIL import Image
    jobs, dataset_id, upstream, role=native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    first=jobs.samples(run_id)[0]
    jobs.session_created(run_id,first.sample_id)
    evidence=AuditEvidence(jobs)
    prepared=evidence.read(run_id,first.sample_id,{'sample_id':first.sample_id})
    record=jobs.context(run_id,first.sample_id).target
    filename=Path(record.sample.image_path);original=filename.read_bytes()
    try:
        Image.new('RGB',(record.sample.width,record.sample.height),'red').save(filename)
        assert evidence.read(run_id,first.sample_id,{'sample_id':first.sample_id})==prepared
        crop=evidence.crop(run_id,first.sample_id,{'sample_id':first.sample_id,'bbox':[0,0,5,5]})
        with Image.open(prepared.images[0].path) as saved, Image.open(crop.images[0].path) as local:
            assert saved.crop((0,0,5,5)).tobytes()==local.tobytes()
    finally:
        filename.write_bytes(original)
    partial=dict(execution_status='incomplete',state=None,analysis='原图准备完成，但审核仍有必要步骤。',conclusion='',basis=[],evidence_ids=[],
        check_assessments=[],consistency_review=[],findings=[],limitations=['必要审核未完成。'])
    AuditCommits(jobs).accept(run_id,first.sample_id,dict(commit_key='checkpoint',final=partial))
    jobs.failure(run_id,first.sample_id,'执行失败')
    assert jobs.sample(run_id,first.sample_id).result.analysis==partial['analysis']
    assert jobs.jobs.status(run_id)['completed']==0
    from iad_core.audit.reports import AuditReports
    assert AuditReports(jobs.db).statistics(run_id).normal_images==0


@pytest.mark.parametrize('assessment',['supported','unsupported','insufficient'])
def test_each_frozen_upstream_difference_gets_an_independent_quality_assessment(native_audit,tmp_path,assessment):
    from PIL import Image
    from iad_core.dataset.folder_preview import preview_folder_dataset
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.task.config import FolderRule
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from iad_core.consistency.agent_review import ConsistencyAgentReview
    from iad_core.audit.reports import AuditReports
    jobs, _, _, role=native_audit
    root=tmp_path/'classified'
    for name in ['main','candidate']:
        (root/name).mkdir(parents=True)
        Image.new('RGB',(40,40),'blue').save(root/name/'part.png')
    rules=[FolderRule(path='main',role='normal'),FolderRule(path='candidate',role='anomaly')]
    preview=preview_folder_dataset(str(root),rules=rules)
    config=DatasetRegistry(jobs.db).import_dataset(dict(format='folder_classification',name='标签核对',root_dir=str(root),
        rules=[rule.model_dump() for rule in rules],preview_fingerprint=preview.preview_fingerprint))
    checks=ConsistencyAgentJobs(jobs.runtime)
    upstream=checks.start(dict(submission_id=str(uuid4()),dataset_ids=[config.dataset.id],mode='exact'))['run_id']
    review=ConsistencyAgentReview(jobs.runtime)
    for anchor in checks.anchors(upstream):
        checks.session_created(upstream,anchor.anchor_id)
        checks.retrieve(upstream,anchor.anchor_id)
        review.verify(upstream,anchor.anchor_id)
        review.finish_rules(upstream,anchor.anchor_id)
    checks.finish(upstream)
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[config.dataset.id],consistency_job_id=upstream),agent=role)['run_id']
    first=jobs.samples(run_id)[0]
    context=jobs.context(run_id,first.sample_id)
    assert context.consistency.gates
    from iad_core.audit.batches import AuditBatches
    assert AuditBatches(jobs).context(run_id)['applicable_issue_types'] == ['image_label_mismatch']
    assert len(context.consistency.result.issues)==1
    issue_id=context.consistency.result.issues[0].issue_id
    with pytest.raises(ValueError,match='上游差异'):
        save_image(jobs,run_id,first)
    page=AuditEvidence(jobs).read(run_id,first.sample_id,dict(sample_id=first.sample_id))
    reviews=[dict(source_issue_id=issue_id,assessment=assessment,reason='基于主图实际可见状态核对，不以候选多数作为真值。',evidence_ids=[page.evidence_id])]
    final=save_image(jobs,run_id,first,['F1'] if assessment=='supported' else [],reviews=reviews,
        source_refs=[issue_id] if assessment=='supported' else [])
    assert final.consistency_review[0].assessment==assessment
    assert final.state==('suspect' if assessment=='supported' else 'normal')
    stats=AuditReports(jobs.db).statistics(run_id)
    assert stats.consistency_assessments=={assessment:1}
    assert stats.consistency_cross['MODEL_REVIEWED:MATERIAL'][final.state]==1
    assert stats.upstream_issue_types['image_label_mismatch'].image_count == 2
    assert stats.upstream_issue_types['image_label_mismatch'].occurrences == 2
    assert stats.program_issue_types == {'image_label_mismatch':2}
    for sample in jobs.samples(run_id)[1:]:
        jobs.failure(run_id, sample.sample_id, '本测试仅完成一张图像。')
    publish_batch(jobs, run_id)
    reports=AuditReports(jobs.db)
    reports.begin(run_id)
    analysis=dict(issue_type='image_label_mismatch',analysis='按本轮实际图像标签和独立观察核对，未完成部分不作结论。',
        evidence_refs=[dict(sample_id=first.sample_id,result_revision=1,kind='image')],
        representatives=[dict(sample_id=first.sample_id,reason='核对同内容图像的整图标签。')])
    master_observed(jobs, run_id, reports.records(run_id, {}), [page.evidence_id])
    with pytest.raises(ValueError,match='全部适用差异类型'):
        reports.commit(run_id,report_submission(consistency_analyses=[dict(analysis,issue_type='missing_annotation')]))
    result=reports.commit(run_id,report_submission(consistency_analyses=[analysis]))
    assert [item.issue_type for item in result.result.consistency_analyses]==['image_label_mismatch']


def test_creation_catalog_excludes_partial_scope_and_rejects_stale_source(native_audit):
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from iad_core.workbench.audit_sources import AuditSources
    jobs,dataset_id,upstream,role=native_audit
    checks=ConsistencyAgentJobs(jobs.runtime)
    first=checks.snapshot(upstream).scopes.subjects.samples[0].sample_id
    small=checks.start(dict(submission_id=str(uuid4()),dataset_ids=[dataset_id],mode='exact',subjects={'kind':'samples','sample_ids':[first]}))['run_id']
    checks.session_created(small,first);checks.retrieve(small,first);checks.submit_empty(small,first);checks.finish(small)
    catalog=AuditSources(jobs.db).catalog([dataset_id])
    assert upstream in {source.job_id for source in catalog.consistency_jobs}
    assert small not in {source.job_id for source in catalog.consistency_jobs}
    from iad_core.storage.repositories import SampleRepository
    sample=SampleRepository(jobs.db).get(first)
    from pathlib import Path
    from PIL import Image
    from iad_core.dataset.registry import DatasetRegistry
    filename=Path(sample.image_path)
    original=filename.read_bytes()
    try:
        Image.new('RGB',(sample.width,sample.height),'red').save(filename)
        DatasetRegistry(jobs.db).rescan(dataset_id)
        with pytest.raises(ValueError,match='版本'):
            jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)
    finally:
        filename.write_bytes(original)
        DatasetRegistry(jobs.db).rescan(dataset_id)


@pytest.mark.parametrize('ids',[[],['real-box']])
def test_position_findings_require_object_references_and_do_not_duplicate_same_object(ids):
    from iad_core.audit.models import AuditFinal
    finding=dict(finding_id='F1',type='position_difference',description='有效覆盖需复核。',location='主体',annotation_ids=ids,
        consistency_issue_refs=[],check_ids=[],evidence_ids=['whole'],normal_explanation='排除成像差异。',limitations=[])
    final=dict(execution_status='completed',state='suspect',analysis='核对实际覆盖。',conclusion='需要复核。',basis=[],evidence_ids=['whole'],
        check_assessments=[],consistency_review=[],findings=[finding,{**finding,'finding_id':'F2'}] if ids else [finding],limitations=[])
    with pytest.raises(ValueError,match='标注对象|位置差异'):
        AuditFinal.model_validate(final)


def test_report_publication_failure_keeps_job_partial_and_can_retry_without_reauditing(native_audit):
    import json
    from pathlib import Path
    from iad_core.audit.reports import AuditReports
    from iad_core.audit.queries import AuditQueries
    jobs,dataset_id,upstream,role=native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    samples=jobs.samples(run_id)
    for index,sample in enumerate(samples):
        save_image(jobs,run_id,sample,['F1'] if index==0 else [])
    discovery=dict(group_id='G',kind='quality_issue',dimension='annotation_quality',status='supported',title='标注遗漏',
        description='需人工复核。',visual_signature='主体可见边缘',annotation_relation='覆盖不确定',scope='已审范围',
        support_refs=[dict(sample_id=samples[0].sample_id,result_revision=1,kind='finding',index=0)],
        representatives=[dict(sample_id=samples[0].sample_id,role='representative',reason='代表性原图。')])
    publish_batch(jobs,run_id,[discovery])
    reports=AuditReports(jobs.db);reports.begin(run_id)
    reports.commit(run_id,report_submission(discovery_ids=['G']))
    media=AuditEvidence(jobs).read(run_id,samples[0].sample_id,dict(sample_id=samples[0].sample_id))
    filename=Path(media.images[0].path);original=filename.read_bytes();before=[sample.model_dump_json() for sample in jobs.samples(run_id)]
    try:
        filename.unlink()
        failed=jobs.finish(run_id)
        assert failed['status']=='PARTIAL' and failed['completed']==6
        assert failed['execution_error']['type']=='AuditReportOutputError'
        assert AuditQueries(jobs.db).report(run_id).export_ready is False
    finally:
        filename.write_bytes(original)
    jobs.resume(run_id)
    complete=jobs.finish(run_id)
    assert complete['status']=='COMPLETED'
    report=AuditQueries(jobs.db).report(run_id)
    assert report.export_ready is True
    assert report.finished_at==complete['finished_at']
    assert report.status=='COMPLETED'
    assert [sample.model_dump_json() for sample in jobs.samples(run_id)]==before


def test_audit_freezes_completed_consistency_retry_history_without_serializing_derived_fields(native_audit):
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    jobs, dataset_id, _, role = native_audit
    checks = ConsistencyAgentJobs(jobs.runtime)
    upstream = checks.start(dict(submission_id=str(uuid4()),dataset_ids=[dataset_id],mode='exact'))['run_id']
    anchors = checks.anchors(upstream)
    for index, anchor in enumerate(anchors):
        checks.session_created(upstream,anchor.anchor_id)
        checks.retrieve(upstream,anchor.anchor_id)
        if index == 0:
            checks.fail(upstream,anchor.anchor_id,'视觉服务临时不可用')
        else:
            checks.submit_empty(upstream,anchor.anchor_id)
    assert checks.finish(upstream)['status'] == 'PARTIAL'
    checks.resume(upstream)
    checks.retrieve(upstream,anchors[0].anchor_id)
    checks.submit_empty(upstream,anchors[0].anchor_id,attempt=2)
    assert checks.finish(upstream)['status'] == 'COMPLETED'
    run = jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    samples = jobs.samples(run)
    assert len(samples) == 6
    assert samples[0].consistency.error_history[0].message == '视觉服务临时不可用'
    assert jobs.context(run,samples[0].sample_id).consistency.result.reason == 'NO_CANDIDATES'
    from iad_core.audit.batches import AuditBatches
    from iad_core.audit.reports import AuditReports
    records=AuditBatches(jobs).context(run)['items']
    assert records==AuditReports(jobs.db).records(run,dict(page_size=100))['items']
    assert records[0]['consistency']['result']['reason']=='NO_CANDIDATES'
    assert not {'error_history','errors','requests','trace_ref','diagnostics_ref','candidate_records'} & records[0]['consistency'].keys()
    page = AuditEvidence(jobs).read(run,samples[0].sample_id,dict(sample_id=samples[0].sample_id))
    assert page.images and not page.error


def test_execution_failure_preserves_completed_images_and_retries_only_unfinished(native_audit):
    from iad_core.audit.queries import AuditQueries
    jobs, dataset_id, upstream, role = native_audit
    run = jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    samples = jobs.samples(run)
    accepted = save_image(jobs,run,samples[0])
    result = jobs.finish(run,error=dict(type='OSError',message='输入存储不可用'))
    assert (result['status'],result['completed'],result['failed']) == ('PARTIAL',1,5)
    assert jobs.sample(run,samples[0].sample_id).result == accepted
    assert all(sample.state=='FAILED' for sample in jobs.samples(run)[1:])
    assert result['execution_error']['message'] == '输入存储不可用'
    report = AuditQueries(jobs.db).report(run)
    assert report.report_state == 'FAILED' and not report.export_ready
    assert report.statistics.completed_images == 1 and report.statistics.incomplete_images == 5
    jobs.resume(run)
    assert jobs.sample(run,samples[0].sample_id).result == accepted
    assert all(sample.state=='PENDING' for sample in jobs.samples(run)[1:])


def test_no_knowledge_commit_feedback_identifies_the_empty_allowed_check_ids(native_audit):
    jobs, dataset_id, upstream, role = native_audit
    run = jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    sample = jobs.samples(run)[0]
    generic_check = dict(check_id='annotation_coverage',status='consistent',description='普通图像观察。',evidence_ids=[])
    with pytest.raises(ValueError,match=r'check_id=\[\]'):
        save_image(jobs,run,sample,check_assessments=[generic_check])
    assert save_image(jobs,run,sample).check_assessments == []
