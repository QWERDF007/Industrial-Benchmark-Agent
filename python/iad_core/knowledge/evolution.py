import uuid
from typing import List, Optional

from iad_core.knowledge.models import CheckRevision, KnowledgeCheck, KnowledgeCorrection, KnowledgeDraft, KnowledgeSnapshot




class KnowledgeEvolution:
    def __init__(self, parent: Optional[KnowledgeSnapshot], corrections: Optional[List[KnowledgeCorrection]] = None):
        self.parent = parent
        self.corrections = corrections or []
        ids = [item.check_id for item in self.corrections]
        allowed = {check.check_id for check in parent.checks} if parent else set()
        if len(ids) != len(set(ids)) or not set(ids) <= allowed:
            raise ValueError('人工修订必须唯一关联当前基准版本的检查项')

    @property
    def context(self) -> dict:
        return {
            'version_id': self.parent.version_id if self.parent else None,
            'allowed_predecessor_check_ids': [check.check_id for check in self.parent.checks] if self.parent else [],
            'summary': self.parent.summary if self.parent else '',
            'limitations': self.parent.limitations if self.parent else [],
            'checks': [dict(check.criterion_context(), historical_support_count=len(check.support_evidence_ids),
                            historical_counter_count=len(check.counter_evidence_ids)) for check in self.parent.checks] if self.parent else [],
            'corrections':[item.model_dump() for item in self.corrections],
        }

    def checks(self, draft: KnowledgeDraft) -> List[KnowledgeCheck]:
        previous = {check.check_id for check in self.parent.checks} if self.parent else set()
        revisions = {revision.previous_check_id: revision for revision in draft.revisions}
        if len(revisions) != len(draft.revisions) or not set(revisions).issubset(previous):
            raise ValueError('Knowledge revisions must cite distinct frozen parent checks')
        titles = {check.title for check in draft.checks}
        for revision in draft.revisions:
            mapped = revision.current_check_titles
            if len(set(mapped)) != len(mapped) or not set(mapped) <= titles:
                raise ValueError('Knowledge revision must cite distinct current check titles')
        for check in draft.checks:
            matches = [old for old in self.parent.checks if old.identity == check.identity] if self.parent else []
            if not matches:
                continue
            if len(matches) != 1:
                raise ValueError('相同判据对应多个历史条目，须先明确知识身份')
            old = matches[0]
            if old.check_id in revisions:
                if check.title not in revisions[old.check_id].current_check_titles:
                    raise ValueError('同一判据不能在修订或退役之外另建重复条目')
            elif any(check.title in item.current_check_titles for item in draft.revisions):
                raise ValueError('同一判据已有其他继承映射，须明确所有受影响条目')
            else:
                revision = CheckRevision(previous_check_id=old.check_id, current_check_titles=[check.title],
                                         reason='同一对象、位置及可观察判据的新增支持')
                draft.revisions.append(revision)
                revisions[old.check_id] = revision
        predecessors: dict[str, List[str]] = {title: [] for title in titles}
        for revision in draft.revisions:
            for title in revision.current_check_titles:
                predecessors[title].append(revision.previous_check_id)
        prior = {check.check_id: check for check in self.parent.checks} if self.parent else {}
        checks = [check.model_copy(deep=True) for check in prior.values() if check.check_id not in revisions]
        identities = {check.identity for check in checks}
        for check in draft.checks:
            if check.identity in identities:
                raise ValueError("Knowledge revision is required for an existing criterion; duplicate entries are not allowed")
            identities.add(check.identity)
            old_ids = predecessors[check.title]
            unchanged_identity = len(old_ids) == 1 and len(revisions[old_ids[0]].current_check_titles) == 1
            value = KnowledgeCheck(check_id=old_ids[0] if unchanged_identity else 'check_' + uuid.uuid4().hex,
                                   predecessor_check_ids=old_ids, **check.model_dump())
            for previous_id in old_ids:
                old = prior[previous_id]
                value.recheck_sample_ids = list(dict.fromkeys([*old.recheck_sample_ids, *value.recheck_sample_ids]))
                value.support_evidence_ids = list(dict.fromkeys([*old.support_evidence_ids, *value.support_evidence_ids]))
                value.counter_evidence_ids = list(dict.fromkeys([*old.counter_evidence_ids, *value.counter_evidence_ids]))
                value.finding_ids = list(dict.fromkeys([*old.finding_ids, *value.finding_ids]))
                value.normal_check_ids = list(dict.fromkeys([*old.normal_check_ids, *value.normal_check_ids]))
                value.limitations = list(dict.fromkeys([*old.limitations, *value.limitations]))
                value.allowed_variations = list(dict.fromkeys([*old.allowed_variations, *value.allowed_variations]))
                if old.status == 'conflicted':
                    value.status = 'conflicted'
            checks.append(value)
        return checks
