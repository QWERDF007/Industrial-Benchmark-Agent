---
name: acceptance-review
description: Conducts comprehensive end-to-end v1 acceptance review and compiles final verification report.
---

# Acceptance Review Skill

## 1. Trigger Conditions
Use this skill when:
- Compiling final acceptance evidence for v1 benchmark agent delivery.
- Validating end-to-end system consistency from dataset audit through baseline evaluation.
- Verifying authoritative state preservation and security invariants.

## 2. Tool Invocation Sequence
1. `task_inspect`: Verify sample counts, quality distributions, feature cache status, and DB records.
2. `dataset_audit`: Check dataset health and 5-track industrial readiness.
3. `review_status`: Verify authoritative human review decisions count, session tracking, and non-authoring invariant.
4. `benchmark_status` & `leakage_check`: Validate benchmark build status, split distribution, and 0-leakage verification.
5. `evaluation_compare`: Verify multi-baseline results, Val-only threshold fitting, and Hard Normal FPR.

## 3. Strict Invariant Rules
- **No Unsubstantiated Claims**: Report actual measured latencies, VRAM usage, metrics, and sample counts.
- **Stateless Deliverable**: Deliver final complete artifacts without temporary patch notes.
- **Report Known Limitations**: Document known boundaries (e.g. Kuangjiao normal sample scarcity yielding PARTIAL status).

## 4. Completion & Stop Conditions
- Comprehensive v1 acceptance report compiled.
- All 10 Definition-of-Done gates validated.
