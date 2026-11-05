import re
from typing import Annotated

from pydantic import AfterValidator, Field
from iad_core.advisory.output_validation import repairable_output_error

from iad_core.advisory.analysis import NonBlankText


_EVIDENCE_REFERENCE = re.compile(
    r'@[a-z]\d+|img_[a-f0-9]{6,64}(?![a-f0-9])|ds_[a-f0-9]+:|[^\s，。；（）()、]+\.(?:png|jpe?g|bmp|webp|tiff?)\b',
    re.IGNORECASE,
)


def descriptive_conclusion(value: str) -> str:
    if match := _EVIDENCE_REFERENCE.search(value):
        raise repairable_output_error('evidence_in_conclusion',
            f'正文包含具体引用“{match.group()}”；该引用只能放入对应的结构化引用字段，正文须用自然语言说明观察和规律')
    return value


ConclusionText = Annotated[str, Field(description='用自然语言概括观察结论或方法，不包含具体引用编号、文件名或来源路径；实际引用写入专用字段'),
                           AfterValidator(descriptive_conclusion)]

NonBlankConclusion = Annotated[NonBlankText, Field(description='用自然语言概括结论或观察，不写具体引用编号、文件名或来源路径；实际引用放入专用字段'),
                               AfterValidator(descriptive_conclusion)]
