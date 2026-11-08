import hashlib
from typing import Callable, Sequence, TYPE_CHECKING

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_evidence_records import AnchorEvidenceRecords
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import ConsistencyCompare, FrozenEvidence
from iad_core.consistency.group_analysis_inputs import GroupAnalysisInputs, PreparedGroupInput
from iad_core.consistency.group_models import FrozenAnalysisGroup, GalleryComparison, GalleryImage, GalleryMember, VisualWindow

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


class ConsistencyAgentEvidence:
    def __init__(self, runtime: 'WorkbenchRuntime'):
        self.runtime, self.db = runtime, runtime.db
        self.checks = ConsistencyAgentJobs(runtime)

    def freeze(self, run_id: str, anchor_id: str, *, checkpoint: Callable[[], None]) -> FrozenAnalysisGroup:
        anchor = self.checks.anchor(run_id, anchor_id)
        with self.db.connection() as connection:
            saved = connection.execute('SELECT group_json FROM consistency_anchor_runs WHERE job_id=? AND anchor_id=?',
                (run_id, anchor_id)).fetchone()[0]
            captured = {record.candidate_id: record for record in AnchorEvidenceRecords.list(connection, run_id, anchor_id)}
        if saved is not None:
            return FrozenAnalysisGroup.model_validate_json(saved)
        if anchor.candidates is None or not anchor.candidates.candidates:
            raise ValueError('视觉取证要求本主图已冻结的非空候选清单')
        snapshot = self.checks.snapshot(run_id)
        members, main = [], None
        for candidate in anchor.candidates.candidates:
            checkpoint()
            record = captured.get(candidate.sample_id)
            evidence = self.runtime.consistency_service.evidence(record.evidence_id) if record is not None else None
            if evidence is None or self._failure(evidence) is not None:
                comparison = self.runtime.consistency_service.compare(ConsistencyCompare(
                    sample_a=anchor_id, sample_b=candidate.sample_id), checkpoint=checkpoint, frozen_scopes=snapshot.scopes)
                with self.db.connection() as connection:
                    AnchorEvidenceRecords.capture(connection, run_id, anchor_id, candidate.sample_id, comparison)
                evidence = self.runtime.consistency_service.evidence(comparison.evidence_id)
            error = self._failure(evidence)
            if error is not None:
                raise error
            if main is None:
                main = GalleryImage(sample=evidence.sources.left.sample, evidence_id=evidence.result.evidence_id,
                    side='left', available=True)
            members.append(GalleryMember(image=GalleryImage(sample=evidence.sources.right.sample,
                evidence_id=evidence.result.evidence_id, side='right', available=True),
                comparison=GalleryComparison(evidence_id=evidence.result.evidence_id,
                    result_id=evidence.result.result_id, anchor_side='left')))
        group = FrozenAnalysisGroup(kind='groups', group_id='anchor_' + hashlib.sha256(
            (run_id + '\n' + anchor_id).encode()).hexdigest(), facts_state='CURRENT', anchor=main, members=members)
        with self.db.connection() as connection:
            connection.execute('UPDATE consistency_anchor_runs SET group_json=? WHERE job_id=? AND anchor_id=?',
                (group.model_dump_json(), run_id, anchor_id))
        return group

    @staticmethod
    def _failure(evidence: FrozenEvidence) -> ConsistencyError | None:
        for source in (evidence.sources.left, evidence.sources.right):
            if source.annotations.errors or source.issues:
                return ConsistencyError('ANNOTATION_UNREADABLE', '; '.join([*source.annotations.errors, *source.issues]))
        geometry_errors = [difference for difference in evidence.result.annotation.differences
            if difference.type == 'ANNOTATION_UNREADABLE']
        if geometry_errors:
            code = 'RESOURCE_LIMIT' if any(difference.facts.get('code') == 'RESOURCE_LIMIT'
                for difference in geometry_errors) else 'ANNOTATION_UNREADABLE'
            return ConsistencyError(code, '; '.join(str(difference.facts['reason']) for difference in geometry_errors))
        return None

    def prepare(self, run_id: str, anchor_id: str, candidate_ids: list[str], *,
                checkpoint: Callable[[], None] = lambda: None, windows: Sequence[VisualWindow] = ()) -> PreparedGroupInput:
        group = self.freeze(run_id, anchor_id, checkpoint=checkpoint)
        members = {member.image.sample_id: member for member in group.members}
        if not candidate_ids or not set(candidate_ids) <= members.keys():
            raise ConsistencyError('INVALID_SCOPE', '视觉取证仅限本主图冻结候选')
        selected_members = [members[identity] for identity in candidate_ids]
        selected = group.model_copy(update={'members': selected_members,
            'anchor': group.anchor.model_copy(update={'evidence_id': selected_members[0].image.evidence_id})})
        return GroupAnalysisInputs(self.runtime).prepare(selected, checkpoint, windows=windows)
