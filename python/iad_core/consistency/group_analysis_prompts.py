from iad_core.consistency.identity_prompts import BBOX_SYSTEM


DEFAULT_CONSISTENCY_PROMPT = (
    '执行数据一致性审核。仅以通过同内容验证的候选比较原始标注，'
    '保留主图相对于候选图的全部独立差异、实际证据与限制，不裁决哪侧标注正确。'
)

DEFAULT_CONSISTENCY_SYSTEM_PROMPT = BBOX_SYSTEM
