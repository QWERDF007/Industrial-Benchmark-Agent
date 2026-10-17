# Human Review Audit Report: kuangjiao_inspection_01

- Generated At: `2026-10-17 03:53:28 UTC`
- Task: `kuangjiao_inspection_01`
- Total Candidates: **500**
- Total Reviewed: **105**
- Pending: **395**
- Skipped: **0**
- Candidate Yield (HARD_NORMAL + FAIL / Reviewed): **100.00%**
- Average Review Duration: **1.80 s / sample**

## 1. Decision Distribution

| Decision | Count | Percentage | Description |
|---|---:|---:|---|
| `PASS` | 0 | 0.0% | Standard normal (良品) |
| `HARD_NORMAL` | 3 | 2.9% | Hard normal candidate verified as normal (高难良品) |
| `FAIL` | 102 | 97.1% | Defect confirmed (质量异常/缺陷) |
| `UNCERTAIN` | 0 | 0.0% | Insufficient evidence (存疑待定) |
| `SKIP` | 0 | 0.0% | Excluded / corrupted data (跳过) |

## 2. Reason Codes Breakdown

| Reason Code | Count | Percentage |
|---|---:|---:|
| `defect_confirmed` | 102 | 97.1% |
| `normal_color_shift` | 3 | 2.9% |

## 3. Verified Hard Normal Samples (Top Samples)

| Sample ID | Reason Code | Reviewer | Duration (ms) | Comment |
|---|---|---|---:|---|
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/picture_46_2026_09_08_11_48_24_426.png` | `normal_color_shift` | reviewer_1 | 1297 | Hard normal with illumination/color shift (norm_dist=0.531, domain_novelty=0.581) |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/picture_14_2026_09_08_10_24_54_613.png` | `normal_color_shift` | reviewer_1 | 1510 | Hard normal with illumination/color shift (norm_dist=0.478, domain_novelty=0.484) |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-10_09.25.16.695_(334)_1_-1_1_ch_333_13_1_.png` | `normal_color_shift` | reviewer_1 | 1369 | Hard normal with illumination/color shift (norm_dist=0.616, domain_novelty=0.762) |
