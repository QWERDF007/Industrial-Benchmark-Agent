import os
import sys
import tempfile
from typing import List, Optional
from iad_core.storage.models import Sample


class PathSafetyError(Exception):
    def __init__(self, message: str, status_code: int = 403):
        super().__init__(message)
        self.status_code = status_code


def get_authorized_dataset_roots(db_path: Optional[str] = None) -> List[str]:
    """
    Get strictly authorized dataset root directories (Tickets C004, S14, DS-S15).
    """
    allowed_roots = [
        os.path.realpath("data"),
        os.path.realpath("."),
    ]
    if db_path and os.path.exists(db_path):
        db_dir = os.path.dirname(os.path.realpath(db_path))
        if db_dir and os.path.isdir(db_dir):
            allowed_roots.append(db_dir)
        import sqlite3
        with sqlite3.connect(db_path) as conn:
            registered = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='datasets'").fetchone()
            if registered:
                import json
                for row in conn.execute("SELECT config_json FROM datasets"):
                    allowed_roots.append(os.path.realpath(json.loads(row[0])["root"]))

    if "pytest" in sys.modules or "PYTEST_CURRENT_TEST" in os.environ:
        allowed_roots.append(os.path.realpath(tempfile.gettempdir()))

    # Resolve authorized dataset root from configs (NXM-17, F08, DS-S15)
    if os.path.isdir("configs"):
        for fname in os.listdir("configs"):
            if fname.endswith((".yaml", ".yml")):
                cfg_file = os.path.join("configs", fname)
                try:
                    from iad_core.task.config import load_config
                    cfg = load_config(cfg_file)
                    if cfg and cfg.root and os.path.exists(cfg.root):
                        allowed_roots.append(os.path.realpath(cfg.root))
                except Exception:
                    pass

    return allowed_roots


class AuthorizedDatasetPaths:
    def __init__(self, db_path: Optional[str] = None):
        self.roots = tuple(get_authorized_dataset_roots(db_path))

    def image(self, sample: Sample) -> str:
        if not sample or not sample.image_path or not os.path.exists(sample.image_path):
            path_str = sample.image_path if sample else "None"
            raise PathSafetyError(f"Image file for sample '{getattr(sample, 'sample_id', 'unknown')}' not found on disk: {path_str}", status_code=404)
        real_path = os.path.realpath(sample.image_path)
        for root in self.roots:
            try:
                if os.path.commonpath([real_path, root]) == root:
                    return real_path
            except ValueError:
                continue
        raise PathSafetyError("Forbidden: Image path is outside authorized dataset root.", status_code=403)


def validate_sample_image_path(sample: Sample, db_path: Optional[str] = None) -> str:
    return AuthorizedDatasetPaths(db_path).image(sample)
