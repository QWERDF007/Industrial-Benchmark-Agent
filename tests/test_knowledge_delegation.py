from uuid import uuid4

import pytest

from iad_core.analysis.jobs import AnalysisAgentJobs
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.queries import AnalysisQueries
from iad_core.knowledge.instructions import default_directions
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd


@pytest.fixture
def knowledge_job(agent_jobs):
    jobs, did, role = agent_jobs
    ModuleSettings(jobs.db).save(dict(module='knowledge', expected_revision=0,
        settings=dict(model=dict(provider_id='swift-30003', model_id='fixture'), batch_size=2)))
    request = dict(submission_id=str(uuid4()), analysis_kind='knowledge', dataset_ids=[did],
        mining_prompt=dict(objective='核对外缘。', instruction='联合比较，使用典型原图。',
            directions=[default_directions()[0].model_dump(mode='json')]))
    run_id = jobs.start(request, agent=role)['run_id']
    return jobs, did, run_id


def deliver(jobs, run_id, session_id, pages):
    calls = ModelCalls(jobs.db)
    call = NativeModelCallStart(call_id='call_'+uuid4().hex, started_at='2026-11-11T12:00:00Z', request={})
    calls.start_native(run_id, call, sample_id=None, session_id=session_id, attempt=1)
    AnalysisEvidence(jobs).delivered(run_id, call.call_id,
        [image.image.evidence_id for page in pages for image in page.images])
    calls.finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-11T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))


def observations(did, pages):
    return [dict(dataset_id=did, sample_id=page.sample_id, description='外缘轮廓可定位。',
        evidence_ids=[page.evidence_id], directions=[dict(direction_ref='D1', status='applicable', reason='外缘可见。')])
        for page in pages]


def test_knowledge_freezes_automatic_mixed_first_batch_and_independent_role_prompts(knowledge_job):
    jobs, did, run_id = knowledge_job
    snapshot = jobs.snapshot(run_id)
    assert snapshot.execution_mode == 'dsh-subagents'
    assert snapshot.settings.concurrency == 2
    assert snapshot.input_organization == 'batch-materials-v1'
    assert snapshot.plan.rounds[0].sampling_counts.model_dump() == dict(normal=1, abnormal=1, unclassified=0)
    assert snapshot.observer_prompt.system_prompt != snapshot.system_prompt
    materials = AnalysisEvidence(jobs).batch(run_id)
    assert len(materials.registrations) == 2
    assert all(image.image.sent_size == image.image.original_size for page in materials.registrations
        for image in page.images if image.image.is_whole_image)
    prompts = AnalysisQueries(jobs.db).prompts(run_id)
    assert snapshot.knowledge_tasks.initial in prompts.main.user_prompt
    assert snapshot.knowledge_tasks.observe in prompts.observer.user_prompt
    assert snapshot.knowledge_tasks.review not in prompts.observer.user_prompt


def test_workers_report_without_writing_and_main_commits_one_complete_wave(knowledge_job):
    from iad_core.analysis.delegation import AnalysisDelegation
    jobs, did, run_id = knowledge_job
    pages = AnalysisEvidence(jobs).batch(run_id).registrations
    deliver(jobs, run_id, jobs.state(run_id).session_id, pages)
    first = dict(commit_key='first', base_revision=0, round_id=1, observations=observations(did,pages),
        checks=[], summary='外缘可联合比较。', limitations=[], unresolved_questions=[])
    AnalysisCommits(jobs).accept(run_id, first)
    delegation = AnalysisDelegation(jobs)
    tasks = delegation.wave(run_id).tasks
    assert len(tasks) == 1
    task = tasks[0]
    pages = delegation.materials(run_id, task.session_id).registrations
    report = dict(observations=observations(did,pages), assessments=[], discoveries=[],
        discovery_summary='未形成可靠新判据。', key_evidence_ids=[])
    with pytest.raises(ValueError, match='实际.*请求'):
        delegation.report(run_id,task.session_id,report)
    deliver(jobs,run_id,task.session_id,pages)
    saved=delegation.report(run_id,task.session_id,report)
    assert delegation.report(run_id,task.session_id,report)==saved
    assert saved.report.observations[0].directions[0].direction_ref == 'D1'
    assert jobs.state(run_id).revision == 1
    assert jobs.jobs.status(run_id)['completed'] == 2
    assert jobs.session_location(task.session_id).module == 'knowledge'
    review=dict(commit_key='review',base_revision=1,round_id=2,observations=[],checks=[],
        summary='没有可靠条目。',limitations=[],unresolved_questions=[],report_reviews=[])
    with pytest.raises(ValueError,match='全部.*报告'):
        AnalysisCommits(jobs).accept(run_id,review)
    review['report_reviews']=[dict(round_id=2,discovery_decisions=[])]
    receipt=AnalysisCommits(jobs).accept(run_id,review)
    assert receipt.completed_delta == 2
    assert receipt.revision == 2
    assert jobs.context(run_id).round is None
    assert AnalysisCommits(jobs).accept(run_id,review) == receipt
    history=AnalysisQueries(jobs.db).observation_history(run_id,dict(round_id=2))
    assert len(history.items) == 2
    assert {item.revision for item in history.items} == {2}


def test_typical_images_are_saved_before_finalization_and_crop_candidates_are_rejected(knowledge_job):
    from iad_core.analysis.delegation import AnalysisDelegation
    jobs,did,run_id=knowledge_job
    pages=AnalysisEvidence(jobs).batch(run_id).registrations
    deliver(jobs,run_id,jobs.state(run_id).session_id,pages)
    first_id=pages[0].evidence_id
    entry=dict(check_id='edge',title='外缘连续性',subject='主体',location='外缘',criterion='沿可辨外缘核对连续性。',
        allowed_variations=[],limitations=[],status='provisional',support_evidence_ids=[first_id],counter_evidence_ids=[],
        dataset_ids=[did],direction_refs=['D1'],key_evidence=[dict(evidence_id=first_id,role='support',reason='外缘可作为复核参照。')])
    AnalysisCommits(jobs).accept(run_id,dict(commit_key='seed',base_revision=0,round_id=1,observations=observations(did,pages),
        checks=[entry],summary='外缘可复核。',limitations=[],unresolved_questions=[]))
    assert [key.evidence_id for key in jobs.context(run_id).catalog.checks[0].key_evidence] == [first_id]
    delegation=AnalysisDelegation(jobs)
    task=delegation.wave(run_id).tasks[0]
    pages=delegation.materials(run_id,task.session_id).registrations
    deliver(jobs,run_id,task.session_id,pages)
    candidate=dict(candidate_id='new',title='局部外缘',subject='主体',location='外缘',criterion='核对外缘局部。',
        allowed_variations=[],limitations=[],status='provisional',support_evidence_ids=[pages[0].evidence_id],
        counter_evidence_ids=[],dataset_ids=[did],direction_refs=['D1'])
    report=dict(observations=observations(did,pages),assessments=[],discoveries=[candidate],
        discovery_summary='外缘存在可核对现象。',key_evidence_ids=[pages[0].evidence_id])
    roi=next(image.image.evidence_id for page in pages for image in page.images if image.image.role=='roi')
    with pytest.raises(ValueError,match='完整原图'):
        delegation.report(run_id,task.session_id,{**report,'discoveries':[{**candidate,'support_evidence_ids':[roi]}],
            'key_evidence_ids':[roi]})
    with pytest.raises(ValueError,match='所选方向'):
        delegation.report(run_id,task.session_id,{**report,'discoveries':[{**candidate,'direction_refs':['unknown']}]})
    missing=observations(did,pages);missing[0]['directions']=[]
    with pytest.raises(ValueError,match='全部.*方向'):
        delegation.report(run_id,task.session_id,{**report,'observations':missing})
    delegation.report(run_id,task.session_id,report)
    counter=pages[0].evidence_id
    AnalysisCommits(jobs).accept(run_id,dict(commit_key='review',base_revision=1,round_id=2,observations=[],
        checks=[{**entry,'key_evidence':[*entry['key_evidence'],dict(evidence_id=counter,role='counter',reason='该外缘变化限制连续性判据。')]}],
        arguments=[dict(entry_id='edge',evidence_id=counter,role='counter',reason='可见的外缘变化与当前主张矛盾。')],
        report_reviews=[dict(round_id=2,discovery_decisions=[dict(candidate_id='new',action='merge',check_id='edge',reason='相同部位和检查动作。')])],
        summary='外缘需要结合反例复核。',limitations=[],unresolved_questions=[]))
    check=jobs.context(run_id).catalog.checks[0]
    assert check.status=='conflicted'
    assert [key.role for key in check.key_evidence]==['support','counter']
    assert AnalysisQueries(jobs.db).arguments(run_id,dict(entry_id='edge',role='counter')).items[0].evidence_id==counter


def test_knowledge_display_uses_readable_references_and_all_cited_originals(knowledge_job):
    from iad_core.knowledge.models import KnowledgeDetailQuery
    from iad_core.analysis.publications import AnalysisPublications
    jobs,did,run_id=knowledge_job
    pages=AnalysisEvidence(jobs).batch(run_id).registrations
    deliver(jobs,run_id,jobs.state(run_id).session_id,pages)
    ids=[page.evidence_id for page in pages]
    annotation=next(annotation for record in jobs.snapshot(run_id).manifest.records for annotation in record.annotations)
    body=f'沿外缘核对连续性，依据[{ids[0]}]、标注{annotation.annotation_id}，来源{run_id}。'
    entry=dict(check_id='edge',title='外缘连续性',subject='主体',location='外缘',criterion='沿外缘核对连续性。',
        allowed_variations=[],limitations=[],status='provisional',support_evidence_ids=ids,counter_evidence_ids=[],
        dataset_ids=[did],direction_refs=['D1'],key_evidence=[dict(evidence_id=ids[0],role='support',reason='典型外缘。')])
    AnalysisCommits(jobs).accept(run_id,dict(commit_key='seed',base_revision=0,round_id=1,observations=observations(did,pages),
        checks=[entry],summary='外缘可复核。',limitations=[],unresolved_questions=[]))
    # Historical result fixture: readable projection must not rewrite the saved body.
    catalog=jobs.state(run_id).catalog.model_dump(mode='json')
    catalog['checks'][0]['criterion']=body
    import json
    with jobs.db.connection() as connection:
        connection.execute('UPDATE analysis_workflow_runs SET catalog_json=? WHERE job_id=?',(json.dumps(catalog),run_id))
    version=jobs.cancel(run_id)['analysis_version_id']
    detail=AnalysisQueries(jobs.db).details(KnowledgeDetailQuery(version_id=version,check_id='edge',section='checks'))
    assert all(identity not in detail.check.criterion for identity in [ids[0],annotation.annotation_id,run_id])
    assert '原图' in detail.check.criterion
    assert [item.image.evidence_id for item in detail.items]==ids
    assert detail.total==detail.check.support_count==2
    assert len(detail.support_evidence_ids)==2
    assert AnalysisPublications(jobs.db).get(version).catalog.checks[0].criterion==body


def test_existing_batch_assignments_survive_the_shared_table_migration(knowledge_job):
    from iad_core.analysis.delegation import AnalysisDelegation
    from iad_core.storage.database import Database
    jobs,did,run_id=knowledge_job
    pages=AnalysisEvidence(jobs).batch(run_id).registrations
    deliver(jobs,run_id,jobs.state(run_id).session_id,pages)
    AnalysisCommits(jobs).accept(run_id,dict(commit_key='seed',base_revision=0,round_id=1,observations=observations(did,pages),
        checks=[],summary='没有可靠条目。',limitations=[],unresolved_questions=[]))
    before=AnalysisDelegation(jobs).wave(run_id)
    with jobs.db.connection() as connection:
        connection.execute('ALTER TABLE analysis_batch_tasks RENAME TO exploration_batch_tasks')
    Database(jobs.db.db_path)
    assert AnalysisDelegation(jobs).wave(run_id)==before
    assert jobs.session_location(before.tasks[0].session_id).module=='knowledge'


def test_historical_serial_snapshot_keeps_its_media_policy_and_prompt_body(knowledge_job,tmp_path):
    import json
    jobs,_,run_id=knowledge_job
    with jobs.db.connection() as connection:
        snapshot=json.loads(connection.execute('SELECT snapshot_json FROM analysis_workflow_runs WHERE job_id=?',(run_id,)).fetchone()[0])
        snapshot.pop('knowledge_tasks')
        snapshot.update(execution_mode='serial',input_organization='registration-tools',observer_prompt=None)
        snapshot['settings']['whole_image_max_side']=32
        snapshot['settings'].pop('concurrency')
        original=json.dumps(snapshot)
        connection.execute('UPDATE analysis_workflow_runs SET snapshot_json=? WHERE job_id=?',(original,run_id))
    sid=jobs.context(run_id).round.targets[0].sample_id
    media=AnalysisEvidence(jobs).read(run_id,dict(sample_id=sid,offset=0,limit=1))
    assert media.images[0].image.sent_size==[32,24]
    prompts=AnalysisQueries(jobs.db).prompts(run_id)
    assert prompts.observer is None
    assert prompts.main.user_prompt==snapshot['instruction']
    with jobs.db.connection() as connection:
        assert connection.execute('SELECT snapshot_json FROM analysis_workflow_runs WHERE job_id=?',(run_id,)).fetchone()[0]==original
    pages=[AnalysisEvidence(jobs).read(run_id,dict(sample_id=target.sample_id)) for target in jobs.context(run_id).round.targets]
    deliver(jobs,run_id,jobs.state(run_id).session_id,pages)
    did=snapshot['manifest']['dataset_ids'][0]
    AnalysisCommits(jobs).accept(run_id,dict(commit_key='historical',base_revision=0,round_id=1,observations=observations(did,pages),
        checks=[],summary='历史观察。',limitations=[],unresolved_questions=[]))
    version=jobs.cancel(run_id)['analysis_version_id']
    from iad_core.analysis.exports import AnalysisExports
    import zipfile
    artifact=AnalysisExports(jobs.db).create(version,str(tmp_path/'historical-export'),'{"type":"session"}\n')
    with zipfile.ZipFile(artifact.path) as archive:
        frozen=json.loads(archive.read('manifest.json'))['snapshot']
    assert frozen=={name:value for name,value in snapshot.items() if name!='agent'}
