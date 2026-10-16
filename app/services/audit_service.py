import os
import json
import logging
from typing import Optional, Dict, Any
import sqlite3

from app.schemas.audit import DatasetAudit, TrackReadinessStatus
from app.schemas.config import DatasetConfig, load_config
from app.storage.database import Database

logger = logging.getLogger("iad_benchmark.audit")


def audit_dataset(
    task_id: str,
    db_path: str = "data/benchmark.db",
    config_path: Optional[str] = None,
    output_dir: Optional[str] = None,
    config: Optional[DatasetConfig] = None,
) -> DatasetAudit:
    """Audit the scanned dataset records in SQLite database and generate structured reports."""
    db = Database(db_path)

    # Optional config for readiness policy and metadata semantics
    if config is None and config_path and os.path.exists(config_path):
        try:
            config = load_config(config_path)
        except Exception as e:
            logger.warning(f"Could not load config from {config_path}: {e}")

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
        uncertain_ratio = (uncertain_count / total_samples) if total_samples > 0 else 0.0

        # Data Origin distribution (C06)
        cursor.execute(
            "SELECT data_origin, COUNT(*) FROM samples WHERE task_id = ? GROUP BY data_origin ORDER BY COUNT(*) DESC",
            (task_id,),
        )
        origin_dist = dict(cursor.fetchall())

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

        # Geometry breakdown (C04)
        cursor.execute(
            """
            SELECT COALESCE(a.geometry_status, 'VALID'), COUNT(*)
            FROM annotations a
            JOIN samples s ON a.sample_id = s.sample_id
            WHERE s.task_id = ? AND a.annotation_type = 'bbox'
            GROUP BY a.geometry_status
            """,
            (task_id,),
        )
        geom_counts = dict(cursor.fetchall())
        bbox_valid = geom_counts.get("VALID", 0)
        bbox_clipped = geom_counts.get("CLIPPED", 0)
        bbox_scaled = geom_counts.get("SCALED", 0)
        bbox_invalid = geom_counts.get("INVALID", 0)
        bbox_usable = bbox_valid + bbox_clipped + bbox_scaled

        geometry_stats = {
            "bbox_total": bbox_count,
            "bbox_valid": bbox_valid,
            "bbox_clipped": bbox_clipped,
            "bbox_scaled": bbox_scaled,
            "bbox_invalid": bbox_invalid,
            "bbox_usable": bbox_usable,
        }

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

    # 7. Track Readiness V2 Assessment (C05)
    # Standard AD:
    # PASS == 0 or FAIL == 0 -> NOT_READY
    # PASS > 0 and FAIL > 0:
    #   if policy configured and all criteria satisfied -> READY
    #   else -> PARTIAL
    std_policy = config.readiness_policy.standard_ad if (config and config.readiness_policy) else None
    if pass_count == 0 or fail_count == 0:
        std_ad_readiness = TrackReadinessStatus.NOT_READY.value
        std_ad_basis = f"Missing class: PASS={pass_count}, FAIL={fail_count}"
    else:
        if std_policy:
            policy_ok = True
            reasons = []
            if std_policy.min_pass is not None and pass_count < std_policy.min_pass:
                policy_ok = False
                reasons.append(f"pass {pass_count} < min_pass {std_policy.min_pass}")
            if std_policy.min_fail is not None and fail_count < std_policy.min_fail:
                policy_ok = False
                reasons.append(f"fail {fail_count} < min_fail {std_policy.min_fail}")
            if std_policy.max_uncertain_ratio is not None and uncertain_ratio > std_policy.max_uncertain_ratio:
                policy_ok = False
                reasons.append(f"uncertain {uncertain_ratio:.1%} > max {std_policy.max_uncertain_ratio:.1%}")

            if policy_ok:
                std_ad_readiness = TrackReadinessStatus.READY.value
                std_ad_basis = f"PASS={pass_count}, FAIL={fail_count} satisfies policy"
            else:
                std_ad_readiness = TrackReadinessStatus.PARTIAL.value
                std_ad_basis = f"Classes exist but unmet policy: {', '.join(reasons)}"
        else:
            std_ad_readiness = TrackReadinessStatus.PARTIAL.value
            std_ad_basis = f"PASS={pass_count}, FAIL={fail_count} present; no readiness policy configured (PARTIAL by default)"

    # Open Normal:
    open_normal_readiness = TrackReadinessStatus.NOT_EVALUATED.value
    open_normal_basis = "Hard Normal Mining not executed in Step 1"

    # Domain Shift:
    # Requires confirmed metadata semantics (C05/C07)
    semantics = config.metadata_semantics if config else {}
    batch_semantic = semantics.get("batch_id", "unknown")
    if batch_semantic != "unknown" and distinct_batches >= 2:
        domain_shift_readiness = TrackReadinessStatus.PARTIAL.value
        domain_shift_basis = f"Confirmed semantic '{batch_semantic}' with {distinct_batches} distinct batches"
    elif distinct_cameras >= 2 or distinct_stations >= 2:
        domain_shift_readiness = TrackReadinessStatus.PARTIAL.value
        domain_shift_basis = f"Multi-device domains: Camera={distinct_cameras}, Station={distinct_stations}"
    elif distinct_batches >= 2 and batch_semantic == "unknown":
        domain_shift_readiness = TrackReadinessStatus.NOT_EVALUATED.value
        domain_shift_basis = f"Distinct batches={distinct_batches} but metadata semantic unconfirmed"
    else:
        domain_shift_readiness = TrackReadinessStatus.NOT_EVALUATED.value
        domain_shift_basis = "Insufficient domain diversity"

    # Small / Weak:
    # Based on usable geometries (C04)
    if bbox_usable > 0 or mask_count > 0:
        small_weak_readiness = TrackReadinessStatus.PARTIAL.value
        small_weak_basis = f"Usable BBox={bbox_usable} (valid={bbox_valid}, clipped={bbox_clipped}, scaled={bbox_scaled})"
    else:
        small_weak_readiness = TrackReadinessStatus.NOT_EVALUATED.value
        small_weak_basis = "No usable local geometry annotations"

    # Global / Logical:
    global_logical_readiness = TrackReadinessStatus.NOT_EVALUATED.value
    global_logical_basis = "No logical/sequence anomaly labels"

    track_readiness = {
        "Standard AD": std_ad_readiness,
        "Open Normal": open_normal_readiness,
        "Domain Shift": domain_shift_readiness,
        "Small / Weak": small_weak_readiness,
        "Global / Logical": global_logical_readiness,
    }

    readiness_bases = {
        "Standard AD": std_ad_basis,
        "Open Normal": open_normal_basis,
        "Domain Shift": domain_shift_basis,
        "Small / Weak": small_weak_basis,
        "Global / Logical": global_logical_basis,
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
        geometry=geometry_stats,
        metadata=metadata_missing,
        issues=issues,
        track_readiness=track_readiness,
        resolution_distribution=resolution_dist,
        phenomenon_distribution=phenomenon_dist,
        data_origin_distribution=origin_dist,
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
    md_content = generate_markdown_report(
        audit, dict(task_row), distinct_batches, distinct_cameras, distinct_stations, readiness_bases
    )
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
    readiness_bases: Dict[str, str],
) -> str:
    s = audit.samples
    a = audit.annotations
    g = audit.geometry or {}
    m = audit.metadata
    tr = audit.track_readiness
    orig = audit.data_origin_distribution or {}

    lines = [
        f"# Dataset Audit Report: {audit.task_id}",
        "",
        "> 本报告由 Industrial AD Benchmark Agent (Step 1 Closeout Audit) 自动生成。",
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
        "| 类别 | 数量 | 占比 | 说明 |",
        "|---|---:|---:|---|",
        f"| **总样本数 (Total Samples)** | {s['total']} | 100.0% | 资产目录内有效图像全集 |",
        f"| PASS (良品) | {s['pass']} | {s['pass'] / max(1, s['total']):.1%} | 经显式规则确认为良品 |",
        f"| FAIL (缺陷/不良) | {s['fail']} | {s['fail'] / max(1, s['total']):.1%} | 经显式规则确认为不良 (如漏检案例) |",
        f"| UNCERTAIN (未定/无明确质检标签) | {s['uncertain']} | {s['uncertain'] / max(1, s['total']):.1%} | 缺少明确可信标签，依法依规保留 UNCERTAIN |",
        "",
        "### 2.1 数据来源谱系分布 (Data Origin Distribution)",
        "",
        "| 数据来源 (Data Origin) | 样本数量 | 占比 |",
        "|---|---:|---:|",
    ]

    for k, v in orig.items():
        lines.append(f"| `{k}` | {v:,} | {v / max(1, s['total']):.1%} |")

    lines.extend([
        "",
        "## 3. 标注与几何质量统计 (Annotations & Geometry)",
        "",
        "| 标注项 | 统计值 | 说明 |",
        "|---|---:|---|",
        f"| **总标注几何体数** | {a['total']} | 原始提取到的所有标注 |",
        f"| 边界框总数 (BBox Total) | {g.get('bbox_total', a['bbox'])} | 全部 BBox 标注数 |",
        f"| - 合法未修改 (BBox Valid) | {g.get('bbox_valid', 0)} | 坐标位于图像尺寸边界内 |",
        f"| - 安全截断修复 (BBox Clipped) | {g.get('bbox_clipped', 0)} | 依据 Policy 安全裁剪至有效范围 |",
        f"| - 比例缩放 (BBox Scaled) | {g.get('bbox_scaled', 0)} | 依据源图尺寸失配 Policy 缩放 |",
        f"| - 无效/不可用 (BBox Invalid) | {g.get('bbox_invalid', 0)} | 越界被 Policy 拒绝或坐标倒置，不参与评测 |",
        f"| **可用 BBox 数 (BBox Usable)** | **{g.get('bbox_usable', 0)}** | **Valid + Clipped + Scaled (真正可用于 Benchmark)** |",
        f"| 多边形 (Polygon) | {a['polygon']} | - |",
        f"| 掩膜 (Mask) | {a['mask']} | - |",
        f"| 图像级标注 (Image-level) | {a['image']} | - |",
        f"| 已标注样本数 (Annotated Samples) | {a['annotated_samples']} | 至少包含 1 个标注的图像样本 |",
        f"| 未标注样本数 (Unannotated Samples) | {a['unannotated_samples']} | 无任何标注的图像样本 |",
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
    ])

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
        "## 6. Benchmark Track 就绪性判定 (Track Readiness V2)",
        "",
        "| 评测赛道 (Track) | 就绪状态 | 判定依据 (Readiness Basis) |",
        "|---|:---:|---|",
    ])

    for track, status in tr.items():
        basis = readiness_bases.get(track, "")
        lines.append(f"| **{track}** | `{status}` | {basis} |")

    lines.extend([
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
        "### 7.2 分辨率分布 (Resolution Distribution TOP 15)",
        "",
    ])

    if audit.resolution_distribution:
        lines.extend([
            "| 分辨率 (WxH) | 样本数 |",
            "|---|---:|",
        ])
        items = list(audit.resolution_distribution.items())[:15]
        for res, count in items:
            lines.append(f"| `{res}` | {count} |")
    else:
        lines.append("暂无分辨率数据。")

    lines.extend([
        "",
        "---",
        "**说明**: 本报告依据 Step 1 Closeout Specs 设计规则生成。已关闭数据唯一性、几何质量状态及赛道就绪性边界。",
    ])

    return "\n".join(lines) + "\n"
