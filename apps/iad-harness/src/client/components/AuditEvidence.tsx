import React from "react";
import type { AuditAnalysis, VisualEvidence } from "../../shared/contracts.js";

export function AuditEvidence({ analysis, ids, label, onEvidence }: {
  analysis: AuditAnalysis; ids: string[]; label: string; onEvidence(image: VisualEvidence): void;
}) {
  const images = new Map([analysis.overview, ...analysis.regions.map(region => region.image), ...analysis.auxiliary_evidence]
    .map(image => [image.evidence_id, image] as const));
  return <div className="iad-actions">{ids.map((id, index) => {
    const image = images.get(id);
    return <button key={id} data-evidence-id={id} disabled={!image} onClick={() => image && onEvidence(image)}
      aria-label={`查看${label}的证据 ${index + 1}`}>
      证据 {index + 1} · {!image ? "不可用" : image.representation === "annotation_mask" ? "定位图" : image.role === "overview" ? "全图" : "ROI"}
    </button>;
  })}</div>;
}
