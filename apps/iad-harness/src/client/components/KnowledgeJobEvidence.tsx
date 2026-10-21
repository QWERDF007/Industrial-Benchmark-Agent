import React, { useEffect, useState } from "react";
import type { JobSnapshot } from "../../shared/contracts.js";
import type { KnowledgeTracePage } from "../../shared/domain.generated.js";
import { message, request } from "../api.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";

export function KnowledgeJobEvidence({ job }: { job: JobSnapshot }) {
  const [open, setOpen] = useState(false), [page, setPage] = useState(1);
  const [result, setResult] = useState<KnowledgeTracePage | null>(null), [error, setError] = useState("");
  const [image, setImage] = useState<ImageSource | null>(null);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController(); setError("");
    request<KnowledgeTracePage>(`/knowledge/observations/${encodeURIComponent(job.run_id)}?page=${page}`, undefined, undefined, controller.signal)
      .then(value => { if (!controller.signal.aborted) setResult(value); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); });
    return () => controller.abort();
  }, [open, page, job.run_id, job.status, job.observation_progress?.observed_visuals]);
  return <details onToggle={event => setOpen(event.currentTarget.open)}><summary>观察证据</summary>
    {error && <p role="alert" className="iad-error">{error}</p>}
    {open && !result && !error && <p role="status">正在读取冻结观察…</p>}
    {open && result && <><p className="iad-muted">规划 {result.progress.planned_visuals} 个视图 · 已接受观察 {result.progress.observed_visuals} 个 · 已发布 {result.progress.published_sources} 张来源</p>
      <div className="iad-reference-grid">{result.items.map(item => {
        const src = `/api/iad/knowledge/observations/${encodeURIComponent(job.run_id)}/evidence/${encodeURIComponent(item.image.evidence_id)}`;
        const title = `${item.image.role} · ${item.observed ? "已接受观察" : "尚未完成观察"}`;
        return <button key={item.image.evidence_id} title="放大冻结观察证据" onClick={() => setImage({ src, title, width: item.image.sent_size[0], height: item.image.sent_size[1] })}><img src={src} alt={title} loading="lazy" /><small>{title}</small></button>;
      })}</div>
      {!result.total && <p>尚未规划图像证据。</p>}
      {result.total > result.page_size && <div className="iad-row"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}>上一页证据</button><span>第 {page} 页</span><button disabled={page * result.page_size >= result.total} onClick={() => setPage(value => value + 1)}>下一页证据</button></div>}
    </>}{image && <ImageViewer image={image} onClose={() => setImage(null)} />}
  </details>;
}
