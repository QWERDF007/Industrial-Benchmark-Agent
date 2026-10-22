import React from "react";
import type { KnowledgeSnapshot } from "../../shared/contracts.js";
import type { DirectionProposal } from "./KnowledgeDirections.js";

export function KnowledgeDiscovery({ knowledge, evidence, onPropose }: {
  knowledge: KnowledgeSnapshot; evidence(ids: string[]): React.ReactNode; onPropose(proposal: DirectionProposal): void;
}) {
  const discovery = knowledge.mining_steps.at(-1)?.result.discovery;
  const selected = knowledge.mining_prompt?.configuration.directions.filter(item => item.enabled) || [];
  const recorded = new Set(discovery?.areas.map(area => area.direction_id).filter(Boolean));
  const missing = selected.filter(item => !recorded.has(item.direction_id));
  return <details className="iad-knowledge-discovery"><summary>观察范围{discovery ? ` · ${discovery.areas.length} 项记录` : " · 未记录"}</summary>
    <p className="iad-muted">这是生成时的观察记录，不代表已证明覆盖完整或人工确认。{knowledge.manual_edit ? "当前为人工维护版本。" : ""}</p>
    {knowledge.mining_prompt && <details><summary>本次挖掘提示词</summary><pre className="iad-observation">{knowledge.mining_prompt.instruction}</pre></details>}
    {!!missing.length && <p>所选方向未记录结果：{missing.map(item => item.title).join("、")}</p>}
    {!discovery && <p>此版本未保存结构化观察范围。</p>}
    {discovery && <>
      <details><summary>可见部件 · {discovery.parts.length}</summary>{discovery.parts.map(part => <div key={part.name}><p>{part.name} · {part.location}</p>{evidence(part.evidence_ids)}</div>)}</details>
      {discovery.areas.map((area, index) => <article className="iad-discovery-area iad-info-group" key={index}>
        <div className="iad-section-header"><h3>{selected.find(item => item.direction_id === area.direction_id)?.title || area.direction}</h3><span>{area.status} · {area.direction_id ? "用户所选" : "模型新增"}</span></div>
        {!!area.subjects.length && <p>{area.subjects.join("、")}</p>}<p>{area.reason}</p>
        {!!area.check_titles.length && <p className="iad-muted">本次归纳判据：{area.check_titles.join("、")}</p>}
        {!!area.evidence_ids.length && <details><summary>查看图像依据</summary>{evidence(area.evidence_ids)}</details>}
        {!area.direction_id && <button onClick={() => onPropose({ id: crypto.randomUUID(), datasetId: knowledge.dataset_id, kind: knowledge.kind, title: area.direction,
          instruction: `观察${area.direction}${area.subjects.length ? `，关注${area.subjects.join("、")}` : ""}；结合原图核验相关规律、正常变化及证据限制。` })}>加入数据集方向</button>}
      </article>)}
    </>}
  </details>;
}
