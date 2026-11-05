import json
from collections import Counter
from datetime import datetime, timezone

from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.consistency.audit_repository import AuditConsistencyRepository
from iad_core.evidence.sources import SampleContent
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.storage.database import Database
from iad_core.workbench.audit_result_models import (
    AuditKnowledgeReference, AuditRunReport, AuditSampleDetail, AuditSampleItem,
    AuditSamplePage, AuditSampleQuery,
)
from iad_core.workbench.job_models import JobSnapshot
from iad_core.workbench.job_families import JobFamilies


PROJECTION = """
WITH family AS (
    SELECT job_id FROM job_runs WHERE job_type='MODEL_AUDIT' AND json_extract(payload_json,'$.root_run_id')=?
), advice AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY sample_id ORDER BY id DESC) AS position
    FROM audit_suggestions WHERE audit_run_id IN (SELECT job_id FROM family)
), checks AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY sample_id ORDER BY id DESC) AS position
    FROM audit_consistency_checks WHERE run_id IN (SELECT job_id FROM family)
), facts AS (
    SELECT scope.value AS sample_id, scope.key AS ordinal,
        COALESCE(a.audit_run_id,c.run_id,?) AS run_id,
        COALESCE(s.relative_path, scope.value) AS filename,
        COALESCE(s.width, 0) AS width, COALESCE(s.height, 0) AS height,
        a.suggestion_id, c.check_id AS consistency_check_id,
        json_extract(a.analysis_json, '$.overview.evidence_id') AS overview_evidence_id,
        a.suggestion_id IS NOT NULL AND (
            COALESCE(json_array_length(a.analysis_json, '$.findings'), 0)>0
            OR COALESCE(json_extract(a.analysis_json, '$.conclusion.suggested_label'), '')='FAIL') AS has_findings,
        a.suggestion_id IS NOT NULL AND (
            a.analysis_json IS NULL
            OR json_extract(a.analysis_json, '$.conclusion.suggested_label')='UNCERTAIN'
            OR COALESCE(json_array_length(a.analysis_json, '$.conclusion.missing_evidence'), 0)>0
            OR COALESCE(json_array_length(a.analysis_json, '$.conclusion.conflicts'), 0)>0
            OR json_extract(a.analysis_json, '$.coverage.complete')=0) AS insufficient_evidence,
        EXISTS(SELECT 1 FROM json_each(c.record_json, '$.references') ref
            JOIN consistency_results r ON r.evidence_id=json_extract(ref.value, '$.evidence_id')
            WHERE json_array_length(r.snapshot_json, '$.result.annotation.differences')>0) AS consistency_pending
    FROM json_each(?) scope
    LEFT JOIN samples s ON s.sample_id=scope.value
    LEFT JOIN advice a ON a.sample_id=scope.value AND a.position=1
    LEFT JOIN checks c ON c.sample_id=scope.value AND c.position=1
)
SELECT *, CASE WHEN suggestion_id IS NULL THEN 'unprocessed'
    WHEN has_findings THEN 'suspect' WHEN insufficient_evidence THEN 'insufficient'
    ELSE 'normal' END AS audit_state FROM facts ORDER BY ordinal
"""


class AuditResults:
    """Read one audit's frozen input and saved outputs, independent of later audits."""

    def __init__(self, db: Database):
        self.db = db

    def _projection(self, run_id: str) -> tuple[JobSnapshot, list[AuditSampleItem]]:
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            job = JobFamilies(self.db).snapshot(run_id, ('MODEL_AUDIT',), connection=connection)
            rows = connection.execute(PROJECTION, (job.root_run_id, job.run_id, json.dumps(job.sample_ids))).fetchall()
        items = [AuditSampleItem(dataset_id=job.dataset_id,
            **{key: row[key] for key in AuditSampleItem.model_fields if key != 'dataset_id'}) for row in rows]
        return job, items

    def samples(self, query: AuditSampleQuery) -> AuditSamplePage:
        _, items = self._projection(query.run_id)
        distribution = {state: sum(item.audit_state == state for item in items)
                        for state in ('suspect', 'insufficient', 'normal', 'unprocessed')}
        selected = [item for item in items if (query.status == 'all' or item.audit_state == query.status)
                    and query.search.casefold() in item.filename.casefold()]
        start = (query.page - 1) * query.page_size
        return AuditSamplePage(run_id=query.run_id, total=len(selected), page=query.page, page_size=query.page_size,
            distribution=distribution, items=selected[start:start + query.page_size])

    def _knowledge(self, version_id: str | None) -> AuditKnowledgeReference | None:
        if not version_id:
            return None
        snapshot = KnowledgeRepository(self.db).get(version_id)
        return AuditKnowledgeReference(**snapshot.model_dump(include=set(AuditKnowledgeReference.model_fields)))

    def sample(self, run_id: str, sample_id: str) -> AuditSampleDetail:
        job, items = self._projection(run_id)
        item = next((item for item in items if item.sample_id == sample_id), None)
        if item is None:
            raise LookupError('该图像不属于所选审计作业的冻结范围')
        suggestion = AuditSuggestionRepository(self.db).get(item.suggestion_id) if item.suggestion_id else None
        if suggestion and suggestion.analysis and (
                suggestion.analysis.knowledge_version_id != job.knowledge_version_id):
            raise ValueError('审计结果与作业冻结知识版本不一致')
        expected = next((source for source in job.model_dump().get('request', {}).get('input_sources', [])
                         if source['sample_id'] == sample_id), None)
        current = None
        if expected:
            try:
                current = SampleContent.capture(self.db, sample_id).model_dump() == expected
            except (OSError, ValueError, LookupError):
                current = False
        return AuditSampleDetail(sample=item, suggestion=suggestion,
            knowledge=self._knowledge(job.knowledge_version_id),
            consistency=AuditConsistencyRepository(self.db).latest(sample_id, run_id=item.run_id),
            source_current=current, errors=[error.message for error in job.errors if error.sample_id == sample_id])

    def report(self, run_id: str) -> AuditRunReport:
        job, items = self._projection(run_id)
        audited = sum(item.suggestion_id is not None for item in items)
        suspects = sum(item.has_findings for item in items)
        insufficient = sum(item.insufficient_evidence for item in items)
        distribution = Counter(item.audit_state for item in items)
        evidence = [item for item in items if item.has_findings or item.insufficient_evidence or item.consistency_pending]
        return AuditRunReport(run_id=run_id, dataset_id=job.dataset_id, status=job.status,
            total_samples=len(items), audited_samples=audited,
            coverage_percent=round(100 * audited / len(items), 2) if items else None,
            suspect_samples=suspects, insufficient_samples=insufficient,
            consistency_pending_samples=sum(item.consistency_pending for item in items),
            distribution={state: distribution[state] for state in ('suspect', 'insufficient', 'normal', 'unprocessed')},
            knowledge_version_id=job.knowledge_version_id,
            model_name=job.model_name, submitted_at=job.submitted_at, finished_at=job.finished_at,
            generated_at=datetime.now(timezone.utc).isoformat(),
            analysis=f'本作业冻结 {len(items)} 张图像，已保存 {audited} 张模型审计记录，尚有 {len(items) - audited} 张未产生审计结果。',
            conclusion=f'发现疑点 {suspects} 张，证据不足 {insufficient} 张，需结合对应证据复核。',
            limitations=['统计仅覆盖所选作业的冻结输入和保存结果，不代表人工真值或准确率。',
                '疑点、证据不足及一致性待核实是独立口径，可能重叠，不能直接相加。',
                '一致性待核实依据作业关联的冻结比较记录，不以之后的其他作业替换。'],
            key_evidence=(evidence or [item for item in items if item.suggestion_id])[:8])
