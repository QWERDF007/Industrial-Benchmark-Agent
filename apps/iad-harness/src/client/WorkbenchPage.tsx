import React, { useCallback, useEffect, useState } from "react";
import type { Dataset, Filters, Sample } from "../shared/contracts.js";
import { initialFilters, message, request } from "./api.js";
import { DatasetManager } from "./components/DatasetManager.js";
import { SampleGrid } from "./components/SampleGrid.js";
import { SampleInspector } from "./components/SampleInspector.js";
import { AuditJobs, AuditReport } from "./components/AuditJobs.js";
import { workbenchStyles } from "./styles.js";

function WorkbenchPage({ mode }: { mode: "model" | "review" }) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetId, setDatasetId] = useState(localStorage.getItem("iad.dataset") || "");
  const [tab, setTab] = useState("samples");
  const [filters, setFilters] = useState<Filters>({ ...initialFilters, review_status: mode === "review" ? "pending" : "all" });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Sample[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const dataset = datasets.find(d => d.dataset_id === datasetId);
  const loadDatasets = useCallback(async (preferred?: string) => {
    try {
      const result = await request<{ datasets: Dataset[] }>("/datasets"); setDatasets(result.datasets);
      setDatasetId(current => preferred || (result.datasets.some(d => d.dataset_id === current) ? current : result.datasets[0]?.dataset_id || ""));
      setError("");
    } catch (e) { setError(message(e)); }
  }, []);
  const changed = useCallback(() => { setRevision(v => v + 1); loadDatasets(); }, [loadDatasets]);
  useEffect(() => { loadDatasets(); }, [loadDatasets]);
  useEffect(() => {
    localStorage.setItem("iad.dataset", datasetId); setPage(1); setSelected("");
  }, [datasetId]);
  useEffect(() => {
    if (!dataset) return;
    const controller = new AbortController(); setLoading(true);
    const query = new URLSearchParams({ ...filters, annotation_filters: JSON.stringify(filters.annotation_filters), dataset_id: datasetId, page: String(page), page_size: "24" });
    request<{ items: Sample[]; total: number }>(`/samples/${dataset.task_id}?${query}`, undefined, undefined, controller.signal).then(result => {
      setItems(result.items); setTotal(result.total);
      setSelected(current => result.items.some(sample => sample.sample_id === current) ? current : result.items[0]?.sample_id || "");
    }).catch(e => { if (!controller.signal.aborted) setError(message(e)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [datasetId, dataset?.task_id, filters, page, revision]);
  const updateFilters = (value: Filters) => { setFilters(value); setPage(1); setSelected(""); };
  return <div className="iad-workbench"><style>{workbenchStyles}</style>
    <header className="iad-header"><div><span className="iad-eyebrow">INDUSTRIAL BENCHMARK</span><h1>{mode === "review" ? "人工复核" : "模型审计"}</h1></div>
      <div className="iad-row"><select aria-label="当前数据集" value={datasetId} onChange={e => setDatasetId(e.target.value)}><option value="" disabled>选择数据集</option>{datasets.map(item => <option key={item.dataset_id} value={item.dataset_id}>{item.name} ({item.total_samples})</option>)}</select>
        <button onClick={changed}>刷新</button></div></header>
    {error && <p role="alert" className="iad-error">{error}</p>}
    {dataset && <div className="iad-kpis"><div><span>图像</span><strong>{dataset.total_samples}</strong></div><div><span>模型审计</span><strong>{dataset.vlm_audited_count} <small>/ {dataset.total_samples}</small></strong></div>
      <div><span>待复核异常建议</span><strong>{dataset.pending_risk_count}</strong></div><div><span>已人工复核</span><strong>{dataset.human_reviewed_count}</strong></div></div>}
    {mode === "model" && <nav className="iad-tabs">{[["samples", "图像样本"], ["datasets", "数据集管理"], ["jobs", "模型审计作业"], ["reports", "报告"]].map(([key, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}</nav>}
    {mode === "model" && (tab === "datasets" || !datasets.length) ? <DatasetManager datasets={datasets} selected={dataset} onChanged={id => { loadDatasets(id); setRevision(v => v + 1); }} /> : dataset ? <>
      {(mode === "review" || tab === "samples") && <div className="iad-main"><SampleGrid dataset={dataset} filters={filters} onFilters={updateFilters} items={items} total={total} page={page} onPage={setPage} selected={selected} onSelect={setSelected} loading={loading} />
        <SampleInspector dataset={dataset} sampleId={selected} mode={mode} revision={revision} onChanged={changed} /></div>}
      {mode === "model" && tab === "jobs" && <AuditJobs dataset={dataset} filters={filters} onChanged={changed} />}
      {mode === "model" && tab === "reports" && <AuditReport dataset={dataset} />}
    </> : <p className="iad-empty">请在模型审计的数据集管理中导入数据集。</p>}
  </div>;
}
export function ModelAuditPage() { return <WorkbenchPage mode="model" />; }
export function HumanReviewPage() { return <WorkbenchPage mode="review" />; }
