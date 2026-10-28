import hashlib
import json
from contextlib import nullcontext
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Optional

from pydantic import ConfigDict, Field, FiniteFloat, model_validator

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.errors import ConsistencyError
from iad_core.storage.database import Database
from iad_core.feature.local_dino import LocalDinoSnapshot
from iad_core.feature.base import EmbeddingPrecision


@dataclass(frozen=True)
class Backbone:
    backend: str
    processor: str
    input_size: int
    pooling: str
    dim: int
    resize_size: int
    resize_mode: str
    crop: str
    interpolation: str
    local_snapshot: bool = False


BACKBONES = {
    'dinov2_vitb14_reg': Backbone('torch_hub', 'dinov2_imagenet_eval', 224, 'x_norm_clstoken', 768,256,'shorter_side','center','bicubic'),
    'dinov3_vitb16': Backbone('torch_hub', 'dinov3_lvd_eval', 256, 'x_norm_clstoken', 768,256,'stretch','none','bilinear',True),
    'sscd_disc_mixup': Backbone('torchscript', 'sscd_skew320', 320, 'serialized_global', 512,320,'stretch','none','bilinear'),
}
IMAGENET_MEAN=(.485,.456,.406)
IMAGENET_STD=(.229,.224,.225)
ImageModelId = Literal['dinov2_vitb14_reg', 'dinov3_vitb16', 'sscd_disc_mixup']


def source_fingerprint(root: Path) -> str:
    if not (root / 'hubconf.py').is_file():
        raise ConsistencyError('ENCODER_UNAVAILABLE', 'Model source must contain the official hubconf.py')
    digest = hashlib.sha256()
    for path in sorted(root.rglob('*.py')):
        if any(part in ('.git', '.venv', '__pycache__') for part in path.relative_to(root).parts):
            continue
        digest.update(path.relative_to(root).as_posix().encode())
        digest.update(b'\0')
        digest.update(path.read_bytes())
    return digest.hexdigest()


def weights_fingerprint(path: Path) -> str:
    digest = hashlib.sha256()
    try:
        with path.open('rb') as stream:
            for block in iter(lambda:stream.read(1024 * 1024), b''):
                digest.update(block)
    except OSError as error:
        raise ConsistencyError('ENCODER_UNAVAILABLE', f'Model weights are unavailable: {path}') from error
    return digest.hexdigest()


class EmbeddingProfile(AnalysisModel):
    model_config = ConfigDict(frozen=True)
    profile_id: str = Field(pattern=r'^embedding_[a-f0-9]{64}$')
    backend: Literal['torch_hub', 'torchscript', 'transformers']
    model_id: ImageModelId
    weights_ref: str = Field(min_length=1)
    weights_sha256: str = Field(pattern=r'^[a-f0-9]{64}$')
    source_ref: Optional[str] = None
    source_sha256: Optional[str] = Field(default=None, pattern=r'^[a-f0-9]{64}$')
    artifacts_sha256: Optional[str] = Field(default=None, pattern=r'^[a-f0-9]{64}$')
    runtime_version: Optional[str] = None
    processor: Literal['dinov2_imagenet_eval', 'dinov3_lvd_eval', 'dinov3_hf_eval', 'sscd_skew320']
    input_size: int = Field(gt=0)
    pooling: Literal['x_norm_clstoken', 'serialized_global', 'pooler_output']
    dim: int = Field(gt=0)
    resize_size: int = Field(gt=0)
    resize_mode: Literal['shorter_side','stretch']
    crop: Literal['center','none']
    interpolation: Literal['bicubic','bilinear']
    mean: tuple[FiniteFloat,FiniteFloat,FiniteFloat]
    std: tuple[FiniteFloat,FiniteFloat,FiniteFloat]
    storage_dtype: EmbeddingPrecision = 'float32'
    color_conversion: Literal['rgb_alpha_white_uint16_div257'] = 'rgb_alpha_white_uint16_div257'
    orientation: Literal['raw'] = 'raw'

    @model_validator(mode='after')
    def coherent(self):
        expected = BACKBONES[self.model_id]
        if self.backend=='transformers':
            if (not expected.local_snapshot or self.processor!='dinov3_hf_eval' or self.pooling!='pooler_output'
                or self.dim!=expected.dim or self.input_size!=self.resize_size or self.input_size%16
                or self.resize_mode!='stretch' or self.crop!='none' or self.interpolation!='bilinear'
                or not self.artifacts_sha256 or not self.runtime_version
                or self.source_ref is not None or self.source_sha256 is not None
                or Path(self.weights_ref).name!='model.safetensors'):
                raise ValueError('Local DINOv3 backbone, processor and artifacts must agree')
        elif any(getattr(self, key) != getattr(expected, key) for key in
               ('backend','processor','input_size','pooling','dim','resize_size','resize_mode','crop','interpolation')):
            raise ValueError('Model backbone, processor, pooling and output dimensions must agree')
        if self.mean!=IMAGENET_MEAN or self.std!=IMAGENET_STD:
            raise ValueError('Model processor normalization must agree')
        if self.backend!='transformers' and (self.artifacts_sha256 is not None or self.runtime_version is not None):
            raise ValueError('Local snapshot metadata requires the Transformers backend')
        if self.backend == 'torch_hub' and (not self.source_ref or not self.source_sha256):
            raise ValueError('DINO requires an explicit source checkout and fingerprint')
        if self.backend == 'torchscript' and (self.source_ref is not None or self.source_sha256 is not None):
            raise ValueError('TorchScript models do not use a source checkout')
        payload = self.model_dump(exclude={'profile_id'})
        expected_id = 'embedding_' + hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()
        if self.profile_id != expected_id:
            raise ValueError('Profile identifier must describe its complete immutable configuration')
        return self

    @classmethod
    def create(cls, model_id: str, weights_ref: str, source_ref: Optional[str] = None,
               storage_dtype: EmbeddingPrecision = 'float32') -> 'EmbeddingProfile':
        if model_id not in BACKBONES:
            raise ConsistencyError('ENCODER_UNAVAILABLE', 'Unsupported image backbone: ' + model_id)
        backbone = BACKBONES[model_id]
        weights = Path(weights_ref).expanduser()
        weights = weights.resolve() if weights.is_dir() else weights.parent.resolve()/weights.name
        local=None
        if weights.is_dir() or weights.suffix=='.safetensors':
            if not backbone.local_snapshot or source_ref:
                raise ConsistencyError('ENCODER_UNAVAILABLE','Local snapshots require DINOv3 and no source checkout')
            root=weights if weights.is_dir() else weights.parent
            if not weights.is_dir() and weights.name!='model.safetensors':
                raise ConsistencyError('ENCODER_UNAVAILABLE','Local snapshot weights must be named model.safetensors')
            local=LocalDinoSnapshot.read(root)
            weights=root/'model.safetensors'
        source = Path(source_ref).expanduser().resolve() if source_ref else None
        payload = dict(backend=backbone.backend,model_id=model_id,weights_ref=str(weights),
            weights_sha256=weights_fingerprint(weights),source_ref=str(source) if source else None,
            source_sha256=source_fingerprint(source) if source else None,processor=backbone.processor,
            input_size=backbone.input_size,pooling=backbone.pooling,dim=backbone.dim,
            resize_size=backbone.resize_size,resize_mode=backbone.resize_mode,crop=backbone.crop,
            interpolation=backbone.interpolation,mean=IMAGENET_MEAN,std=IMAGENET_STD,
            storage_dtype=storage_dtype,color_conversion='rgb_alpha_white_uint16_div257',orientation='raw',
            artifacts_sha256=None,runtime_version=None)
        if local:
            payload.update(backend='transformers',processor='dinov3_hf_eval',pooling='pooler_output',
                input_size=local.input_size,resize_size=local.input_size,
                artifacts_sha256=local.artifacts_sha256,runtime_version=local.runtime_version)
        profile_id = 'embedding_' + hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()
        return cls(profile_id=profile_id,**payload)

    def verify_artifacts(self) -> None:
        if weights_fingerprint(Path(self.weights_ref))!=self.weights_sha256:
            raise ConsistencyError('ENCODER_UNAVAILABLE','Model weights changed; create a new profile')
        if self.source_ref and source_fingerprint(Path(self.source_ref))!=self.source_sha256:
            raise ConsistencyError('ENCODER_UNAVAILABLE','Model source changed; create a new profile')
        if self.backend=='transformers':
            snapshot=LocalDinoSnapshot.read(Path(self.weights_ref).parent)
            if (snapshot.artifacts_sha256!=self.artifacts_sha256 or snapshot.runtime_version!=self.runtime_version
                or snapshot.input_size!=self.input_size):
                raise ConsistencyError('ENCODER_UNAVAILABLE','Local model artifacts or runtime changed; create a new profile')


class ImageResources(AnalysisModel):
    device: str = Field(default='cpu', pattern=r'^(cpu|cuda:[0-9]+)$')
    batch_size: int = Field(default=8,ge=1,le=256,strict=True)
    gpu_memory_mb: int = Field(default=12288,ge=256,le=12288,strict=True)
    compute_dtype: EmbeddingPrecision = 'float32'
    decode_workers: int = Field(default=2,ge=1,le=8,strict=True)
    decode_memory_mb: int = Field(default=512,ge=1,le=1024,strict=True)

    @model_validator(mode='after')
    def cpu_precision(self):
        if self.device=='cpu' and self.compute_dtype=='float16':
            raise ValueError('CPU image encoding requires float32 compute')
        return self


class ImageEncoderConfig(ImageResources):
    profile: EmbeddingProfile


class ImageEncoderSettings(AnalysisModel):
    revision: int = Field(ge=0)
    selection: Optional[ImageEncoderConfig] = None
    resources: ImageResources = Field(default_factory=ImageResources)


class ImageEncoderEdit(AnalysisModel):
    expected_revision: int = Field(ge=0)
    selection: Optional[ImageEncoderConfig]
    resources: Optional[ImageResources] = None

    @model_validator(mode='after')
    def consistent_resources(self):
        if self.selection is not None and self.resources is not None and ImageResources.model_validate(
                self.selection.model_dump(exclude={'profile'})) != self.resources:
            raise ValueError('Selected encoder and runtime resources must agree')
        return self


class ImageEncoders:
    def __init__(self, db: Database):
        self.db=db

    def register(self, profile: EmbeddingProfile, connection=None) -> None:
        profile=EmbeddingProfile.model_validate(profile)
        with nullcontext(connection) if connection is not None else self.db.connection() as connection:
            connection.execute('INSERT INTO image_embedding_profiles(profile_id,profile_json) VALUES(?,?) ON CONFLICT(profile_id) DO NOTHING',
                (profile.profile_id,profile.model_dump_json()))

    def profile(self, profile_id: Optional[str] = None) -> EmbeddingProfile:
        if profile_id is None:
            selection=self.read().selection
            if selection is None:
                raise ConsistencyError('PROFILE_NOT_CONFIGURED','Configure an image encoder before using features')
            return selection.profile
        with self.db.connection() as connection:
            row=connection.execute('SELECT profile_json FROM image_embedding_profiles WHERE profile_id=?',(profile_id,)).fetchone()
        if row is None:
            raise ConsistencyError('PROFILE_NOT_CONFIGURED','Embedding profile is not registered')
        return EmbeddingProfile.model_validate_json(row[0])

    def read(self) -> ImageEncoderSettings:
        with self.db.connection() as connection:
            row=connection.execute('''SELECT s.revision,s.resources_json,p.profile_json
                FROM workbench_image_settings s LEFT JOIN image_embedding_profiles p ON p.profile_id=s.profile_id WHERE s.id=1''').fetchone()
        if row is None:
            return ImageEncoderSettings(revision=0)
        resources=ImageResources.model_validate_json(row['resources_json'])
        selection=ImageEncoderConfig(profile=EmbeddingProfile.model_validate_json(row['profile_json']),
            **resources.model_dump()) if row['profile_json'] is not None else None
        return ImageEncoderSettings(revision=row['revision'],selection=selection,resources=resources)

    def save(self, edit: ImageEncoderEdit) -> ImageEncoderSettings:
        edit=ImageEncoderEdit.model_validate(edit)
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            row=connection.execute('SELECT revision,resources_json FROM workbench_image_settings WHERE id=1').fetchone()
            revision=row[0] if row else 0
            if revision != edit.expected_revision:
                raise ValueError('图像检索配置已变化，请刷新后再保存')
            selection=edit.selection
            resources=(ImageResources.model_validate(selection.model_dump(exclude={'profile'})) if selection else edit.resources
                or (ImageResources.model_validate_json(row['resources_json']) if row else ImageResources()))
            if selection:
                self.register(selection.profile,connection)
            connection.execute('''INSERT INTO workbench_image_settings(id,revision,profile_id,resources_json) VALUES(1,?,?,?)
                ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,profile_id=excluded.profile_id,resources_json=excluded.resources_json''',
                (revision+1,selection.profile.profile_id if selection else None,
                 resources.model_dump_json()))
        return ImageEncoderSettings(revision=revision+1,selection=selection,resources=resources)
