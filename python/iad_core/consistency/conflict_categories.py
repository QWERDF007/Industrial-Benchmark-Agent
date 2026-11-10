from enum import StrEnum


class ConflictCategory(StrEnum):
    CATEGORY = '类别不一致'
    POSITION = '位置差异'
    EXTRA = '多类别'
    MISSING = '少类别'
    SPLIT = '拆分'
    MERGE = '合并'
    CORRESPONDENCE = '对应关系差异'


CONFLICT_CATEGORY_DEFAULTS = {
    'labelme': [category for category in ConflictCategory if category != ConflictCategory.CORRESPONDENCE],
    'folder_classification': [ConflictCategory.CATEGORY],
}

CONFLICT_CATEGORY_LABELS: dict[ConflictCategory, str] = {
    ConflictCategory.CATEGORY: ConflictCategory.CATEGORY.value,
    ConflictCategory.EXTRA: '多标',
    ConflictCategory.MISSING: '少标',
    ConflictCategory.POSITION: ConflictCategory.POSITION.value,
    ConflictCategory.SPLIT: ConflictCategory.SPLIT.value,
    ConflictCategory.MERGE: ConflictCategory.MERGE.value,
}
