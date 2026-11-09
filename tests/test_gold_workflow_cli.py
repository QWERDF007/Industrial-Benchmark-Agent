import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

from PIL import Image


def test_gold_workflow_cli_records_conflicts_review_and_formal_exports(tmp_path):
    image = tmp_path / 'industrial-input.png'
    Image.new('RGB', (222, 415), '#405060').save(image)
    original = image.read_bytes()
    output = tmp_path / 'verification'
    project = Path(__file__).resolve().parents[1]
    result = subprocess.run([sys.executable, str(project / 'scripts/verify_gold_consistency.py'), '--image', str(image),
        '--output-dir', str(output)], capture_output=True, text=True, timeout=45,
        cwd=project, env={**os.environ, 'PYTHONPATH': str(project / 'python')})
    assert result.returncode == 0, result.stdout + result.stderr
    report = json.loads((output / 'verification.json').read_text())
    assert report['before_conflicts'] == 2
    assert report['image_gold_confirmed'] == report['after_confirmed'] == 2
    assert report['unfixed_localization_annotations'] == 0
    assert report['after_annotations'] == 2
    assert report['formal_benchmark']['gold_count'] == 2
    assert report['same_split'] is True
    assert report['forced_leakage']['is_passed'] is False
    assert report['persisted_build_verified'] is True
    assert report['current_pair_preserved_after_annotation_rescan'] is True
    assert report['no_encoder_import'] is True
    assert image.read_bytes() == original
    assert (output / 'workspace/benchmark.db').is_file()
    assert len(report['artifact_sha256']) == 9
    for filename, digest in report['artifact_sha256'].items():
        assert hashlib.sha256((Path(report['formal_benchmark']['output_dir']) / filename).read_bytes()).hexdigest() == digest
