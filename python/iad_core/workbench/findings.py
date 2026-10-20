from dataclasses import dataclass
from typing import Mapping, Optional
import uuid

from iad_core.advisory.analysis import AuditFinding, FindingLocation, FindingReference, JointAnalysis, VisualEvidence

PRIORITY = {'high': 0, 'medium': 1, 'low': 2}


@dataclass(frozen=True)
class FindingState:
    reference: FindingReference
    finding: AuditFinding
    origins: frozenset[tuple[str, int]]


class FindingLedger:
    def __init__(self):
        self._pending: dict[tuple[str, int], FindingState] = {}
        self._resolved: set[tuple[str, int]] = set()
        self._steps: dict[str, JointAnalysis] = {}

    @property
    def findings(self) -> list[AuditFinding]:
        return sorted((state.finding for state in self._pending.values()), key=lambda finding: PRIORITY[finding.priority])

    @property
    def context(self) -> list[dict]:
        return [{'reference': state.reference.model_dump(), 'finding': state.finding.model_dump(exclude={'finding_id', 'source_step_ids', 'related_findings'})}
                for state in self._pending.values()]

    def observe(self, step_id: str, result: JointAnalysis, evidence: Mapping[str, VisualEvidence], check_ids: frozenset[str]) -> None:
        references = [(ref.step_id, ref.finding_index) for transition in [*result.findings, *result.resolved_findings]
                      for ref in transition.related_findings]
        if not set(references) <= self._pending.keys():
            raise ValueError('MLLM referenced an unknown pending finding')
        if len(references) != len(set(references)):
            raise ValueError('MLLM assigned more than one transition to the same finding')
        for finding in result.findings:
            if not set(finding.check_ids) <= check_ids:
                raise ValueError('MLLM finding cited an unknown check')
            self._validate_evidence(finding.evidence_ids, finding.location, evidence)
        for resolution in result.resolved_findings:
            for ref in resolution.related_findings:
                self._validate_evidence(resolution.evidence_ids, self._pending[(ref.step_id, ref.finding_index)].finding.location, evidence)
        pending, resolved = dict(self._pending), set(self._resolved)
        for resolution in result.resolved_findings:
            for ref in resolution.related_findings:
                resolved.update(pending.pop((ref.step_id, ref.finding_index)).origins)
        for index, finding in enumerate(result.findings, 1):
            previous = [pending.pop((ref.step_id, ref.finding_index)) for ref in finding.related_findings]
            data = finding.model_dump()
            data['evidence_ids'] = list(dict.fromkeys([*finding.evidence_ids, *[eid for state in previous for eid in state.finding.evidence_ids]]))
            data['limitations'] = list(dict.fromkeys([*finding.limitations, *[item for state in previous for item in state.finding.limitations]]))
            data['priority'] = min([finding.priority, *[state.finding.priority for state in previous]], key=PRIORITY.__getitem__)
            record = AuditFinding(**data, finding_id=previous[0].finding.finding_id if previous else 'finding_' + uuid.uuid4().hex,
                source_step_ids=list(dict.fromkeys([*[sid for state in previous for sid in state.finding.source_step_ids], step_id])))
            origins = frozenset({(step_id, index), *[origin for state in previous for origin in state.origins]})
            pending[(step_id, index)] = FindingState(FindingReference(step_id=step_id, finding_index=index), record, origins)
        self._pending, self._resolved = pending, resolved
        self._steps[step_id] = result

    def resolved(self, step_id: str, check_id: Optional[str] = None) -> bool:
        refs = {(step_id, index) for index, finding in enumerate(self._steps[step_id].findings, 1)
                if check_id is None or check_id in finding.check_ids}
        return bool(refs) and refs <= self._resolved

    def _validate_evidence(self, ids: list[str], location: FindingLocation, evidence: Mapping[str, VisualEvidence]) -> None:
        if not set(ids) <= evidence.keys():
            raise ValueError('MLLM finding cited unknown visual evidence')
        raw = [evidence[eid] for eid in ids if evidence[eid].representation == 'raw']
        if not raw:
            raise ValueError('MLLM finding requires raw visual evidence')
        if location.scope == 'global':
            if not any(image.role == 'overview' for image in raw):
                raise ValueError('MLLM global finding requires overview evidence')
        else:
            x1, y1, x2, y2 = location.bbox
            width, height = raw[0].original_size
            if not (0 <= x1 < x2 <= width and 0 <= y1 < y2 <= height):
                raise ValueError('MLLM finding location is outside the original image')
            if not any(image.crop_bbox[0] <= x1 and image.crop_bbox[1] <= y1 and
                       image.crop_bbox[2] >= x2 and image.crop_bbox[3] >= y2 for image in raw):
                raise ValueError('MLLM visual evidence does not cover the finding')
