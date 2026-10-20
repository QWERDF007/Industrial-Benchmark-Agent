import React from "react";
import type { AuditAnalysis } from "../../shared/contracts.js";
import { auditEvidenceUrl, regionSources } from "../api.js";

export interface InspectionContext { suggestionId: string; analysis: AuditAnalysis }

export function InspectionOverlay({ inspection, selectedId, hoveredIds, annotationsVisible }: {
  inspection: InspectionContext; selectedId: string; hoveredIds: string[]; annotationsVisible: boolean;
}) {
  const { analysis } = inspection;
  return <svg className="iad-roi-layer" viewBox={`0 0 ${analysis.overview.original_size.join(" ")}`} preserveAspectRatio="none" aria-label="审计区域">
    {analysis.regions.map(region => {
      if (!annotationsVisible && region.source === "annotation") return null;
      const [x1, y1, x2, y2] = region.crop_bbox;
      return <g key={region.image.evidence_id} data-evidence-id={region.image.evidence_id} data-locked={selectedId === region.image.evidence_id} className={hoveredIds.includes(region.image.evidence_id) ? "is-hovered" : ""}>
        <rect x={x1} y={y1} width={x2-x1} height={y2-y1} />
      </g>;
    })}
  </svg>;
}

export function InspectionPanel({ inspection, selectedId, onSelect, choices }: {
  inspection: InspectionContext; selectedId: string; onSelect(id: string): void; choices: string[];
}) {
  const { analysis, suggestionId } = inspection;
  const region = analysis.regions.find(region => region.image.evidence_id === selectedId);
  const related = region ? analysis.findings.filter(finding => finding.evidence_ids.includes(region.image.evidence_id)) : [];
  return <aside className="iad-inspection-panel" aria-label="全图与 ROI 综合分析">
    <h2>综合建议</h2><p>{analysis.conclusion.description}</p>
    <p className="iad-muted">位置：{analysis.conclusion.position_analysis}<br />光照：{analysis.conclusion.illumination_analysis}</p>
    {!!choices.length && <div role="group" aria-label="重叠区域"><h3>选择重叠区域</h3>{analysis.regions.filter(item => choices.includes(item.image.evidence_id)).map(item => <button key={item.image.evidence_id} onClick={() => onSelect(item.image.evidence_id)}>{item.label} · {item.crop_bbox.join(", ")}</button>)}</div>}
    <div className="iad-roi-list" aria-label="审计 ROI">{analysis.regions.map((item,index) => <button key={item.image.evidence_id} aria-label={`定位 ROI ${index+1}`} aria-pressed={selectedId === item.image.evidence_id} onClick={() => onSelect(item.image.evidence_id)}>ROI {index+1} · {item.label}</button>)}</div>
    {region ? <section className="iad-inspection-region" data-evidence-id={region.image.evidence_id}>
      <h3>{regionSources[region.source]} · {region.label}</h3>
      <img src={auditEvidenceUrl(suggestionId,region.image)} alt="所选 ROI 的实际送模裁图" />
      <dl><dt>原图区域</dt><dd>{region.bbox.join(", ")}</dd><dt>外扩裁图</dt><dd>{region.crop_bbox.join(", ")}</dd></dl>
      <p>{region.observation.description}</p><p>位置：{region.observation.position_analysis}</p><p>光照：{region.observation.illumination_analysis}</p>
      {related.slice(0,3).map(finding => <div key={finding.finding_id}><p>{finding.description}</p><p>正常解释：{finding.normal_explanation}</p><p className="iad-muted">{finding.limitations.join("；")}</p><p>{finding.review_action}</p></div>)}
    </section> : <p className="iad-muted">点选图中区域或 ROI 按钮查看实际裁图。</p>}
    <details><summary>版本与证据范围</summary><p><code>{analysis.normal_version_id}</code></p><p>实际细看 {analysis.coverage.inspected_regions} / {analysis.coverage.planned_regions} 个 ROI</p>{analysis.coverage.missing.map((item,index) => <p key={index}>{item}</p>)}</details>
  </aside>;
}
