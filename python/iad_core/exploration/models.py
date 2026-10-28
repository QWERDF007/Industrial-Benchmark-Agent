from typing import Literal, Optional

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.knowledge.models import KnowledgeEvidence, KnowledgeSource


class ExplorationPresetEdit(AnalysisModel):
    name: NonBlankText
    text: NonBlankText


class ExplorationPromptPreset(ExplorationPresetEdit):
    id: str
    builtin: bool


class FrozenExplorationPrompt(AnalysisModel):
    preset_id: Optional[str] = None
    preset_name: Optional[str] = None
    text: NonBlankText


class ExplorationStart(AnalysisModel):
    dataset_id: str
    normal_images: list[str] = Field(min_length=1)
    defect_images: list[str] = Field(min_length=1)
    objective: NonBlankText = '联合比较候选良品和异常样例，自行提出适合此数据集的可观察检查方向。'
    prompt: Optional[FrozenExplorationPrompt] = None

    @model_validator(mode='after')
    def unique_images(self):
        images = self.normal_images + self.defect_images
        if len(set(images)) != len(images):
            raise ValueError('两组图像必须无重复，不能将同一图像同时放入两组')
        return self


class ProposedDirection(AnalysisModel):
    title: NonBlankText
    instruction: NonBlankText
    applies_to: Literal['normal', 'defect', 'both']
    rationale: NonBlankText
    evidence_ids: list[str] = Field(min_length=1)
    limitations: list[str]


class DirectionDraft(AnalysisModel):
    summary: str
    directions: list[ProposedDirection]
    limitations: list[str]

    @model_validator(mode='after')
    def unique_titles(self):
        titles = [d.title.strip().casefold() for d in self.directions]
        if len(set(titles)) != len(titles):
            raise ValueError('探索方向名称必须唯一')
        return self


class ExploredDirection(ProposedDirection):
    direction_id: str


class ExplorationSnapshot(DirectionDraft):
    version_id: str
    dataset_id: str
    run_id: str
    created_at: str
    model_name: str
    signature: str
    request: ExplorationStart
    directions: list[ExploredDirection]
    normal_sources: list[KnowledgeSource]
    defect_sources: list[KnowledgeSource]
    evidence: list[KnowledgeEvidence]


class ExplorationVersion(AnalysisModel):
    version_id: str
    dataset_id: str
    run_id: str
    created_at: str
    direction_count: int


class ExplorationCatalog(AnalysisModel):
    dataset_id: str
    versions: list[ExplorationVersion]
    exploration: Optional[ExplorationSnapshot]


class DirectionChoice(AnalysisModel):
    direction_id: str
    title: Optional[NonBlankText] = None
    instruction: Optional[NonBlankText] = None
    enabled: bool = True


class DirectionAdoption(AnalysisModel):
    dataset_id: str
    kind: Literal['normal', 'defect']
    expected_revision: str
    directions: list[DirectionChoice] = Field(min_length=1)

    @model_validator(mode='after')
    def unique_choices(self):
        ids = [d.direction_id for d in self.directions]
        if len(ids) != len(set(ids)):
            raise ValueError('采用的方向ID不能重复')
        return self
