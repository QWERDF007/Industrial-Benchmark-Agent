import hashlib
import json
from typing import List, Optional

from iad_core.advisory.analysis import RegionOrigin
from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.advisory.schemas import AuditSuggestion
from iad_core.dataset.path_safety import validate_sample_image_path
from iad_core.evidence.images import file_sha256
from iad_core.knowledge.models import FindingTarget, KnowledgeSource
from iad_core.storage.database import Database
from iad_core.storage.models import Sample


class AuditCandidates:
    def __init__(self, db: Database):
        self.repository = AuditSuggestionRepository(db)
        self.db_path = db.db_path

    def matching(self, sample: Sample, source_sha256: Optional[str] = None) -> List[AuditSuggestion]:
        candidates = [suggestion for suggestion in self.repository.list_by_sample(sample.sample_id)
                      if suggestion.analysis and suggestion.analysis.findings]
        if not candidates:
            return []
        sha256 = source_sha256 or file_sha256(validate_sample_image_path(sample, self.db_path))
        return [suggestion for suggestion in candidates if suggestion.analysis.overview.source_sha256 == sha256]

    def targets(self, source: KnowledgeSource) -> List[FindingTarget]:
        targets = []
        for suggestion_id in source.audit_suggestion_ids:
            suggestion = self.repository.get(suggestion_id)
            if (not suggestion or suggestion.sample_id != source.sample_id or not suggestion.analysis
                    or suggestion.analysis.overview.source_sha256 != source.sha256):
                raise ValueError('Frozen audit candidate does not match the knowledge source')
            for finding in suggestion.analysis.findings:
                width, height = suggestion.analysis.overview.original_size
                bbox = finding.location.bbox or [0, 0, width, height]
                identity = json.dumps([suggestion.suggestion_id, finding.finding_id])
                targets.append(FindingTarget(finding_id='finding_' + hashlib.sha256(identity.encode()).hexdigest(),
                    sample_id=source.sample_id, bbox=bbox,
                    origins=[RegionOrigin(source='model', label=finding.description, bbox=bbox, check_ids=finding.check_ids)],
                    origin_finding_id=finding.finding_id, origin_suggestion_id=suggestion.suggestion_id,
                    audit_finding=finding, regions=[]))
        return targets
