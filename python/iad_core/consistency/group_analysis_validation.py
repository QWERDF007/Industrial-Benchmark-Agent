from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.consistency.group_analysis_models import GroupAnalysisDraft
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.consistency.annotation_inventory import AnnotationObservation
from iad_core.consistency.annotation_applicability import AnnotationApplicability
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.evidence.consistency_sources import EvidenceSourcesCapture
from iad_core.evidence.retained import RetainedImages

class GroupAnalysisValidation:
    def __init__(self, db):
        self.repository = ConsistencyRepository(db)
        self.sources = EvidenceSourcesCapture(RetainedImages(db))

    @staticmethod
    def verdict(values):
        priority = {'EQUIVALENT': 0, 'UNCERTAIN': 1, 'MATERIAL': 2}
        return max(values, key=priority.__getitem__)

    def validate(self, result: GroupAnalysisDraft, group: FrozenAnalysisGroup, *,
                 comparable_candidates: set[str]):
        members = {member.image.sample.sample_id: member for member in group.members}
        if len(result.assessments) != len(members) or {item.candidate_id for item in result.assessments} != set(members):
            raise ValueError('Model assessments must cover every frozen candidate exactly once')
        for assessment in result.assessments:
            if members[assessment.candidate_id].comparison is None and assessment.verdict != 'UNCERTAIN':
                raise ValueError('A candidate without direct evidence must remain uncertain')
            reference=members[assessment.candidate_id].comparison
            if reference and assessment.categories is not None:
                frozen=self.repository.get(reference.evidence_id)
                comparable=(frozen.result.verification.relation == 'EXACT'
                    or assessment.candidate_id in comparable_candidates)
                bound=[self.sources.annotations(source) for source in (frozen.sources.left,frozen.sources.right)]
                main,candidate=bound if reference.anchor_side=='left' else bound[::-1]
                applicability=AnnotationApplicability.compare(main,candidate,
                    frozen.result.verification.relation,frozen.parameters.matching)
                inventory=applicability.inventory
                observation=AnnotationObservation.capture(*bound,
                    frozen.result.annotation,frozen.result.verification.relation,reverse=reference.anchor_side=='right',matching=frozen.parameters.matching)
                measured=set(inventory.categories)-set(applicability.unsupported_absence) if comparable else set()
                if comparable and observation.geometry_compared and (frozen.result.verification.relation == 'EXACT'):
                    observed=set(observation.categories)-{ConflictCategory.CORRESPONDENCE}
                    observed-=set(applicability.unsupported_absence)
                    measured.update(observed)
                if applicability.limitations and (assessment.verdict=='EQUIVALENT' and applicability.absence_required or
                        set(applicability.unsupported_absence).intersection(assessment.categories)):
                    raise repairable_output_error('annotation_applicability',
                        '标注适用性不足：'+'；'.join(applicability.limitations)+
                        '。原始数量差异保留，但不能据此提交缺标方向或一致；关键证据不足时应为UNCERTAIN。')
                if (frozen.result.verification.relation=='EXACT' and
                        any(item.is_ignored for side in bound for item in side.annotations) and
                        ({ConflictCategory.EXTRA,ConflictCategory.MISSING}.intersection(assessment.categories)-measured)):
                    raise repairable_output_error('annotation_ignore_domain', '忽略区域以外的共同可比域不支持该缺标方向')
                if assessment.verdict=='EQUIVALENT' and measured:
                    raise repairable_output_error('contradictory_consistency_conclusion',
                        '冻结的原始标注数据已测得主图相对候选图的差异：'+ '、'.join(category.value for category in ConflictCategory if category in measured)
                        +'。未提供容差标准，不能自行以合理浮动、语义相同或未构成实质冲突将标注数据差异判为一致。'
                        '请重新查看原图和标注，以主图为主语给出具体差异类型，更新verdict、categories和conclusion；具体坐标及差异位置写入分析。')
                main_count,candidate_count=sum(inventory.left.values()),sum(inventory.right.values())
                if comparable and inventory.complete and main_count!=candidate_count:
                    expected_category=ConflictCategory.EXTRA if main_count>candidate_count else ConflictCategory.MISSING
                    if expected_category in applicability.unsupported_absence:
                        continue
                    opposite=ConflictCategory.MISSING if main_count>candidate_count else ConflictCategory.EXTRA
                    if (main_count==0 or candidate_count==0) and (
                        assessment.verdict!='MATERIAL' or assessment.conclusion!=expected_category
                        or assessment.categories!=[expected_category]):
                        raise repairable_output_error('incorrect_annotation_direction',
                            f'主图{main_count}个标注、参考图{candidate_count}个标注；空数组表示已知的0个标注，不是缺失证据。'
                            f'这是确定的数量方向，verdict必须为MATERIAL，conclusion只能是{expected_category.value}，'
                            'categories必须只包含同名分类。具体差异依据写在explanation。')
                    direction_known=(not inventory.left or not inventory.right or
                        observation.geometry_compared and ConflictCategory.CORRESPONDENCE not in observation.categories
                        and opposite not in observation.categories)
                    if direction_known and opposite in assessment.categories:
                        raise repairable_output_error('incorrect_annotation_direction',
                            f'主图{sum(inventory.left.values())}个标注、候选{sum(inventory.right.values())}个标注，数量方向是{expected_category.value}，不能反向；请据此重新核对categories、conclusion及分析，不裁定哪侧正确。')
        expected = self.verdict(item.verdict for item in result.assessments)
        if result.overall.verdict != expected:
            raise ValueError(f'整组结论不得否定已确认差异或遗漏证据不足的成员：'
                f'逐候选verdict汇总为{expected}，overall.verdict实际为{result.overall.verdict}。请核对逐候选判断及整组结论')
        for reference in [*result.overall.references, *[ref for conclusion in result.conclusions for ref in conclusion.references]]:
            member = members.get(reference.candidate_id)
            if member is None:
                raise ValueError('Model reference points outside the frozen group')
            if citation := reference.comparison:
                allowed = {member.image.evidence_id, member.comparison.evidence_id if member.comparison else None}
                saved = self.repository.get(citation.evidence_id).result if citation.evidence_id in allowed else None
                if saved is None or saved.result_id != citation.result_id or (citation.difference_id and
                    citation.difference_id not in {item.difference_id for item in saved.annotation.differences}):
                    raise ValueError('Model reference does not match this candidate and frozen comparison')
