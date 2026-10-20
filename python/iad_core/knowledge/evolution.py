import json
import uuid
from typing import List, Optional

from iad_core.knowledge.models import KnowledgeCheck, KnowledgeDraft, KnowledgeSnapshot


EVOLUTION_INSTRUCTION = """以下是冻结父版本的检查判据，仅作为本轮需要重新观察的候选，不是本轮视觉事实。
结合全部当前来源核验并扩展知识，保留已有有效判据、正常变化和未消解的矛盾；不要因新增样本就遗忘已有维度。
父版本只传判据身份，不传旧状态、证据或观察限制。本轮重新判断状态和限制：新增支持可使假设获得支持，反例也可使旧规则失效。
支持与反对仅引用本轮实际图像或子批次记录；按本轮来源覆盖评估，不能沿用已过时的单样本限制，也不能自动把旧假设升级为共识。
用revisions解释每个previous_check_id在当前checks中的去向，最终综合必须恰好覆盖全部旧检查项。
只有同类型冻结父版本中的ID可用于revisions；normal_version_id/normal_checks是正常比较依据，不是不良知识的父检查项。
没有父检查项时revisions必须为空数组；不得为正常比较规则编造不良规则的身份继承。
同一适用对象、位置及可观察判据改措辞/补充允许变化时映射到一项；判据分拆映射到多项，合并可由多个旧项指向同一项。
已被反驳、不再适用或本轮无法支持的旧判据不得静默丢失：保留conflicted/provisional并说明限制，或空映射并给出退役理由。
不要为不同判据复用身份；新发现没有旧项映射。旧规则不代表预设产品清单。不编造旧ID或当前title。
冻结父版本候选："""


class KnowledgeEvolution:
    def __init__(self, parent: Optional[KnowledgeSnapshot]):
        self.parent = parent

    @property
    def instruction(self) -> str:
        return EVOLUTION_INSTRUCTION + json.dumps({
            'version_id': self.parent.version_id if self.parent else None,
            'checks': [check.model_dump(exclude={'support_evidence_ids', 'counter_evidence_ids',
                'finding_ids', 'normal_check_ids', 'predecessor_check_ids', 'status', 'limitations'})
                for check in self.parent.checks] if self.parent else [],
        }, ensure_ascii=False) + '\n'

    def checks(self, draft: KnowledgeDraft) -> List[KnowledgeCheck]:
        previous = {check.check_id for check in self.parent.checks} if self.parent else set()
        revisions = {revision.previous_check_id: revision for revision in draft.revisions}
        if len(revisions) != len(draft.revisions) or set(revisions) != previous:
            raise ValueError('Knowledge revisions must cover each frozen parent check exactly once')
        titles = {check.title for check in draft.checks}
        predecessors: dict[str, List[str]] = {title: [] for title in titles}
        for revision in draft.revisions:
            mapped = revision.current_check_titles
            if len(set(mapped)) != len(mapped) or not set(mapped) <= titles:
                raise ValueError('Knowledge revision must cite distinct current check titles')
            for title in mapped:
                predecessors[title].append(revision.previous_check_id)
        checks = []
        for check in draft.checks:
            old_ids = predecessors[check.title]
            unchanged_identity = len(old_ids) == 1 and len(revisions[old_ids[0]].current_check_titles) == 1
            checks.append(KnowledgeCheck(check_id=old_ids[0] if unchanged_identity else 'check_' + uuid.uuid4().hex,
                                         predecessor_check_ids=old_ids, **check.model_dump()))
        return checks
