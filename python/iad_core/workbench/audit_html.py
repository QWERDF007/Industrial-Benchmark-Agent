import base64
from html import escape
from pathlib import Path

from iad_core.evidence.images import EvidenceImages
from iad_core.workbench.audit_result_models import AuditSampleQuery
from iad_core.workbench.audit_result_models import AUDIT_STATE_LABELS as STATE_LABELS
from iad_core.workbench.audit_results import AuditResults

class AuditHtmlReport:
    def __init__(self, results: AuditResults):
        self.results = results

    def render(self, run_id: str) -> dict[str, str]:
        report = self.results.report(run_id)
        if report.status in ('PENDING', 'RUNNING'):
            raise ValueError('请等待作业结束后导出冻结报告')
        scope = []
        for page in range(1, (report.total_samples + 199) // 200 + 1):
            scope.extend(self.results.samples(AuditSampleQuery(run_id=run_id, page=page, page_size=200)).items)
        rows = ''.join(f'<tr><td>{escape(item.filename)}</td><td>{STATE_LABELS[item.audit_state]}</td></tr>' for item in scope)
        evidence = []
        images = EvidenceImages(self.results.db.db_path)
        for item in report.key_evidence:
            detail = self.results.sample(run_id, item.sample_id)
            analysis = detail.suggestion.analysis if detail.suggestion else None
            if not analysis:
                continue
            visuals = {image.evidence_id: image for image in [analysis.overview,
                *[region.image for region in analysis.regions], *analysis.auxiliary_evidence]}
            requested = list(dict.fromkeys([analysis.overview.evidence_id,
                *[eid for finding in analysis.findings for eid in finding.evidence_ids]]))
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
            explanation = ''.join(f'<li>{escape(finding.description)}：{escape(finding.normal_explanation)}</li>'
                                  for finding in analysis.findings)
            limits = ''.join(f'<li>{escape(value)}</li>' for value in
                [*analysis.conclusion.missing_evidence, *analysis.conclusion.conflicts, *analysis.knowledge_limitations])
            evidence.append(f'<article><h3>{escape(item.filename)} — {STATE_LABELS[item.audit_state]}</h3>'
                f'<p>{escape(analysis.conclusion.description)}</p><ul>{explanation}</ul>'
                f'<div class="evidence">{"".join(figures)}</div><ul>{limits}</ul></article>')
        distribution = ''.join(f'<li>{STATE_LABELS[state]}：{count}</li>' for state, count in report.distribution.items())
        limitations = ''.join(f'<li>{escape(value)}</li>' for value in report.limitations)
        coverage = '无法评估' if report.coverage_percent is None else f'{report.coverage_percent}%'
        html = f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>模型审计报告 {escape(run_id)}</title>
<style>body{{font:13px/1.65 system-ui,sans-serif;color:#172338;max-width:1380px;margin:32px auto;padding:0 24px}}h1{{font-size:24px}}h2{{font-size:16px;margin-top:28px}}h3{{font-size:14px}}dt{{font-weight:600}}dd{{margin:0 0 8px;overflow-wrap:anywhere}}table{{border-collapse:collapse;width:100%}}td,th{{text-align:left;padding:8px;border-bottom:1px solid #dbe2eb}}.metrics{{display:flex;gap:24px;flex-wrap:wrap}}.evidence{{display:flex;gap:12px;flex-wrap:wrap}}figure{{margin:0;max-width:320px}}img{{width:100%;max-height:220px;object-fit:contain}}figcaption{{overflow-wrap:anywhere}}article{{break-inside:avoid;margin-bottom:24px}}@media print{{body{{margin:0}}}}</style>
<h1>模型审计报告</h1><dl><dt>作业</dt><dd>{escape(run_id)}</dd><dt>模型</dt><dd>{escape(report.model_name or '未记录')}</dd>
<dt>知识版本</dt><dd>{escape(report.knowledge_version_id or '未记录')}</dd>
<dt>提交时间</dt><dd>{escape(report.submitted_at)}</dd><dt>完成时间</dt><dd>{escape(report.finished_at or '未记录')}</dd>
<dt>报告生成时间</dt><dd>{escape(report.generated_at)}</dd></dl>
<div class="metrics"><p>已审计/总数：{report.audited_samples}/{report.total_samples}</p><p>审计覆盖率：{coverage}</p>
<p>发现疑点：{report.suspect_samples}</p><p>证据不足：{report.insufficient_samples}</p><p>一致性待核实：{report.consistency_pending_samples}</p></div>
<h2>整体分析</h2><p>{escape(report.analysis)}</p><h2>审计结论</h2><p>{escape(report.conclusion)}</p>
<h2>限制</h2><ul>{limitations}</ul><h2>结果分布</h2><ul>{distribution}</ul>
<h2>重点证据</h2>{''.join(evidence) or '<p>本作业没有可展示的审计图像证据。</p>'}
<h2>冻结样本范围</h2><table><thead><tr><th>文件名</th><th>审计状态</th></tr></thead><tbody>{rows}</tbody></table></html>'''
        return {'filename': f'audit-{run_id}.html', 'html': html}
