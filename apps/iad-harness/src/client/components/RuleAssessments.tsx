import React from "react";
import type { AuditAnalysis, KnowledgeSummary, VisualEvidence } from "../../shared/contracts.js";

const statuses = { normal: "未见异常", anomaly: "发现偏离", insufficient: "证据不足", not_applicable: "不适用" };

export function RuleAssessments({ analysis, knowledge, onEvidence }: {
  analysis: AuditAnalysis; knowledge: KnowledgeSummary[]; onEvidence(image: VisualEvidence): void;
}) {
  const checks = new Map(knowledge.flatMap(snapshot => snapshot.checks.map(check => [check.check_id, check] as const)));
  const images = new Map([analysis.overview, ...analysis.regions.map(region => region.image), ...analysis.auxiliary_evidence]
    .map(image => [image.evidence_id, image] as const));
  if (!analysis.check_assessments.length) return null;
  return <details className="iad-rule-assessments iad-analysis"><summary>检查项 · {analysis.check_assessments.length}</summary>
    <ol>{analysis.check_assessments.map(assessment => <li key={assessment.check_id} data-check-id={assessment.check_id}>
      <strong>{checks.get(assessment.check_id)?.title || assessment.check_id}</strong> · {statuses[assessment.status]}
      <p>{assessment.description}</p>
      {!!assessment.limitations.length && <p className="iad-muted">{assessment.limitations.join("；")}</p>}
      <div className="iad-actions">{assessment.evidence_ids.map((id, index) => {
        const image = images.get(id);
        return image && <button key={id} data-evidence-id={id} onClick={() => onEvidence(image)}
          aria-label={`查看${checks.get(assessment.check_id)?.title || "检查项"}的证据 ${index + 1}`}>
          证据 {index + 1} · {image.representation === "annotation_mask" ? "定位图" : image.role === "overview" ? "全图" : "ROI"}
        </button>;
      })}</div>
    </li>)}</ol>
  </details>;
}
