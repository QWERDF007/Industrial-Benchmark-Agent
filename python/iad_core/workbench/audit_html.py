import base64
import json
from importlib.resources import files
from pathlib import Path

from iad_core.evidence.images import EvidenceImages
from iad_core.workbench.audit_result_models import AuditRunReport
from iad_core.audit.queries import AuditQueries


class AuditHtmlReport:
    def __init__(self, results: AuditQueries):
        self.results = results

    def render(self, run_id: str, *, report: AuditRunReport | None = None) -> dict[str, str]:
        report = report or self.results.report(run_id)
        if report.status in ('PENDING','RUNNING'):
            raise ValueError('请等待作业结束后导出冻结报告')
        images = {}
        retained = EvidenceImages(self.results.db.db_path)
        for group in report.evidence_groups.values():
            for item in group:
                image = item.image
                if not image.is_whole_image or image.representation != 'raw':
                    raise ValueError('报告证据只展示完整原图')
                if image.evidence_id not in images:
                    encoded = base64.b64encode(Path(retained.path(image)).read_bytes()).decode('ascii')
                    images[image.evidence_id] = f'data:{image.media_type};base64,{encoded}'
        payload = json.dumps(dict(report=report.model_dump(mode='json'),images=images),ensure_ascii=False,
            separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
        runtime = files('iad_core.workbench').joinpath('assets/audit-report.js').read_text(encoding='utf-8')
        runtime = runtime.replace('</script','<\\/script')
        html = ('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1"><title>模型审计报告</title></head>'
            '<body><div id="audit-offline-root"></div><script id="audit-report-data" type="application/json">'
            +payload+'</script><script>'+runtime+'</script></body></html>')
        return dict(filename=f'audit-{run_id}.html',html=html)
