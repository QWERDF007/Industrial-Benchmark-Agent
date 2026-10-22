import React, { useEffect, useState } from "react";
import type { Dataset, KnowledgeSourcePage } from "../../shared/contracts.js";
import { mediaUrl, message, request } from "../api.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";

export function ExplorationSources({ dataset, kind, count, images, disabled, onCount, onImages, onSelecting }: {
  dataset: Dataset; kind: "normal" | "defect"; count: string; images: string[]; disabled: boolean;
  onCount(value: string): void; onImages(value: string[]): void; onSelecting(value: boolean): void;
}) {
  const label = kind === "normal" ? "良品" : "异常";
  const [page, setPage] = useState(1), [sources, setSources] = useState<KnowledgeSourcePage | null>(null);
  const [error, setError] = useState(""), [selecting, setSelecting] = useState(false), [image, setImage] = useState<ImageSource | null>(null);
  const query = new URLSearchParams({ dataset_id: dataset.dataset_id, kind });
  useEffect(() => {
    const controller = new AbortController(); setError("");
    request<KnowledgeSourcePage>(`/knowledge/sources?${query}&page=${page}&page_size=10`, undefined, undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setSources(result); }).catch(e => { if (!controller.signal.aborted) setError(message(e)); });
    return () => controller.abort();
  }, [dataset.dataset_id, kind, page]);
  async function select() {
    setSelecting(true); onSelecting(true); setError("");
    try {
      const selected: string[] = [];
      for (let next = 1; selected.length < Number(count); next++) {
        const result = await request<KnowledgeSourcePage>(`/knowledge/sources?${query}&page=${next}&page_size=100`);
        selected.push(...result.items.slice(0, Number(count) - selected.length).map(item => item.sample_id));
        if (next * 100 >= result.total) break;
      }
      if (selected.length !== Number(count)) throw new Error(`可用${label}不足${count}张，请调整数量`);
      onImages(selected);
    } catch (e) { setError(message(e)); } finally { setSelecting(false); onSelecting(false); }
  }
  return <section className="iad-info-group"><h3>{label}样例</h3>
    <fieldset disabled={disabled || selecting}>
      <div className="iad-row"><label className="iad-field">图像数量<input type="number" min="1" aria-label={`${label}图像数量`} value={count} onChange={e => onCount(e.target.value)} /></label>
        <button disabled={!Number.isInteger(Number(count)) || Number(count) < 1} onClick={() => void select()}>{selecting ? "选取中…" : `选取${label}图像`}</button>
        <span>已选 {images.length} / {count || "—"} 张{sources ? ` · 可用 ${sources.total}` : ""}</span>
        <button disabled={!images.length} onClick={() => onImages([])}>清空</button></div>
      {error && <p role="alert" className="iad-error">{error}</p>}
      <div className="iad-reference-grid">{sources?.items.map(item => <div className="iad-source-option" key={item.sample_id}>
        <button aria-label={`放大样例 ${item.relative_path}`} onClick={() => setImage({ src: mediaUrl({ task_id: dataset.task_id, sample_id: item.sample_id }, "image"), title: item.relative_path })}><img src={mediaUrl({ task_id: dataset.task_id, sample_id: item.sample_id }, "thumbnail")} alt={item.relative_path} loading="lazy" /></button>
        <label><input type="checkbox" aria-label={`选择${label} ${item.relative_path}`} checked={images.includes(item.sample_id)} onChange={e => onImages(e.target.checked ? [...images, item.sample_id] : images.filter(id => id !== item.sample_id))} />{item.relative_path}</label>
      </div>)}</div>
      <div className="iad-row"><button disabled={page <= 1} onClick={() => setPage(v => v - 1)}>上一页</button><span>第 {page} 页</span><button disabled={!sources || page * 10 >= sources.total} onClick={() => setPage(v => v + 1)}>下一页</button></div>
    </fieldset>{image && <ImageViewer image={image} onClose={() => setImage(null)} />}
  </section>;
}
