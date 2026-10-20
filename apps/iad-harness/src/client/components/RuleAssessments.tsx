import React from "react";
import type { AuditAnalysis, KnowledgeSummary, VisualEvidence } from "../../shared/contracts.js";
import { AuditEvidence } from "./AuditEvidence.js";

const statuses = { normal: "未见异常", anomaly: "发现偏离", insufficient: "证据不足", not_applicable: "不适用" };

export function RuleAssessments({ analysis, knowledge, onEvidence }: {
  analysis: AuditAnalysis; knowledge: KnowledgeSummary[]; onEvidence(image: VisualEvidence): void;
}) {
  const checks = new Map(knowledge.flatMap(snapshot => snapshot.checks.map(check => [check.check_id, check] as const)));
  if (!analysis.check_assessments.length) return null;
  return <details className="iad-rule-assessments iad-analysis"><summary>检查项 · {analysis.check_assessments.length}</summary>
    <ol>{analysis.check_assessments.map(assessment => <li key={assessment.check_id} data-check-id={assessment.check_id}>
      <strong>{checks.get(assessment.check_id)?.title || assessment.check_id}</strong> · {statuses[assessment.status]}
      <p>{assessment.description}</p>
      {!!assessment.limitations.length && <p className="iad-muted">{assessment.limitations.join("；")}</p>}
      <AuditEvidence analysis={analysis} ids={assessment.evidence_ids} label={checks.get(assessment.check_id)?.title || "检查项"} onEvidence={onEvidence} />
    </li>)}</ol>
  </details>;
}
