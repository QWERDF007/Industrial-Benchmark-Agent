from pathlib import Path
from typing import Generator, List, Optional, Tuple

from iad_core.dataset.adapters.base import DatasetAdapter, RawImage, RawAnnotation, RawQuality
from iad_core.storage.models import QualityStatus
from iad_core.dataset.folder_rules import FolderRules
from iad_core.task.config import FolderRule


class GenericFolderAdapter(DatasetAdapter):
    """Adapter for folder-organized datasets without specialized annotation files.
    Quality is inferred from confirmed folder rules.
    """

    def __init__(self, config):
        super().__init__(config)
        self.rules = FolderRules(config.folder_rules)
        if self.rules.conflicts:
            raise ValueError('; '.join(self.rules.conflicts))

    def resolve_rule(self, rel_path: str) -> Tuple[Optional[FolderRule], str]:
        directory = Path(rel_path).parent.as_posix()
        rule = self.rules.resolve(directory)
        return rule, rule.path if rule else directory

    def scan_images(self) -> Generator[RawImage, None, None]:
        for raw_img in super().scan_images():
            rule, _ = self.resolve_rule(raw_img.relative_path)
            if rule and rule.role == "excluded":
                continue
            yield raw_img

    def load_quality(self, image: RawImage) -> RawQuality:
        rule, matched_path = self.resolve_rule(image.relative_path)
        if rule:
            if rule.role == "normal":
                return RawQuality(quality_status=QualityStatus.PASS, quality_source=f"folder:{matched_path}")
            elif rule.role == "anomaly":
                return RawQuality(quality_status=QualityStatus.FAIL, quality_source=f"folder:{matched_path}")
            elif rule.role == "unlabeled":
                return RawQuality(quality_status=QualityStatus.UNCERTAIN, quality_source=f"folder:{matched_path}")
            elif rule.role == "excluded":
                return RawQuality(quality_status=QualityStatus.UNCERTAIN, quality_source="folder:excluded")

        return super().load_quality(image)

    def load_annotations(
        self, image: RawImage, width: int, height: int
    ) -> List[RawAnnotation]:
        return []
