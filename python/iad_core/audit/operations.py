from iad_core.audit.commits import AuditCommits
from iad_core.audit.evidence import AuditEvidence
from iad_core.audit.jobs import AuditAgentJobs
from iad_core.audit.state import AuditState
from iad_core.audit.reports import AuditReports
from iad_core.audit.batches import AuditBatches
from iad_core.storage.database import Database
from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd
from iad_core.workbench.runtime import workbench


def audit_agent_configuration(args, db_path):
    return AuditAgentJobs(workbench(db_path)).configuration().model_dump(mode='json')


def audit_agent_start(args, db_path):
    return AuditAgentJobs(workbench(db_path)).start(args['request'],agent=args['agent'],configuration=args.get('configuration'))


def audit_agent_snapshot(args, db_path):
    return AuditState(Database(db_path)).snapshot(args['run_id']).model_dump(mode='json')


def audit_agent_samples(args, db_path):
    return {'samples':[sample.model_dump(mode='json') for sample in AuditState(Database(db_path)).samples(args['run_id'])]}


def audit_agent_sample(args, db_path):
    return AuditState(Database(db_path)).sample(args['run_id'],args['sample_id']).model_dump(mode='json')


def audit_agent_context(args, db_path):
    return AuditState(Database(db_path)).context(args['run_id'],args['sample_id']).model_dump(mode='json')


def audit_agent_session_location(args, db_path):
    return AuditState(Database(db_path)).session_location(args['session_id']).model_dump(mode='json')


def audit_agent_session_created(args, db_path):
    return AuditAgentJobs(workbench(db_path)).session_created(args['run_id'],args['sample_id'],review_id=args.get('review_id')).model_dump(mode='json')


def audit_agent_media(args, db_path):
    return AuditEvidence(AuditAgentJobs(workbench(db_path))).read(args['run_id'],args['sample_id'],args['query']).model_dump(mode='json')


def audit_agent_reference(args, db_path):
    return AuditEvidence(AuditAgentJobs(workbench(db_path))).reference(args['run_id'],args['sample_id'],args['evidence_id'],args.get('view','whole')).model_dump(mode='json')


def audit_agent_crop(args, db_path):
    return AuditEvidence(AuditAgentJobs(workbench(db_path))).crop(args['run_id'],args['sample_id'],args['query']).model_dump(mode='json')


def audit_agent_commit(args, db_path):
    return AuditCommits(AuditAgentJobs(workbench(db_path))).accept(args['run_id'],args['sample_id'],args['submission'],review_id=args.get('review_id')).model_dump(mode='json')


def audit_agent_model_call_start(args, db_path):
    jobs = AuditAgentJobs(workbench(db_path))
    call = NativeModelCallStart.model_validate(args['request'])
    master = AuditReports(jobs.db).session(args['run_id'])
    session_id = call.request.get('sessionId') or master.session_id
    with jobs.db.connection() as connection:
        row = connection.execute('SELECT sample_id FROM audit_sample_runs WHERE job_id=? AND session_id=?', (args['run_id'], session_id)).fetchone()
    if row is None and session_id!=master.session_id:
        raise ValueError('模型请求没有本作业的主或子 Session')
    sample_id = row[0] if row else None
    ModelCalls(jobs.db).start_native(args['run_id'],call,sample_id=sample_id,session_id=session_id,attempt=1)
    if jobs.snapshot(args['run_id']).context_policy == 'evidence-on-demand-v1' and call.request.get('purpose'):
        return {}
    if sample_id:
        AuditEvidence(jobs).delivered(args['run_id'],sample_id,call.call_id,args['evidence_ids'])
    else:
        AuditReports(jobs.db).delivered(args['run_id'],call,args['evidence_ids'])
    return {}


def audit_agent_model_call_end(args, db_path):
    db=workbench(db_path).db
    with db.connection() as connection:
        sample_id=connection.execute("SELECT json_extract(summary_json,'$.sample_id') FROM model_calls WHERE run_id=? AND call_id=?",(args['run_id'],args['result']['call_id'])).fetchone()[0]
    ModelCalls(db).finish_native(args['run_id'],sample_id,NativeModelCallEnd.model_validate(args['result']))
    return {}


def audit_agent_failure(args, db_path):
    AuditAgentJobs(workbench(db_path)).failure(args['run_id'],args['sample_id'],args['message'],review_id=args.get('review_id'))
    return {}


def audit_agent_finish(args, db_path):
    return AuditAgentJobs(workbench(db_path)).finish(args['run_id'],error=args.get('error'))


def audit_agent_cancel(args, db_path):
    jobs = AuditAgentJobs(workbench(db_path))
    result = jobs.cancel(args['run_id'])
    AuditReports(jobs.db).finalize(args['run_id'])
    return result


def audit_agent_resume(args, db_path):
    return AuditAgentJobs(workbench(db_path)).resume(args['run_id'])


def audit_agent_interrupt(args, db_path):
    jobs = AuditAgentJobs(workbench(db_path))
    result = jobs.interrupt(args['run_id'])
    AuditReports(jobs.db).finalize(args['run_id'])
    return result


def audit_agent_phase(args, db_path):
    from iad_core.audit.stages import AuditStages
    jobs = AuditAgentJobs(workbench(db_path))
    phase = AuditStages(jobs).status(args['run_id'])
    if phase.phase in ('defects', 'normals'):
        jobs.jobs.update(args['run_id'], phase='AUDITING_DEFECTS' if phase.phase == 'defects' else 'AUDITING_NORMALS')
    return phase.model_dump(mode='json')


def audit_agent_defect_context(args, db_path):
    from iad_core.audit.stages import AuditStages
    return AuditStages(AuditState(Database(db_path))).context(args['run_id'])


def audit_agent_defect_profile(args, db_path):
    from iad_core.audit.stages import AuditStages
    return AuditStages(AuditState(Database(db_path))).publish(args['run_id'], args['submission']).model_dump(mode='json', exclude={'source_versions'})


def audit_agent_report_begin(args, db_path):
    jobs = AuditAgentJobs(workbench(db_path))
    result = AuditReports(jobs.db).begin(args['run_id'], phase=args.get('phase', 'report'))
    jobs.jobs.update(args['run_id'],phase='SUMMARIZING_DEFECT_PROFILE' if args.get('phase') == 'defect_profile' else 'GENERATING_AUDIT_REPORT')
    return result.model_dump(mode='json')


def audit_agent_report_state(args, db_path):
    return AuditReports(Database(db_path)).session(args['run_id']).model_dump(mode='json')


def audit_agent_report_session_created(args, db_path):
    with workbench(db_path).db.connection() as connection:
        connection.execute('UPDATE audit_report_runs SET session_created=1 WHERE job_id=?',(args['run_id'],))
    return {}


def audit_agent_report_statistics(args, db_path):
    return AuditReports(Database(db_path)).statistics(args['run_id']).model_dump(mode='json')


def audit_agent_quality_score(args, db_path):
    from iad_core.audit.quality_reports import AuditQualityReports
    from iad_core.audit.tool_pages import AuditToolPages
    return AuditToolPages.quality(AuditQualityReports(Database(db_path)), args['run_id'], args['assessment'])


def audit_agent_distribution(args, db_path):
    from iad_core.audit.distribution import AuditDistributions
    from iad_core.audit.distribution_models import AuditDistributionQuery
    return AuditDistributions.for_run(Database(db_path), args['run_id']).view(
        AuditDistributionQuery.model_validate(args.get('query', {}))).model_dump(mode='json')


def audit_agent_report_records(args, db_path):
    return AuditReports(Database(db_path)).records(args['run_id'],args['query'])


def audit_agent_discovery(args, db_path):
    return AuditReports(Database(db_path)).discovery(args['run_id'],args['query'])


def audit_agent_report_commit(args, db_path):
    from iad_core.audit.report_drafts import AuditReportDrafts
    return AuditReportDrafts(workbench(db_path).db).finalize(args['run_id'],args['submission']).model_dump(mode='json')


def audit_agent_report_draft(args, db_path):
    from iad_core.audit.report_drafts import AuditReportDrafts
    drafts = AuditReportDrafts(Database(db_path))
    if 'submission' in args:
        return drafts.save(args['run_id'],args['submission']).model_dump(mode='json')
    from iad_core.audit.tool_pages import AuditToolPages
    return AuditToolPages.draft(drafts, args['run_id'], args.get('query', {}))


def audit_agent_observation(args, db_path):
    from iad_core.audit.observation_notes import AuditObservationNotes
    return AuditObservationNotes(Database(db_path)).save(args['run_id'],args['session_id'],args['note'])


def audit_agent_report_evidence(args, db_path):
    return AuditReports(Database(db_path)).evidence(args['run_id'],args['sample_id'],args['evidence_id']).model_dump(mode='json')


def audit_job_prompts(args, db_path):
    state=AuditState(Database(db_path))
    if state.is_archived(args['run_id']):
        with state.db.connection() as connection:
            import json
            snapshot=json.loads(connection.execute('SELECT snapshot_json FROM audit_workflow_runs WHERE job_id=?',(args['run_id'],)).fetchone()[0])
        return dict(sections=[dict(title=title,text=snapshot.get(key) or '') for key,title in (
            ('system_prompt','图级系统提示词'),('instruction','图级用户提示词'),('report_instruction','报告用户提示词'))])
    snapshot=state.snapshot(args['run_id'])
    return dict(sections=[dict(title=title,text=text or '') for title,text in (
        ('主 Agent 系统提示词',snapshot.master_prompt.system_prompt),('主 Agent 用户提示词',snapshot.master_prompt.user_prompt),
        ('子 Agent 系统提示词',snapshot.observer_prompt.system_prompt),('子 Agent 用户提示词',snapshot.observer_prompt.user_prompt),
        ('报告用户提示词',snapshot.report_instruction))])


def audit_agent_prepare_observations(args, db_path):
    AuditBatches(AuditState(Database(db_path))).prepare(args['run_id'])
    return {}


def audit_agent_review_context(args, db_path):
    from iad_core.audit.observation_notes import AuditObservationNotes
    from iad_core.audit.report_drafts import AuditReportDrafts
    db = Database(db_path)
    context = AuditBatches(AuditState(db)).context(args['run_id'])
    session = AuditReports(db).session(args['run_id'])
    from iad_core.audit.tool_pages import AuditToolPages
    return {**context, 'observation_notes': {'total':len(AuditObservationNotes(db).read(args['run_id'],session.session_id))},
        'report_draft':AuditToolPages.draft(AuditReportDrafts(db), args['run_id'], {})}


def audit_agent_dataset(args, db_path):
    from iad_core.audit.tool_pages import AuditToolPages
    return AuditToolPages.dataset(AuditState(Database(db_path)).snapshot(args['run_id']).dataset_profile, args['query'])


def audit_agent_memory(args, db_path):
    from iad_core.audit.tool_pages import AuditToolPages
    from iad_core.audit.observation_notes import AuditObservationNotes
    db = Database(db_path)
    return AuditToolPages.notes(AuditObservationNotes(db), args['run_id'], AuditReports(db).session(args['run_id']).session_id, args.get('query', {}))



def audit_agent_review_commit(args, db_path):
    from iad_core.audit.report_models import AuditDiscoveryIndex
    state = AuditState(workbench(db_path).db)
    result = AuditBatches(state).publish(args['run_id'],args['submission'])
    return dict(revision=result.revision, discoveries=[AuditDiscoveryIndex.capture(item).model_dump(mode='json') for item in result.discoveries])


def audit_agent_rechecks(args, db_path):
    return {'reviews':[item.model_dump(mode='json') for item in AuditBatches(AuditState(Database(db_path))).rechecks(args['run_id'])]}


def audit_agent_versions(args, db_path):
    return {'versions':[item.model_dump(mode='json') for item in AuditBatches(AuditState(Database(db_path))).history(args['run_id'],args['sample_id'])]}


AUDIT_AGENT_OPERATIONS = (audit_agent_configuration,audit_agent_start,audit_agent_snapshot,audit_agent_samples,audit_agent_sample,
    audit_agent_context,audit_agent_session_location,audit_agent_session_created,audit_agent_media,audit_agent_reference,audit_agent_crop,
    audit_agent_commit,audit_agent_model_call_start,audit_agent_model_call_end,audit_agent_failure,
    audit_agent_finish,audit_agent_cancel,audit_agent_resume,audit_agent_interrupt,
    audit_agent_phase,audit_agent_defect_context,audit_agent_defect_profile,audit_agent_report_begin,audit_agent_report_state,audit_agent_report_session_created,
    audit_agent_report_statistics,audit_agent_distribution,audit_agent_quality_score,audit_agent_report_records,audit_agent_discovery,
    audit_agent_report_commit,audit_agent_report_draft,audit_agent_observation,audit_agent_report_evidence,audit_job_prompts,
    audit_agent_dataset,audit_agent_memory,audit_agent_prepare_observations,audit_agent_review_context,audit_agent_review_commit,audit_agent_rechecks,audit_agent_versions)
