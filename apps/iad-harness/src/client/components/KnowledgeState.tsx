import React from "react";
import type { KnowledgeFreshness } from "../../shared/contracts.js";

const reasons = { image: "图像内容变化", annotations: "已导入标注变化", review: "人工反馈变化", audit_candidates: "审计候选变化", qualification: "来源资格变化", unavailable: "来源无法读取或核验" };

export function KnowledgeState({ freshness }: { freshness: KnowledgeFreshness | null }) {
  if (!freshness) return null;
  return <section aria-label="知识来源状态" className="iad-info-group">
    <p role="status">{freshness.status === "changed" ? freshness.source_changes.length ? "来源发生变化，建议重新挖掘核验。" : "知识依赖或生成规则发生变化，建议重新挖掘核验。" : freshness.status === "unverified" ? "生成规则尚未核实，请重新挖掘核验。" : "来源与生成规则未变化。"}</p>
    {freshness.normal_version_changed && <p>所依据的良品版本已非当前发布版本。当前良品：<code>{freshness.current_normal_version_id || "无"}</code></p>}
    {freshness.normal_sources_changed && <p>所依据良品知识的来源或生成规则需要重新核验。</p>}
    {freshness.generation_changed && <p>知识生成规则已变化。</p>}
    {!!freshness.source_changes.length && <details><summary>{freshness.source_changes.length} 张来源需要核验</summary>{freshness.source_changes.map(change => <p key={change.sample_id}><code>{change.sample_id.slice(change.sample_id.indexOf(":") + 1)}</code> · {change.reasons.map(reason => reasons[reason]).join("、")}</p>)}</details>}
    {!!freshness.additional_source_ids.length && <p>{freshness.additional_source_ids.length} 张合格候选未纳入此版本。</p>}
    <small className="iad-muted">核验时间 <time dateTime={freshness.checked_at}>{new Date(freshness.checked_at).toLocaleString()}</time></small>
  </section>;
}
