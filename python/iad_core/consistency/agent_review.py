from typing import TYPE_CHECKING
from uuid import uuid4

from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
from iad_core.consistency.agent_assessments import AnchorAssessments
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_models import ModelReviewedResult
from iad_core.consistency.agent_review_models import (AnchorAssessmentInput, AnchorAssessmentRecord, AnchorAssessmentSubmission, AnchorDraftSubmission, AnchorObservation, AnchorVisualPlan, AnchorVisualRequest,
    AnchorReviewSubmission, AnchorVisualResult, AnchorVisualStart, VISUAL_REQUEST_ID_RULE)
from iad_core.consistency.agent_visual_inputs import AnchorVisualInput
from iad_core.consistency.agent_visual_pages import AnchorVisualPages
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.consistency.group_analysis_contract import GroupAnalysisContract
from iad_core.consistency.group_analysis_validation import GroupAnalysisValidation
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


class ConsistencyAgentReview:
    def __init__(self, runtime: 'WorkbenchRuntime', client: VlmClient | None = None):
        self.runtime, self.db, self.client = runtime, runtime.db, client
        self.checks = ConsistencyAgentJobs(runtime)

    def plan(self, run_id: str, anchor_id: str, *, attempt: int = 1) -> AnchorVisualPlan:
        if self.client is None:
            raise ValueError('视觉分页需要冻结的视觉模型客户端')
        return AnchorVisualPages(self.runtime, self.client).plan(run_id, anchor_id, attempt=attempt)

    def observe(self, run_id: str, anchor_id: str, request: dict | AnchorVisualStart, *, attempt: int = 1) -> AnchorObservation:
        request = AnchorVisualStart.model_validate(request)
        if self.client is None:
            raise ValueError('视觉观察需要冻结的视觉模型客户端')
        anchor = self.checks.attempt(run_id, anchor_id, attempt)
        if anchor.candidates is None or anchor.candidates.fingerprint != request.fingerprint:
            raise ValueError('视觉请求与本场冻结候选指纹不一致')
        if anchor.visual_plan is not None:
            planned = next((page for page in anchor.visual_plan.pages if page.request_id == request.request_id), None)
            if planned is not None and planned != request:
                raise ValueError('冻结页request_id必须保持该页完整参数，不得拆分候选。补充观察须使用新的request_id。')
        if len(set(request.candidate_ids)) != len(request.candidate_ids):
            raise ValueError('视觉请求候选不可重复')
        with self.db.connection() as connection:
            saved = connection.execute('''SELECT request_json,observation_json FROM consistency_visual_requests
                WHERE job_id=? AND anchor_id=? AND request_id=?''', (run_id, anchor_id, request.request_id)).fetchone()
        if saved is not None:
            original = AnchorVisualRequest.model_validate_json(saved['request_json'])
            if original.model_dump(include=set(AnchorVisualStart.model_fields)) != request.model_dump():
                raise ValueError('视觉请求ID已用于不同输入。' + VISUAL_REQUEST_ID_RULE)
            if saved['observation_json'] is not None:
                return AnchorObservation.model_validate_json(saved['observation_json'])
        context = JobContext(self.runtime.jobs, run_id, self.runtime.jobs.status(run_id), self.runtime.jobs.cancelled[run_id])
        context.checkpoint()
        self.checks.phase(run_id, anchor_id, 'OBSERVING_ANCHOR')
        inputs = AnchorVisualInput.prepare(self.runtime, run_id, anchor_id, request, context.checkpoint)
        if saved is None:
            with self.db.connection() as connection:
                connection.execute('''INSERT INTO consistency_visual_requests(job_id,anchor_id,request_id,request_json)
                    VALUES(?,?,?,?)''', (run_id, anchor_id, request.request_id, inputs.request.model_dump_json()))
        with ModelCalls(self.db).bind(run_id, context.checkpoint, role='vision', request_id=request.request_id):
            plan = inputs.plan(self.client)
            context.checkpoint()
            result = self.client.generate(plan)
        context.checkpoint()
        observed = AnchorObservation(observation_id='observation_' + uuid4().hex, request=inputs.request,
            result=AnchorVisualResult.model_validate(result.model_dump()))
        with self.db.connection() as connection:
            changed = connection.execute('''UPDATE consistency_visual_requests SET observation_json=?
                WHERE job_id=? AND anchor_id=? AND request_id=? AND EXISTS (
                    SELECT 1 FROM consistency_anchor_runs WHERE job_id=? AND anchor_id=? AND attempt=? AND state='RUNNING')''',
                (observed.model_dump_json(), run_id, anchor_id, request.request_id, run_id, anchor_id, attempt))
            if not changed.rowcount:
                raise ValueError('过期的主图审核 attempt')
        self.checks.phase(run_id, anchor_id, 'AWAITING_SUBMISSION')
        return observed

    def observations(self, run_id: str, anchor_id: str) -> list[AnchorObservation]:
        self.checks.anchor(run_id, anchor_id)
        with self.db.connection() as connection:
            rows = connection.execute('''SELECT observation_json FROM consistency_visual_requests
                WHERE job_id=? AND anchor_id=? AND observation_json IS NOT NULL ORDER BY rowid''',
                (run_id, anchor_id)).fetchall()
        return [AnchorObservation.model_validate_json(row[0]) for row in rows]

    def assessments(self, run_id: str, anchor_id: str) -> list[AnchorAssessmentRecord]:
        self.checks.anchor(run_id, anchor_id)
        with self.db.connection() as connection:
            return AnchorAssessments.list(connection, run_id, anchor_id)

    def assess(self, run_id: str, anchor_id: str, submission: dict | AnchorAssessmentInput, *, attempt: int = 1) -> AnchorAssessmentRecord:
        submission = AnchorAssessmentInput.model_validate(submission)
        identity = submission.assessment.candidate_id
        group = ConsistencyAgentEvidence(self.runtime).freeze(run_id, anchor_id, checkpoint=lambda: None)
        selected = group.model_copy(update={'members': [member for member in group.members if member.image.sample_id == identity]})
        if not selected.members:
            raise ValueError('候选不属于本场冻结清单')
        submission = AnchorAssessmentSubmission(**{**submission.model_dump(),
            'assessment': submission.assessment.as_assessment(),
            'comparison': selected.members[0].comparison.model_dump(exclude={'anchor_side'})})
        reference = submission.reference
        draft = AnchorDraftSubmission(fingerprint=submission.fingerprint, observation_ids={identity: submission.observation_ids},
            draft={'assessments': [submission.assessment],
                'overall': {'verdict': submission.assessment.verdict, 'text': submission.assessment.conclusion, 'references': [reference]},
                'conclusions': [{'text': submission.assessment.explanation, 'references': [reference]}], 'limitations': []})
        self.validate(run_id, anchor_id, draft, selected, attempt=attempt)
        with self.runtime.jobs.lock:
            anchor = self.checks.attempt(run_id, anchor_id, attempt)
            existing = next((item for item in self.assessments(run_id, anchor_id)
                if item.submission.assessment.candidate_id == identity), None)
            if existing is not None and existing.submission == submission:
                return existing
            if anchor.state != 'RUNNING':
                raise ValueError('主图已停止，不能保存候选评估')
            with self.db.connection() as connection:
                return AnchorAssessments.append(connection, run_id, anchor_id, submission)

    def finalize(self, run_id: str, anchor_id: str, submission: dict | AnchorReviewSubmission, *, attempt: int = 1) -> ModelReviewedResult:
        submission = AnchorReviewSubmission.model_validate(submission)
        with self.runtime.jobs.lock:
            self.checks.attempt(run_id, anchor_id, attempt)
            records = {item.assessment_id: item.submission for item in self.assessments(run_id, anchor_id)}
            if len(submission.assessment_ids) != len(set(submission.assessment_ids)) or set(submission.assessment_ids) != set(records):
                raise ValueError('终稿必须恰好引用本场每个候选的最新评估一次')
            selected = [records[identity] for identity in submission.assessment_ids]
            verdict = GroupAnalysisValidation.verdict(item.assessment.verdict for item in selected)
            primary = next(item.assessment for item in selected if item.assessment.verdict == verdict)
            references = [item.reference for item in selected]
            observed = {item.observation_id: item for item in self.observations(run_id, anchor_id)}
            limitations = list(dict.fromkeys(limitation for item in selected for reference in item.observation_ids
                for finding in observed[reference].result.observations if finding.candidate_id == item.assessment.candidate_id
                for limitation in finding.limitations))
            return self.submit(run_id, anchor_id, {'fingerprint': submission.fingerprint,
                'observation_ids': {item.assessment.candidate_id: item.observation_ids for item in selected},
                'draft': {'assessments': [item.assessment for item in selected],
                    'overall': {'verdict': primary.verdict, 'text': primary.conclusion, 'references': references},
                    'conclusions': [{'text': item.assessment.explanation, 'references': [item.reference]} for item in selected],
                    'limitations': limitations}}, attempt=attempt)

    def submit(self, run_id: str, anchor_id: str, submission: dict | AnchorDraftSubmission, *, attempt: int = 1) -> ModelReviewedResult:
        submission = AnchorDraftSubmission.model_validate(submission)
        anchor = self.checks.attempt(run_id, anchor_id, attempt)
        result = ModelReviewedResult(**submission.draft.model_dump(), fingerprint=submission.fingerprint,
            observation_ids=submission.observation_ids)
        if anchor.result is not None:
            return self.checks.complete(run_id, anchor_id, result, attempt=attempt)
        group = ConsistencyAgentEvidence(self.runtime).freeze(run_id, anchor_id, checkpoint=lambda: None)
        self.validate(run_id, anchor_id, submission, group, attempt=attempt)
        return self.checks.complete(run_id, anchor_id, result, attempt=attempt)

    def validate(self, run_id: str, anchor_id: str, submission: AnchorDraftSubmission,
                 group: FrozenAnalysisGroup, *, attempt: int) -> None:
        anchor = self.checks.attempt(run_id, anchor_id, attempt)
        if anchor.candidates is None or anchor.candidates.fingerprint != submission.fingerprint:
            raise ValueError('终稿与本场冻结候选指纹不一致')
        candidates = {item.sample_id: item for item in anchor.candidates.candidates
            if item.sample_id in {member.image.sample_id for member in group.members}}
        if not candidates or set(submission.observation_ids) != set(candidates):
            raise ValueError('终稿必须覆盖全部入选候选的视觉观察')
        observed = {item.observation_id: item for item in self.observations(run_id, anchor_id)}
        comparable = set()
        for identity, references in submission.observation_ids.items():
            if not references or len(references) != len(set(references)) or not set(references) <= observed.keys():
                raise ValueError('终稿引用的视觉观察不属于本场或尚未完成')
            findings = []
            for reference in references:
                observation = observed[reference]
                if observation.request.fingerprint != submission.fingerprint or identity not in observation.request.candidate_ids:
                    raise ValueError('视觉观察与候选或冻结指纹不匹配')
                findings.extend(item for item in observation.result.observations if item.candidate_id == identity)
            if all(item.phenomena_comparable and not item.appearance_explains_annotation_difference for item in findings):
                comparable.add(identity)
        GroupAnalysisContract.validate_descriptions(submission.draft)
        GroupAnalysisValidation(self.db).validate(submission.draft, group, comparable_candidates=comparable)
        for assessment in submission.draft.assessments:
            if (assessment.verdict == 'MATERIAL' and candidates[assessment.candidate_id].kind != 'exact'
                    and assessment.candidate_id not in comparable):
                raise ValueError('非同图的冲突终稿需要实际视觉观察建立可比现象，实物外观差异不能直接判为标注冲突')
            if (assessment.categories and ConflictCategory.POSITION in assessment.categories
                    and candidates[assessment.candidate_id].kind != 'exact'):
                raise ValueError('当前候选不是同图且没有已建立的可靠配准，不能提交位置差异。'
                    '视觉观察中认出相同对象或重复追加原像素局部，不会生成可靠坐标变换。'
                    '保留已经观察到的位置与范围差异；若关键判断依赖缺失的坐标对应，应提交UNCERTAIN、categories为空数组，'
                    '并说明缺少可靠配准；其他有充分证据支持的冲突仍按实际分类提交。')
