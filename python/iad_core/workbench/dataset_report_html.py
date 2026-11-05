import base64
from html import escape
from pathlib import Path

from iad_core.evidence.images import EvidenceImages
from iad_core.storage.database import Database
from iad_core.workbench.dataset_report_data import report_data
from iad_core.workbench.dataset_report_models import DatasetReportSnapshot
from iad_core.workbench.report_requirements import REPORT_REQUIREMENTS


class DatasetReportHtml:
    def __init__(self, db: Database):
        self.db = db

    def render(self, report: DatasetReportSnapshot) -> dict:
        statistics = report_data(report.facts)
        sections = []
        statuses = dict(evaluable='可评估', limited='限定评估', needs_evidence='待补证', unsupported='不支持该指标')
        for key, requirement in REPORT_REQUIREMENTS.items():
            section = report.conclusion.sections[key]
            data = [item for name in requirement['data'] for item in statistics[name]]
            rows = ''.join(f'<tr><td>{escape(item["label"])}</td><td>{escape(item["value"])}</td><td>{escape(item["basis"])}</td></tr>' for item in data)
            missing = ''.join(f'<li>{escape(item)}</li>' for item in section.missing_evidence)
            references = ''.join(f'<a href="#{escape(eid, quote=True)}">图像 {index+1}</a> '
                for index, eid in enumerate(dict.fromkeys(section.evidence_ids)))
            sections.append(f'<section><h2>{escape(requirement["title"])}</h2><p>{statuses[section.status]}</p>'
                f'<p>{escape(section.analysis)}</p><table><thead><tr><th>数据</th><th>数值/状态</th><th>口径</th></tr></thead><tbody>{rows}</tbody></table>'
                f'<p>{escape(section.conclusion)}</p><ul>{missing}</ul><p>{references}</p></section>')
        pictures = []
        images = EvidenceImages(self.db.db_path)
        seen = set()
        for case in report.facts.cases:
            analysis = case.analysis
            visuals = {image.evidence_id: image for image in [analysis.overview, *analysis.reference_evidence]}
            for source in analysis.image_sources:
                eid = source.overview_evidence_id
                if eid not in report.visual_evidence_ids or eid in seen:
                    continue
                seen.add(eid)
                image = visuals[eid]
                encoded = base64.b64encode(Path(images.path(image)).read_bytes()).decode('ascii')
                width, height = image.original_size
                overlays = []
                for annotation in source.annotations:
                    if annotation.geometry_status == 'INVALID':
                        continue
                    if annotation.annotation_type == 'mask':
                        mask_id = source.mask_evidence_ids.get(annotation.annotation_id)
                        if mask_id is None or mask_id not in visuals:
                            raise LookupError('冻结报告缺少标注 mask 图像')
                        mask = base64.b64encode(Path(images.path(visuals[mask_id])).read_bytes()).decode('ascii')
                        identity = escape(mask_id, quote=True)
                        overlays.append(f'<defs><mask id="{identity}" maskUnits="userSpaceOnUse" x="0" y="0" width="{width}" height="{height}" style="mask-type:luminance">'
                            f'<image href="data:image/png;base64,{mask}" width="{width}" height="{height}"/></mask></defs>'
                            f'<rect class="annotation-mask" width="{width}" height="{height}" mask="url(#{identity})"/>')
                    elif annotation.polygon:
                        points = ' '.join(','.join(str(value) for value in point) for point in annotation.polygon)
                        overlays.append(f'<polygon points="{points}"/>')
                    elif annotation.bbox:
                        x1,y1,x2,y2 = annotation.bbox
                        overlays.append(f'<rect x="{x1}" y="{y1}" width="{x2-x1}" height="{y2-y1}"/>')
                    if annotation.bbox:
                        x,y = annotation.bbox[:2]
                        overlays.append(f'<text x="{x}" y="{max(12,y-4)}">{escape(annotation.raw_label)}</text>')
                pictures.append(f'<figure id="{escape(eid, quote=True)}"><svg class="evidence-image" role="img" aria-label="冻结图像证据" viewBox="0 0 {width} {height}">'
                    f'<image href="data:image/png;base64,{encoded}" width="{width}" height="{height}"/><g class="annotations">{"".join(overlays)}</g></svg>'
                    f'<figcaption>{escape(eid)}</figcaption></figure>')
        conclusion = report.conclusion
        charts = []
        for title, values, labels in [
            ('审计覆盖',dict(audited=report.facts.audited_samples,not_processed=report.facts.registered_samples-report.facts.audited_samples),dict(audited='已审计',not_processed='未审计')),
            ('审计结果分布',report.facts.outcomes,dict(normal_candidate='未发现明确异常',anomaly_candidate='异常候选',insufficient='证据不足',not_processed='未处理')),
            ('原始标签分布',report.facts.raw_labels,dict(PASS='OK',FAIL='NG',UNCERTAIN='待定'))]:
            total = max(1,sum(values.values()))
            bars = ''.join(f'<div class="bar"><span>{escape(labels.get(key,key))}</span><meter min="0" max="{total}" value="{value}">{value}</meter><span>{value}</span></div>' for key,value in values.items())
            charts.append(f'<figure><figcaption>{title}</figcaption>{bars}</figure>')
        html = f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>数据集与模型能力报告</title><style>body{{font:14px/1.8 system-ui,sans-serif;max-width:1380px;margin:32px auto;padding:0 24px;color:#172338}}h1{{font-size:24px}}h2{{font-size:18px}}section{{margin:28px 0;break-inside:avoid}}table{{border-collapse:collapse;width:100%}}th,td{{text-align:left;padding:8px;border-bottom:1px solid #dbe2eb}}.pictures{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}}figure{{margin:0}}.evidence-image{{width:100%;height:320px;object-fit:contain}}figcaption{{overflow-wrap:anywhere}}p{{white-space:pre-wrap}}.annotations :is(rect,polygon){{fill:none;stroke:#ffb74c;stroke-width:2;vector-effect:non-scaling-stroke}}.annotations .annotation-mask{{fill:#ffb74c;fill-opacity:.45;stroke:none}}.annotations text{{fill:#fff;stroke:#152538;stroke-width:3;paint-order:stroke;font-size:12px}}.charts{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}}.bar{{display:grid;grid-template-columns:100px 1fr 40px;gap:8px;align-items:center}}meter{{width:100%}}@media(max-width:800px){{.charts{{grid-template-columns:1fr}}}}</style>
<h1>数据集与模型能力报告</h1><p>报告 {escape(report.run_id)}<br>冻结事实 {escape(report.facts.signature)}<br>生成时间 {escape(report.created_at)}</p>
<p>有效审计 {report.facts.audited_samples} / 登记 {report.facts.registered_samples}</p><div class="charts">{''.join(charts)}</div>
{''.join(sections)}<section><h2>数据集能力结论</h2><p>{escape(conclusion.dataset_analysis)}</p><p>{escape(conclusion.dataset_conclusion)}</p></section>
<section><h2>模型能力结论</h2><p>{escape(conclusion.model_analysis)}</p><p>{escape(conclusion.model_conclusion)}</p></section>
<section><h2>冻结图像证据</h2><div class="pictures">{''.join(pictures)}</div></section></html>'''
        return dict(filename=f'dataset-report-{report.run_id}.html', html=html)
