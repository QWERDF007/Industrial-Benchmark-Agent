import React, { useCallback, useEffect, useState } from "react";
import type { AuditJob, Dataset, Filters, Sample } from "../shared/contracts.js";
import { message, request } from "./api.js";
import { DatasetManager } from "./components/DatasetManager.js";
import { SampleGrid } from "./components/SampleGrid.js";
import { SampleInspector } from "./components/SampleInspector.js";
import { AuditJobs, AuditReport } from "./components/AuditJobs.js";
import { KnowledgePage } from "./components/KnowledgePage.js";
import { Modal } from "./components/Modal.js";
import { useJobs } from "./useJobs.js";
import { pages, useWorkspace, type PageId } from "./workspace.js";
import { workbenchStyles } from "./styles.js";

export function WorkbenchPage({ pageId }: { pageId: PageId }) {
  const { workspace, state } = useWorkspace();
  const datasetId = state.datasetId, view = workspace.view(pageId);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [result, setResult] = useState<{ datasetId: string; items: Sample[]; total: number }>({ datasetId: "", items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const dataset = datasets.find(d => d.dataset_id === datasetId);
  const loadDatasets = useCallback(async (preferred?: string, signal?: AbortSignal) => {
    try {
      const result = await request<{ datasets: Dataset[] }>("/datasets", undefined, undefined, signal);
      if (signal?.aborted) return;
      setDatasets(result.datasets);
      const current = workspace.getSnapshot().datasetId;
      workspace.selectDataset(preferred || (result.datasets.some(d => d.dataset_id === current) ? current : result.datasets[0]?.dataset_id || ""), true);
      setError("");
    } catch (e) { if (!signal?.aborted) setError(message(e)); }
  }, [workspace]);
  const changed = useCallback(() => { setRevision(v => v + 1); void loadDatasets(); }, [loadDatasets]);
  const audit = useJobs<AuditJob>("audit", datasetId, changed);
  useEffect(() => { const controller = new AbortController(); void loadDatasets(undefined, controller.signal); return () => controller.abort(); }, [loadDatasets]);
  const gallery = pageId === "industrial-datasets" || pageId === "industrial-images" || pageId === "industrial-review" || (pageId === "industrial-audit" && view.tab === "results");
  useEffect(() => {
    if (!dataset || !gallery) return;
    const controller = new AbortController(); setLoading(true);
    const query = new URLSearchParams({ ...view.filters, annotation_filters: JSON.stringify(view.filters.annotation_filters), dataset_id: datasetId, page: String(view.page), page_size: "24" });
    request<{ items: Sample[]; total: number }>(`/samples/${dataset.task_id}?${query}`, undefined, undefined, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setResult({ ...result, datasetId }); setError("");
      if (!view.selected && (pageId === "industrial-audit" || pageId === "industrial-review") && result.items.length) workspace.updateView(pageId, { selected: result.items[0].sample_id }, true);
    }).catch(e => { if (!controller.signal.aborted) setError(message(e)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [datasetId, dataset?.task_id, view.filters, view.page, gallery, revision, workspace, pageId]);
  const updateFilters = (filters: Filters) => workspace.updateView(pageId, { filters, page: 1, selected: "" });
  const inspector = dataset && <SampleInspector key={`${datasetId}:${view.selected}`} dataset={dataset} sampleId={view.selected} mode={pageId === "industrial-review" ? "review" : pageId === "industrial-datasets" ? "dataset" : pageId === "industrial-images" ? "browse" : "model"} revision={revision} onChanged={changed} jobs={audit.jobs} onJobsChanged={audit.refresh} />;
  const grid = dataset && <SampleGrid dataset={dataset} filters={view.filters} onFilters={updateFilters} items={result.datasetId === datasetId ? result.items : []} total={result.datasetId === datasetId ? result.total : 0} page={view.page} onPage={page => workspace.updateView(pageId, { page, selected: "" })} selected={view.selected} onSelect={selected => workspace.updateView(pageId, { selected })} loading={loading} />;
  return <div className="iad-workbench" data-page={pageId}><style>{workbenchStyles}</style>
    <header className="iad-header"><h1>{pages[pageId]}</h1>
      <div className="iad-row"><select aria-label="当前数据集" value={datasetId} onChange={e => workspace.selectDataset(e.target.value)}><option value="" disabled>选择数据集</option>{datasets.map(item => <option key={item.dataset_id} value={item.dataset_id}>{item.name} ({item.total_samples})</option>)}</select><button onClick={changed}>刷新</button></div></header>
    {(error || audit.error) && <p role="alert" className="iad-error">{error || audit.error}</p>}
    {dataset && <div className="iad-kpis"><div><span>图像</span><strong>{dataset.total_samples}</strong></div><div><span>模型审计</span><strong>{dataset.vlm_audited_count} <small>/ {dataset.total_samples}</small></strong></div><div><span>待复核异常建议</span><strong>{dataset.pending_risk_count}</strong></div><div><span>已人工复核</span><strong>{dataset.human_reviewed_count}</strong></div></div>}
    {pageId === "industrial-datasets" ? <>
      <DatasetManager datasets={datasets} selected={dataset} onChanged={id => { void loadDatasets(id); setRevision(v => v + 1); }} />
      {dataset && <button onClick={() => workspace.navigate("industrial-images")}>浏览图像</button>}
      {dataset && <details className="iad-reference-manager"><summary>良品参考资格 · {dataset.reference_sample_ids.length} 张</summary>{grid}</details>}
      {dataset && view.selected && <Modal title="良品参考资格" onClose={() => workspace.updateView(pageId, { selected: "" })}><button onClick={() => workspace.updateView(pageId, { selected: "" })}>返回数据集管理</button>{inspector}</Modal>}
    </> : !dataset ? <section className="iad-job-section"><p>请先添加服务器上的 Labelme 数据集。</p><button onClick={() => workspace.navigate("industrial-datasets")}>前往数据集管理</button></section> : <>
      {(pageId === "industrial-normal" || pageId === "industrial-defect") && <KnowledgePage key={datasetId} dataset={dataset} kind={pageId === "industrial-normal" ? "normal" : "defect"} />}
      {pageId === "industrial-audit" && <nav className="iad-tabs" aria-label="审计视图">{[["results", "结果"], ["jobs", "模型审计作业"], ["reports", "报告"]].map(([tab, label]) => <button key={tab} aria-pressed={view.tab === tab} className={view.tab === tab ? "active" : ""} onClick={() => workspace.updateView(pageId, { tab })}>{label}</button>)}</nav>}
      {gallery && <div className={pageId === "industrial-images" ? "iad-browse" : "iad-main"}>{grid}
        {pageId !== "industrial-images" && inspector}</div>}
      {pageId === "industrial-images" && view.selected && <Modal title="图像详情" onClose={() => workspace.updateView(pageId, { selected: "" })}><div className="iad-row"><button onClick={() => workspace.updateView(pageId, { selected: "" })}>返回图像浏览</button><button onClick={() => workspace.navigate("industrial-audit", view.selected)}>前往模型审计</button><button onClick={() => workspace.navigate("industrial-review", view.selected)}>前往人工复核</button></div>{inspector}</Modal>}
      {pageId === "industrial-audit" && view.tab === "jobs" && <AuditJobs key={datasetId} dataset={dataset} filters={view.filters} jobs={audit.jobs} onJobsChanged={audit.refresh} />}
      {pageId === "industrial-audit" && view.tab === "reports" && <AuditReport dataset={dataset} />}
    </>}
  </div>;
}
