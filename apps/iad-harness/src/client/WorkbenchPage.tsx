import {Select} from './components/Select.js';
import {IconButton} from "./components/IconButton.js";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { DatasetCatalog, Filters, ReviewDecisionRecord, SamplePage } from "../shared/contracts.js";
import { initialReviewFilters, message, request, reviewLabel, sampleQuery } from "./api.js";
import { DatasetManager } from "./components/DatasetManager.js";
import { SampleFilters } from "./components/SampleFilters.js";
import { SampleGrid } from "./components/SampleGrid.js";
import { SampleInspector } from "./components/SampleInspector.js";
import { AuditPage } from './components/AuditPage.js';
import { KnowledgeConflictReview } from "./components/KnowledgeConflictReview.js";
import { ExplorationPage } from "./components/ExplorationPage.js";
import { KnowledgePage } from "./components/KnowledgePage.js";
import { ReviewRecords } from "./components/ReviewRecords.js";
import { pageSize } from "./components/Pagination.js";
import { useWorkspace, type PageId } from "./workspace.js";
import { workbenchStyles } from "./styles.js";
import { useSampleNavigation, type SampleWindow } from "./useSampleNavigation.js";
import { usePagePosition } from "./usePagePosition.js";
import {PageTabs} from "./components/layout/PageTabs.js";
import {WorkbenchHeader} from './components/layout/WorkbenchHeader.js';
import { ImagesPage } from "./components/ImagesPage.js";
import {useDatasetCatalog} from './useDatasetCatalog.js';

const emptyCatalog: DatasetCatalog = {datasets:[],groups:[]};

export function WorkbenchPage({ pageId }: { pageId: PageId }) {
  const { workspace, state } = useWorkspace();
  const catalog = useDatasetCatalog();
  const {datasets,groups} = catalog.data || emptyCatalog;
  const dataset = datasets.find(d => d.dataset_id === state.datasetId) || datasets[0];
  const datasetId = dataset?.dataset_id || '', view = workspace.view(pageId,datasetId);
  const [result, setResult] = useState<SampleWindow>({ query: "", items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const advance = useRef<{ query: string; sampleId: string; position: number } | null>(null);
  const [reviewConfirmation, setReviewConfirmation] = useState<{ datasetId: string; name: string; decision: string } | null>(null);
  const loadDatasets = useCallback(async (preferred?: string) => {
    const result = await catalog.refresh();
    if (result && preferred) workspace.selectDataset(preferred,true);
  }, [catalog.refresh,workspace]);
  const changed = useCallback(() => { setRevision(v => v + 1); void loadDatasets(); }, [loadDatasets]);
  useEffect(() => {if (catalog.data && datasetId !== state.datasetId) workspace.selectDataset(datasetId,true);},[catalog.data,datasetId,state.datasetId,workspace]);
  const gallery = pageId === "industrial-review" && view.tab === "results";
  const query = sampleQuery(datasetId, view.filters, view.page, pageSize);
  const navigation = useSampleNavigation(pageId, dataset?.task_id, query, result, gallery);
  const surface = usePagePosition(gallery ? JSON.stringify([pageId, view.tab, query]) : null, state.active && state.pageId === pageId && !!dataset && result.query === query && !loading);
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
      if (!current.selected && snapshot.active && snapshot.pageId === pageId && snapshot.datasetId === datasetId && pageId === "industrial-review" && result.items.length) workspace.updateView(pageId, { selected: result.items[0].sample_id }, true);
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
  const grid = dataset && <SampleGrid key={datasetId} layout={pageId === "industrial-review" ? "queue" : "grid"} showFilters={pageId === "industrial-images"} dataset={dataset} filters={view.filters} onFilters={updateFilters} items={result.query === query ? result.items : []} total={result.query === query ? result.total : 0} page={view.page} onPage={page => workspace.updateView(pageId, { page, selected: "" })} selected={view.selected} onSelect={selected => workspace.updateView(pageId, { selected })} loading={loading} sourceManagement={pageId === "industrial-images" ? { active: view.tab === "sources", onChanged: changed } : undefined} />;
  const inspectedSample = pageId === "industrial-review" && view.tab === "records" ? view.historySampleId : view.selected;
  const inspector = dataset && <SampleInspector key={pageId === "industrial-review" && view.tab === "results" ? datasetId : `${datasetId}:${inspectedSample}`} dataset={dataset} sampleId={inspectedSample} mode={pageId === "industrial-review" ? "review" : pageId === "industrial-images" ? "browse" : "model"} queue={pageId === "industrial-review" && view.tab === "results" ? grid : undefined} filters={<SampleFilters defaults={initialReviewFilters} dataset={dataset} filters={view.filters} onFilters={updateFilters} />} advanceOnSubmit={view.tab === "results" && view.filters.review_status === "pending"} revision={revision} onReviewed={reviewed} jobs={[]} onJobsChanged={changed} navigation={gallery ? navigation : undefined} />;

  const datasetControls = <><Select aria-label="当前数据集" value={datasetId} onChange={event => workspace.selectDataset(event.target.value)}><option value="" disabled>选择数据集</option>{datasets.map(item => <option key={item.dataset_id} value={item.dataset_id}>{item.name}</option>)}</Select><IconButton icon="refresh" label="刷新" onClick={changed} /></>;

  return <div ref={surface} className="iad-workbench" data-page={pageId}><style>{workbenchStyles}</style>
    {(!catalog.data || (pageId !== "industrial-datasets" && pageId !== "industrial-images" && pageId !== "industrial-audit" && (!dataset || (pageId !== "industrial-exploration" && pageId !== "industrial-knowledge")))) && <WorkbenchHeader pageId={pageId}>
      {catalog.data && datasetControls}
    </WorkbenchHeader>}
    {(error || catalog.error) && <p role="alert" className="iad-error">{error || catalog.error}</p>}
    {!catalog.data ? <p role="status">{catalog.loading ? '正在加载数据集…' : '数据集加载失败。'}</p> : pageId === "industrial-datasets" ? <>
      <DatasetManager datasets={datasets} groups={groups} onChanged={id => { void loadDatasets(id); setRevision(v => v + 1); }} />
    </> : pageId === "industrial-images" ? <>
      <ImagesPage datasets={datasets} groups={groups} onDatasetsChanged={() => void loadDatasets()} />
    </> : !dataset ? <section className="iad-job-section"><p>请先添加服务器上的数据集。</p><button onClick={() => workspace.navigate("industrial-datasets")}>前往数据集管理</button></section> : <>
      {pageId === "industrial-exploration" && <ExplorationPage key={datasetId} dataset={dataset} refreshRevision={revision} />}
      {pageId === "industrial-knowledge" && <KnowledgePage key={datasetId} dataset={dataset} refreshRevision={revision} />}
      {pageId === "industrial-audit" && <AuditPage dataset={dataset} datasets={datasets} groups={groups}
        refreshRevision={revision} onDatasetsChanged={changed} />}
      {pageId === "industrial-review" && <PageTabs label="复核视图" items={[{id:"results",label:"复核队列"},{id:"conflicts",label:"知识冲突"},{id:"records",label:"复核记录"}]} value={view.tab} onChange={tab => workspace.updateView(pageId,{tab})}>
        {view.tab === "conflicts" && <KnowledgeConflictReview key={datasetId} datasetId={datasetId} />}
        {view.tab === "results" && <>{reviewConfirmation?.datasetId === datasetId && <p role="status" className="iad-review-confirmation">已提交 {reviewConfirmation.name}，{reviewLabel(reviewConfirmation.decision)}</p>}{inspector}</>}
        {view.tab === "records" && <ReviewRecords key={datasetId} datasetId={datasetId} page={view.historyPage} search={view.historySearch} selected={view.historySampleId} revision={revision}
          onPage={historyPage => workspace.updateView(pageId, { historyPage })} onSearch={historySearch => workspace.updateView(pageId, { historySearch, historyPage: 1 }, true)} onSelect={historySampleId => workspace.updateView(pageId, { historySampleId })} onQueue={() => workspace.updateView(pageId, { tab: "results" })} detail={inspector} />}
      </PageTabs>}
    </>}
  </div>;
}
