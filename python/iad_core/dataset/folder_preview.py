import hashlib
import json
from collections import Counter
from pathlib import Path
from typing import List, Literal, Optional

from pydantic import Field
from iad_core.advisory.analysis import AnalysisModel

from iad_core.dataset.folder_rules import FolderRules
from iad_core.dataset.files import ImageFiles
from iad_core.task.config import FolderRole, FolderRule


class FolderPreviewItem(AnalysisModel):
    path: str
    image_count: int
    suggested_role: FolderRole
    role: FolderRole


class FolderPreview(AnalysisModel):
    format: Literal['folder_classification'] = 'folder_classification'
    root_dir: str
    suggested_name: str
    total_images: int
    items: List[FolderPreviewItem]
    conflicts: List[str] = Field(default_factory=list)
    preview_fingerprint: str

    def confirm(self, fingerprint: Optional[str]) -> None:
        if self.conflicts:
            raise ValueError('Directory rules have conflicts: ' + '; '.join(self.conflicts))
        if fingerprint != self.preview_fingerprint:
            raise ValueError('Directory scope or rules changed; refresh and confirm the preview')


def preview_folder_dataset(root_dir: str, rules: Optional[List[FolderRule]] = None) -> FolderPreview:
    root = Path(root_dir).expanduser().resolve(strict=True)
    if not root.is_dir():
        raise ValueError(f'Path is not a directory: {root_dir}')
    counts = Counter()
    entries = []
    for path in ImageFiles(root):
        stat = path.stat()
        relative = path.relative_to(root)
        counts[relative.parent.as_posix()] += 1
        entries.append((relative.as_posix(), stat.st_size, stat.st_mtime_ns))
    suggested = FolderRules.suggest(counts)
    selected = FolderRules(suggested.rules if rules is None else rules)
    # Unmapped directories are explicit unknown rows, never inferred on a rescan.
    selected = FolderRules([*selected.rules, *[
        FolderRule(path=directory, role='unlabeled') for directory in counts if selected.resolve(directory) is None]])
    conflicts = list(selected.conflicts)
    if not entries:
        conflicts.append('目录中未发现受支持的图像文件')
    for rule in selected.rules:
        if not (root / rule.path).is_dir():
            conflicts.append(f"目录不存在：'{rule.path}'")
    items = []
    for rule in selected.rules:
        suggestion = suggested.resolve(rule.path)
        items.append(FolderPreviewItem(path=rule.path, role=rule.role,
            suggested_role=suggestion.role if suggestion else 'unlabeled',
            image_count=sum(count for directory, count in counts.items()
                            if selected.resolve(directory) == rule)))
    fingerprint = hashlib.sha256(json.dumps({
        'root': str(root), 'rules': [rule.model_dump() for rule in selected.rules],
        'files': sorted(entries),
    }, sort_keys=True).encode()).hexdigest()
    return FolderPreview(root_dir=str(root), suggested_name=root.name, total_images=sum(counts.values()),
                         items=items, conflicts=conflicts, preview_fingerprint=fingerprint)
