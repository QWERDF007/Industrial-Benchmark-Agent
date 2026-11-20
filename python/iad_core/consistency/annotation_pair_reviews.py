import hashlib
import json
from uuid import uuid4
from typing import TYPE_CHECKING

from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_review_models import (AnchorObservation, AnchorVisualResult,
    PairObservationSource, AnchorVisualStart, AnchorVisualRequest)
from iad_core.consistency.agent_visual_inputs import AnchorVisualInput
from iad_core.consistency.annotation_direction import AnnotationDirection
from iad_core.consistency.annotation_evaluation import AnnotationEvaluation
from iad_core.consistency.identity import CandidateIdentity
from iad_core.consistency.identity_models import candidate_pair_key
from iad_core.consistency.pair_locks import CandidatePairLocks
from iad_core.consistency.pair_reviews import PairReviewLink, PairReviewTask
from iad_core.workbench.calls import ModelCalls


if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime
    from iad_core.workbench.vision import VlmClient


class AnnotationPairReviews:
    def __init__(self, runtime: 'WorkbenchRuntime', client: 'VlmClient | None' = None):
        self.runtime, self.db, self.client = runtime, runtime.db, client
        self.checks = ConsistencyAgentJobs(runtime)

    def plan(self, run_id: str) -> list[PairReviewTask]:
        pairs = {}
        for anchor in self.checks.anchors(run_id):
            if anchor.state != 'RUNNING' or anchor.result is not None or anchor.candidates is None:
                continue
            for candidate in anchor.candidates.candidates:
                key = candidate_pair_key(anchor.anchor_id, candidate.sample_id)
                pairs.setdefault(key, []).append(PairReviewLink(anchor_id=anchor.anchor_id,
                    candidate_id=candidate.sample_id))
        return [PairReviewTask(pair_key=key, links=sorted(links, key=lambda link: link.anchor_id))
            for key, links in sorted(pairs.items())]

    def observe(self, run_id: str, anchor_id: str, request: AnchorVisualStart, *, attempt: int) -> AnchorObservation:
        if len(request.candidate_ids) != 1:
            raise ValueError('标注审核每次只观察一个图像对')
        candidate_id = request.candidate_ids[0]
        key = candidate_pair_key(anchor_id, candidate_id)
        context = self.runtime.jobs.context(run_id)
        with CandidatePairLocks.exclusive(self.db.db_path, run_id, key):
            context.checkpoint()
            gate = next(gate for gate in CandidateIdentity(self.runtime).read(run_id, anchor_id).gates
                if gate.candidate_id == candidate_id)
            if gate.gate_status != 'eligible' or gate.revision != request.gate_revisions[candidate_id]:
                raise ValueError('图像对的内容核对版本已经变化')
            with self.db.connection() as connection:
                local = connection.execute('''SELECT request_json,observation_json FROM consistency_visual_requests
                    WHERE job_id=? AND anchor_id=? AND request_id=?''',
                    (run_id, anchor_id, request.request_id)).fetchone()
            if local is not None:
                captured = AnchorVisualRequest.model_validate_json(local['request_json'])
                if captured.model_dump(include=set(AnchorVisualStart.model_fields)) != request.model_dump():
                    raise ValueError('视觉请求ID已用于不同输入')
                if local['observation_json'] is not None:
                    return AnchorObservation.model_validate_json(local['observation_json'])
            group = ConsistencyAgentEvidence(self.runtime).freeze(run_id, anchor_id, checkpoint=context.checkpoint)
            member = next(member for member in group.members if member.image.sample_id == candidate_id)
            evidence = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
            sources = sorted((evidence.sources.left, evidence.sources.right), key=lambda source: source.sample.sample_id)
            fingerprint = hashlib.sha256(json.dumps([self.checks.snapshot(run_id).model_dump(mode='json'),
                request.question, gate.relation, gate.observation_call_ids,
                [(source.sample.sample_id, source.image.sha256, source.annotations.model_dump(mode='json'))
                    for source in sources]], sort_keys=True).encode()).hexdigest()
            with self.db.connection() as connection:
                saved = connection.execute('''SELECT v.observation_json FROM consistency_annotation_pair_observations p
                    JOIN consistency_visual_requests v USING(job_id,anchor_id,request_id)
                    WHERE p.job_id=? AND p.pair_key=? AND p.input_fingerprint=?''',
                    (run_id, key, fingerprint)).fetchone()
            if saved is not None:
                original = AnchorObservation.model_validate_json(saved['observation_json'])
                captured = AnchorVisualInput.project(self.runtime, run_id, anchor_id, request, original)
                finding = original.result.observations[0]
                reverse = original.request.anchor_id != anchor_id
                if reverse:
                    finding = AnnotationDirection.reverse(finding, candidate_id)
                projected = AnchorObservation(observation_id='observation_' + uuid4().hex,
                    request=captured, result=AnchorVisualResult(observations=[finding]),
                    shared_source=original.shared_source.model_copy(update={'reversed': reverse}))
                if finding.assessment is not None:
                    AnnotationEvaluation.validate(finding.assessment.as_assessment(),
                        (evidence.sources.left, evidence.sources.right), finding.media_ids,
                        observations=[projected], matching=evidence.parameters.matching, gate=gate)
                self._store(run_id, anchor_id, captured, projected, attempt=attempt)
                return projected
            inputs = AnchorVisualInput.prepare(self.runtime, run_id, anchor_id, request, context.checkpoint)
            self._store(run_id, anchor_id, inputs.request, None, attempt=attempt)
            with ModelCalls(self.db).bind(run_id, context.checkpoint, role='vision',
                    request_id=request.request_id, sample_id=anchor_id, pair_keys=[key]):
                plan = inputs.plan(self.client)
                context.checkpoint()
                result = inputs.normalize(self.client.generate(plan))
            context.checkpoint()
            with self.db.connection() as connection:
                call_ids = [row[0] for row in connection.execute('''SELECT call_id FROM model_calls WHERE run_id=?
                    AND json_extract(summary_json,'$.request_id')=? AND json_extract(summary_json,'$.operation')='generate'
                    AND json_extract(summary_json,'$.error') IS NULL ORDER BY rowid''', (run_id, request.request_id))]
            identity = 'observation_' + uuid4().hex
            observed = AnchorObservation(observation_id=identity, request=inputs.request,
                result=AnchorVisualResult.model_validate(result.model_dump()),
                shared_source=PairObservationSource(pair_key=key, observation_id=identity,
                    anchor_id=anchor_id, candidate_id=candidate_id, call_ids=call_ids))
            self._store(run_id, anchor_id, inputs.request, observed, attempt=attempt, cache=(key, fingerprint, candidate_id))
            return observed

    def _store(self, run_id: str, anchor_id: str, request: AnchorVisualRequest, observation: AnchorObservation | None, *,
               attempt: int, cache: tuple[str, str, str] | None = None) -> None:
        with self.runtime.jobs.lock, self.db.connection() as connection:
            changed = connection.execute('''INSERT INTO consistency_visual_requests(
                job_id,anchor_id,request_id,request_json,observation_json)
                SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM consistency_anchor_runs
                    WHERE job_id=? AND anchor_id=? AND attempt=? AND state='RUNNING')
                ON CONFLICT(job_id,anchor_id,request_id) DO UPDATE SET
                    request_json=excluded.request_json,observation_json=excluded.observation_json
                WHERE consistency_visual_requests.observation_json IS NULL''',
                (run_id, anchor_id, request.request_id, request.model_dump_json(),
                    observation.model_dump_json() if observation else None, run_id, anchor_id, attempt))
            if not changed.rowcount:
                raise ValueError('过期的主图审核 attempt 或已完成的观察')
            if cache is not None:
                key, fingerprint, candidate_id = cache
                connection.execute('''INSERT INTO consistency_annotation_pair_observations(
                    job_id,pair_key,input_fingerprint,anchor_id,candidate_id,request_id) VALUES(?,?,?,?,?,?)''',
                    (run_id, key, fingerprint, anchor_id, candidate_id, request.request_id))

    def review(self, run_id: str, task: PairReviewTask | dict) -> dict:
        from iad_core.consistency.agent_review import ConsistencyAgentReview
        task = PairReviewTask.model_validate(task)
        if not task.links or any(candidate_pair_key(link.anchor_id, link.candidate_id) != task.pair_key for link in task.links):
            raise ValueError('标注审核任务必须属于同一个无序图像对')
        review = ConsistencyAgentReview(self.runtime, self.client)
        observed = []
        for link in task.links:
            anchor = self.checks.anchor(run_id, link.anchor_id)
            if anchor.state != 'RUNNING' or anchor.result is not None:
                continue
            state = CandidateIdentity(self.runtime).read(run_id, link.anchor_id)
            gate = next((gate for gate in state.gates if gate.candidate_id == link.candidate_id), None)
            if gate is None or gate.gate_status != 'eligible':
                continue
            if any(item.submission.assessment.candidate_id == link.candidate_id
                    for item in review.assessments(run_id, link.anchor_id)):
                continue
            group = ConsistencyAgentEvidence(self.runtime).freeze(run_id, link.anchor_id, checkpoint=lambda: None)
            member = next(member for member in group.members if member.image.sample_id == link.candidate_id)
            evidence = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
            if AnnotationEvaluation.deterministic((evidence.sources.left, evidence.sources.right)):
                continue
            page = next(page for page in review.plan(run_id, link.anchor_id, attempt=anchor.attempt).pages
                if page.candidate_ids == [link.candidate_id])
            observation = review.observe(run_id, link.anchor_id, page, attempt=anchor.attempt)
            finding = observation.result.observations[0]
            observed.append(observation.observation_id)
            if finding.gate_dispute is not None:
                return {'ready': False, 'observation_ids': observed}
            review.assess(run_id, link.anchor_id, {'fingerprint': page.fingerprint,
                'observation_ids': [observation.observation_id], 'assessment': finding.assessment.model_dump()},
                attempt=anchor.attempt, expected_revision=page.gate_revisions[link.candidate_id],
                request_id='assess-' + page.request_id + '-' + link.candidate_id)
        return {'ready': True, 'observation_ids': observed}
