import re
from typing import Annotated

from pydantic import AfterValidator, Field
from iad_core.advisory.output_validation import repairable_output_error

from iad_core.advisory.analysis import NonBlankText


_EVIDENCE_REFERENCE = re.compile(
    r'@v\d+|img_[a-f0-9]{6,64}(?![a-f0-9])|ds_[a-f0-9]+:|[^\s，。；（）()、]+\.(?:png|jpe?g|bmp|webp|tiff?)\b',
    re.IGNORECASE,
)


def descriptive_conclusion(value: str) -> str:
    if _EVIDENCE_REFERENCE.search(value):
        raise repairable_output_error('evidence_in_conclusion', '结论和描述只概括规律，具体图像编号或文件名须放入证据字段')
    return value


ConclusionText = Annotated[str, Field(description='概括可复用的观察结论或方法，不包含具体图像编号、文件名或来源路径；实际证据写入专用引用字段'),
                           AfterValidator(descriptive_conclusion)]

NonBlankConclusion = Annotated[NonBlankText, Field(description='概括可复用结论或观察方法，不写图像编号、文件名或来源路径；具体证据放入专用引用字段'),
                               AfterValidator(descriptive_conclusion)]
