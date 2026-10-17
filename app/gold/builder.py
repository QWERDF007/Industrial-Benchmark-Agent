import os
import json
import time
import logging
import sqlite3
from typing import Optional, List, Dict, Any

from app.schemas.sample import Sample, QualityStatus, DataOrigin
from app.schemas.annotation import Annotation, GeometryStatus, AnnotationSource, AnnotationType
from app.schemas.config import GoldPolicyConfig, load_config
from app.review.schemas import ReviewDecisionRecord
from app.gold.schemas import (
    GoldRecord,
    GoldConflictRecord,
    GoldBuildResult,
    GoldStatus,
    GoldQuality,
    BinaryLabel,
)
from app.gold.resolver import resolve_gold_for_sample
from app.gold.annotation import filter_and_convert_gold_annotations

logger = logging.getLogger("iad_benchmark.gold.builder")


def build_gold(
    task_id: str,
    policy: Optional[GoldPolicyConfig] = None,
    config_path: Optional[str] = None,
    output_dir: Optional[str] = None,
    db_path: str = "data/benchmark.db",
) -> GoldBuildResult:
    """
    S406: Build Gold ground truth benchmark records for a task.
    Reads samples, annotations, and review decisions from SQLite database.
    Applies resolution hierarchy without modifying raw samples.
    Persists resolved records into gold_records table and exports gold.jsonl + conflicts.json.
    """
    start_time = time.time()

    # 1. Resolve policy
    if policy is None:
        if config_path and os.path.exists(config_path):
            cfg = load_config(config_path)
            policy = cfg.gold
        else:
            policy = GoldPolicyConfig()

    policy_name = policy.policy_name

    # 2. Determine output directory
    if output_dir is None:
        output_dir = os.path.join("runs", "benchmark", f"{task_id}_gold")
    os.makedirs(output_dir, exist_ok=True)

    gold_jsonl_path = os.path.join(output_dir, "gold.jsonl")
    conflicts_json_path = os.path.join(output_dir, "conflicts.json")

    # 3. Fetch data from SQLite
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Query samples
    cursor.execute("""
        SELECT sample_id, task_id, dataset_id, image_path, relative_path,
               quality_status, quality_source, data_origin,
               batch_id, physical_sample_id, capture_sequence_id,
               station, camera, width, height
        FROM samples
        WHERE task_id = ?
        ORDER BY sample_id ASC
    """, (task_id,))
    sample_rows = cursor.fetchall()
    samples = [
        Sample(
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
        for r in sample_rows
    ]

    # Query review decisions
    cursor.execute("""
        SELECT sample_id, decision, reviewer, reason_code, comment,
               evidence_version, review_session_id, started_at, submitted_at,
               review_duration_ms
        FROM review_decisions
    """)
    review_rows = cursor.fetchall()
    reviews_by_sample: Dict[str, List[ReviewDecisionRecord]] = {}
    for r in review_rows:
        rec = ReviewDecisionRecord(
            sample_id=r["sample_id"],
            decision=r["decision"],
            reviewer=r["reviewer"],
            reason_code=r["reason_code"],
            comment=r["comment"],
            evidence_version=r["evidence_version"] or "v2",
            review_session_id=r["review_session_id"],
            started_at=r["started_at"],
            submitted_at=r["submitted_at"],
            review_duration_ms=r["review_duration_ms"] or 0,
        )
        reviews_by_sample.setdefault(r["sample_id"], []).append(rec)

    # Query annotations
    cursor.execute("""
        SELECT a.annotation_id, a.sample_id, a.annotation_type, a.raw_label, a.phenomenon,
               a.bbox_json, a.polygon_json, a.mask_path, a.source, a.geometry_status
        FROM annotations a
        JOIN samples s ON a.sample_id = s.sample_id
        WHERE s.task_id = ?
    """, (task_id,))
    anno_rows = cursor.fetchall()
    annos_by_sample: Dict[str, List[Annotation]] = {}
    for r in anno_rows:
        bbox = json.loads(r["bbox_json"]) if r["bbox_json"] else None
        polygon = json.loads(r["polygon_json"]) if r["polygon_json"] else None
        anno = Annotation(
            annotation_id=r["annotation_id"],
            sample_id=r["sample_id"],
            annotation_type=AnnotationType(r["annotation_type"]),
            raw_label=r["raw_label"],
            phenomenon=r["phenomenon"],
            bbox=bbox,
            polygon=polygon,
            mask_path=r["mask_path"],
            source=AnnotationSource(r["source"]) if r["source"] else AnnotationSource.IMPORTED,
            geometry_status=GeometryStatus(r["geometry_status"]) if r["geometry_status"] else GeometryStatus.VALID,
        )
        annos_by_sample.setdefault(r["sample_id"], []).append(anno)

    # 4. Resolve gold for all samples
    all_gold_records: List[GoldRecord] = []
    conflict_records: List[GoldConflictRecord] = []

    for sample in samples:
        revs = reviews_by_sample.get(sample.sample_id, [])
        gold_rec, conflict = resolve_gold_for_sample(sample, revs, policy)

        # Attach valid annotations
        sample_annos = annos_by_sample.get(sample.sample_id, [])
        valid_gold_annos = filter_and_convert_gold_annotations(sample_annos)
        gold_rec.annotations = valid_gold_annos
        gold_rec.phenomena = sorted(list({
            a.phenomenon for a in valid_gold_annos if a.phenomenon
        } or {
            a.raw_label for a in valid_gold_annos if a.raw_label
        }))

        all_gold_records.append(gold_rec)
        if conflict:
            conflict_records.append(conflict)

    # 5. Persist into SQLite gold_records table
    cursor.execute("BEGIN TRANSACTION")
    for r in all_gold_records:
        cursor.execute("""
            INSERT INTO gold_records (
                sample_id, task_id, policy_name, gold_quality, binary_label,
                hard_normal, gold_source, gold_source_ref, gold_status,
                provenance_json, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(sample_id, policy_name) DO UPDATE SET
                gold_quality = excluded.gold_quality,
                binary_label = excluded.binary_label,
                hard_normal = excluded.hard_normal,
                gold_source = excluded.gold_source,
                gold_source_ref = excluded.gold_source_ref,
                gold_status = excluded.gold_status,
                provenance_json = excluded.provenance_json,
                updated_at = CURRENT_TIMESTAMP
        """, (
            r.sample_id,
            r.task_id,
            r.policy_name,
            r.gold_quality,
            r.binary_label,
            1 if r.hard_normal else 0,
            r.gold_source,
            r.gold_source_ref,
            r.gold_status,
            json.dumps(r.provenance, ensure_ascii=False),
        ))
    conn.commit()
    conn.close()

    # 6. Export gold.jsonl (Confirmed Gold records) and conflicts.json
    confirmed_records = [
        r for r in all_gold_records
        if r.gold_status == GoldStatus.CONFIRMED.value
    ]

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

    # 7. Compute statistics
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
        total_samples=len(samples),
        gold_confirmed_count=len(confirmed_records),
        normal_count=normal_count,
        hard_normal_count=hard_normal_count,
        fail_count=fail_count,
        conflict_count=conflict_count,
        excluded_count=excluded_count,
        gold_jsonl_path=gold_jsonl_path,
        conflicts_json_path=conflicts_json_path,
        elapsed_seconds=elapsed,
    )
