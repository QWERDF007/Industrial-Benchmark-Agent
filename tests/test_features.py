import os
import time
import shutil
import tempfile
import numpy as np
from PIL import Image
import pytest

from app.storage.database import Database
from app.storage.repositories import (
    TaskRepository,
    SampleRepository,
    FeatureRepository,
    FeatureRecord,
)
from app.schemas.task import InspectionTask
from app.schemas.sample import Sample, QualityStatus, DataOrigin
from app.features.dino import MockFeatureExtractor
from app.features.builder import build_features, get_feature_stats
from app.features.index import build_faiss_index, load_faiss_index
from app.features.search import search_by_sample
from app.features.duplicate import mine_near_duplicates


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

    yield {
        "temp_dir": temp_dir,
        "db_path": db_path,
        "task_id": task_id,
        "img0_path": img0_path,
        "img1_path": img1_path,
        "img3_path": img3_path,
        "samples": samples,
    }

    shutil.rmtree(temp_dir, ignore_errors=True)


def test_feature_cache_first_build(test_env):
    """S204: First build computes all features and saves to SQLite cache."""
    extractor = MockFeatureExtractor(model_id="mock_vit_768", preprocess_key="mock_224")
    res = build_features(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        output_dir=os.path.join(test_env["temp_dir"], "feature_audit"),
        extractor=extractor,
    )

    assert res.total_samples == 5
    assert res.computed_count == 5
    assert res.cached_count == 0
    assert res.failed_count == 0
    assert res.coverage == 1.0
    assert os.path.exists(res.report_json_path)
    assert os.path.exists(res.report_md_path)


def test_feature_cache_second_build_no_inference(test_env):
    """S205: Second build without modifications achieves 100% cache hit and 0 computed."""
    extractor = MockFeatureExtractor(model_id="mock_vit_768", preprocess_key="mock_224")
    # First build
    build_features(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        output_dir=os.path.join(test_env["temp_dir"], "feature_audit"),
        extractor=extractor,
    )

    # Second build
    res2 = build_features(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        output_dir=os.path.join(test_env["temp_dir"], "feature_audit"),
        extractor=extractor,
    )

    assert res2.total_samples == 5
    assert res2.computed_count == 0
    assert res2.cached_count == 5
    assert res2.failed_count == 0


def test_feature_invalidate_one_file(test_env):
    """S205: Touching or modifying one file invalidates only that file's cache."""
    extractor = MockFeatureExtractor(model_id="mock_vit_768", preprocess_key="mock_224")
    build_features(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        extractor=extractor,
    )

    # Modify mtime of img0_path
    img0_path = test_env["img0_path"]
    future_mtime = time.time() + 100
    os.utime(img0_path, (future_mtime, future_mtime))

    # Re-run build
    res3 = build_features(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        extractor=extractor,
    )

    assert res3.total_samples == 5
    assert res3.computed_count == 1
    assert res3.cached_count == 4


def test_search_self_top1(test_env):
    """S208: Searching with exclude_self=False returns self as rank 1 with score ~ 1.0."""
    extractor = MockFeatureExtractor(model_id="mock_vit_768", preprocess_key="mock_224")
    build_features(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        extractor=extractor,
    )

    idx_dir = os.path.join(test_env["temp_dir"], "features_idx")
    build_faiss_index(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        output_dir=idx_dir,
    )

    query_id = "mock_ds:bad_red.png"
    results = search_by_sample(
        sample_id=query_id,
        task_id=test_env["task_id"],
        top_k=5,
        exclude_self=False,
        index_dir=idx_dir,
        db_path=test_env["db_path"],
    )

    assert len(results) >= 1
    top1 = results[0]
    assert top1.sample_id == query_id
    assert top1.rank == 1
    assert pytest.approx(top1.score, rel=1e-3) == 1.0


def test_search_exclude_self(test_env):
    """S208: Searching with exclude_self=True excludes the query itself."""
    extractor = MockFeatureExtractor(model_id="mock_vit_768", preprocess_key="mock_224")
    build_features(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        extractor=extractor,
    )

    idx_dir = os.path.join(test_env["temp_dir"], "features_idx")
    build_faiss_index(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        output_dir=idx_dir,
    )

    query_id = "mock_ds:good_001.png"
    results = search_by_sample(
        sample_id=query_id,
        task_id=test_env["task_id"],
        top_k=5,
        exclude_self=True,
        index_dir=idx_dir,
        db_path=test_env["db_path"],
    )

    for r in results:
        assert r.sample_id != query_id
    assert results[0].rank == 1


def test_index_rebuild(test_env):
    """S207: FAISS index can be deleted and rebuilt directly from SQLite cache."""
    extractor = MockFeatureExtractor(model_id="mock_vit_768", preprocess_key="mock_224")
    build_features(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        extractor=extractor,
    )

    idx_dir = os.path.join(test_env["temp_dir"], "features_idx")
    build_faiss_index(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        output_dir=idx_dir,
    )

    # Delete index file
    index_file = os.path.join(idx_dir, "index.faiss")
    os.remove(index_file)
    assert not os.path.exists(index_file)

    # Rebuild from cache
    rebuild_res = build_faiss_index(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        output_dir=idx_dir,
    )

    assert os.path.exists(index_file)
    assert rebuild_res.num_vectors == 5


def test_duplicate_copy_candidate(test_env):
    """S209/S210: Near-duplicate candidates are mined into groups without altering DB labels."""
    extractor = MockFeatureExtractor(model_id="mock_vit_768", preprocess_key="mock_224")
    build_features(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        extractor=extractor,
    )

    idx_dir = os.path.join(test_env["temp_dir"], "features_idx")
    build_faiss_index(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        output_dir=idx_dir,
    )

    dup_dir = os.path.join(test_env["temp_dir"], "near_duplicate")
    res = mine_near_duplicates(
        task_id=test_env["task_id"],
        similarity_threshold=0.98,
        index_dir=idx_dir,
        db_path=test_env["db_path"],
        output_dir=dup_dir,
    )

    assert res.group_count >= 1
    assert os.path.exists(res.groups_json_path)
    assert os.path.exists(res.report_md_path)

    # Verify identical copies are in a group
    with open(res.groups_json_path, "r", encoding="utf-8") as f:
        import json
        data = json.load(f)

    # good_001.png and good_001_copy.png should be in the same group
    found_pair = False
    for g in data["groups"]:
        members = g["sample_ids"]
        if "mock_ds:good_001.png" in members and "mock_ds:good_001_copy.png" in members:
            found_pair = True
            # Unrelated red and blue images must NOT be in this group
            assert "mock_ds:bad_red.png" not in members
            assert "mock_ds:test_blue.png" not in members
            # Check cross-origin flag (LEGACY_TRAIN vs LEGACY_TEST)
            assert g["is_cross_origin"] is True
            break

    assert found_pair, "Identical copy pair was not grouped together"


def test_dino_missing_weights_fail():
    """F01: Missing DINO weights must fail fast with RuntimeError."""
    from app.features.dino import DINOFeatureExtractor
    extractor = DINOFeatureExtractor(weights_path="/non/existent/model_weights.pth")
    with pytest.raises(RuntimeError, match="DINOv2 weights file not found"):
        extractor.encode_batch(["dummy.png"])


def test_verified_duplicate_identical_and_different(test_env):
    """F02: PairVerifier correctly verifies identical copy and rejects unrelated image."""
    from app.features.verify import verify_pair
    # Identical copy
    v1 = verify_pair(test_env["img0_path"], test_env["img1_path"])
    assert v1.verified is True
    assert v1.pixel_cosine >= 0.99
    assert v1.ncc >= 0.99

    # Unrelated image (green vs red)
    v2 = verify_pair(test_env["img0_path"], test_env["img3_path"])
    assert v2.verified is False


def test_filtered_search_sparse_class_progressive_overfetch(test_env):
    """F04: Progressive over-fetch successfully retrieves sparse class items."""
    extractor = MockFeatureExtractor(model_id="mock_vit_768", preprocess_key="mock_224")
    db = Database(test_env["db_path"])
    sample_repo = SampleRepository(db)

    # Add 100 UNCERTAIN samples and 2 rare PASS samples
    images_dir = os.path.join(test_env["temp_dir"], "sparse_images")
    os.makedirs(images_dir, exist_ok=True)
    extra_samples = []

    for i in range(50):
        p = os.path.join(images_dir, f"sparse_unc_{i}.png")
        Image.new("RGB", (50, 50), color=(100, 100, i * 4)).save(p)
        extra_samples.append(
            Sample(
                sample_id=f"sparse:unc_{i}.png",
                task_id=test_env["task_id"],
                dataset_id="sparse",
                image_path=p,
                relative_path=f"unc_{i}.png",
                data_origin=DataOrigin.LEGACY_TRAIN,
                width=50,
                height=50,
                quality_status=QualityStatus.UNCERTAIN,
            )
        )

    # Rare PASS sample at the end
    rare_pass_path = os.path.join(images_dir, "rare_pass.png")
    Image.new("RGB", (50, 50), color=(0, 255, 0)).save(rare_pass_path)
    extra_samples.append(
        Sample(
            sample_id="sparse:rare_pass.png",
            task_id=test_env["task_id"],
            dataset_id="sparse",
            image_path=rare_pass_path,
            relative_path="rare_pass.png",
            data_origin=DataOrigin.LEGACY_TEST,
            width=50,
            height=50,
            quality_status=QualityStatus.PASS,
        )
    )
    sample_repo.upsert_batch(extra_samples)

    # Rebuild features and index
    build_features(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        extractor=extractor,
    )
    idx_dir = os.path.join(test_env["temp_dir"], "sparse_features_idx")
    build_faiss_index(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        output_dir=idx_dir,
    )

    # Search query from an UNCERTAIN image, asking for quality PASS
    results = search_by_sample(
        sample_id="sparse:unc_0.png",
        task_id=test_env["task_id"],
        top_k=2,
        exclude_self=True,
        index_dir=idx_dir,
        db_path=test_env["db_path"],
        filter_quality_status="PASS",
    )
    # Must retrieve PASS samples even though 50 UNCERTAIN images ranked ahead in proximity
    assert len(results) >= 1
    assert all(r.quality_status == "PASS" for r in results)


def test_feature_run_history_append(test_env):
    """F06: Feature build records history in feature_runs.jsonl and updates latest report."""
    extractor = MockFeatureExtractor(model_id="mock_vit_768", preprocess_key="mock_224")
    out_dir = os.path.join(test_env["temp_dir"], "audit_history")

    # Run 1
    build_features(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        output_dir=out_dir,
        extractor=extractor,
    )

    # Run 2
    build_features(
        task_id=test_env["task_id"],
        model_id=extractor.model_id,
        preprocess_key=extractor.preprocess_key,
        db_path=test_env["db_path"],
        output_dir=out_dir,
        extractor=extractor,
    )

    history_file = os.path.join(out_dir, "feature_runs.jsonl")
    assert os.path.exists(history_file)
    with open(history_file, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
    assert len(lines) == 2

    latest_json = os.path.join(out_dir, "feature_report_latest.json")
    latest_md = os.path.join(out_dir, "feature_report_latest.md")
    assert os.path.exists(latest_json)
    assert os.path.exists(latest_md)

