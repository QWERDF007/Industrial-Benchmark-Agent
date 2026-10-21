import React from "react";
import type { Sample } from "../../shared/contracts.js";
import { mediaUrl, modelLabels, reviewLabel } from "../api.js";
import { Tooltip } from "./Tooltip.js";

export function SampleCard({ sample, selected, onSelect, reference, selection }: {
  sample: Sample; selected: boolean; onSelect(): void; reference: boolean;
  selection?: { checked: boolean; disabled: boolean; onChange(checked: boolean): void };
}) {
  const status = sample.suggestion?.suggested_label;
  return <div className="iad-sample-item">
    <button data-sample-id={sample.sample_id} className={`iad-sample ${selected ? "is-selected" : ""}`} title={sample.relative_path} onClick={onSelect}>
      <div className="iad-thumb"><img loading="lazy" src={mediaUrl(sample, "thumbnail")} alt={sample.relative_path} />
        {reference && <span className="iad-reference">良品来源</span>}</div>
      <strong>{sample.relative_path.split("/").pop()}</strong>
      <dl className="iad-sample-metrics"><div><dt>技术分：</dt><dd aria-label={`技术质量分数 ${sample.technical_quality_score}`}>{sample.technical_quality_score}</dd></div>
        <div><dt>模型分：</dt><dd aria-label={`模型审计分数 ${sample.visual_suspicion_score ?? "未审计"}`}>{sample.visual_suspicion_score ?? "—"}</dd></div></dl>
    </button>
    <Tooltip label={`查看状态 ${sample.relative_path}`} className={`iad-status-trigger is-${status || "pending"}`} content={<>
      <p>模型审计：{status ? modelLabels[status] : "未审计"}</p>
      {sample.review_decision && <p>人工复核：{reviewLabel(sample.review_decision)}</p>}
    </>}><span aria-hidden="true" /></Tooltip>
    {selection && <label className="iad-source-check"><input type="checkbox" aria-label={`选择良品来源 ${sample.relative_path}`} disabled={selection.disabled} checked={selection.checked} onChange={event => selection.onChange(event.target.checked)} /></label>}
  </div>;
}
