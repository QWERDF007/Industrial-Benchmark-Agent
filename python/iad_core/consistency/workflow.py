from iad_core.workbench.analysis_job_views import AnalysisJobViews
from iad_core.workbench.job_models import ChildJobError
from uuid import UUID, uuid5

from iad_core.consistency.gallery import GalleryQueries
from iad_core.consistency.group_analysis import GroupAnalyses
from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.consistency.group_analysis_models import GROUP_ANALYSIS_SCHEMA
from iad_core.consistency.models import ConsistencyStart
from iad_core.consistency.reports import ConsistencyReports
from iad_core.consistency.result_models import ConsistencyQuery


class ConsistencyWorkflow:
    """Freeze program candidates and analyze only their eligible visual groups."""

    def __init__(self, runtime, client):
        self.runtime, self.db = runtime, runtime.db
        self.analyses = GroupAnalyses(runtime,client)

    def execute(self, context):
        request = context.payload['request']
        plan = self.prepare(context)
        pending = set(context.payload['sample_ids']) - set(context.payload['completed_sample_ids']) - set(context.payload['failed_sample_ids'])
        self.finish(context,plan,pending)
        if pending:
            raise ValueError('所选范围仍有未完成检查的图像')
        state = AnalysisJobViews(self.db).status(context.run_id)
        completed = set(state['completed_sample_ids'])
        results = []
        for unit in request['units']:
            selected = set(unit['request']['sample_ids'])
            results.append(dict(dataset_id=unit['dataset_id'],run_id=context.payload['root_run_id'],
                status='COMPLETED' if selected<=completed else 'PARTIAL' if selected&completed else 'FAILED'))
        context.update(dataset_results=results,phase='CONSISTENCY_FINISHED')

    def prepare(self, context) -> list[dict]:
        request = context.payload['request']
        started = self.runtime.consistency.start(ConsistencyStart(
            subjects=dict(kind='datasets', dataset_ids=request['dataset_ids']),
            corpus_scope=dict(kind='datasets', dataset_ids=request['dataset_ids']), mode=request['submission']['mode'],
            min_similarity=request['submission']['min_similarity'],
            request_id=str(uuid5(UUID(request['submission']['submission_id']), 'program'))))
        if started.kind != 'started':
            raise ValueError('所选范围没有可比较图像')
        program = self.runtime.consistency.status(started.batch_id)
        if program.status not in ('PENDING', 'RUNNING', 'COMPLETED'):
            retried = self.runtime.consistency.retry(program.batch_id,
                request_id=str(uuid5(UUID(context.run_id.removeprefix('analysis_')), 'program-retry')))
            program = self.runtime.consistency.status(retried.batch_id)
        context.update(program_batch_id=program.batch_id, phase='COMPARING_SELECTED_DATASETS')
        try:
            while program.status in ('PENDING', 'RUNNING'):
                context.checkpoint()
                for child in program.children:
                    if child.status in ('PENDING', 'RUNNING'):
                        context.join(child.model_dump())
                context.cancel.wait(.1)
                program = self.runtime.consistency.status(program.batch_id)
        except InterruptedError:
            self.runtime.consistency.cancel(program.batch_id)
            raise
        context.checkpoint()
        pending = set(context.payload['sample_ids']) - set(context.payload['completed_sample_ids']) - set(context.payload['failed_sample_ids'])
        for child in program.children:
            for failure in child.errors:
                if failure.code == 'ANNOTATION_UNREADABLE':
                    continue
                if failure.sample_id in pending:
                    context.record(failure.sample_id, ChildJobError(child.model_dump(),message=failure.message,code=failure.code))
                    pending.remove(failure.sample_id)
        root = self.runtime.jobs.status(context.payload['root_run_id'])
        plan = root.get('gallery_plan')
        if plan is None:
            report = ConsistencyReports(self.db).report(ConsistencyQuery(selection=dict(kind='batch',batch_id=program.batch_id),
                page_size=1))
            plan = []
            for frozen in GalleryQueries(self.db).freeze_all(report.page.query_id,'conflicts'):
                group = frozen.group
                fingerprint = frozen.identity.fingerprint(GROUP_ANALYSIS_SCHEMA)
                context.checkpoint()
                plan.append(dict(group=group.model_dump(mode='json'),fingerprint=fingerprint))
        context.update(gallery_plan=plan, phase='ANALYZING_SELECTED_DATASETS')
        return plan

    def finish(self, context, plan: list[dict], pending: set[str]):
        requirements = {}
        for unit in plan:
            group = FrozenAnalysisGroup.model_validate(unit['group'])
            for image in [group.anchor, *[member.image for member in group.members]]:
                requirements.setdefault(image.sample.sample_id, set()).add(group.group_id)
        finished = set()
        submission = context.payload['request']['submission']
        unmatched = pending - requirements.keys()
        if unmatched:
            context.record(sorted(unmatched),no_candidate_sample_ids=sorted(unmatched))
            pending.difference_update(unmatched)
        context.update(phase='ANALYZING_CONFLICT_GROUPS', total_gallery_groups=len(plan), completed_gallery_groups=0)
        for unit in plan:
            context.checkpoint()
            group = FrozenAnalysisGroup.model_validate(unit['group'])
            members = {group.anchor.sample.sample_id, *[member.image.sample.sample_id for member in group.members]}
            if not pending.intersection(members):
                continue
            try:
                started = self.analyses.start_frozen(group, unit['fingerprint'],
                    context.payload['root_run_id']+'_gallery_'+group.group_id,
                    submission['candidate_batch_size'], instruction=submission['instruction'])
                child = self.runtime.jobs.status(started.run_id)
                if child['status'] not in ('PENDING','RUNNING','COMPLETED'):
                    child = self.analyses.retry(child['run_id'])
                child = context.join(child)
                if child['status'] != 'COMPLETED':
                    raise ChildJobError(child)
                finished.add(group.group_id)
                ready = {sid for sid in pending if requirements.get(sid) and requirements[sid] <= finished}
                if ready:
                    context.record(sorted(ready))
                    pending.difference_update(ready)
                context.update(completed_gallery_groups=len(finished), active_batch_run_id=None)
            except InterruptedError:
                raise
            except Exception as error:
                affected = pending & members
                if affected:
                    context.record(sorted(affected), error)
                    pending.difference_update(affected)
