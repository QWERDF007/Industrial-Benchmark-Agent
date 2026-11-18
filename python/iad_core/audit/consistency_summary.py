"""Frozen upstream conclusions, program scoring and one text-only analysis."""
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Literal

from iad_core.audit.distribution import AuditDistributions
from iad_core.audit.quality_models import QualityImage
from iad_core.audit.quality_scoring import AuditQualityScorer
from iad_core.audit.report_models import (AuditConsistencyAnalysis, AuditCount, AuditStatistics,
    ConsistencyAuditText, ConsistencyStoredReport, AUDIT_ISSUE_LABELS)
from iad_core.audit.reports import AuditReports
from iad_core.audit.state import AuditState
from iad_core.consistency.agent_result_models import ConsistencyConclusionRecord
from iad_core.consistency.annotation_issues import ISSUE_CATEGORIES
from iad_core.consistency.conflict_categories import CONFLICT_RULES
from iad_core.workbench.audit_result_models import AuditRunReport
from iad_core.workbench.job_families import JobFamilies


class ConsistencyAudit:
    def __init__(self, db):
        self.db, self.state = db, AuditState(db)

    @staticmethod
    def sample_state(record: ConsistencyConclusionRecord) -> Literal['normal', 'suspect']:
        return 'suspect' if record.result.issues else 'normal'

    def records(self, run_id: str) -> list[ConsistencyConclusionRecord]:
        if self.state.snapshot(run_id).settings.audit_scope != 'consistency':
            raise ValueError('本作业不是数据一致性范围')
        with self.db.connection() as connection:
            rows = connection.execute('SELECT record_json FROM audit_upstream_records WHERE job_id=? ORDER BY ordinal', (run_id,))
            return [ConsistencyConclusionRecord.model_validate_json(row[0]) for row in rows]

    def prepare(self, run_id: str) -> dict:
        records = self.records(run_id)
        groups = defaultdict(list)
        for record in records:
            for issue in record.result.issues:
                groups[issue.type].append((record.summary.anchor_id, issue))
        problem_groups = []
        for kind, issues in groups.items():
            unique = list(dict.fromkeys(sid for sid, _ in issues))
            examples = []
            for _, issue in issues:
                examples.append({'description': issue.description[:1200]})
                if len(examples) == 3:
                    break
            rule = CONFLICT_RULES[ISSUE_CATEGORIES[kind]]
            problem_groups.append({'issue_type': kind, 'label': AUDIT_ISSUE_LABELS[kind], 'priority': rule.priority,
                'image_count': len(unique), 'occurrences': len(issues), 'examples': examples})
        problem_groups.sort(key=lambda group:group['priority'])
        context = {'problem_groups': problem_groups}
        while len(json.dumps(context,ensure_ascii=False)) > 32000:
            largest = max(problem_groups,key=lambda group:len(json.dumps(group['examples'],ensure_ascii=False)))
            largest['examples'].pop()
        AuditReports(self.db).begin(run_id)
        return {'session_id': AuditReports(self.db).session(run_id).session_id,
            'needs_analysis': bool(problem_groups), 'context': context,
            'response_schema': ConsistencyAuditText.model_json_schema()}

    def statistics(self, run_id: str) -> AuditStatistics:
        records = self.records(run_id)
        snapshot = self.state.snapshot(run_id)
        datasets = {r.sample.sample_id: r.sample.dataset_id for r in snapshot.manifest.records}
        occurrences, images = Counter(), defaultdict(set)
        cross, distribution = defaultdict(Counter), defaultdict(Counter)
        for record in records:
            compared = record.summary.reason in ('MODEL_REVIEWED', 'PROGRAM_REVIEWED')
            state = self.sample_state(record)
            key = record.summary.reason + (':'+record.summary.verdict if compared and record.summary.verdict else '')
            cross[key][state] += 1
            distribution[datasets[record.summary.anchor_id]][state] += 1
            for issue in record.result.issues:
                occurrences[issue.type] += 1
                images[issue.type].add(record.summary.anchor_id)
        total, suspect = len(records), sum(bool(r.result.issues) for r in records)
        counts = {kind: AuditCount(image_count=len(images[kind]), occurrences=n) for kind, n in occurrences.items()}
        return AuditStatistics(total_images=total, completed_images=total, normal_images=sum(v['normal'] for v in distribution.values()),
            suspect_images=suspect, incomplete_images=0, completion_rate=1 if total else None,
            suspect_rate_among_completed=suspect/total if total else None, issue_occurrences=sum(occurrences.values()),
            issue_types=counts, upstream_issue_types=counts, datasets=dict(distribution), consistency_cross=dict(cross),
            consistency_assessments={}, knowledge_assessments={})

    def commit(self, run_id: str, narrative: dict | None, *, jobs):
        records = self.records(run_id)
        snapshot = self.state.snapshot(run_id)
        expected = {issue.type for r in records for issue in r.result.issues}
        if expected:
            text = ConsistencyAuditText.model_validate(narrative)
            if len(text.analyses) != len(expected) or {a.issue_type for a in text.analyses} != expected:
                raise ValueError('分析须覆盖且仅覆盖上游实际问题类型')
        else:
            if narrative is not None:
                raise ValueError('没有问题记录，无需模型分析')
            statistics = self.statistics(run_id)
            compared = sum(r.summary.reason in ('MODEL_REVIEWED', 'PROGRAM_REVIEWED') for r in records)
            text = ConsistencyAuditText(
                conclusion='本次审计未发现标注冲突。',
                consistency_analysis=f'{compared} 张图像的标注一致，'
                    f'{statistics.total_images-compared} 张图像没有可用的对照图。', analyses=[])
        datasets = {r.sample.sample_id: r.sample.dataset_id for r in snapshot.manifest.records}
        score = AuditQualityScorer().score([QualityImage(sample_id=r.summary.anchor_id,
            dataset_id=datasets[r.summary.anchor_id], consistency_categories=r.summary.categories) for r in records],
            snapshot.settings.quality_score_weights, scope='consistency')
        from iad_core.audit.report_evidence import AuditReportEvidence
        AuditReportEvidence(self.db).groups(run_id)
        stored = ConsistencyStoredReport(**text.model_dump(), quality_score=score)
        with jobs.lock, self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            if connection.execute('SELECT status FROM job_runs WHERE job_id=?', (run_id,)).fetchone()[0] != 'RUNNING':
                raise InterruptedError('作业已停止')
            if connection.execute('SELECT state FROM audit_report_runs WHERE job_id=?', (run_id,)).fetchone()[0] == 'COMPLETED':
                raise ValueError('报告已经提交')
            connection.execute("UPDATE audit_report_runs SET state='COMPLETED',result_json=?,error=NULL WHERE job_id=?", (stored.model_dump_json(), run_id))
            jobs.record(run_id, [r.summary.anchor_id for r in records], connection=connection,
                phase='FINALIZING_REPORT', completion_pending=False)
        return AuditReports(self.db).session(run_id)

    def report(self, run_id: str) -> AuditRunReport:
        snapshot = self.state.snapshot(run_id)
        job = JobFamilies(self.db).snapshot(run_id, ('MODEL_AUDIT',))
        session, statistics = AuditReports(self.db).session(run_id), self.statistics(run_id)
        final = session.result
        from iad_core.dataset.registry import DatasetRegistry
        from iad_core.audit.report_evidence import AuditReportEvidence
        pairs = AuditReportEvidence(self.db).groups(run_id) if final else {}
        return AuditRunReport(audit_scope='consistency', quality_score=final.quality_score if final else None,
            run_id=run_id, dataset_id=job.dataset_id, status=job.status, total_samples=statistics.total_images,
            audited_samples=statistics.completed_images, coverage_percent=100, suspect_samples=statistics.suspect_images,
            insufficient_samples=0, consistency_pending_samples=0,
            distribution={'suspect': statistics.suspect_images, 'normal': statistics.normal_images},
            knowledge_version_id=None, model_name=job.model_name, submitted_at=job.submitted_at,
            finished_at=job.finished_at, generated_at=datetime.now(timezone.utc).isoformat(),
            conclusion=final.conclusion if final else '', limitations=[session.error] if session.error else [],
            statistics=statistics, consistency_job_id=snapshot.consistency_job_id, report_state=session.state,
            report_session_id=session.session_id if session.session_created else None,
            consistency_analysis=final.consistency_analysis if final else '',
            consistency_analyses=[AuditConsistencyAnalysis(issue_type=a.issue_type, analysis=a.analysis, evidence_refs=[]) for a in final.analyses] if final else [],
            dataset_profile=snapshot.dataset_profile, data_distribution=AuditDistributions(snapshot.manifest).catalog(),
            evidence_pairs=pairs, dataset_names={identity:DatasetRegistry(self.db).get(identity).dataset.name for identity in snapshot.manifest.dataset_ids})
