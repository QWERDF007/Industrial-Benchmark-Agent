# 22 原生工具穿透测试报告 (Tool Contract Verification Report)

依据 `V2-S01` 与 `AC-V2-01`，对所有 22 个工具进行三类 HTTP 边界穿透测试。

| 序号 | 工具名称 | 最小必需输入测试 | 全可选输入测试 | 未知/错参 (422) | 缺必填参数 (422) | 最终状态 |
|---|---|---|---|---|---|---|
| 1 | `dataset_audit` | 200 (NOT_READY) | 200 (NOT_READY) | 422 | 422 | **PASS** |
| 2 | `audit_issue_query` | 200 (OK) | 200 (OK) | 422 | 422 | **PASS** |
| 3 | `audit_recheck` | 200 (OK) | 200 (OK) | 422 | 422 | **PASS** |
| 4 | `audit_suggestion_save` | 200 (OK) | 200 (OK) | 422 | 422 | **PASS** |
| 5 | `sample_view` | 200 (OK) | 200 (OK) | 422 | 422 | **PASS** |
| 6 | `region_view` | 200 (OK) | 200 (OK) | 422 | 422 | **PASS** |
| 7 | `samples_compare` | 200 (OK) | 200 (OK) | 422 | 422 | **PASS** |
| 8 | `task_inspect` | 200 (OK) | 200 (OK) | 422 | 422 | **PASS** |
| 9 | `feature_prepare` | 200 (OK) | 200 (OK) | 422 | 422 | **PASS** |
| 10 | `visual_search` | 200 (ERROR) | 200 (ERROR) | 422 | 422 | **PASS** |
| 11 | `duplicate_audit` | 200 (NOT_READY) | 200 (NOT_READY) | 422 | 422 | **PASS** |
| 12 | `candidate_mine` | 200 (OK) | 200 (OK) | 422 | 422 | **PASS** |
| 13 | `candidate_merge` | 200 (REVIEW_REQUIRED) | 200 (REVIEW_REQUIRED) | 422 | 422 | **PASS** |
| 14 | `evidence_get` | 200 (ERROR) | 200 (ERROR) | 422 | 422 | **PASS** |
| 15 | `review_status` | 200 (OK) | 200 (OK) | 422 | 422 | **PASS** |
| 16 | `benchmark_preview` | 200 (OK) | 200 (ERROR) | 422 | 422 | **PASS** |
| 17 | `benchmark_build` | 200 (OK) | 200 (ERROR) | 422 | 422 | **PASS** |
| 18 | `benchmark_status` | 200 (PARTIAL) | 200 (PARTIAL) | 422 | 422 | **PASS** |
| 19 | `leakage_check` | 200 (NOT_READY) | 200 (NOT_READY) | 422 | 422 | **PASS** |
| 20 | `evaluation_plan` | 200 (OK) | 200 (OK) | 422 | 422 | **PASS** |
| 21 | `baseline_run` | 200 (ERROR) | 200 (ERROR) | 422 | 422 | **PASS** |
| 22 | `evaluation_compare` | 200 (NOT_READY) | 200 (NOT_READY) | 422 | 422 | **PASS** |

## 结论
全部 22 个工具 100% 通过 HTTP 422 参数校验与业务状态反射，无非预期 500 异常。
