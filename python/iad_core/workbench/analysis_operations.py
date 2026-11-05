from iad_core.workbench.runtime import workbench
from iad_core.workbench.analysis_job_views import AnalysisJobViews
from iad_core.storage.database import Database
from iad_core.workbench.job_snapshots import JobSnapshots


def analysis_start(args, db_path):
    return workbench(db_path).invoke_model(args.get('_model_execution'), lambda services:
        services.analysis_workflows.start(args['request'], model_name=args.get('model_name')))


def analysis_list(args, db_path):
    return {'jobs': AnalysisJobViews(Database(db_path)).list(args['dataset_id'], args['analysis_kind'])}


def analysis_status(args, db_path):
    views = AnalysisJobViews(Database(db_path))
    return views.summary(views.status(args['run_id']))


def analysis_node(args, db_path):
    return JobSnapshots(Database(db_path)).snapshot(args['run_id']).model_dump()


def analysis_results(args, db_path):
    from iad_core.exploration.repository import ExplorationRepository
    from iad_core.exploration.models import ExplorationResults
    db = Database(db_path)
    state = AnalysisJobViews(db).status(args['run_id'])
    repository = ExplorationRepository(db)
    return ExplorationResults(snapshots=[repository.get(item['exploration_version_id'])
        for item in state['dataset_results'] if item.get('exploration_version_id')],
        removed_direction_ids=repository.removed_ids(state['dataset_ids'])).model_dump()


def analysis_cancel(args, db_path):
    jobs = workbench(db_path).jobs
    latest = AnalysisJobViews(jobs.db).status(args['run_id'])
    return jobs.cancel(latest['run_id'], ('ANALYSIS_WORKFLOW',))


def analysis_retry(args, db_path):
    return workbench(db_path).invoke_model(args.get('_model_execution'),
        lambda services: services.analysis_workflows.retry(args['run_id']), args['run_id'])


def analysis_delete(args, db_path):
    jobs = workbench(db_path).jobs
    latest = AnalysisJobViews(jobs.db).status(args['run_id'])
    return jobs.delete(latest['run_id'], ('ANALYSIS_WORKFLOW',), family=True)
