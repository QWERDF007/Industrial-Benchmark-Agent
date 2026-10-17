# Human Review Audit Report: kuangjiao_inspection_01

- Generated At: `2026-10-17 02:02:59 UTC`
- Task: `kuangjiao_inspection_01`
- Total Candidates: **500**
- Total Reviewed: **150**
- Pending: **350**
- Skipped: **0**
- Candidate Yield (HARD_NORMAL + FAIL / Reviewed): **100.00%**
- Average Review Duration: **3.28 s / sample**

## 1. Decision Distribution

| Decision | Count | Percentage | Description |
|---|---:|---:|---|
| `PASS` | 0 | 0.0% | Standard normal (良品) |
| `HARD_NORMAL` | 99 | 66.0% | Hard normal candidate verified as normal (高难良品) |
| `FAIL` | 51 | 34.0% | Defect confirmed (质量异常/缺陷) |
| `UNCERTAIN` | 0 | 0.0% | Insufficient evidence (存疑待定) |
| `SKIP` | 0 | 0.0% | Excluded / corrupted data (跳过) |

## 2. Reason Codes Breakdown

| Reason Code | Count | Percentage |
|---|---:|---:|
| `normal_illumination` | 60 | 40.0% |
| `defect_confirmed` | 51 | 34.0% |
| `normal_color_shift` | 19 | 12.7% |
| `normal_contamination` | 10 | 6.7% |
| `normal_texture_variation` | 10 | 6.7% |

## 3. Verified Hard Normal Samples (Top Samples)

| Sample ID | Reason Code | Reviewer | Duration (ms) | Comment |
|---|---|---|---:|---|
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024_06_14_17_34_46_039362.png` | `normal_illumination` | expert_reviewer_1 | 4240 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-11-04_02.08.34.153_(1124)_1_-1_2_ch_1123_17_0_.png` | `normal_illumination` | expert_reviewer_1 | 3717 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0806104845172__vec_image_32382_15070_3106_TrackImg-219_2.png` | `normal_illumination` | expert_reviewer_1 | 2060 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0524104607691__vec_image_1865_1563_1864_ImageClipping-19_2.png` | `normal_illumination` | expert_reviewer_1 | 4242 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-07-28_16.19.41.209_(4250)_1_-1_2_ch_4249_1_3__1_.png` | `normal_illumination` | expert_reviewer_1 | 4587 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-08-13_01.14.34.556_2_(36460)_ch_36462_8287775316271527936_3.png` | `normal_color_shift` | expert_reviewer_1 | 2455 | Hard normal: batch-level cosmetic color shift, functionally acceptable |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023_07_18_15_47_28_884901.png` | `normal_illumination` | expert_reviewer_1 | 2426 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-10-15_21.05.17.985_2_(572)_ch_574_8431893327844819457_3.png` | `normal_illumination` | expert_reviewer_1 | 4370 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0524133717678__vec_image_7223_4085_7222_ImageClipping-152_1.png` | `normal_illumination` | expert_reviewer_1 | 2249 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-03-03_09.30.54.844_(1218)_1_-1_1_ch_1217_19_1_.png` | `normal_illumination` | expert_reviewer_1 | 3435 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-09-03_09.15.08.363_(1875)_1_-1_1_ch_1874_1_1_.png` | `normal_illumination` | expert_reviewer_1 | 3821 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-09-05_16.32.03.519_1_(6757)_ch_6759_6629309608455011841_0.png` | `normal_illumination` | expert_reviewer_1 | 3887 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-07-06_23.06.50.074_2_(9901)_ch_9903_6846621794827154433_3_copy_0_250912.png` | `normal_illumination` | expert_reviewer_1 | 2366 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-10-10_10.45.28.932_2_(695)_ch_696_7639259553202816513_0.png` | `normal_illumination` | expert_reviewer_1 | 2698 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0806104921080__vec_image_33036_15565_3187_TrackImg-219_0.png` | `normal_illumination` | expert_reviewer_1 | 1992 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-03-22_16.56.01.733_(6007)_1_-1_1_ch_6006_1_1_.png` | `normal_contamination` | expert_reviewer_1 | 2810 | Hard normal: surface spot/smear not affecting seal integrity |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023_09_28_10_10_09_037749.png` | `normal_illumination` | expert_reviewer_1 | 4190 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-10_09.42.42.402_(1648)_1_-1_1_ch_1647_18_3_.png` | `normal_illumination` | expert_reviewer_1 | 3554 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-15_15.06.29.795_(1267)_1_-1_1_ch_1266_1_3_.png` | `normal_color_shift` | expert_reviewer_1 | 4007 | Hard normal: batch-level cosmetic color shift, functionally acceptable |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-27_09.06.07.092_(72)_1_-1_1_ch_71_2_3_.png` | `normal_illumination` | expert_reviewer_1 | 4194 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-13_02.51.57.245_(7578)_1_-1_2_ch_7577_1_2_.png` | `normal_color_shift` | expert_reviewer_1 | 2371 | Hard normal: batch-level cosmetic color shift, functionally acceptable |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-10-16_15.47.13.650_2_(24057)_ch_24058_4683756381762544644_1.png` | `normal_illumination` | expert_reviewer_1 | 4433 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024_06_14_17_34_46_359037.png` | `normal_illumination` | expert_reviewer_1 | 4123 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-03-02_03.49.02.587_(20336)_1_-1_2_ch_20335_14_2_.png` | `normal_illumination` | expert_reviewer_1 | 2664 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-03-03_09.24.50.941_(775)_1_-1_1_ch_774_12_1_.png` | `normal_illumination` | expert_reviewer_1 | 4484 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-03-28_01.07.21.797_(2550)_1_-1_1_ch_2549_1_3_.png` | `normal_color_shift` | expert_reviewer_1 | 3088 | Hard normal: batch-level cosmetic color shift, functionally acceptable |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-11-08_00.50.12.433_(6976)_1_-1_2_ch_6975_14_2_.png` | `normal_illumination` | expert_reviewer_1 | 4740 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-11-13_15.54.18.082_(11209)_1_-1_1_ch_11208_14_3_.png` | `normal_illumination` | expert_reviewer_1 | 2385 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-11-19_09.26.10.878_(5093)_1_-1_2_ch_5092_14_0__copy_1_251018.png` | `normal_illumination` | expert_reviewer_1 | 3420 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-06-13_10.44.44.606_1_(8156)_ch_8158_4107869231189031937_1.png` | `normal_illumination` | expert_reviewer_1 | 2071 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-03-02_05.38.50.358_(28295)_1_-1_1_ch_28294_17_1_.png` | `normal_illumination` | expert_reviewer_1 | 3443 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-04-02_10.17.56.840_(2097)_1_-1_1_ch_2096_1_1_.png` | `normal_contamination` | expert_reviewer_1 | 3092 | Hard normal: surface spot/smear not affecting seal integrity |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-26_03.15.25.641_(12915)_1_-1_1_ch_12914_2_1_.png` | `normal_illumination` | expert_reviewer_1 | 2896 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0414112747178__vec_image_1789_4277_1788_ImageClipping-19_1.png` | `normal_illumination` | expert_reviewer_1 | 2029 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/lQDPJwafJWd2D8PNBKPNBrWwu6nfp1h9KaUFcyu6OiUaAA_1717_1187_2.png` | `normal_illumination` | expert_reviewer_1 | 4604 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.15.57.066_1_(18215)_ch_18217_6557818620784481281_1.png` | `normal_color_shift` | expert_reviewer_1 | 4618 | Hard normal: batch-level cosmetic color shift, functionally acceptable |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023_09_28_10_10_09_690666.png` | `normal_illumination` | expert_reviewer_1 | 2469 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-03-03_09.30.23.209_(1149)_1_-1_1_ch_1148_14_1__copy_0_250904.png` | `normal_illumination` | expert_reviewer_1 | 3693 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-26_05.20.09.049_(4426)_1_-1_2_ch_4425_14_2_.png` | `normal_illumination` | expert_reviewer_1 | 4081 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-31_03.19.24.405_(117)_1_-1_2_ch_116_16_2_.png` | `normal_illumination` | expert_reviewer_1 | 3354 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-06-29_12.49.45.589_(1105)_1_-1_2_ch_1104_1_2_.png` | `normal_color_shift` | expert_reviewer_1 | 2699 | Hard normal: batch-level cosmetic color shift, functionally acceptable |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-05_10.44.10.654_(1057)_1_-1_1_ch_1056_1_1_.png` | `normal_contamination` | expert_reviewer_1 | 2905 | Hard normal: surface spot/smear not affecting seal integrity |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/lQDPKGt0y1fyfUPNBJnNBhiwfsi33RbGsOsFcyu1OT3rAA_1560_1177_3.png` | `normal_illumination` | expert_reviewer_1 | 4421 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-10-16_15.47.13.650_2_(24057)_ch_24058_4683756381762544644_0.png` | `normal_illumination` | expert_reviewer_1 | 4454 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023_08_11_09_14_43_143973.png` | `normal_illumination` | expert_reviewer_1 | 2500 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-06-13_10.44.44.583_2_(8156)_ch_8158_4612835339407937025_0.png` | `normal_illumination` | expert_reviewer_1 | 4599 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-05-17_16.30.24.695_(10152)_1_-1_2_ch_10151_1_2_.png` | `normal_color_shift` | expert_reviewer_1 | 3987 | Hard normal: batch-level cosmetic color shift, functionally acceptable |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-06-04_08.58.49.160_(16501)_1_-1_1_ch_16500_14_1_.png` | `normal_illumination` | expert_reviewer_1 | 2893 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-11-08_00.50.12.413_(6976)_1_-1_1_ch_6975_14_3__copy_0_251018.png` | `normal_illumination` | expert_reviewer_1 | 2092 | Hard normal: illumination fluctuation between batches |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0512154429261__vec_image_998_3744_997_ImageClipping-152_3.png` | `normal_illumination` | expert_reviewer_1 | 4786 | Hard normal: illumination fluctuation between batches |
