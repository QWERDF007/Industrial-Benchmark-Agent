import {ThumbnailCard} from "./ThumbnailCard.js";
import React from "react";
import type { Sample } from "../../shared/contracts.js";
import { mediaUrl, modelLabels, reviewLabel } from "../api.js";
import { Tooltip } from "./Tooltip.js";

export function SampleCard({ sample, selected, onSelect, reference, selection, compact = false }: {
  compact?: boolean;
  sample: Sample; selected: boolean; onSelect(): void; reference: boolean;
  selection?: { checked: boolean; disabled: boolean; onChange(checked: boolean): void };
}) {
  const status = sample.suggestion?.suggested_label;
  return <div className="iad-sample-item">
    <ThumbnailCard data-sample-id={sample.sample_id} src={mediaUrl(sample,"thumbnail")} label={sample.relative_path.split("/").pop()!} aria-pressed={selected} onClick={onSelect}>
      {reference && <span>良品来源</span>}
      <span className="iad-sample-label">{sample.quality_status === "PASS" ? "OK" : sample.quality_status === "FAIL" ? "NG" : "未标记"} {compact && `，${sample.review_decision ? reviewLabel(sample.review_decision) : status ? modelLabels[status] : "未审计"}`}</span>
    </ThumbnailCard>
    {!compact && <Tooltip label={`查看状态 ${sample.relative_path}`} className={`iad-status-trigger is-${status || "pending"}`} content={<>
      <p>模型建议不代替人工裁决。</p>
      {sample.review_decision && <p>模型审计：{status ? modelLabels[status] : "未审计"}</p>}
    </>}><span className="iad-status-mark" aria-hidden="true" />{sample.review_decision ? reviewLabel(sample.review_decision) : status ? modelLabels[status] : "未审计"}</Tooltip>}
    {selection && <label className="iad-source-check"><input type="checkbox" aria-label={`选择良品来源 ${sample.relative_path}`} disabled={selection.disabled} checked={selection.checked} onChange={event => selection.onChange(event.target.checked)} /></label>}
  </div>;
}
