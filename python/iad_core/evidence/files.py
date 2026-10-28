import hashlib
import os
import tempfile
from pathlib import Path


def file_sha256(path: str | Path) -> str:
    digest=hashlib.sha256()
    with Path(path).open('rb') as source:
        for block in iter(lambda:source.read(1024*1024),b''):digest.update(block)
    return digest.hexdigest()


class ImageFiles:
    def __init__(self, root: Path):
        self.root=root

    def store(self, payload: bytes) -> tuple[str,str]:
        sha=hashlib.sha256(payload).hexdigest()
        self.root.mkdir(parents=True,exist_ok=True)
        path=self.root/(sha+'.png')
        if not path.exists() or file_sha256(path)!=sha:
            temporary=None
            try:
                with tempfile.NamedTemporaryFile(dir=self.root,suffix='.tmp',delete=False) as output:
                    temporary=Path(output.name)
                    output.write(payload);output.flush();os.fsync(output.fileno())
                os.replace(temporary,path)
                descriptor=os.open(self.root,os.O_RDONLY | os.O_DIRECTORY)
                try:os.fsync(descriptor)
                finally:os.close(descriptor)
            finally:
                if temporary is not None:temporary.unlink(missing_ok=True)
        return str(path),sha

    def path(self, sha: str, byte_count: int | None = None) -> str:
        if len(sha)!=64 or any(character not in '0123456789abcdef' for character in sha):raise ValueError('Invalid image digest')
        path=self.root/(sha+'.png')
        if (byte_count is not None and path.stat().st_size!=byte_count) or file_sha256(path)!=sha:
            raise ValueError('Image evidence bytes changed')
        return str(path)
