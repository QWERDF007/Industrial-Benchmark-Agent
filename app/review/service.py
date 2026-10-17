import os
import json
import logging
from typing import Optional, List, Dict, Any, Set
from app.storage.database import Database
from app.candidates.schemas import CandidateRecord, CandidateSignals
from app.evidence.schemas import EvidencePackage
from app.evidence.builder import EvidenceBuilder
from app.review.schemas import (
    ReviewDecisionType,
    ReasonCode,
    ReviewDecisionRecord,
    QueueStats,
)
from app.review.repository import ReviewDecisionRepository

logger = logging.getLogger("iad_benchmark.review.service")


class ReviewQueueService:
    """
    Service managing candidate review queues, evidence generation,
    navigation (next, previous), decision persistence, and queue statistics.
    """

    def __init__(
        self,
        task_id: str,
        db: Optional[Database] = None,
        db_path: str = "data/benchmark.db",
        candidates_json_path: Optional[str] = None,
    ):
        self.task_id = task_id
        self.db = db or Database(db_path)
        self.repo = ReviewDecisionRepository(self.db)
        self.candidates_json_path = candidates_json_path or os.path.join(
            "runs", "candidate_mining", task_id, "candidates.json"
        )
        self.evidence_builder = EvidenceBuilder(
            task_id=task_id,
            db=self.db,
            candidates_json_path=self.candidates_json_path,
        )

        self._candidates: List[CandidateRecord] = []
        self._load_candidates()

    def _load_candidates(self):
        """Load candidates from candidate mining output or fallback to DB."""
        if os.path.exists(self.candidates_json_path):
            try:
                with open(self.candidates_json_path, "r", encoding="utf-8") as f:
                    raw_cands = json.load(f)
                self._candidates = [CandidateRecord(**c) for c in raw_cands]
                logger.info(f"Loaded {len(self._candidates)} candidates from {self.candidates_json_path}")
                return
            except Exception as e:
                logger.warning(f"Failed to read candidates from {self.candidates_json_path}: {e}")

        # Fallback: Query UNCERTAIN samples from database
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
            )
            for idx, r in enumerate(rows)
        ]
        logger.info(f"Loaded {len(self._candidates)} candidate samples from database fallback")

    @property
    def candidates(self) -> List[CandidateRecord]:
        return self._candidates

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
        """
        Retrieve evidence package for the next unreviewed candidate.
        """
        reviewed_ids = self.repo.get_reviewed_sample_ids(self.task_id, reviewer=reviewer)

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
        """
        Navigate to previous candidate relative to current sample.
        """
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
        duration_ms: int = 0,
        evidence_version: str = "v1",
    ) -> ReviewDecisionRecord:
        """
        Save review decision in review_decisions table.
        Does NOT modify samples.quality_status.
        """
        rec = ReviewDecisionRecord(
            sample_id=sample_id,
            decision=decision.value if isinstance(decision, ReviewDecisionType) else str(decision),
            reviewer=reviewer,
            reason_code=reason_code.value if isinstance(reason_code, ReasonCode) else (str(reason_code) if reason_code else None),
            comment=comment,
            evidence_version=evidence_version,
            review_duration_ms=duration_ms,
        )
        self.repo.upsert(rec)
        return rec

    def skip_sample(
        self,
        sample_id: str,
        reason: Optional[str] = None,
        reviewer: str = "default",
        duration_ms: int = 0,
    ) -> ReviewDecisionRecord:
        """
        Mark a sample as SKIP.
        """
        return self.save_decision(
            sample_id=sample_id,
            decision=ReviewDecisionType.SKIP,
            reason_code=ReasonCode.DATA_ISSUE if not reason else None,
            comment=reason or "Skipped by reviewer",
            reviewer=reviewer,
            duration_ms=duration_ms,
        )

    def get_stats(self, reviewer: Optional[str] = None) -> QueueStats:
        """
        Calculate review queue progress, yield, and timing stats.
        """
        counts = self.repo.count_by_decision(self.task_id, reviewer=reviewer)
        reviewed_total = sum(counts.values())
        skipped_count = counts.get("SKIP", 0)
        hard_normal_count = counts.get("HARD_NORMAL", 0)
        fail_count = counts.get("FAIL", 0)

        total_cands = len(self._candidates)
        pending_count = max(0, total_cands - reviewed_total)

        yield_rate = 0.0
        if reviewed_total > 0:
            yield_rate = round((hard_normal_count + fail_count) / reviewed_total, 4)

        # Average duration
        all_records = self.repo.list_by_task(self.task_id, reviewer=reviewer)
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
