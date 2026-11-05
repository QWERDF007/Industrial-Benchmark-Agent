from iad_core.workbench.job_models import failure_message
import hashlib
from uuid import UUID, uuid4

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.group_models import GalleryImage, GalleryMember, GalleryComparison, FrozenAnalysisGroup
from iad_core.consistency.group_analysis import GroupAnalyses
from iad_core.consistency.group_analysis_inputs import GroupAnalysisInputs
from iad_core.consistency.group_analysis_models import GROUP_ANALYSIS_SCHEMA, DEFAULT_CANDIDATE_BATCH_SIZE
from iad_core.consistency.models import ConsistencyScopesSnapshot, DatasetScope, ScopeSelector
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.evidence.sources import SampleContent
from iad_core.consistency.group_analysis_prompts import DEFAULT_CONSISTENCY_PROMPT


class ConsistencyModelStart(AnalysisModel):
    submission_id: UUID = Field(default_factory=uuid4)
    subjects: ScopeSelector
    batch_size: int = Field(default=6, ge=2, le=200)
    candidate_batch_size: int = Field(default=DEFAULT_CANDIDATE_BATCH_SIZE, ge=1, le=200)
    seed: int = 0
    instruction: NonBlankText = DEFAULT_CONSISTENCY_PROMPT


class ConsistencyModelBatches:
    """Compare every frozen subject in joint visual batches, including nonidentical images."""

    def __init__(self, runtime, client):
        self.runtime, self.db, self.client = runtime, runtime.db, client
        self.jobs, self.scopes = runtime.jobs, ConsistencyScopes(runtime.db)
        self.analyses = GroupAnalyses(runtime, client)

    def start(self, request: ConsistencyModelStart | dict, *, model_name: str | None = None) -> dict:
        request = ConsistencyModelStart.model_validate(request)
        submission = request.model_dump(mode='json')
        if existing := self.jobs.submitted('CONSISTENCY_MODEL_BATCH', submission):
            return existing
        payload = self.prepare(request, model_name=model_name)
        return self.jobs.start('CONSISTENCY_MODEL_BATCH',payload['task_id'],payload,self.execute,'准备完整范围标注一致性模型分析')

    def prepare(self, request: ConsistencyModelStart | dict, *, model_name: str | None = None) -> dict:
        request = ConsistencyModelStart.model_validate(request)
        submission = request.model_dump(mode='json')
        subjects = self.scopes.resolve(request.subjects)
        scopes = self.scopes.freeze(request.subjects, DatasetScope(dataset_ids=subjects.dataset_ids))
        sources = scopes.subjects.samples
        if len(sources) < 2:
            raise ValueError('标注一致性联合分析至少需要两张真实图像')
        ids = sorted((source.sample_id for source in sources), key=lambda sid: hashlib.sha256(f'{request.seed}:{sid}'.encode()).digest())
        batches = [dict(source_ids=ids[start:start+request.batch_size], images=ids[start:start+request.batch_size])
                   for start in range(0,len(ids),request.batch_size)]
        if len(batches[-1]['images']) == 1:
            batches[-1]['images'] = [ids[0],*batches[-1]['images']]
        payload = dict(submission,submission=submission,dataset_id=sources[0].dataset_id,task_id=sources[0].task_id,sample_ids=ids,
            consistency_scopes=scopes.model_dump(mode='json'),batches=batches,
            input_sources=[source.model_dump() for source in SampleContent.capture_many(self.db,ids)],
            analysis_schema=GROUP_ANALYSIS_SCHEMA,model_profile=self.client.profile.model_dump(),
            model_name=self.client.resolve_model(model_name))
        return payload

    def validate(self, request):
        if request['analysis_schema'] != GROUP_ANALYSIS_SCHEMA or request['model_profile'] != self.client.profile.model_dump():
            raise ValueError('一致性模型输入契约或配置已变化，请建立新范围')
        scopes = ConsistencyScopesSnapshot.model_validate(request['consistency_scopes'])
        self.scopes.assert_current(scopes.subjects)
        current = [source.model_dump() for source in SampleContent.capture_many(self.db,[source['sample_id'] for source in request['input_sources']])]
        if current != request['input_sources']:
            raise ValueError('冻结一致性来源已变化，请建立新范围')
        ids = [sid for batch in request['batches'] for sid in batch['source_ids']]
        if len(ids) != len(set(ids)) or set(ids) != {source.sample_id for source in scopes.subjects.samples}:
            raise ValueError('一致性批次须无遗漏、无重复地覆盖冻结范围')
        return scopes

    def retry(self, run_id: str) -> dict:
        return self.jobs.retry(run_id,('CONSISTENCY_MODEL_BATCH',),self.execute,validate=self.validate)

    def execute(self, context):
        request = context.payload['request']
        scopes = self.validate(request)
        expected = {source['sample_id']:source for source in request['input_sources']}
        pending, completed = set(request['sample_ids']), 0
        context.update(phase='ANALYZING_CONSISTENCY_BATCHES',total_batches=len(request['batches']),completed_batches=0)
        for index,batch in enumerate(request['batches']):
            context.checkpoint()
            selected = [sid for sid in batch['source_ids'] if sid in pending]
            if not selected:
                completed += 1
                continue
            request_id = context.payload['root_run_id'] + '_group_' + str(index)
            try:
                self.scopes.assert_current(scopes.subjects)
                if [source.model_dump() for source in SampleContent.capture_many(self.db,batch['images'])] != [expected[sid] for sid in batch['images']]:
                    raise ValueError('当前图组来源与冻结范围不一致')
                with self.db.connection() as connection:
                    previous = connection.execute('''SELECT job_id FROM job_runs WHERE job_type='CONSISTENCY_ANALYSIS'
                        AND json_extract(payload_json,'$.request.analysis_request_id')=? ORDER BY id DESC LIMIT 1''',(request_id,)).fetchone()
                if previous:
                    child = self.jobs.status(previous[0])
                    if child['status'] not in ('PENDING','RUNNING','COMPLETED'):
                        child = self.analyses.retry(child['run_id'])
                else:
                    anchor = batch['images'][0]
                    members, anchor_image = [], None
                    for candidate in batch['images'][1:]:
                        context.checkpoint()
                        pair = self.runtime.consistency_service.compare(ConsistencyCompare(sample_a=anchor,sample_b=candidate),
                            checkpoint=context.checkpoint,frozen_scopes=scopes)
                        saved = self.runtime.consistency_service.evidence(pair.evidence_id)
                        anchor_image = GalleryImage(sample=saved.sources.left.sample,evidence_id=pair.evidence_id,side='left',available=True)
                        members.append(GalleryMember(image=GalleryImage(sample=saved.sources.right.sample,evidence_id=pair.evidence_id,side='right',available=True),
                            comparison=GalleryComparison(evidence_id=pair.evidence_id,result_id=pair.result_id,anchor_side='left')))
                    group = FrozenAnalysisGroup(kind='groups',group_id=request_id,facts_state='CURRENT',anchor=anchor_image,members=members)
                    fingerprint = hashlib.sha256((GROUP_ANALYSIS_SCHEMA+GroupAnalysisInputs.fingerprint(group)).encode()).hexdigest()
                    started = self.analyses.start_frozen(group,fingerprint,request_id,request['candidate_batch_size'],
                        instruction=request['instruction'])
                    child = self.jobs.status(started.run_id)
                child = context.join(child)
                if child['status'] != 'COMPLETED':
                    raise ValueError(f"一致性图组未完成（{child['run_id']}）："+failure_message(child['errors']))
                completed += 1
                context.record(selected,completed_batches=completed,active_batch_run_id=None)
            except InterruptedError:
                raise
            except Exception as error:
                context.record(selected,error,active_batch_run_id=None)
        context.update(completed_batches=completed,phase='CONSISTENCY_MODEL_BATCHES_FINISHED')
