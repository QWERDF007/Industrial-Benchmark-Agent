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

CONFLICT_CATEGORY_DESCRIPTIONS: dict[ConflictCategory, str] = {
    ConflictCategory.CATEGORY: '同一目标在两张图中的类别记录不同。',
    ConflictCategory.EXTRA: '主图有标注，对照图中同一处可见内容没有相应标注。',
    ConflictCategory.MISSING: '对照图有标注，主图中同一处可见内容没有相应标注。',
    ConflictCategory.POSITION: '两张图都标了同一目标，但框圈住的实际内容有明显差别，例如一侧漏掉了目标的一部分。',
    ConflictCategory.SPLIT: '同一组可见内容在主图中分成多个框，在对照图中用一个框圈住。',
    ConflictCategory.MERGE: '同一组可见内容在主图中用一个框圈住，在对照图中分成多个框。',
}
