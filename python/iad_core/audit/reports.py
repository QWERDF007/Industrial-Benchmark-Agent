from iad_core.audit.queries import AuditQueries
from iad_core.workbench.audit_html import AuditHtmlReport


class AuditReports:
    def __init__(self, db):
        self.db = db

    def finalize(self, run_id: str):
        with self.db.connection() as connection:
            row = connection.execute('SELECT report_html FROM audit_workflow_runs WHERE job_id=?', (run_id,)).fetchone()
        if row and row[0] is not None:
            return
        queries = AuditQueries(self.db)
        report = queries.report(run_id)
        if report.status in ('PENDING','RUNNING'):
            raise ValueError('作业尚未结束，不能生成最终报告')
        html = AuditHtmlReport(queries).render(run_id,report=report)['html']
        with self.db.connection() as connection:
            connection.execute('UPDATE audit_workflow_runs SET summary_json=?,report_html=? WHERE job_id=?', (report.model_dump_json(),html,run_id))
