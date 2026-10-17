import os
import json
import sqlite3
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple

from iad_core.storage.database import Database
from iad_core.storage.models import Sample, QualityStatus, DataOrigin
from iad_core.storage.repositories import SampleRepository, GoldRepository
from iad_core.task.config import DatasetConfig, load_config, GoldPolicyConfig, SplitPolicyConfig
from iad_core.gold.schemas import GoldRecord, GoldConflictRecord, GoldStatus
from iad_core.gold.builder import build_gold
from iad_core.split.group import build_split_groups, SplitGroup
from iad_core.split.builder import build_group_split, SplitResult
from iad_core.split.leakage import check_leakage, LeakageReport
from iad_core.benchmark.readiness import evaluate_track_readiness, BenchmarkReadiness
from iad_core.benchmark.exporter import export_benchmark, BenchmarkExportResult


def load_verified_duplicates(task_id: str) -> Tuple[List[Tuple[str, str]], List[List[str]]]:
    """Helper to load verified pairs and groups for a task if existing."""
    verified_pairs: List[Tuple[str, str]] = []
    verified_groups: List[List[str]] = []

    pairs_file = os.path.join("runs", "near_duplicate", task_id, "verified_pairs.json")
    if os.path.exists(pairs_file):
        with open(pairs_file, "r", encoding="utf-8") as f:
            pair_data = json.load(f)
            pairs_list = pair_data.get("pairs", []) if isinstance(pair_data, dict) else pair_data
            for p in pairs_list:
                if isinstance(p, dict) and (p.get("verified", False) or p.get("is_verified", False)):
                    verified_pairs.append((p["sample_id_a"], p["sample_id_b"]))

    groups_file = os.path.join("runs", "near_duplicate", task_id, "verified_groups.json")
    if os.path.exists(groups_file):
        with open(groups_file, "r", encoding="utf-8") as f:
            grp_data = json.load(f)
            groups_list = grp_data.get("groups", []) if isinstance(grp_data, dict) else grp_data
            for g in groups_list:
                if isinstance(g, dict):
                    s_ids = g.get("sample_ids", [])
                    if len(s_ids) > 1:
                        verified_groups.append(s_ids)

    return verified_pairs, verified_groups


def generate_build_id(task_id: str, db_path: str = "data/benchmark.db") -> str:
    """Generate deterministic incremental build_id e.g. kuangjiao_inspection_01_20261017_001"""
    date_str = datetime.now().strftime("%Y%m%d")
    prefix = f"{task_id}_{date_str}_"

    seq = 1
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT build_id FROM benchmark_builds WHERE build_id LIKE ? ORDER BY build_id DESC LIMIT 1", (f"{prefix}%",))
        row = cursor.fetchone()
        conn.close()
        if row and row[0]:
            try:
                last_seq = int(row[0].split("_")[-1])
                seq = last_seq + 1
            except ValueError:
                seq = 1

    return f"{prefix}{seq:03d}"


def run_benchmark_pipeline(
    task_id: str,
    build_id: Optional[str] = None,
    config_path: Optional[str] = None,
    output_dir: Optional[str] = None,
    db_path: str = "data/benchmark.db",
    seed: Optional[int] = None,
) -> BenchmarkExportResult:
    """
    Unified Benchmark Pipeline (R212):
    1. Gold Resolution (with provenance & conflict detection)
    2. Group Graph Union-Find (physical, capture, verified duplicate)
    3. Group-safe Stratified Split (deterministic seed)
    4. Blocking Leakage Gate
    5. Track Readiness Evaluation (5 tracks)
    6. Complete Export to runs/benchmark/<build_id>/ and SQLite
    """
    if not build_id:
        build_id = generate_build_id(task_id, db_path)

    if not output_dir:
        output_dir = os.path.join("runs", "benchmark", build_id)
    os.makedirs(output_dir, exist_ok=True)

    if not config_path:
        for candidate_path in [f"configs/{task_id}.yaml", "configs/kuangjiao.yaml"]:
            if os.path.exists(candidate_path):
                config_path = candidate_path
                break

    if not config_path or not os.path.exists(config_path):
        raise ValueError(f"Config path is required for formal benchmark build. None found for task '{task_id}'.")

    cfg = load_config(config_path)

    if seed is not None:
        cfg.split.seed = seed

    # 1. Build Gold
    gold_res = build_gold(
        task_id=task_id,
        policy=cfg.gold,
        output_dir=output_dir,
        db_path=db_path,
    )

    db = Database(db_path)
    sample_repo = SampleRepository(db)
    gold_repo = GoldRepository(db)

    samples = sample_repo.list_by_task(task_id)
    samples_map = {s.sample_id: s for s in samples}

    storage_gold_records = gold_repo.list_by_task(task_id, cfg.gold.policy_name)
    gold_records: List[GoldRecord] = []
    gold_dict: Dict[str, GoldRecord] = {}

    for r in storage_gold_records:
        g = GoldRecord(
            sample_id=r.sample_id,
            task_id=r.task_id,
            policy_name=r.policy_name,
            gold_quality=r.gold_quality,
            binary_label=r.binary_label,
            hard_normal=r.hard_normal,
            gold_source=r.gold_source,
            gold_source_ref=r.gold_source_ref,
            gold_status=r.gold_status,
            provenance=r.provenance,
            physical_sample_id=r.physical_sample_id,
            capture_sequence_id=r.capture_sequence_id,
            batch_id=r.batch_id,
            data_origin=r.data_origin,
            image_path=r.image_path,
            relative_path=r.relative_path,
        )
        gold_records.append(g)
        gold_dict[g.sample_id] = g

    conflicts_path = os.path.join(output_dir, "conflicts.json")
    conflict_records: List[GoldConflictRecord] = []
    if os.path.exists(conflicts_path):
        with open(conflicts_path, "r", encoding="utf-8") as f:
            c_data = json.load(f)
            conflict_records = [GoldConflictRecord.model_validate(c) for c in c_data]

    confirmed_samples = [
        samples_map[r.sample_id]
        for r in gold_records
        if r.gold_status == GoldStatus.CONFIRMED.value and r.sample_id in samples_map
    ]

    verified_pairs, verified_groups = load_verified_duplicates(task_id)

    physical_scope = "batch"
    if cfg.metadata_semantics:
        physical_scope = cfg.metadata_semantics.get("physical_sample_scope", "batch")

    # 2. Build Split Groups with Gold awareness
    groups, sample_to_group = build_split_groups(
        samples=confirmed_samples,
        verified_pairs=verified_pairs,
        verified_groups=verified_groups,
        gold_records=gold_dict,
        physical_sample_scope=physical_scope,
    )

    # 3. Deterministic Group Split
    split_result = build_group_split(
        samples=confirmed_samples,
        groups=groups,
        sample_to_group=sample_to_group,
        policy=cfg.split,
    )

    # 4. Leakage Gate Verification
    leakage_report = check_leakage(
        samples=confirmed_samples,
        assignments=split_result.assignments,
        verified_pairs=verified_pairs,
        verified_components=verified_groups,
        physical_sample_scope=physical_scope,
    )

    # 5. Evaluate Track Readiness
    readiness = evaluate_track_readiness(
        gold_records=gold_records,
        split_result=split_result,
        leakage_report=leakage_report,
        readiness_policy=cfg.readiness_policy,
        metadata_semantics=cfg.metadata_semantics,
    )

    # 6. Export Full Benchmark Bundle
    result = export_benchmark(
        build_id=build_id,
        task_id=task_id,
        gold_records=gold_records,
        conflict_records=conflict_records,
        split_result=split_result,
        leakage_report=leakage_report,
        readiness=readiness,
        output_dir=output_dir,
        gold_policy_name=cfg.gold.policy_name,
        split_policy_name=cfg.split.policy_name,
        seed=cfg.split.seed,
        db_path=db_path,
    )

    return result
