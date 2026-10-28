import hashlib

import pytest
from PIL import Image
from pydantic import ValidationError


def test_benchmark_rejects_source_groups_shared_by_tuning_and_acceptance(tmp_path):
    from iad_core.evaluation.retrieval_models import RetrievalBenchmark

    for name in ('query.png', 'copy.png'):
        Image.new('RGB', (24, 24), 'blue').save(tmp_path / name)
    items = [{'item_id': name, 'dataset': 'images', 'relative_path': name,
        'sha256': hashlib.sha256((tmp_path / name).read_bytes()).hexdigest(),
        'source_group': 'source-blue', 'split': split, 'stratum': 'exact'}
        for name, split in [('query.png', 'acceptance'), ('copy.png', 'tuning')]]
    with pytest.raises(ValidationError, match='source group'):
        RetrievalBenchmark.model_validate({'origin': 'industrial', 'datasets': {'images': str(tmp_path)},
            'corpus': ['images'], 'items': items,
            'queries': [{'query_id': 'query.png', 'relevant_ids': ['copy.png'], 'strict_ids': ['copy.png'],
                'hard_negative_ids': [], 'verification': 'controlled_transforms'}], 'profiles': {}})


def test_evaluation_distinguishes_any_copy_all_copies_and_unbounded_strict_members(tmp_path):
    import numpy as np
    from tests.feature_fixtures import configure_test_encoder
    from iad_core.evaluation.retrieval import evaluate_retrieval
    from iad_core.evaluation.retrieval_models import RetrievalBenchmark
    from iad_core.feature.base import FeatureExtractor
    from iad_core.storage.database import Database

    roots = {name: tmp_path / name for name in ('queries', 'references')}
    for root in roots.values():
        root.mkdir()
    assets = [('blue-query', 'queries', 'blue', (0, 0, 255), 'original'),
        ('red-query', 'queries', 'red', (255, 0, 0), 'original'),
        ('red-copy', 'references', 'red', (255, 0, 0), 'exact'),
        ('blue-dim', 'references', 'blue', (0, 0, 127), 'brightness'),
        ('claimed-defect', 'references', 'blue', (0, 0, 127), 'real_micro_defect'),
        ('claimed-instance', 'references', 'instance', (0, 0, 127), 'other_instance'),
        ('claimed-texture', 'references', 'texture', (0, 0, 127), 'repeated_texture')]
    assets += [(f'blue-{index}', 'references', 'blue', (0, 0, 255), 'exact') for index in range(80)]
    items = []
    for name, dataset, source, color, stratum in assets:
        path = roots[dataset] / (name + '.png')
        Image.new('RGB', (24, 24), color).save(path)
        items.append({'item_id': name, 'dataset': dataset, 'relative_path': path.name,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'source_group': source,
            'split': 'acceptance', 'stratum': stratum})
    encoder = configure_test_encoder(Database(str(tmp_path / 'profile.db')), tmp_path)

    class LiteralVectors(FeatureExtractor):
        model_id, profile_id, dim = encoder.profile.model_id, encoder.profile.profile_id, encoder.profile.dim

        def encode_batch(self, images):
            mapping = {(0, 0, 255): (1., 0.), (255, 0, 0): (0., 1.), (0, 0, 127): (.6, .8)}
            vectors = np.zeros((len(images), self.dim), dtype=np.float32)
            for index, image in enumerate(images):
                vectors[index, :2] = mapping[image.getpixel((0, 0))]
            return vectors

    copies = [f'blue-{index}' for index in range(80)]
    manifest = RetrievalBenchmark.model_validate({'origin': 'synthetic', 'datasets': roots,
        'corpus': ['references'], 'items': items, 'profiles': {'fixture': encoder.profile}, 'queries': [
            {'query_id': 'blue-query', 'relevant_ids': [*copies, 'blue-dim'], 'strict_ids': copies,
                'hard_negative_ids': ['claimed-defect', 'claimed-instance', 'claimed-texture'], 'verification': 'controlled_transforms'},
            {'query_id': 'red-query', 'relevant_ids': ['red-copy'], 'strict_ids': ['red-copy'],
                'hard_negative_ids': [], 'verification': 'controlled_transforms'}]})
    metrics = evaluate_retrieval(manifest, encoder, tmp_path / 'output', top_k=1, extractor=LiteralVectors())
    assert metrics['visual']['any_copy_recall'] == 1
    assert metrics['visual']['all_copies_recall'] == .5
    assert metrics['visual']['member_recall'] == pytest.approx(81 / 82)
    assert metrics['strict']['expected_members'] == metrics['strict']['recalled_members'] == 81
    assert metrics['cache']['repeat_encoded_content'] == 0
    assert metrics['cache']['initial_encoded_content'] == 3
    assert metrics['publication_ready'] is False
    assert metrics['encoder_kind'] == 'external_test_extractor'
    assert metrics['strict']['negative_pairs'] == 3 and metrics['strict']['false_exact'] == 0
    assert metrics['gates']['real_defect_and_instance_negatives'] is False
    from iad_core.evaluation.retrieval_report import write_retrieval_report
    resources = {'profile_id': encoder.profile.profile_id,
        'preparation': {}, 'throughput': {}, 'preparation_resources': {}, 'verification_resources': {},
        'measured_gates': {'real_encoder': True, 'five_thousand_2048': True, 'fp32_768': True,
            'one_hundred_distinct_vector_queries': True, 'vector_p95': True, 'twenty_originals_p95': True,
            'additional_rss': True, 'stress_4096': True, 'two_default_decode_workers': True, 'repeat_encoding_zero': True},
        'incremental_status': 'MEASURED', 'incremental_gates': {'one_hundred_new_contents': True,
            'old_vectors_not_reencoded': True, 'annotation_only_zero_encoding': True,
            'same_model_reused_across_resource_changes': True, 'real_cancel_observed': True},
        'resource_acceptance_passed': True, 'publication_ready': False}
    import json
    resources_path = tmp_path / 'resource-summary.json'
    resources_path.write_text(json.dumps(resources))
    combined = write_retrieval_report({'fixture': metrics}, tmp_path / 'combined', resource_paths=[resources_path])
    assert combined['profiles']['fixture']['gates']['scale_and_resource_acceptance'] is True
    assert combined['profiles']['fixture']['gates']['real_defect_and_instance_negatives'] is False
    assert combined['publication_ready'] is False and combined['selected_default'] is None
    assert metrics['gates']['scale_and_resource_acceptance'] is False
    assert combined['profiles']['fixture']['resource_evidence']['sha256'] == hashlib.sha256(resources_path.read_bytes()).hexdigest()
    assert '资源验收' in (tmp_path / 'combined/report.md').read_text()
    with pytest.raises(ValueError, match='one explicit resource'):
        write_retrieval_report({'fixture': metrics}, tmp_path / 'ambiguous', resource_paths=[resources_path, resources_path])
    resources_path.write_text(json.dumps({**resources, 'profile_id': 'different-model-profile'}))
    with pytest.raises(ValueError, match='embedding profile'):
        write_retrieval_report({'fixture': metrics}, tmp_path / 'wrong-model', resource_paths=[resources_path])
    resources_path.write_text(json.dumps({**resources, 'measured_gates': {}}))
    with pytest.raises(ValidationError):
        write_retrieval_report({'fixture': metrics}, tmp_path / 'missing-measurements', resource_paths=[resources_path])
    resources_path.write_text(json.dumps({**resources, 'resource_acceptance_passed': False}))
    with pytest.raises(ValidationError, match='every measured'):
        write_retrieval_report({'fixture': metrics}, tmp_path / 'inconsistent-summary', resource_paths=[resources_path])
    resources_path.write_text(json.dumps(resources))
    folder = tmp_path / 'combined'
    (folder / 'fixture').mkdir()
    (folder / 'fixture/metrics.json').write_text(json.dumps(metrics))
    import subprocess, sys
    from pathlib import Path
    command = [sys.executable, str(Path(__file__).resolve().parents[1] / 'scripts/report_image_retrieval.py'),
        '--evaluation', str(folder), '--resources', str(resources_path)]
    original_metrics = (folder / 'fixture/metrics.json').read_bytes()
    result = subprocess.run(command, capture_output=True, text=True, timeout=30)
    assert result.returncode == 1, result.stderr
    recorded = json.loads((folder / 'metrics.json').read_text())
    assert recorded['profiles']['fixture']['gates']['scale_and_resource_acceptance'] is True
    assert recorded['publication_ready'] is False
    assert (folder / 'fixture/metrics.json').read_bytes() == original_metrics


def test_benchmark_builder_freezes_actual_sources_and_keeps_transform_ancestry_in_one_split(dataset, tmp_path):
    from iad_core.evaluation.benchmark_images import build_retrieval_benchmark
    from iad_core.duplicate.verify import PairVerifier

    db, _, _ = dataset
    manifest = build_retrieval_benchmark(db.db_path, {}, tmp_path / 'frozen', sources=3, tuning_sources=1, seed=7)
    assert len(manifest.sources) == 3
    assert len(manifest.queries) == 3
    assert len({manifest.items[index].source_group for index in range(len(manifest.items))}) == 3
    items = {item.item_id: item for item in manifest.items}
    for query in manifest.queries:
        original = items[query.query_id]
        assert all(items[identity].split == original.split for identity in [*query.relevant_ids, *query.hard_negative_ids])
        path = manifest.datasets[original.dataset] / original.relative_path
        for identity in query.strict_ids:
            reference = items[identity]
            result = PairVerifier().verify(str(path), str(manifest.datasets[reference.dataset] / reference.relative_path))
            assert result.relation == 'EXACT'
        assert len(query.hard_negative_ids) == 1
        reference = items[query.hard_negative_ids[0]]
        result = PairVerifier().verify(str(path), str(manifest.datasets[reference.dataset] / reference.relative_path))
        assert result.pixel.exact_equal is False and result.pixel.changed_pixels == 1
    acceptance = [query for query in manifest.queries if items[query.query_id].split == 'acceptance']
    assert len(acceptance) == 2 and max(len(query.strict_ids) for query in acceptance) >= 80


def test_evaluation_cli_reports_missing_real_weights_without_substitution(dataset, tmp_path):
    import json
    import subprocess
    import sys
    from pathlib import Path
    from tests.feature_fixtures import configure_test_encoder
    from iad_core.evaluation.benchmark_images import build_retrieval_benchmark

    db, _, _ = dataset
    encoder = configure_test_encoder(db, tmp_path)
    build_retrieval_benchmark(db.db_path, {'fixture': encoder.profile}, tmp_path / 'frozen', sources=3, tuning_sources=1)
    Path(encoder.profile.weights_ref).unlink()
    script = Path(__file__).resolve().parents[1] / 'scripts/evaluate_image_retrieval.py'
    result = subprocess.run([sys.executable, str(script), '--manifest', str(tmp_path / 'frozen/retrieval-benchmark.json'),
        '--profiles', 'fixture', '--device', 'cpu', '--output', str(tmp_path / 'evaluated')],
        capture_output=True, text=True, timeout=30)
    assert result.returncode == 1, result.stderr
    summary = json.loads((tmp_path / 'evaluated/metrics.json').read_text())
    assert summary['profiles']['fixture']['status'] == 'UNAVAILABLE'
    assert summary['profiles']['fixture']['error_code'] == 'ENCODER_UNAVAILABLE'
    assert summary['publication_ready'] is False and summary['selected_default'] is None
    report = (tmp_path / 'evaluated/report.md').read_text()
    assert 'UNAVAILABLE' in report and '未选定' in report
    previous = (tmp_path / 'evaluated/metrics.json').read_bytes()
    repeated = subprocess.run([sys.executable, str(script), '--manifest', str(tmp_path / 'frozen/retrieval-benchmark.json'),
        '--profiles', 'fixture', '--device', 'cpu', '--output', str(tmp_path / 'evaluated')],
        capture_output=True, text=True, timeout=30)
    assert repeated.returncode == 2
    assert (tmp_path / 'evaluated/metrics.json').read_bytes() == previous


def test_actual_duplicate_query_pixels_cannot_hide_behind_different_source_group_names(dataset, tmp_path):
    from tests.feature_fixtures import configure_test_encoder, MockFeatureExtractor
    from iad_core.evaluation.benchmark_images import build_retrieval_benchmark
    from iad_core.evaluation.retrieval import evaluate_retrieval

    db, _, _ = dataset
    encoder = configure_test_encoder(db, tmp_path)
    manifest = build_retrieval_benchmark(db.db_path, {'fixture': encoder.profile}, tmp_path / 'frozen', sources=3, tuning_sources=1)
    by_id = {item.item_id: item for item in manifest.items}
    first, second = [by_id[query.query_id] for query in manifest.queries[:2]]
    original = (manifest.datasets[first.dataset] / first.relative_path).read_bytes()
    (manifest.datasets[second.dataset] / second.relative_path).write_bytes(original)
    revised = second.model_copy(update={'sha256': hashlib.sha256(original).hexdigest()})
    manifest = manifest.model_copy(update={'items': [revised if item.item_id == second.item_id else item for item in manifest.items]})
    with pytest.raises(ValueError, match='source group'):
        evaluate_retrieval(manifest, encoder, tmp_path / 'output', extractor=MockFeatureExtractor(profile=encoder.profile))
