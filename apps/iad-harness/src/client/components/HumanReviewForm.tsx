import React, { useRef, useState } from "react";
import type { Decision, ReviewDecisionRecord, SampleDetail } from "../../shared/contracts.js";
import { message, request, reviewLabels, reviewLabel } from "../api.js";
import { useReviewDraft } from "../useReviewDraft.js";

export function HumanReviewForm({ datasetId, sampleId, detail, onSubmitted }: {
  datasetId: string; sampleId: string; detail: Pick<SampleDetail, "review_decision" | "review_history">; onSubmitted(record: ReviewDecisionRecord): void;
}) {
  const draft = useReviewDraft(datasetId, sampleId);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const openedAt = useRef(Date.now());
  async function submit(decision: Decision) {
    if (!draft.reviewer.trim()) { setError("请填写复核人"); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const submission = draft.prepare(decision, Date.now() - openedAt.current);
      const saved = await request<ReviewDecisionRecord>("/review/submit", submission);
      localStorage.setItem("iad.reviewer", saved.reviewer);
      draft.discard(); openedAt.current = Date.now(); setNotice(`已提交 ${reviewLabel(saved.decision)}`); onSubmitted(saved);
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return <section className="iad-decision">
    <h3>人工裁决</h3>
    {error && <p role="alert" className="iad-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    {draft.pending ? <div className="iad-row"><span role="status">提交结果待确认</span><button disabled={busy} onClick={() => submit(draft.pending!.decision)}>重试提交</button></div>
      : draft.dirty && <div className="iad-row"><span role="status">草稿未提交</span><button disabled={busy} onClick={draft.discard}>放弃草稿</button></div>}
    {detail.review_decision && <p>当前：{reviewLabel(detail.review_decision.decision)} · {detail.review_decision.reviewer}<br />{detail.review_decision.comment}</p>}
    <label className="iad-field">复核人<input value={draft.reviewer} disabled={busy || !!draft.pending} onChange={e => draft.update({ reviewer: e.target.value })} /></label>
    <label className="iad-field">复核说明<textarea value={draft.comment} disabled={busy || !!draft.pending} onChange={e => draft.update({ comment: e.target.value })} /></label>
    <div className="iad-actions">{(Object.entries(reviewLabels) as [Decision,string][]).map(([value,label]) =>
      <button key={value} className={value === "FAIL" ? "iad-danger" : ""} disabled={busy || !!draft.pending} onClick={() => submit(value)}>{label}</button>)}</div>
    <details className="iad-review-history"><summary>复核记录 · {detail.review_history.length} 次</summary><ol>{detail.review_history.map(record =>
      <li key={record.decision_id} data-decision-id={record.decision_id}>
        <strong>{reviewLabel(record.decision)}</strong> · {record.reviewer}<br />
        {record.submitted_at ? <time dateTime={record.submitted_at}>{new Date(record.submitted_at).toLocaleString()}</time> : "未记录提交时间"}
        {record.comment && <p>{record.comment}</p>}
      </li>)}</ol></details>
  </section>;
}
