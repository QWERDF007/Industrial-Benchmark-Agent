from typing import TYPE_CHECKING

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.annotation_inventory import AnnotationInventory
from iad_core.consistency.annotation_models import AnnotationMatchingConfig
from iad_core.consistency.comparison_domain import ComparisonDomain
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.models import Relation

if TYPE_CHECKING:
    from iad_core.consistency.annotations import AnnotationSet


class AnnotationApplicability(AnalysisModel):
    inventory: AnnotationInventory
    limitations: list[str]
    absence_required: bool
    unsupported_absence: list[ConflictCategory]

    @classmethod
    def compare(cls, left: 'AnnotationSet', right: 'AnnotationSet', relation: Relation,
                matching: AnnotationMatchingConfig) -> 'AnnotationApplicability':
        sides, limitations, unsupported = [left, right], [], []
        for name, side, category in zip(('主图', '候选'), sides, (ConflictCategory.MISSING, ConflictCategory.EXTRA)):
            if side.dataset_format == 'folder_classification':
                continue
            if side.availability.status not in ('VALID_EMPTY', 'VALID_NONEMPTY'):
                limitations.append(f'{name}标注来源为{side.availability.status}，不能将未提供或未知来源视为有效空标')
            if side.policy.annotation_coverage != 'EXHAUSTIVE':
                limitations.append(f'{name}标注覆盖为{side.policy.annotation_coverage}，不能据此推断未标区域缺标')
            if not side.supports_absence:
                unsupported.append(category)
        if any(item.is_ignored for side in sides for item in side.annotations):
            if relation != 'EXACT':
                limitations.append('忽略区域缺少可靠坐标对应，不能建立共同可比域')
                unsupported = [ConflictCategory.EXTRA, ConflictCategory.MISSING]
            else:
                domain = ComparisonDomain.prepare(sides, relation, matching)
                limitations.extend(issue.reason for issue in domain.issues)
                if domain.unavailable_reason:
                    limitations.append(domain.unavailable_reason)
                if domain.issues or domain.unavailable_reason:
                    unsupported = [ConflictCategory.EXTRA, ConflictCategory.MISSING]
                sides = [side.model_copy(update={'annotations': [geometry.annotation for geometry in visible.values()]})
                    for side, visible in zip(sides, domain.sides)]
        inventory = AnnotationInventory.compare(*sides)
        return cls(inventory=inventory, limitations=limitations, unsupported_absence=unsupported,
            absence_required=inventory.left != inventory.right or any(not side.annotations and
                side.availability.status not in ('VALID_EMPTY', 'VALID_NONEMPTY') and
                side.dataset_format != 'folder_classification' for side in sides))
