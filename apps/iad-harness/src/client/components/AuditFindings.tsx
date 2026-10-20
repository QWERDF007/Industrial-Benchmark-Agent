import React, { useState } from "react";
import type { AuditAnalysis, AuditFinding, VisualEvidence } from "../../shared/contracts.js";
import { AuditEvidence } from "./AuditEvidence.js";

const priorities = { high: "优先复核", medium: "随后复核", low: "补充核对" };

export function AuditFindings({ analysis, onLocate, onEvidence }: {
  analysis: AuditAnalysis; onLocate(finding: AuditFinding): void; onEvidence(image: VisualEvidence, finding: AuditFinding): void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!analysis.findings.length) return null;
  const visible = expanded ? analysis.findings : analysis.findings.slice(0, 3);
  return <section className="iad-findings" aria-label="优先复核疑点"><h3>重点疑点 · {analysis.findings.length}</h3>
    <ol>{visible.map(finding => <li key={finding.finding_id} data-finding-id={finding.finding_id}>
      <p>{priorities[finding.priority]}</p>
      <button onClick={() => onLocate(finding)} title="在全图定位">{finding.location.description} · {finding.description}</button>
      <p>{finding.review_action}</p>
      <details className="iad-analysis"><summary>依据与正常解释</summary>
        <FindingExplanation finding={finding} />
        <AuditEvidence analysis={analysis} ids={finding.evidence_ids} label={finding.description} onEvidence={image => onEvidence(image, finding)} />
      </details>
    </li>)}</ol>
    {analysis.findings.length > 3 && <button aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
      {expanded ? "收起其他疑点" : `查看其余 ${analysis.findings.length - 3} 项`}
    </button>}
  </section>;
}

export function FindingExplanation({ finding }: { finding: AuditFinding }) {
  return <><p>异常假设：{finding.hypothesis}</p><p>正常解释：{finding.normal_explanation}</p>
    {!!finding.limitations.length && <p className="iad-muted">{finding.limitations.join("；")}</p>}</>;
}
