# PairVerifier V2 Calibration Report

This document records the exact threshold calibration results for `PairVerifier V2` as specified in tickets C301/C302.

- **Calibration Set Location**: `runs/near_duplicate/calibration/pairs.json` (50 Same/Derived + 50 Different Physical Pairs)
- **Input Size**: `256 x 256`
- **Translation Search**: `±3 px` sub-pixel / integer shift
- **Calibrated Parameters**:
  - `pixel_cosine_threshold`: `0.990`
  - `ncc_threshold`: `0.980`
  - `max_mean_abs_diff`: `0.0060`
  - `max_high_diff_ratio`: `0.0015`
  - `diff_pixel_threshold`: `0.08` (gray diff > 20 on 0..255 scale)

See [calibration_notes.md](file:///data1/wt/Industrial-Benchmark-Agent/runs/near_duplicate/calibration/calibration_notes.md) for full distribution tables and rationale.
