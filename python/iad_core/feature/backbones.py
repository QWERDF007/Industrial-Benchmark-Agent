from dataclasses import dataclass
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import Field


class DinoModelId(StrEnum):
    SMALL = 'dinov3_vits16'
    SMALL_PLUS = 'dinov3_vits16plus'
    BASE = 'dinov3_vitb16'
    LARGE = 'dinov3_vitl16'

    @property
    def repository(self) -> str:
        return 'facebook/' + self.value.replace('_', '-', 1) + '-pretrain-lvd1689m'


DinoInputSize = Annotated[int, Field(ge=16, multiple_of=16, strict=True)]
ImageModelId = Literal['dinov2_vitb14_reg', 'sscd_disc_mixup'] | DinoModelId


@dataclass(frozen=True)
class DinoBackbone:
    label: str
    dim: int
    layers: int
    heads: int
    intermediate_size: int
    gated: bool = False
    patch_size: int = 16


DINO_MODELS = {
    DinoModelId.SMALL: DinoBackbone('ViT-S/16', 384, 12, 6, 1536),
    DinoModelId.SMALL_PLUS: DinoBackbone('ViT-S+/16', 384, 12, 6, 1536, True),
    DinoModelId.BASE: DinoBackbone('ViT-B/16', 768, 12, 12, 3072),
    DinoModelId.LARGE: DinoBackbone('ViT-L/16', 1024, 24, 16, 4096),
}


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
    'dinov2_vitb14_reg': Backbone('torch_hub', 'dinov2_imagenet_eval', 224, 'x_norm_clstoken', 768, 256, 'shorter_side', 'center', 'bicubic'),
    'sscd_disc_mixup': Backbone('torchscript', 'sscd_skew320', 320, 'serialized_global', 512, 320, 'stretch', 'none', 'bilinear'),
    **{name: Backbone('torch_hub', 'dinov3_lvd_eval', 256, 'x_norm_clstoken', spec.dim, 256,
        'stretch', 'none', 'bilinear', True) for name, spec in DINO_MODELS.items()},
}
