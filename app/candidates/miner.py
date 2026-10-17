import os
import json
import time
import logging
from typing import Optional, List, Dict, Any
import numpy as np

from app.storage.database import Database
from app.storage.repositories import FeatureRepository, SampleRepository
from app.schemas.config import load_config
from app.candidates.schemas import (
    CandidateSignals,
    CandidateRecord,
    CandidateScoringWeights,
    CandidateMiningResult,
)
from app.candidates.reference import get_normal_reference_set, compute_normal_distance
from app.candidates.density import compute_density_outlier_scores
from app.candidates.domain import compute_domain_novelty_scores
from app.candidates.annotation_signal import compute_annotation_signals
from app.candidates.scorer import aggregate_candidate_scores
from app.candidates.diversity import apply_diversity_suppression
from app.candidates.report import generate_candidate_mining_markdown

logger = logging.getLogger("iad_benchmark.candidates.miner")


def mine_candidates(
    task_id: str,
    top_k: int = 500,
    policy_name: Optional[str] = None,
    weights: Optional[CandidateScoringWeights] = None,
    diversity_threshold: Optional[float] = None,
    target_pool: str = "UNCERTAIN",
    include_raw_pass: bool = True,
    include_review_pass: bool = True,
    include_hard_normal: Optional[bool] = None,
    config_path: Optional[str] = None,
    db_path: str = "data/benchmark.db",
    output_dir: Optional[str] = None,
    model_id: str = "dinov2_vitb14_reg",
    preprocess_key: str = "dinov2_224_norm",
) -> CandidateMiningResult:
    """
    Mine hard normal candidates from the candidate pool using existing cached visual features.
    100% feature reuse without running GPU inference.
    """
    start_time = time.time()
    db = Database(db_path)
    sample_repo = SampleRepository(db)
    feat_repo = FeatureRepository(db)

    # Load config if available
    cfg = None
    if config_path and os.path.exists(config_path):
        cfg = load_config(config_path)
    else:
        for possible_cfg in [f"configs/{task_id}.yaml", "configs/kuangjiao.yaml"]:
            if os.path.exists(possible_cfg):
                try:
                    loaded = load_config(possible_cfg)
                    if loaded.task.task_id == task_id:
                        cfg = loaded
                        break
                except Exception:
                    pass

    active_policy_name = policy_name or (cfg.candidate_mining.policy_name if cfg else "default")
    if weights is None and cfg and cfg.candidate_mining and cfg.candidate_mining.weights:
        active_weights = CandidateScoringWeights(
            normal_distance=cfg.candidate_mining.weights.normal_distance,
            density_outlier=cfg.candidate_mining.weights.density_outlier,
            domain_novelty=cfg.candidate_mining.weights.domain_novelty,
            annotation_signal=cfg.candidate_mining.weights.annotation_signal,
        )
    else:
        active_weights = weights or CandidateScoringWeights()
    active_weights = active_weights.normalized()

    if diversity_threshold is None:
        active_diversity_threshold = cfg.candidate_mining.diversity_threshold if cfg else 0.92
    else:
        active_diversity_threshold = diversity_threshold

    if include_hard_normal is None:
        active_include_hard_normal = cfg.reference_normal.include_hard_normal if cfg else False
    else:
        active_include_hard_normal = include_hard_normal

    # 1. Fetch Candidate Pool
    with db.connection() as conn:
        cursor = conn.cursor()
        if target_pool == "UNCERTAIN":
            cursor.execute(
                """
                SELECT sample_id, image_path, relative_path, quality_status, data_origin, batch_id, physical_sample_id
                FROM samples 
                WHERE task_id = ? AND quality_status = 'UNCERTAIN' AND data_origin != 'AUGMENTED'
                ORDER BY id ASC
                """,
                (task_id,),
            )
        elif target_pool == "ALL":
            cursor.execute(
                """
                SELECT sample_id, image_path, relative_path, quality_status, data_origin, batch_id, physical_sample_id
                FROM samples 
                WHERE task_id = ? AND data_origin != 'AUGMENTED'
                ORDER BY id ASC
                """,
                (task_id,),
            )
        else:
            cursor.execute(
                """
                SELECT sample_id, image_path, relative_path, quality_status, data_origin, batch_id, physical_sample_id
                FROM samples 
                WHERE task_id = ? AND quality_status = ? AND data_origin != 'AUGMENTED'
                ORDER BY id ASC
                """,
                (task_id, target_pool),
            )
        pool_rows = cursor.fetchall()

    pool_size = len(pool_rows)
    if pool_size == 0:
        logger.warning(f"No candidate pool samples found for task '{task_id}' (filter={target_pool})")
        out_dir = output_dir or os.path.join("runs", "candidate_mining", task_id)
        os.makedirs(out_dir, exist_ok=True)
        cand_json = os.path.join(out_dir, "candidates.json")
        rep_md = os.path.join(out_dir, "mining_report.md")
        with open(cand_json, "w", encoding="utf-8") as f:
            json.dump([], f)
        with open(rep_md, "w", encoding="utf-8") as f:
            f.write(f"# Candidate Mining: {task_id}\n\nNo candidates in pool.\n")
        return CandidateMiningResult(
            task_id=task_id,
            pool_size=0,
            top_k=top_k,
            weights=active_weights,
            diversity_threshold=diversity_threshold,
            selected_count=0,
            low_reference_warning=True,
            reference_count=0,
            candidates_json_path=cand_json,
            report_md_path=rep_md,
            elapsed_seconds=0.0,
        )

    pool_sample_ids = [r[0] for r in pool_rows]
    pool_img_paths = [r[1] for r in pool_rows]
    pool_rel_paths = [r[2] for r in pool_rows]
    pool_qualities = [r[3] for r in pool_rows]
    pool_origins = [r[4] for r in pool_rows]
    pool_batches = [r[5] for r in pool_rows]
    pool_physical_ids = [r[6] for r in pool_rows]

    logger.info(f"Loaded {pool_size} candidate pool samples for task {task_id}")

    # 2. Unpack feature embeddings from cache
    raw_feats = feat_repo.list_by_task(task_id, model_id, preprocess_key)
    feat_map = {r.sample_id: r for r in raw_feats}

    dim = raw_feats[0].dim if raw_feats else 768
    valid_indices = []
    vector_list = []

    for idx, s_id in enumerate(pool_sample_ids):
        r = feat_map.get(s_id)
        if r:
            np_dtype = np.float16 if r.dtype == "fp16" else np.float32
            vec = np.frombuffer(r.embedding_blob, dtype=np_dtype).astype(np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            vector_list.append(vec)
            valid_indices.append(idx)

    if not vector_list:
        raise ValueError(f"No feature records could be loaded from cache for task '{task_id}'")

    embeddings = np.stack(vector_list, axis=0)  # [N_valid, D]

    # Filter pool lists to those with valid features
    sample_ids = [pool_sample_ids[i] for i in valid_indices]
    img_paths = [pool_img_paths[i] for i in valid_indices]
    rel_paths = [pool_rel_paths[i] for i in valid_indices]
    qualities = [pool_qualities[i] for i in valid_indices]
    origins = [pool_origins[i] for i in valid_indices]
    batches = [pool_batches[i] for i in valid_indices]
    physical_ids = [pool_physical_ids[i] for i in valid_indices]

    n_samples = len(sample_ids)

    # 3. Compute 4 signals
    # 3.1 Normal Distance
    ref_ids, ref_embeddings, is_low_ref, ref_breakdown = get_normal_reference_set(
        task_id=task_id,
        db=db,
        model_id=model_id,
        preprocess_key=preprocess_key,
        include_raw_pass=include_raw_pass,
        include_review_pass=include_review_pass,
        include_hard_normal=active_include_hard_normal,
        return_breakdown=True,
    )
    normal_dists = compute_normal_distance(embeddings, ref_embeddings)

    # 3.2 Local Density Outlier
    density_outliers = compute_density_outlier_scores(embeddings, k=15)

    # 3.3 Domain Novelty
    domain_novelties = compute_domain_novelty_scores(embeddings, batches)

    # 3.4 Annotation Signal
    annotation_signals = compute_annotation_signals(sample_ids, db)

    # 4. Score Aggregator
    composite_scores = aggregate_candidate_scores(
        normal_distance=normal_dists,
        density_outlier=density_outliers,
        domain_novelty=domain_novelties,
        annotation_signal=annotation_signals,
        weights=active_weights,
    )

    # 5. Ranking & Diversity Suppression
    sorted_order = np.argsort(-composite_scores).tolist()
    diverse_indices = apply_diversity_suppression(
        sorted_candidate_indices=sorted_order,
        embeddings=embeddings,
        top_k=top_k,
        diversity_threshold=active_diversity_threshold,
    )

    # 6. Build Candidate Records
    candidate_records: List[CandidateRecord] = []
    for rank, idx in enumerate(diverse_indices, start=1):
        candidate_records.append(
            CandidateRecord(
                sample_id=sample_ids[idx],
                rank=rank,
                candidate_score=round(float(composite_scores[idx]), 4),
                signals=CandidateSignals(
                    normal_distance=round(float(normal_dists[idx]), 4),
                    density_outlier=round(float(density_outliers[idx]), 4),
                    domain_novelty=round(float(domain_novelties[idx]), 4),
                    annotation_signal=round(float(annotation_signals[idx]), 4),
                ),
                data_origin=origins[idx],
                quality_status=qualities[idx],
                batch_id=batches[idx],
                physical_sample_id=physical_ids[idx],
                image_path=img_paths[idx],
                relative_path=rel_paths[idx],
            )
        )

    # 7. Output files
    out_dir = output_dir or os.path.join("runs", "candidate_mining", task_id)
    os.makedirs(out_dir, exist_ok=True)
    json_path = os.path.join(out_dir, "candidates.json")
    md_path = os.path.join(out_dir, "mining_report.md")

    elapsed = time.time() - start_time

    mining_res = CandidateMiningResult(
        task_id=task_id,
        policy_name=active_policy_name,
        pool_size=pool_size,
        top_k=top_k,
        weights=active_weights,
        diversity_threshold=active_diversity_threshold,
        selected_count=len(candidate_records),
        low_reference_warning=is_low_ref,
        reference_count=len(ref_ids),
        reference_breakdown=ref_breakdown,
        candidates_json_path=json_path,
        report_md_path=md_path,
        elapsed_seconds=round(elapsed, 2),
    )

    # Save JSON
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump([r.model_dump() for r in candidate_records], f, indent=2, ensure_ascii=False)

    # Save Markdown report
    md_content = generate_candidate_mining_markdown(
        task_id=task_id,
        result=mining_res,
        records=candidate_records,
    )
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    logger.info(
        f"Candidate mining complete for task '{task_id}'. Selected {len(candidate_records)} candidates in {elapsed:.2f}s."
    )
    return mining_res
