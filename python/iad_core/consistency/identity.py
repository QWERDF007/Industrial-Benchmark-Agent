from typing import TYPE_CHECKING

from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.candidate_records import CandidateRecords
from iad_core.consistency.errors import ConsistencyError, GateReviewRequired
from iad_core.consistency.identity_models import AnchorIdentityState, CandidateIdentityRecord
from iad_core.consistency.identity_repository import CandidateIdentityRecords
from iad_core.duplicate.pixels import PixelContent
from iad_core.evidence.retained import RetainedImages
from iad_core.evidence.images import EvidenceImages

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime
    from iad_core.workbench.vision import VlmClient


class CandidateIdentity:
    def __init__(self, runtime: 'WorkbenchRuntime', client: 'VlmClient | None' = None):
        self.runtime, self.db, self.client = runtime, runtime.db, client
        self.checks = ConsistencyAgentJobs(runtime)

    def read(self, run_id: str, anchor_id: str) -> AnchorIdentityState:
        anchor = self.checks.anchor(run_id, anchor_id)
        with self.db.connection() as connection:
            return CandidateIdentityRecords.read(connection, run_id, anchor_id, anchor.candidates)

    def prepare(self, run_id: str, anchor_id: str, *, attempt: int = 1):
        self.checks.attempt(run_id, anchor_id, attempt)
        state = self.read(run_id, anchor_id)
        if state.completed:
            return state
        context = self.runtime.jobs.context(run_id)
        group = ConsistencyAgentEvidence(self.runtime).freeze(run_id, anchor_id, checkpoint=context.checkpoint)
        retained = RetainedImages(self.db)
        current = {gate.candidate_id: gate for gate in state.gates}
        for member in group.members:
            context.checkpoint()
            candidate_id = member.image.sample_id
            if candidate_id in current and current[candidate_id].execution_status == 'completed':
                continue
            saved = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
            sources = (saved.sources.left, saved.sources.right)
            compared = PixelContent.read(retained.path(sources[0].image)).compare(PixelContent.read(retained.path(sources[1].image)))
            if compared.exact_equal is None:
                raise ConsistencyError('SOURCE_UNAVAILABLE', '无法完整读取候选原始像素。')
            if compared.exact_equal:
                media = [EvidenceImages(self.db.db_path).capture(source.sample.model_copy(update={
                    'image_path': retained.path(source.image)}), 'overview', 'coverage', full_resolution=True).evidence for source in sources]
                revision = current[candidate_id].revision if candidate_id in current else 0
                self.commit(run_id, anchor_id, CandidateIdentityRecord(gate_id='pending', candidate_id=candidate_id,
                    fingerprint=state.fingerprint, execution_status='completed', relation='pixel_identical',
                    reason='两侧解码像素、尺寸与通道语义完全一致。', media=media, source='program'),
                    expected_revision=revision, request_id='pixel-' + candidate_id, attempt=attempt)
        return self.read(run_id, anchor_id)

    def observe(self, run_id, anchor_id, candidate_id, *, expected_revision, request_id, attempt=1):
        self.checks.attempt(run_id, anchor_id, attempt)
        state = self.read(run_id, anchor_id)
        gate = next((item for item in state.gates if item.candidate_id == candidate_id), None)
        if (gate.revision if gate else 0) != expected_revision:
            raise ValueError('候选资格版本已变化')
        if self.client is None:
            raise ValueError('非完全一致的候选需要冻结的视觉模型。')
        context = self.runtime.jobs.context(run_id)
        group = ConsistencyAgentEvidence(self.runtime).freeze(run_id, anchor_id, checkpoint=context.checkpoint)
        member = next((item for item in group.members if item.image.sample_id == candidate_id), None)
        if member is None:
            raise ValueError('候选不属于当前冻结清单')
        evidence = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
        self.checks.phase(run_id, anchor_id, 'VERIFYING_CONTENT')
        from iad_core.consistency.identity_inspection import IdentityInspection
        try:
            result = IdentityInspection(self.runtime, self.client).inspect(run_id, anchor_id, candidate_id,
                (evidence.sources.left, evidence.sources.right), context.checkpoint,
                prompts=self.checks.snapshot(run_id).prompts, revision=expected_revision, request_id=request_id)
        except Exception as error:
            current = self.checks.anchor(run_id, anchor_id)
            latest = next((gate.revision for gate in self.read(run_id, anchor_id).gates if gate.candidate_id == candidate_id), 0)
            if current.state == 'RUNNING' and current.attempt == attempt and latest == expected_revision:
                self.commit(run_id, anchor_id, CandidateIdentityRecord(gate_id='pending', candidate_id=candidate_id,
                    fingerprint=state.fingerprint, execution_status='failed', relation=None,
                    reason=str(error) or '候选内容验证执行失败。', error_code=getattr(error, 'code', type(error).__name__)),
                    expected_revision=expected_revision, request_id=request_id + '-failed', attempt=attempt)
            raise
        return CandidateIdentityRecord(gate_id='pending', candidate_id=candidate_id, fingerprint=state.fingerprint,
            execution_status='completed', revision=expected_revision, **result)

    def commit(self, run_id, anchor_id, record, *, expected_revision, request_id, attempt=1):
        from iad_core.consistency.identity_inputs import IdentityInputs
        record = CandidateIdentityRecord.model_validate(record.model_dump())
        IdentityInputs(self.db).validate_record(run_id, anchor_id, record)
        with self.runtime.jobs.lock, self.db.connection() as connection:
            self.checks.attempt(run_id, anchor_id, attempt)
            saved = CandidateRecords.append(connection, run_id, anchor_id, record.candidate_id,
                'gate', expected_revision, request_id, record)
            return CandidateIdentityRecord.model_validate_json(saved['record_json']).model_copy(update={'revision': saved['revision']})

    def recheck(self, run_id, anchor_id, candidate_id, *, expected_revision, request_id, attempt=1):
        state = self.read(run_id, anchor_id)
        previous = next((gate for gate in state.gates if gate.candidate_id == candidate_id), None)
        if previous is not None and previous.pair_key:
            from iad_core.consistency.pair_reviews import ConsistencyPairReviews
            return ConsistencyPairReviews(self.runtime).invalidate(run_id, anchor_id, candidate_id,
                expected_revision=expected_revision, request_id=request_id, attempt=attempt)
        record = CandidateIdentityRecord(gate_id='pending', candidate_id=candidate_id, fingerprint=state.fingerprint,
            execution_status='pending', relation=None, reason='审核中发现身份疑点，重新核对实际图像内容。')
        with self.runtime.jobs.lock, self.db.connection() as connection:
            self.checks.attempt(run_id, anchor_id, attempt)
            if previous is not None and previous.relation == 'pixel_identical':
                raise ValueError('不能撤销由冻结像素直接证明的同内容资格')
            saved = CandidateRecords.append(connection, run_id, anchor_id, candidate_id, 'gate', expected_revision, request_id, record)
        return CandidateIdentityRecord.model_validate_json(saved['record_json']).model_copy(update={'revision': saved['revision']})

    def verify(self, run_id: str, anchor_id: str, *, attempt: int = 1, step: bool = False) -> AnchorIdentityState:
        state = self.prepare(run_id, anchor_id, attempt=attempt)
        current = {gate.candidate_id: gate for gate in state.gates}
        anchor = self.checks.anchor(run_id, anchor_id)
        for candidate in anchor.candidates.candidates:
            gate = current.get(candidate.sample_id)
            if gate is not None and gate.execution_status == 'completed':
                continue
            revision = gate.revision if gate else 0
            request_id = 'verify-' + candidate.sample_id + '-' + str(revision)
            result = self.observe(run_id, anchor_id, candidate.sample_id, expected_revision=revision,
                request_id=request_id, attempt=attempt)
            self.commit(run_id, anchor_id, result, expected_revision=revision, request_id=request_id, attempt=attempt)
            if step:
                return self.read(run_id, anchor_id)
        return self.read(run_id, anchor_id)

    def review_group(self, run_id: str, anchor_id: str):
        state = self.read(run_id, anchor_id)
        if not state.completed:
            raise GateReviewRequired()
        group = ConsistencyAgentEvidence(self.runtime).freeze(run_id, anchor_id, checkpoint=lambda: None)
        selected = group.model_copy(update={'members': [member for member in group.members if member.image.sample_id in state.eligible_ids]})
        task_type = self.checks.snapshot(run_id).task_type
        for member in selected.members:
            from iad_core.consistency.identity_inputs import IdentityInputs
            IdentityInputs(self.db).validate_record(run_id, anchor_id,
                next(gate for gate in state.gates if gate.candidate_id == member.image.sample_id))
            evidence = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
            for source in (evidence.sources.left, evidence.sources.right):
                source.annotations.require_task(task_type)
            if error := ConsistencyAgentEvidence.annotation_failure(evidence):
                raise error
        return selected
