import os
import shutil
from pathlib import Path
from tempfile import TemporaryDirectory

from filelock import FileLock


class BenchmarkPublication:
    def __init__(self, destination: str):
        self.destination = Path(destination).absolute()
        self.lock = FileLock(str(self.destination) + '.publish.lock')
        self.temporary = None
        self.published = False
        self.restore_empty = False

    def __enter__(self):
        self.destination.parent.mkdir(parents=True, exist_ok=True)
        self.lock.acquire(timeout=30)
        try:
            if self.destination.exists():
                if not self.destination.is_dir() or any(self.destination.iterdir()):
                    raise FileExistsError('Benchmark output already exists; published artifacts are immutable')
                self.restore_empty = True
            self.temporary = TemporaryDirectory(prefix='.benchmark-', dir=self.destination.parent)
            return self
        except BaseException:
            self.lock.release()
            raise

    @property
    def staging(self) -> Path:
        return Path(self.temporary.name)

    def publish(self):
        for path in self.staging.iterdir():
            with path.open('rb') as source:
                os.fsync(source.fileno())
        descriptor = os.open(self.staging, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
        os.replace(self.staging, self.destination)
        self.published = True
        descriptor = os.open(self.destination.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)

    def __exit__(self, error_type, error, traceback):
        try:
            if error_type is not None and self.published:
                shutil.rmtree(self.destination)
                if self.restore_empty:
                    self.destination.mkdir()
            self.temporary.cleanup()
        finally:
            self.lock.release()
