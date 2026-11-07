from collections import Counter
from typing import TYPE_CHECKING
from pydantic import computed_field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.comparison_domain import ComparisonDomain
from iad_core.consistency.models import Relation

if TYPE_CHECKING:
    from iad_core.consistency.annotations import AnnotationSet
    from iad_core.consistency.annotation_models import AnnotationComparison, AnnotationMatchingConfig


class AnnotationInventory(AnalysisModel):
    left: dict[str,int]
    right: dict[str,int]
    complete: bool

    @classmethod
    def compare(cls,left:'AnnotationSet',right:'AnnotationSet') -> 'AnnotationInventory':
        return cls(left=dict(Counter(left.policy.category_mapping.get(item.raw_label,item.raw_label)
                for item in left.annotations if not item.is_ignored and item.geometry_status!='INVALID' and item.annotation_type!='image')),
            right=dict(Counter(right.policy.category_mapping.get(item.raw_label,item.raw_label)
                for item in right.annotations if not item.is_ignored and item.geometry_status!='INVALID' and item.annotation_type!='image')),
            complete=not (left.errors or right.errors or any(item.geometry_status=='INVALID' for side in (left,right) for item in side.annotations)))

    @property
    def categories(self) -> set[ConflictCategory]:
        if not self.complete:return set()
        result=set()
        left_count,right_count=sum(self.left.values()),sum(self.right.values())
        if left_count!=right_count:result.add(ConflictCategory.EXTRA if left_count>right_count else ConflictCategory.MISSING)
        if Counter(self.left)-Counter(self.right) and Counter(self.right)-Counter(self.left):result.add(ConflictCategory.CATEGORY)
        return result


class AnnotationObservation(AnalysisModel):
    categories: list[ConflictCategory]
    summary: str
    geometry_compared: bool

    @staticmethod
    def conclusion_for(categories:list[ConflictCategory],geometry_compared:bool) -> str:
        return '、'.join(categories) or ('一致' if geometry_compared else '位置无法比较')

    @computed_field
    @property
    def conclusion(self) -> str:
        return self.conclusion_for(self.categories,self.geometry_compared)

    @classmethod
    def capture(cls,left:'AnnotationSet',right:'AnnotationSet',comparison:'AnnotationComparison',relation:Relation,*,reverse:bool=False,
                matching:'AnnotationMatchingConfig | None'=None) -> 'AnnotationObservation':
        if comparison.coordinate_frame=='UNAVAILABLE' and relation!='EXACT' and ComparisonDomain.can_compare_layout(left,right,relation):
            from iad_core.consistency.annotations import AnnotationMatcher
            comparison=AnnotationMatcher(matching).compare(left,right,relation=relation)
        inventory=AnnotationInventory.compare(left,right)
        geometry_compared=(ComparisonDomain.can_compare_layout(left,right,relation)
            and (comparison.coordinate_frame!='UNAVAILABLE' or relation=='EXACT') and comparison.status=='COMPLETE')
        categories=set(comparison.conflict_categories)
        if not geometry_compared:categories.update(inventory.categories)
        if reverse:
            inverse={ConflictCategory.EXTRA:ConflictCategory.MISSING,ConflictCategory.MISSING:ConflictCategory.EXTRA,
                ConflictCategory.SPLIT:ConflictCategory.MERGE,ConflictCategory.MERGE:ConflictCategory.SPLIT}
            categories={inverse.get(category,category) for category in categories}
            inventory=inventory.model_copy(update={'left':inventory.right,'right':inventory.left})
        summary=f'主图 {sum(inventory.left.values())} 个标注，候选图 {sum(inventory.right.values())} 个标注'
        if not inventory.complete or comparison.invalid_left or comparison.invalid_right:summary+='；原始标注读取不完整'
        if geometry_compared:
            summary+=f'；已匹配 {len(comparison.matches)} 对标注的位置及范围'
            if comparison.coordinate_frame=='RELATIVE_IMAGE':summary+='（按图像尺寸归一化）'
        if not geometry_compared:summary+='；位置及范围未进行坐标匹配'
        return cls(categories=[category for category in ConflictCategory if category in categories],summary=summary,geometry_compared=geometry_compared)
