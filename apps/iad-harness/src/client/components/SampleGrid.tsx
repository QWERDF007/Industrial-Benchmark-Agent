import React from "react";
import type { Dataset, Filters, Sample } from "../../shared/contracts.js";
import { mediaUrl } from "../api.js";
import { Pagination } from "./Pagination.js";

export function SampleGrid({ dataset, filters, onFilters, items, total, page, onPage, selected, onSelect, loading }: {
  dataset: Dataset; filters: Filters; onFilters(filters: Filters): void; items: Sample[]; total: number; page: number;
  onPage(page: number): void; selected: string; onSelect(id: string): void; loading: boolean;
}) {
  const select = (key: keyof Filters, label: string, options: [string, string][]) => <label className="iad-filter">{label}<select aria-label={label} value={filters[key] as string} onChange={e => onFilters({ ...filters, [key]: e.target.value })}>
    {options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>;
  const pagination = <Pagination total={total} page={page} unit="张" onPage={onPage} />;
  return <section className="iad-gallery"><div className="iad-filters">
    <details className="iad-multiselect"><summary aria-label="标注筛选">标注 · {filters.annotation_filters.length ? `已选 ${filters.annotation_filters.length} 项` : "全部"}</summary>
      <div className="iad-multiselect-menu">{[["none", "无标注"], ["present", "有标注"], ...dataset.annotation_categories.map(value => [`category:${value}`, `类别 ${value}`])].map(([value, title]) =>
        <label key={value}><input type="checkbox" aria-label={title} checked={filters.annotation_filters.includes(value)} onChange={e => onFilters({ ...filters, annotation_filters: e.target.checked ? [...filters.annotation_filters, value] : filters.annotation_filters.filter(item => item !== value) })} />{title}</label>)}
        <button onClick={() => onFilters({ ...filters, annotation_filters: [] })}>清空</button>
      </div></details>
    {select("model_status", "模型审计", [["all", "全部"], ["pending", "待审计"], ["audited", "已审计"], ["risk", "可疑"], ["PASS", "模型建议良品"], ["FAIL", "模型建议异常"], ["UNCERTAIN", "不确定"]])}
    {select("review_status", "人工复核", [["all", "全部"], ["pending", "待复核"], ["reviewed", "已复核"], ["PASS", "良品"], ["HARD_NORMAL", "困难正常"], ["FAIL", "异常"], ["UNCERTAIN", "不确定"], ["SKIP", "已跳过"]])}
    {select("technical", "技术质量", [["all", "全部"], ["issues", "存在问题"]])}
    {select("sort_by", "排序", [["default", "默认"], ["risk", "可疑度优先"], ["tech", "技术问题优先"]])}
    <input aria-label="按文件名搜索" placeholder="按文件名搜索" value={filters.search} onChange={e => onFilters({ ...filters, search: e.target.value })} />
  </div>{pagination}{loading ? <p>加载中…</p> : <div className="iad-grid">{items.map(sample => <button className={`iad-sample ${selected === sample.sample_id ? "is-selected" : ""}`} key={sample.sample_id} onClick={() => onSelect(sample.sample_id)}>
    <div className="iad-thumb"><img loading="lazy" src={mediaUrl(sample, "thumbnail")} alt={sample.relative_path} />
      <span className={`iad-badge ${sample.suggestion?.suggested_label === "FAIL" ? "is-risk" : ""}`}>{sample.review_decision ? `人审 ${sample.review_decision}` : sample.suggestion ? `模型 ${sample.suggestion.suggested_label}` : "待模型审计"}</span>
      {dataset.reference_sample_ids.includes(sample.sample_id) && <span className="iad-reference">良品参考</span>}</div>
    <strong title={sample.relative_path}>{sample.relative_path.split("/").pop()}</strong>
    <span className="iad-muted">{sample.annotation_count ? sample.annotation_categories.join("、") : "无标注"}</span>
    <span className="iad-muted">可疑度 {sample.visual_suspicion_score ?? "未测"} · 技术 {sample.technical_quality_score}</span>
  </button>)}</div>}{!loading && !items.length && <p className="iad-empty">没有符合筛选条件的样本。</p>}{pagination}</section>;
}
