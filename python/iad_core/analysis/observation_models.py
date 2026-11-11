from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.analysis.prompt_text import DIRECTION_OBSERVATION_WORKFLOW


class AnalysisDirectionObservation(AnalysisModel):
    direction_ref: NonBlankText
    status: Literal['applicable', 'not_applicable', 'uncertain'] = Field(description=DIRECTION_OBSERVATION_WORKFLOW)
    reason: NonBlankText


class AnalysisSampleObservation(AnalysisModel):
    dataset_id: NonBlankText
    sample_id: NonBlankText
    description: NonBlankText = Field(description='仅描述这张图实际观察的事实；局部定位使用原图坐标。')
    evidence_ids: list[str] = Field(description='实际送达且已观察的完整原图evidence_id；原图关联其原始标注及全部局部视图，不单独引用裁图或掩膜。')
    directions: list[AnalysisDirectionObservation] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    report_preparation_error: bool = Field(default=False, description='仅在已有实际取证错误回执时设为true；能读取原图时仍保留可见事实。')


class AnalysisObservationRecord(AnalysisSampleObservation):
    observation_id: str
    round_id: int
    revision: int
