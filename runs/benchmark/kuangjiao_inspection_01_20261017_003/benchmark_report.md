# Benchmark Build Report: `kuangjiao_inspection_01_20261017_003`

- **Task ID**: `kuangjiao_inspection_01`
- **Build ID**: `kuangjiao_inspection_01_20261017_003`
- **Leakage Gate**: ✅ PASSED
- **Standard AD Readiness**: `PARTIAL`

## 1. Gold Ground Truth Summary

| Metric | Count | Ratio (%) |
|---|:---:|:---:|
| Total Raw Samples | 5074 | 100.0% |
| Confirmed Gold Samples | 114 | 2.2% |
| ├── PASS (Normal) | 5 | 4.4% |
| ├── HARD_NORMAL | 3 | 2.6% |
| └── FAIL (Anomaly) | 106 | 93.0% |
| Conflict Samples | 0 | 0.0% |
| Excluded Samples (Uncertain) | 4960 | 97.8% |

### Data Origin Distribution (Confirmed Gold)

| Data Origin | Count |
|---|:---:|
| `LEGACY_TRAIN` | 97 |
| `LEGACY_TEST` | 13 |
| `MISSED_CASE` | 4 |

## 2. Benchmark Split Distribution

| Split | Samples | Normal | Hard Normal | Anomaly | Annotations |
|---|:---:|:---:|:---:|:---:|:---:|
| **Train** | 67 | 3 | 1 | 63 | 0 |
| **Val** | 23 | 1 | 1 | 21 | 0 |
| **Test** | 24 | 1 | 1 | 22 | 0 |
| **Total** | 114 | 5 | 3 | 106 | 0 |

## 3. Leakage Gate Verification

- **Status**: ✅ PASSED (0 cross-split leakage)
- **Physical Sample Leakage**: 0 violations
- **Capture Sequence Leakage**: 0 violations
- **Direct Verified Pair Leakage**: 0 violations
- **Verified Component Leakage**: 0 violations
- **Augmented Origin Policy**: 0 violations

## 4. Benchmark Track Readiness

| Track | Status | Basis / Reason |
|---|:---:|---|
| **Standard AD** | `PARTIAL` | Gold samples confirmed (8 normal, 106 fail), below target policy threshold (min_pass=50, min_fail=50) |
| **Open / Hard Normal** | `READY` | Test split contains 1 verified HARD_NORMAL samples |
| **Domain Shift** | `READY` | Confirmed semantic 'production_date' with 61 distinct domains present |
| **Small / Weak** | `NOT_READY` | No valid bbox or mask annotations in test anomaly set |
| **Global / Logical** | `NOT_READY` | Logical anomaly constraints not defined for this inspection task |
