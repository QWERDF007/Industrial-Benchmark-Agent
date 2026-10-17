import os
import time
import json
import logging
from typing import Optional, List, Dict, Any, Tuple
import numpy as np
from pydantic import BaseModel, Field

from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository, FeatureRepository
from iad_core.feature.base import FeatureExtractor
from iad_core.feature.dino import DINOFeatureExtractor

logger = logging.getLogger("iad_core.feature.builder")


class FeatureBuildResult(BaseModel):
    model_config = {"protected_namespaces": ()}
    task_id: str
    model_id: str
    preprocess_key: str
    total_samples: int
    cached_count: int
    computed_count: int
    failed_count: int
    coverage: float
    dim: int
    dtype: str
    storage_bytes: int
    elapsed_seconds: float
    throughput: float
    report_json_path: Optional[str] = None
    report_md_path: Optional[str] = None


def get_feature_stats(
    task_id: str,
    model_id: str = "dinov2_vitb14_reg",
    preprocess_key: str = "dinov2_224_norm",
    db_path: str = "data/benchmark.db",
) -> Dict[str, Any]:
    """Retrieve existing feature cache statistics for a task."""
    db = Database(db_path)
    sample_repo = SampleRepository(db)
    feat_repo = FeatureRepository(db)

    total_samples = sample_repo.count_by_task(task_id)
    cached_features = feat_repo.count_by_task(task_id, model_id, preprocess_key)
    coverage = (cached_features / total_samples) if total_samples > 0 else 0.0

    with db.connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT SUM(LENGTH(embedding_blob)), dim, dtype
            FROM feature_records f
            JOIN samples s ON f.sample_id = s.sample_id
            WHERE s.task_id = ? AND f.model_id = ? AND f.preprocess_key = ?
            GROUP BY dim, dtype
            """,
            (task_id, model_id, preprocess_key),
        )
        row = cursor.fetchone()
        storage_bytes = row[0] if row and row[0] else 0
        dim = row[1] if row else 0
        dtype = row[2] if row else "unknown"

    return {
        "task_id": task_id,
        "model_id": model_id,
        "preprocess_key": preprocess_key,
        "total_samples": total_samples,
        "cached_features": cached_features,
        "coverage": round(coverage, 4),
        "dim": dim,
        "dtype": dtype,
        "storage_bytes": storage_bytes,
    }


def build_features(
    task_id: str,
    model_id: str = "dinov2_vitb14_reg",
    preprocess_key: str = "dinov2_224_norm",
    db_path: str = "data/benchmark.db",
    batch_size: int = 64,
    device: str = "cuda:0",
    output_dir: Optional[str] = None,
    force_recompute: bool = False,
    weights_path: Optional[str] = None,
    extractor: Optional[FeatureExtractor] = None,
) -> FeatureBuildResult:
    """
    Build or update image feature embeddings in SQLite cache for a specific task.
    Implements cache reuse and invalidation based on file size and mtime_ns.
    """
    start_time = time.time()
    db = Database(db_path)
    sample_repo = SampleRepository(db)
    feat_repo = FeatureRepository(db)

    samples = sample_repo.list_by_task(task_id)
    total_samples = len(samples)
    if total_samples == 0:
        logger.warning(f"No samples found for task {task_id}")

    existing_records = {
        r["sample_id"]: r for r in feat_repo.list_by_task(task_id, model_id, preprocess_key)
    }

    cached_count = 0
    to_compute: List[Tuple[str, str, int, int]] = []
    failed_count = 0

    for sample in samples:
        img_path = sample.image_path
        if not os.path.exists(img_path):
            logger.warning(f"Image not found on disk: {img_path} (sample {sample.sample_id})")
            failed_count += 1
            continue

        try:
            stat = os.stat(img_path)
            cur_size = stat.st_size
            cur_mtime_ns = stat.st_mtime_ns
        except Exception as e:
            logger.warning(f"Could not stat image {img_path}: {e}")
            failed_count += 1
            continue

        existing = existing_records.get(sample.sample_id)
        if (
            existing is not None
            and not force_recompute
            and existing["source_file_size"] == cur_size
            and existing["source_mtime_ns"] == cur_mtime_ns
        ):
            cached_count += 1
        else:
            to_compute.append((sample.sample_id, img_path, cur_size, cur_mtime_ns))

    computed_count = 0

    if to_compute:
        if extractor is None:
            logger.info(
                f"Initializing DINOFeatureExtractor (model={model_id}, device={device}, dtype=fp16)..."
            )
            extractor = DINOFeatureExtractor(
                model_id=model_id,
                preprocess_key=preprocess_key,
                weights_path=weights_path,
                device=device,
                dtype="fp16",
            )

        logger.info(
            f"Computing features for {len(to_compute)} samples (cached: {cached_count}, batch_size: {batch_size})..."
        )

        num_batches = (len(to_compute) + batch_size - 1) // batch_size
        for b_idx in range(num_batches):
            batch_slice = to_compute[b_idx * batch_size : (b_idx + 1) * batch_size]
            batch_ids = [item[0] for item in batch_slice]
            batch_paths = [item[1] for item in batch_slice]
            batch_sizes = [item[2] for item in batch_slice]
            batch_mtimes = [item[3] for item in batch_slice]

            try:
                vectors = extractor.encode_batch(batch_paths)
            except Exception as e:
                logger.error(f"Error encoding batch {b_idx}: {e}")
                records_to_insert = []
                for s_id, p, sz, mt in zip(batch_ids, batch_paths, batch_sizes, batch_mtimes):
                    try:
                        single_vec = extractor.encode_batch([p])[0]
                        records_to_insert.append(
                            {
                                "sample_id": s_id,
                                "model_id": extractor.model_id,
                                "preprocess_key": extractor.preprocess_key,
                                "dim": extractor.dim,
                                "dtype": extractor.dtype_str,
                                "embedding_blob": single_vec.tobytes(),
                                "source_file_size": sz,
                                "source_mtime_ns": mt,
                            }
                        )
                        computed_count += 1
                    except Exception as err:
                        logger.error(f"Failed on single sample {s_id}: {err}")
                        failed_count += 1
                if records_to_insert:
                    feat_repo.upsert_batch(records_to_insert)
                continue

            records_to_insert = []
            for i, (s_id, sz, mt) in enumerate(zip(batch_ids, batch_sizes, batch_mtimes)):
                vec = vectors[i]
                records_to_insert.append(
                    {
                        "sample_id": s_id,
                        "model_id": extractor.model_id,
                        "preprocess_key": extractor.preprocess_key,
                        "dim": extractor.dim,
                        "dtype": extractor.dtype_str,
                        "embedding_blob": vec.tobytes(),
                        "source_file_size": sz,
                        "source_mtime_ns": mt,
                    }
                )
                computed_count += 1

            feat_repo.upsert_batch(records_to_insert)

            if (b_idx + 1) % 10 == 0 or (b_idx + 1) == num_batches:
                logger.info(
                    f"Progress: {min((b_idx + 1) * batch_size, len(to_compute))}/{len(to_compute)} computed."
                )

    elapsed = time.time() - start_time
    coverage = ((cached_count + computed_count) / total_samples) if total_samples > 0 else 0.0
    throughput = (computed_count / elapsed) if elapsed > 0 and computed_count > 0 else (
        (total_samples / elapsed) if elapsed > 0 else 0.0
    )

    stats = get_feature_stats(task_id, model_id, preprocess_key, db_path)
    storage_bytes = stats["storage_bytes"]
    feature_dim = extractor.dim if extractor else (stats["dim"] or 768)
    feature_dtype = extractor.dtype_str if extractor else (stats["dtype"] or "fp16")

    run_dir = output_dir or os.path.join("runs", "feature_audit", task_id)
    os.makedirs(run_dir, exist_ok=True)
    json_path = os.path.join(run_dir, "feature_report.json")
    md_path = os.path.join(run_dir, "feature_report.md")

    result_dict = {
        "task_id": task_id,
        "model_id": model_id,
        "preprocess_key": preprocess_key,
        "total_samples": total_samples,
        "cached_count": cached_count,
        "computed_count": computed_count,
        "failed_count": failed_count,
        "coverage": round(coverage, 4),
        "dim": feature_dim,
        "dtype": feature_dtype,
        "storage_bytes": storage_bytes,
        "elapsed_seconds": round(elapsed, 2),
        "throughput": round(throughput, 2),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result_dict, f, indent=2, ensure_ascii=False)
    latest_json_path = os.path.join(run_dir, "feature_report_latest.json")
    with open(latest_json_path, "w", encoding="utf-8") as f:
        json.dump(result_dict, f, indent=2, ensure_ascii=False)

    history_jsonl_path = os.path.join(run_dir, "feature_runs.jsonl")
    run_entry = {
        "timestamp": result_dict["timestamp"],
        "task_id": task_id,
        "model_id": model_id,
        "preprocess_key": preprocess_key,
        "total": total_samples,
        "computed": computed_count,
        "cached": cached_count,
        "failed": failed_count,
        "elapsed": round(elapsed, 2),
        "throughput": round(throughput, 2),
        "storage_bytes": storage_bytes,
    }
    with open(history_jsonl_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(run_entry, ensure_ascii=False) + "\n")

    md_content = f"""# Feature Foundation Report: {task_id}

> 本报告由 Industrial AD Benchmark Core v2 自动生成。

## 1. 基础配置 (Configuration)

- **Task ID**: `{task_id}`
- **Model ID**: `{model_id}`
- **Preprocess Key**: `{preprocess_key}`
- **Embedding Dimension**: `{feature_dim}`
- **Embedding Storage Dtype**: `{feature_dtype}`
- **Database**: `{db_path}`

## 2. 推理与缓存统计 (Inference & Cache)

| 统计项 | 统计值 | 说明 |
|---|---:|---|
| **总样本量 (Total Samples)** | {total_samples:,} | 任务内所有样本 |
| 缓存命中 (Cache Hits) | {cached_count:,} | 现有特征缓存有效且源文件未修改 |
| 新计算特征 (Computed) | {computed_count:,} | 本次新执行 GPU 推理的样本数 |
| 失败样本数 (Failed) | {failed_count:,} | 文件不存在或无法解码的样本数 |
| **特征覆盖率 (Coverage)** | **{coverage:.2%}** | (缓存 + 新计算) / 总样本 |

## 3. 性能与存储开销 (Performance & Storage)

| 指标 | 测量值 | 说明 |
|---|---:|---|
| 运行耗时 (Elapsed Time) | {elapsed:.2f} s | 批推理及数据库入库全流程耗时 |
| 吞吐速度 (Throughput) | {throughput:.1f} samples/s | 平均每秒处理样本数 |
| 存储占用 (Storage Bytes) | {storage_bytes / (1024 * 1024):.2f} MB ({storage_bytes:,} B) | SQLite `feature_records` BLOB 字节总大小 |

---
**说明**: Step 2 遵循幂等与无损设计。源文件未改变时二次运行 `computed == 0`，不修改质量标签、不删除文件。
"""
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    latest_md_path = os.path.join(run_dir, "feature_report_latest.md")
    with open(latest_md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    logger.info(
        f"Feature build finished. Total: {total_samples}, Cached: {cached_count}, Computed: {computed_count}, Failed: {failed_count}, Elapsed: {elapsed:.2f}s"
    )

    return FeatureBuildResult(
        task_id=task_id,
        model_id=model_id,
        preprocess_key=preprocess_key,
        total_samples=total_samples,
        cached_count=cached_count,
        computed_count=computed_count,
        failed_count=failed_count,
        coverage=coverage,
        dim=feature_dim,
        dtype=feature_dtype,
        storage_bytes=storage_bytes,
        elapsed_seconds=elapsed,
        throughput=throughput,
        report_json_path=json_path,
        report_md_path=md_path,
    )
