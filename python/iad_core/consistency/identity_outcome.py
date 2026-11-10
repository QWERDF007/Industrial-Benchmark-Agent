from collections import Counter

from iad_core.consistency.identity_models import CandidateStats


class IdentityOutcome:
    def __init__(self, state):
        self.state = state

    def assemble(self, assessments):
        candidates = [item.candidate_id for item in assessments]
        if not self.state.completed or len(candidates) != len(set(candidates)) or set(candidates) != set(self.state.eligible_ids):
            raise ValueError('主图汇总要求全部召回候选验证成功，且每个合格候选恰好完成一次标注审核')
        stats = self.statistics(assessments)
        result, reason = 'passed', None
        if not stats.eligible:
            reason = 'no_valid_candidate'
        elif stats.discrepancy:
            result = 'discrepancy'
        elif stats.undetermined:
            result = 'needs_review'
        else:
            reason = 'all_eligible_consistent'
        return dict(schema_version='7.0', execution_status='completed', result=result, pass_reason=reason,
            candidate_stats=stats, candidate_gate_ids=[gate.gate_id for gate in self.state.gates])

    def statistics(self, assessments):
        gate_counts = Counter(gate.gate_status for gate in self.state.gates)
        review_counts = Counter(item.verdict for item in assessments)
        return CandidateStats(retrieved=self.state.retrieved, eligible=gate_counts['eligible'],
            rejected=gate_counts['rejected'], unverified=gate_counts['unverified'], assessed=len(assessments),
            consistent=review_counts['EQUIVALENT'], discrepancy=review_counts['MATERIAL'], undetermined=review_counts['UNCERTAIN'],
            failed=sum(gate.execution_status == 'failed' for gate in self.state.gates),
            pending=self.state.retrieved - len(self.state.gates) + sum(gate.execution_status == 'pending' for gate in self.state.gates))
