from pathlib import Path

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.feature.backbones import DINO_MODELS, DinoInputSize, DinoModelId
from iad_core.feature.profiles import EmbeddingProfile, ImageEncoderConfig, ImageEncoderEdit, ImageEncoderSettings, ImageEncoders
from iad_core.storage.database import Database


DINO_MODEL_DIRECTORY = Path(__file__).resolve().parents[3] / 'models' / 'dinov3'


class DinoEncoderEdit(AnalysisModel):
    expected_revision: int = Field(ge=0, strict=True)
    model_id: DinoModelId
    batch_size: int = Field(ge=1, le=256, strict=True)
    input_size: DinoInputSize


class DinoModelOption(AnalysisModel):
    model_id: DinoModelId
    label: str
    available: bool


class DinoSettingsView(ImageEncoderSettings):
    models: list[DinoModelOption]


class DinoEncoderSettings:
    def __init__(self, db: Database, *, model_root: Path = DINO_MODEL_DIRECTORY):
        self.encoders = ImageEncoders(db)
        self.model_root = model_root

    def view(self) -> DinoSettingsView:
        return DinoSettingsView(**self.encoders.read().model_dump(), models=[
            DinoModelOption(model_id=model_id, label=model_id.repository.removeprefix('facebook/'), available=all(
                (self.model_root / model_id / name).is_file()
                for name in ('config.json', 'preprocessor_config.json', 'model.safetensors')))
            for model_id in DINO_MODELS])

    def save(self, edit: DinoEncoderEdit) -> ImageEncoderSettings:
        edit = DinoEncoderEdit.model_validate(edit)
        current = self.encoders.read()
        if current.revision != edit.expected_revision:
            raise ValueError('图像检索配置已变化，请刷新后再保存')
        weights = self.model_root / edit.model_id / 'model.safetensors'
        profile = current.selection.profile if current.selection else None
        if (profile is None or profile.model_id != edit.model_id or profile.input_size != edit.input_size
                or profile.weights_ref != str(weights) or profile.storage_dtype != 'float16'):
            profile = EmbeddingProfile.create(edit.model_id, str(weights), input_size=edit.input_size, storage_dtype='float16')
        resources = current.resources.model_dump()
        resources.update(device=f'cuda:{current.resources.index_device}', compute_dtype='float16', batch_size=edit.batch_size)
        return self.encoders.save(ImageEncoderEdit(expected_revision=edit.expected_revision,
            selection=ImageEncoderConfig(profile=profile, **resources)))
