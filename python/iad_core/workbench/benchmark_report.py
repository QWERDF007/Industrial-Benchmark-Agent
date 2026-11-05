import hashlib
import json
from collections import Counter

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel, AuditAnalysis, AuditConclusion
from iad_core.consistency.audit_models import AuditConsistencyRecord
from iad_core.knowledge.models import KnowledgeSnapshot
from iad_core.storage.database import Database
from iad_core.workbench.audit_protocol import audit_generation_signature
from iad_core.workbench.report import QualityRatio
from iad_core.workbench.report_technical_evidence import ReportTechnicalEvidence


class ReportAnnotationCoverage(AnalysisModel):
    annotated_samples: int
    unannotated_samples: int
    bbox_samples: int
    mask_samples: int
    invalid_annotations: int
    completeness_unknown_samples: int


class ReportSourceGroups(AnalysisModel):
    known_groups: int
    known_samples: int
    missing_samples: int


class ReportAuditCase(AnalysisModel):
    sample_id: str
    dataset_id: str
    run_id: str
    suggestion_id: str
    raw_label: str
    analysis: AuditAnalysis


class BenchmarkFactsData(AnalysisModel):
    scope_dataset_ids: list[str]
    registered_sample_ids: list[str]
    registered_samples: int
    audited_samples: int
    coverage: QualityRatio
    technical_usability: QualityRatio
    technical_evidence: ReportTechnicalEvidence
    included_run_ids: list[str]
    excluded_audit_records: dict[str, int]
    outcomes: dict[str, int]
    raw_labels: dict[str, int]
    annotation_coverage: ReportAnnotationCoverage
    independence: dict[str, ReportSourceGroups]
    label_comparison: QualityRatio
    gold_by_policy: list[dict]
    evaluation_evidence: list[dict]
    knowledge_versions: list[KnowledgeSnapshot]
    consistency_records: list[AuditConsistencyRecord]
    capability_candidates: dict[str, list[str]]
    cases: list[ReportAuditCase]


class BenchmarkFacts(BenchmarkFactsData):
    signature: str = Field(pattern='^[a-f0-9]{64}$')


class BenchmarkReportFacts:
    """Capture scope facts once; model explanation and exports consume this snapshot."""

    def __init__(self, db: Database):
        self.db = db

    def capture(self, dataset_ids: list[str]) -> BenchmarkFacts:
        selected = sorted(set(dataset_ids))
        if not selected:
            raise ValueError('请选择报告范围')
        protocol_signature = audit_generation_signature()
        placeholders = ','.join('?' for _ in selected)
        with self.db.connection() as conn:
            conn.execute('BEGIN')
            registered = {row[0] for row in conn.execute(f'SELECT dataset_id FROM datasets WHERE dataset_id IN ({placeholders})', selected)}
            if registered != set(selected):
                raise LookupError('报告范围包含未登记数据集')
            samples = [dict(row) for row in conn.execute(f'SELECT * FROM samples WHERE is_excluded=0 AND dataset_id IN ({placeholders}) ORDER BY sample_id', selected)]
            annotations = [dict(row) for row in conn.execute(f'''SELECT a.* FROM annotations a JOIN samples s ON s.sample_id=a.sample_id
                WHERE s.is_excluded=0 AND s.dataset_id IN ({placeholders})''', selected)]
            issues = [dict(row) for row in conn.execute(f'SELECT sample_id,severity,issue_type FROM import_issues WHERE dataset_id IN ({placeholders})', selected)]
            pixels = [dict(row) for row in conn.execute(f'''SELECT p.sample_id,json_extract(p.descriptor_json,'$.decode_status') decode_status
                FROM sample_pixel_index p JOIN samples s ON s.sample_id=p.sample_id
                WHERE s.is_excluded=0 AND s.dataset_id IN ({placeholders})''', selected)]
            audits = [dict(row) for row in conn.execute(f'''SELECT a.suggestion_id,a.sample_id,a.audit_run_id,a.analysis_json,a.source_fingerprint,
                json_extract(j.payload_json,'$.request.generation_signature') generation_signature
                FROM audit_suggestions a JOIN samples s ON s.sample_id=a.sample_id
                JOIN job_runs j ON j.job_id=a.audit_run_id
                WHERE s.is_excluded=0 AND s.dataset_id IN ({placeholders}) AND j.deleted_at IS NULL
                ORDER BY a.id DESC''', selected)]
            cases, rejected, taken = [], Counter(), set()
            by_id = {sample['sample_id']: sample for sample in samples}
            for audit in audits:
                sample = by_id[audit['sample_id']]
                if audit['generation_signature'] != protocol_signature:
                    rejected['protocol_changed_or_unverified'] += 1
                    continue
                if not audit['analysis_json']:
                    rejected['unstructured'] += 1
                    continue
                if not sample['source_fingerprint'] or sample['source_fingerprint'] != audit['source_fingerprint']:
                    rejected['source_changed_or_unverified'] += 1
                    continue
                analysis = AuditAnalysis.model_validate_json(audit['analysis_json'])
                if not isinstance(analysis.conclusion, AuditConclusion) or not analysis.input_snapshot_signature:
                    rejected['unsynthesized'] += 1
                    continue
                if audit['sample_id'] in taken:
                    rejected['superseded'] += 1
                    continue
                taken.add(audit['sample_id'])
                cases.append(ReportAuditCase(sample_id=sample['sample_id'], dataset_id=sample['dataset_id'],
                    run_id=audit['audit_run_id'], suggestion_id=audit['suggestion_id'], raw_label=sample['quality_status'],
                    analysis=analysis))
            versions = sorted({case.analysis.knowledge_version_id for case in cases if case.analysis.knowledge_version_id})
            knowledge = [KnowledgeSnapshot.model_validate_json(row[0]) for row in conn.execute(
                'SELECT snapshot_json FROM knowledge_versions WHERE version_id IN (SELECT value FROM json_each(?)) ORDER BY version_id', (json.dumps(versions),))]
            if {item.version_id for item in knowledge} != set(versions):
                raise LookupError('审计引用的冻结知识版本缺失')
            checks = sorted({case.analysis.consistency.check_id for case in cases if case.analysis.consistency})
            consistency = [AuditConsistencyRecord.model_validate_json(row[0]) for row in conn.execute(
                'SELECT record_json FROM audit_consistency_checks WHERE check_id IN (SELECT value FROM json_each(?)) ORDER BY check_id', (json.dumps(checks),))]
            if {item.check_id for item in consistency} != set(checks):
                raise LookupError('审计引用的冻结一致性记录缺失')
            gold = [dict(row) for row in conn.execute(f'''SELECT g.* FROM gold_records g JOIN samples s ON s.sample_id=g.sample_id
                WHERE s.is_excluded=0 AND s.dataset_id IN ({placeholders}) ORDER BY g.policy_name,g.sample_id''', selected)]
            policies = []
            for name in sorted({row['policy_name'] for row in gold}):
                rows = [row for row in gold if row['policy_name'] == name]
                policies.append(dict(policy_name=name, status_counts=dict(Counter(row['gold_status'] for row in rows)),
                    source_counts=dict(Counter(row['gold_source'] for row in rows)),
                    independently_confirmed=sum(row['gold_status']=='CONFIRMED' and row['gold_source'] in ('HUMAN_REVIEW','PRODUCTION_QA') for row in rows),
                    records=[{key: row[key] for key in ('sample_id','gold_status','gold_source','gold_source_ref','binary_label','hard_normal','provenance_json')} for row in rows]))
            evaluations = [dict(row) for row in conn.execute(f'''SELECT e.* FROM evaluation_runs e
                WHERE EXISTS(SELECT 1 FROM split_assignments a JOIN samples s ON s.sample_id=a.sample_id
                    WHERE a.build_id=e.build_id AND s.dataset_id IN ({placeholders})) ORDER BY e.id''', selected)]
            for evaluation in evaluations:
                evaluation['metrics'] = json.loads(evaluation.pop('metrics_json') or '{}')
                evaluation['scope_note'] = '该评测使用其自身冻结划分，不自动视为当前报告范围的成绩'
        outcomes = Counter()
        for case in cases:
            conclusion = case.analysis.conclusion
            state = ('anomaly_candidate' if conclusion.suggested_label=='FAIL' or case.analysis.findings else
                'insufficient' if conclusion.suggested_label=='UNCERTAIN' or conclusion.missing_evidence or conclusion.conflicts or not case.analysis.coverage.complete else 'normal_candidate')
            outcomes[state] += 1
        outcomes['not_processed'] = len(samples)-len(cases)
        comparable = [case for case in cases if case.raw_label in ('PASS','FAIL') and case.analysis.conclusion.suggested_label in ('PASS','FAIL')]
        annotated = {row['sample_id'] for row in annotations}
        blocking = {row['sample_id'] for row in issues if row['severity'].upper() in ('ERROR','CRITICAL')}
        observed = set(by_id) | {row['sample_id'] for row in issues if row['sample_id']}
        candidates = {}
        for case in cases:
            for candidate in getattr(case.analysis.conclusion, 'proposed_slice', []):
                candidates.setdefault(candidate.name, []).append(case.sample_id)
        payload = dict(scope_dataset_ids=selected, registered_sample_ids=sorted(by_id), registered_samples=len(samples), audited_samples=len(cases),
            coverage=QualityRatio(numerator=len(cases), denominator=len(samples), basis='当前范围去重后有有效冻结审计记录的图像 / 去重登记图像'),
            technical_usability=QualityRatio(numerator=sum(sample['sample_id'] not in blocking and sample['width']>0 and sample['height']>0 for sample in samples),
                denominator=len(observed), basis='有有效尺寸且无阻断导入问题的登记图像 / 登记与扫描拒绝的图像'),
            technical_evidence=ReportTechnicalEvidence.from_records(samples, annotations, issues, pixels),
            included_run_ids=sorted({case.run_id for case in cases}), excluded_audit_records=dict(rejected),
            outcomes={key: outcomes[key] for key in ['normal_candidate','anomaly_candidate','insufficient','not_processed']},
            raw_labels=dict(Counter(sample['quality_status'] for sample in samples)),
            annotation_coverage=ReportAnnotationCoverage(annotated_samples=len(annotated), unannotated_samples=len(samples)-len(annotated),
                bbox_samples=len({row['sample_id'] for row in annotations if row['annotation_type']=='bbox'}),
                mask_samples=len({row['sample_id'] for row in annotations if row['annotation_type']=='mask'}),
                invalid_annotations=sum(row['geometry_status']=='INVALID' for row in annotations),
                completeness_unknown_samples=len(samples)),
            independence={field: ReportSourceGroups(known_groups=len({sample[field] for sample in samples if sample[field]}),
                known_samples=sum(bool(sample[field]) for sample in samples), missing_samples=sum(not sample[field] for sample in samples))
                for field in ['physical_sample_id','capture_sequence_id','batch_id','camera','station']},
            label_comparison=QualityRatio(numerator=sum(case.raw_label!=case.analysis.conclusion.suggested_label for case in comparable),
                denominator=len(comparable), basis='模型明确建议与原始明确标签不一致 / 可比较样本；不是标签错误率或模型准确率'),
            gold_by_policy=policies, evaluation_evidence=evaluations, knowledge_versions=knowledge, consistency_records=consistency,
            capability_candidates={key: sorted(set(value)) for key, value in candidates.items()}, cases=cases)
        content = BenchmarkFactsData(**payload)
        encoded = json.dumps(content.model_dump(mode='json', round_trip=True), sort_keys=True, ensure_ascii=False)
        return BenchmarkFacts(**payload, signature=hashlib.sha256(encoded.encode()).hexdigest())
