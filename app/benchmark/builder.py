import os
import json
import sqlite3
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple

from app.schemas.sample import Sample, QualityStatus, DataOrigin
from app.schemas.config import DatasetConfig, load_config, GoldPolicyConfig, SplitPolicyConfig
from app.gold.schemas import GoldRecord, GoldConflictRecord, GoldStatus
from app.gold.builder import build_gold
from app.split.group import build_split_groups, SplitGroup
from app.split.builder import build_group_split, SplitResult
from app.split.leakage import check_leakage, LeakageReport
from app.benchmark.readiness import evaluate_track_readiness, BenchmarkReadiness
from app.benchmark.exporter import export_benchmark, BenchmarkExportResult


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
    Step 4 Unified Benchmark Pipeline:
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

    # 1. Config resolution
    if config_path and os.path.exists(config_path):
        cfg = load_config(config_path)
    else:
        cfg = DatasetConfig(
            dataset={"id": task_id, "name": task_id, "industry": "3c"},
            root=".",
            task={"task_id": task_id, "name": task_id, "inspection_target": "surface"},
        )

    if seed is not None:
        cfg.split.seed = seed

    # 2. Build Gold
    gold_res = build_gold(
        task_id=task_id,
        policy=cfg.gold,
        output_dir=output_dir,
        db_path=db_path,
    )

    # Load all gold records from SQLite for this task and policy
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT sample_id, task_id, policy_name, gold_quality, binary_label,
               hard_normal, gold_source, gold_source_ref, gold_status,
               provenance_json
        FROM gold_records
        WHERE task_id = ? AND policy_name = ?
    """, (task_id, cfg.gold.policy_name))
    g_rows = cursor.fetchall()

    # Load sample metadata
    cursor.execute("""
        SELECT sample_id, task_id, dataset_id, image_path, relative_path,
               quality_status, quality_source, data_origin,
               batch_id, physical_sample_id, capture_sequence_id,
               station, camera, width, height
        FROM samples
        WHERE task_id = ?
    """, (task_id,))
    s_rows = cursor.fetchall()
    conn.close()

    samples_map = {
        r["sample_id"]: Sample(
            sample_id=r["sample_id"],
            task_id=r["task_id"],
            dataset_id=r["dataset_id"],
            image_path=r["image_path"],
            relative_path=r["relative_path"],
            quality_status=QualityStatus(r["quality_status"]),
            quality_source=r["quality_source"],
            data_origin=DataOrigin(r["data_origin"]) if r["data_origin"] else DataOrigin.UNKNOWN,
            batch_id=r["batch_id"],
            physical_sample_id=r["physical_sample_id"],
            capture_sequence_id=r["capture_sequence_id"],
            station=r["station"],
            camera=r["camera"],
            width=r["width"],
            height=r["height"],
        )
        for r in s_rows
    }

    gold_records: List[GoldRecord] = []
    for r in g_rows:
        s = samples_map[r["sample_id"]]
        prov = json.loads(r["provenance_json"]) if r["provenance_json"] else {}
        gold_records.append(
            GoldRecord(
                sample_id=r["sample_id"],
                task_id=r["task_id"],
                policy_name=r["policy_name"],
                gold_quality=r["gold_quality"],
                binary_label=r["binary_label"],
                hard_normal=bool(r["hard_normal"]),
                gold_source=r["gold_source"],
                gold_source_ref=r["gold_source_ref"],
                gold_status=r["gold_status"],
                provenance=prov,
                physical_sample_id=s.physical_sample_id,
                capture_sequence_id=s.capture_sequence_id,
                batch_id=s.batch_id,
                data_origin=str(s.data_origin.value if hasattr(s.data_origin, "value") else s.data_origin),
                image_path=s.image_path,
                relative_path=s.relative_path,
            )
        )

    # Load conflicts
    conflicts_path = os.path.join(output_dir, "conflicts.json")
    conflict_records: List[GoldConflictRecord] = []
    if os.path.exists(conflicts_path):
        with open(conflicts_path, "r", encoding="utf-8") as f:
            c_data = json.load(f)
            conflict_records = [GoldConflictRecord.model_validate(c) for c in c_data]

    # 3. Filter confirmed samples for split
    confirmed_samples = [
        samples_map[r.sample_id]
        for r in gold_records
        if r.gold_status == GoldStatus.CONFIRMED.value
    ]

    # Load verified duplicate relations
    verified_pairs, verified_groups = load_verified_duplicates(task_id)

    # 4. Build Split Groups
    groups, sample_to_group = build_split_groups(
        samples=confirmed_samples,
        verified_pairs=verified_pairs,
        verified_groups=verified_groups,
    )

    # 5. Deterministic Group Split
    split_result = build_group_split(
        samples=confirmed_samples,
        groups=groups,
        sample_to_group=sample_to_group,
        policy=cfg.split,
    )

    # 6. Leakage Gate Verification
    leakage_report = check_leakage(
        samples=confirmed_samples,
        assignments=split_result.assignments,
        verified_pairs=verified_pairs,
        verified_components=verified_groups,
    )

    # 7. Evaluate Track Readiness
    readiness = evaluate_track_readiness(
        gold_records=gold_records,
        split_result=split_result,
        leakage_report=leakage_report,
        readiness_policy=cfg.readiness_policy,
    )

    # 8. Export Full Benchmark Bundle
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
