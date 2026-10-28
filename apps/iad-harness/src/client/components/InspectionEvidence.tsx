import React from "react";
import { AuditEvidence } from "./AuditEvidence.js";
import { FindingExplanation } from "./AuditFindings.js";
import { MediaLoad, MediaImage } from "./MediaLoad.js";
import { InspectionQuestion } from "./InspectionQuestion.js";
import {useWorkspace} from '../workspace.js';
import type { AuditAnalysis, AuditFinding } from "../../shared/contracts.js";
import { auditEvidenceUrl, regionSources } from "../api.js";

import { resolveInspection, type InspectionContext, type InspectionSelection, type InspectionTransform } from "../inspection.js";

export function InspectionOverlay({ inspection, selectedId, hoveredIds, regions, finding }: {
  inspection: InspectionContext; selectedId: string; hoveredIds: string[]; regions: AuditAnalysis["regions"]; finding?: AuditFinding;
}) {
  const { analysis } = inspection;
  return <><svg className="iad-roi-layer" viewBox={`0 0 ${analysis.overview.original_size.join(" ")}`} preserveAspectRatio="none" aria-label="审计区域">
    {regions.map(region => {
      const [x1, y1, x2, y2] = region.crop_bbox;
      return <g key={region.image.evidence_id} data-evidence-id={region.image.evidence_id} data-locked={selectedId === region.image.evidence_id} className={hoveredIds.includes(region.image.evidence_id) ? "is-hovered" : ""}>
        <rect x={x1} y={y1} width={x2-x1} height={y2-y1} />
      </g>;
    })}
  </svg>{finding?.location.scope === "local" && <svg className="iad-finding-layer" data-finding-id={finding.finding_id}
    viewBox={`0 0 ${analysis.overview.original_size.join(" ")}`} preserveAspectRatio="none" aria-label={finding.location.description}>
    <rect x={finding.location.bbox[0]} y={finding.location.bbox[1]} width={finding.location.bbox[2]-finding.location.bbox[0]} height={finding.location.bbox[3]-finding.location.bbox[1]} />
  </svg>}</>;
}

export function InspectionPanel({ inspection, selection, onSelect, choices, transform }: {
  inspection: InspectionContext; selection: InspectionSelection | null; onSelect(target: InspectionSelection | null): void; choices: string[]; transform(): InspectionTransform;
}) {
  const { analysis, reference } = inspection;
  const {workspace,state} = useWorkspace();
  const suggestionId = reference.suggestion_id;
  const { finding, evidence, region } = resolveInspection(analysis, selection);
  const selectedId = region?.image.evidence_id || "";
  const related = region ? analysis.findings.filter(finding => finding.evidence_ids.includes(region.image.evidence_id)) : [];
  return <aside className="iad-inspection-panel" aria-label="全图与 ROI 综合分析">
    {inspection.historical && <p role="status">历史建议 · 保留该次冻结知识与图像证据。</p>}
    <InspectionQuestion inspection={inspection} selection={selection} transform={transform} />
    {!!analysis.consistency?.results.length && <section aria-label="冻结一致性证据"><h3>数据一致性证据</h3>{analysis.consistency.results.map(result => <button key={result.result_id} onClick={() => workspace.openLocation({
      pageId:'industrial-consistency', tab:'search', query:{kind:'sample',sample_id:reference.sample_id},
      evidenceId:result.evidence_id,resultId:result.result_id,
      returnPage:state.pageId === 'industrial-consistency' ? undefined : state.pageId,
    })}>查看比较证据</button>)}</section>}
    <h2>综合建议</h2><p>{analysis.conclusion.description}</p>
    <p className="iad-muted">位置：{analysis.conclusion.position_analysis}<br />光照：{analysis.conclusion.illumination_analysis}</p>
    {!!analysis.findings.length && <label className="iad-field">审计疑点<select aria-label="审计疑点" value={finding?.finding_id || ""} onChange={event => onSelect(event.target.value ? { kind: "finding", id: event.target.value } : null)}>
      <option value="">选择疑点</option>{analysis.findings.map(item => <option key={item.finding_id} value={item.finding_id}>{item.location.scope === "global" ? "全图" : "局部"} · {item.location.description} · {item.description}</option>)}
    </select></label>}
    {finding && <section className="iad-inspection-finding" data-finding-id={finding.finding_id}>
      <h3>{finding.location.scope === "global" ? "全图关系" : "局部疑点"} · {finding.location.description}</h3>
      <p>{finding.description}</p><FindingExplanation finding={finding} /><p>{finding.review_action}</p>
      <AuditEvidence analysis={analysis} ids={finding.evidence_ids} label={finding.description} selectedId={evidence?.evidence_id || region?.image.evidence_id} onEvidence={image => onSelect({ kind: "evidence", id: image.evidence_id, findingId: finding.finding_id })} />
    </section>}
    {!!choices.length && <div role="group" aria-label="重叠区域"><h3>选择重叠区域</h3>{analysis.regions.filter(item => choices.includes(item.image.evidence_id)).map(item => <button key={item.image.evidence_id} onClick={() => onSelect({ kind: "evidence", id: item.image.evidence_id })}>{item.label} · {item.crop_bbox.join(", ")}</button>)}</div>}
    <div className="iad-roi-list" aria-label="审计 ROI">{analysis.regions.map((item,index) => <button key={item.image.evidence_id} aria-label={`定位 ROI ${index+1}`} aria-pressed={selectedId === item.image.evidence_id} onClick={() => onSelect({ kind: "evidence", id: item.image.evidence_id })}>ROI {index+1} · {item.label}</button>)}</div>
    {region ? <section className="iad-inspection-region" data-evidence-id={region.image.evidence_id}>
      <h3>{regionSources[region.source]} · {region.label}</h3>
      <MediaLoad key={region.image.evidence_id}><MediaImage src={auditEvidenceUrl(suggestionId,region.image)} alt="所选 ROI 的实际送模裁图" data-media-label="ROI 裁图" /></MediaLoad>
      <dl><dt>原图区域</dt><dd>{region.bbox.join(", ")}</dd><dt>外扩裁图</dt><dd>{region.crop_bbox.join(", ")}</dd></dl>
      <p>{region.observation.description}</p><p>位置：{region.observation.position_analysis}</p><p>光照：{region.observation.illumination_analysis}</p>
      {!finding && !!related.length && <div className="iad-related-findings iad-actions" aria-label="ROI 关联疑点">{related.map(item => <button key={item.finding_id} data-finding-id={item.finding_id} onClick={() => onSelect({ kind: "finding", id: item.finding_id })}>{item.location.description} · {item.description}</button>)}</div>}
    </section> : !evidence && !finding && <p className="iad-muted">点选图中区域或 ROI 按钮查看实际裁图。</p>}
    {evidence && evidence.representation !== "raw" && <section className="iad-inspection-mask" data-evidence-id={evidence.evidence_id}>
      <h3>{evidence.representation === "annotation_mask" ? "标注定位图" : "标注叠加图"}</h3>
      <MediaLoad key={evidence.evidence_id}><MediaImage src={auditEvidenceUrl(suggestionId,evidence)} alt="所选标注的实际送模图" data-media-label="标注证据" /></MediaLoad>
      <p>原图坐标：{evidence.crop_bbox.join(", ")}</p>
    </section>}
    {evidence?.role === "overview" && <section className="iad-inspection-overview" data-evidence-id={evidence.evidence_id}>
      <h3>全图观察</h3><p>{analysis.global_view.description}</p><p>位置：{analysis.global_view.position_analysis}</p><p>光照：{analysis.global_view.illumination_analysis}</p>
    </section>}
    <details><summary>版本与证据范围</summary><p><code>{analysis.normal_version_id}</code></p><p>实际细看 {analysis.coverage.inspected_regions} / {analysis.coverage.planned_regions} 个 ROI</p>{analysis.coverage.missing.map((item,index) => <p key={index}>{item}</p>)}</details>
  </aside>;
}
