import json
import re
from collections import Counter
from typing import TypeVar

from pydantic import BaseModel

from iad_core.audit.report_models import AuditReportImage
from iad_core.dataset.registry import DatasetRegistry
from iad_core.workbench.audit_result_models import AuditRunReport

ModelT = TypeVar('ModelT',bound=BaseModel)

class AuditNarrative:
    TEXT_FIELDS = frozenset({'analysis','conclusion','basis','limitations','description','location',
        'normal_explanation','reason','consistency_analysis',
        'knowledge_analysis','coverage_analysis','independence_analysis','review_priorities','visual_signature','annotation_relation','scope','key_difference','unresolved_question','next_batch_focus','missing_conditions','title',
        'observation','comparison','significance','summary','observation_and_comparison','evaluation_value','applicability','audit_impact','audit_result'})

    def __init__(self, state, run_id):
        snapshot = state.snapshot(run_id)
        self.names = {run_id:'本次审计',snapshot.consistency_job_id:'本次一致性检查',
            'VALID_EMPTY':'空标注','knowledge=null':'未选用知识'}
        registry = DatasetRegistry(state.db)
        self.dataset_names = {key:registry.get(key).dataset.name for key in snapshot.manifest.dataset_ids}
        self.names.update(self.dataset_names)
        self.knowledge_titles = {}
        if snapshot.knowledge:
            self.names.update({snapshot.knowledge.selection.job_id:'所选知识挖掘作业',
                snapshot.knowledge.selection.version_id:'所选知识版本'})
            self.knowledge_titles = {item.check.check_id:item.check.title for item in snapshot.knowledge.entries}
            self.names.update(self.knowledge_titles)
        for index, record in enumerate(snapshot.manifest.records,1):
            self.names.update({record.sample.sample_id:f'图像 {index}',record.sample.image_path:f'图像 {index}',
                record.sample.relative_path:f'图像 {index}'})
            for number, annotation in enumerate(record.annotations,1):
                self.names.setdefault(annotation.annotation_id,f'标注 {number}')
                self.names.setdefault(annotation.annotation_id.rsplit(':',1)[-1],f'标注 {number}')
        for sample in state.samples(run_id):
            self.names[sample.session_id] = '图级审核会话'
            for reference in [*sample.consistency.evidence,*sample.consistency.captured_evidence]:
                self.names.setdefault(reference.candidate_id,'关联候选图')
                self.names[reference.evidence_id] = '关联图像证据'
                self.names[reference.result_id] = '关联对照记录'
                self.names[reference.detail_ref] = '关联对照记录'
            if sample.consistency.result:
                for issue in sample.consistency.result.issues:
                    self.names[issue.issue_id] = '上游差异'
            if sample.result:
                for finding in sample.result.findings:
                    self.names[finding.finding_id] = '本图疑点'
        with state.db.connection() as connection:
            report = connection.execute('SELECT session_id FROM audit_report_runs WHERE job_id=?',(run_id,)).fetchone()
            if report:
                self.names[report[0]] = '报告会话'
            latest=connection.execute('SELECT submission_json FROM audit_global_versions WHERE job_id=? ORDER BY revision DESC LIMIT 1',(run_id,)).fetchone()
            if latest:
                self.names.update({group['group_id']:group['title'] for group in json.loads(latest[0])['discoveries']})
            for row in connection.execute('SELECT media_json FROM audit_sample_media WHERE job_id=?',(run_id,)):
                from iad_core.evidence.registrations import PreparedRegistration
                for item in PreparedRegistration.model_validate_json(row[0]).images:
                    self.names[item.image.evidence_id] = '原图证据' if item.image.is_whole_image else '所属原图证据'
        self.pattern = re.compile(r'(?<![A-Za-z0-9_])(?:'+'|'.join(re.escape(key) for key in sorted(self.names,key=len,reverse=True) if key)+r')(?![A-Za-z0-9_])')

    def text(self, value: str) -> str:
        return self.pattern.sub(lambda match:self.names[match[0]],value)

    def project(self, model: ModelT) -> ModelT:
        def walk(value, field=''):
            if isinstance(value,str):
                return self.text(value) if field in self.TEXT_FIELDS else value
            if isinstance(value,list):
                return [walk(item,field) for item in value]
            if isinstance(value,dict):
                return {key:item if key in {'source','image','statistics','dataset_names','knowledge_titles','entry'} else walk(item,key) for key,item in value.items()}
            return value
        return type(model).model_validate(walk(model.model_dump(exclude_computed_fields=True)))


class AuditPresentation:
    def __init__(self, queries):
        self.queries = queries

    def knowledge_evidence(self, report: AuditRunReport) -> AuditRunReport:
        knowledge = self.queries.state.snapshot(report.run_id).knowledge
        if knowledge is None or all('knowledge-source:'+entry.check.check_id in report.evidence_groups for entry in knowledge.entries):
            return report
        from iad_core.analysis.queries import AnalysisQueries
        from iad_core.knowledge.display_evidence import KnowledgeDisplayEvidence
        display = KnowledgeDisplayEvidence(knowledge.evidence)
        records = {record.sample.sample_id:record for record in AnalysisQueries(self.queries.db).registrations(knowledge.selection.version_id)}
        groups = dict(report.evidence_groups)
        for entry in knowledge.entries:
            check = entry.check
            counters = {item.image.evidence_id for item in display.images(check.counter_evidence_ids)}
            reasons = {item.evidence_id:item.reason for item in check.key_evidence or []}
            selected = display.images([*(item.evidence_id for item in check.key_evidence or []),*entry.evidence_ids])[:8]
            groups['knowledge-source:'+check.check_id] = [AuditReportImage(sample_id=item.sample_id,
                role='counter' if item.image.evidence_id in counters else 'representative',caption='知识图像证据',
                reason=reasons.get(item.image.evidence_id,check.criterion),image=item.image,source=records[item.sample_id])
                for item in selected]
        return report.model_copy(update={'evidence_groups':groups})

    def report(self, run_id):
        from iad_core.audit.evidence import AuditEvidence
        report = self.queries.report_data(run_id)
        narrative = AuditNarrative(self.queries.state,run_id)
        evidence = AuditEvidence(self.queries.state)
        groups = {}
        evidence_sets=[('case:'+item.case_id,item.representatives) for item in report.report_cases]
        if not report.report_cases:
            evidence_sets.extend((item.group_id,item.representatives) for item in report.discoveries)
        if not report.capability_topics:
            evidence_sets.extend(('capability:'+item.tag,item.representatives) for item in report.capabilities)
        evidence_sets.extend((f'coverage:{index}',item.representatives) for index,item in enumerate(report.coverage_topics) if not item.related_case_ids)
        evidence_sets.extend(('consistency:'+item.issue_type,item.representatives) for item in report.consistency_analyses if not item.related_case_ids)
        evidence_sets.extend(('knowledge:'+item.entry.check.check_id,item.analysis.representatives)
            for item in report.knowledge_entries if item.analysis)
        evidence_sets.extend(('scope:'+item.source_status,item.representatives) for item in report.consistency_scopes)
        for group_id,representatives in evidence_sets:
            images, counts = [], Counter()
            for reference in representatives:
                media = evidence.prepare(run_id,reference.sample_id,reference.sample_id)
                image = next((item for item in media.images if item.image.is_whole_image and item.image.representation=='raw'),None)
                if image is None:
                    raise LookupError('报告引用的完整原图及原始标注未持久化')
                counts[reference.role] += 1
                caption = ('典型证据' if reference.role=='representative' else '对照证据')+f' {counts[reference.role]}'
                images.append(AuditReportImage(sample_id=reference.sample_id,role=reference.role,caption=caption,
                    reason=narrative.text(reference.reason),image=image.image,
                    source=self.queries.state.record(run_id,reference.sample_id,reference.sample_id)))
            groups[group_id] = images
        return self.knowledge_evidence(narrative.project(report.model_copy(update={'dataset_names':narrative.dataset_names,
            'knowledge_titles':narrative.knowledge_titles,'evidence_groups':groups})))
