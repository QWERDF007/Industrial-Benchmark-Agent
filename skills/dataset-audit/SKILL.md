---
name: dataset-audit
description: Audits industrial inspection dataset integrity, annotations, and evaluates 5-track benchmark readiness.
---

# Dataset Audit Skill

## 1. Trigger Conditions
Use this skill when:
- The user asks to inspect, audit, or verify an industrial anomaly detection dataset.
- A new task or dataset is imported.
- Assessing whether data is ready for benchmark construction.

## 2. Tool Invocation Sequence
1. `task_inspect`: Check existing sample counts, quality status distribution (PASS, FAIL, UNCERTAIN), annotation counts, and feature cache coverage.
2. `dataset_audit`: Perform full dataset audit (sample integrity, bbox/geometry validation, track readiness for 5 benchmark tracks: Standard AD, Open/Hard Normal, Domain Shift, Small/Weak, Global/Logical).
3. `feature_prepare`: If feature coverage < 100%, trigger DINOv2 feature extraction and FAISS indexing.

## 3. Strict Invariant Rules
- **Annotation != Quality**: Bounding boxes or polygon annotations denote geometric regions of interest, NOT defect quality truth.
- **Never Modify Raw Quality**: Never overwrite `samples.quality_status` directly.
- **Fail-Fast on Missing Weights**: DINOv2 extraction requires verified weights.

## 4. Completion & Stop Conditions
- Dataset audit report is generated (`runs/audit/<task_id>/dataset_audit.md`).
- Track readiness is explicitly reported (READY, PARTIAL, or NOT_READY).
- Visual feature representations are 100% extracted and cached in SQLite & FAISS.
