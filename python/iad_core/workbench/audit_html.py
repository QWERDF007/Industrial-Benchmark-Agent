import base64
from html import escape
from pathlib import Path

from iad_core.evidence.images import EvidenceImages
from iad_core.workbench.audit_result_models import AuditSampleQuery, AuditRunReport
from iad_core.workbench.audit_result_models import AUDIT_STATE_LABELS as STATE_LABELS
from iad_core.audit.queries import AuditQueries

class AuditHtmlReport:
    def __init__(self, results: AuditQueries):
        self.results = results

    def render(self, run_id: str, *, report: AuditRunReport | None = None) -> dict[str, str]:
        report = report or self.results.report(run_id)
        if report.status in ('PENDING', 'RUNNING'):
            raise ValueError('请等待作业结束后导出冻结报告')
        scope = []
        for page in range(1, (report.total_samples + 199) // 200 + 1):
            query = AuditSampleQuery(run_id=run_id, page=page, page_size=200)
            scope.extend(self.results.samples(query).items)
        rows = ''.join(f'<tr><td>{escape(item.filename)}</td><td>{STATE_LABELS[item.audit_state]}</td></tr>' for item in scope)
        evidence = []
        images = EvidenceImages(self.results.db.db_path)
        for item in report.key_evidence:
            detail = self.results.sample(run_id, item.sample_id)
            final = detail.final
            if final is None:
                continue
            visuals = {item.image.evidence_id:item.image for item in detail.evidence}
            requested = list(dict.fromkeys([*final.evidence_ids,
                *[eid for finding in final.findings for eid in finding.evidence_ids],
                *[eid for check in final.check_assessments for eid in check.evidence_ids]]))
            explanation = ''.join(f'<li>{escape(finding.description)}（{escape(finding.location)}）：{escape(finding.normal_explanation)}'
                f'{"；".join(escape(value) for value in finding.limitations)}</li>' for finding in final.findings)
            checks = ''.join(f'<li>{escape(check.check_id)}：{escape(check.status)}，{escape(check.description)}</li>' for check in final.check_assessments)
            explanation += checks
            conclusion = final.conclusion
            paragraphs = [final.analysis, *final.basis]
            limitations = final.limitations
            upstream = f'<p>一致性作业：{escape(detail.consistency.job_id)}；主图：{escape(detail.consistency.anchor_id)}；原因：{escape(detail.consistency.reason)}</p>'
            figures = []
            for evidence_id in requested:
                image = visuals.get(evidence_id)
                if image is None:
                    raise LookupError('审计结果引用的冻结图像证据未持久化')
                try:
                    payload = Path(images.path(image)).read_bytes()
                except FileNotFoundError as error:
                    raise LookupError('冻结审计图像证据缺失，无法导出完整报告') from error
                encoded = base64.b64encode(payload).decode('ascii')
                figures.append(f'<figure><img src="data:image/png;base64,{encoded}" alt="{escape(item.filename, quote=True)}">'
                    f'<figcaption>{escape(evidence_id)}</figcaption></figure>')
            limits = ''.join(f'<li>{escape(value)}</li>' for value in limitations)
            evidence.append(f'<article><h3>{escape(item.filename)} — {STATE_LABELS[item.audit_state]}</h3>'
                f'<p>{escape(conclusion)}</p>{"".join(f"<p>{escape(value)}</p>" for value in paragraphs)}{upstream}<ul>{explanation}</ul>'
                f'<div class="evidence">{"".join(figures)}</div><ul>{limits}</ul></article>')
        distribution = ''.join(f'<li>{STATE_LABELS[state]}：{count}</li>' for state, count in report.distribution.items())
        limitations = ''.join(f'<li>{escape(value)}</li>' for value in report.limitations)
        coverage = '无法评估' if report.coverage_percent is None else f'{report.coverage_percent}%'
        html = f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>模型审计报告 {escape(run_id)}</title>
<style>body{{font:13px/1.65 system-ui,sans-serif;color:#172338;max-width:1380px;margin:32px auto;padding:0 24px}}h1{{font-size:24px}}h2{{font-size:16px;margin-top:28px}}h3{{font-size:14px}}dt{{font-weight:600}}dd{{margin:0 0 8px;overflow-wrap:anywhere}}table{{border-collapse:collapse;width:100%}}td,th{{text-align:left;padding:8px;border-bottom:1px solid #dbe2eb}}.metrics{{display:flex;gap:24px;flex-wrap:wrap}}.evidence{{display:flex;gap:12px;flex-wrap:wrap}}figure{{margin:0;max-width:320px}}img{{width:100%;max-height:220px;object-fit:contain}}figcaption{{overflow-wrap:anywhere}}article{{break-inside:avoid;margin-bottom:24px}}@media print{{body{{margin:0}}}}</style>
<h1>模型审计报告</h1><dl><dt>作业</dt><dd>{escape(run_id)}</dd><dt>模型</dt><dd>{escape(report.model_name or '未记录')}</dd>
<dt>知识版本</dt><dd>{escape(report.knowledge_version_id or '未选用知识')}</dd>
<dt>提交时间</dt><dd>{escape(report.submitted_at)}</dd><dt>完成时间</dt><dd>{escape(report.finished_at or '未记录')}</dd>
<dt>报告生成时间</dt><dd>{escape(report.generated_at)}</dd></dl>
<div class="metrics"><p>已审计/总数：{report.audited_samples}/{report.total_samples}</p><p>审计覆盖率：{coverage}</p>
<p>发现疑点：{report.suspect_samples}</p><p>证据不足：{report.insufficient_samples}</p><p>一致性待核实：{report.consistency_pending_samples}</p></div>
<h2>整体分析</h2><p>{escape(report.analysis)}</p><h2>审计结论</h2><p>{escape(report.conclusion)}</p>
<h2>限制</h2><ul>{limitations}</ul><h2>结果分布</h2><ul>{distribution}</ul>
<h2>重点证据</h2>{''.join(evidence) or '<p>本作业没有可展示的审计图像证据。</p>'}
<h2>冻结样本范围</h2><table><thead><tr><th>文件名</th><th>审计状态</th></tr></thead><tbody>{rows}</tbody></table></html>'''
        return {'filename': f'audit-{run_id}.html', 'html': html}
