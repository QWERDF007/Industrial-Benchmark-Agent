import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Dataset, Filters, ReviewDecisionRecord, SamplePage } from "../shared/contracts.js";
import { initialReviewFilters, message, request, reviewLabel, sampleQuery } from "./api.js";
import { DatasetManager } from "./components/DatasetManager.js";
import { SampleFilters } from "./components/SampleFilters.js";
import { SampleGrid } from "./components/SampleGrid.js";
import { SampleInspector } from "./components/SampleInspector.js";
import { AuditSetup } from "./components/AuditSetup.js";
import { AuditJobs, AuditReport } from "./components/AuditJobs.js";
import { KnowledgeConflictReview } from "./components/KnowledgeConflictReview.js";
import { ExplorationPage } from "./components/ExplorationPage.js";
import { KnowledgePage } from "./components/KnowledgePage.js";
import { Modal } from "./components/Modal.js";
import { ReviewRecords } from "./components/ReviewRecords.js";
import { pageSize } from "./components/Pagination.js";
import { useJobs } from "./useJobs.js";
import { useWorkspace, type PageId } from "./workspace.js";
import { workbenchStyles } from "./styles.js";
import { useSampleNavigation, type SampleWindow } from "./useSampleNavigation.js";
import { usePagePosition } from "./usePagePosition.js";
import {PageTabs} from "./components/layout/PageTabs.js";
import {WorkbenchHeader} from './components/layout/WorkbenchHeader.js';

export function WorkbenchPage({ pageId }: { pageId: PageId }) {
  const { workspace, state } = useWorkspace();
  const datasetId = state.datasetId, view = workspace.view(pageId);
  const [auditSetupOpen, setAuditSetupOpen] = useState(false);
  const [auditDetailOpen, setAuditDetailOpen] = useState(false);
  const [auditWidth, setAuditWidth] = useState<number | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [result, setResult] = useState<SampleWindow>({ query: "", items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const advance = useRef<{ query: string; sampleId: string; position: number } | null>(null);
  const [reviewConfirmation, setReviewConfirmation] = useState<{ datasetId: string; name: string; decision: string } | null>(null);
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
  const audit = useJobs("audit", pageId === "industrial-audit" ? datasetId : "", changed, workspace.view("industrial-audit").job);
  useEffect(() => { const controller = new AbortController(); void loadDatasets(undefined, controller.signal); return () => controller.abort(); }, [loadDatasets]);
  const gallery = pageId === "industrial-images" || ((pageId === "industrial-review" || pageId === "industrial-audit") && view.tab === "results");
  const query = sampleQuery(datasetId, view.filters, view.page, pageSize);
  const navigation = useSampleNavigation(pageId, dataset?.task_id, query, result, gallery);
  const surface = usePagePosition(gallery ? JSON.stringify([pageId, view.tab, query]) : null, state.active && state.pageId === pageId && !!dataset && result.query === query && !loading);
  useEffect(() => {
    if (pageId !== "industrial-audit" || !surface.current) return;
    const observer = new ResizeObserver(([entry]) => setAuditWidth(entry.borderBoxSize[0].inlineSize));
    observer.observe(surface.current);
    return () => observer.disconnect();
  }, [pageId, surface]);
  useEffect(() => setAuditDetailOpen(false), [datasetId, view.tab]);
  const auditCompact = auditWidth !== null && auditWidth <= 900;
  const auditModalOpen = auditCompact && (auditDetailOpen || !!view.inspection);
  useEffect(() => {
    if (!dataset || !gallery) return;
    const controller = new AbortController(); setLoading(true);
    const requestedAdvance = advance.current;
    request<SamplePage>(`/samples/${dataset.task_id}?${query}`, undefined, undefined, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setResult({ ...result, query }); setError("");
      const current = workspace.view(pageId), snapshot = workspace.getSnapshot();
      if (requestedAdvance && advance.current === requestedAdvance) {
        advance.current = null;
        if (requestedAdvance.query === query && current.selected === requestedAdvance.sampleId && snapshot.active && snapshot.pageId === pageId && snapshot.datasetId === datasetId && current.tab === "results") {
          if (!result.items.length && result.total > 0 && current.page > 1) workspace.updateView(pageId, { page: Math.ceil(result.total / pageSize), selected: "" }, true);
          else workspace.updateView(pageId, { selected: (result.items[requestedAdvance.position] || result.items[0])?.sample_id || "" }, true);
          return;
        }
      }
      if (!current.selected && snapshot.active && snapshot.pageId === pageId && snapshot.datasetId === datasetId && (pageId === "industrial-audit" || pageId === "industrial-review") && result.items.length) workspace.updateView(pageId, { selected: result.items[0].sample_id }, true);
    }).catch(e => { if (!controller.signal.aborted) setError(message(e)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [dataset?.task_id, query, gallery, revision, workspace, pageId]);
  function reviewed(record: ReviewDecisionRecord, relativePath: string) {
    const snapshot = workspace.getSnapshot(), current = workspace.view(pageId);
    if (snapshot.active && snapshot.pageId === pageId && snapshot.datasetId === datasetId && current.selected === record.sample_id && current.tab === "results" && current.filters.review_status === "pending" && current.filters === view.filters && current.page === view.page) {
      const position = result.query === query ? result.items.findIndex(sample => sample.sample_id === record.sample_id) : -1;
      advance.current = { query, sampleId: record.sample_id, position: Math.max(0, position) };
      setReviewConfirmation({ datasetId, name: relativePath.split("/").pop()!, decision: record.decision });
    }
    changed();
  }
  const updateFilters = (filters: Filters) => workspace.updateView(pageId, { filters, page: 1, selected: "" });
  const grid = dataset && <SampleGrid key={datasetId} layout={pageId === "industrial-review" ? "queue" : "grid"} showFilters={pageId === "industrial-images"} dataset={dataset} filters={view.filters} onFilters={updateFilters} items={result.query === query ? result.items : []} total={result.query === query ? result.total : 0} page={view.page} onPage={page => workspace.updateView(pageId, { page, selected: "" })} selected={view.selected} onSelect={selected => {workspace.updateView(pageId, { selected });if(pageId === "industrial-audit")setAuditDetailOpen(auditCompact);}} loading={loading} sourceManagement={pageId === "industrial-images" ? { active: view.tab === "sources", onChanged: changed } : undefined} />;
  const inspectedSample = pageId === "industrial-review" && view.tab === "records" ? view.historySampleId : view.selected;
  const inspector = dataset && <SampleInspector key={pageId === "industrial-review" && view.tab === "results" ? datasetId : `${datasetId}:${inspectedSample}`} dataset={dataset} sampleId={inspectedSample} mode={pageId === "industrial-review" ? "review" : pageId === "industrial-images" ? "browse" : "model"} queue={pageId === "industrial-review" && view.tab === "results" ? grid : undefined} filters={<SampleFilters defaults={initialReviewFilters} dataset={dataset} filters={view.filters} onFilters={updateFilters} />} advanceOnSubmit={view.tab === "results" && view.filters.review_status === "pending"} panel={pageId === "industrial-audit" ? {presentation: auditWidth === null ? "closed" : auditModalOpen ? "modal" : auditCompact ? "closed" : "inline", onOpen: setAuditDetailOpen,
    onClose: () => {setAuditDetailOpen(false);workspace.updateView(pageId,{inspection:null},true);}, restoreFocus: () => surface.current?.querySelector<HTMLElement>(`.iad-sample[data-sample-id="${CSS.escape(view.selected)}"]`) || null} : undefined} revision={revision} onReviewed={reviewed} jobs={audit.jobs} onJobsChanged={audit.refresh} navigation={gallery ? navigation : undefined} />;

  const datasetControls = <><select aria-label="当前数据集" value={datasetId} onChange={event => workspace.selectDataset(event.target.value)}><option value="" disabled>选择数据集</option>{datasets.map(item => <option key={item.dataset_id} value={item.dataset_id}>{item.name} ({item.total_samples})</option>)}</select><button onClick={changed}>刷新</button></>;

  return <div ref={surface} className="iad-workbench" data-page={pageId}><style>{workbenchStyles}</style>
    {pageId !== "industrial-datasets" && (!dataset || (pageId !== "industrial-exploration" && pageId !== "industrial-knowledge")) && <WorkbenchHeader pageId={pageId}>
      {datasetControls}{pageId === "industrial-audit" && <button className="iad-primary" disabled={!dataset} onClick={() => setAuditSetupOpen(true)}>新建审计</button>}
    </WorkbenchHeader>}
    {(error || audit.error) && <p role="alert" className="iad-error">{error || audit.error}</p>}
    {pageId === "industrial-datasets" ? <>
      <DatasetManager datasets={datasets} selected={dataset} onChanged={id => { void loadDatasets(id); setRevision(v => v + 1); }} />
    </> : !dataset ? <section className="iad-job-section"><p>请先添加服务器上的数据集。</p><button onClick={() => workspace.navigate("industrial-datasets")}>前往数据集管理</button></section> : <>
      {pageId === "industrial-exploration" && <ExplorationPage key={datasetId} dataset={dataset} refreshRevision={revision} headerActions={datasetControls} />}
      {pageId === "industrial-knowledge" && <KnowledgePage key={`${datasetId}:${state.knowledgeKind}`} dataset={dataset} kind={state.knowledgeKind} refreshRevision={revision} headerActions={datasetControls} />}
      {pageId === "industrial-images" && <PageTabs label="图像视图" items={[{id:"results",label:"全部图像"},{id:"sources",label:"良品来源"}]} value={view.tab} onChange={tab=>workspace.updateView(pageId,{tab,selected:""})}><div className="iad-browse">{grid}</div>{view.selected && <Modal title="图像详情" restoreFocus={() => surface.current?.querySelector<HTMLElement>(`.iad-sample[data-sample-id="${CSS.escape(view.selected)}"]`) || null} onClose={() => workspace.updateView(pageId, { selected: "" })}>{inspector}</Modal>}</PageTabs>}
      {pageId === "industrial-audit" && <>
        <PageTabs label="审计视图" items={[{id:"results",label:"结果"},{id:"jobs",label:"模型审计作业"},{id:"reports",label:"报告"}]} value={view.tab} onChange={tab => workspace.updateView(pageId,{tab})}>
          {view.tab !== "jobs" && audit.jobs.some(job => ["RUNNING","PENDING"].includes(job.status)) && <p role="status"><button onClick={() => workspace.updateView(pageId,{tab:"jobs"})}>查看执行中的审计作业</button></p>}
          {view.tab === "results" && <><SampleFilters dataset={dataset} filters={view.filters} onFilters={updateFilters} /><div className="iad-main" data-compact={auditCompact}>{grid}{inspector}</div></>}
          {view.tab === "jobs" && <AuditJobs jobs={audit.jobs} onJobsChanged={audit.refresh} />}
          {view.tab === "reports" && <AuditReport key={datasetId} dataset={dataset} />}
        </PageTabs>
        {auditSetupOpen && <Modal title="新建模型审计" className="iad-drawer" onClose={() => setAuditSetupOpen(false)}><AuditSetup key={datasetId} dataset={dataset} filters={view.filters} jobs={audit.jobs} revision={revision} onJobsChanged={audit.refresh} onStarted={job => {setAuditSetupOpen(false);workspace.updateView(pageId,{tab:"jobs",job:job.run_id});}} /></Modal>}
      </>}
      {pageId === "industrial-review" && <PageTabs label="复核视图" items={[{id:"results",label:"复核队列"},{id:"conflicts",label:"知识冲突"},{id:"records",label:"复核记录"}]} value={view.tab} onChange={tab => workspace.updateView(pageId,{tab})}>
        {view.tab === "conflicts" && <KnowledgeConflictReview key={datasetId} datasetId={datasetId} />}
        {view.tab === "results" && <>{reviewConfirmation?.datasetId === datasetId && <p role="status" className="iad-review-confirmation">已提交 {reviewConfirmation.name} · {reviewLabel(reviewConfirmation.decision)}</p>}{inspector}</>}
        {view.tab === "records" && <ReviewRecords key={datasetId} datasetId={datasetId} page={view.historyPage} search={view.historySearch} selected={view.historySampleId} revision={revision}
          onPage={historyPage => workspace.updateView(pageId, { historyPage })} onSearch={historySearch => workspace.updateView(pageId, { historySearch, historyPage: 1 }, true)} onSelect={historySampleId => workspace.updateView(pageId, { historySampleId })} onQueue={() => workspace.updateView(pageId, { tab: "results" })} detail={inspector} />}
      </PageTabs>}
    </>}
  </div>;
}
