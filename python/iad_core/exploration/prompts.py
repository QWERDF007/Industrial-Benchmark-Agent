import os
from pathlib import Path

from iad_core.exploration.models import ExplorationPromptPreset, ExplorationPresetEdit, FrozenExplorationPrompt
from iad_core.prompt_files import PromptFiles


class ExplorationPrompts:
    """One UTF-8 file per preset: display name on the first line, full prompt below."""

    def __init__(self):
        self.files = PromptFiles(Path(os.environ.get('IAD_EXPLORATION_PRESETS_DIR') or Path(__file__).with_name('presets')),
            default_id='general')

    def list(self) -> list[ExplorationPromptPreset]:
        return [ExplorationPromptPreset(**preset.model_dump(), builtin=not preset.id.startswith('custom_'))
            for preset in self.files.list()]

    def default(self) -> FrozenExplorationPrompt:
        presets = self.list()
        if not presets:
            raise ValueError(f'探索预设目录没有文本文件：{self.files.directory}')
        preset = presets[0]
        return FrozenExplorationPrompt(preset_id=preset.id, preset_name=preset.name, text=preset.text)

    def create(self, edit: ExplorationPresetEdit) -> ExplorationPromptPreset:
        edit = ExplorationPresetEdit.model_validate(edit)
        preset = self.files.create(edit.name, edit.text)
        return ExplorationPromptPreset(**preset.model_dump(), builtin=False)
