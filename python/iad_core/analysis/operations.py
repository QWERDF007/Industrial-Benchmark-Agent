from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.analysis.jobs import AnalysisAgentJobs
from iad_core.analysis.models import AnalysisScope, AnalysisObservationQuery
from iad_core.analysis.publications import AnalysisPublications
from iad_core.analysis.queries import AnalysisQueries
from iad_core.storage.database import Database
from iad_core.workbench.calls import ModelCalls, NativeModelCallEnd, NativeModelCallStart
from iad_core.workbench.model_settings import ModelExecution
from iad_core.workbench.runtime import workbench
from iad_core.workbench.vision import VlmClient


def analysis_agent_configuration(args, db_path):
    return AnalysisAgentJobs(workbench(db_path)).configuration(args['module']).model_dump(mode='json')


def analysis_agent_start(args, db_path):
    return AnalysisAgentJobs(workbench(db_path)).start(args['request'], agent=args['agent'], configuration=args.get('configuration'))


def analysis_agent_snapshot(args, db_path):
    return AnalysisAgentJobs(workbench(db_path)).snapshot(args['run_id']).model_dump(mode='json')


def analysis_agent_context(args, db_path):
    return AnalysisAgentJobs(workbench(db_path)).context(args['run_id']).model_dump(mode='json')


def analysis_agent_session_location(args, db_path):
    return AnalysisAgentJobs(workbench(db_path)).session_location(args['session_id']).model_dump(mode='json')


def analysis_agent_session_created(args, db_path):
    return AnalysisAgentJobs(workbench(db_path)).session_created(args['run_id']).model_dump(mode='json')


def analysis_agent_media(args, db_path):
    return AnalysisEvidence(AnalysisAgentJobs(workbench(db_path))).read(args['run_id'], args['query'], session_id=args.get('session_id')).model_dump(mode='json')


def analysis_agent_batch_materials(args, db_path):
    return AnalysisEvidence(AnalysisAgentJobs(workbench(db_path))).batch(args['run_id']).model_dump(mode='json')


def analysis_agent_crop(args, db_path):
    return AnalysisEvidence(AnalysisAgentJobs(workbench(db_path))).crop(args['run_id'],args['query'], session_id=args.get('session_id')).model_dump(mode='json')


def analysis_agent_reference(args, db_path):
    return AnalysisEvidence(AnalysisAgentJobs(workbench(db_path))).reference(args['run_id'],args['query']).model_dump(mode='json')


def analysis_agent_commit(args, db_path):
    return AnalysisCommits(AnalysisAgentJobs(workbench(db_path))).accept(args['run_id'], args['submission']).model_dump(mode='json')


def analysis_agent_model_call_start(args, db_path):
    runtime = workbench(db_path)
    jobs = AnalysisAgentJobs(runtime)
    state = jobs.state(args['run_id'])
    request = NativeModelCallStart.model_validate(args['request'])
    session_id = request.request.get('sessionId') or state.session_id
    if session_id != state.session_id:
        from iad_core.analysis.delegation import AnalysisDelegation
        AnalysisDelegation(jobs).task(args['run_id'], session_id)
    ModelCalls(runtime.db).start_native(args['run_id'], request, sample_id=None, session_id=session_id, attempt=1)
    AnalysisEvidence(jobs).delivered(args['run_id'], request.call_id, args['evidence_ids'])
    return {}


def analysis_agent_model_call_end(args, db_path):
    ModelCalls(workbench(db_path).db).finish_native(args['run_id'], None, NativeModelCallEnd.model_validate(args['result']))
    return {}


def analysis_agent_capacity(args, db_path):
    runtime = workbench(db_path)
    execution = ModelExecution.model_validate(args['_model_execution'])
    snapshot = AnalysisAgentJobs(runtime).snapshot(args['run_id'])
    if snapshot.agent.profile != execution.profile or args['body']['model'] != execution.profile.model_id:
        raise ValueError('实际模型容量请求与冻结模型不一致')
    client = VlmClient(profile=execution.profile, api_key=execution.api_key.get_secret_value() if execution.api_key else None)
    try:
        with ModelCalls(runtime.db).bind(args['run_id'], role='agent'):
            return client.token_budget(args['body'], execution.profile.max_output_tokens, 'AnalysisAgent').model_dump(mode='json')
    finally:
        client.close()


def analysis_agent_finish(args, db_path):
    runtime = workbench(db_path)
    snapshot = AnalysisAgentJobs(runtime).snapshot(args['run_id'])
    if args.get('error') and (snapshot.schema_version == 1 or runtime.jobs.status(args['run_id'])['completion_pending']):
        runtime.jobs.update(args['run_id'], execution_error=args['error'])
    runtime.jobs.finish_external(args['run_id'])
    AnalysisPublications(runtime.db).publish(args['run_id'])
    return runtime.jobs.status(args['run_id'])


def analysis_agent_publication(args, db_path):
    return AnalysisPublications(workbench(db_path).db).get(args['version_id']).model_dump(mode='json')


def analysis_agent_cancel(args, db_path):
    return AnalysisAgentJobs(workbench(db_path)).cancel(args['run_id'])


def analysis_agent_resume(args, db_path):
    return AnalysisAgentJobs(workbench(db_path)).resume(args['run_id'])


def analysis_agent_interrupt(args, db_path):
    return AnalysisAgentJobs(workbench(db_path)).interrupt(args['run_id'])


def analysis_publication(args, db_path):
    return AnalysisQueries(Database(db_path)).view(args['version_id']).model_dump(mode='json')


def analysis_current_evidence(args, db_path):
    return AnalysisQueries(Database(db_path)).current_evidence(args['run_id'], args['evidence_id'])


def analysis_evidence(args, db_path):
    return AnalysisQueries(Database(db_path)).evidence(args['version_id'], args['evidence_id'])


def analysis_current_sample_evidence(args, db_path):
    return AnalysisQueries(Database(db_path)).current_sample(args['run_id'], args['sample_id']).model_dump(mode='json')


def analysis_sample_evidence(args, db_path):
    return AnalysisQueries(Database(db_path)).sample_evidence(args['version_id'],args['sample_id']).model_dump(mode='json')


def analysis_observations(args, db_path):
    return AnalysisQueries(Database(db_path)).observations(args['version_id'],AnalysisObservationQuery.model_validate(args['query'])).model_dump(mode='json')


def analysis_direction_choices(args, db_path):
    return AnalysisQueries(Database(db_path)).choices(AnalysisScope.model_validate(args).dataset_ids).model_dump(mode='json')


def analysis_sources(args, db_path):
    return AnalysisQueries(Database(db_path)).sources(AnalysisScope.model_validate(args).dataset_ids).model_dump(mode='json')


def analysis_agent_artifacts(args, db_path):
    from iad_core.analysis.exports import AnalysisExports
    return AnalysisExports(Database(db_path)).create(args['version_id'],args['directory'],args['session_jsonl'],args.get('child_sessions')).model_dump(mode='json')


def analysis_agent_catalog(args, db_path):
    return AnalysisQueries(Database(db_path)).catalog(args['run_id'],args['query']).model_dump(mode='json')


def analysis_agent_history(args, db_path):
    return AnalysisQueries(Database(db_path)).observation_history(args['run_id'],args['query']).model_dump(mode='json')


def analysis_agent_arguments(args, db_path):
    return AnalysisQueries(Database(db_path)).arguments(args['run_id'],args['query']).model_dump(mode='json')


def analysis_agent_claims(args, db_path):
    from iad_core.analysis.argument_models import AnalysisEntryQuery
    query = AnalysisEntryQuery.model_validate(args['query'])
    return AnalysisQueries(Database(db_path)).claim_history(args['run_id'], **query.model_dump()).model_dump(mode='json')


def analysis_agent_finalization_context(args, db_path):
    from iad_core.analysis.finalization import AnalysisFinalizations
    return AnalysisFinalizations(AnalysisAgentJobs(workbench(db_path))).context(args['run_id']).model_dump(mode='json')


def analysis_agent_finalize(args, db_path):
    from iad_core.analysis.finalization import AnalysisFinalizations
    return AnalysisFinalizations(AnalysisAgentJobs(workbench(db_path))).accept(args['run_id'],args['submission']).model_dump(mode='json')


def analysis_agent_wave(args, db_path):
    from iad_core.analysis.delegation import AnalysisDelegation
    return AnalysisDelegation(AnalysisAgentJobs(workbench(db_path))).wave(args['run_id']).model_dump(mode='json')


def analysis_agent_worker_materials(args, db_path):
    from iad_core.analysis.delegation import AnalysisDelegation
    return AnalysisDelegation(AnalysisAgentJobs(workbench(db_path))).materials(args['run_id'], args['session_id']).model_dump(mode='json')


def analysis_agent_worker_report(args, db_path):
    from iad_core.analysis.delegation import AnalysisDelegation
    return AnalysisDelegation(AnalysisAgentJobs(workbench(db_path))).report(args['run_id'], args['session_id'], args['report']).model_dump(mode='json')


ANALYSIS_AGENT_OPERATIONS = (analysis_agent_configuration, analysis_agent_start, analysis_agent_snapshot,
    analysis_agent_wave, analysis_agent_worker_materials, analysis_agent_worker_report,
    analysis_agent_context, analysis_agent_session_location, analysis_agent_session_created, analysis_agent_media, analysis_agent_batch_materials, analysis_agent_crop, analysis_agent_reference,
    analysis_agent_commit, analysis_agent_model_call_start, analysis_agent_model_call_end, analysis_agent_capacity,
    analysis_agent_finish, analysis_agent_publication, analysis_agent_cancel, analysis_agent_resume, analysis_agent_interrupt,
    analysis_publication, analysis_evidence, analysis_current_evidence, analysis_current_sample_evidence, analysis_direction_choices, analysis_sources, analysis_agent_artifacts, analysis_agent_catalog, analysis_agent_history,
    analysis_agent_arguments, analysis_agent_claims, analysis_agent_finalization_context, analysis_agent_finalize,
    analysis_sample_evidence, analysis_observations)
