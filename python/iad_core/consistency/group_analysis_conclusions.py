from iad_core.advisory.conclusions import descriptive_conclusion
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.conflict_categories import CONFLICT_CATEGORY_DEFAULTS, CONFLICT_CATEGORY_LABELS


CONCLUSION_CATEGORIES = tuple(CONFLICT_CATEGORY_DEFAULTS['labelme'])
EQUIVALENT_CONCLUSION = '一致'
CONCLUSION_CHOICES = (*CONCLUSION_CATEGORIES, EQUIVALENT_CONCLUSION)
MODEL_CONCLUSION_LABELS = {**CONFLICT_CATEGORY_LABELS, 'EQUIVALENT': EQUIVALENT_CONCLUSION}


def assertive_conclusion(value: str | None, verdict: str) -> str | None:
    if verdict == 'UNCERTAIN':
        if value is not None:
            raise repairable_output_error('unsupported_consistency_conclusion',
                '确实缺失比较证据时conclusion及overall.text必须为null，具体缺失依据写入分析；不能输出其他结论或编造六类冲突。')
        return value
    if value is None:
        raise repairable_output_error('missing_consistency_conclusion',
            '已完成比较必须给出结论：MATERIAL从六类冲突中单选，EQUIVALENT只写一致。')
    descriptive_conclusion(value)
    allowed = CONCLUSION_CATEGORIES if verdict == 'MATERIAL' else (EQUIVALENT_CONCLUSION,)
    if value not in allowed:
        raise repairable_output_error('unsupported_consistency_conclusion',
            'conclusion和overall.text必须精确匹配一个允许值：' + '、'.join(allowed)
            + '。不得添加标点、前后缀、同义改写或并列结论；多项差异写在分析中，并选择主要差异作为唯一结论。')
    return value
