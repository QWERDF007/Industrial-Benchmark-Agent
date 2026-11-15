import hashlib
import os
import tempfile
from pathlib import Path

from filelock import FileLock
from PIL import Image

from iad_core.evidence.images import normalized_preview


class ThumbnailImages:
    def __init__(self, db_path: str):
        self.root = Path(db_path).resolve().parent / 'cache' / 'thumbnails'

    def read(self, source: str | Path, identity: str, size: int) -> dict:
        if size < 1:
            raise ValueError('缩略图尺寸必须大于零')
        fingerprint = hashlib.sha256(f'thumbnail-jpeg-v1:{identity}:{size}'.encode()).hexdigest()
        target = self.root / (fingerprint + '.jpg')
        self.root.mkdir(parents=True, exist_ok=True)
        cached = target.is_file()
        if not cached:
            with FileLock(str(target) + '.lock'):
                if not target.is_file():
                    temporary = None
                    try:
                        with Image.open(source) as original:
                            image = normalized_preview(original).convert('RGB')
                            image.thumbnail((size, size), Image.Resampling.LANCZOS)
                        with tempfile.NamedTemporaryFile(dir=self.root, suffix='.tmp', delete=False) as output:
                            temporary = Path(output.name)
                            image.save(output, 'JPEG', quality=85)
                        os.replace(temporary, target)
                    finally:
                        if temporary is not None:
                            temporary.unlink(missing_ok=True)
        return {'path': str(target), 'media_type': 'image/jpeg', 'cached': cached}
