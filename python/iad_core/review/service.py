import os
import json
import logging
from typing import Optional, List, Dict, Any, Set

from iad_core.storage.database import Database
from iad_core.storage.models import ReviewDecisionRecord
from iad_core.storage.repositories import ReviewRepository, SampleRepository
from iad_core.candidate.schemas import CandidateRecord, CandidateSignals
from iad_core.evidence.schemas import EvidencePackage
from iad_core.evidence.builder import EvidenceBuilder
from iad_core.review.schemas import (
    ReviewDecisionType,
    ReasonCode,
    QueueStats,
)

logger = logging.getLogger("iad_core.review.service")


class ReviewQueueService:
    """
    Service managing candidate review queues, evidence generation,
    navigation (next, previous), decision persistence, and queue statistics.
    Human Review only!
    """

    def __init__(
        self,
        task_id: str,
        db: Optional[Database] = None,
        db_path: str = "data/benchmark.db",
        candidates_json_path: Optional[str] = None,
        config_path: Optional[str] = None,
    ):
        self.task_id = task_id
        self.db = db or Database(db_path)
        self.repo = ReviewRepository(self.db)
        self.sample_repo = SampleRepository(self.db)
        self.config_path = config_path

        self.required_review_ids: Set[str] = set()
        if self.config_path and os.path.exists(self.config_path):
            try:
                from iad_core.task.config import load_config
                cfg = load_config(self.config_path)
                if hasattr(cfg, "review_policy") and hasattr(cfg.review_policy, "required_review_ids"):
                    self.required_review_ids = set(cfg.review_policy.required_review_ids)
            except Exception as e:
                logger.warning(f"Failed to load review policy from {self.config_path}: {e}")

        if candidates_json_path:
            self.candidates_json_path = candidates_json_path
            self._explicit_candidates_path = True
        else:
            merged_path = os.path.join("runs", "candidates", task_id, "merged_candidates.json")
            mining_path = os.path.join("runs", "candidate_mining", task_id, "candidates.json")
            if os.path.exists(merged_path):
                self.candidates_json_path = merged_path
            elif os.path.exists(mining_path):
                self.candidates_json_path = mining_path
            else:
                self.candidates_json_path = None
            self._explicit_candidates_path = False

        self.evidence_builder = EvidenceBuilder(
            task_id=task_id,
            db=self.db,
            candidates_json_path=self.candidates_json_path or "",
        )

        self._candidates: List[CandidateRecord] = []
        self._load_candidates()

    def _load_candidates(self):
        if self.candidates_json_path:
            if not os.path.exists(self.candidates_json_path):
                if self._explicit_candidates_path:
                    raise FileNotFoundError(f"Candidate file '{self.candidates_json_path}' not found")
            else:
                try:
                    with open(self.candidates_json_path, "r", encoding="utf-8") as f:
                        raw_data = json.load(f)
                except Exception as e:
                    logger.error(f"Failed to read candidates JSON from {self.candidates_json_path}: {e}")
                    raise ValueError(f"Corrupted or invalid candidates file at '{self.candidates_json_path}': {e}") from e

                raw_cands = None
                if isinstance(raw_data, dict):
                    raw_cands = raw_data.get("candidates")
                    if raw_cands is None:
                        raw_cands = raw_data.get("items")
                elif isinstance(raw_data, list):
                    raw_cands = raw_data

                if raw_cands is None:
                    raise ValueError(f"No 'candidates' or 'items' array found in '{self.candidates_json_path}'")

                cands: List[CandidateRecord] = []
                for idx, item in enumerate(raw_cands):
                    if isinstance(item, CandidateRecord):
                        cands.append(item)
                        continue
                    if not isinstance(item, dict):
                        continue

                    s_id = item.get("sample_id")
                    if not s_id:
                        continue

                    sample_obj = self.sample_repo.get(s_id)
                    data_origin = (
                        sample_obj.data_origin.value
                        if (sample_obj and hasattr(sample_obj.data_origin, "value"))
                        else (str(sample_obj.data_origin) if sample_obj and sample_obj.data_origin else item.get("data_origin", "REAL"))
                    )
                    quality_status = (
                        sample_obj.quality_status.value
                        if (sample_obj and hasattr(sample_obj.quality_status, "value"))
                        else (str(sample_obj.quality_status) if sample_obj and sample_obj.quality_status else item.get("quality_status", "UNCERTAIN"))
                    )
                    image_path = sample_obj.image_path if (sample_obj and sample_obj.image_path) else item.get("image_path", "")
                    relative_path = sample_obj.relative_path if (sample_obj and sample_obj.relative_path) else item.get("relative_path", "")
                    batch_id = sample_obj.batch_id if sample_obj else item.get("batch_id")
                    physical_sample_id = sample_obj.physical_sample_id if sample_obj else item.get("physical_sample_id")

                    sources = item.get("sources", [])
                    if not sources:
                        sources = ["DINO"]

                    score_val = (
                        item.get("candidate_score")
                        if item.get("candidate_score") is not None
                        else (item.get("dino_score") if item.get("dino_score") is not None else item.get("final_score", 0.5))
                    )
                    rank_val = item.get("rank") or (idx + 1)

                    raw_signals = item.get("signals")
                    if isinstance(raw_signals, dict):
                        signals = CandidateSignals(**raw_signals)
                    elif isinstance(raw_signals, CandidateSignals):
                        signals = raw_signals
                    else:
                        signals = CandidateSignals(
                            normal_distance=0.5,
                            density_outlier=0.5,
                            domain_novelty=0.5,
                            annotation_signal=0.0,
                        )

                    if item.get("is_required") is not None:
                        is_req = bool(item["is_required"])
                    elif s_id in self.required_review_ids:
                        is_req = True
                    else:
                        is_req = ("DINO" in sources)

                    cands.append(
                        CandidateRecord(
                            sample_id=s_id,
                            rank=rank_val,
                            candidate_score=float(score_val),
                            signals=signals,
                            data_origin=data_origin,
                            quality_status=quality_status,
                            batch_id=batch_id,
                            physical_sample_id=physical_sample_id,
                            image_path=image_path,
                            relative_path=relative_path,
                            is_required=is_req,
                            sources=sources,
                            priority_reason=item.get("priority_reason"),
                            source_scores=item.get("source_scores") or {
                                "dino": item.get("dino_score"),
                                "llm": item.get("llm_suggestions"),
                                "audit": item.get("audit_issues"),
                            },
                        )
                    )

                self._candidates = cands
                logger.info(f"Loaded {len(self._candidates)} candidates from {self.candidates_json_path}")
                return

        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT sample_id, image_path, relative_path, quality_status, data_origin, batch_id, physical_sample_id
                FROM samples WHERE task_id = ? AND quality_status = 'UNCERTAIN' AND data_origin != 'AUGMENTED'
                ORDER BY id ASC
                """,
                (self.task_id,),
            )
            rows = cursor.fetchall()

        self._candidates = [
            CandidateRecord(
                sample_id=r["sample_id"],
                rank=idx + 1,
                candidate_score=0.5,
                signals=CandidateSignals(
                    normal_distance=0.5,
                    density_outlier=0.5,
                    domain_novelty=0.5,
                    annotation_signal=0.0,
                ),
                data_origin=r["data_origin"],
                quality_status=r["quality_status"],
                batch_id=r["batch_id"],
                physical_sample_id=r["physical_sample_id"],
                image_path=r["image_path"],
                relative_path=r["relative_path"],
                is_required=(r["sample_id"] in self.required_review_ids),
                sources=["UNCERTAIN_POOL"],
                priority_reason="Unreviewed uncertain pool sample",
            )
            for idx, r in enumerate(rows)
        ]
        logger.info(f"Loaded {len(self._candidates)} candidate samples from database fallback (no candidate file)")


    @property
    def candidates(self) -> List[CandidateRecord]:
        return self._candidates

    @property
    def required_candidates(self) -> List[CandidateRecord]:
        return [c for c in self._candidates if getattr(c, "is_required", True)]

    @property
    def pending_required_count(self) -> int:
        decisions = self.repo.list_decisions_by_task(self.task_id)
        decided_ids = {d.sample_id for d in decisions}
        return sum(1 for c in self.required_candidates if c.sample_id not in decided_ids)

    @property
    def reviewed_count(self) -> int:
        return self.get_stats().reviewed_count

    @property
    def pending_count(self) -> int:
        return self.get_stats().pending_count

    def get_queue(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        decisions = self.repo.list_decisions(self.task_id)
        decision_map = {d.sample_id: d for d in decisions}

        items = []
        for c in self._candidates[offset:offset + limit]:
            d = decision_map.get(c.sample_id)
            sig = c.signals.model_dump() if hasattr(c.signals, "model_dump") else (c.signals if isinstance(c.signals, dict) else None)
            items.append({
                "sample_id": c.sample_id,
                "rank": c.rank,
                "candidate_score": c.candidate_score,
                "signals": sig,
                "data_origin": c.data_origin,
                "batch_id": c.batch_id,
                "image_path": c.image_path,
                "reviewed": d is not None,
                "current_decision": d.decision if d else None,
                "reason_code": d.reason_code if d else None,
                "sources": getattr(c, "sources", []) or ["DINO"],
                "priority_reason": getattr(c, "priority_reason", None) or f"Rank {c.rank} candidate",
                "source_scores": getattr(c, "source_scores", {}) or {},
                "is_required": getattr(c, "is_required", True),
            })
        return items

    def get_candidate(self, sample_id: str) -> Optional[CandidateRecord]:
        for c in self._candidates:
            if c.sample_id == sample_id:
                return c
        return None

    def get_evidence(self, sample_id: str) -> EvidencePackage:
        cand = self.get_candidate(sample_id)
        if cand:
            return self.evidence_builder.build_evidence(
                sample_id=sample_id,
                candidate_score=cand.candidate_score,
                signals=cand.signals,
            )
        return self.evidence_builder.build_evidence(sample_id=sample_id)

    def get_next_pending(
        self,
        reviewer: str = "default",
        filter_domain: Optional[str] = None,
        filter_origin: Optional[str] = None,
    ) -> Optional[EvidencePackage]:
        decisions = self.repo.list_decisions(self.task_id)
        reviewed_ids = {d.sample_id for d in decisions if d.reviewer == reviewer}

        for cand in self._candidates:
            if cand.sample_id in reviewed_ids:
                continue
            if filter_domain and cand.batch_id != filter_domain:
                continue
            if filter_origin and cand.data_origin != filter_origin:
                continue

            return self.get_evidence(cand.sample_id)

        return None

    def get_previous(
        self,
        current_sample_id: str,
    ) -> Optional[EvidencePackage]:
        current_idx = -1
        for idx, cand in enumerate(self._candidates):
            if cand.sample_id == current_sample_id:
                current_idx = idx
                break

        if current_idx > 0:
            prev_cand = self._candidates[current_idx - 1]
            return self.get_evidence(prev_cand.sample_id)
        return None

    def save_decision(
        self,
        sample_id: str,
        decision: ReviewDecisionType,
        reason_code: Optional[ReasonCode] = None,
        comment: Optional[str] = None,
        reviewer: str = "default",
        review_session_id: Optional[str] = None,
        started_at: Optional[str] = None,
        submitted_at: Optional[str] = None,
        duration_ms: int = 0,
        evidence_version: str = "v2",
    ) -> ReviewDecisionRecord:
        rec = ReviewDecisionRecord(
            sample_id=sample_id,
            decision=decision.value if isinstance(decision, ReviewDecisionType) else str(decision),
            reviewer=reviewer,
            reason_code=reason_code.value if isinstance(reason_code, ReasonCode) else (str(reason_code) if reason_code else None),
            comment=comment,
            evidence_version=evidence_version,
            review_session_id=review_session_id,
            started_at=started_at,
            submitted_at=submitted_at,
            review_duration_ms=duration_ms,
        )
        self.repo.append_decision(rec)
        return rec

    def skip_sample(
        self,
        sample_id: str,
        reason: Optional[str] = None,
        reviewer: str = "default",
        review_session_id: Optional[str] = None,
        started_at: Optional[str] = None,
        submitted_at: Optional[str] = None,
        duration_ms: int = 0,
    ) -> ReviewDecisionRecord:
        return self.save_decision(
            sample_id=sample_id,
            decision=ReviewDecisionType.SKIP,
            reason_code=ReasonCode.DATA_ISSUE if not reason else None,
            comment=reason or "Skipped by reviewer",
            reviewer=reviewer,
            review_session_id=review_session_id,
            started_at=started_at,
            submitted_at=submitted_at,
            duration_ms=duration_ms,
        )

    def get_stats(self, reviewer: Optional[str] = None) -> QueueStats:
        all_records = self.repo.list_decisions(self.task_id)
        if reviewer:
            all_records = [r for r in all_records if r.reviewer == reviewer]

        counts: Dict[str, int] = {}
        for r in all_records:
            counts[r.decision] = counts.get(r.decision, 0) + 1

        reviewed_total = len(all_records)
        skipped_count = counts.get("SKIP", 0)
        hard_normal_count = counts.get("HARD_NORMAL", 0)
        fail_count = counts.get("FAIL", 0)

        total_cands = len(self._candidates)
        pending_count = max(0, total_cands - reviewed_total)

        yield_rate = 0.0
        if reviewed_total > 0:
            yield_rate = round((hard_normal_count + fail_count) / reviewed_total, 4)

        durations = [r.review_duration_ms for r in all_records if r.review_duration_ms > 0]
        avg_ms = float(sum(durations) / len(durations)) if durations else 0.0

        return QueueStats(
            task_id=self.task_id,
            total_candidates=total_cands,
            reviewed_count=reviewed_total,
            pending_count=pending_count,
            skipped_count=skipped_count,
            decisions=counts,
            candidate_yield=yield_rate,
            avg_duration_ms=round(avg_ms, 1),
        )
