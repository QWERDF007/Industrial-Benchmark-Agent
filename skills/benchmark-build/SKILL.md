---
name: benchmark-build
description: Constructs formal benchmark gold, generates atomic group stratified splits, and enforces zero-leakage gate.
---

# Benchmark Build Skill

## 1. Trigger Conditions
Use this skill when:
- Human review decisions have been submitted and confirmed.
- User requests building train/val/test splits or formal benchmark assets.
- Checking data leakage on an existing or new benchmark build.

## 2. Tool Invocation Sequence
1. `review_status`: Verify that human review decisions exist and confirmed normals are present.
2. `benchmark_preview`: Preview Gold resolution and atomic group split counts without modifying database.
3. `benchmark_build`: Formally execute benchmark pipeline:
   - Adjudicate Gold records according to config-driven hierarchy.
   - Build Disjoint Set Union (DSU) atomic groups (physical sample, capture sequence, verified duplicates, components).
   - Perform group-safe stratified split (Train / Val / Test).
   - Enforce 5-point blocking Leakage Gate.
   - Evaluate track readiness.
   - Export 9 standardized benchmark artifacts.
4. `leakage_check`: Confirm 0 leakage tolerance across physical, capture, duplicate, component, and augmentation dimensions.
5. `benchmark_status`: Inspect build summary and split assignments.

## 3. Strict Invariant Rules
- **Explicit Config Required**: Formal build requires a valid Task Config YAML.
- **Gold-driven Splits**: Stratification is driven strictly by GoldRecord labels, never raw quality status.
- **Zero Leakage Tolerance**: Any leakage violation immediately marks build `NOT_READY` and halts downstream evaluation.
- **Augmented Blocking**: Samples with `data_origin = AUGMENTED` are strictly prohibited from entering the Test split.

## 4. Completion & Stop Conditions
- Build assets exported to `runs/benchmark/<build_id>/`.
- Leakage Gate passed with 0 violations.
- Split assignments persisted to SQLite `split_assignments` and `benchmark_builds`.
