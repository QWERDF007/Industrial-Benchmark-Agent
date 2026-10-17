import abc
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from iad_core.storage.models import Sample, ReviewDecisionRecord
from iad_core.task.config import GoldPolicyConfig
from iad_core.gold.schemas import GoldSource


class GoldEvidence(BaseModel):
    """
    Standardized evidence produced by a GoldSourceProvider (D001).
    """
    source_type: str
    quality: str  # "PASS", "FAIL", "HARD_NORMAL", "CONFLICT"
    source_ref: Optional[str] = None
    confidence: float = 1.0
    provenance: Dict[str, Any] = Field(default_factory=dict)


class GoldSourceProvider(abc.ABC):
    """
    Abstract Gold Source Provider (D001).
    Extracts ground truth evidence for a sample from a specific provenance source.
    """

    @abc.abstractmethod
    def get_evidence(
        self,
        sample: Sample,
        review_decisions: List[ReviewDecisionRecord],
        policy: GoldPolicyConfig,
    ) -> Optional[GoldEvidence]:
        """Return GoldEvidence if this source has a decision for the sample, else None."""
        pass


class HumanReviewSource(GoldSourceProvider):
    """
    Provider for Human Expert Review decisions (D002).
    """

    def get_evidence(
        self,
        sample: Sample,
        review_decisions: List[ReviewDecisionRecord],
        policy: GoldPolicyConfig,
    ) -> Optional[GoldEvidence]:
        trusted = [
            r for r in review_decisions
            if r.reviewer in policy.trusted_reviewers and r.decision in policy.include_decisions
        ]
        if not trusted:
            return None

        unique_decisions = {r.decision for r in trusted}
        if len(unique_decisions) > 1:
            conflict_info = {r.reviewer: r.decision for r in trusted}
            return GoldEvidence(
                source_type=GoldSource.HUMAN_REVIEW.value,
                quality="CONFLICT",
                source_ref="multiple_reviewers",
                confidence=0.0,
                provenance={
                    "conflict": True,
                    "conflicting_sources": conflict_info,
                    "reason": f"Multiple trusted reviewers disagree: {conflict_info}",
                },
            )

        rev = trusted[0]
        return GoldEvidence(
            source_type=GoldSource.HUMAN_REVIEW.value,
            quality=rev.decision,
            source_ref=rev.reviewer,
            confidence=1.0,
            provenance={
                "reviewer": rev.reviewer,
                "reason_code": rev.reason_code,
                "comment": rev.comment,
                "review_session_id": rev.review_session_id,
                "started_at": rev.started_at,
                "submitted_at": rev.submitted_at,
                "review_duration_ms": rev.review_duration_ms,
            },
        )


class ProductionQASource(GoldSourceProvider):
    """
    Provider for Production Line QA inspection records (D004).
    Returns None if production QA metadata is not present for the sample.
    """

    def get_evidence(
        self,
        sample: Sample,
        review_decisions: List[ReviewDecisionRecord],
        policy: GoldPolicyConfig,
    ) -> Optional[GoldEvidence]:
        # Production QA metadata hook; empty for datasets without factory QA
        return None


class ExistingQualitySource(GoldSourceProvider):
    """
    Provider for Existing Quality labels (folder/filename annotations) (D003).
    """

    def get_evidence(
        self,
        sample: Sample,
        review_decisions: List[ReviewDecisionRecord],
        policy: GoldPolicyConfig,
    ) -> Optional[GoldEvidence]:
        raw_status = (
            sample.quality_status.value
            if hasattr(sample.quality_status, "value")
            else str(sample.quality_status)
        )
        q_source = sample.quality_source or "imported"
        is_trusted = (
            not policy.trusted_quality_sources
            or q_source in policy.trusted_quality_sources
        )
        if is_trusted and raw_status in ("PASS", "FAIL"):
            return GoldEvidence(
                source_type=GoldSource.EXISTING_QUALITY.value,
                quality=raw_status,
                source_ref=q_source,
                confidence=0.8,
                provenance={
                    "quality_source": q_source,
                    "raw_quality_status": raw_status,
                },
            )
        return None
