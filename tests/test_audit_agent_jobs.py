from uuid import uuid4

import pytest

from iad_core.workbench.module_settings import ModuleSettings



def test_zero_knowledge_freezes_all_registrations_and_an_independent_session_per_image(native_audit):
    jobs, dataset_id, consistency_job_id, role = native_audit
    request = dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=consistency_job_id,
        knowledge=None, system_prompt='使用审计工具提交完整终稿。', instruction='读取原图和全部局部，独立审计本张图像。')
    created = jobs.start(request, agent=role)
    snapshot = jobs.snapshot(created['run_id'])
    assert snapshot.system_prompt == request['system_prompt']
    assert snapshot.instruction == request['instruction']
    assert created['created'] is True
    assert created['total_samples'] == 6
    assert snapshot.knowledge is None
    assert snapshot.settings.concurrency == 2
    samples = jobs.samples(created['run_id'])
    assert len(samples) == len({sample.session_id for sample in samples}) == 6
    assert all(not sample.session_created for sample in samples)
    assert {sample.consistency.result.reason for sample in samples} == {'NO_CANDIDATES'}
    assert all(jobs.context(created['run_id'], sample.sample_id).knowledge is None for sample in samples)
    assert jobs.start(request, agent=role)['created'] is False
    ModuleSettings(jobs.db).save({'module':'audit', 'expected_revision':1, 'settings':{'concurrency':1}})
    assert jobs.snapshot(created['run_id']) == snapshot
    assert len(jobs.jobs.list(dataset_id, ('MODEL_AUDIT',))) == 1


def test_audit_accepts_only_the_current_images_real_delivered_evidence_and_retains_all_findings(native_audit):
    from iad_core.audit.evidence import AuditEvidence
    from iad_core.audit.commits import AuditCommits
    from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd
    jobs, dataset_id, consistency_job_id, role = native_audit
    created = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=consistency_job_id,
        knowledge=None, instruction='逐图观察并保留全部疑点。'), agent=role)
    run_id = created['run_id']
    first, second = jobs.samples(run_id)[:2]
    jobs.session_created(run_id, first.sample_id)
    page = AuditEvidence(jobs).read(run_id, first.sample_id, {'sample_id':first.sample_id})
    ids = [item.image.evidence_id for item in page.images]
    final = dict(state='suspect', analysis='只属于第一张图的独立分析。', conclusion='三处现象需要核对。', basis=['已查看全部原图与局部。'],
        evidence_ids=ids, check_assessments=[], findings=[dict(finding_id='F'+str(index), description='待核对现象'+str(index),
            location='主体', evidence_ids=ids, normal_explanation='可能为成像变化。', limitations=[]) for index in range(3)], limitations=[])
    submission = dict(commit_key='final', final=final)
    commits = AuditCommits(jobs)
    with pytest.raises(ValueError, match='实发'):
        commits.accept(run_id, first.sample_id, submission)
    call = NativeModelCallStart(call_id='call_'+uuid4().hex, started_at='2026-11-09T12:00:00Z', request={'fixture':'native image input'})
    ModelCalls(jobs.db).start_native(run_id, call, sample_id=first.sample_id, session_id=first.session_id, attempt=1)
    AuditEvidence(jobs).delivered(run_id, first.sample_id, call.call_id, ids)
    ModelCalls(jobs.db).finish_native(run_id, first.sample_id, NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-09T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
    accepted = commits.accept(run_id, first.sample_id, submission)
    assert len(accepted.findings) == 3
    assert commits.accept(run_id, first.sample_id, submission) == accepted
    assert jobs.jobs.status(run_id)['completed'] == 1

    assert jobs.sample(run_id, first.sample_id).state == 'COMPLETED'
    assert '第一张图的独立分析' not in jobs.context(run_id, second.sample_id).model_dump_json()
    with pytest.raises(ValueError, match='本场|实发'):
        commits.accept(run_id, second.sample_id, submission)
    assert jobs.jobs.status(run_id)['completed'] == 1


def test_selected_partial_knowledge_preserves_conflicts_review_and_frozen_counter_evidence(native_audit):
    from iad_core.analysis.jobs import AnalysisAgentJobs
    from iad_core.analysis.commits import AnalysisCommits
    from iad_core.analysis.evidence import AnalysisEvidence
    from iad_core.audit.evidence import AuditEvidence
    from iad_core.knowledge.instructions import default_directions
    from iad_core.knowledge.check_reviews import KnowledgeCheckReviews
    from iad_core.knowledge.models import KnowledgeCheckReviewSubmission
    from iad_core.workbench.audit_sources import AuditSources
    from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd
    jobs, dataset_id, consistency_job_id, role = native_audit
    ModuleSettings(jobs.db).save({'module':'knowledge','expected_revision':0,
        'settings':{'model':{'provider_id':'swift-30003','model_id':'fixture'},'batch_size':2}})
    mining = AnalysisAgentJobs(jobs.runtime)
    direction = default_directions()[0].model_dump(mode='json')
    started = mining.start(dict(submission_id=str(uuid4()),analysis_kind='knowledge',dataset_ids=[dataset_id],
        mining_prompt=dict(objective='核对轮廓。',instruction='保留反例与局限。',directions=[direction])),agent=role)
    run_id = started['run_id']
    context = mining.context(run_id)
    pages = [AnalysisEvidence(mining).read(run_id,{'sample_id':target.sample_id}) for target in context.round.targets]
    call = NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-09T12:00:00Z',request={'fixture':'selected knowledge images'})
    ModelCalls(jobs.db).start_native(run_id,call,sample_id=None,session_id=context.session_id,attempt=1)
    AnalysisEvidence(mining).delivered(run_id,call.call_id,[item.image.evidence_id for page in pages for item in page.images])
    ModelCalls(jobs.db).finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-09T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
    checks = [dict(check_id='C1',title='轮廓矛盾',subject='主体',location='边缘',criterion='复查轮廓变化。',
        allowed_variations=['视角差异'],limitations=['仅两个独立来源'],status='conflicted',
        support_evidence_ids=[pages[0].images[0].image.evidence_id],counter_evidence_ids=[pages[1].images[0].image.evidence_id],
        direction_refs=[context.selected_directions[0].ref],dataset_ids=[dataset_id])]
    checks.append({**checks[0],'check_id':'C2','title':'暂定观察','status':'provisional','counter_evidence_ids':[]})
    AnalysisCommits(mining).accept(run_id,dict(commit_key='first',base_revision=0,round_id=1,
        observations=[dict(sample_id=page.sample_id,dataset_id=dataset_id,description='可见观察。',
            evidence_ids=[item.image.evidence_id for item in page.images],directions=[dict(
                direction_ref=context.selected_directions[0].ref,status='applicable',reason='可观察轮廓。')]) for page in pages],
        checks=checks,summary='支持与反例并存。',limitations=['范围尚未看完。'],unresolved_questions=['需更多独立来源。']))
    publication_id = mining.cancel(run_id)['analysis_version_id']
    reviews = KnowledgeCheckReviews(jobs.db)
    reviews.submit(KnowledgeCheckReviewSubmission(submission_id=uuid4(),version_id=publication_id,check_id='C1',
        expected_revision=0,status='rejected',note='人工认为证据尚不成立。'))
    catalog = AuditSources(jobs.db).catalog([dataset_id])
    source = next(item for item in catalog.knowledge_jobs if item.version_id == publication_id)
    assert source.publication_status == 'partial'
    assert [(item.check_id,item.status,item.review.status) for item in source.entries] == [('C1','conflicted','rejected'),('C2','provisional','pending')]
    assert consistency_job_id in {item.job_id for item in catalog.consistency_jobs}
    selection = dict(job_id=run_id,version_id=publication_id,entry_ids=['C1'])
    audit = jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=consistency_job_id,knowledge=selection),agent=role)
    first = jobs.samples(audit['run_id'])[0]
    selected = jobs.context(audit['run_id'],first.sample_id).knowledge
    assert len(selected.entries) == 1
    assert selected.entries[0].check.status == 'conflicted'
    assert selected.entries[0].review.status == 'rejected'
    assert selected.entries[0].check.counter_evidence_ids == checks[0]['counter_evidence_ids']
    reviews.submit(KnowledgeCheckReviewSubmission(submission_id=uuid4(),version_id=publication_id,check_id='C1',
        expected_revision=1,status='confirmed',note='之后的核实不改写旧作业。'))
    assert jobs.context(audit['run_id'],first.sample_id).knowledge == selected
    evidence = AuditEvidence(jobs)
    counter = evidence.reference(audit['run_id'],first.sample_id,checks[0]['counter_evidence_ids'][0])
    assert counter.images[0].image == pages[1].images[0].image
    crop = evidence.crop(audit['run_id'],first.sample_id,{'sample_id':first.sample_id,'bbox':[1,2,11,12]})
    assert crop.images[0].image.crop_bbox == [1,2,11,12]
    assert crop.images[0].image.sent_size == [10,10]
    with pytest.raises(ValueError,match='已选知识'):
        evidence.reference(audit['run_id'],first.sample_id,'foreign-evidence')

    from iad_core.entry import knowledge_check_remove, knowledge_versions, knowledge_details, knowledge_get
    removal = dict(version_id=publication_id,request=dict(submission_id=str(uuid4()),check_id='C2'))
    maintained = knowledge_check_remove(removal,jobs.db.db_path)
    assert maintained['manually_edited'] is True
    assert maintained['parent_version_id'] == publication_id
    assert maintained['source_run_id'] == run_id
    assert maintained['check_count'] == 1
    assert knowledge_check_remove(removal,jobs.db.db_path) == maintained
    with pytest.raises(ValueError,match='提交ID'):
        knowledge_check_remove({**removal,'request':{**removal['request'],'check_id':'C1'}},jobs.db.db_path)
    versions = knowledge_versions(dict(dataset_id=dataset_id),jobs.db.db_path)
    assert versions['current_version_id'] == maintained['version_id']
    assert [version['version_id'] for version in versions['versions']][:2] == [maintained['version_id'],publication_id]
    detail = knowledge_details(dict(version_id=maintained['version_id']),jobs.db.db_path)
    assert [item['check_id'] for item in detail['items']] == ['C1']
    evidence_detail = knowledge_details(dict(version_id=maintained['version_id'],check_id='C1'),jobs.db.db_path)
    assert evidence_detail['counter_evidence_ids'] == checks[0]['counter_evidence_ids']
    assert evidence_detail['directions'] == [mining.snapshot(run_id).selected_directions[0].model_dump(mode='json')]
    assert detail['items'][0]['review']['status'] == 'confirmed'
    assert detail['items'][0]['review']['revision'] == 0
    reviews.submit(KnowledgeCheckReviewSubmission(submission_id=uuid4(),version_id=publication_id,check_id='C1',
        expected_revision=2,status='rejected',note='旧版本后续意见不改变维护时的保留意见。'))
    assert knowledge_details(dict(version_id=maintained['version_id']),jobs.db.db_path)['items'][0]['review']['status'] == 'confirmed'
    original = knowledge_get(dict(version_id=publication_id),jobs.db.db_path)
    edited = knowledge_get(dict(version_id=maintained['version_id']),jobs.db.db_path)
    assert [item['check_id'] for item in original['catalog']['checks']] == ['C1','C2']
    assert edited['coverage'] == original['coverage']
    assert edited['model_call_ids'] == original['model_call_ids']
    source = next(item for item in AuditSources(jobs.db).catalog([dataset_id]).knowledge_jobs if item.version_id == maintained['version_id'])
    assert [item.check_id for item in source.entries] == ['C1']
    assert jobs.context(audit['run_id'],first.sample_id).knowledge == selected


def test_current_audit_reads_use_the_native_image_and_session_contract(native_audit):
    from iad_core.entry import audit_job_samples, audit_job_sample
    jobs, dataset_id, consistency_job_id, role = native_audit
    created = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id],
        consistency_job_id=consistency_job_id, knowledge=None), agent=role)
    run_id = created['run_id']
    first = jobs.samples(run_id)[0]
    page = audit_job_samples({'run_id':run_id}, jobs.db.db_path)
    assert page['distribution'] == dict(suspect=0, insufficient=0, normal=0, unprocessed=6)
    assert len(page['items']) == 6
    item = page['items'][0]
    assert item['run_id'] == run_id and item['sample_id'] == first.sample_id
    assert item['session_id'] is None
    assert 'suggestion_id' not in item
    assert 'consistency_check_id' not in item
    jobs.session_created(run_id, first.sample_id)
    detail = audit_job_sample({'run_id':run_id, 'sample_id':first.sample_id}, jobs.db.db_path)
    assert detail['sample']['session_id'] == first.session_id
    assert detail['final'] is None and detail['knowledge'] is None
    assert detail['consistency']['job_id'] == consistency_job_id
    assert detail['consistency']['anchor_id'] == first.sample_id
    assert 'suggestion' not in detail
