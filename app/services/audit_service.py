import os
import json
import logging
from typing import Optional, Dict, Any
import sqlite3

from app.schemas.audit import DatasetAudit, TrackReadinessStatus
from app.storage.database import Database

logger = logging.getLogger("iad_benchmark.audit")


def audit_dataset(
    task_id: str,
    db_path: str = "data/benchmark.db",
    output_dir: Optional[str] = None,
) -> DatasetAudit:
    """Audit the scanned dataset records in SQLite database and generate structured reports."""
    db = Database(db_path)

    with db.connection() as conn:
        cursor = conn.cursor()

        # Check task exists
        cursor.execute("SELECT * FROM inspection_tasks WHERE task_id = ?", (task_id,))
        task_row = cursor.fetchone()
        if not task_row:
            raise ValueError(f"Task '{task_id}' not found in database {db_path}")

        # 1. Samples statistics
        cursor.execute("SELECT COUNT(*) FROM samples WHERE task_id = ?", (task_id,))
        total_samples = cursor.fetchone()[0]

        cursor.execute(
            "SELECT quality_status, COUNT(*) FROM samples WHERE task_id = ? GROUP BY quality_status",
            (task_id,),
        )
        quality_counts = dict(cursor.fetchall())
        pass_count = quality_counts.get("PASS", 0)
        fail_count = quality_counts.get("FAIL", 0)
        uncertain_count = quality_counts.get("UNCERTAIN", 0)

        # 2. Annotations statistics
        cursor.execute(
            """
            SELECT a.annotation_type, COUNT(*) 
            FROM annotations a
            JOIN samples s ON a.sample_id = s.sample_id
            WHERE s.task_id = ?
            GROUP BY a.annotation_type
            """,
            (task_id,),
        )
        ann_type_counts = dict(cursor.fetchall())
        bbox_count = ann_type_counts.get("bbox", 0)
        polygon_count = ann_type_counts.get("polygon", 0)
        mask_count = ann_type_counts.get("mask", 0)
        image_ann_count = ann_type_counts.get("image", 0)
        total_annotations = bbox_count + polygon_count + mask_count + image_ann_count

        cursor.execute(
            """
            SELECT COUNT(DISTINCT a.sample_id)
            FROM annotations a
            JOIN samples s ON a.sample_id = s.sample_id
            WHERE s.task_id = ?
            """,
            (task_id,),
        )
        annotated_samples = cursor.fetchone()[0]
        unannotated_samples = total_samples - annotated_samples

        # 3. Metadata missing rates
        def calc_missing(col_name: str) -> float:
            if total_samples == 0:
                return 0.0
            cursor.execute(
                f"SELECT COUNT(*) FROM samples WHERE task_id = ? AND ({col_name} IS NULL OR {col_name} = '')",
                (task_id,),
            )
            missing = cursor.fetchone()[0]
            return round(missing / total_samples, 4)

        metadata_missing = {
            "missing_batch_id": calc_missing("batch_id"),
            "missing_physical_sample_id": calc_missing("physical_sample_id"),
            "missing_capture_sequence_id": calc_missing("capture_sequence_id"),
            "missing_station": calc_missing("station"),
            "missing_camera": calc_missing("camera"),
        }

        # Unique domain values for Domain Shift evaluation
        cursor.execute(
            "SELECT COUNT(DISTINCT batch_id) FROM samples WHERE task_id = ? AND batch_id IS NOT NULL AND batch_id != ''",
            (task_id,),
        )
        distinct_batches = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(DISTINCT camera) FROM samples WHERE task_id = ? AND camera IS NOT NULL AND camera != ''",
            (task_id,),
        )
        distinct_cameras = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(DISTINCT station) FROM samples WHERE task_id = ? AND station IS NOT NULL AND station != ''",
            (task_id,),
        )
        distinct_stations = cursor.fetchone()[0]

        # 4. Import issues
        cursor.execute(
            "SELECT issue_type, COUNT(*) FROM import_issues WHERE task_id = ? GROUP BY issue_type",
            (task_id,),
        )
        issues = dict(cursor.fetchall())

        # 5. Resolution distribution
        cursor.execute(
            "SELECT width || 'x' || height, COUNT(*) FROM samples WHERE task_id = ? GROUP BY width, height ORDER BY COUNT(*) DESC",
            (task_id,),
        )
        resolution_dist = dict(cursor.fetchall())

        # 6. Phenomenon distribution
        cursor.execute(
            """
            SELECT COALESCE(a.phenomenon, 'unspecified'), COUNT(*)
            FROM annotations a
            JOIN samples s ON a.sample_id = s.sample_id
            WHERE s.task_id = ?
            GROUP BY a.phenomenon
            ORDER BY COUNT(*) DESC
            """,
            (task_id,),
        )
        phenomenon_dist = dict(cursor.fetchall())

    # 7. Track Readiness assessment
    # Standard AD
    if pass_count > 0 and fail_count > 0:
        std_ad_readiness = TrackReadinessStatus.READY.value
    else:
        std_ad_readiness = TrackReadinessStatus.NOT_READY.value

    # Open Normal: Step 1 does not do Hard Normal Mining
    open_normal_readiness = TrackReadinessStatus.NOT_EVALUATED.value

    # Domain Shift: batch_id, camera, or station >= 2
    if distinct_batches >= 2 or distinct_cameras >= 2 or distinct_stations >= 2:
        domain_shift_readiness = TrackReadinessStatus.PARTIAL.value
    else:
        domain_shift_readiness = TrackReadinessStatus.NOT_EVALUATED.value

    # Small / Weak: bbox or mask annotations present
    if bbox_count > 0 or mask_count > 0:
        small_weak_readiness = TrackReadinessStatus.PARTIAL.value
    else:
        small_weak_readiness = TrackReadinessStatus.NOT_EVALUATED.value

    # Global / Logical: Not evaluated in Step 1
    global_logical_readiness = TrackReadinessStatus.NOT_EVALUATED.value

    track_readiness = {
        "Standard AD": std_ad_readiness,
        "Open Normal": open_normal_readiness,
        "Domain Shift": domain_shift_readiness,
        "Small / Weak": small_weak_readiness,
        "Global / Logical": global_logical_readiness,
    }

    audit = DatasetAudit(
        task_id=task_id,
        samples={
            "total": total_samples,
            "pass": pass_count,
            "fail": fail_count,
            "uncertain": uncertain_count,
        },
        annotations={
            "total": total_annotations,
            "bbox": bbox_count,
            "polygon": polygon_count,
            "mask": mask_count,
            "image": image_ann_count,
            "annotated_samples": annotated_samples,
            "unannotated_samples": unannotated_samples,
        },
        metadata=metadata_missing,
        issues=issues,
        track_readiness=track_readiness,
        resolution_distribution=resolution_dist,
        phenomenon_distribution=phenomenon_dist,
    )

    # 8. Generate Reports
    if output_dir is None:
        output_dir = os.path.join("runs", "dataset_audit", task_id)

    os.makedirs(output_dir, exist_ok=True)
    json_path = os.path.join(output_dir, "audit_report.json")
    md_path = os.path.join(output_dir, "audit_report.md")

    # Write JSON report
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(audit.model_dump(), f, indent=2, ensure_ascii=False)

    # Write Markdown report
    md_content = generate_markdown_report(audit, dict(task_row), distinct_batches, distinct_cameras, distinct_stations)
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    logger.info(f"Generated audit report at {json_path} and {md_path}")
    return audit


def generate_markdown_report(
    audit: DatasetAudit,
    task_info: Dict[str, Any],
    distinct_batches: int,
    distinct_cameras: int,
    distinct_stations: int,
) -> str:
    s = audit.samples
    a = audit.annotations
    m = audit.metadata
    tr = audit.track_readiness

    lines = [
        f"# Dataset Audit Report: {audit.task_id}",
        "",
        "> 本报告由 Industrial AD Benchmark Agent (Step 1 Dataset Scanner) 自动生成。",
        "",
        "## 1. Inspection Task 基本信息",
        "",
        f"- **Task ID**: `{audit.task_id}`",
        f"- **Product**: `{task_info.get('product') or 'N/A'}`",
        f"- **Station**: `{task_info.get('station') or 'N/A'}`",
        f"- **Camera**: `{task_info.get('camera') or 'N/A'}`",
        f"- **Inspection Target**: `{task_info.get('inspection_target')}`",
        f"- **Description**: {task_info.get('description') or '无'}",
        "",
        "## 2. 数据规模与质量分布 (Samples)",
        "",
        "| 类别 | 数量 | 占比 |",
        "|---|---:|---:|",
        f"| **总样本数 (Total Samples)** | {s['total']} | 100.0% |",
        f"| PASS (良品) | {s['pass']} | {s['pass'] / max(1, s['total']):.1%} |",
        f"| FAIL (缺陷/不良) | {s['fail']} | {s['fail'] / max(1, s['total']):.1%} |",
        f"| UNCERTAIN (未定/无明确质检标签) | {s['uncertain']} | {s['uncertain'] / max(1, s['total']):.1%} |",
        "",
        "## 3. 标注完整度 (Annotations)",
        "",
        "| 标注项 | 统计值 |",
        "|---|---:|",
        f"| **总标注几何体数** | {a['total']} |",
        f"| 边界框 (BBox) | {a['bbox']} |",
        f"| 多边形 (Polygon) | {a['polygon']} |",
        f"| 掩膜 (Mask) | {a['mask']} |",
        f"| 图像级标注 (Image-level) | {a['image']} |",
        f"| 已标注样本数 (Annotated Samples) | {a['annotated_samples']} |",
        f"| 未标注样本数 (Unannotated Samples) | {a['unannotated_samples']} |",
        "",
        "## 4. 元数据完整率与缺失统计 (Metadata)",
        "",
        "| 字段 | 缺失率 | 唯一值数量 / 状态 |",
        "|---|---:|---|",
        f"| `batch_id` (生产批次) | {m.get('missing_batch_id', 0.0):.1%} | {distinct_batches} 批次 |",
        f"| `physical_sample_id` (物理工件 ID) | {m.get('missing_physical_sample_id', 0.0):.1%} | - |",
        f"| `capture_sequence_id` (拍摄序号/时间戳) | {m.get('missing_capture_sequence_id', 0.0):.1%} | - |",
        f"| `station` (工位) | {m.get('missing_station', 0.0):.1%} | {distinct_stations} 工位 |",
        f"| `camera` (相机) | {m.get('missing_camera', 0.0):.1%} | {distinct_cameras} 相机 |",
        "",
        "## 5. 数据导入与质量问题 (Import Issues)",
        "",
    ]

    if audit.issues:
        lines.extend([
            "| 问题类型 (Issue Type) | 发生频次 |",
            "|---|---:|",
        ])
        for k, v in sorted(audit.issues.items()):
            lines.append(f"| `{k}` | {v} |")
    else:
        lines.append("未发现导入异常，所有样本均合规解析。")

    lines.extend([
        "",
        "## 6. Benchmark Track 就绪性初判 (Track Readiness)",
        "",
        "| 评测赛道 (Track) | 就绪状态 | 判定依据 |",
        "|---|:---:|---|",
        f"| **Standard AD** | `{tr['Standard AD']}` | PASS ({s['pass']}) > 0 且 FAIL ({s['fail']}) > 0 |",
        f"| **Open Normal** | `{tr['Open Normal']}` | Step 1 未接入 Hard Normal 挖掘，不伪造结果 |",
        f"| **Domain Shift** | `{tr['Domain Shift']}` | 领域字段 (Batch: {distinct_batches}, Camera: {distinct_cameras}, Station: {distinct_stations}) |",
        f"| **Small / Weak** | `{tr['Small / Weak']}` | 已包含定位标注 (BBox: {a['bbox']}, Mask: {a['mask']}) |",
        f"| **Global / Logical** | `{tr['Global / Logical']}` | 无明确结构/时序/逻辑异常标签 |",
        "",
        "## 7. 现象与分辨率分布",
        "",
        "### 7.1 现象标签分布 (Phenomenon Distribution)",
        "",
    ])

    if audit.phenomenon_distribution:
        lines.extend([
            "| 现象 (Phenomenon) | 标注数量 |",
            "|---|---:|",
        ])
        for p, count in audit.phenomenon_distribution.items():
            lines.append(f"| `{p}` | {count} |")
    else:
        lines.append("暂无现象标签。")

    lines.extend([
        "",
        "### 7.2 分辨率分布 (Resolution Distribution)",
        "",
    ])

    if audit.resolution_distribution:
        lines.extend([
            "| 分辨率 (WxH) | 样本数 |",
            "|---|---:|",
        ])
        for res, count in audit.resolution_distribution.items():
            lines.append(f"| `{res}` | {count} |")
    else:
        lines.append("暂无分辨率数据。")

    lines.extend([
        "",
        "---",
        "**说明**: 本报告依据 Step 1 Specs 设计规则生成。如需进一步构建 Benchmark Split，请进入 Step 2 进行特征缓存与近重复挖掘。",
    ])

    return "\n".join(lines) + "\n"
