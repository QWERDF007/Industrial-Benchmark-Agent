from collections.abc import Iterable

from iad_core.knowledge.models import KnowledgeCheck, KnowledgeCheckSummary, KnowledgeEvidence


class KnowledgeDisplayEvidence:
    """Project model view citations onto their frozen whole-image sources."""

    def __init__(self, evidence: list[KnowledgeEvidence]):
        self.by_id = {item.image.evidence_id: item for item in evidence}
        self.overviews = {(item.sample_id, item.image.source_sha256): item for item in evidence
            if item.image.representation == 'raw' and item.image.role != 'roi'
            and item.image.crop_bbox == [0, 0, *item.image.original_size]}

    def images(self, evidence_ids: Iterable[str]) -> list[KnowledgeEvidence]:
        result = {}
        for evidence_id in evidence_ids:
            item = self.by_id.get(evidence_id)
            if item is None:
                raise LookupError('知识判据缺少所引用的冻结证据')
            key = (item.sample_id, item.image.source_sha256)
            if key not in self.overviews:
                raise LookupError('知识证据缺少对应的冻结整图')
            result[key] = self.overviews[key]
        return list(result.values())

    def summary(self, check: KnowledgeCheck) -> KnowledgeCheckSummary:
        return KnowledgeCheckSummary.model_validate(dict(check.criterion_context(),
            support_count=len(self.images(check.support_evidence_ids)),
            counter_count=len(self.images(check.counter_evidence_ids))))
