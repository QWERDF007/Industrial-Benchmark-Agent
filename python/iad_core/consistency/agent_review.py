from typing import TYPE_CHECKING
from uuid import uuid4

from iad_core.consistency.agent_assessments import AnchorAssessments
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_models import ModelReviewedResult
from iad_core.consistency.agent_review_models import (AnchorAssessmentInput, AnchorAssessmentRecord, AnchorAssessmentSubmission, AnchorDraftSubmission, AnchorObservation, AnchorVisualPlan, AnchorVisualRequest,
    AnchorReviewSubmission, AnchorVisualResult, AnchorVisualStart, VISUAL_REQUEST_ID_RULE)
from iad_core.consistency.agent_visual_inputs import AnchorVisualInput
from iad_core.consistency.agent_visual_pages import AnchorVisualPages
from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.consistency.group_analysis_validation import GroupAnalysisValidation
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.vision import VlmClient
from iad_core.consistency.errors import GateReviewRequired

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


class ConsistencyAgentReview:
    def __init__(self, runtime: 'WorkbenchRuntime', client: VlmClient | None = None):
        self.runtime, self.db, self.client = runtime, runtime.db, client
        self.checks = ConsistencyAgentJobs(runtime)

    def verify(self, run_id: str, anchor_id: str, *, attempt: int = 1, step: bool = False):
        from iad_core.consistency.identity import CandidateIdentity
        return CandidateIdentity(self.runtime, self.client).verify(run_id, anchor_id, attempt=attempt, step=step)

    def recheck(self, run_id, anchor_id, candidate_id, *, expected_revision, request_id, attempt=1):
        from iad_core.consistency.identity import CandidateIdentity
        return CandidateIdentity(self.runtime).recheck(run_id, anchor_id, candidate_id,
            expected_revision=expected_revision, request_id=request_id, attempt=attempt)

    def finish_rules(self, run_id: str, anchor_id: str, *, attempt: int = 1):
        from iad_core.consistency.identity import CandidateIdentity
        from iad_core.consistency.agent_models import NoEligibleResult
        anchor = self.checks.attempt(run_id, anchor_id, attempt)
        if anchor.result is not None:
            return anchor.result
        state = CandidateIdentity(self.runtime).read(run_id, anchor_id)
        if not state.completed:
            raise ValueError('候选验证尚未正常完成，不能作为无有效候选通过')
        if not state.eligible_ids:
            return self.checks.complete(run_id, anchor_id, NoEligibleResult(), attempt=attempt)
        self.checks.phase(run_id, anchor_id, 'AWAITING_REVIEW')
        group = CandidateIdentity(self.runtime).review_group(run_id, anchor_id)
        first = self.runtime.consistency_service.evidence(group.members[0].comparison.evidence_id)
        if first.sources.left.annotations.dataset_format == 'folder_classification':
            from iad_core.consistency.annotation_evaluation import AnnotationEvaluation
            records = []
            gates = {gate.candidate_id: gate for gate in state.gates}
            for member in group.members:
                saved = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
                assessment = AnnotationEvaluation.labels((saved.sources.left, saved.sources.right), member.image.sample_id,
                    [media.evidence_id for media in gates[member.image.sample_id].media[:2]])
                record = self.save_assessment(run_id, anchor_id, AnchorAssessmentSubmission(fingerprint=state.fingerprint,
                    observation_ids=[], assessment=assessment,
                    comparison=member.comparison.model_dump(exclude={'anchor_side'})), attempt=attempt)
                records.append(record.assessment_id)
            return self.finalize(run_id, anchor_id, {'fingerprint': state.fingerprint, 'assessment_ids': records}, attempt=attempt)
        return None

    def plan(self, run_id: str, anchor_id: str, *, attempt: int = 1) -> AnchorVisualPlan:
        if self.client is None:
            raise ValueError('视觉分页需要冻结的视觉模型客户端')
        from iad_core.consistency.identity import CandidateIdentity
        if not CandidateIdentity(self.runtime).prepare(run_id, anchor_id, attempt=attempt).completed:
            raise GateReviewRequired()
        return AnchorVisualPages(self.runtime, self.client).plan(run_id, anchor_id, attempt=attempt)

    def observe(self, run_id: str, anchor_id: str, request: dict | AnchorVisualStart, *, attempt: int = 1) -> AnchorObservation:
        request = AnchorVisualStart.model_validate(request)
        if request.windows:
            raise ValueError('审核仅使用原图和标注区域，不支持额外观察窗口')
        if self.client is None:
            raise ValueError('视觉观察需要冻结的视觉模型客户端')
        from iad_core.consistency.identity import CandidateIdentity
        state = CandidateIdentity(self.runtime).prepare(run_id, anchor_id, attempt=attempt)
        if not state.completed:
            raise GateReviewRequired()
        if not set(request.candidate_ids) <= set(state.eligible_ids):
            raise ValueError('未通过图像内容验证的候选不能进入标注观察')
        revisions = {gate.candidate_id: gate.revision for gate in state.gates if gate.candidate_id in request.candidate_ids}
        if request.gate_revisions and request.gate_revisions != revisions:
            raise ValueError('视觉请求引用了过期的候选资格版本')
        request = request.model_copy(update={'gate_revisions': revisions})
        anchor = self.checks.attempt(run_id, anchor_id, attempt)
        if anchor.candidates is None or anchor.candidates.fingerprint != request.fingerprint:
            raise ValueError('视觉请求与本场冻结候选指纹不一致')
        if anchor.visual_plan is not None:
            planned = next((page for page in anchor.visual_plan.pages if page.request_id == request.request_id), None)
            if planned is not None and planned.model_copy(update={'gate_revisions': revisions}) != request:
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
        context = self.runtime.jobs.context(run_id)
        context.checkpoint()
        self.checks.phase(run_id, anchor_id, 'OBSERVING_ANCHOR')
        inputs = AnchorVisualInput.prepare(self.runtime, run_id, anchor_id, request, context.checkpoint)
        if saved is None:
            with self.db.connection() as connection:
                connection.execute('''INSERT INTO consistency_visual_requests(job_id,anchor_id,request_id,request_json)
                    VALUES(?,?,?,?)''', (run_id, anchor_id, request.request_id, inputs.request.model_dump_json()))
        with ModelCalls(self.db).bind(run_id, context.checkpoint, role='vision',
                request_id=request.request_id, sample_id=anchor_id):
            plan = inputs.plan(self.client)
            context.checkpoint()
            result = inputs.normalize(self.client.generate(plan))
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
        for finding in observed.result.observations:
            if finding.gate_dispute is not None:
                from iad_core.consistency.identity import CandidateIdentity
                current = next(gate for gate in CandidateIdentity(self.runtime).read(run_id, anchor_id).gates
                    if gate.candidate_id == finding.candidate_id)
                if current.revision != revisions[finding.candidate_id]:
                    continue
                CandidateIdentity(self.runtime).recheck(run_id, anchor_id, finding.candidate_id,
                    expected_revision=revisions[finding.candidate_id],
                    request_id='audit-dispute-' + request.request_id + '-' + finding.candidate_id, attempt=attempt)
        return observed

    def observations(self, run_id: str, anchor_id: str) -> list[AnchorObservation]:
        self.checks.anchor(run_id, anchor_id)
        with self.db.connection() as connection:
            rows = connection.execute('''SELECT observation_json FROM consistency_visual_requests
                WHERE job_id=? AND anchor_id=? AND observation_json IS NOT NULL ORDER BY rowid''',
                (run_id, anchor_id)).fetchall()
        from iad_core.consistency.identity import CandidateIdentity
        from iad_core.consistency.candidate_records import CandidateRecords
        gates = {gate.candidate_id: gate for gate in CandidateIdentity(self.runtime).read(run_id, anchor_id).gates}
        versioned = self.checks.snapshot(run_id).review_pipeline in ('identity-v5', 'identity-v7', 'identity-v8')
        return [item for row in rows if (item := AnchorObservation.model_validate_json(row[0]))
            and (not versioned or CandidateRecords.observation_current(gates, item.request))]

    def assessments(self, run_id: str, anchor_id: str) -> list[AnchorAssessmentRecord]:
        self.checks.anchor(run_id, anchor_id)
        with self.db.connection() as connection:
            return AnchorAssessments.list(connection, run_id, anchor_id)

    def assess(self, run_id: str, anchor_id: str, submission: dict | AnchorAssessmentInput, *, attempt: int = 1,
               expected_revision: int | None = None, request_id: str | None = None) -> AnchorAssessmentRecord:
        submission = AnchorAssessmentInput.model_validate(submission)
        identity = submission.assessment.candidate_id
        from iad_core.consistency.identity import CandidateIdentity
        group = CandidateIdentity(self.runtime).review_group(run_id, anchor_id)
        selected = group.model_copy(update={'members': [member for member in group.members if member.image.sample_id == identity]})
        if not selected.members:
            raise ValueError('候选不属于本场冻结清单')
        gate = next(gate for gate in CandidateIdentity(self.runtime).read(run_id, anchor_id).gates if gate.candidate_id == identity)
        if expected_revision is not None and expected_revision != gate.revision:
            raise GateReviewRequired()
        submission = AnchorAssessmentSubmission(**{**submission.model_dump(),
            'gate_revision': gate.revision,
            'assessment': submission.assessment.as_assessment(),
            'comparison': selected.members[0].comparison.model_dump(exclude={'anchor_side'})})
        reference = submission.reference
        draft = AnchorDraftSubmission(fingerprint=submission.fingerprint, observation_ids={identity: submission.observation_ids},
            draft={'assessments': [submission.assessment],
                'overall': {'verdict': submission.assessment.verdict, 'text': submission.assessment.conclusion, 'references': [reference]},
                'conclusions': [{'text': submission.assessment.explanation, 'references': [reference]}], 'limitations': []})
        self.validate(run_id, anchor_id, draft, selected, attempt=attempt)
        return self.save_assessment(run_id, anchor_id, submission, attempt=attempt, request_id=request_id)

    def save_assessment(self, run_id: str, anchor_id: str, submission: AnchorAssessmentSubmission, *, attempt: int, request_id: str | None = None):
        identity = submission.assessment.candidate_id
        with self.runtime.jobs.lock:
            anchor = self.checks.attempt(run_id, anchor_id, attempt)
            if submission.gate_revision:
                from iad_core.consistency.identity import CandidateIdentity
                gate = next(gate for gate in CandidateIdentity(self.runtime).read(run_id, anchor_id).gates
                    if gate.candidate_id == identity)
                if gate.revision != submission.gate_revision or gate.gate_status != 'eligible':
                    raise GateReviewRequired()
            existing = next((item for item in self.assessments(run_id, anchor_id)
                if item.submission.assessment.candidate_id == identity), None)
            if existing is not None and existing.submission == submission and request_id is None:
                return existing
            if anchor.state != 'RUNNING' and request_id is None:
                raise ValueError('主图已停止，不能保存候选评估')
            with self.db.connection() as connection:
                return AnchorAssessments.append(connection, run_id, anchor_id, submission, request_id=request_id)

    def finalize(self, run_id: str, anchor_id: str, submission: dict | AnchorReviewSubmission, *, attempt: int = 1) -> ModelReviewedResult:
        submission = AnchorReviewSubmission.model_validate(submission)
        with self.runtime.jobs.lock:
            anchor = self.checks.attempt(run_id, anchor_id, attempt)
            if anchor.candidates is None or submission.fingerprint != anchor.candidates.fingerprint:
                raise ValueError('终稿与当前冻结指纹不一致')
            records = {item.assessment_id: item.submission for item in self.assessments(run_id, anchor_id)}
            if len(submission.assessment_ids) != len(set(submission.assessment_ids)) or set(submission.assessment_ids) != set(records):
                raise ValueError('终稿必须恰好引用本场每个候选的最新评估一次')
            by_candidate = {record.assessment.candidate_id: record for record in records.values()}
            selected = [by_candidate[candidate.sample_id] for candidate in anchor.candidates.candidates if candidate.sample_id in by_candidate]
            if not selected:
                from iad_core.consistency.identity import CandidateIdentity
                from iad_core.consistency.agent_models import NoCandidateResult, NoEligibleResult
                state = CandidateIdentity(self.runtime).read(run_id, anchor_id)
                if not state.completed or state.eligible_ids:
                    raise ValueError('零审核终稿要求全部资格正常完成且无有效候选')
                result = NoCandidateResult() if state.retrieved == 0 else NoEligibleResult()
                return self.checks.complete(run_id, anchor_id, result, attempt=attempt,
                    request_id=submission.request_id, request_payload=submission.model_dump(mode='json'))
            verdict = GroupAnalysisValidation.verdict(item.assessment.verdict for item in selected)
            primary = next(item.assessment for item in selected if item.assessment.verdict == verdict)
            references = [item.reference for item in selected]
            observed = {item.observation_id: item for item in self.observations(run_id, anchor_id)}
            limitations = list(dict.fromkeys([limitation for item in selected for limitation in item.assessment.limitations] + [limitation for item in selected for reference in item.observation_ids
                for finding in observed[reference].result.observations if finding.candidate_id == item.assessment.candidate_id
                for limitation in finding.limitations]))
            return self.submit(run_id, anchor_id, {'fingerprint': submission.fingerprint,
                'request_id': submission.request_id,
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
            return self.checks.complete(run_id, anchor_id, result, attempt=attempt,
                request_id=submission.request_id, request_payload=submission.model_dump(mode='json'))
        from iad_core.consistency.identity import CandidateIdentity
        group = CandidateIdentity(self.runtime).review_group(run_id, anchor_id)
        self.validate(run_id, anchor_id, submission, group, attempt=attempt)
        return self.checks.complete(run_id, anchor_id, result, attempt=attempt,
            request_id=submission.request_id, request_payload=submission.model_dump(mode='json'))

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
        from iad_core.consistency.annotation_evaluation import AnnotationEvaluation
        from iad_core.consistency.identity import CandidateIdentity
        gates = {gate.candidate_id: gate for gate in CandidateIdentity(self.runtime).read(run_id, anchor_id).gates}
        for assessment in submission.draft.assessments:
            member = next(member for member in group.members if member.image.sample_id == assessment.candidate_id)
            evidence = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
            deterministic = evidence.sources.left.annotations.dataset_format == 'folder_classification'
            references = submission.observation_ids.get(assessment.candidate_id, [])
            media_ids = ([image.evidence_id for image in gates[assessment.candidate_id].media[:2]] if deterministic else
                next((finding.media_ids for reference in references if reference in observed
                    for finding in observed[reference].result.observations if finding.candidate_id == assessment.candidate_id), []))
            AnnotationEvaluation.validate(assessment, (evidence.sources.left, evidence.sources.right), media_ids,
                observations=[observed[reference] for reference in references if reference in observed], matching=evidence.parameters.matching,
                gate=gates[assessment.candidate_id])
        for identity, references in submission.observation_ids.items():
            member = next(member for member in group.members if member.image.sample_id == identity)
            deterministic = self.runtime.consistency_service.evidence(member.comparison.evidence_id).sources.left.annotations.dataset_format == 'folder_classification'
            if ((not references and not deterministic) or len(references) != len(set(references)) or not set(references) <= observed.keys()):
                raise ValueError('终稿引用的视觉观察不属于本场或尚未完成')
            for reference in references:
                observation = observed[reference]
                if observation.request.fingerprint != submission.fingerprint or identity not in observation.request.candidate_ids:
                    raise ValueError('视觉观察与候选或冻结指纹不匹配')
        GroupAnalysisValidation(self.db).validate(submission.draft, group)
