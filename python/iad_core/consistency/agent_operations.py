from pathlib import Path
from tempfile import NamedTemporaryFile
from contextlib import contextmanager

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_results import ConsistencyAgentResults
from iad_core.consistency.group_review import ConsistencyGroupReview
from iad_core.storage.database import Database
from iad_core.workbench.analysis_job_views import AnalysisJobViews
from iad_core.workbench.runtime import workbench


def consistency_agent_start(args, db_path):
    return ConsistencyAgentJobs(workbench(db_path)).start(args['request'], roles=args.get('roles'), configuration=args.get('configuration'))


def consistency_agent_configuration(args, db_path):
    return ConsistencyAgentJobs(workbench(db_path)).configuration().model_dump(mode='json')


def consistency_agent_prepare(args, db_path):
    from iad_core.consistency.agent_preparation import ConsistencyAgentPreparation
    batch = ConsistencyAgentPreparation(workbench(db_path)).prepare(args['run_id'])
    return {'preparation': batch.summary().model_dump(mode='json') if batch is not None else None}


def consistency_agent_trace_event(args, db_path):
    return ConsistencyAgentJobs(workbench(db_path)).trace_event(args['run_id'], args['anchor_id']).model_dump(mode='json')


def consistency_agent_trace_status(args, db_path):
    return ConsistencyAgentJobs(workbench(db_path)).trace_status(args['run_id'], args['anchor_id'], args.get('error')).model_dump(mode='json')


def consistency_agent_snapshot(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).snapshot(args['run_id']).model_dump(mode='json')


def consistency_agent_anchors(args, db_path):
    return {'anchors': [item.model_dump(mode='json') for item in ConsistencyAgentResults(Database(db_path)).anchors(args['run_id'])]}


def consistency_agent_anchor(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).anchor(args['run_id'], args['anchor_id']).model_dump(mode='json')


def consistency_agent_session_location(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).session_location(args['session_id']).model_dump(mode='json')


def consistency_agent_model_call_start(args, db_path):
    from iad_core.workbench.calls import ModelCalls, NativeModelCallStart
    runtime = workbench(db_path)
    checks = ConsistencyAgentJobs(runtime)
    anchor = checks.attempt(args['run_id'], args['anchor_id'], args['attempt'])
    checks.phase(args['run_id'], args['anchor_id'], 'AGENT_REVIEWING')
    ModelCalls(runtime.db).start_native(args['run_id'], NativeModelCallStart.model_validate(args['request']),
        sample_id=anchor.anchor_id, session_id=anchor.session_id, attempt=anchor.attempt)
    return {}


def consistency_agent_model_call_end(args, db_path):
    from iad_core.workbench.calls import ModelCalls, NativeModelCallEnd
    ModelCalls(Database(db_path)).finish_native(args['run_id'], args['anchor_id'], NativeModelCallEnd.model_validate(args['result']))
    return {}


def consistency_agent_detail(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).detail(args['run_id'], args['anchor_id']).model_dump(mode='json')


def consistency_agent_media(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).media(args['run_id'], args['anchor_id'], args['media_id'])


def consistency_agent_diagnostics(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).diagnostics(args['run_id'], args['anchor_id']).model_dump(mode='json')


def consistency_agent_results(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).page(args['run_id'], page=int(args.get('page', 1)),
        page_size=int(args.get('page_size', 18))).model_dump(mode='json')


def consistency_agent_report(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).report(args['run_id']).model_dump(mode='json')


def consistency_agent_gallery(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).gallery(args['run_id'], page=int(args.get('page', 1)),
        page_size=int(args.get('page_size', 200))).model_dump(mode='json')


def consistency_agent_images(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).images(args['run_id'], page=int(args.get('page', 1)),
        page_size=int(args.get('page_size', 18))).model_dump(mode='json')


def consistency_agent_members(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).members(args['run_id'], args['anchor_id']).model_dump(mode='json')


def consistency_agent_candidates(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).candidates(args['run_id'], args['anchor_id']).model_dump(mode='json')


def consistency_agent_review(args, db_path):
    return ConsistencyGroupReview(Database(db_path)).context(args['run_id'], args['anchor_id']).model_dump(mode='json')


def consistency_agent_review_submit(args, db_path):
    return ConsistencyGroupReview(Database(db_path)).submit(args['run_id'], args['anchor_id'], args['request']).model_dump(mode='json')


def consistency_agent_analysis(args, db_path):
    return ConsistencyAgentResults(Database(db_path)).analysis(args['run_id'], args['anchor_id']).model_dump(mode='json')


def consistency_agent_export(args, db_path):
    with NamedTemporaryFile(mode='w', encoding='utf-8', prefix='iad-consistency-', suffix='.jsonl', delete=False) as output:
        try:
            ConsistencyAgentResults(Database(db_path)).export(args['run_id'], output)
        except BaseException:
            Path(output.name).unlink()
            raise
    return {'path': output.name, 'filename': args['run_id'] + '.jsonl'}


def consistency_agent_session_created(args, db_path):
    return ConsistencyAgentJobs(workbench(db_path)).session_created(args['run_id'], args['anchor_id']).model_dump(mode='json')


def consistency_agent_retrieve(args, db_path):
    return ConsistencyAgentJobs(workbench(db_path)).retrieve(args['run_id'], args['anchor_id']).model_dump(mode='json')


def consistency_agent_submit_empty(args, db_path):
    return ConsistencyAgentJobs(workbench(db_path)).submit_empty(args['run_id'], args['anchor_id'], attempt=args.get('attempt', 1)).model_dump(mode='json')


def consistency_agent_failure(args, db_path):
    return ConsistencyAgentJobs(workbench(db_path)).fail(args['run_id'], args['anchor_id'],
        args['message'], args.get('code'), attempt=args.get('attempt', 1),
        source_run_id=args.get('source_run_id'), source_phase=args.get('source_phase')).model_dump(mode='json')


def consistency_agent_cancel(args, db_path):
    return ConsistencyAgentJobs(workbench(db_path)).cancel(args['run_id'])


def consistency_agent_resume(args, db_path):
    return ConsistencyAgentJobs(workbench(db_path)).resume(args['run_id'])


def consistency_agent_interrupt(args, db_path):
    return ConsistencyAgentJobs(workbench(db_path)).interrupt(args['run_id'])


def consistency_agent_finish(args, db_path):
    runtime = workbench(db_path)
    job = runtime.jobs.finish_external(args['run_id'])
    return AnalysisJobViews(runtime.db).view(job['run_id'])


def consistency_agent_context(args, db_path):
    from iad_core.consistency.workflow import ConsistencyWorkflow
    if args.get('_model_execution'):
        with _visual_review(args, db_path) as review:
            return ConsistencyWorkflow(review.runtime, review.client).context(args['run_id'], args['anchor_id'], args.get('query', {}), attempt=args.get('attempt', 1))
    return ConsistencyWorkflow(workbench(db_path)).context(args['run_id'], args['anchor_id'], args.get('query', {}), attempt=args.get('attempt', 1))


@contextmanager
def _visual_review(args, db_path):
    from iad_core.consistency.agent_review import ConsistencyAgentReview
    from iad_core.workbench.model_settings import ModelExecution
    from iad_core.workbench.vision import VlmClient
    runtime = workbench(db_path)
    execution = ModelExecution.model_validate(args['_model_execution'])
    frozen = ConsistencyAgentJobs(runtime).snapshot(args['run_id']).roles.vision
    if frozen.profile != execution.profile:
        raise ValueError('视觉调用必须使用作业冻结的角色配置')
    client = VlmClient(profile=execution.profile, api_key=execution.api_key.get_secret_value() if execution.api_key else None)
    try:
        yield ConsistencyAgentReview(runtime, client)
    finally:
        client.close()


def consistency_agent_plan(args, db_path):
    with _visual_review(args, db_path) as review:
        return review.plan(args['run_id'], args['anchor_id'], attempt=args.get('attempt', 1)).model_dump(mode='json')


def consistency_agent_verify(args, db_path):
    from iad_core.consistency.workflow import ConsistencyWorkflow
    with _visual_review(args, db_path) as review:
        return ConsistencyWorkflow(review.runtime, review.client).prepare(args['run_id'], args['anchor_id'], attempt=args.get('attempt', 1))


def consistency_agent_capacity(args, db_path):
    from iad_core.workbench.calls import ModelCalls
    from iad_core.workbench.model_settings import ModelExecution
    from iad_core.workbench.vision import VlmClient
    runtime = workbench(db_path)
    checks = ConsistencyAgentJobs(runtime)
    checks.attempt(args['run_id'], args['anchor_id'], args['attempt'])
    execution = ModelExecution.model_validate(args['_model_execution'])
    frozen = checks.snapshot(args['run_id']).roles.agent
    if frozen.profile != execution.profile:
        raise ValueError('Agent 容量计量必须使用作业冻结的角色配置')
    if args['body']['model'] != execution.profile.model_id:
        raise ValueError('Agent 容量计量模型与冻结角色不一致')
    client = VlmClient(profile=execution.profile, api_key=execution.api_key.get_secret_value() if execution.api_key else None)
    try:
        with ModelCalls(runtime.db).bind(args['run_id'], role='agent', sample_id=args['anchor_id']):
            return client.token_budget(args['body'], execution.profile.max_output_tokens,
                'ConsistencyAgent').model_dump(mode='json')
    finally:
        client.close()


def consistency_agent_observe(args, db_path):
    from iad_core.consistency.workflow import ConsistencyWorkflow
    with _visual_review(args, db_path) as review:
        return ConsistencyWorkflow(review.runtime, review.client).observe(args['run_id'], args['anchor_id'], args['request'], attempt=args.get('attempt', 1))


def consistency_agent_assess(args, db_path):
    from iad_core.consistency.workflow import ConsistencyWorkflow
    return ConsistencyWorkflow(workbench(db_path)).assess(args['run_id'], args['anchor_id'], args['submission'], attempt=args.get('attempt', 1))


def consistency_agent_submit(args, db_path):
    from iad_core.consistency.workflow import ConsistencyWorkflow
    return ConsistencyWorkflow(workbench(db_path)).submit(args['run_id'], args['anchor_id'], args['submission'], attempt=args.get('attempt', 1))
