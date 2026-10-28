import fnmatch
import os
from pathlib import Path, PurePosixPath
from typing import Iterator, Sequence

DEFAULT_IMAGE_GLOBS = ('**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.bmp', '**/*.webp', '**/*.tif', '**/*.tiff')


class ImageFiles:
    """Image enumeration shared by preview, root validation and adapters."""

    def __init__(self, root: Path, patterns: Sequence[str] = DEFAULT_IMAGE_GLOBS, excludes: Sequence[str] = ()):
        self.root = root.resolve(strict=True)
        self.patterns, self.excludes = patterns, excludes

    @staticmethod
    def matches(relative: str, patterns: Sequence[str]) -> bool:
        path = PurePosixPath(relative)
        normalized = str(path.with_suffix(path.suffix.lower())) if path.suffix else str(path)
        for pattern in patterns:
            glob = PurePosixPath(pattern)
            glob = str(glob.with_suffix(glob.suffix.lower())) if glob.suffix else str(glob)
            if any(fnmatch.fnmatchcase(value, variant) for value in (normalized, PurePosixPath(normalized).name)
                   for variant in (glob, glob.removeprefix('**/'))):
                return True
        return False

    def __iter__(self) -> Iterator[Path]:
        def walk_error(error):
            raise error
        for directory, _, names in os.walk(self.root, onerror=walk_error):
            for name in sorted(names):
                path = Path(directory) / name
                relative = path.relative_to(self.root).as_posix()
                if not self.matches(relative, self.patterns) or self.matches(relative, self.excludes):
                    continue
                if not path.resolve(strict=True).is_relative_to(self.root):
                    raise ValueError(f'Image path is outside dataset root: {relative}')
                yield path
