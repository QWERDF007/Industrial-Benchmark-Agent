import os
import tempfile
from pathlib import Path
from uuid import uuid4

from filelock import FileLock

from iad_core.advisory.analysis import AnalysisModel, NonBlankText


class PromptFile(AnalysisModel):
    id: NonBlankText
    name: NonBlankText
    text: NonBlankText


class PromptFiles:
    """Read live UTF-8 presets and publish complete files atomically."""

    def __init__(self, directory: Path, *, default_id: str | None = None):
        self.directory, self.default_id = directory, default_id

    def list(self) -> list[PromptFile]:
        presets = []
        for file in sorted(self.directory.glob('*.txt'), key=lambda file: (file.stem != self.default_id, file.name)):
            name, _, text = file.read_text(encoding='utf-8').partition('\n')
            try:
                preset = PromptFile(id=file.stem, name=name.strip(), text=text)
            except ValueError as error:
                raise ValueError(f'预设文件格式错误：{file.name}，首行为名称，后续为完整正文') from error
            if any(item.name.casefold() == preset.name.casefold() for item in presets):
                raise ValueError(f'预设名称重复：{file.name}')
            presets.append(preset)
        return presets

    def create(self, name: str, text: str) -> PromptFile:
        name = name.strip()
        if '\n' in name or '\r' in name:
            raise ValueError('预设名称不能包含换行')
        preset = PromptFile(id='custom_' + uuid4().hex, name=name, text=text)
        self.directory.mkdir(parents=True, exist_ok=True)
        with FileLock(str(self.directory / '.presets.lock')):
            if any(existing.name.casefold() == name.casefold() for existing in self.list()):
                raise ValueError('已有同名预设，请换一个名称。')
            temporary = None
            try:
                with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=self.directory, suffix='.tmp', delete=False) as output:
                    temporary = Path(output.name)
                    output.write(name + '\n' + preset.text)
                    output.flush()
                    os.fsync(output.fileno())
                os.replace(temporary, self.directory / (preset.id + '.txt'))
            finally:
                if temporary is not None:
                    temporary.unlink(missing_ok=True)
        return preset
