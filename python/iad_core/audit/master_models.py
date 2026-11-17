from typing import Literal

from iad_core.advisory.analysis import AnalysisModel
from iad_core.audit.consistency_models import AuditCandidateContext, AuditUpstreamResult
from iad_core.audit.delegation_models import AuditBatch, AuditRecheck
from iad_core.audit.models import AuditFinal, AuditSampleRun
from iad_core.audit.quality_models import QualityScoreVersion
from iad_core.audit.knowledge_models import AuditKnowledge
from iad_core.audit.profile_models import AuditDatasetProfile, AuditGeometryProfile, AuditMetadataCoverage
from iad_core.benchmark.readiness import BenchmarkReadiness
from iad_core.audit.report_models import AuditDiscovery, AuditDiscoveryIndex, AuditStatistics
from iad_core.analysis.evidence_models import ContextPolicy
from iad_core.consistency.annotation_issues import IssueType
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.workbench.job_models import JobStatus


class AuditMasterConsistency(AnalysisModel):
    source_status: str
    reason: str
    program_conclusion: str
    model_conclusion: ConflictCategory | Literal['无冲突'] | None
    result: AuditUpstreamResult | None
    gates: list[AuditCandidateContext]


class AuditMasterRecord(AnalysisModel):
    sample_id: str
    result_revision: int
    state: JobStatus
    final: AuditFinal | None
    consistency: AuditMasterConsistency

    @classmethod
    def capture(cls, sample: AuditSampleRun) -> 'AuditMasterRecord':
        upstream = sample.consistency
        return cls(sample_id=sample.sample_id,result_revision=sample.result_revision,state=sample.state,final=sample.result,
            consistency=AuditMasterConsistency(source_status=sample.source_status,reason=upstream.reason,program_conclusion=upstream.program_conclusion,
                model_conclusion=upstream.model_conclusion,result=AuditUpstreamResult.capture(upstream),gates=[AuditCandidateContext.capture(gate) for gate in upstream.gates]))


class AuditMasterLeakage(AnalysisModel):
    is_passed: bool
    total_violations: int


class AuditMasterBenchmark(AnalysisModel):
    build_id: str
    source_image_count: int
    covered_images: int
    source_matches_scope: bool
    split_distribution: dict[str, int]
    confirmed_gold_images: int
    pixel_gold_images: int
    readiness: BenchmarkReadiness
    leakage: AuditMasterLeakage


class AuditMasterDatasetProfile(AnalysisModel):
    total_images: int
    dataset_format: Literal['labelme', 'folder_classification']
    registered_quality: dict[str, int]
    geometry: AuditGeometryProfile | None
    metadata: dict[str, AuditMetadataCoverage]
    strict_duplicate_groups: int | None
    strict_duplicate_images: int | None
    near_candidate_pairs: int
    benchmark: AuditMasterBenchmark | None

    @classmethod
    def capture(cls, profile: AuditDatasetProfile):
        data = profile.model_dump(include=set(cls.model_fields))
        if profile.benchmark:
            data['benchmark'] = profile.benchmark.model_dump(include=set(AuditMasterBenchmark.model_fields))
            data['benchmark']['leakage'] = profile.benchmark.leakage.model_dump(include=set(AuditMasterLeakage.model_fields))
        return cls.model_validate(data)


class AuditMasterContext(AnalysisModel):
    quality_score_version: QualityScoreVersion | None = None
    kind: Literal['audit_master_index'] = 'audit_master_index'
    record_index: dict[str, str | int]
    job_id: str
    phase: Literal['review', 'report']
    batch: AuditBatch | None
    revision: int
    items: list[AuditMasterRecord]
    items_scope: Literal['unread_versions'] = 'unread_versions'
    discoveries: list[AuditDiscovery | AuditDiscoveryIndex]
    context_policy: ContextPolicy = 'legacy'
    reviews: list[AuditRecheck]
    review_counts: dict[str, int]
    dataset_profile: AuditMasterDatasetProfile
    applicable_issue_types: list[IssueType]
    statistics: AuditStatistics
    knowledge: AuditKnowledge | None
