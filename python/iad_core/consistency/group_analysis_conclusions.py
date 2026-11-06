import re

from iad_core.advisory.conclusions import descriptive_conclusion
from iad_core.advisory.output_validation import repairable_output_error


# These are output-contract violations, not a rule for classifying image content.
_HEDGED_CONCLUSION = re.compile(
    r'基本一致|大致一致|大体一致|基本相同|大致相同|似乎|可能|疑似|倾向于|'
    r'待核对|待确认|待定|有待|尚需核对|仍需核对|需要进一步|建议.{0,8}(?:核对|确认)|'
    r'largely consistent|mostly consistent|appears to|possibly|probably|may be',
    re.IGNORECASE,
)
_ALTERNATIVE_DIRECTION = re.compile(r'(?:缺少|缺失|漏标).{0,4}(?:或|/|／).{0,4}(?:多出|多标|增加)|(?:多出|多标|增加).{0,4}(?:或|/|／).{0,4}(?:缺少|缺失|漏标)|拆分.{0,3}(?:或|/|／).{0,3}合并|合并.{0,3}(?:或|/|／).{0,3}拆分')


def assertive_conclusion(value: str) -> str:
    descriptive_conclusion(value)
    if _ALTERNATIVE_DIRECTION.search(value):
        raise repairable_output_error('ambiguous_consistency_direction',
            '最终结论不得使用缺少或多出、拆分或合并等方向二选一表达。以anchor主图为主语，相对当前候选图明确选择缺少、多出、拆分或合并；多种实际差异可用顿号并列，分析说明具体位置和依据。')
    if match := _HEDGED_CONCLUSION.search(value):
        raise repairable_output_error('hedged_consistency_conclusion',
            f'结论使用了模糊表述“{match.group()}”。请重新核对图像和标注，直接陈述已观察的类别、位置、数量、'
            '拆分或合并等具体事实及判断；没有差异则说明各项对应情况。确实缺失证据时写明缺失内容及其阻断的判断，'
            '不得用基本一致、可能或待核对代替结论。不要仅删除措辞或用一致/不一致标签替换原答')
    return value
