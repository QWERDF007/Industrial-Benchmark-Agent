import React, { useState } from "react";
import type { Dataset, Filters, Sample, SamplePage } from "../../shared/contracts.js";
import { message, request, sampleQuery } from "../api.js";
import { Pagination } from "./Pagination.js";
import { SampleFilters } from "./SampleFilters.js";
import { SampleCard } from "./SampleCard.js";

export function SampleGrid({ dataset, filters, onFilters, items, total, page, onPage, selected, onSelect, loading, sourceManagement, layout = "grid", showFilters = true }: {
  layout?: "grid" | "queue"; showFilters?: boolean;
  dataset: Dataset; filters: Filters; onFilters(filters: Filters): void; items: Sample[]; total: number; page: number;
  onPage(page: number): void; selected: string; onSelect(id: string): void; loading: boolean;
  sourceManagement?: { active: boolean; onChanged(): void };
}) {
  const scope = dataset.dataset_id;
  const [selection, setSelection] = useState<{ scope: string; ids: string[] }>({ scope: "", ids: [] });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const chosen = selection.scope === scope ? selection.ids : [];
  const managing = sourceManagement?.active;
  async function selectAll() {
    setBusy(true); setError(""); setNotice("");
    try {
      const ids: string[] = [];
      for (let next = 1; ; next++) {
        const result = await request<SamplePage>(`/samples/${encodeURIComponent(dataset.task_id)}?${sampleQuery(dataset.dataset_id, filters, next, 200)}`);
        ids.push(...result.items.map(item => item.sample_id));
        if (ids.length >= result.total) break;
        if (!result.items.length) throw new Error("筛选范围已变化，请重新选择");
      }
      setSelection({ scope, ids });
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  async function save(include?: boolean) {
    setBusy(true); setError(""); setNotice("");
    try {
      if (include === undefined) await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, { reset_references: true }, "PATCH");
      else {
        const ids = new Set(dataset.reference_sample_ids);
        for (const id of chosen) { if (include) ids.add(id); else ids.delete(id); }
        await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, { reference_sample_ids: [...ids] }, "PATCH");
      }
      setNotice(include === undefined ? "已恢复自动来源" : `已${include ? "加入" : "移出"} ${chosen.length} 张图像`);
      setSelection({ scope, ids: [] }); sourceManagement?.onChanged();
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  const pagination = <Pagination total={total} page={page} unit="张" onPage={onPage} />;
  return <section className={`iad-gallery ${layout === "queue" ? "iad-review-queue" : ""}`} aria-label="图像列表">
  {showFilters && <SampleFilters dataset={dataset} filters={filters} onFilters={onFilters} busy={busy} />}
  {managing && <section className="iad-source-controls" aria-label="良品来源管理" aria-busy={busy}>
    <div className="iad-row"><strong aria-label="良品来源摘要">{dataset.reference_mode === "automatic" ? "自动来源" : "人工选定"} · {dataset.reference_sample_ids.length} 张</strong><span className="iad-muted">候选来源，非人工裁决</span>
      <button disabled={busy || dataset.reference_mode === "automatic"} onClick={() => void save()}>恢复自动来源</button></div>
    <div className="iad-row"><button disabled={busy || loading} onClick={() => setSelection({ scope, ids: items.map(item => item.sample_id) })}>选择当前页</button>
      <button disabled={busy || loading || !total} onClick={() => void selectAll()}>选择筛选全部</button><span>已选 {chosen.length} 张</span>
      <button disabled={busy || !chosen.length} onClick={() => setSelection({ scope, ids: [] })}>取消选择</button>
      <button className="iad-primary" disabled={busy || !chosen.length} onClick={() => void save(true)}>加入良品来源</button>
      <button disabled={busy || !chosen.length} onClick={() => void save(false)}>移出良品来源</button></div>
  </section>}
  {error && <p role="alert" className="iad-error">{error}</p>}{notice && <p role="status">{notice}</p>}
  {loading ? <p role="status">加载中…</p> : <div className="iad-grid">{items.map(sample => <SampleCard key={sample.sample_id} sample={sample} compact={layout === "queue"} selected={selected === sample.sample_id} onSelect={() => onSelect(sample.sample_id)} reference={!!managing && dataset.reference_sample_ids.includes(sample.sample_id)}
    selection={managing ? { checked: chosen.includes(sample.sample_id), disabled: busy, onChange: checked => setSelection({ scope, ids: checked ? [...chosen, sample.sample_id] : chosen.filter(id => id !== sample.sample_id) }) } : undefined} />)}</div>}{!loading && !items.length && <p className="iad-empty">没有符合筛选条件的样本。</p>}{pagination}</section>;
}
