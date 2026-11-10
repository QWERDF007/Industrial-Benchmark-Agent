from iad_core.audit.commits import AuditCommits
from iad_core.audit.evidence import AuditEvidence
from iad_core.audit.jobs import AuditAgentJobs
from iad_core.audit.state import AuditState
from iad_core.audit.reports import AuditReports
from iad_core.storage.database import Database
from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd
from iad_core.workbench.model_settings import ModelExecution
from iad_core.workbench.runtime import workbench
from iad_core.workbench.vision import VlmClient


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
    return AuditAgentJobs(workbench(db_path)).session_created(args['run_id'],args['sample_id']).model_dump(mode='json')


def audit_agent_media(args, db_path):
    return AuditEvidence(AuditAgentJobs(workbench(db_path))).read(args['run_id'],args['sample_id'],args['query']).model_dump(mode='json')


def audit_agent_reference(args, db_path):
    return AuditEvidence(AuditAgentJobs(workbench(db_path))).reference(args['run_id'],args['sample_id'],args['evidence_id']).model_dump(mode='json')


def audit_agent_crop(args, db_path):
    return AuditEvidence(AuditAgentJobs(workbench(db_path))).crop(args['run_id'],args['sample_id'],args['query']).model_dump(mode='json')


def audit_agent_commit(args, db_path):
    return AuditCommits(AuditAgentJobs(workbench(db_path))).accept(args['run_id'],args['sample_id'],args['submission']).model_dump(mode='json')


def audit_agent_model_call_start(args, db_path):
    jobs = AuditAgentJobs(workbench(db_path))
    sample_id = args.get('sample_id')
    session = jobs.sample(args['run_id'],sample_id) if sample_id else AuditReports(jobs.db).session(args['run_id'])
    call = NativeModelCallStart.model_validate(args['request'])
    ModelCalls(jobs.db).start_native(args['run_id'],call,sample_id=sample_id,session_id=session.session_id,attempt=1)
    if sample_id:
        AuditEvidence(jobs).delivered(args['run_id'],sample_id,call.call_id,args['evidence_ids'])
    else:
        AuditReports(jobs.db).delivered(args['run_id'],call)
    return {}


def audit_agent_model_call_end(args, db_path):
    ModelCalls(workbench(db_path).db).finish_native(args['run_id'],args.get('sample_id'),NativeModelCallEnd.model_validate(args['result']))
    return {}


def audit_agent_capacity(args, db_path):
    runtime = workbench(db_path)
    execution = ModelExecution.model_validate(args['_model_execution'])
    snapshot = AuditState(runtime.db).snapshot(args['run_id'])
    if snapshot.agent.profile != execution.profile or args['body']['model'] != execution.profile.model_id:
        raise ValueError('实际审计容量请求与冻结模型不一致')
    client = VlmClient(profile=execution.profile,api_key=execution.api_key.get_secret_value() if execution.api_key else None)
    try:
        with ModelCalls(runtime.db).bind(args['run_id'],sample_id=args.get('sample_id'),role='agent'):
            return client.token_budget(args['body'],execution.profile.max_output_tokens,'AuditAgent').model_dump(mode='json')
    finally:
        client.close()


def audit_agent_failure(args, db_path):
    AuditAgentJobs(workbench(db_path)).failure(args['run_id'],args['sample_id'],args['message'])
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


def audit_agent_prepare_inputs(args, db_path):
    jobs = AuditAgentJobs(workbench(db_path))
    jobs.jobs.update(args['run_id'],phase='PREPARING_AUDIT_INPUT')
    for sample in jobs.samples(args['run_id']):
        if sample.state != 'COMPLETED':
            AuditEvidence(jobs).prepare(args['run_id'],sample.sample_id,sample.sample_id)
    jobs.jobs.update(args['run_id'],phase='AUDITING')
    return {}


def audit_agent_report_begin(args, db_path):
    jobs = AuditAgentJobs(workbench(db_path))
    result = AuditReports(jobs.db).begin(args['run_id'])
    jobs.jobs.update(args['run_id'],phase='GENERATING_AUDIT_REPORT')
    return result.model_dump(mode='json')


def audit_agent_report_state(args, db_path):
    return AuditReports(Database(db_path)).session(args['run_id']).model_dump(mode='json')


def audit_agent_report_session_created(args, db_path):
    with workbench(db_path).db.connection() as connection:
        connection.execute('UPDATE audit_report_runs SET session_created=1 WHERE job_id=?',(args['run_id'],))
    return {}


def audit_agent_report_context(args, db_path):
    return AuditReports(Database(db_path)).context(args['run_id'])


def audit_agent_report_statistics(args, db_path):
    return AuditReports(Database(db_path)).statistics(args['run_id']).model_dump(mode='json')


def audit_agent_report_records(args, db_path):
    return AuditReports(Database(db_path)).records(args['run_id'],args['query'])


def audit_agent_report_groups(args, db_path):
    return AuditReports(workbench(db_path).db).groups(args['run_id'],args['submission']).model_dump(mode='json')


def audit_agent_report_commit(args, db_path):
    return AuditReports(workbench(db_path).db).commit(args['run_id'],args['submission']).model_dump(mode='json')


def audit_agent_report_evidence(args, db_path):
    return AuditReports(Database(db_path)).evidence(args['run_id'],args['sample_id'],args['evidence_id']).model_dump(mode='json')


def audit_agent_report_failure(args, db_path):
    jobs = AuditAgentJobs(workbench(db_path))
    AuditReports(jobs.db).failure(args['run_id'],args['message'])
    jobs.jobs.update(args['run_id'],execution_error={'type':'AuditReportError','message':args['message']},completion_pending=True)
    return {}


def audit_job_prompts(args, db_path):
    snapshot = AuditState(Database(db_path)).snapshot(args['run_id'])
    return dict(system_prompt=snapshot.system_prompt or '',instruction=snapshot.instruction,report_instruction=snapshot.report_instruction or '')


AUDIT_AGENT_OPERATIONS = (audit_agent_configuration,audit_agent_start,audit_agent_snapshot,audit_agent_samples,audit_agent_sample,
    audit_agent_context,audit_agent_session_location,audit_agent_session_created,audit_agent_media,audit_agent_reference,audit_agent_crop,
    audit_agent_commit,audit_agent_model_call_start,audit_agent_model_call_end,audit_agent_capacity,audit_agent_failure,
    audit_agent_finish,audit_agent_cancel,audit_agent_resume,audit_agent_interrupt,
    audit_agent_prepare_inputs,audit_agent_report_begin,audit_agent_report_state,audit_agent_report_session_created,
    audit_agent_report_context,audit_agent_report_statistics,audit_agent_report_records,audit_agent_report_groups,
    audit_agent_report_commit,audit_agent_report_evidence,audit_agent_report_failure,audit_job_prompts)
