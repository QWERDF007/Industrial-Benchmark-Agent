from iad_core.workbench.runtime import workbench
from iad_core.workbench.analysis_job_views import AnalysisJobViews
from iad_core.storage.database import Database
from iad_core.workbench.job_snapshots import JobSnapshots


def analysis_start(args, db_path):
    raise ValueError('分析作业需要原生宿主，请通过 /api/iad/analysis/start 提交')


def analysis_list(args, db_path):
    return {'jobs': AnalysisJobViews(Database(db_path)).list(args['dataset_id'], args['analysis_kind'])}


def analysis_status(args, db_path):
    return AnalysisJobViews(Database(db_path)).view(args['run_id'])


def analysis_node(args, db_path):
    return JobSnapshots(Database(db_path)).snapshot(args['run_id']).model_dump()


def analysis_results(args, db_path):
    from iad_core.analysis.models import AnalysisResults
    from iad_core.analysis.queries import AnalysisQueries
    db = Database(db_path)
    state = AnalysisJobViews(db).status(args['run_id'])
    return AnalysisResults(publication=AnalysisQueries(db).view(state['analysis_version_id']) if state['analysis_version_id'] else None).model_dump(mode='json')


def analysis_cancel(args, db_path):
    jobs = workbench(db_path).jobs
    latest = AnalysisJobViews(jobs.db).status(args['run_id'])
    return jobs.cancel(latest['run_id'], ('ANALYSIS_WORKFLOW',))


def analysis_retry(args, db_path):
    raise ValueError('分析作业须由原生宿主继续，请通过 /api/iad/analysis/retry 提交')


def analysis_delete(args, db_path):
    jobs = workbench(db_path).jobs
    latest = AnalysisJobViews(jobs.db).status(args['run_id'])
    return jobs.delete(latest['run_id'], ('ANALYSIS_WORKFLOW',), family=True)
