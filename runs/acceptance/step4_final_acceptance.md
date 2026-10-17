# Step 4 Final Acceptance Report
# Benchmark Gold Builder + Group Split Builder + Leakage Gate

> **Acceptance Date**: 2026-10-17  
> **Status**: **ACCEPTED & CLOSED**  
> **Task Tested**: `kuangjiao_inspection_01`  
> **Formal Build ID**: `kuangjiao_inspection_01_20261017_001`  
> **Total Test Suite**: 66 / 66 passing (100%)

---

## 1. Acceptance Criteria Verification Matrix

| AC ID | Acceptance Criteria | Verified Status | Verification Evidence / Details |
|---|---|:---:|---|
| **AC-S401** | Gold 不修改原 Samples / Review | **PASS** | `samples.quality_status` in `data/benchmark.db` strictly untouched (5 PASS, 4 FAIL, 5,065 UNCERTAIN). All Gold ground truth stored isolated in `gold_records`. |
| **AC-S402** | 每个 Gold 有 provenance | **PASS** | Every entry in `gold_records` and `gold.jsonl` contains rich provenance (`policy_name`, `source_type`, `reviewer`, `reason_code`, `session_id`, `timestamps`). |
| **AC-S403** | UNCERTAIN / CONFLICT 默认不进入 Test Gold | **PASS** | 4,960 unreviewed uncertain samples marked `EXCLUDED`. Test set strictly includes verified Gold samples only (`gold_status == 'CONFIRMED'`). |
| **AC-S404** | HARD_NORMAL 二分类为 NORMAL，同时保留 hard_normal flag | **PASS** | `binary_label = 'NORMAL'`, `hard_normal = true`. Verified across unit tests and Kuangjiao export (3 HARD_NORMAL samples in Gold). |
| **AC-S405** | Split 以 Group 为单位 | **PASS** | Union-Find constructed atomic `SplitGroup`s merging physical sample IDs, capture sequence IDs, and verified duplicate relations. No split group is broken. |
| **AC-S406** | Verified Duplicate Component 不跨 Split | **PASS** | Leakage gate verified 0 duplicate leakage across 1,877 direct verified pairs and 460 verified components. |
| **AC-S407** | Physical Sample 不跨 Split | **PASS** | Leakage gate verified 0 physical sample leakage. All samples sharing `physical_sample_id` belong to identical split. |
| **AC-S408** | Leakage Gate 失败时 Build NOT_READY | **PASS** | Unit tests confirm that physical, duplicate, capture, or augmented violations block build readiness and mark `NOT_READY`. |
| **AC-S409** | 相同 seed 重跑 Split 一致 | **PASS** | Deterministic sorting of group IDs prior to seeded shuffle ensures 100% reproducible split assignments. Tested in `test_split_deterministic`. |
| **AC-S410** | LEGACY_TRAIN / TEST 不直接作为正式 Split | **PASS** | Legacy tags preserved solely as `data_origin`. Stratified group split partitions samples independently based on policy ratios (60% Train, 20% Val, 20% Test). |
| **AC-S411** | 生成完整 Benchmark Export | **PASS** | All 9 benchmark assets generated under `runs/benchmark/kuangjiao_inspection_01_20261017_001/` (`gold.jsonl`, `split.json`, `train.jsonl`, `val.jsonl`, `test.jsonl`, `leakage_report.json`, `leakage_report.md`, `benchmark_report.md`, `conflicts.json`). |
| **AC-S412** | 真实框胶数据成功跑通 | **PASS** | Real execution on `kuangjiao_inspection_01` completed in 0.94s, producing 114 confirmed Gold samples (68 Train / 23 Val / 23 Test) with 0 leakage. |

---

## 2. Kuangjiao Real Benchmark Build Summary

- **Build ID**: `kuangjiao_inspection_01_20261017_001`
- **Build Status**: `PARTIAL` *(Expected: Normal sample count = 8 vs target threshold = 50. Reflects true ground truth state without artificial data inflation)*
- **Gold Composition**:
  - Total Raw: 5,074
  - Confirmed Gold: 114 (5 PASS + 3 HARD_NORMAL + 106 FAIL)
  - Conflicts: 0
  - Excluded (Uncertain): 4,960
- **Split Distribution**:
  - Train: 68 samples (3 PASS, 1 HARD_NORMAL, 64 FAIL)
  - Val: 23 samples (1 PASS, 1 HARD_NORMAL, 21 FAIL)
  - Test: 23 samples (1 PASS, 1 HARD_NORMAL, 21 FAIL)
- **Leakage Gate**:
  - Physical Leakage: 0
  - Capture Sequence Leakage: 0
  - Duplicate Pair Leakage: 0
  - Component Leakage: 0
  - Augmented Test Leakage: 0
- **Track Readiness**:
  - **Standard AD**: `PARTIAL` (8 Normal, 106 Fail)
  - **Open / Hard Normal**: `READY` (1 verified HARD_NORMAL in Test split)
  - **Domain Shift**: `READY` (61 distinct domains present)
  - **Small / Weak Localization**: `NOT_READY` (No usable test bboxes)
  - **Global / Logical**: `NOT_READY` (Not defined)

---

## 3. Conclusion & Next Step
- **Step 4**: **CLOSED**
- Ready to proceed to **Step 5: Unified Evaluator + Baselines**.
