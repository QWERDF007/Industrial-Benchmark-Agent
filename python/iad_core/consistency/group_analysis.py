import json

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.gallery import GalleryQueries, GalleryReference
from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.consistency.group_analysis_states import GroupAnalysisStates
from iad_core.consistency.result_models import ResultSelection
from iad_core.consistency.group_analysis_models import (GROUP_ANALYSIS_SCHEMA, DEFAULT_CANDIDATE_BATCH_SIZE,
    GroupAnalysisDraft, GroupAnalysisStart, GroupAnalysisView, GroupAnalysisBatch)
from iad_core.consistency.group_analysis_inputs import GroupAnalysisInputs
from iad_core.consistency.group_analysis_contract import GroupAnalysisContract
from iad_core.consistency.group_analysis_synthesis import GroupAnalysisSynthesis
from iad_core.consistency.group_analysis_validation import GroupAnalysisValidation
from iad_core.storage.database import Database
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient, ModelCapacityError
from iad_core.consistency.group_analysis_prompts import DEFAULT_CONSISTENCY_PROMPT


class GroupAnalysisQueries:
    def __init__(self, db: Database):
        self.db = db

    def read(self, reference: GalleryReference) -> GroupAnalysisView:
        frozen = GalleryQueries(self.db).freeze(reference)
        record = GroupAnalysisStates(self.db).read(frozen.selection,[frozen.identity]).get(frozen.identity.key)
        if record is None:
            return GroupAnalysisView(group_id=reference.group_id, status='NOT_ANALYZED')
        with self.db.connection() as connection:
            row = connection.execute('SELECT * FROM job_runs WHERE job_id=?',(record.run_id,)).fetchone()
        return self.view(row)

    @staticmethod
    def view(row) -> GroupAnalysisView:
        payload = json.loads(row['payload_json'])
        result = GroupAnalysisDraft.model_validate(payload['group_analysis']) if row['status'] == 'COMPLETED' else None
        return GroupAnalysisView(completed_batches=payload.get('completed_batches',0), total_batches=payload.get('total_batches'), group_id=payload['request']['frozen_group']['group_id'], status=row['status'], run_id=row['job_id'],
            model_name=payload['request']['model_name'], result=result,
            error=(payload['errors'][0]['message'] if payload['errors'] else row['message']) if row['status'] in ('FAILED','PARTIAL','CANCELLED','INTERRUPTED') else None)


class GroupAnalyses(GroupAnalysisQueries):
    def __init__(self, runtime: WorkbenchRuntime, client: VlmClient | None = None):
        super().__init__(runtime.db)
        self.runtime, self.client = runtime, client
        self.inputs = GroupAnalysisInputs(runtime)
        self.validation = GroupAnalysisValidation(self.db)

    def start(self, request: GroupAnalysisStart, origin_session_id: str | None = None) -> GroupAnalysisView:
        request = GroupAnalysisStart.model_validate(request)
        frozen = GalleryQueries(self.db).freeze(request)
        return self.start_frozen(frozen.group, frozen.identity.fingerprint(GROUP_ANALYSIS_SCHEMA), request.request_id, request.batch_size, origin_session_id,
            instruction=request.instruction,selection=frozen.selection)

    def start_frozen(self, group: FrozenAnalysisGroup, fingerprint: str, request_id: str,
                     batch_size: int = DEFAULT_CANDIDATE_BATCH_SIZE, origin_session_id: str | None = None, instruction: str | None = None, selection: ResultSelection | None = None) -> GroupAnalysisView:
        analysis_selection = selection.model_dump(mode='json') if selection else None
        instruction = DEFAULT_CONSISTENCY_PROMPT if instruction is None else instruction
        if self.client is None:
            raise ValueError('A resolved workbench model is required to analyze a group')
        members = [member.image.sample.sample_id for member in group.members]
        if not members or len(set(members)) != len(members) or group.anchor.sample.sample_id in members:
            raise ConsistencyError('INVALID_SCOPE', '图组须包含固定主图及无重复候选')
        with self.runtime.jobs.lock:
            with self.db.connection() as connection:
                previous = connection.execute('''SELECT * FROM job_runs WHERE job_type='CONSISTENCY_ANALYSIS'
                    AND json_extract(payload_json,'$.request.analysis_request_id')=? ORDER BY id DESC LIMIT 1''', (request_id,)).fetchone()
            if previous is not None:
                original = json.loads(previous['payload_json'])['request']
                if (original['group_fingerprint'] != fingerprint or original.get('analysis_batch_size') != batch_size
                    or original.get('analysis_instruction') != instruction or original.get('analysis_selection') != analysis_selection):
                    raise ConsistencyError('INVALID_SCOPE', 'Analysis request_id belongs to a different frozen group or batch policy')
                return self.view(previous)
            sample = group.anchor.sample
            started = self.runtime.jobs.start('CONSISTENCY_ANALYSIS', sample.task_id,
                dict(dataset_id=sample.dataset_id, sample_ids=[sample.sample_id, *members],
                    analysis_request_id=request_id, group_fingerprint=fingerprint, analysis_schema=GROUP_ANALYSIS_SCHEMA,
                    analysis_instruction=instruction,analysis_selection=analysis_selection,
                    frozen_group=group.model_dump(mode='json'), frozen_group_sha256=self.inputs.fingerprint(group),
                    analysis_batch_size=batch_size, analysis_plan=[members[start:start+batch_size] for start in range(0,len(members),batch_size)],
                    model_name=self.client.resolve_model(), model_profile=self.client.profile.model_dump(), origin_session_id=origin_session_id),
                self.execute, '正在分析冻结图组')
            with self.db.connection() as connection:
                row = connection.execute('SELECT * FROM job_runs WHERE job_id=?', (started['run_id'],)).fetchone()
            return self.view(row)

    def validate_request(self, request):
        if self.client is None:
            raise ValueError('A resolved workbench model is required to analyze a group')
        if request['analysis_schema'] != GROUP_ANALYSIS_SCHEMA or request['model_profile'] != self.client.profile.model_dump():
            raise ValueError('图组输入契约或模型配置已变化，请建立新作业')
        group = FrozenAnalysisGroup.model_validate(request['frozen_group'])
        if self.inputs.fingerprint(group) != request['frozen_group_sha256']:
            raise ValueError('冻结图组内容已变化')
        return group

    def retry(self, run_id: str) -> dict:
        previous = self.runtime.jobs.status(run_id, ('CONSISTENCY_ANALYSIS',))
        return self.runtime.jobs.retry(run_id, ('CONSISTENCY_ANALYSIS',), self.execute, validate=self.validate_request,
            prepare_request=lambda payload: dict(payload, analysis_plan=previous.get('analysis_plan',payload['analysis_plan']),
                prior_group_batches=previous.get('group_analysis_batches',[]), prior_summary_steps=previous.get('group_summary_steps',[])))

    def execute(self, context: JobContext):
        group = self.validate_request(context.payload['request'])
        members = {member.image.sample.sample_id:member for member in group.members}
        batches = list(context.payload['analysis_plan'])
        if [sid for batch in batches for sid in batch] != list(members):
            raise ValueError('冻结批次须无遗漏、无重复地覆盖全部候选')
        cached = {tuple(item.candidate_ids):item for value in context.payload.get('prior_group_batches',[])
                  if (item := GroupAnalysisBatch.model_validate(value))}
        results, pending, index = [], set(context.payload['sample_ids']), 0
        context.update(phase='ANALYZING_GROUP_BATCHES', total_batches=len(batches), completed_batches=0)
        while index < len(batches):
            context.checkpoint()
            ids = batches[index]
            subset = group.model_copy(update={'members':[members[sid] for sid in ids]})
            try:
                prepared = self.inputs.prepare(context, subset)
                fingerprint = self.inputs.input_fingerprint(prepared.instruction(prepared.facts), prepared.images)
                batch = cached.get(tuple(ids))
                if batch is None:
                    response_type = self.validation.response_type(GroupAnalysisDraft, subset)
                    contract = GroupAnalysisContract(response_type, group, prepared.images)
                    contract.record(context, fingerprint)
                    plan = self.client.plan(contract.response_type, prepared.instruction(contract.encode(prepared.facts)),
                        contract.images, context.payload['model_name'])
            except (ConsistencyError, ModelCapacityError) as error:
                if isinstance(error, ConsistencyError) and error.code != 'RESOURCE_LIMIT':
                    raise
                if len(ids) < 2:
                    raise
                middle = len(ids)//2
                batches[index:index+1] = [ids[:middle],ids[middle:]]
                context.update(analysis_plan=batches,total_batches=len(batches))
                continue
            if batch is None:
                context.checkpoint()
                result = self.client.generate(plan)
                batch = GroupAnalysisBatch(run_id=context.run_id,candidate_ids=ids,input_fingerprint=fingerprint,result=result)
            else:
                self.validation.validate(batch.result,subset)
            if batch.input_fingerprint != fingerprint:
                raise ValueError('已完成批次的图像、标注或复核上下文已变化，请建立新作业')
            results.append(batch)
            values = dict(group_analysis_batches=[item.model_dump(mode='json') for item in results],
                          completed_batches=index+1,total_batches=len(batches),analysis_plan=batches)
            selected = [sid for sid in ids if sid in pending]
            if selected:
                context.record(selected,**values)
                pending.difference_update(selected)
            else:
                context.update(**values)
            index += 1
        context.update(phase='SUMMARIZING_GROUP_BATCHES')
        summary = GroupAnalysisSynthesis(self.client,self.validation).summarize(context,group,results)
        final = GroupAnalysisDraft(**summary.model_dump(),assessments=[item for batch in results for item in batch.result.assessments])
        self.validation.validate(final,group)
        context.record(group.anchor.sample.sample_id,group_analysis=final.model_dump(mode='json'),message='图组模型分析已保存')
