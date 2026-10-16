from app.adapters.base import DatasetAdapter, RawImage, RawQuality, RawAnnotation
from app.adapters.folder import GenericFolderAdapter
from app.adapters.labelme import LabelmeAdapter
from app.adapters.yolo import YOLOAdapter
from app.schemas.config import DatasetConfig


def get_adapter(config: DatasetConfig) -> DatasetAdapter:
    fmt = config.annotations.format.lower()
    if fmt == "labelme":
        return LabelmeAdapter(config)
    elif fmt == "yolo":
        return YOLOAdapter(config)
    elif fmt in ("folder", "none", ""):
        return GenericFolderAdapter(config)
    else:
        raise ValueError(f"Unsupported annotation format: {config.annotations.format}")


__all__ = [
    "DatasetAdapter",
    "RawImage",
    "RawQuality",
    "RawAnnotation",
    "GenericFolderAdapter",
    "LabelmeAdapter",
    "YOLOAdapter",
    "get_adapter",
]
