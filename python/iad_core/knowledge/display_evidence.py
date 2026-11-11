from collections.abc import Iterable
import re

from iad_core.knowledge.models import KnowledgeCheck, KnowledgeCheckSummary, KnowledgeEvidence


class KnowledgeDisplayEvidence:
    """Project model view citations onto their frozen whole-image sources."""

    def __init__(self, evidence: list[KnowledgeEvidence], references: dict[str, str] | None = None):
        self.by_id = {item.image.evidence_id: item for item in evidence}
        self.overviews = {(item.sample_id, item.image.source_sha256): item for item in evidence
            if item.image.is_whole_image}
        self.references = {identity:'原图 ' + item.sample_id.split(':',1)[-1] for item in evidence
            for identity in (item.image.evidence_id,item.sample_id)} | (references or {})
        self.pattern = re.compile('|'.join(re.escape(value) for value in sorted(self.references,key=len,reverse=True))) if self.references else None

    def text(self, value: str) -> str:
        return self.pattern.sub(lambda match:self.references[match[0]],value) if self.pattern else value

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
