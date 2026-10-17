# Rebuildable vs Authoritative Asset Inventory

## Authoritative Assets (Must NEVER be deleted or mutated)
1. Raw Dataset Images and Sidecars: `data/ExportImage_*`
2. Human Review Decisions: `data/authoritative/review_decisions.jsonl`
3. Human Review Sessions: `data/authoritative/review_sessions.jsonl`
4. Metadata Semantics: `data/authoritative/metadata_semantics.yaml`
5. Verified Ground Truth Calibration: `runs/near_duplicate/calibration/pairs.json`

## Derived / Rebuildable Assets (Safe to regenerate)
1. SQLite Feature Records (`feature_records`)
2. FAISS Vector Index (`runs/features/.../index.faiss`)
3. Near-Duplicate Candidates and Components (`runs/near_duplicate/...`)
4. Candidate Mining Outputs (`runs/candidate_mining/...`)
5. Gold Records and Conflicts (`gold_records`, `gold.jsonl`, `conflicts.json`)
6. Group Split Assignments (`split_assignments`, `train.jsonl`, `val.jsonl`, `test.jsonl`)
7. Benchmark Build Records (`benchmark_builds`)
8. Evaluation Predictions and Reports (`runs/evaluation/...`)
