import os
import hashlib
from pathlib import Path

from iad_core.exploration.models import ExplorationPromptPreset, ExplorationPresetEdit, FrozenExplorationPrompt
from iad_core.prompt_files import PromptFiles
from iad_core.exploration.prompt_text import CORE_SYSTEM_PROMPT, LABELME_ADAPTATION, OKNG_ADAPTATION, USER_TASK_TEMPLATE


class ExplorationPrompts:
    """Render preset templates before displaying their complete editable instruction."""

    def __init__(self):
        self.files = PromptFiles(Path(os.environ.get('IAD_EXPLORATION_PRESETS_DIR') or Path(__file__).with_name('presets')),
            default_id='P00')

    def list(self) -> list[ExplorationPromptPreset]:
        presets = []
        for preset in self.files.list():
            text = preset.text.rstrip() + '\n\n' + USER_TASK_TEMPLATE if preset.id in {f'P{index:02}' for index in range(13)} else preset.text
            presets.append(ExplorationPromptPreset(**preset.model_dump(exclude={'text'}), text=text,
                builtin=not preset.id.startswith('custom_'),
                revision=hashlib.sha256((preset.name + '\n' + text).encode()).hexdigest()))
        return presets

    @staticmethod
    def system(dataset_format: str) -> str:
        adaptation = {'labelme': LABELME_ADAPTATION, 'folder_classification': OKNG_ADAPTATION}[dataset_format]
        return CORE_SYSTEM_PROMPT + '\n\n' + adaptation

    def freeze(self, prompt: FrozenExplorationPrompt) -> FrozenExplorationPrompt:
        preset = next((item for item in self.list() if item.id == prompt.preset_id), None)
        if preset is not None and prompt.preset_revision is not None and prompt.preset_revision != preset.revision:
            raise ValueError('探索预设版本已变化，请重新加载后提交')
        return prompt.model_copy(update={'preset_revision': preset.revision if preset else prompt.preset_revision})

    def default(self) -> FrozenExplorationPrompt:
        presets = self.list()
        if not presets:
            raise ValueError(f'探索预设目录没有文本文件：{self.files.directory}')
        preset = presets[0]
        return FrozenExplorationPrompt(preset_id=preset.id, preset_name=preset.name, preset_revision=preset.revision, text=preset.text)

    def create(self, edit: ExplorationPresetEdit) -> ExplorationPromptPreset:
        edit = ExplorationPresetEdit.model_validate(edit)
        preset = self.files.create(edit.name, edit.text)
        return ExplorationPromptPreset(**preset.model_dump(), builtin=False,
            revision=hashlib.sha256((preset.name + '\n' + preset.text).encode()).hexdigest())
