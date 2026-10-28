import os
import json
import time
import logging
from typing import Optional

from iad_core.storage.database import Database
from iad_core.storage.models import GoldRecord as StorageGoldRecord
from iad_core.storage.repositories import GoldRepository
from iad_core.task.config import GoldPolicyConfig, load_config
from iad_core.gold.schemas import (
    GoldBuildResult,
    GoldStatus,
    BinaryLabel,
)
from iad_core.gold.projection import GoldProjection

logger = logging.getLogger("iad_core.gold.builder")


def build_gold(
    task_id: str,
    policy: Optional[GoldPolicyConfig] = None,
    config_path: Optional[str] = None,
    output_dir: Optional[str] = None,
    db_path: str = "data/benchmark.db",
    persist_to_db: bool = True,
) -> GoldBuildResult:
    """
    Build Gold ground truth benchmark records for a task.
    Reads samples, annotations, and review decisions from SQLite database.
    Applies resolution hierarchy without modifying raw samples.
    If persist_to_db is True, persists resolved records into gold_records table and exports gold.jsonl + conflicts.json.
    """
    start_time = time.time()
    db = Database(db_path)

    if policy is None:
        if config_path and os.path.exists(config_path):
            cfg = load_config(config_path)
            policy = cfg.gold
        else:
            policy = GoldPolicyConfig()

    policy_name = policy.policy_name

    gold_jsonl_path = None
    conflicts_json_path = None
    if persist_to_db:
        if output_dir is None:
            output_dir = os.path.join("runs", "benchmark", f"{task_id}_gold")
        os.makedirs(output_dir, exist_ok=True)
        gold_jsonl_path = os.path.join(output_dir, "gold.jsonl")
        conflicts_json_path = os.path.join(output_dir, "conflicts.json")

    gold_repo = GoldRepository(db)
    projection = GoldProjection.capture(db, task_id, policy)
    all_gold_records, conflict_records = projection.records, projection.conflicts

    if persist_to_db:
        storage_records = []
        for r in all_gold_records:
            storage_records.append(
                StorageGoldRecord(
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
                    phenomena=r.phenomena,
                    annotations=[a.model_dump() for a in r.annotations],
                    physical_sample_id=r.physical_sample_id,
                    capture_sequence_id=r.capture_sequence_id,
                    batch_id=r.batch_id,
                    data_origin=r.data_origin,
                    image_path=r.image_path,
                    relative_path=r.relative_path,
                )
            )
        gold_repo.upsert_batch(storage_records)

    confirmed_records = [
        r for r in all_gold_records
        if r.gold_status == GoldStatus.CONFIRMED.value
    ]

    if persist_to_db and gold_jsonl_path and conflicts_json_path:
        with open(gold_jsonl_path, "w", encoding="utf-8") as f:
            for r in confirmed_records:
                f.write(r.model_dump_json() + "\n")

        with open(conflicts_json_path, "w", encoding="utf-8") as f:
            json.dump(
                [c.model_dump() for c in conflict_records],
                f,
                indent=2,
                ensure_ascii=False,
            )

    normal_count = sum(1 for r in confirmed_records if r.binary_label == BinaryLabel.NORMAL.value and not r.hard_normal)
    hard_normal_count = sum(1 for r in confirmed_records if r.hard_normal)
    fail_count = sum(1 for r in confirmed_records if r.binary_label == BinaryLabel.ANOMALY.value)
    conflict_count = len(conflict_records)
    excluded_count = sum(1 for r in all_gold_records if r.gold_status == GoldStatus.EXCLUDED.value)

    elapsed = time.time() - start_time
    logger.info(
        f"Gold built for task {task_id}: {len(confirmed_records)} confirmed "
        f"({normal_count} normal, {hard_normal_count} hard_normal, {fail_count} fail), "
        f"{conflict_count} conflicts, {excluded_count} excluded in {elapsed:.2f}s"
    )

    return GoldBuildResult(
        task_id=task_id,
        policy_name=policy_name,
        total_samples=len(all_gold_records),
        gold_confirmed_count=len(confirmed_records),
        normal_count=normal_count,
        hard_normal_count=hard_normal_count,
        fail_count=fail_count,
        conflict_count=conflict_count,
        excluded_count=excluded_count,
        gold_jsonl_path=gold_jsonl_path,
        conflicts_json_path=conflicts_json_path,
        elapsed_seconds=elapsed,
        records=all_gold_records,
        conflicts=conflict_records,
    )

