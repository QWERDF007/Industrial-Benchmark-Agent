import os
import time
import shutil
import tempfile
import numpy as np
from PIL import Image
import pytest

from iad_core.storage.database import Database
from iad_core.storage.repositories import (
    TaskRepository,
    SampleRepository,
)
from iad_core.storage.models import InspectionTask, Sample, QualityStatus, DataOrigin
from tests.feature_fixtures import MockFeatureExtractor, configure_test_encoder, index_test_samples
from iad_core.feature.builder import build_features, get_feature_stats
from iad_core.feature.index import CorpusIndexes
from iad_core.feature.search import search_by_sample
from iad_core.duplicate.miner import mine_near_duplicates


@pytest.fixture
def test_env():
    """Create a temporary environment with synthetic images and database."""
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, "test_benchmark.db")
    db = Database(db_path)
    db.init_schema()

    task_id = "mock_task_01"
    task_repo = TaskRepository(db)
    task_repo.upsert(
        InspectionTask(
            task_id=task_id,
            product="widget",
            station="station_01",
            camera="cam_01",
            inspection_target="scratch",
            description="Mock task for feature tests",
        )
    )

    # Create synthetic images
    # img0: base green
    # img1: copy of img0 (near-duplicate)
    # img2: slightly perturbed copy of img0
    # img3: unrelated red image
    # img4: unrelated blue image
    images_dir = os.path.join(temp_dir, "images")
    os.makedirs(images_dir, exist_ok=True)

    img0_path = os.path.join(images_dir, "good_001.png")
    img0 = Image.new("RGB", (100, 100), color=(30, 200, 30))
    img0.save(img0_path)

    img1_path = os.path.join(images_dir, "good_001_copy.png")
    img0.save(img1_path)

    img2_path = os.path.join(images_dir, "good_001_perturbed.png")
    img2 = Image.new("RGB", (100, 100), color=(31, 199, 30))
    img2.save(img2_path)

    img3_path = os.path.join(images_dir, "bad_red.png")
    img3 = Image.new("RGB", (100, 100), color=(220, 20, 20))
    img3.save(img3_path)

    img4_path = os.path.join(images_dir, "test_blue.png")
    img4 = Image.new("RGB", (100, 100), color=(20, 20, 220))
    img4.save(img4_path)

    sample_repo = SampleRepository(db)
    samples = [
        Sample(
            sample_id=f"mock_ds:good_001.png",
            task_id=task_id,
            dataset_id="mock_ds",
            image_path=img0_path,
            relative_path="good_001.png",
            data_origin=DataOrigin.LEGACY_TRAIN,
            width=100,
            height=100,
            quality_status=QualityStatus.PASS,
        ),
        Sample(
            sample_id=f"mock_ds:good_001_copy.png",
            task_id=task_id,
            dataset_id="mock_ds",
            image_path=img1_path,
            relative_path="good_001_copy.png",
            data_origin=DataOrigin.LEGACY_TEST,
            width=100,
            height=100,
            quality_status=QualityStatus.PASS,
        ),
        Sample(
            sample_id=f"mock_ds:good_001_perturbed.png",
            task_id=task_id,
            dataset_id="mock_ds",
            image_path=img2_path,
            relative_path="good_001_perturbed.png",
            data_origin=DataOrigin.AUGMENTED,
            width=100,
            height=100,
            quality_status=QualityStatus.PASS,
        ),
        Sample(
            sample_id=f"mock_ds:bad_red.png",
            task_id=task_id,
            dataset_id="mock_ds",
            image_path=img3_path,
            relative_path="bad_red.png",
            data_origin=DataOrigin.LEGACY_TRAIN,
            width=100,
            height=100,
            quality_status=QualityStatus.FAIL,
        ),
        Sample(
            sample_id=f"mock_ds:test_blue.png",
            task_id=task_id,
            dataset_id="mock_ds",
            image_path=img4_path,
            relative_path="test_blue.png",
            data_origin=DataOrigin.LEGACY_TEST,
            width=100,
            height=100,
            quality_status=QualityStatus.UNCERTAIN,
        ),
    ]
    sample_repo.upsert_batch(samples)
    config=configure_test_encoder(db,temp_dir)
    index_test_samples(db)

    yield {
        "config": config,
        "temp_dir": temp_dir,
        "db_path": db_path,
        "task_id": task_id,
        "img0_path": img0_path,
        "img1_path": img1_path,
        "img3_path": img3_path,
        "samples": samples,
    }

    from iad_core.workbench.runtime import close_workbenches
    close_workbenches()
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_feature_cache_first_build(test_env):
    """S204: First build computes all features and saves to SQLite cache."""
    extractor = MockFeatureExtractor(profile=test_env["config"].profile)
    res = build_features(
        task_id=test_env["task_id"],
        db_path=test_env["db_path"],
        output_dir=os.path.join(test_env["temp_dir"], "feature_audit"),
        extractor=extractor,
    )

    assert res.total_samples == 5
    assert res.encoded_content_count == 4
    assert res.cache_hit_count == 0
    assert res.failed_count == 0
    assert res.coverage == 1.0
    assert os.path.exists(res.report_json_path)
    assert os.path.exists(res.report_md_path)


def test_feature_cache_second_build_no_inference(test_env):
    """S205: Second build without modifications achieves 100% cache hit and 0 computed."""
    extractor = MockFeatureExtractor(profile=test_env["config"].profile)
    # First build
    build_features(
        task_id=test_env["task_id"],
        db_path=test_env["db_path"],
        output_dir=os.path.join(test_env["temp_dir"], "feature_audit"),
        extractor=extractor,
    )

    # Second build
    res2 = build_features(
        task_id=test_env["task_id"],
        db_path=test_env["db_path"],
        output_dir=os.path.join(test_env["temp_dir"], "feature_audit"),
        extractor=extractor,
    )

    assert res2.total_samples == 5
    assert res2.encoded_content_count == 0
    assert res2.cache_hit_count == 4
    assert res2.failed_count == 0


def test_feature_invalidate_changed_content(test_env):
    """S205: Touching or modifying one file invalidates only that file's cache."""
    extractor = MockFeatureExtractor(profile=test_env["config"].profile)
    build_features(
        task_id=test_env["task_id"],
        db_path=test_env["db_path"],
        output_dir=os.path.join(test_env["temp_dir"], "feature_audit"),
        extractor=extractor,
    )

    Image.new("RGB",(100,100),(100,10,170)).save(test_env["img3_path"])
    index_test_samples(Database(test_env["db_path"]))

    # Re-run build
    res3 = build_features(
        task_id=test_env["task_id"],
        db_path=test_env["db_path"],
        output_dir=os.path.join(test_env["temp_dir"], "feature_audit"),
        extractor=extractor,
    )

    assert res3.total_samples == 5
    assert res3.encoded_content_count == 1
    assert res3.cache_hit_count == 3


def test_search_self_top1(test_env):
    """S208: Searching with exclude_self=False returns self as rank 1 with score ~ 1.0."""
    extractor = MockFeatureExtractor(profile=test_env['config'].profile)
    build_features(task_id=test_env['task_id'], db_path=test_env['db_path'], output_dir=os.path.join(test_env['temp_dir'], 'feature_audit'), extractor=extractor)
    query_id = 'mock_ds:bad_red.png'
    results = search_by_sample(sample_id=query_id, top_k=5, exclude_self=False, db_path=test_env['db_path']).items
    assert len(results) >= 1
    top1 = results[0]
    assert top1.sample_id == query_id
    assert top1.rank == 1
    assert pytest.approx(top1.score, rel=0.001) == 1.0

def test_search_exclude_self(test_env):
    """S208: Searching with exclude_self=True excludes the query itself."""
    extractor = MockFeatureExtractor(profile=test_env['config'].profile)
    build_features(task_id=test_env['task_id'], db_path=test_env['db_path'], output_dir=os.path.join(test_env['temp_dir'], 'feature_audit'), extractor=extractor)
    query_id = 'mock_ds:good_001.png'
    results = search_by_sample(sample_id=query_id, top_k=5, exclude_self=True, db_path=test_env['db_path']).items
    for r in results:
        assert r.sample_id != query_id
    assert results[0].rank == 1

def test_index_rebuild(test_env):
    extractor=MockFeatureExtractor(profile=test_env['config'].profile)
    build_features(test_env['task_id'],db_path=test_env['db_path'],extractor=extractor,
        output_dir=os.path.join(test_env['temp_dir'],'feature_audit'))
    db=Database(test_env['db_path'])
    with CorpusIndexes(db) as indexes:
        first=indexes.prepare({'kind':'all_registered'})
        assert first.vector_count==4
    os.remove(first.index_path)
    with CorpusIndexes(db) as indexes:
        rebuilt=indexes.prepare({'kind':'all_registered'})
        assert rebuilt.vector_count==4 and os.path.exists(rebuilt.index_path)
        assert indexes.stats().builds==1


def test_duplicate_copy_candidate(test_env):
    """S209/S210: Near-duplicate candidates are mined into groups without altering DB labels."""
    extractor = MockFeatureExtractor(profile=test_env['config'].profile)
    build_features(task_id=test_env['task_id'], db_path=test_env['db_path'], output_dir=os.path.join(test_env['temp_dir'], 'feature_audit'), extractor=extractor)
    dup_dir = os.path.join(test_env['temp_dir'], 'near_duplicate')
    res = mine_near_duplicates(task_id=test_env['task_id'], similarity_threshold=0.98, db_path=test_env['db_path'], output_dir=dup_dir)
    assert res.group_count >= 1
    assert os.path.exists(res.groups_json_path)
    assert os.path.exists(res.report_md_path)
    with open(res.groups_json_path, 'r', encoding='utf-8') as f:
        import json
        data = json.load(f)
    found_pair = False
    for g in data['groups']:
        members = g['sample_ids']
        if 'mock_ds:good_001.png' in members and 'mock_ds:good_001_copy.png' in members:
            found_pair = True
            assert 'mock_ds:bad_red.png' not in members
            assert 'mock_ds:test_blue.png' not in members
            assert g['is_cross_origin'] is True
            break
    assert found_pair, 'Identical copy pair was not grouped together'

def test_dino_missing_weights_fail():
    from iad_core.feature.profiles import EmbeddingProfile
    from iad_core.consistency.errors import ConsistencyError
    with pytest.raises(ConsistencyError,match='weights are unavailable'):
        EmbeddingProfile.create('dinov2_vitb14_reg','/non/existent/model_weights.pth','/missing/source')


def test_verified_duplicate_identical_and_different(test_env):
    """F02: PairVerifier correctly verifies identical copy and rejects unrelated image."""
    from iad_core.duplicate.verify import verify_pair
    v1 = verify_pair(test_env['img0_path'], test_env['img1_path'])
    assert v1.verified is True
    assert v1.pixel_cosine >= 0.99
    assert v1.ncc >= 0.99
    v2 = verify_pair(test_env['img0_path'], test_env['img3_path'])
    assert v2.verified is False


def test_duplicate_audit_can_skip_pair_verification(test_env):
    import json
    from iad_core.tools.duplicate_tools import duplicate_audit

    build_features(task_id=test_env['task_id'],db_path=test_env['db_path'],
        output_dir=os.path.join(test_env['temp_dir'],'features'),extractor=MockFeatureExtractor(profile=test_env['config'].profile))
    output=os.path.join(test_env['temp_dir'],'unverified')
    os.makedirs(output)
    with open(os.path.join(output,'groups.json'),'w') as source:source.write('{"obsolete":true}')
    result=duplicate_audit(test_env['task_id'],verify_duplicates=False,db_path=test_env['db_path'],output_dir=output)
    assert result.metrics['candidate_group_count']>0
    assert result.metrics['verified_group_count']==0
    assert result.metrics['verification_requested'] is False
    assert not os.path.exists(os.path.join(output,'groups.json'))
    with open(os.path.join(output,'verified_pairs.json')) as source:
        assert json.load(source)['pairs']==[]


def test_near_edges_are_not_transitive_exact_equivalence_groups(test_env):
    import json

    perturbed=test_env['samples'][2].image_path
    with Image.open(test_env['img0_path']) as source:
        image=source.copy()
    image.putpixel((0,0),(31,200,30));image.save(perturbed)
    index_test_samples(Database(test_env['db_path']))
    build_features(task_id=test_env['task_id'],db_path=test_env['db_path'],
        output_dir=os.path.join(test_env['temp_dir'],'features'),extractor=MockFeatureExtractor(profile=test_env['config'].profile))
    result=mine_near_duplicates(test_env['task_id'],db_path=test_env['db_path'],output_dir=os.path.join(test_env['temp_dir'],'pairs'))
    with open(result.verified_groups_json_path) as source:
        groups=json.load(source)['groups']
    assert len(groups)==1
    assert set(groups[0]['sample_ids'])=={'mock_ds:good_001.png','mock_ds:good_001_copy.png'}
    with open(result.near_pairs_json_path) as source:
        pairs=json.load(source)['pairs']
    assert any(pair['relation']=='NEAR_CANDIDATE' and pair['verified'] is False for pair in pairs)
    with open(result.verified_pairs_json_path) as source:
        pairs=json.load(source)['pairs']
    assert all(pair['relation']=='EXACT' for pair in pairs if pair['verified'])
    with open(result.report_md_path) as source:
        report=source.read()
    assert '原像素严格同图' in report and '近重复候选 1 对' in report


def test_duplicate_relations_survive_custom_export_removal_and_working_directory_change(test_env, monkeypatch, tmp_path):
    from iad_core.duplicate.repository import load_leakage_relations

    build_features(task_id=test_env['task_id'], db_path=test_env['db_path'],
        output_dir=os.path.join(test_env['temp_dir'], 'features'), extractor=MockFeatureExtractor(profile=test_env['config'].profile))
    export = os.path.join(test_env['temp_dir'], 'custom-pairs')
    result = mine_near_duplicates(test_env['task_id'], db_path=test_env['db_path'], output_dir=export)
    assert result.near_candidate_pair_count == 1
    shutil.rmtree(export)
    monkeypatch.chdir(tmp_path)

    relations = load_leakage_relations(Database(test_env['db_path']), test_env['task_id'])
    assert relations.near_leakage_pairs == [('mock_ds:good_001.png', 'mock_ds:good_001_perturbed.png')]
    assert not any({'mock_ds:good_001.png', 'mock_ds:good_001_perturbed.png'}.issubset(group.sample_ids)
        for group in relations.strict_content_groups)


def test_duplicate_audit_reports_unavailable_candidate_sources_as_partial(test_env):
    from iad_core.tools.duplicate_tools import duplicate_audit

    build_features(task_id=test_env['task_id'],db_path=test_env['db_path'],
        output_dir=os.path.join(test_env['temp_dir'],'features'),extractor=MockFeatureExtractor(profile=test_env['config'].profile))
    os.remove(test_env['img1_path'])
    result=duplicate_audit(test_env['task_id'],db_path=test_env['db_path'],output_dir=os.path.join(test_env['temp_dir'],'partial'))
    assert result.status.value=='PARTIAL' and result.metrics['verification_failed_count']==1
    assert any('source' in warning.lower() for warning in result.warnings)


def test_candidate_evidence_uses_current_persisted_pair_relations_and_strict_content(test_env):
    from iad_core.evidence.builder import EvidenceBuilder

    build_features(task_id=test_env['task_id'], db_path=test_env['db_path'],
        output_dir=os.path.join(test_env['temp_dir'], 'features'), extractor=MockFeatureExtractor(profile=test_env['config'].profile))
    export = os.path.join(test_env['temp_dir'], 'candidate-pairs')
    mine_near_duplicates(test_env['task_id'], db_path=test_env['db_path'], output_dir=export)
    shutil.rmtree(export)
    evidence = EvidenceBuilder(test_env['task_id'], db=Database(test_env['db_path'])).build_evidence('mock_ds:good_001.png')

    assert [item.sample_id for item in evidence.strict_content_members] == ['mock_ds:good_001_copy.png']
    assert evidence.strict_content_members[0].relation == 'EXACT'
    near = next(item for item in evidence.direct_pair_observations if item.sample_id == 'mock_ds:good_001_perturbed.png')
    assert near.verification.relation == 'NEAR_CANDIDATE'
    assert near.verification.pixel.exact_equal is False
    assert near.image_sha256_a and near.image_sha256_b


def test_previous_image_version_finishing_late_preserves_current_pair_observation(test_env):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Event
    from iad_core.duplicate.pair_repository import PairObservations
    from iad_core.duplicate.verify import PairVerifier

    started, release = Event(), Event()

    class PausedVerifier(PairVerifier):
        def verify_pixels(self, *args, **kwargs):
            started.set()
            assert release.wait(10)
            return super().verify_pixels(*args, **kwargs)

    store = PairObservations(Database(test_env['db_path']))
    left, right = 'mock_ds:good_001.png', 'mock_ds:good_001_perturbed.png'
    with ThreadPoolExecutor(max_workers=1) as pool:
        previous = pool.submit(store.verify, left, right, verifier=PausedVerifier())
        try:
            assert started.wait(10)
            Image.new('RGB', (100, 100), (32, 199, 30)).save(test_env['samples'][2].image_path)
            index_test_samples(Database(test_env['db_path']))
            current = store.verify(left, right, verifier=PairVerifier())
            assert current.verification.relation == 'NEAR_CANDIDATE'
        finally:
            release.set()
        older = previous.result(timeout=10)
    assert older.image_sha256_b != current.image_sha256_b
    assert store.current(test_env['task_id']) == [current]


@pytest.mark.parametrize('case,expected_status,expected_relation', [
    ('accepted', 0, 'NEAR_CANDIDATE'), ('rejected', 1, 'VISUAL_REFERENCE'), ('unavailable', 1, None)])
def test_legacy_direct_pairs_are_reverified_into_the_relation_repository(test_env, tmp_path, case, expected_status, expected_relation):
    import json
    import subprocess
    import sys
    from pathlib import Path
    from iad_core.duplicate.repository import load_leakage_relations

    right = 'mock_ds:bad_red.png' if case == 'rejected' else 'mock_ds:good_001_perturbed.png'
    if case == 'unavailable':
        os.remove(test_env['samples'][2].image_path)
    pairs = tmp_path / 'old-pairs.json'
    pairs.write_text(json.dumps({'task_id': test_env['task_id'], 'type': 'DIRECT_VERIFIED_PAIRS', 'pairs': [
        {'sample_id_a': 'mock_ds:good_001.png', 'sample_id_b': right, 'verified': True}]}))
    original = pairs.read_bytes()
    report = tmp_path / 'migration.json'
    command = [sys.executable, str(Path(__file__).resolve().parents[1] / 'scripts/reverify_duplicate_relations.py'),
        '--db', test_env['db_path'], '--task', test_env['task_id'], '--pairs', str(pairs), '--report', str(report)]
    result = subprocess.run(command, capture_output=True, text=True, timeout=30)
    assert result.returncode == expected_status, result.stderr
    summary = json.loads(report.read_text())
    assert summary['accepted'] == (1 if case == 'accepted' else 0)
    assert summary['failed'] == (0 if case == 'accepted' else 1)
    if expected_relation:
        assert summary['observations'][0]['verification']['relation'] == expected_relation
        assert summary['observations'][0]['verification']['pixel']['exact_equal'] is False
    else:
        assert summary['observations'] == []
        assert summary['failures'][0]['code'] == 'SOURCE_UNAVAILABLE'
    assert pairs.read_bytes() == original
    if case != 'unavailable':
        relations = load_leakage_relations(Database(test_env['db_path']), test_env['task_id'])
        assert relations.near_leakage_pairs == ([('mock_ds:good_001.png', right)] if case == 'accepted' else [])

def test_filtered_search_sparse_class_progressive_overfetch(test_env):
    """F04: Progressive over-fetch successfully retrieves sparse class items."""
    extractor = MockFeatureExtractor(profile=test_env['config'].profile)
    db = Database(test_env['db_path'])
    sample_repo = SampleRepository(db)
    images_dir = os.path.join(test_env['temp_dir'], 'sparse_images')
    os.makedirs(images_dir, exist_ok=True)
    extra_samples = []
    for i in range(50):
        p = os.path.join(images_dir, f'sparse_unc_{i}.png')
        Image.new('RGB', (50, 50), color=(100, 100, i * 4)).save(p)
        extra_samples.append(Sample(sample_id=f'sparse:unc_{i}.png', task_id=test_env['task_id'], dataset_id='sparse', image_path=p, relative_path=f'unc_{i}.png', data_origin=DataOrigin.LEGACY_TRAIN, width=50, height=50, quality_status=QualityStatus.UNCERTAIN))
    rare_pass_path = os.path.join(images_dir, 'rare_pass.png')
    Image.new('RGB', (50, 50), color=(0, 255, 0)).save(rare_pass_path)
    extra_samples.append(Sample(sample_id='sparse:rare_pass.png', task_id=test_env['task_id'], dataset_id='sparse', image_path=rare_pass_path, relative_path='rare_pass.png', data_origin=DataOrigin.LEGACY_TEST, width=50, height=50, quality_status=QualityStatus.PASS))
    sample_repo.upsert_batch(extra_samples)
    index_test_samples(db)
    build_features(task_id=test_env['task_id'], db_path=test_env['db_path'], output_dir=os.path.join(test_env['temp_dir'], 'feature_audit'), extractor=extractor)
    results = search_by_sample(sample_id='sparse:unc_0.png', top_k=2, exclude_self=True, db_path=test_env['db_path'], filter_quality_status='PASS').items
    assert len(results) >= 1
    assert all((r.quality_status == 'PASS' for r in results))


def test_feature_run_history_append(test_env):
    """F06: Feature build records history in feature_runs.jsonl and updates latest report."""
    extractor = MockFeatureExtractor(profile=test_env["config"].profile)
    out_dir = os.path.join(test_env["temp_dir"], "audit_history")

    # Run 1
    build_features(
        task_id=test_env["task_id"],
        db_path=test_env["db_path"],
        output_dir=out_dir,
        extractor=extractor,
    )

    # Run 2
    build_features(
        task_id=test_env["task_id"],
        db_path=test_env["db_path"],
        output_dir=out_dir,
        extractor=extractor,
    )

    history_file = os.path.join(out_dir, "feature_runs.jsonl")
    assert os.path.exists(history_file)
    with open(history_file, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
    assert len(lines) == 2

    latest_json = os.path.join(out_dir, "feature_report.json")
    latest_md = os.path.join(out_dir, "feature_report.md")
    assert os.path.exists(latest_json)
    assert os.path.exists(latest_md)

