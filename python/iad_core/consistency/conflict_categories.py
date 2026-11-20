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


    @property
    def inverse(self) -> 'ConflictCategory':
        return CONFLICT_CATEGORY_INVERSES.get(self, self)


CONFLICT_CATEGORY_INVERSES = {source: target for pair in (
    (ConflictCategory.MISSING, ConflictCategory.EXTRA),
    (ConflictCategory.MISSING_CONTENT, ConflictCategory.EXTRA_CONTENT),
    (ConflictCategory.SPLIT, ConflictCategory.MERGE)) for source, target in (pair, pair[::-1])}


@dataclass(frozen=True)
class ConflictRule:
    label: str
    priority: int
    issue_type: str
    description: str


CONFLICT_RULES = {
    ConflictCategory.CATEGORY: ConflictRule('类别不一致', 0, 'category_mismatch', '同一目标在两张图中的类别记录不同。'),
    ConflictCategory.MISSING: ConflictRule('少标实例', 0, 'missing_annotation', '候选图有完整的缺陷实例标注，主图缺少对应实例标注。'),
    ConflictCategory.EXTRA: ConflictRule('多标实例', 0, 'extra_annotation', '主图多出一个完整实例标注，候选图没有对应实例标注。'),
    ConflictCategory.MISSING_CONTENT: ConflictRule('少标内容', 1, 'missing_content', '同一对象的主图标注明显漏盖候选图已覆盖的一大块内容。'),
    ConflictCategory.EXTRA_CONTENT: ConflictRule('多标内容', 1, 'extra_content', '同一对象的主图标注明显多盖候选图未覆盖的一大块内容。'),
    ConflictCategory.SPLIT: ConflictRule('拆分', 2, 'split', '同一组内容在主图中用多个标注，在候选图中用一个标注。'),
    ConflictCategory.MERGE: ConflictRule('合并', 2, 'merge', '同一组内容在主图中用一个标注，在候选图中用多个标注。'),
    ConflictCategory.POSITION: ConflictRule('位置差异', 3, 'position_difference', '同一对象的实际覆盖基本相同，主要是轮廓、位置或边界偏移。'),
}
CONFLICT_CATEGORY_PRIORITIES = {category: rule.priority for category, rule in CONFLICT_RULES.items()}
CONFLICT_CATEGORY_LABELS = {category: rule.label for category, rule in CONFLICT_RULES.items()}
CONFLICT_CATEGORY_DESCRIPTIONS = {category: rule.description for category, rule in CONFLICT_RULES.items()}
CONFLICT_CATEGORY_DEFAULTS = {'labelme': list(CONFLICT_RULES), 'folder_classification': [ConflictCategory.CATEGORY]}


def primary_conflict_category(categories: Iterable[ConflictCategory]) -> ConflictCategory | None:
    order = {category: index for index, category in enumerate(CONFLICT_RULES)}
    return min((category for category in categories if category in CONFLICT_RULES),
        key=lambda category: (CONFLICT_CATEGORY_PRIORITIES[category], order[category]), default=None)
