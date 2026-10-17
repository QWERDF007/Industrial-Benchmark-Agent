import os
import tempfile
import numpy as np
import pytest

from app.storage.database import Database
from app.storage.repositories import (
    TaskRepository,
    SampleRepository,
    FeatureRepository,
    FeatureRecord,
    AnnotationRepository,
)
from app.schemas.task import InspectionTask
from app.schemas.sample import Sample, QualityStatus, DataOrigin
from app.schemas.annotation import Annotation, AnnotationType, AnnotationSource, GeometryStatus
from app.candidates.schemas import CandidateScoringWeights
from app.candidates.reference import get_normal_reference_set, compute_normal_distance
from app.candidates.density import compute_density_outlier_scores
from app.candidates.domain import compute_domain_novelty_scores
from app.candidates.annotation_signal import compute_annotation_signals
from app.candidates.scorer import aggregate_candidate_scores
from app.candidates.diversity import apply_diversity_suppression
from app.candidates.miner import mine_candidates


@pytest.fixture
def candidate_test_env():
    """Create a temporary environment with synthetic database, features, and annotations."""
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, "test_candidate.db")
    db = Database(db_path)
    db.init_schema()

    task_id = "test_cand_task_01"
    task_repo = TaskRepository(db)
    task_repo.upsert(
        InspectionTask(
            task_id=task_id,
            product="pcb",
            station="sta_1",
            camera="cam_1",
            inspection_target="solder",
            description="Test task for candidate mining",
        )
    )

    sample_repo = SampleRepository(db)
    feat_repo = FeatureRepository(db)
    anno_repo = AnnotationRepository(db)

    # Create 10 synthetic samples:
    # 2 PASS samples (reference normals)
    # 8 UNCERTAIN samples (candidate pool) with varying domains and annotations
    np.random.seed(42)
    dim = 64
    rng = np.random.default_rng(42)

    # Base normal vector
    base_normal = rng.standard_normal(dim).astype(np.float32)
    base_normal /= np.linalg.norm(base_normal)

    # Sample 0, 1: PASS
    for i in range(2):
        s_id = f"pass_{i:02d}"
        sample_repo.upsert(
            Sample(
                sample_id=s_id,
                task_id=task_id,
                dataset_id="ds_test",
                image_path=f"/fake/{s_id}.png",
                relative_path=f"{s_id}.png",
                data_origin=DataOrigin.LEGACY_TRAIN,
                quality_status=QualityStatus.PASS,
                batch_id="batch_A",
                width=100,
                height=100,
            )
        )
        vec = base_normal + rng.normal(0, 0.05, dim).astype(np.float32)
        vec /= np.linalg.norm(vec)
        feat_repo.upsert(
            FeatureRecord(
                sample_id=s_id,
                model_id="dinov2_vitb14_reg",
                preprocess_key="dinov2_224_norm",
                dim=dim,
                dtype="fp16",
                embedding_blob=vec.astype(np.float16).tobytes(),
            )
        )

    # Sample 2..9: UNCERTAIN
    for i in range(2, 10):
        s_id = f"cand_{i:02d}"
        batch = "batch_A" if i < 6 else "batch_B"
        sample_repo.upsert(
            Sample(
                sample_id=s_id,
                task_id=task_id,
                dataset_id="ds_test",
                image_path=f"/fake/{s_id}.png",
                relative_path=f"{s_id}.png",
                data_origin=DataOrigin.LEGACY_TEST,
                quality_status=QualityStatus.UNCERTAIN,
                batch_id=batch,
                width=100,
                height=100,
            )
        )
        # Shift vector farther from normal as i increases
        dist_factor = (i - 2) * 0.15
        perturb = rng.standard_normal(dim).astype(np.float32)
        perturb /= np.linalg.norm(perturb)
        vec = (1.0 - dist_factor) * base_normal + dist_factor * perturb
        vec /= np.linalg.norm(vec)
        feat_repo.upsert(
            FeatureRecord(
                sample_id=s_id,
                model_id="dinov2_vitb14_reg",
                preprocess_key="dinov2_224_norm",
                dim=dim,
                dtype="fp16",
                embedding_blob=vec.astype(np.float16).tobytes(),
            )
        )

    # Add annotations for a few candidates
    anno_repo.upsert(
        Annotation(
            annotation_id="anno_01",
            sample_id="cand_04",
            annotation_type=AnnotationType.BBOX,
            raw_label="shift",
            phenomenon="position_shift",
            bbox=[10, 10, 40, 40],
            geometry_status=GeometryStatus.VALID,
            source=AnnotationSource.IMPORTED,
        )
    )
    anno_repo.upsert(
        Annotation(
            annotation_id="anno_02",
            sample_id="cand_08",
            annotation_type=AnnotationType.BBOX,
            raw_label="contamination",
            phenomenon="dirt",
            bbox=[20, 20, 80, 80],
            geometry_status=GeometryStatus.VALID,
            source=AnnotationSource.IMPORTED,
        )
    )

    return {
        "db": db,
        "db_path": db_path,
        "temp_dir": temp_dir,
        "task_id": task_id,
        "dim": dim,
    }


def test_normal_reference_and_distance(candidate_test_env):
    env = candidate_test_env
    db = env["db"]
    task_id = env["task_id"]

    ref_ids, ref_embeds, is_low = get_normal_reference_set(
        task_id=task_id,
        db=db,
        model_id="dinov2_vitb14_reg",
        preprocess_key="dinov2_224_norm",
    )

    assert len(ref_ids) == 2
    assert is_low is True  # 2 < 20
    assert ref_embeds.shape == (2, env["dim"])

    # Test distance computation
    queries = np.stack([ref_embeds[0], -ref_embeds[0]], axis=0)
    dists = compute_normal_distance(queries, ref_embeds)
    assert len(dists) == 2
    # First query is identical to ref 0 -> cosine is ~1.0 -> dist ~ 0.0
    assert dists[0] == pytest.approx(0.0, abs=1e-3)
    # Second query is opposite -> dist is 1.0 (clamped)
    assert dists[1] == pytest.approx(1.0, abs=1e-3)


def test_density_outlier_scores():
    # 5 closely clustered points + 1 isolated outlier
    rng = np.random.default_rng(123)
    dim = 16
    cluster = rng.normal(0, 0.02, (5, dim)).astype(np.float32)
    cluster /= np.linalg.norm(cluster, axis=1, keepdims=True)

    outlier = rng.normal(5, 0.02, (1, dim)).astype(np.float32)
    outlier /= np.linalg.norm(outlier, axis=1, keepdims=True)

    points = np.vstack([cluster, outlier])
    scores = compute_density_outlier_scores(points, k=3)
    assert len(scores) == 6
    # The outlier must have higher density outlier score than clustered points
    assert scores[5] > np.mean(scores[:5])


def test_domain_novelty_scores():
    dim = 16
    domain_a = np.ones((4, dim), dtype=np.float32)
    domain_a /= np.linalg.norm(domain_a, axis=1, keepdims=True)

    domain_b = -np.ones((4, dim), dtype=np.float32)
    domain_b /= np.linalg.norm(domain_b, axis=1, keepdims=True)

    points = np.vstack([domain_a, domain_b])
    domains = ["A", "A", "A", "A", "B", "B", "B", "B"]

    scores = compute_domain_novelty_scores(points, domains)
    assert len(scores) == 8
    assert np.all(scores >= 0.0) and np.all(scores <= 1.0)


def test_annotation_signals(candidate_test_env):
    env = candidate_test_env
    db = env["db"]
    sample_ids = ["cand_02", "cand_04", "cand_08"]
    signals = compute_annotation_signals(sample_ids, db)
    assert len(signals) == 3
    # cand_02 has no annotations -> 0.0
    assert signals[0] == 0.0
    # cand_04 has a 30x30 bbox in 100x100 -> ~0.09 area
    assert signals[1] > 0.0
    # cand_08 has a 60x60 bbox in 100x100 -> ~0.36 area -> higher signal
    assert signals[2] > signals[1]


def test_score_aggregator():
    w = CandidateScoringWeights(
        normal_distance=0.4,
        density_outlier=0.3,
        domain_novelty=0.15,
        annotation_signal=0.15,
    )
    norm_dist = np.array([0.8, 0.2])
    density = np.array([0.6, 0.1])
    domain = np.array([0.4, 0.1])
    anno = np.array([0.5, 0.0])

    scores = aggregate_candidate_scores(norm_dist, density, domain, anno, weights=w)
    assert len(scores) == 2
    assert scores[0] > scores[1]
    assert 0.0 <= scores[0] <= 1.0


def test_diversity_suppression():
    # 3 samples: sample 0 and 1 are nearly identical (cos sim ~ 0.99), sample 2 is orthogonal
    embeddings = np.array([
        [1.0, 0.0, 0.0],
        [0.999, 0.01, 0.0],
        [0.0, 1.0, 0.0],
    ], dtype=np.float32)
    embeddings /= np.linalg.norm(embeddings, axis=1, keepdims=True)

    sorted_indices = [0, 1, 2]
    diverse = apply_diversity_suppression(
        sorted_candidate_indices=sorted_indices,
        embeddings=embeddings,
        top_k=3,
        diversity_threshold=0.95,
    )
    # Sample 1 should be suppressed due to >0.95 similarity to sample 0
    assert diverse == [0, 2]


def test_candidate_miner_cached_features_reuse(candidate_test_env):
    """Verify Candidate Mining runs completely without running DINO model."""
    env = candidate_test_env
    task_id = env["task_id"]
    db_path = env["db_path"]
    out_dir = os.path.join(env["temp_dir"], "runs", "candidates")

    res = mine_candidates(
        task_id=task_id,
        top_k=5,
        diversity_threshold=0.95,
        target_pool="UNCERTAIN",
        db_path=db_path,
        output_dir=out_dir,
    )

    assert res.pool_size == 8
    assert res.selected_count <= 5
    assert res.low_reference_warning is True
    assert res.reference_count == 2
    assert os.path.exists(res.candidates_json_path)
    assert os.path.exists(res.report_md_path)

    # Check report content
    with open(res.report_md_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "# Hard Normal Candidate Mining Report" in content
    assert "Scoring Weights" in content
    assert "基准良品构成" in content


def test_density_outlier_exact_duplicate_embeddings():
    """C307: Verify KNN density outlier calculation correctly removes self even with identical duplicate embeddings."""
    dim = 32
    rng = np.random.default_rng(123)
    vec1 = rng.standard_normal(dim).astype(np.float32)
    vec1 /= np.linalg.norm(vec1)
    vec2 = rng.standard_normal(dim).astype(np.float32)
    vec2 /= np.linalg.norm(vec2)

    # 4 samples: sample 0, 1, 2 are bit-for-bit identical; sample 3 is distinct
    embeddings = np.stack([vec1, vec1.copy(), vec1.copy(), vec2], axis=0)
    scores = compute_density_outlier_scores(embeddings, k=2)

    assert len(scores) == 4
    # The duplicate copies should have low outlier score (high local density)
    assert scores[0] <= scores[3]
    assert 0.0 <= scores[0] <= 1.0
    assert 0.0 <= scores[3] <= 1.0


def test_annotation_signal_invalid_geometry_filter(candidate_test_env):
    """C308: Verify annotations with geometry_status == 'INVALID' do not increase candidate signal."""
    env = candidate_test_env
    db = env["db"]
    sample_repo = SampleRepository(db)
    anno_repo = AnnotationRepository(db)

    # Insert sample with only INVALID annotation
    sample_repo.upsert(
        Sample(
            sample_id="test_invalid_sample",
            task_id=env["task_id"],
            dataset_id="ds_test",
            image_path="/fake/test_invalid.png",
            relative_path="test_invalid.png",
            data_origin=DataOrigin.LEGACY_TRAIN,
            quality_status=QualityStatus.UNCERTAIN,
            width=100,
            height=100,
        )
    )
    anno_repo.upsert(
        Annotation(
            annotation_id="anno_invalid_01",
            sample_id="test_invalid_sample",
            raw_label="1",
            phenomenon="scratch",
            annotation_type=AnnotationType.BBOX,
            bbox=[150, 150, 200, 200],  # Out-of-bounds rejected
            geometry_status=GeometryStatus.INVALID,
            source=AnnotationSource.IMPORTED,
        )
    )

    # Insert sample with VALID annotation
    sample_repo.upsert(
        Sample(
            sample_id="test_valid_sample",
            task_id=env["task_id"],
            dataset_id="ds_test",
            image_path="/fake/test_valid.png",
            relative_path="test_valid.png",
            data_origin=DataOrigin.LEGACY_TRAIN,
            quality_status=QualityStatus.UNCERTAIN,
            width=100,
            height=100,
        )
    )
    anno_repo.upsert(
        Annotation(
            annotation_id="anno_valid_01",
            sample_id="test_valid_sample",
            raw_label="1",
            phenomenon="scratch",
            annotation_type=AnnotationType.BBOX,
            bbox=[10, 10, 50, 50],
            geometry_status=GeometryStatus.VALID,
            source=AnnotationSource.IMPORTED,
        )
    )

    signals = compute_annotation_signals(["test_invalid_sample", "test_valid_sample"], db)
    assert signals[0] == 0.0, "INVALID annotation must not increase signal (expected 0.0)"
    assert signals[1] > 0.0, "VALID annotation must increase signal"

