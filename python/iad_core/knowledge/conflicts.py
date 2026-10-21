import hashlib
import json
import math
from typing import List, Optional

from iad_core.knowledge.models import KnowledgeCheck, KnowledgeConflict, KnowledgeEvidence, KnowledgeObservationStep, KnowledgeSnapshot


class KnowledgeConflicts:
    @staticmethod
    def reconcile(parent: Optional[KnowledgeSnapshot], checks: List[KnowledgeCheck],
                  observations: List[KnowledgeObservationStep], evidence: List[KnowledgeEvidence],
                  groups: dict[str, str]) -> List[KnowledgeConflict]:
        if parent is None:
            return []
        conflicts = {item.conflict_id: item.model_copy(deep=True) for item in parent.conflicts}
        images = {item.image.evidence_id: item for item in evidence}
        prior = {check.check_id: check for check in parent.checks}
        compared = {eid for step in observations if step.purpose in ('comparison', 'revision') for eid in step.input_evidence_ids}
        for step in observations:
            if step.purpose not in ('current', 'revision'):
                continue
            for observation in step.result.observations:
                if observation.status != 'contradicts':
                    continue
                candidate = next((check for check in checks if check.check_id == observation.check_id), None)
                related = [cid for cid in (candidate.predecessor_check_ids if candidate else []) if cid in prior]
                if observation.check_id in prior:
                    related = list(dict.fromkeys([observation.check_id, *related]))
                if not related:
                    raise ValueError('冲突观察缺少可追溯的旧判据')
                old = prior[related[0]]
                regions = observation.suspects or [None]
                for region in regions:
                    image = images[region.evidence_id if region else observation.evidence_ids[0]].image
                    bbox = None
                    if region:
                        x1, y1, x2, y2 = image.crop_bbox
                        a, b, c, d = region.bbox_1000
                        bbox = [math.floor(x1 + (x2-x1)*a/1000), math.floor(y1 + (y2-y1)*b/1000),
                                math.ceil(x1 + (x2-x1)*c/1000), math.ceil(y1 + (y2-y1)*d/1000)]
                    previous = next((item for item in conflicts.values() if item.sample_id == observation.sample_id
                        and item.source_sha256 == image.source_sha256 and item.bbox == bbox
                        and observation.check_id in item.check_ids), None)
                    comparisons = [eid for eid in old.support_evidence_ids if eid in compared]
                    if previous:
                        previous.resolution = None
                        previous.observation_step_ids = list(dict.fromkeys([*previous.observation_step_ids, step.step_id]))
                        previous.new_evidence_ids = list(dict.fromkeys([*previous.new_evidence_ids, *observation.evidence_ids]))
                        previous.comparison_evidence_ids = list(dict.fromkeys([*previous.comparison_evidence_ids, *comparisons]))
                    else:
                        identity = json.dumps([old.check_id, observation.sample_id, image.source_sha256, bbox])
                        value = KnowledgeConflict(conflict_id='conflict_' + hashlib.sha256(identity.encode()).hexdigest(),
                            origin_version_id=parent.version_id, check_ids=list(dict.fromkeys([*related, observation.check_id])), sample_id=observation.sample_id,
                            source_sha256=image.source_sha256, bbox=bbox, observation_step_ids=[step.step_id],
                            new_evidence_ids=observation.evidence_ids, comparison_evidence_ids=comparisons,
                            description=region.description if region else observation.description,
                            normal_explanation=observation.normal_explanation,
                            limitations=[] if comparisons else ['缺少可观察的旧支持比较，待补证'])
                        conflicts[value.conflict_id] = value
        for old in parent.checks:
            if any(check.check_id == old.check_id or old.check_id in check.predecessor_check_ids for check in checks):
                continue
            observed = next(((step, item) for step in observations if step.purpose == 'current'
                             for item in step.result.observations if item.check_id == old.check_id), None)
            if observed is None:
                raise ValueError('退役建议缺少本轮旧判据观察')
            step, item = observed
            image = images[item.evidence_ids[0]].image
            identity = json.dumps([old.check_id, item.sample_id, image.source_sha256, 'retirement'])
            value = KnowledgeConflict(conflict_id='conflict_' + hashlib.sha256(identity.encode()).hexdigest(),
                category='retirement_proposal', origin_version_id=parent.version_id, check_ids=[old.check_id],
                sample_id=item.sample_id, source_sha256=image.source_sha256, bbox=None,
                observation_step_ids=[step.step_id], new_evidence_ids=item.evidence_ids,
                comparison_evidence_ids=[eid for eid in old.support_evidence_ids if eid in compared],
                description=old.title + '：模型建议退役，待人工核实', normal_explanation=item.normal_explanation, limitations=[])
            conflicts.setdefault(value.conflict_id, value)
        KnowledgeConflicts.quarantine(list(conflicts.values()), checks, evidence, groups, parent)
        return list(conflicts.values())

    @staticmethod
    def quarantine(conflicts: List[KnowledgeConflict], checks: List[KnowledgeCheck], evidence: List[KnowledgeEvidence],
                   groups: dict[str, str], parent: Optional[KnowledgeSnapshot]):
        images = {item.image.evidence_id: item for item in evidence}
        prior = {check.check_id: check for check in parent.checks} if parent else {}
        for conflict in conflicts:
            if conflict.resolution and conflict.resolution.status == 'resolved':
                continue
            descendants = [check for check in checks if check.check_id in conflict.check_ids
                           or set(check.predecessor_check_ids) & set(conflict.check_ids)
                           or conflict.conflict_id in check.conflict_ids]
            if not descendants:
                descendants = [prior[cid].model_copy(deep=True) for cid in conflict.check_ids if cid in prior]
                checks.extend(descendants)
            conflict.check_ids = list(dict.fromkeys([*conflict.check_ids, *[check.check_id for check in descendants]]))
            affected_group = groups.get(conflict.sample_id)
            for check in descendants:
                check.status = 'conflicted'
                check.conflict_ids = list(dict.fromkeys([*check.conflict_ids, conflict.conflict_id]))
                check.support_evidence_ids = [eid for eid in check.support_evidence_ids
                    if eid in images and images[eid].sample_id != conflict.sample_id
                    and (affected_group is None or groups.get(images[eid].sample_id) != affected_group)]
                check.counter_evidence_ids = list(dict.fromkeys([*check.counter_evidence_ids, *conflict.new_evidence_ids]))
