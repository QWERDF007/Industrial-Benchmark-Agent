import React, { useState } from "react";
import type { Dataset, Filters, Sample, SamplePage } from "../../shared/contracts.js";
import { initialFilters, message, modelLabels, request, sampleQuery } from "../api.js";
import { Pagination } from "./Pagination.js";
import { FloatingMenu } from "./FloatingMenu.js";
import { SampleCard } from "./SampleCard.js";

export function SampleGrid({ dataset, filters, onFilters, items, total, page, onPage, selected, onSelect, loading, sourceManagement }: {
  dataset: Dataset; filters: Filters; onFilters(filters: Filters): void; items: Sample[]; total: number; page: number;
  onPage(page: number): void; selected: string; onSelect(id: string): void; loading: boolean;
  sourceManagement?: { active: boolean; onToggle(): void; onChanged(): void };
}) {
  const scope = sampleQuery(dataset.dataset_id, filters, page, 200);
  const [selection, setSelection] = useState<{ scope: string; ids: string[] }>({ scope: "", ids: [] });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const chosen = selection.scope === scope ? selection.ids : [];
  const managing = sourceManagement?.active;
  const options = {
    model_status: [["all", "全部"], ["pending", "未审计"], ["audited", "已审计"], ["risk", "可疑"], ["PASS", modelLabels.PASS], ["FAIL", modelLabels.FAIL], ["UNCERTAIN", modelLabels.UNCERTAIN]],
    review_status: [["all", "全部"], ["pending", "待复核"], ["reviewed", "已复核"], ["PASS", "良品"], ["HARD_NORMAL", "困难正常"], ["FAIL", "异常"], ["UNCERTAIN", "不确定"], ["SKIP", "已跳过"]],
    technical: [["all", "全部"], ["issues", "存在问题"]],
    reference_status: [["all", "全部"], ["candidate", "良品候选"], ["excluded", "非候选"]],
    sort_by: [["default", "默认"], ["risk", "可疑度优先"], ["tech", "技术问题优先"]],
  } satisfies Record<string, string[][]>;
  const isFolder = dataset.format === "folder_classification";
  const rawLabelOptions: [("PASS" | "FAIL" | "UNCERTAIN"), string][] = [["PASS", "OK"], ["FAIL", "NG"], ["UNCERTAIN", "未标记"]];
  const rawLabelMap: Record<string, string> = { PASS: "OK", FAIL: "NG", UNCERTAIN: "未标记" };
  const rawFilters = filters.raw_label_filters || [];
  const select = <K extends keyof typeof options>(key: K, label: string) => <label className="iad-filter">{label}<select aria-label={label} disabled={busy} value={filters[key]} onChange={e => onFilters({ ...filters, [key]: e.target.value })}>
    {options[key].map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>;
  const active = [
    ...rawFilters.map(value => `标签：${rawLabelMap[value] || value}`),
    ...(!isFolder ? filters.annotation_filters.map(value => value === "none" ? "无标注" : value === "present" ? "有标注" : value.slice(9)) : []),
    ...Object.entries(options).filter(([key]) => filters[key as keyof typeof options] !== initialFilters[key as keyof typeof options])
      .flatMap(([key, values]) => { const option = values.find(([value]) => value === filters[key as keyof typeof options]); return option ? [option[1]] : []; }),
    ...(filters.search ? [`文件名：${filters.search}`] : []),
  ];
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
  return <section className="iad-gallery" aria-label="图像列表"><div className="iad-filters">
    <div className="iad-filter"><span>原始标签</span><FloatingMenu className="iad-multiselect" label="原始标签筛选" summary={rawFilters.length ? `已选 ${rawFilters.length} 项` : "全部"}>
      {rawLabelOptions.map(([value, title]) =>
        <label key={value}><input type="checkbox" aria-label={`原始标签 ${title}`} disabled={busy} checked={rawFilters.includes(value)} onChange={e => onFilters({ ...filters, raw_label_filters: e.target.checked ? [...rawFilters, value] : rawFilters.filter(item => item !== value) })} />{title}</label>)}
      <button disabled={busy} onClick={() => onFilters({ ...filters, raw_label_filters: [] })}>清空</button>
    </FloatingMenu></div>
    {!isFolder && <div className="iad-filter"><span>标注</span><FloatingMenu className="iad-multiselect" label="标注筛选" summary={filters.annotation_filters.length ? `已选 ${filters.annotation_filters.length} 项` : "全部"}>
      {[["none", "无标注"], ["present", "有标注"], ...dataset.annotation_categories.map(value => [`category:${value}`, `类别 ${value}`])].map(([value, title]) =>
        <label key={value}><input type="checkbox" aria-label={title} disabled={busy} checked={filters.annotation_filters.includes(value)} onChange={e => onFilters({ ...filters, annotation_filters: e.target.checked ? [...filters.annotation_filters, value] : filters.annotation_filters.filter(item => item !== value) })} />{title}</label>)}
      <button disabled={busy} onClick={() => onFilters({ ...filters, annotation_filters: [] })}>清空</button>
    </FloatingMenu></div>}
    {select("model_status", "模型审计")}{select("review_status", "人工复核")}
    <label className="iad-filter iad-search">搜索<input type="search" aria-label="按文件名搜索" placeholder="文件名" disabled={busy} value={filters.search} onChange={e => onFilters({ ...filters, search: e.target.value })} /></label>
    <FloatingMenu className="iad-multiselect" label="更多筛选" summary="更多筛选">{select("technical", "技术质量")}{select("reference_status", "良品来源")}{select("sort_by", "排序")}</FloatingMenu>

  </div>
  {!!active.length && <div className="iad-filter-summary"><span>筛选：{active.join(" · ")}</span><button disabled={busy} onClick={() => onFilters({ ...initialFilters })}>清除筛选</button></div>}
  {managing && <section className="iad-source-controls" aria-label="良品来源管理" aria-busy={busy}>
    <div className="iad-row"><button disabled={busy} onClick={() => sourceManagement?.onToggle()}>完成来源管理</button><strong aria-label="良品来源摘要">{dataset.reference_mode === "automatic" ? "自动来源" : "人工选定"} · {dataset.reference_sample_ids.length} 张</strong><span className="iad-muted">候选来源，非人工裁决</span>
      <button disabled={busy || dataset.reference_mode === "automatic"} onClick={() => void save()}>恢复自动来源</button></div>
    <div className="iad-row"><button disabled={busy || loading} onClick={() => setSelection({ scope, ids: items.map(item => item.sample_id) })}>选择当前页</button>
      <button disabled={busy || loading || !total} onClick={() => void selectAll()}>选择筛选全部</button><span>已选 {chosen.length} 张</span>
      <button disabled={busy || !chosen.length} onClick={() => setSelection({ scope, ids: [] })}>取消选择</button>
      <button className="iad-primary" disabled={busy || !chosen.length} onClick={() => void save(true)}>加入良品来源</button>
      <button disabled={busy || !chosen.length} onClick={() => void save(false)}>移出良品来源</button></div>
  </section>}
  {error && <p role="alert" className="iad-error">{error}</p>}{notice && <p role="status">{notice}</p>}
  {pagination}{loading ? <p>加载中…</p> : <div className="iad-grid">{items.map(sample => <SampleCard key={sample.sample_id} sample={sample} selected={selected === sample.sample_id} onSelect={() => onSelect(sample.sample_id)} reference={!!managing && dataset.reference_sample_ids.includes(sample.sample_id)}
    selection={managing ? { checked: chosen.includes(sample.sample_id), disabled: busy, onChange: checked => setSelection({ scope, ids: checked ? [...chosen, sample.sample_id] : chosen.filter(id => id !== sample.sample_id) }) } : undefined} />)}</div>}{!loading && !items.length && <p className="iad-empty">没有符合筛选条件的样本。</p>}{pagination}</section>;
}
