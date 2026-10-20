import React from "react";
import { auditImageIndex } from "../api.js";
import type { AuditAnalysis, VisualEvidence } from "../../shared/contracts.js";

export function AuditEvidence({ analysis, ids, label, onEvidence, selectedId }: {
  analysis: AuditAnalysis; ids: string[]; label: string; onEvidence(image: VisualEvidence): void; selectedId?: string;
}) {
  const images = auditImageIndex(analysis);
  return <div className="iad-actions">{ids.map((id, index) => {
    const image = images.get(id);
    return <button key={id} data-evidence-id={id} aria-current={id === selectedId ? "true" : undefined} disabled={!image} onClick={() => image && onEvidence(image)}
      aria-label={`查看${label}的证据 ${index + 1}`}>
      证据 {index + 1} · {!image ? "不可用" : image.representation === "annotation_mask" ? "定位图" : image.role === "overview" ? "全图" : "ROI"}
    </button>;
  })}</div>;
}
