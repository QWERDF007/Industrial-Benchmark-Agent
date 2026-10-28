import hashlib
from pathlib import Path

from PIL import Image


def test_resource_workload_materializes_unique_full_resolution_files_without_changing_sources(tmp_path):
    from iad_core.evaluation.resource_workload import build_resource_workload
    from iad_core.duplicate.pixels import PixelContent

    sources = []
    for index, color in enumerate(('red', 'blue')):
        path = tmp_path / f'original-{index}.png'
        Image.new('RGB', (32, 48), color).save(path)
        sources.append(path)
    before = [path.read_bytes() for path in sources]
    workload = build_resource_workload(sources, tmp_path / 'load', count=8, resolution=64, stress_count=3, stress_resolution=128)
    assert len(workload.items) == 11 and workload.performance_only is True
    assert [path.read_bytes() for path in sources] == before
    keys = set()
    for item in workload.items:
        assert hashlib.sha256(item.path.read_bytes()).hexdigest() == item.sha256
        with Image.open(item.path) as image:
            assert image.size == ((64, 64) if item.kind == 'main' else (128, 128))
        keys.add(PixelContent.read(item.path).descriptor.pixel_key)
    assert len(keys) == 11


def test_resource_index_preparation_reports_actual_encoded_pixels_and_zero_repeat_encoding(tmp_path):
    from tests.feature_fixtures import configure_test_encoder, MockFeatureExtractor
    from iad_core.evaluation.resource_workload import build_resource_workload
    from iad_core.evaluation.resource_preparation import prepare_resource_index
    from iad_core.storage.database import Database

    source = tmp_path / 'source.png'
    Image.new('RGB', (32, 48), 'blue').save(source)
    workload = build_resource_workload([source], tmp_path / 'load', count=8, resolution=64, stress_count=3, stress_resolution=128)
    encoder = configure_test_encoder(Database(str(tmp_path / 'profile.db')), tmp_path)
    result = prepare_resource_index(workload, encoder, tmp_path / 'prepared', extractor=MockFeatureExtractor(profile=encoder.profile))
    assert result['prepared']['encoded_content_count'] == 11
    assert result['prepared']['encoded_pixels'] == 81920
    assert result['repeated']['encoded_content_count'] == result['repeated']['encoded_pixels'] == 0
    assert result['encoder_kind'] == 'external_test_extractor'
    assert Path(result['baseline_db']).exists()


def test_verification_resource_process_uses_cached_vectors_without_importing_the_encoder(tmp_path):
    import json
    import subprocess
    import sys
    from tests.feature_fixtures import configure_test_encoder, MockFeatureExtractor
    from iad_core.evaluation.resource_workload import build_resource_workload
    from iad_core.evaluation.resource_preparation import prepare_resource_index
    from iad_core.storage.database import Database

    source = tmp_path / 'source.png'
    Image.new('RGB', (32, 48), 'blue').save(source)
    workload = build_resource_workload([source], tmp_path / 'load', count=8, resolution=64, stress_count=3, stress_resolution=128)
    encoder = configure_test_encoder(Database(str(tmp_path / 'profile.db')), tmp_path)
    output = tmp_path / 'prepared'
    prepare_resource_index(workload, encoder, output, extractor=MockFeatureExtractor(profile=encoder.profile))
    config = tmp_path / 'config.json'
    config.write_text(encoder.model_dump_json())
    script = Path(__file__).resolve().parents[1] / 'scripts/evaluate_retrieval_resources.py'
    process = subprocess.run([sys.executable, str(script), '--stage', 'measure', '--workload', str(tmp_path / 'load/workload.json'),
        '--config', str(config), '--output', str(output), '--queries', '2', '--candidates', '2'], capture_output=True, text=True, timeout=30)
    assert process.returncode == 1, process.stderr
    report = json.loads((output / 'resources.json').read_text())
    assert report['no_encoder_import'] is True and report['publication_ready'] is False
    assert report['main']['index']['vector_count'] == 8
    assert report['main']['verified_member_counts'] == [2, 2, 2, 2]
    assert report['main']['storage']['vector_bytes'] == 24576
    assert report['main']['storage']['mapping_bytes'] > 0
    import numpy as np
    for partition, count in [('main', 8), ('stress', 3)]:
        measured = report[partition]
        samples = measured['vector_measurements']
        assert len(samples) == measured['vector_queries'] == count
        assert len({sample['query_id'] for sample in samples}) == count
        assert all(sample['seconds'] > 0 for sample in samples)
        assert measured['vector_query_p95_ms'] == float(np.percentile([sample['seconds'] for sample in samples], 95)) * 1000
    measurements = [json.loads(line) for line in (output / 'verification-measurements.jsonl').read_text().splitlines()]
    assert len(measurements) == 8
    assert all(item['verified_members'] == 2 and item['seconds'] > 0 for item in measurements)
    from iad_core.evaluation.resource_report import write_resource_report
    summary = write_resource_report(output)
    assert summary['incremental_status'] == 'UNVERIFIED' and summary['resource_acceptance_passed'] is False
    assert '原图复核' in (output / 'resource-report.md').read_text()


def test_incremental_contents_encode_once_and_annotation_edits_encode_nothing(tmp_path):
    from tests.feature_fixtures import configure_test_encoder, MockFeatureExtractor
    from iad_core.evaluation.resource_workload import build_resource_workload
    from iad_core.evaluation.resource_preparation import prepare_resource_index
    from iad_core.evaluation.resource_incremental import evaluate_resource_incremental
    from iad_core.storage.database import Database

    source = tmp_path / 'source.png'
    Image.new('RGB', (32, 48), 'blue').save(source)
    workload = build_resource_workload([source], tmp_path / 'load', count=8, resolution=64, stress_count=3, stress_resolution=128)
    encoder = configure_test_encoder(Database(str(tmp_path / 'profile.db')), tmp_path)
    extractor = MockFeatureExtractor(profile=encoder.profile)
    output = tmp_path / 'prepared'
    prepared = prepare_resource_index(workload, encoder, output, extractor=extractor)
    result = evaluate_resource_incremental(prepared, output, count=4, extractor=extractor)
    assert result['new_contents'] == result['incremental']['encoded_content_count'] == 4
    assert result['incremental']['encoded_pixels'] == 16384
    assert result['annotation_only']['encoded_content_count'] == result['annotation_only']['encoded_pixels'] == 0
    assert result['cancellation'] is None
