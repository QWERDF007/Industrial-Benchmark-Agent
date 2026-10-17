import os
import json
import sqlite3
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.gold.schemas import GoldRecord, GoldConflictRecord, GoldStatus
from app.split.builder import SplitResult
from app.split.leakage import LeakageReport, save_leakage_reports
from app.benchmark.readiness import BenchmarkReadiness, TrackStatus
from app.benchmark.report import generate_benchmark_report


class BenchmarkExportResult(BaseModel):
    build_id: str
    task_id: str
    output_dir: str
    status: str
    gold_count: int
    train_count: int
    val_count: int
    test_count: int
    conflict_count: int
    leakage_passed: bool
    gold_jsonl: str
    split_json: str
    train_jsonl: str
    val_jsonl: str
    test_jsonl: str
    conflicts_json: str
    leakage_json: str
    leakage_md: str
    benchmark_report_md: str


def export_benchmark(
    build_id: str,
    task_id: str,
    gold_records: List[GoldRecord],
    conflict_records: List[GoldConflictRecord],
    split_result: SplitResult,
    leakage_report: LeakageReport,
    readiness: BenchmarkReadiness,
    output_dir: str,
    gold_policy_name: str = "default_gold_v1",
    split_policy_name: str = "group_stratified_v1",
    seed: int = 42,
    db_path: str = "data/benchmark.db",
) -> BenchmarkExportResult:
    """
    S413: Benchmark Exporter.
    Generates full artifact bundle in runs/benchmark/<build_id>/
    and records split_assignments & benchmark_builds into SQLite.
    """
    os.makedirs(output_dir, exist_ok=True)

    confirmed_records = [r for r in gold_records if r.gold_status == GoldStatus.CONFIRMED.value]
    gold_map = {r.sample_id: r for r in confirmed_records}

    # 1. Paths
    gold_jsonl_path = os.path.join(output_dir, "gold.jsonl")
    conflicts_json_path = os.path.join(output_dir, "conflicts.json")
    split_json_path = os.path.join(output_dir, "split.json")
    train_jsonl_path = os.path.join(output_dir, "train.jsonl")
    val_jsonl_path = os.path.join(output_dir, "val.jsonl")
    test_jsonl_path = os.path.join(output_dir, "test.jsonl")
    leakage_json_path = os.path.join(output_dir, "leakage_report.json")
    leakage_md_path = os.path.join(output_dir, "leakage_report.md")
    report_md_path = os.path.join(output_dir, "benchmark_report.md")

    # 2. Export gold.jsonl (confirmed)
    with open(gold_jsonl_path, "w", encoding="utf-8") as f:
        for r in confirmed_records:
            f.write(r.model_dump_json() + "\n")

    # 3. Export conflicts.json
    with open(conflicts_json_path, "w", encoding="utf-8") as f:
        json.dump([c.model_dump() for c in conflict_records], f, indent=2, ensure_ascii=False)

    # 4. Export split.json
    split_info = {
        "build_id": build_id,
        "task_id": task_id,
        "seed": seed,
        "split_policy": split_policy_name,
        "gold_policy": gold_policy_name,
        "total_samples": len(confirmed_records),
        "train_count": len(split_result.train_ids),
        "val_count": len(split_result.val_ids),
        "test_count": len(split_result.test_ids),
        "assignments": split_result.assignments,
        "group_assignments": split_result.group_assignments,
    }
    with open(split_json_path, "w", encoding="utf-8") as f:
        json.dump(split_info, f, indent=2, ensure_ascii=False)

    # 5. Export train.jsonl, val.jsonl, test.jsonl
    def write_subset(s_ids: List[str], path: str):
        with open(path, "w", encoding="utf-8") as f:
            for sid in s_ids:
                if sid in gold_map:
                    f.write(gold_map[sid].model_dump_json() + "\n")

    write_subset(split_result.train_ids, train_jsonl_path)
    write_subset(split_result.val_ids, val_jsonl_path)
    write_subset(split_result.test_ids, test_jsonl_path)

    # 6. Save leakage reports
    save_leakage_reports(leakage_report, output_dir)

    # 7. Generate benchmark report
    generate_benchmark_report(
        build_id=build_id,
        task_id=task_id,
        gold_records=gold_records,
        conflict_records=conflict_records,
        split_result=split_result,
        leakage_report=leakage_report,
        readiness=readiness,
        output_path=report_md_path,
    )

    # Determine build status
    if not leakage_report.is_passed:
        build_status = "NOT_READY"
    elif readiness.standard_ad.status == TrackStatus.READY:
        build_status = "READY"
    else:
        build_status = readiness.standard_ad.status.value

    # 8. Database persistence
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("BEGIN TRANSACTION")

    # Insert split_assignments
    for sid, sp_name in split_result.assignments.items():
        grp_id = split_result.group_assignments.get(sid, sid)
        cursor.execute("""
            INSERT INTO split_assignments (build_id, sample_id, split_group_id, split_name)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(build_id, sample_id) DO UPDATE SET
                split_group_id = excluded.split_group_id,
                split_name = excluded.split_name
        """, (build_id, sid, grp_id, sp_name))

    # Insert benchmark_builds
    cursor.execute("""
        INSERT INTO benchmark_builds (build_id, task_id, gold_policy, split_policy, seed, status, output_dir)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(build_id) DO UPDATE SET
            status = excluded.status,
            output_dir = excluded.output_dir
    """, (build_id, task_id, gold_policy_name, split_policy_name, seed, build_status, output_dir))

    conn.commit()
    conn.close()

    return BenchmarkExportResult(
        build_id=build_id,
        task_id=task_id,
        output_dir=output_dir,
        status=build_status,
        gold_count=len(confirmed_records),
        train_count=len(split_result.train_ids),
        val_count=len(split_result.val_ids),
        test_count=len(split_result.test_ids),
        conflict_count=len(conflict_records),
        leakage_passed=leakage_report.is_passed,
        gold_jsonl=gold_jsonl_path,
        split_json=split_json_path,
        train_jsonl=train_jsonl_path,
        val_jsonl=val_jsonl_path,
        test_jsonl=test_jsonl_path,
        conflicts_json=conflicts_json_path,
        leakage_json=leakage_json_path,
        leakage_md=leakage_md_path,
        benchmark_report_md=report_md_path,
    )
