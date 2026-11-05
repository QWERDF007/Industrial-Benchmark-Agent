import hashlib
import json
import os
from pathlib import Path
from typing import List, Literal, Optional

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.knowledge.prompt_text import mining_prompt_text, MiningPhase
from iad_core.prompt_files import PromptFiles


class MiningDirection(AnalysisModel):
    direction_id: NonBlankText
    title: NonBlankText
    instruction: NonBlankText
    enabled: bool = True
    origin: Literal['preset', 'dataset', 'explored'] = 'dataset'


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
        ids = [item.direction_id for item in self.directions]
        titles = [item.title.strip().casefold() for item in self.directions]
        if len(ids) != len(set(ids)) or len(titles) != len(set(titles)):
            raise ValueError('挖掘方向的编号和名称不能重复')
        return self

    def render(self) -> str:
        if self.instruction is not None:
            return self.instruction
        directions = [f'{item.direction_id} | {item.title}：{item.instruction}' for item in self.directions if item.enabled]
        context = ('\n方向探索结论：' + self.exploration.summary + '\n探索限制：' + '；'.join(self.exploration.limitations)) if self.exploration else ''
        return '挖掘目标：' + self.objective + context + '\n用户选择的观察方向：\n' + '\n'.join(directions) + '\n\n' + mining_prompt_text()


class SubmittedMiningPrompt(MiningPromptConfiguration):
    instruction: NonBlankText


class FrozenMiningPrompt(AnalysisModel):
    configuration: MiningPromptConfiguration
    instruction: str
    signature: str = Field(pattern='^[a-f0-9]{64}$')

    @classmethod
    def capture(cls, configuration: MiningPromptConfiguration):
        instruction = configuration.render()
        return cls(configuration=configuration, instruction=instruction, signature=cls.signature_for(configuration, instruction))

    def render_context(self, label: str, data: dict, *, phase: MiningPhase) -> str:
        return self.instruction + '\n' + label + '：' + json.dumps(dict(phase=phase.value, **data), ensure_ascii=False)

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
    return [MiningDirection(direction_id=preset.id, title=preset.name, instruction=preset.text, origin='preset')
        for preset in PromptFiles(directory).list()]

DEFAULT_OBJECTIVE = '联合比较所选范围的真实图像，发现可观察规律、允许变化、异常候选及适用边界，保留支持、反对和证据不足。'
