import hashlib
import json
from collections import deque
from typing import TYPE_CHECKING

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_review_models import AnchorVisualPlan, AnchorVisualStart
from iad_core.consistency.agent_visual_inputs import AnchorVisualInput
from iad_core.consistency.errors import ConsistencyError
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import ModelCapacityError, VlmClient

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


class AnchorVisualPages:
    def __init__(self, runtime: 'WorkbenchRuntime', client: VlmClient):
        self.runtime, self.client = runtime, client
        self.checks = ConsistencyAgentJobs(runtime)

    def plan(self, run_id: str, anchor_id: str, *, attempt: int = 1) -> AnchorVisualPlan:
        anchor = self.checks.attempt(run_id, anchor_id, attempt)
        context = JobContext(self.runtime.jobs, run_id, self.runtime.jobs.status(run_id), self.runtime.jobs.cancelled[run_id])
        context.checkpoint()
        if anchor.candidates is None or not anchor.candidates.candidates:
            raise ValueError('视觉分页要求本场已冻结的非空候选清单')
        plan = anchor.visual_plan
        if plan is None:
            self.checks.phase(run_id, anchor_id, 'PLANNING_VISUAL_PAGES')
            snapshot = self.checks.snapshot(run_id)
            from iad_core.consistency.identity import CandidateIdentity
            identities = CandidateIdentity(self.runtime).read(run_id, anchor_id).eligible_ids
            if not identities:
                raise ValueError('没有合格候选，不需要标注观察分页')
            pending = deque([identities])
            pages = []
            while pending:
                context.checkpoint()
                identities = pending.popleft()
                request = AnchorVisualStart(request_id='page-' + hashlib.sha256(json.dumps(
                    [run_id, anchor_id, anchor.candidates.fingerprint, identities, snapshot.instruction], ensure_ascii=False).encode()).hexdigest(),
                    fingerprint=anchor.candidates.fingerprint, candidate_ids=identities, question=snapshot.instruction)
                try:
                    inputs = AnchorVisualInput.prepare(self.runtime, run_id, anchor_id, request, context.checkpoint)
                    with ModelCalls(self.runtime.db).bind(run_id, context.checkpoint, role='vision',
                            request_id=request.request_id, sample_id=anchor_id):
                        inputs.plan(self.client)
                except (ConsistencyError, ModelCapacityError) as error:
                    if isinstance(error, ConsistencyError) and error.code != 'RESOURCE_LIMIT':
                        raise
                    if len(identities) == 1:
                        raise ConsistencyError('RESOURCE_LIMIT', '视觉模型单页预算放不下本场一个必要证据单元：' + str(error)) from error
                    middle = len(identities) // 2
                    pending.extendleft([identities[middle:], identities[:middle]])
                    continue
                pages.append(request)
            plan = AnchorVisualPlan(fingerprint=anchor.candidates.fingerprint, pages=pages)
            with self.runtime.db.connection() as connection:
                connection.execute('UPDATE consistency_anchor_runs SET visual_plan_json=? WHERE job_id=? AND anchor_id=?',
                    (plan.model_dump_json(), run_id, anchor_id))
        self.checks.phase(run_id, anchor_id, 'AWAITING_REVIEW')
        return plan
