from typing import Literal

from iad_core.consistency.conflict_categories import CONFLICT_CATEGORY_DEFAULTS


ConsistencyTaskType = Literal['anomaly_detection', 'bbox_defect']
TASK_TYPES_BY_FORMAT: dict[str, ConsistencyTaskType] = {
    'folder_classification': 'anomaly_detection', 'labelme': 'bbox_defect',
}
TASK_CATEGORIES = {task: CONFLICT_CATEGORY_DEFAULTS[format] for format, task in TASK_TYPES_BY_FORMAT.items()}
