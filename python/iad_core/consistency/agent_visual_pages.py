import hashlib
import json
from typing import TYPE_CHECKING

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_review_models import AnchorVisualPlan, AnchorVisualStart
from iad_core.workbench.vision import VlmClient

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


class AnchorVisualPages:
    def __init__(self, runtime: 'WorkbenchRuntime', client: VlmClient):
        self.runtime, self.client = runtime, client
        self.checks = ConsistencyAgentJobs(runtime)

    def plan(self, run_id: str, anchor_id: str, *, attempt: int = 1) -> AnchorVisualPlan:
        with self.runtime.jobs.lock:
            anchor = self.checks.attempt(run_id, anchor_id, attempt)
            context = self.runtime.jobs.context(run_id)
            context.checkpoint()
            if anchor.candidates is None or not anchor.candidates.candidates:
                raise ValueError('视觉分页要求本场已冻结的非空候选清单')
            from iad_core.consistency.agent_assessments import AnchorAssessments
            with self.runtime.db.connection() as connection:
                programmatic = {item.submission.assessment.candidate_id
                    for item in AnchorAssessments.list(connection, run_id, anchor_id) if not item.submission.observation_ids}
            plan = anchor.visual_plan
            if plan is not None and any(programmatic.intersection(page.candidate_ids) for page in plan.pages):
                plan = None
            if plan is None:
                self.checks.phase(run_id, anchor_id, 'PLANNING_VISUAL_PAGES')
                snapshot = self.checks.snapshot(run_id)
                from iad_core.consistency.identity import CandidateIdentity
                identity = CandidateIdentity(self.runtime).read(run_id, anchor_id)
                identities = [gate.candidate_id for gate in identity.gates
                    if gate.gate_status == 'eligible' and gate.candidate_id not in programmatic]
                revisions = {gate.candidate_id: gate.revision for gate in identity.gates if gate.candidate_id in identities}
                if not identities:
                    raise ValueError('没有合格候选，不需要标注观察分页')
                pages = [AnchorVisualStart(request_id='page-' + hashlib.sha256(json.dumps(
                    [run_id, anchor_id, anchor.candidates.fingerprint, identity, revisions[identity], snapshot.instruction],
                    ensure_ascii=False).encode()).hexdigest(), fingerprint=anchor.candidates.fingerprint,
                    candidate_ids=[identity], question=snapshot.instruction, gate_revisions={identity: revisions[identity]})
                    for identity in identities]
                plan = AnchorVisualPlan(fingerprint=anchor.candidates.fingerprint, pages=pages)
                with self.runtime.db.connection() as connection:
                    connection.execute('UPDATE consistency_anchor_runs SET visual_plan_json=? WHERE job_id=? AND anchor_id=?',
                        (plan.model_dump_json(), run_id, anchor_id))
            self.checks.phase(run_id, anchor_id, 'AWAITING_REVIEW')
            return plan
