import hashlib
import json

from iad_core.audit.quality_models import (
    QUALITY_SCORE_VERSION, QualityAssessment, QualityDefect, QualityImage, QualityObservation, QualityScore, QualityScorePreview,
)
from iad_core.audit.quality_scoring import AuditQualityScorer
from iad_core.audit.state import AuditState
from iad_core.workbench.analysis_sources import AnalysisSourceRoles


class AuditQualityReports:
    def __init__(self, db):
        self.db, self.state = db, AuditState(db)

    @staticmethod
    def validate_observation(record, observation: QualityObservation):
        if not observation.complete:
            return
        role = AnalysisSourceRoles.resolve(record.dataset_format, record.sample.quality_status,
            record.sample.annotation_availability.status, len(record.annotations))
        annotations = {item.annotation_id for item in record.annotations if not item.is_ignored}
        supplied = [item.annotation_id for item in observation.defects]
        if record.dataset_format == 'labelme':
            if len(supplied) != len(set(supplied)) or set(supplied) != annotations:
                raise ValueError('评分场景须逐项覆盖本图全部原始标注，不得新增或重复实例')
        elif role == 'defect':
            if supplied != [None]:
                raise ValueError('图像分类异常图只归类一个整图场景，annotation_id填null')
        elif supplied:
            raise ValueError('良品图像不可新增缺陷类别或实例')
        if role == 'normal' and observation.normal is None:
            raise ValueError('良品图像须完成正常场景归类')
        if role is None:
            raise ValueError('原始良品/异常状态未确定，评分观察应标记不完整')

    def preview(self, run_id: str, request: dict | QualityAssessment) -> QualityScorePreview:
        from iad_core.audit.evidence import AuditEvidence
        from iad_core.audit.reports import AuditReports
        assessment = QualityAssessment.model_validate(request)
        snapshot = self.state.snapshot(run_id)
        if snapshot.quality_score_version is None:
            raise ValueError('历史审计不追加评分，请新建审计作业')
        samples = self.state.samples(run_id)
        records = {record.sample.sample_id: record for record in snapshot.manifest.records}
        images = []
        for sample in samples:
            record, final = records[sample.sample_id], sample.result
            observation = final.quality_observation if final else None
            if observation:
                self.validate_observation(record, observation)
            labels = {item.annotation_id: item.raw_label for item in record.annotations}
            images.append(QualityImage(sample_id=sample.sample_id, dataset_id=record.sample.dataset_id,
                completed=sample.state == 'COMPLETED' and final is not None and final.execution_status == 'completed',
                findings=[item.type for item in final.findings] if final else [],
                observation_complete=observation.complete if observation else False,
                is_normal=AnalysisSourceRoles.resolve(record.dataset_format, record.sample.quality_status,
                    record.sample.annotation_availability.status, len(record.annotations)) == 'normal',
                defects=[QualityDefect(**item.model_dump(), category=labels[item.annotation_id]
                    if item.annotation_id is not None else record.sample.quality_status.value)
                    for item in observation.defects] if observation and observation.complete else [],
                normal=observation.normal if observation and observation.complete else None))
        keys = [(item.axis, item.source) for item in assessment.aliases]
        if len(keys) != len(set(keys)):
            raise ValueError('同一评分场景只能有一个归并名称')
        reports, seen = AuditReports(self.db), set()
        observed = reports.observed(run_id)
        evidence = AuditEvidence(self.state)
        for group in assessment.redundant_groups:
            reports.validate_references(run_id, group.members, current_only=True)
            identities = [item.sample_id for item in group.members]
            if len(set(identities)) != len(identities) or seen.intersection(identities):
                raise ValueError('低信息增量图组成员不能重复或跨组重叠')
            seen.update(identities)
        required = seen | ({identity for pair in snapshot.dataset_profile.near_candidate_members for identity in pair}
            if assessment.redundancy_reviewed else set())
        for identity in sorted(required):
            if evidence.prepare(run_id, identity, identity).evidence_id not in observed:
                raise ValueError('低信息增量判断须由主 Agent 实际观察相关完整原图')
        score = AuditQualityScorer().score(images, snapshot.settings.quality_score_weights,
            exact_groups=snapshot.dataset_profile.strict_duplicate_members,
            redundant_groups=[[item.sample_id for item in group.members] for group in assessment.redundant_groups]
                if assessment.redundancy_reviewed else None, aliases=assessment.aliases)
        payload = {'assessment': assessment.model_dump(exclude={'preview_id'}),
            'versions': {sample.sample_id: sample.result_revision for sample in samples},
            'score': score.model_dump()}
        preview_id = hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        return QualityScorePreview(assessment=assessment.model_copy(update={'preview_id': preview_id}), score=score)

    def finalize(self, run_id: str, assessment: QualityAssessment | None) -> QualityScore:
        if self.state.snapshot(run_id).quality_score_version != QUALITY_SCORE_VERSION:
            raise ValueError('评分规则已更新，请新建审计作业')
        preview = self.preview(run_id, assessment or QualityAssessment(redundancy_reviewed=False))
        if assessment is not None and assessment.preview_id != preview.assessment.preview_id:
            raise ValueError('评分预览已变化，请重新调用 audit_quality_score 并原样提交 assessment')
        return preview.score

    def recalculate(self, run_id: str) -> QualityScore:
        from iad_core.audit.presentation import AuditPresentation
        from iad_core.audit.queries import AuditQueries
        from iad_core.audit.report_models import AuditStoredReport
        from iad_core.workbench.audit_html import AuditHtmlReport

        with self.db.connection() as connection:
            original = connection.execute('SELECT r.result_json,w.snapshot_json,j.status FROM audit_report_runs r '
                'JOIN audit_workflow_runs w USING(job_id) JOIN job_runs j USING(job_id) WHERE r.job_id=?', (run_id,)).fetchone()
        if original is None or original['status'] != 'COMPLETED':
            raise ValueError('只能重新计算已完成的评分报告')
        stored = AuditStoredReport.model_validate_json(original['result_json'])
        if stored.quality_score is None:
            raise ValueError('历史审计没有完整评分观察，不追加评分')
        preview = self.preview(run_id, stored.quality_assessment)
        if preview.score.status != 'complete':
            raise ValueError('评分证据不完整，不能更新已完成报告')
        stored = stored.model_copy(update={'quality_score':preview.score, 'quality_assessment':preview.assessment})
        queries = AuditQueries(self.db)
        report = AuditPresentation(queries).report(run_id, quality_score=preview.score)
        html = AuditHtmlReport(queries).render(run_id, report=report)['html']
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            current = connection.execute('SELECT status FROM job_runs WHERE job_id=?', (run_id,)).fetchone()
            if current is None or current['status'] != 'COMPLETED':
                raise ValueError('作业状态已变化，未更新评分')
            result = connection.execute('UPDATE audit_report_runs SET result_json=? WHERE job_id=? AND result_json=?',
                (stored.model_dump_json(exclude_computed_fields=True), run_id, original['result_json']))
            workflow = connection.execute("UPDATE audit_workflow_runs SET snapshot_json=json_set(snapshot_json,'$.quality_score_version',?),"
                'summary_json=?,report_html=? WHERE job_id=? AND snapshot_json=?',
                (QUALITY_SCORE_VERSION, report.model_dump_json(exclude_computed_fields=True), html, run_id, original['snapshot_json']))
            if result.rowcount != 1 or workflow.rowcount != 1:
                raise ValueError('评分输入已变化，未更新评分')
        return preview.score
