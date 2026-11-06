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
