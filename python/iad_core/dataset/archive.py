import shutil
import stat
from contextlib import contextmanager
from pathlib import Path, PurePosixPath, PureWindowsPath
from tempfile import TemporaryDirectory
from typing import List
from zipfile import BadZipFile, ZipFile

from filelock import FileLock

from iad_core.advisory.analysis import AnalysisModel
from iad_core.evidence.images import file_sha256
from iad_core.dataset.files import DEFAULT_IMAGE_GLOBS, ImageFiles


class ArchiveDirectory(AnalysisModel):
    path: str
    image_count: int = 0
    annotation_count: int = 0


class ArchiveInspection(AnalysisModel):
    archive_path: str
    sha256: str
    file_count: int
    uncompressed_bytes: int
    directories: List[ArchiveDirectory]


class DatasetArchive:
    def __init__(self, archive_path: str):
        self.path = Path(archive_path).expanduser().resolve(strict=True)
        if not self.path.is_file():
            raise ValueError('Dataset archive must be a ZIP file')
        self.sha256 = file_sha256(str(self.path))

    @staticmethod
    def relative_path(value: str) -> PurePosixPath:
        path = PurePosixPath(value)
        if (not value or '\\' in value or path.is_absolute() or PureWindowsPath(value).drive
                or '..' in path.parts or '\x00' in value):
            raise ValueError('Archive paths must be relative and remain inside the archive')
        return path

    @contextmanager
    def open(self):
        try:
            with ZipFile(self.path) as archive:
                entries = {}
                for item in archive.infolist():
                    path = self.relative_path(item.filename)
                    mode = item.external_attr >> 16
                    if stat.S_ISLNK(mode) or (stat.S_IFMT(mode) and not (stat.S_ISREG(mode) or stat.S_ISDIR(mode))):
                        raise ValueError('Dataset archives may contain only regular files and directories')
                    if item.flag_bits & 1:
                        raise ValueError('Encrypted dataset archives are not supported')
                    if path in entries:
                        raise ValueError(f'Duplicate archive path: {path}')
                    entries[path] = item
                if any(parent in entries and not entries[parent].is_dir()
                       for path in entries for parent in path.parents):
                    raise ValueError('Archive file and directory paths conflict')
                yield archive
        except BadZipFile as error:
            raise ValueError('Invalid or damaged dataset ZIP archive') from error

    def inspect(self) -> ArchiveInspection:
        directories = {PurePosixPath('.'): ArchiveDirectory(path='.')}
        file_count, total_bytes = 0, 0
        with self.open() as archive:
            for item in archive.infolist():
                path = PurePosixPath(item.filename)
                parents = [path, *path.parents] if item.is_dir() else path.parents
                for parent in parents:
                    directory = directories.setdefault(parent, ArchiveDirectory(path=str(parent)))
                    if not item.is_dir():
                        directory.image_count += ImageFiles.matches(path.as_posix(), DEFAULT_IMAGE_GLOBS)
                        directory.annotation_count += path.suffix.lower() == '.json'
                if not item.is_dir():
                    file_count += 1
                    total_bytes += item.file_size
        return ArchiveInspection(archive_path=str(self.path), sha256=self.sha256,
            file_count=file_count, uncompressed_bytes=total_bytes,
            directories=[directories[path] for path in sorted(directories)])

    def prepare(self, db_path: str, image_dir: str, annotation_dir: str) -> tuple[Path, Path]:
        selected = [self.relative_path(image_dir), self.relative_path(annotation_dir)]
        directories = {item.path for item in self.inspect().directories}
        if any(str(path) not in directories for path in selected):
            raise ValueError('Selected image or annotation directory does not exist in the archive')
        root = Path(db_path).resolve().parent / 'datasets'
        root.mkdir(parents=True, exist_ok=True)
        target = root / self.sha256
        with FileLock(str(target) + '.lock'):
            if not target.exists():
                with TemporaryDirectory(prefix=self.sha256 + '.', dir=root) as temporary:
                    staging = Path(temporary)
                    with self.open() as archive:
                        for item in archive.infolist():
                            path = staging / item.filename
                            if item.is_dir():
                                path.mkdir(parents=True, exist_ok=True)
                            else:
                                path.parent.mkdir(parents=True, exist_ok=True)
                                with archive.open(item) as source, path.open('xb') as destination:
                                    shutil.copyfileobj(source, destination, length=1024 * 1024)
                    if file_sha256(str(self.path)) != self.sha256:
                        raise ValueError('Dataset archive changed during extraction; inspect it again')
                    staging.rename(target)
        return tuple(target / path for path in selected)
