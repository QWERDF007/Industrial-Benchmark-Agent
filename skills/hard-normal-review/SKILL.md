---
name: hard-normal-review
description: Mines high-difficulty normal candidates, audits duplicates, and prepares the human review queue.
---

# Hard Normal Review Skill

## 1. Trigger Conditions
Use this skill when:
- Normal sample count in raw quality is insufficient or unconfirmed.
- Mining diverse and challenging normal samples from the uncertain pool.
- Auditing near-duplicate image pairs and connected components.

## 2. Tool Invocation Sequence
1. `duplicate_audit`: Run DINO candidate search + Pixel PairVerifier V2 to cluster verified duplicate pairs and components.
2. `candidate_mine`: Compute multi-signal candidate scores (normal distance, density outlier, domain novelty, annotation signals) and apply greedy diversity suppression.
3. `evidence_get`: Retrieve complete Evidence Packages for high-scoring candidates for operator review.
4. `review_status`: Check human review progress and queue status.

## 3. Strict Invariant Rules
- **Human Review Only**: The Agent CANNOT author, guess, or write review decisions. Review writing is strictly restricted to human operator UI RPC.
- **Visual Difference != Defect**: High visual deviation or domain shift does not imply anomaly; hard normals naturally look different.
- **Review Gate Blocking**: When candidates are mined, return `REVIEW_REQUIRED` and pause agent workflow until human reviews are submitted.

## 4. Completion & Stop Conditions
- Duplicate clusters and components are exported to `runs/near_duplicate/<task_id>/`.
- Candidate queue is generated at `runs/candidate_mining/<task_id>/candidates.json`.
- Agent enters `REVIEW_REQUIRED` pause state awaiting human operator review in Harness Web UI.
