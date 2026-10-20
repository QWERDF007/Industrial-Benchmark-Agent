from collections import Counter
from typing import List, Literal, Optional

from pydantic import Field, computed_field

from iad_core.advisory.analysis import AnalysisModel, AuditAnalysis


class QualityRatio(AnalysisModel):
    numerator: int = Field(ge=0)
    denominator: int = Field(ge=0)
    basis: str

    @computed_field
    @property
    def percent(self) -> Optional[float]:
        return round(100 * self.numerator / self.denominator, 2) if self.denominator else None


class QualityScope(AnalysisModel):
    observed_inputs: int
    registered_samples: int
    unregistered_inputs: int
    basis: Literal['persisted_samples_and_import_issues'] = 'persisted_samples_and_import_issues'
    selection: Literal['latest_per_sample'] = 'latest_per_sample'
    limitations: List[str] = Field(default_factory=lambda: [
        '统计基于已保存的导入、扫描与审阅记录，未重新扫描磁盘或核验审计后源文件的变化。',
        '未用独立人工真值校准；覆盖率和模型置信度不代表准确率。',
    ])


class KnowledgeUsage(AnalysisModel):
    normal_version_id: Optional[str]
    defect_version_id: Optional[str]
    legacy_profile_id: Optional[str]
    sample_count: int


class ModelIndicators(AnalysisModel):
    suspect_samples: int = Field(description='最新建议为 FAIL 或仍有待核验 finding 的图像数，不代表已确认缺陷')
    finding_count: int
    uncertain_samples: int
    missing_evidence_samples: int = Field(description='综合结论标记缺证或检查项为 insufficient 的图像数')
    conflict_samples: int
    unstructured_samples: int = Field(description='已有建议但未保存结构化证据分析，不能据此断言没有缺证')


class QualityAssessment(AnalysisModel):
    version: Literal['quality-dimensions-v1'] = 'quality-dimensions-v1'
    scope: QualityScope
    technical_usability: QualityRatio
    audit_coverage: QualityRatio
    human_verification_coverage: QualityRatio
    model: ModelIndicators
    knowledge_versions: List[KnowledgeUsage]
    audit_run_ids: List[str]

    @classmethod
    def from_records(cls, samples, issues):
        sample_ids = {row['sample_id'] for row in samples}
        issue_ids = {row['sample_id'] for row in issues if row['sample_id'] is not None}
        blocking = {row['sample_id'] for row in issues if row['severity'].upper() in ('ERROR', 'CRITICAL')}
        usable = sum(row['sample_id'] not in blocking and row['width'] > 0 and row['height'] > 0 for row in samples)
        observed = len(sample_ids | issue_ids)
        analyses = {row['sample_id']: AuditAnalysis.model_validate_json(row['analysis_json'])
            for row in samples if row['analysis_json'] is not None}
        versions = Counter((analysis.normal_version_id, analysis.defect_version_id, analysis.legacy_profile_id)
            for analysis in analyses.values())
        suspects = {row['sample_id'] for row in samples if row['suggested_label'] == 'FAIL'} | {
            sample_id for sample_id, analysis in analyses.items() if analysis.findings}
        return cls(
            model=ModelIndicators(
                suspect_samples=len(suspects),
                finding_count=sum(len(analysis.findings) for analysis in analyses.values()),
                uncertain_samples=sum(row['suggestion_id'] is not None and row['suggested_label'] in ('UNCERTAIN', None) for row in samples),
                missing_evidence_samples=sum(bool(analysis.conclusion.missing_evidence) or any(
                    check.status == 'insufficient' for check in analysis.check_assessments) for analysis in analyses.values()),
                conflict_samples=sum(bool(analysis.conclusion.conflicts) for analysis in analyses.values()),
                unstructured_samples=sum(row['suggestion_id'] is not None and row['sample_id'] not in analyses for row in samples),
            ),
            knowledge_versions=[KnowledgeUsage(normal_version_id=normal, defect_version_id=defect,
                legacy_profile_id=legacy, sample_count=count) for (normal, defect, legacy), count in
                sorted(versions.items(), key=lambda item: tuple(value or '' for value in item[0]))],
            audit_run_ids=sorted({row['audit_run_id'] for row in samples if row['audit_run_id']}),
            scope=QualityScope(observed_inputs=observed, registered_samples=len(samples),
                unregistered_inputs=len(issue_ids - sample_ids)),
            technical_usability=QualityRatio(numerator=usable, denominator=observed,
                basis='已登记且尺寸有效、无 ERROR/CRITICAL 导入问题的图像 / 已登记与扫描拒绝的全部图像；警告和小图不自动判为不可用。'),
            audit_coverage=QualityRatio(numerator=sum(row['suggestion_id'] is not None for row in samples), denominator=len(samples),
                basis='拥有已保存模型建议的图像 / 全部已登记图像；逐图只取最新建议，UNCERTAIN 计为已审计。'),
            human_verification_coverage=QualityRatio(numerator=sum(row['reviewed_at'] is not None and row['review_decision'] in ('PASS', 'HARD_NORMAL', 'FAIL') for row in samples), denominator=len(samples),
                basis='最新一次已提交人审为 PASS/HARD_NORMAL/FAIL 的图像 / 全部已登记图像；UNCERTAIN、SKIP 不计为已核验。'),
        )


class DatasetReport(AnalysisModel):
    dataset_id: Optional[str]
    task_id: Optional[str]
    total_samples: int
    vlm_audited_count: int
    vlm_coverage_pct: Optional[float]
    vlm_anomalies_count: int
    technical_quality_issues: int
    human_reviewed_count: int
    human_pass_count: int
    human_fail_count: int
    human_uncertain_count: int
    human_skipped_count: int
    pending_risk_count: int
    categories: dict[str, int]
    generated_at: str
    quality: QualityAssessment
