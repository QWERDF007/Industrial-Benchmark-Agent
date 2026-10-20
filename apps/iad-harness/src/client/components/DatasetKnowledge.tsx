import React from "react";
import type { KnowledgeSummary } from "../../shared/contracts.js";

const statuses = { supported: "有证据支持", provisional: "待验证", conflicted: "存在矛盾" };

export function DatasetKnowledge({ knowledge }: { knowledge: KnowledgeSummary }) {
  return <div className="iad-profile"><strong>{knowledge.kind === "normal" ? "良品知识" : "不良知识"}</strong>
    <p>{knowledge.summary}</p><small className="iad-muted">{knowledge.version_id} · {knowledge.sources.length} 张来源 · {knowledge.checks.length} 项判据</small>
    <details><summary>检查判据</summary>{knowledge.checks.map(check => <div key={check.check_id}>
      <strong>{check.title} · {statuses[check.status]}</strong><p>{check.criterion}</p>
      <small className="iad-muted">{check.subject} · {check.location}</small>
      {!!check.allowed_variations.length && <p>允许变化：{check.allowed_variations.join("；")}</p>}
      {!!check.limitations.length && <p className="iad-muted">{check.limitations.join("；")}</p>}
    </div>)}</details>
  </div>;
}
