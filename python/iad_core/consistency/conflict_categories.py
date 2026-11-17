from enum import StrEnum
from collections.abc import Iterable
from dataclasses import dataclass


class ConflictCategory(StrEnum):
    CATEGORY = '类别不一致'
    MISSING = '少类别'
    EXTRA = '多类别'
    MISSING_CONTENT = '少标内容'
    EXTRA_CONTENT = '多标内容'
    SPLIT = '拆分'
    MERGE = '合并'
    POSITION = '位置差异'


@dataclass(frozen=True)
class ConflictRule:
    label: str
    priority: int
    severity: float
    issue_type: str
    description: str


CONFLICT_RULES = {
    ConflictCategory.CATEGORY: ConflictRule('类别不一致', 0, 1, 'category_mismatch', '同一目标在两张图中的类别记录不同。'),
    ConflictCategory.MISSING: ConflictRule('少标实例', 0, 1, 'missing_annotation', '候选图有完整的缺陷实例标注，主图缺少对应实例标注。'),
    ConflictCategory.EXTRA: ConflictRule('多标实例', 0, 1, 'extra_annotation', '主图多出一个完整实例标注，候选图没有对应实例标注。'),
    ConflictCategory.MISSING_CONTENT: ConflictRule('少标内容', 1, .3, 'missing_content', '同一对象的主图标注漏盖候选图已覆盖的部分内容。'),
    ConflictCategory.EXTRA_CONTENT: ConflictRule('多标内容', 1, .3, 'extra_content', '同一对象的主图标注额外覆盖候选图未覆盖的部分内容。'),
    ConflictCategory.SPLIT: ConflictRule('拆分', 2, 0, 'split', '同一组内容在主图中用多个标注，在候选图中用一个标注。'),
    ConflictCategory.MERGE: ConflictRule('合并', 2, 0, 'merge', '同一组内容在主图中用一个标注，在候选图中用多个标注。'),
}
CONFLICT_CATEGORY_PRIORITIES = {category: rule.priority for category, rule in CONFLICT_RULES.items()}
CONFLICT_CATEGORY_LABELS = {category: rule.label for category, rule in CONFLICT_RULES.items()}
CONFLICT_CATEGORY_DESCRIPTIONS = {category: rule.description for category, rule in CONFLICT_RULES.items()}
CONFLICT_CATEGORY_DEFAULTS = {'labelme': list(CONFLICT_RULES), 'folder_classification': [ConflictCategory.CATEGORY]}


def primary_conflict_category(categories: Iterable[ConflictCategory]) -> ConflictCategory | None:
    order = {category: index for index, category in enumerate(CONFLICT_RULES)}
    return min((category for category in categories if category in CONFLICT_RULES),
        key=lambda category: (CONFLICT_CATEGORY_PRIORITIES[category], order[category]), default=None)
