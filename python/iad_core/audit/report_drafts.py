import json
from copy import deepcopy

from pydantic import Field, create_model

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.audit.report_models import AuditReportCommit
from iad_core.audit.reports import AuditReports


_draft_fields = {}
for _name, _field in AuditReportCommit.model_fields.items():
    if _name == 'commit_key':
        continue
    _definition = deepcopy(_field)
    _definition.default = None
    _definition.default_factory = None
    _draft_fields[_name] = (_field.annotation, _definition)
AuditReportFields = create_model('AuditReportFields', __base__=AnalysisModel, **_draft_fields)


class AuditReportDraftUpdate(AnalysisModel):
    base_revision: int = Field(ge=0)
    fields: AuditReportFields = Field(description='本次保存或修正的章节字段，省略的字段保持不变。先保存图像案例及引用，再逐章保存正文。')


class AuditReportDraft(AnalysisModel):
    revision: int
    fields: dict


class AuditReportFinalize(AnalysisModel):
    commit_key: NonBlankText
    draft_revision: int = Field(ge=1)


class AuditReportDrafts:
    def __init__(self, db):
        self.db = db
        self.reports = AuditReports(db)

    def read(self, run_id: str) -> AuditReportDraft:
        with self.db.connection() as connection:
            row = connection.execute('SELECT revision,fields_json FROM audit_report_drafts WHERE job_id=?', (run_id,)).fetchone()
        return AuditReportDraft(revision=row[0], fields=json.loads(row[1])) if row else AuditReportDraft(revision=0, fields={})

    def save(self, run_id: str, request: dict) -> AuditReportDraft:
        update = AuditReportDraftUpdate.model_validate(request)
        changes = update.fields.model_dump(mode='json', exclude_unset=True, exclude_computed_fields=True)
        if not changes:
            raise ValueError('至少提交一个章节字段')
        for name in update.fields.model_fields_set:
            value = getattr(update.fields, name)
            for section in value if isinstance(value, list) else []:
                if hasattr(section, 'evidence_refs'):
                    self.reports.validate_references(run_id, section.evidence_refs, current_only=True)
                    if section.representatives:
                        ids = {ref.sample_id for ref in section.evidence_refs}
                        self.reports.validate_gallery(run_id, section.representatives, {'representative':ids, 'counter':ids}, required=True)
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            state = connection.execute('SELECT state FROM audit_report_runs WHERE job_id=?', (run_id,)).fetchone()
            if state is None or state[0] != 'RUNNING':
                raise ValueError('只能保存正在生成的报告')
            current = self.read(run_id)
            if current.revision != update.base_revision:
                raise ValueError('报告草稿版本已变化，请重读后提交')
            result = AuditReportDraft(revision=current.revision+1, fields=current.fields | changes)
            connection.execute('INSERT INTO audit_report_drafts VALUES(?,?,?) ON CONFLICT(job_id) DO UPDATE SET revision=excluded.revision,fields_json=excluded.fields_json',
                (run_id, result.revision, json.dumps(result.fields, ensure_ascii=False)))
        return result

    def finalize(self, run_id: str, request: dict):
        command = AuditReportFinalize.model_validate(request)
        draft = self.read(run_id)
        if draft.revision != command.draft_revision:
            raise ValueError('报告草稿版本已变化，请重读后定稿')
        return self.reports.commit(run_id, draft.fields | {'commit_key':command.commit_key}, draft_revision=command.draft_revision)
