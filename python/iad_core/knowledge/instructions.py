import hashlib
import json
import os
from pathlib import Path
from typing import Annotated, List, Literal, Optional

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.prompt_files import PromptFiles


class PresetDirectionSource(AnalysisModel):
    origin: Literal['preset'] = 'preset'
    catalog_id: str = 'knowledge-directions'
    direction_id: NonBlankText
    revision: NonBlankText


class ExploredDirectionSource(AnalysisModel):
    origin: Literal['explored'] = 'explored'
    run_id: NonBlankText
    version_id: NonBlankText
    direction_id: NonBlankText


MiningDirectionSource = Annotated[PresetDirectionSource | ExploredDirectionSource, Field(discriminator='origin')]


class MiningDirection(AnalysisModel):
    direction_id: NonBlankText
    title: NonBlankText
    instruction: NonBlankText
    enabled: bool = True
    origin: Literal['preset', 'dataset', 'explored'] = 'dataset'
    source: MiningDirectionSource | None = None

    @property
    def source_key(self) -> str:
        return json.dumps([self.origin, self.direction_id, self.source.model_dump() if self.source else None], sort_keys=True)


class MiningExploration(AnalysisModel):
    version_id: str
    summary: str
    limitations: List[str]


class MiningPromptConfiguration(AnalysisModel):
    objective: NonBlankText
    directions: List[MiningDirection]
    instruction: Optional[NonBlankText] = None
    exploration: Optional[MiningExploration] = None

    @model_validator(mode='after')
    def unique_directions(self):
        ids = [item.source_key for item in self.directions]
        if len(ids) != len(set(ids)):
            raise ValueError('挖掘方向来源不能重复')
        return self

    def render(self) -> str:
        if self.instruction is not None:
            return self.instruction
        directions = [f'{item.direction_id} | {item.title}：{item.instruction}' for item in self.directions if item.enabled]
        context = ('\n方向探索结论：' + self.exploration.summary + '\n探索限制：' + '；'.join(self.exploration.limitations)) if self.exploration else ''
        return '挖掘目标：' + self.objective + context + '\n用户选择的观察方向：\n' + '\n'.join(directions)


class SubmittedMiningPrompt(MiningPromptConfiguration):
    instruction: NonBlankText

    @model_validator(mode='after')
    def unique_directions(self):
        selected = {}
        for direction in self.directions:
            selected.setdefault(direction.source_key, direction)
        self.directions = list(selected.values())
        return self


class FrozenMiningPrompt(AnalysisModel):
    configuration: MiningPromptConfiguration
    instruction: str
    signature: str = Field(pattern='^[a-f0-9]{64}$')

    @classmethod
    def capture(cls, configuration: MiningPromptConfiguration):
        instruction = configuration.render()
        return cls(configuration=configuration, instruction=instruction, signature=cls.signature_for(configuration, instruction))

    @staticmethod
    def signature_for(configuration: MiningPromptConfiguration, instruction: str) -> str:
        return hashlib.sha256(json.dumps({'configuration': configuration.model_dump(exclude_none=True), 'instruction': instruction},
                                        sort_keys=True, ensure_ascii=False).encode()).hexdigest()

    @model_validator(mode='after')
    def valid_signature(self):
        if self.signature_for(self.configuration, self.instruction) != self.signature:
            raise ValueError('冻结挖掘提示词内容与签名不一致')
        return self


def default_directions() -> list[MiningDirection]:
    directory = Path(os.environ.get('IAD_KNOWLEDGE_DIRECTIONS_DIR') or Path(__file__).with_name('directions'))
    return [MiningDirection(direction_id=preset.id, title=preset.name, instruction=preset.text, origin='preset',
        source=PresetDirectionSource(direction_id=preset.id,
            revision=hashlib.sha256((preset.name + '\n' + preset.text).encode()).hexdigest()))
        for preset in PromptFiles(directory).list()]

DEFAULT_OBJECTIVE = '联合比较所选范围的真实图像，发现可观察规律、允许变化、异常候选及适用边界，保留支持、反对和证据不足。'
