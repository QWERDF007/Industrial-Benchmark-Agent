import React, { useEffect, useState } from "react";
import type { KnowledgeReviewContext, KnowledgeReviewItem, KnowledgeReviewSubmission } from "../../shared/domain.generated.js";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { KnowledgeEvidenceGallery } from "./KnowledgeEvidenceGallery.js";
import { Pagination } from "./Pagination.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";

const states = { pending_review: "待人工确认", pending_recheck: "待重核验", resolved: "已生效" };
const actions = { retain: "保留判据", revise: "修订判据", retire: "退役判据", need_evidence: "要求补证" };

export function KnowledgeConflictReview({ datasetId }: { datasetId: string }) {
  const { workspace } = useWorkspace(), view = workspace.view("industrial-review");
  const [loading, setLoading] = useState(true), [contextLoading, setContextLoading] = useState(false), [page, setPage] = useState(1);
  const [state, setState] = useState<KnowledgeReviewItem["state"] | "">("");
  const [items, setItems] = useState<KnowledgeReviewItem[]>([]);
  const [context, setContext] = useState<KnowledgeReviewContext | null>(null);
  const [error, setError] = useState(""), [revision, setRevision] = useState(0), [busy, setBusy] = useState(false);
  const [reviewer, setReviewer] = useState(""), [reason, setReason] = useState(""), [instruction, setInstruction] = useState("");
  const [action, setAction] = useState<KnowledgeReviewSubmission["action"]>("retain");
  const [pending, setPending] = useState<KnowledgeReviewSubmission | null>(null);
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  useEffect(() => {
    const controller = new AbortController();setLoading(true);
    request<{ items: KnowledgeReviewItem[] }>(`/review/knowledge/queue?${new URLSearchParams({ dataset_id: datasetId })}`, undefined, undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setItems(result.items); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); }).finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, [datasetId, revision]);
  const filtered = items.filter(item => !state || item.state === state);
  const selected = filtered.find(item => item.conflict_id === view.conflictId && item.version_id === view.version) || filtered[0];
  useEffect(() => {
    const controller = new AbortController(); setContext(null); setError("");
    setContextLoading(!!selected);setPending(null);setReason("");setInstruction("");setAction("retain");
    if (selected) request<KnowledgeReviewContext>(`/review/knowledge?${new URLSearchParams({ version_id: selected.version_id, conflict_id: selected.conflict_id })}`, undefined, undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setContext(result); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); }).finally(() => {if (!controller.signal.aborted) setContextLoading(false);});
    return () => controller.abort();
  }, [selected?.conflict_id, selected?.version_id, revision]);
  async function submit() {
    if (!context) return;
    const submission = pending || { ...context.reference, submission_id: crypto.randomUUID(), context_signature: context.context_signature, reviewer, action, instruction: action === "revise" ? instruction : "", reason };
    setPending(submission); setBusy(true); setError("");
    try { await request("/review/knowledge", submission); setReason(""); setInstruction(""); setRevision(value => value + 1); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return <section className="iad-job-section" aria-label="知识冲突复核">
    {error && <p role="alert" className="iad-error">{error} <button onClick={() => setRevision(value => value + 1)}>重新读取</button></p>}
    <label className="iad-field">状态<select aria-label="知识冲突状态" value={state} onChange={event => {setState(event.target.value as typeof state);setPage(1);}}><option value="">全部状态</option>{Object.entries(states).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <div className="iad-conflict-workspace"><div><div className="iad-check-list" aria-label="知识冲突队列">{filtered.slice((page-1)*10,page*10).map(item => <button key={item.conflict_id} aria-pressed={selected?.conflict_id === item.conflict_id}
      onClick={() => workspace.updateView("industrial-review", { conflictId: item.conflict_id, version: item.version_id })}>
      <strong>{item.description}</strong><span>{item.kind === "normal" ? "良品" : "异常"} · {states[item.state]}</span></button>)}{!loading && !filtered.length && <p>暂无匹配的知识冲突。</p>}{loading && <p role="status">正在读取冲突队列…</p>}</div><Pagination total={filtered.length} page={page} size={10} unit="项冲突" onPage={setPage} /></div>
      {contextLoading && <p role="status">正在读取冲突证据…</p>}{context && <div className="iad-conflict-detail"><article aria-label="冲突证据"><h2>知识冲突</h2><p role="status" data-field="knowledge-review-state">{states[context.state]}</p>
        <p>{context.conflict.description}</p><p>正常替代解释：{context.conflict.normal_explanation || "未提供"}</p>
        {context.checks.map(check => <div key={check.check_id}><h3>{check.title}</h3><p>{check.criterion}</p><p className="iad-muted">{check.subject} · {check.location}</p></div>)}
        <section><h3>新图证据</h3><KnowledgeEvidenceGallery versionId={context.reference.version_id} items={context.evidence.filter(item => context.conflict.new_evidence_ids.includes(item.image.evidence_id))} onOpen={setLightbox} /></section>
        <section><h3>历史比较证据</h3><KnowledgeEvidenceGallery versionId={context.reference.version_id} items={context.evidence.filter(item => context.conflict.comparison_evidence_ids.includes(item.image.evidence_id))} onOpen={setLightbox} /></section>
        {context.evidence.some(item => ![...context.conflict.new_evidence_ids,...context.conflict.comparison_evidence_ids].includes(item.image.evidence_id)) && <details><summary>判据的其他引用</summary><KnowledgeEvidenceGallery versionId={context.reference.version_id} items={context.evidence.filter(item => ![...context.conflict.new_evidence_ids,...context.conflict.comparison_evidence_ids].includes(item.image.evidence_id))} onOpen={setLightbox} /></details>}
        <p className="iad-muted">{context.conflict.limitations.join("；")}</p>
        <button onClick={() => workspace.openLocation({ pageId: "industrial-review", datasetId, selected: context.conflict.sample_id, tab: "results" })}>复核此图像</button>
        </article><aside aria-label="知识处置面板"><h2>知识处置</h2>{!context.is_latest && <p role="status">正在查看历史冲突，提交前请读取当前版本。</p>}
        {!context.source_current && <p role="status">来源内容已变化，请重新核验。</p>}
        <form aria-label="知识处置" onSubmit={event => { event.preventDefault(); void submit(); }}>
          <fieldset className="iad-disposition-fields" disabled={busy || !!pending || !context.is_latest || !context.source_current}>
            <label className="iad-field">复核人<input aria-label="知识复核人" required value={reviewer} onChange={event => setReviewer(event.target.value)} /></label>
            <label className="iad-field">知识处置<select aria-label="知识处置方式" value={action} onChange={event => setAction(event.target.value as KnowledgeReviewSubmission["action"])}>{Object.entries(actions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {action === "revise" && <label className="iad-field">待核验修订<textarea aria-label="知识修订建议" required value={instruction} onChange={event => setInstruction(event.target.value)} /></label>}
            <label className="iad-field">原因<textarea aria-label="知识复核原因" required value={reason} onChange={event => setReason(event.target.value)} /></label>
          </fieldset>
          <div className="iad-form-actions"><button type="submit" className="iad-primary" disabled={busy || !context.is_latest || !context.source_current || (!pending && (!reviewer.trim() || !reason.trim() || (action === "revise" && !instruction.trim())))}>{busy ? "提交中…" : pending ? "重试相同提交" : "提交知识处置"}</button></div>
        </form>
        {context.state === "pending_recheck" && <button onClick={() => workspace.openLocation({ pageId: "industrial-knowledge", datasetId, knowledgeKind: items.find(item => item.conflict_id === context.reference.conflict_id)?.kind || "normal", miningPreset: context.reference.version_id, scopeRunId: context.scope_run_id || "", miningSourceMode: "all", miningContinuous: false, version: "", tab: "setup" })}>选择图像重核验</button>}
        {!!context.events.length && <details><summary>处置记录 · {context.events.length} 次</summary>{context.events.map(event => <div key={event.submission_id}><p>{actions[event.action]} · {event.reviewer}</p><p>{event.instruction || event.reason}</p><time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time></div>)}</details>}
      </aside></div>}
    </div>{lightbox && <ImageViewer image={lightbox} onClose={() => setLightbox(null)} />}
  </section>;
}
