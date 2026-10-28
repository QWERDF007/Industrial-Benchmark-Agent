import os
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from iad_core.storage.database import Database
from iad_core.storage.models import BenchmarkBuildRecord, SplitAssignmentRecord
from iad_core.storage.models import GoldRecord as StorageGoldRecord
from iad_core.storage.repositories import BenchmarkRepository, GoldRepository
from iad_core.gold.schemas import GoldRecord, GoldConflictRecord, GoldStatus
from iad_core.split.builder import SplitResult
from iad_core.split.leakage import LeakageReport, save_leakage_reports
from iad_core.benchmark.readiness import BenchmarkReadiness, TrackStatus
from iad_core.benchmark.report import generate_benchmark_report
from iad_core.benchmark.publication import BenchmarkPublication


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
    Benchmark Exporter (R212).
    Generates 9 benchmark assets in runs/benchmark/<build_id>/
    and records split_assignments & benchmark_builds into SQLite.
    """
    with BenchmarkPublication(output_dir) as publication:
        artifact_dir = publication.staging

        confirmed_records = [r for r in gold_records if r.gold_status == GoldStatus.CONFIRMED.value]
        gold_map = {r.sample_id: r for r in confirmed_records}

        gold_jsonl_path = os.path.join(artifact_dir, "gold.jsonl")
        conflicts_json_path = os.path.join(artifact_dir, "conflicts.json")
        split_json_path = os.path.join(artifact_dir, "split.json")
        train_jsonl_path = os.path.join(artifact_dir, "train.jsonl")
        val_jsonl_path = os.path.join(artifact_dir, "val.jsonl")
        test_jsonl_path = os.path.join(artifact_dir, "test.jsonl")
        leakage_json_path = os.path.join(artifact_dir, "leakage_report.json")
        leakage_md_path = os.path.join(artifact_dir, "leakage_report.md")
        report_md_path = os.path.join(artifact_dir, "benchmark_report.md")

        with open(gold_jsonl_path, "w", encoding="utf-8") as f:
            for r in confirmed_records:
                f.write(r.model_dump_json() + "\n")

        with open(conflicts_json_path, "w", encoding="utf-8") as f:
            json.dump([c.model_dump() for c in conflict_records], f, indent=2, ensure_ascii=False)

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

        def write_subset(s_ids: List[str], path: str):
            with open(path, "w", encoding="utf-8") as f:
                for sid in s_ids:
                    if sid in gold_map:
                        f.write(gold_map[sid].model_dump_json() + "\n")

        write_subset(split_result.train_ids, train_jsonl_path)
        write_subset(split_result.val_ids, val_jsonl_path)
        write_subset(split_result.test_ids, test_jsonl_path)

        save_leakage_reports(leakage_report, artifact_dir)

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

        if not leakage_report.is_passed:
            build_status = "NOT_READY"
        elif readiness.standard_ad.status == TrackStatus.READY:
            build_status = "READY"
        else:
            build_status = readiness.standard_ad.status.value

        db = Database(db_path)
        bench_repo = BenchmarkRepository(db)

        bench_build = BenchmarkBuildRecord(
            build_id=build_id,
            task_id=task_id,
            gold_policy=gold_policy_name,
            split_policy=split_policy_name,
            seed=seed,
            status=build_status,
            output_dir=output_dir,
        )

        assignment_records = []
        for sid, sp_name in split_result.assignments.items():
            grp_id = split_result.group_assignments.get(sid, sid)
            assignment_records.append(
                SplitAssignmentRecord(
                    build_id=build_id,
                    sample_id=sid,
                    split_group_id=grp_id,
                    split_name=sp_name,
                )
            )
        with db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            if connection.execute('SELECT 1 FROM benchmark_builds WHERE build_id=?', (build_id,)).fetchone():
                raise FileExistsError('Benchmark build ID already exists; use a new build ID')
            GoldRepository(db).upsert_batch([StorageGoldRecord.model_validate(record.model_dump()) for record in gold_records], connection=connection)
            bench_repo.save_build(bench_build, connection=connection)
            bench_repo.save_split_assignments(assignment_records, connection=connection)
            publication.publish()

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
        gold_jsonl=os.path.join(output_dir, os.path.basename(gold_jsonl_path)),
        split_json=os.path.join(output_dir, os.path.basename(split_json_path)),
        train_jsonl=os.path.join(output_dir, os.path.basename(train_jsonl_path)),
        val_jsonl=os.path.join(output_dir, os.path.basename(val_jsonl_path)),
        test_jsonl=os.path.join(output_dir, os.path.basename(test_jsonl_path)),
        conflicts_json=os.path.join(output_dir, os.path.basename(conflicts_json_path)),
        leakage_json=os.path.join(output_dir, os.path.basename(leakage_json_path)),
        leakage_md=os.path.join(output_dir, os.path.basename(leakage_md_path)),
        benchmark_report_md=os.path.join(output_dir, os.path.basename(report_md_path)),
    )
