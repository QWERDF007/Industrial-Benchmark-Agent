from typing import List
from iad_core.dataset.adapters.base import DatasetAdapter, RawImage, RawAnnotation


class GenericFolderAdapter(DatasetAdapter):
    """Adapter for folder-organized datasets without specialized annotation files.
    Quality is inferred from folder names (e.g. good/bad).
    """

    def load_annotations(
        self, image: RawImage, width: int, height: int
    ) -> List[RawAnnotation]:
        return []
