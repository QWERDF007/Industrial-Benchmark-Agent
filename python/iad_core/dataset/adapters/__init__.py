from iad_core.dataset.adapters.base import DatasetAdapter, RawImage, RawQuality, RawAnnotation
from iad_core.dataset.adapters.folder import GenericFolderAdapter
from iad_core.dataset.adapters.labelme import LabelmeAdapter
from iad_core.dataset.adapters.yolo import YOLOAdapter
from iad_core.task.config import DatasetConfig


def get_adapter(config: DatasetConfig) -> DatasetAdapter:
    fmt = config.annotations.format.lower()
    if fmt == "labelme":
        return LabelmeAdapter(config)
    elif fmt == "yolo":
        return YOLOAdapter(config)
    elif fmt in ("folder", "folder_classification", "none", ""):
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
