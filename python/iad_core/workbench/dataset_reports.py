from __future__ import annotations

import json
from datetime import datetime, timezone
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages, PreparedImage
from iad_core.storage.database import Database
from iad_core.workbench.benchmark_report import BenchmarkFacts, BenchmarkReportFacts
from iad_core.workbench.dataset_report_models import (DatasetReportStart, DatasetReportSnapshot,
    DatasetReportView, ReportEvidence, ReportJobState)
from iad_core.workbench.audit_result_models import AuditSampleItem
from iad_core.workbench.jobs import JobContext, JobRunner
from iad_core.workbench.report_requirements import REPORT_REQUIREMENTS
from iad_core.workbench.report_synthesis import ReportSynthesis
from iad_core.workbench.vision import VlmClient


class DatasetReports:
    """One report job owns frozen facts, visual inputs, and the model's conclusion."""

    def __init__(self, db: Database, client: VlmClient, jobs: JobRunner):
        self.db, self.client, self.jobs = db, client, jobs

    def start(self, request: DatasetReportStart | dict) -> dict:
        request = DatasetReportStart.model_validate(request)
        submission = request.model_dump(mode='json')
        if existing := self.jobs.submitted('DATASET_REPORT', submission):
            return existing
        facts = BenchmarkReportFacts(self.db).capture(request.dataset_ids)
        if not facts.cases:
            raise ValueError('当前范围没有有效的综合审计记录')
        model_name = self.client.resolve_model(None)
        payload = dict(submission=submission, dataset_id=facts.scope_dataset_ids[0], dataset_ids=facts.scope_dataset_ids,
            facts=facts.model_dump(mode='json', round_trip=True), instruction=request.instruction,
            sample_ids=facts.registered_sample_ids, model_name=model_name, model_profile=self.client.profile.model_dump())
        task = DatasetRegistry(self.db).get(facts.scope_dataset_ids[0]).task.task_id
        return self.jobs.start('DATASET_REPORT', task, payload, self.generate, '生成数据集综合报告')

    def generate(self, context: JobContext):
        context.checkpoint()
        request = context.payload['request']
        facts = BenchmarkFacts.model_validate(request['facts'])
        context.update(phase='SYNTHESIS')
        images = EvidenceImages(self.db.db_path)
        cases = list(facts.cases)
        # Preserve each observed outcome before filling the representative pool.
        selected = {}
        for case in cases:
            selected.setdefault(case.analysis.conclusion.suggested_label, case)
        representatives = list({case.sample_id: case for case in [*selected.values(), *cases]}.values())[:12]
        prepared, owners = {}, {}
        for case in representatives:
            analysis = case.analysis
            evidence = {image.evidence_id: image for image in [analysis.overview, *analysis.reference_evidence]}
            for source in analysis.image_sources[:2]:
                image = evidence[source.overview_evidence_id]
                prepared[image.evidence_id] = PreparedImage(image, images.path(image)).with_source(
                    source.sample, source.dataset_format, source.annotations)
                owners[image.evidence_id] = source.sample.sample_id
        context.update(visual_evidence_ids=list(prepared))
        statistics = facts.model_dump(mode='json', exclude={'cases', 'knowledge_versions', 'consistency_records', 'registered_sample_ids'})
        statistics['knowledge_versions'] = [dict(version_id=version.version_id, summary=version.summary,
            checks=[check.model_dump() for check in version.checks], limitations=version.limitations)
            for version in facts.knowledge_versions]
        statistics['consistency_records'] = [record.model_dump(mode='json') for record in facts.consistency_records]
        observations = [dict(sample_id=case.sample_id, raw_label=case.raw_label, run_id=case.run_id,
            conclusion=case.analysis.conclusion.model_dump(), source_signature=case.analysis.input_snapshot_signature)
            for case in cases]
        frozen = dict(statistics=statistics, cases=observations, image_owners=owners, requirements=REPORT_REQUIREMENTS)
        conclusion = ReportSynthesis(self.client).conclude(context, frozen, prepared)
        context.checkpoint()
        snapshot = DatasetReportSnapshot(run_id=context.run_id, facts=facts,
            conclusion=conclusion, instruction=request['instruction'],
            model_name=request['model_name'], created_at=datetime.now(timezone.utc).isoformat(), visual_evidence_ids=list(prepared))
        context.record(request['sample_ids'], report=snapshot.model_dump(mode='json', round_trip=True), phase='REPORT_PUBLISHED')

    @staticmethod
    def read(db: Database, run_id: str) -> DatasetReportSnapshot:
        with db.connection() as conn:
            row = conn.execute('''SELECT json_extract(payload_json,'$.report') FROM job_runs
                WHERE job_id=? AND job_type='DATASET_REPORT' AND deleted_at IS NULL''', (run_id,)).fetchone()
        if row is None or row[0] is None:
            raise LookupError('报告尚未生成')
        return DatasetReportSnapshot.model_validate_json(row[0])

    @staticmethod
    def status(db: Database, run_id: str) -> ReportJobState:
        with db.connection() as conn:
            row = conn.execute('''SELECT job_id run_id,status,progress,created_at,
                json_extract(payload_json,'$.total_samples') total_samples,
                json_extract(payload_json,'$.errors[0].message') error
                FROM job_runs WHERE job_id=? AND job_type='DATASET_REPORT' AND deleted_at IS NULL''', (run_id,)).fetchone()
        if row is None:
            raise LookupError('报告作业不存在')
        return ReportJobState(**dict(row))

    @staticmethod
    def view(db: Database, run_id: str) -> DatasetReportView:
        from iad_core.workbench.dataset_report_data import report_data
        snapshot = DatasetReports.read(db, run_id)
        evidence = {}
        for case in snapshot.facts.cases:
            analysis = case.analysis
            visuals = {image.evidence_id: image for image in [analysis.overview, *analysis.reference_evidence]}
            state = ('suspect' if analysis.findings or analysis.conclusion.suggested_label=='FAIL' else
                'insufficient' if analysis.conclusion.suggested_label=='UNCERTAIN' else 'normal')
            source = analysis.image_sources[0]
            sample = AuditSampleItem(run_id=case.run_id, sample_id=case.sample_id, dataset_id=case.dataset_id,
                filename=source.sample.relative_path, width=source.sample.width, height=source.sample.height, audit_state=state,
                suggestion_id=case.suggestion_id, consistency_check_id=analysis.consistency.check_id if analysis.consistency else None,
                overview_evidence_id=analysis.overview.evidence_id, has_findings=state=='suspect',
                insufficient_evidence=state=='insufficient', consistency_pending=False)
            for source in analysis.image_sources:
                image = visuals[source.overview_evidence_id]
                if image.evidence_id in snapshot.visual_evidence_ids:
                    evidence.setdefault(image.evidence_id, ReportEvidence(source=source, image=image,
                        suggestion_id=case.suggestion_id, audit_sample=sample))
        return DatasetReportView(run_id=run_id, scope_dataset_ids=snapshot.facts.scope_dataset_ids,
            signature=snapshot.facts.signature, created_at=snapshot.created_at, instruction=snapshot.instruction,
            registered_samples=snapshot.facts.registered_samples, audited_samples=snapshot.facts.audited_samples,
            outcomes=snapshot.facts.outcomes, raw_labels=snapshot.facts.raw_labels, data=report_data(snapshot.facts),
            conclusion=snapshot.conclusion, evidence=list(evidence.values()))

    def list(self, dataset_ids: list[str]) -> list[dict]:
        return self.catalog(self.db, dataset_ids)

    @staticmethod
    def catalog(db: Database, dataset_ids: list[str]) -> list[dict]:
        with db.connection() as conn:
            rows = conn.execute('''SELECT j.job_id,j.status,j.created_at,
                json_extract(j.payload_json,'$.request.dataset_ids') dataset_ids FROM job_runs j
                WHERE j.job_type='DATASET_REPORT' AND j.deleted_at IS NULL
                AND json_extract(j.payload_json,'$.request.dataset_ids')=json(?)
                ORDER BY j.id DESC LIMIT 30''', (json.dumps(sorted(set(dataset_ids))),)).fetchall()
        return [dict(run_id=row['job_id'],status=row['status'],created_at=row['created_at'],
            dataset_ids=json.loads(row['dataset_ids'])) for row in rows]

    @staticmethod
    def export(db: Database, run_id: str) -> dict:
        from iad_core.workbench.dataset_report_html import DatasetReportHtml
        return DatasetReportHtml(db).render(DatasetReports.read(db, run_id))
