import React from "react";
import type {Dataset, Filters} from "../../shared/contracts.js";
import {initialFilters, modelLabels} from "../api.js";
import {FloatingMenu} from "./FloatingMenu.js";

export function SampleFilters({dataset, filters, onFilters, busy = false, defaults = initialFilters}: {dataset: Dataset; filters: Filters; onFilters(filters: Filters): void; busy?: boolean; defaults?: Filters}) {
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
    ...Object.entries(options).filter(([key]) => filters[key as keyof typeof options] !== defaults[key as keyof typeof options])
      .flatMap(([key, values]) => { const option = values.find(([value]) => value === filters[key as keyof typeof options]); return option ? [option[1]] : []; }),
    ...(filters.search ? [`文件名：${filters.search}`] : []),
  ];
  return <><div className="iad-filters">
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
  {!!active.length && <div className="iad-filter-summary"><span>筛选：{active.join(" · ")}</span><button disabled={busy} onClick={() => onFilters({ ...defaults })}>清除筛选</button></div>}
  </>;
}
