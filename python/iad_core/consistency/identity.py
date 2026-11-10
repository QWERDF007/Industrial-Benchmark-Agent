import hashlib
from typing import TYPE_CHECKING

from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.identity_models import AnchorIdentityState, CandidateIdentityRecord
from iad_core.consistency.identity_repository import CandidateIdentityRecords
from iad_core.duplicate.pixels import PixelContent
from iad_core.evidence.retained import RetainedImages
from iad_core.evidence.images import EvidenceImages
from iad_core.workbench.jobs import JobContext

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

    def verify(self, run_id: str, anchor_id: str, *, attempt: int = 1, step: bool = False) -> AnchorIdentityState:
        self.checks.attempt(run_id, anchor_id, attempt)
        from iad_core.consistency.identity_prompts import IDENTITY_PROMPT_VERSION
        if self.checks.snapshot(run_id).prompt_version != IDENTITY_PROMPT_VERSION:
            raise ValueError('历史内容验证合同只读保留，请新建检查')
        current = self.read(run_id, anchor_id)
        if current.completed:
            return current
        context = JobContext(self.runtime.jobs, run_id, self.runtime.jobs.status(run_id), self.runtime.jobs.cancelled[run_id])
        context.checkpoint()
        group = ConsistencyAgentEvidence(self.runtime).freeze(run_id, anchor_id, checkpoint=context.checkpoint)
        self.checks.phase(run_id, anchor_id, 'OBSERVING_ANCHOR')
        completed = {gate.candidate_id for gate in current.gates if gate.execution_status == 'completed'}
        retained = RetainedImages(self.db)
        for member in group.members:
            context.checkpoint()
            identity = member.image.sample_id
            if identity in completed:
                continue
            evidence = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
            left, right = evidence.sources.left, evidence.sources.right
            base = dict(gate_id='gate_' + hashlib.sha256(
                (run_id + '\n' + anchor_id + '\n' + identity + '\n' + current.fingerprint).encode()).hexdigest(),
                candidate_id=identity, fingerprint=current.fingerprint)
            try:
                compared = PixelContent.read(retained.path(left.image)).compare(PixelContent.read(retained.path(right.image)))
                if compared.exact_equal is True:
                    media = [EvidenceImages(self.db.db_path).capture(source.sample.model_copy(update={
                        'image_path': retained.path(source.image)}), 'overview', 'coverage', max_side=1280).evidence
                        for source in (left, right)]
                    result = dict(relation='pixel_identical', reason='两侧解码像素、尺寸与通道语义完全一致。', media=media)
                else:
                    if compared.exact_equal is None:
                        raise ConsistencyError('SOURCE_UNAVAILABLE', '无法完整读取候选原始像素。')
                    if self.client is None:
                        raise ValueError('非完全一致的候选需要冻结的视觉模型。')
                    from iad_core.consistency.identity_inspection import IdentityInspection
                    result = IdentityInspection(self.runtime, self.client).inspect(run_id, anchor_id, identity,
                        (left, right), context.checkpoint, prompts=self.checks.snapshot(run_id).prompts, step=step)
                    if result is None:
                        return self.read(run_id, anchor_id)
                record = CandidateIdentityRecord(**base, execution_status='completed', **result)
            except Exception as error:
                context.checkpoint()
                with self.db.connection() as connection:
                    connection.execute('''INSERT INTO consistency_candidate_identity(job_id,anchor_id,candidate_id,record_json)
                        VALUES(?,?,?,?) ON CONFLICT(job_id,anchor_id,candidate_id) DO UPDATE SET record_json=excluded.record_json''',
                        (run_id, anchor_id, identity, CandidateIdentityRecord(**base, execution_status='failed', relation=None,
                            reason='候选内容验证执行失败。', error_code=getattr(error, 'code', type(error).__name__)).model_dump_json(exclude={'gate_status'})))
                raise
            with self.runtime.jobs.lock:
                live = self.checks.attempt(run_id, anchor_id, attempt)
                if live.state != 'RUNNING':
                    raise ValueError('主图已停止，不能保存候选资格')
                with self.db.connection() as connection:
                    connection.execute('''INSERT INTO consistency_candidate_identity(job_id,anchor_id,candidate_id,record_json)
                        VALUES(?,?,?,?) ON CONFLICT(job_id,anchor_id,candidate_id) DO UPDATE SET record_json=excluded.record_json''',
                        (run_id, anchor_id, identity, record.model_dump_json(exclude={'gate_status'})))
            if step and compared.exact_equal is not True:
                return self.read(run_id, anchor_id)
        return self.read(run_id, anchor_id)

    def review_group(self, run_id: str, anchor_id: str):
        state = self.read(run_id, anchor_id)
        if not state.completed:
            raise ValueError('必须先完成全部候选的图像身份与内容验证')
        group = ConsistencyAgentEvidence(self.runtime).freeze(run_id, anchor_id, checkpoint=lambda: None)
        return group.model_copy(update={'members': [member for member in group.members if member.image.sample_id in state.eligible_ids]})
