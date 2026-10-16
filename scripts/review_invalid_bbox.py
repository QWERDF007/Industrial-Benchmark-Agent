import os
import json
import logging
from collections import Counter
from PIL import Image

from app.schemas.config import load_config
from app.adapters.labelme import LabelmeAdapter
from app.adapters.base import RawImage

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("invalid_bbox_reviewer")


def review_invalid_bboxes(
    config_path: str = "configs/kuangjiao.yaml",
    output_dir: str = "runs/dataset_audit/kuangjiao_inspection_01",
):
    config = load_config(config_path)
    adapter = LabelmeAdapter(config)
    os.makedirs(output_dir, exist_ok=True)

    categorized = {
        "minor_out_of_bounds": [],
        "source_size_mismatch": [],
        "invalid_order": [],
        "fully_outside": [],
        "degenerate_after_clip": [],
        "severe_out_of_bounds": [],
        "unknown": [],
    }

    total_bboxes = 0
    invalid_records = []

    for raw_img in adapter.scan_images():
        label_file = adapter.find_label_file(raw_img)
        if not label_file or not os.path.exists(label_file):
            continue

        try:
            with Image.open(raw_img.image_path) as img:
                img_w, img_h = img.size
        except Exception:
            continue

        try:
            with open(label_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            continue

        source_w = data.get("imageWidth")
        source_h = data.get("imageHeight")
        if source_w is not None:
            source_w = int(source_w)
        if source_h is not None:
            source_h = int(source_h)

        shapes = data.get("shapes", [])
        for shape_idx, shape in enumerate(shapes):
            shape_type = shape.get("shape_type", "rectangle")
            if shape_type != "rectangle":
                continue

            points = shape.get("points", [])
            if len(points) < 2:
                continue

            total_bboxes += 1
            xs = [float(p[0]) for p in points]
            ys = [float(p[1]) for p in points]
            raw_bbox = [round(min(xs), 2), round(min(ys), 2), round(max(xs), 2), round(max(ys), 2)]
            xmin, ymin, xmax, ymax = raw_bbox

            # Check validity
            is_inverted = (xmin >= xmax or ymin >= ymax)
            is_out_of_bounds = (xmin < 0 or ymin < 0 or xmax > img_w or ymax > img_h)
            is_size_mismatch = (source_w is not None and source_h is not None and (source_w != img_w or source_h != img_h))

            if not (is_inverted or is_out_of_bounds or is_size_mismatch):
                continue

            # Classify root cause
            c_xmin = max(0.0, min(float(img_w), xmin))
            c_ymin = max(0.0, min(float(img_h), ymin))
            c_xmax = max(0.0, min(float(img_w), xmax))
            c_ymax = max(0.0, min(float(img_h), ymax))
            clipped_area = max(0.0, c_xmax - c_xmin) * max(0.0, c_ymax - c_ymin)

            # Measure maximum overflow in pixels
            overflow = max(
                max(0.0, -xmin),
                max(0.0, -ymin),
                max(0.0, xmax - img_w),
                max(0.0, ymax - img_h),
            )

            record = {
                "sample_path": raw_img.relative_path,
                "label_path": os.path.relpath(label_file, config.root),
                "label": str(shape.get("label", "")),
                "raw_bbox": raw_bbox,
                "image_size": [img_w, img_h],
                "source_size": [source_w, source_h],
                "overflow_pixels": round(overflow, 2),
                "clipped_bbox": [round(c_xmin, 2), round(c_ymin, 2), round(c_xmax, 2), round(c_ymax, 2)],
                "clipped_area": round(clipped_area, 2),
            }

            if is_size_mismatch:
                categorized["source_size_mismatch"].append(record)
                record["category"] = "source_size_mismatch"
            elif is_inverted:
                categorized["invalid_order"].append(record)
                record["category"] = "invalid_order"
            elif xmax <= 0 or ymax <= 0 or xmin >= img_w or ymin >= img_h:
                categorized["fully_outside"].append(record)
                record["category"] = "fully_outside"
            elif clipped_area <= 0:
                categorized["degenerate_after_clip"].append(record)
                record["category"] = "degenerate_after_clip"
            elif overflow <= 5.0:
                # Slight sub-pixel or border overshoot in GUI annotation tool
                categorized["minor_out_of_bounds"].append(record)
                record["category"] = "minor_out_of_bounds"
            else:
                categorized["severe_out_of_bounds"].append(record)
                record["category"] = "severe_out_of_bounds"

            invalid_records.append(record)

    logger.info(f"Analyzed {total_bboxes} bboxes. Found {len(invalid_records)} invalid/out-of-bound bboxes.")

    summary = {cat: len(items) for cat, items in categorized.items()}
    logger.info(f"Root cause distribution: {summary}")

    # Output JSON review
    json_path = os.path.join(output_dir, "invalid_bbox_review.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "total_bboxes": total_bboxes,
                "total_invalid": len(invalid_records),
                "summary": summary,
                "samples": invalid_records[:100],  # first 100 detailed samples
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    # Output Markdown review
    md_path = os.path.join(output_dir, "invalid_bbox_review.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(generate_review_markdown(total_bboxes, len(invalid_records), summary, categorized))

    logger.info(f"Saved review reports to {json_path} and {md_path}")
    return summary


def generate_review_markdown(total_bboxes, total_invalid, summary, categorized) -> str:
    lines = [
        "# Invalid BBox Root Cause Review & Analysis Report",
        "",
        f"> **任务**：`kuangjiao_inspection_01` (框胶数据集)",
        f"> **总标注 BBox 数**：{total_bboxes:,}",
        f"> **异常 / 越界 BBox 数**：{total_invalid:,} ({total_invalid / max(1, total_bboxes):.2%})",
        "",
        "## 1. 根因分类统计 (Root Cause Distribution)",
        "",
        "| 异常分类 (Category) | 数量 | 占比 | 典型原因说明 |",
        "|---|---:|---:|---|",
        f"| `minor_out_of_bounds` (轻微边界溢出 $\\le 5$ px) | {summary['minor_out_of_bounds']} | {summary['minor_out_of_bounds']/max(1, total_invalid):.1%} | 标注员在图形界面沿图片边缘框选时，微量超出边界（如 -1.08 或 width+0.5 px） |",
        f"| `severe_out_of_bounds` (严重越界 $> 5$ px) | {summary['severe_out_of_bounds']} | {summary['severe_out_of_bounds']/max(1, total_invalid):.1%} | 标注框超出图像边界较大距离 |",
        f"| `source_size_mismatch` (图像尺寸失配) | {summary['source_size_mismatch']} | {summary['source_size_mismatch']/max(1, total_invalid):.1%} | Labelme JSON 记录尺寸与实际图像尺寸不一致 |",
        f"| `invalid_order` (坐标倒置 xmin >= xmax) | {summary['invalid_order']} | {summary['invalid_order']/max(1, total_invalid):.1%} | 坐标序异常导致面积不可用 |",
        f"| `fully_outside` (完全在图像外部) | {summary['fully_outside']} | {summary['fully_outside']/max(1, total_invalid):.1%} | 标注完全脱离图像范围 |",
        f"| `degenerate_after_clip` (裁剪后退化退空) | {summary['degenerate_after_clip']} | {summary['degenerate_after_clip']/max(1, total_invalid):.1%} | 边界裁剪后面积退化为 0 |",
        "",
        "## 2. 抽样审查分析 (Representative Samples)",
        "",
    ]

    for cat, items in categorized.items():
        if not items:
            continue
        lines.extend([
            f"### 2.{len(lines)} {cat} (共 {len(items)} 条，展示前 5 个代表性样本)",
            "",
            "| 样本路径 | 原始 BBox | 图像尺寸 | 溢出像素 | 裁剪后 BBox |",
            "|---|---|---|---:|---|",
        ])
        for it in items[:5]:
            lines.append(
                f"| `{os.path.basename(it['sample_path'])}` | `{it['raw_bbox']}` | `{it['image_size'][0]}x{it['image_size'][1]}` | {it['overflow_pixels']} px | `{it['clipped_bbox']}` |"
            )
        lines.append("")

    lines.extend([
        "## 3. 最终工程处理策略与建议",
        "",
        "1. **轻微越界 (Minor Out of Bounds)**：占绝大部分。属于工业标注软件画框时的边缘吸附误差（例如负小数坐标 `-1.08`）。",
        "2. **处理策略 (BBox Policy)**：",
        "   - 当配置 `bbox_policy.out_of_bounds: clip` 时，将这些坐标安全截断在图像 `[0, 0, W, H]` 内部，并标记 `geometry_status = CLIPPED`，计入 `bbox_usable`，允许参与 Small / Weak Track 评测。",
        "   - 当配置 `bbox_policy.out_of_bounds: reject` 时，保留原始标注数据但标记 `geometry_status = INVALID`，排除在可用几何之外，避免误导下游指标。",
        "3. **尺寸失配 (Source Size Mismatch)**：",
        "   - 若发现缩放导致的分辨率失配，通过 `bbox_policy.source_size_mismatch: scale` 按源图比例重采样坐标，状态标记为 `SCALED`。",
        "",
    ])

    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    review_invalid_bboxes()
