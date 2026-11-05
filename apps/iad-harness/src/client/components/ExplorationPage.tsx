import {ExplorationPresetDialog} from './ExplorationPresetDialog.js';
import {ExplorationSourceDialog} from './ExplorationSourceDialog.js';
import {PromptDrawer} from './PromptDrawer.js';
import {JobStatusDrawer, JobStatusButton} from './JobStatusDrawer.js';
import {Select} from './Select.js';
import {TabBar} from './layout/TabBar.js';
import {Button} from './Button.js';
import {ThumbnailCard} from "./ThumbnailCard.js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dataset, DatasetGroup, JobSnapshot } from "../../shared/contracts.js";
import { mediaUrl, message, request } from "../api.js";
import {useWorkbenchModel} from "../models.js";
import {useJobs} from "../useJobs.js";
import {jobStatuses} from "../../shared/job-display.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import {PlusIcon} from "../AuditIcon.js";
import { IconButton } from "./IconButton.js";
import {DeleteAction} from './DeleteAction.js';
import { DatasetScopeSelector } from "./DatasetScopeSelector.js";
import { DirectionDetailDialog, type DirectionItem } from "./DirectionDetailDialog.js";
import { FullscreenViewer, type FullscreenViewerItem } from "./FullscreenViewer.js";
import { Pagination, IBA_JOBS_PAGE_SIZE } from "./Pagination.js";
import { ClearFilterButton } from "./CommonFilterControls.js";

import type {ExplorationResults, DirectionRemoval, ExplorationPromptPreset} from "../../shared/domain.generated.js";
import {useResource} from "../useResource.js";
import {explorationCandidates,explorationDirections,type ExplorationCandidate} from "../exploration-view.js";

function expElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return (m > 0 ? `${m}分` : "") + `${s}秒`;
}

let cachedDatasets: Dataset[] | null = null;
let cachedGroups: DatasetGroup[] | null = null;

export function ExplorationPage({
  dataset,
  refreshRevision,
}: {
  dataset: Dataset;
  refreshRevision: number;
}) {
  const model=useWorkbenchModel();
  const initialGroups = buildHierarchyGroups(cachedDatasets || [dataset], cachedGroups || []);
  const initialParentId = getDatasetGroupId(dataset, initialGroups);
  const initialChildren = (cachedDatasets || [dataset]).filter(
    (d) => getDatasetGroupId(d, initialGroups) === initialParentId
  );
  const [datasets, setDatasets] = useState<Dataset[]>(() => cachedDatasets || [dataset]);
  const [groups, setGroups] = useState<DatasetGroup[]>(() => initialGroups);
  const [selectedParentId, setSelectedParentId] = useState<string>(() => initialParentId);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(() =>
    initialChildren.length > 0 ? initialChildren.map((c) => c.dataset_id) : [dataset.dataset_id]
  );

  // View state: 'jobs' (unified layout) or 'setup' (3-step creation)
  const [view, setView] = useState<"jobs" | "setup">("jobs");
  const [jobFilter, setJobFilter] = useState("全部");
  const [jobSearch, setJobSearch] = useState("");
  const [statusJobId, setStatusJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobPage, setJobPage] = useState<number>(1);
  const [refreshTick, setRefreshTick] = useState(0);

  const [error,setError]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const submission=useRef<{key:string;id:string}|null>(null);

  // Setup state
  const [sampleTab, setSampleTab] = useState<"normal" | "defect">("normal");
  const [normalSelected, setNormalSelected] = useState<string[]>([]);
  const [defectSelected, setDefectSelected] = useState<string[]>([]);
  const [presets, setPresets] = useState<ExplorationPromptPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");

  // Modals
  const [modal, setModal] = useState<"" | "source" | "save" | "direction" | "prompt">("");
  const [promptText, setPromptText] = useState<string | null>(null);
  const [viewingDirection, setViewingDirection] = useState<DirectionItem | null>(null);

  // Direction detail interaction
  const [highlightRef, setHighlightRef] = useState<string | null>(null);

  // Fullscreen Viewer state (reusing shared FullscreenViewer.tsx)
  const [viewerData, setViewerData] = useState<{
    items: FullscreenViewerItem[];
    currentIndex: number;
  } | null>(null);



  // Candidate samples pool
  const [samplePool, setSamplePool] = useState<ExplorationCandidate[]>([]);
  const [samplesLoaded,setSamplesLoaded]=useState(false),[samplesLoading,setSamplesLoading]=useState(false);
  const sampleById=useMemo(()=>new Map(samplePool.map(item=>[item.id,item])),[samplePool]);

  const progress=useCallback(()=>setRefreshTick(value=>value+1),[]);
  const jobQuery=useJobs('exploration',selectedChildIds,progress,'',refreshRevision);
  const jobs=jobQuery.jobs;
  const refreshJobs=()=>{jobQuery.refresh();progress();};

  // Load datasets and hierarchy
  useEffect(() => {
    let active = true;
    request<{ datasets: Dataset[]; groups?: DatasetGroup[] }>("/datasets")
      .then((res) => {
        if (!active) return;
        const dsList = res.datasets || [dataset];
        const grpList = buildHierarchyGroups(dsList, res.groups || []);
        cachedDatasets = dsList;
        cachedGroups = res.groups || [];
        setDatasets(dsList);
        setGroups(grpList);
        const parentId = getDatasetGroupId(dataset, grpList);
        setSelectedParentId(parentId);
        const children = dsList.filter((d) => getDatasetGroupId(d, grpList) === parentId);
        setSelectedChildIds(children.length > 0 ? children.map((c) => c.dataset_id) : [dataset.dataset_id]);
      })
      .catch(() => {
        if (!active) return;
        const grpList = buildHierarchyGroups([dataset], []);
        setGroups(grpList);
        const parentId = getDatasetGroupId(dataset, grpList);
        setSelectedParentId(parentId);
        setSelectedChildIds((prev) => (prev.length ? prev : [dataset.dataset_id]));
      });
    return () => {
      active = false;
    };
  }, [dataset, refreshRevision]);

  // Load presets from server if available
  useEffect(() => {
    let active = true;
    request<{ presets: ExplorationPromptPreset[] }>("/exploration/presets")
      .then((res) => {
        if (active && res.presets?.length) {
          setPresets(res.presets);
          const first = res.presets[0];
          setSelectedPresetId(first.id);
          setPrompt(first.text);
          setOriginalPrompt(first.text);
        }
      })
      .catch(error => {if(active)setError(message(error));});
    return () => {
      active = false;
    };
  }, [refreshRevision]);

  useEffect(() => {
    if(view!=='setup')return;
    setSamplePool([]);setNormalSelected([]);setDefectSelected([]);setSamplesLoaded(false);setSamplesLoading(false);
  },[selectedChildIds,view]);

  useEffect(() => {
    if(view!=='setup'||modal!=='source'||samplesLoaded)return;
    const controller=new AbortController();
    setSamplesLoading(true);
    explorationCandidates(selectedChildIds,controller.signal).then(pool=>{
      if(controller.signal.aborted)return;
      setSamplePool(pool);setSamplesLoaded(true);setSamplesLoading(false);
    }).catch(error=>{if(!controller.signal.aborted){setSamplesLoading(false);setError(message(error));}});
    return()=>controller.abort();
  },[selectedChildIds,view,modal,samplesLoaded]);

  // Derived state
  const parentGroups = groups.length ? groups : buildHierarchyGroups([dataset], []);
  const currentChildDatasets = datasets.filter((d) => getDatasetGroupId(d, groups) === selectedParentId);

  const filteredJobs: JobSnapshot[] = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchStatus = jobFilter === "全部" || j.status === jobFilter;
      const matchSearch = !q || [j.run_id,j.root_run_id].some(id=>id.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [jobs, jobFilter, jobSearch]);

  const jobPages = Math.max(1, Math.ceil(filteredJobs.length / IBA_JOBS_PAGE_SIZE));
  const currentJobPage = Math.max(1, Math.min(jobPages, jobPage));
  const shownJobs: JobSnapshot[] = useMemo(() => {
    return filteredJobs.slice(
      (currentJobPage - 1) * IBA_JOBS_PAGE_SIZE,
      currentJobPage * IBA_JOBS_PAGE_SIZE
    );
  }, [filteredJobs, currentJobPage]);

  const selectedJob: JobSnapshot | null = useMemo(() => {
    if (!shownJobs.length) return null;
    if (selectedJobId) {
      const match = shownJobs.find((j: JobSnapshot) => j.root_run_id === selectedJobId || j.run_id === selectedJobId);
      if (match) return match;
    }
    return shownJobs[0] || null;
  }, [shownJobs, selectedJobId]);

  const selectedSnapshot=selectedJob;
  const versionKey=(selectedSnapshot?.dataset_results||[]).map(result=>result.exploration_version_id||'').join('|');
  const results=useResource<ExplorationResults>(selectedJob?`/analysis/results/${encodeURIComponent(selectedJob.run_id)}`:null,`${versionKey}|${refreshTick}`);
  const snapshots=useMemo(()=>(results.data?.snapshots||[]).filter(snapshot=>selectedChildIds.includes(snapshot.dataset_id)),
    [results.data,selectedChildIds]);
  const selectedJobDirections=useMemo(()=>explorationDirections(snapshots,results.data?.removed_direction_ids),[snapshots,results.data]);
  const selectedJobLimitations=snapshots.flatMap(snapshot=>snapshot.limitations);
  const selectedJobSummary=snapshots.map(snapshot=>snapshot.summary).join('\n');

  const handleJobPageChange = (newPage: number) => {
    const targetPage = Math.max(1, Math.min(jobPages, newPage));
    setJobPage(targetPage);
    const firstOnPage = filteredJobs[(targetPage - 1) * IBA_JOBS_PAGE_SIZE];
    if (firstOnPage) {
      setSelectedJobId(firstOnPage.root_run_id);
    }
  };

  const runningJob = jobs.find((j) => j.status === "RUNNING" || j.status === "PENDING");
  const runReason=runningJob ? '已有探索作业正在运行' : !selectedChildIds.length ? '请选择子数据集'
    : ![...normalSelected,...defectSelected].every(id=>sampleById.has(id)) ? '图像不可用，请重新选择'
    : !model.ready ? model.loading ? '正在读取模型' : '请先配置工作台模型'
    : !prompt.trim() ? '请填写探索提示词' : '';
  const canRun = !submitting && !runReason;

  // Handle parent group change
  const handleParentChange = (newParentId: string) => {
    setSelectedParentId(newParentId);
    const children = datasets.filter((d) => getDatasetGroupId(d, groups) === newParentId);
    setSelectedChildIds(children.map((c) => c.dataset_id));
    setJobPage(1);
  };

  // Toggle child dataset selection
  const handleChildToggle = (cid: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]
    );
    setJobPage(1);
  };

  // Preset selection
  const handlePresetChange = (presetId: string) => {
    const p = presets.find((x) => x.id === presetId);
    if (p) {
      setSelectedPresetId(presetId);
      setPrompt(p.text);
      setOriginalPrompt(p.text);
    }
  };

  const handleStartExploration = async () => {
    if(!canRun)return;
    setSubmitting(true);setError('');
    try {
      const key=JSON.stringify([selectedChildIds,normalSelected,defectSelected,prompt,selectedPresetId]);
      if(submission.current?.key!==key)submission.current={key,id:crypto.randomUUID()};
      const res=await request<JobSnapshot>('/analysis/start',{submission_id:submission.current.id,analysis_kind:'exploration',
        dataset_ids:selectedChildIds,normal_images:normalSelected,defect_images:defectSelected,
        prompt:{preset_id:selectedPresetId,preset_name:presets.find(preset=>preset.id===selectedPresetId)?.name||'自定义',text:prompt}});
      setSelectedJobId(res.run_id);setJobPage(1);refreshJobs();setView('jobs');submission.current=null;
    } catch(error){setError(message(error));} finally {setSubmitting(false);}
  };

  const currentEvidence=useMemo(()=>{
    const all=viewingDirection?.evidences||[];
    return {normals:all.filter(item=>item.kind==='normal'),defects:all.filter(item=>item.kind==='defect'),all};
  },[viewingDirection]);

  // Scroll evidence into view when hovering or clicking chips
  const handleChipFocus = (ref: string) => {
    setHighlightRef(ref);
  };

  // Open FullscreenViewer on evidence click
  const handleOpenEvidenceFullscreen = (clickedRef: string) => {
    const allItems: FullscreenViewerItem[] = currentEvidence.all.map((item) => ({
      id: item.ref,sampleId:item.sampleId,
      title: `${item.label} ${item.filename}`,
      imageUrl: item.fullUrl,
    }));
    const index = currentEvidence.all.findIndex((item) => item.ref === clickedRef);
    if(index<0){setError('图像证据不可用');return;}
    setViewerData({
      items: allItems,
      currentIndex: index,
    });
  };

  return (
    <div id="exploration-page" className="iad-exploration-page">
      {(error||results.error||jobQuery.error)&&<p role="alert" className="iad-error">{error||results.error||jobQuery.error}</p>}
      {/* Top Heading */}
      <div className="exp-heading">
        <div>
          <h1>{view === "setup" ? "新建探索" : "方向探索"}</h1>
        </div>
        <div className="exp-heading-actions">
          {view === "setup" ? (
            <Button type="button"  onClick={() => setView("jobs")}>
              返回作业与结果
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              disabled={!!runningJob}
              title={runningJob ? "已有探索任务运行或排队" : "新建探索"}
              onClick={() => setView("setup")}
            >
              新建探索
            </Button>
          )}
        </div>
      </div>

      {/* Dataset & Child Scope Selector (Shared Component) */}
      <DatasetScopeSelector
        className="exp-scope"
        groups={parentGroups}
        selectedGroupId={selectedParentId}
        onGroupChange={handleParentChange}
        childDatasets={currentChildDatasets}
        selectedChildIds={selectedChildIds}
        onChildToggle={handleChildToggle}
        disabled={submitting}
        groupId="exp-parent"
        childId="exp-child-toggle"
        childMenuId="exp-child-menu"
      >
        <IconButton icon="refresh" id="refresh" type="button" title="刷新探索作业" label="刷新探索作业" disabled={submitting} onClick={() => {
            refreshJobs();
          }} />
      </DatasetScopeSelector>

      {/* Main Content: Setup View or Unified Workspace */}
      {view === "setup" ? (
        <div>
          {/* Step 1: Select Contrast Samples */}
          <section className="exp-panel">
            <div className="exp-panel-title">
              <h2>选择对比样例</h2>
            </div>
            <div className="exp-tab-header">
              <TabBar<'normal' | 'defect'> label="对比样例" value={sampleTab} onChange={setSampleTab} items={[
                {id: 'normal', label: `良品样例 (${normalSelected.length})`},
                {id: 'defect', label: `异常样例 (${defectSelected.length})`},
              ]} />
              <IconButton icon="delete" type="button" disabled={sampleTab === "normal" ? !normalSelected.length : !defectSelected.length} title="清空当前页已选图像" label={`清空${sampleTab === "normal" ? "良品" : "异常"}已选图像`} onClick={() => {
                  if (sampleTab === "normal") setNormalSelected([]);
                  else setDefectSelected([]);
                }} />
            </div>

            <div className="exp-sample-body">
              <div className="exp-previews exp-previews-wide">
                {(sampleTab === "normal" ? normalSelected : defectSelected).map((id) => {
                  const item = sampleById.get(id);
                  return (
                    <div key={id} className="exp-preview">
                      {item && <ThumbnailCard src={item.url} label={item.filename} onClick={()=>setViewerData({items:[{
                        id:item.id,sampleId:item.id,title:item.filename,imageUrl:mediaUrl({task_id:item.datasetId,sample_id:item.id})}],currentIndex:0})} />}
                    </div>
                  );
                })}
                <div className="exp-preview add-tile">
                  <button
                    type="button"
                    className="exp-add-image"
                    aria-label={`继续添加${sampleTab === "normal" ? "良品" : "异常"}图像`}
                    title="继续添加图像"
                    onClick={() => {
                      setModal("source");
                    }}
                  >
                    <PlusIcon size={24} />
                    {!(sampleTab === "normal" ? normalSelected : defectSelected).length && <span>添加图像</span>}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Exploration Prompt */}
          <section className="exp-panel">
            <div className="exp-panel-title">
              <h2>探索提示词</h2>
            </div>
            <div className="exp-prompt-head">
              <label className="exp-input">
                提示词预设
                <Select
                  id="exp-preset"
                  value={selectedPresetId}
                  onChange={(e) => handlePresetChange(e.target.value)}
                >
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </label>
              <Button
                type="button"

                disabled={prompt === originalPrompt}
                onClick={() => setPrompt(originalPrompt)}
              >
                重置为预设
              </Button>
              <Button
                type="button"

                disabled={!prompt.trim()}
                onClick={() => {
                  setModal("save");
                }}
              >
                另存为预设
              </Button>
            </div>
            <label className="exp-input">
              提示词正文
              <textarea
                id="exp-prompt"
                rows={7}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </label>
          </section>

          {/* Step 3: Confirm and Start */}
          <section className="exp-panel">
            <div className="exp-panel-title">
              <h2>确认并启动</h2>
            </div>
            <div className="exp-brief">
              <span>所选子数据集 {selectedChildIds.length} 个</span>
              <span>优先样例：良品 {normalSelected.length}，异常 {defectSelected.length}</span>
              <span>模型 {model.view?.selection?.model_id || '未配置'}</span>
              <span>执行：所选子集全量分批迭代</span>
            </div>
            <div className="exp-summarybar">
              <span>
                {runReason || '可启动'}
              </span>
              <Button
                type="button"
                variant="primary"
                disabled={!canRun}
                onClick={handleStartExploration}
              >
                启动联合探索
              </Button>
            </div>
          </section>
        </div>
      ) : (
        /* Unified Workspace Layout */
        <div className="exp-unified-layout">
          {/* Upper Panel: 探索作业 */}
          <section className={`exp-panel exp-job-list ${jobPages > 1 ? 'iba-job-multipage' : ''}`} aria-label="探索作业">
            <div className="exp-job-list-head">
              <h2>探索作业</h2>
              <div className="exp-job-list-actions">
                <label className="exp-input exp-filter-control" aria-label="搜索作业">
                  <input
                    id="exp-jobsearch"
                    type="search"
                    placeholder="搜索作业 ID"
                    value={jobSearch}
                    aria-label="搜索作业 ID"
                    autoComplete="off"
                    onChange={(e) => {
                      setJobSearch(e.target.value);
                      setJobPage(1);
                    }}
                  />
                </label>
                <label className="exp-input exp-filter-control" aria-label="筛选作业状态">
                  <Select
                    id="exp-jobfilter"
                    aria-label="任务状态"
                    value={jobFilter}
                    onChange={(e) => {
                      setJobFilter(e.target.value);
                      setJobPage(1);
                    }}
                  >
                    <option value="全部">全部状态</option>
                    {Object.entries(jobStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}
                  </Select>
                </label>
                <ClearFilterButton
                  data-exp="clear-job-filters"
                  ariaLabel="清除筛选条件"
                  title="清除筛选条件"
                  disabled={!jobSearch && jobFilter === "全部"}
                  onClick={() => {
                    setJobSearch("");
                    setJobFilter("全部");
                    setJobPage(1);
                  }}
                />
              </div>
            </div>

            {filteredJobs.length ? (
              <>
                <div className="exp-job-table-wrap" role="region" aria-label="探索作业列表" tabIndex={0}>
                  <table className="exp-job-table">
                    <thead>
                      <tr>
                        <th>作业 ID</th>
                        <th>状态</th>
                        <th>数据集</th>
                        <th>提交时间</th>
                        <th>耗时</th>
                        <th className="exp-prompt-action-col">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shownJobs.map(j=>{
                        const datasetNames=j.dataset_ids.map(id=>datasets.find(dataset=>dataset.dataset_id===id)?.name||id).join('、');
                        const elapsed=j.started_at?Math.max(0,Math.round(((j.finished_at?Date.parse(j.finished_at):Date.now())-Date.parse(j.started_at))/1000)):0;
                        return (
                        <tr
                          key={j.run_id}
                          data-action="select-job"
                          data-id={j.run_id}
                          data-selected={selectedJob?.run_id === j.run_id}
                          aria-selected={selectedJob?.run_id === j.run_id}
                          tabIndex={0}
                          aria-label={`选择作业 ${j.run_id}`}
                          onClick={() => setSelectedJobId(j.root_run_id)}
                          onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();setSelectedJobId(j.root_run_id);}}}
                        >
                          <td>
                            <strong className="exp-row-title">{j.run_id}</strong>
                          </td>
                          <td><JobStatusButton job={j} onClick={()=>setStatusJobId(j.root_run_id)} /></td>
                          <td><div className="exp-job-dataset" title={datasetNames}><span className="exp-job-dataset-name">{datasetNames}</span></div></td>
                          <td className="exp-job-time">{new Date(j.submitted_at).toLocaleString('zh-CN',{hour12:false})}</td>
                          <td className="exp-job-duration">
                            {j.status === "PENDING" ? "—" : expElapsed(elapsed)}
                          </td>
                          <td className="exp-prompt-action-col">
                            <div className="exp-job-icon-actions" onClick={(e) => e.stopPropagation()}>
                              {j.status !== 'COMPLETED' && <IconButton icon="details" label={`查看作业状态 ${j.run_id}`} onClick={()=>setStatusJobId(j.root_run_id)} />}
                              <IconButton icon="prompt" label="查看提示词" title="查看提示词" data-exp="show-prompt" data-id={j.run_id} onClick={() => {
                                  setPromptText(j.exploration_prompt?.text||'');
                                  setModal("prompt");
                                }} />
                              <DeleteAction title="删除探索作业" name={j.run_id} disabled={j.status === 'RUNNING' || j.status === 'PENDING'}
                                restoreFocus={()=>document.querySelector<HTMLInputElement>('#exp-jobsearch')} onDelete={async()=>{
                                  await request(`/analysis/delete/${encodeURIComponent(j.run_id)}`,{});
                                  refreshJobs();
                                }} />
                            </div>
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  total={filteredJobs.length}
                  page={currentJobPage}
                  onPage={handleJobPageChange}
                  label="探索作业"
                  size={IBA_JOBS_PAGE_SIZE}
                />
              </>
            ) : (
              <div className="exp-job-empty" role="status">
                {jobs.length ? "没有符合筛选条件的探索作业。" : "当前范围还没有探索作业，可以创建新探索。"}
              </div>
            )}
          </section>

          {/* Lower Panel: 探索结果 */}
          {!selectedJob ? (
            <section className="exp-panel exp-selected-result exp-empty-result" aria-label="探索结果">
              <div className="exp-selected-head">
                <div>
                  <h2>探索结果</h2>
                </div>
              </div>
              <div className="exp-result-empty-message" role="status">
                请选择上方的探索作业查看结果。
              </div>
            </section>
          ) : selectedJob.status!=='COMPLETED'&&!selectedJobDirections.length ? (
            <section className="exp-panel exp-selected-result" aria-label="探索结果">
              <div className="exp-selected-head"><h2>探索结果</h2></div>
              <p>当前作业下没有对应的探索结果。</p>
            </section>
          ) : (
            <section className="exp-panel exp-selected-result" aria-label="所选作业的探索结果">
              <div className="exp-selected-head">
                <div>
                  <h2>探索结果</h2>
                  <span className="exp-selected-sub">{selectedJob.run_id}</span>
                </div>
              </div>
              {selectedJobSummary && <p className="exp-result-summary">{selectedJobSummary}</p>}
              {selectedJobDirections.length > 0 ? (
                <div className="exp-job-table-wrap">
                  <table className="exp-job-table exp-direction-table">
                    <thead>
                      <tr>
                        <th>方向</th>
                        <th>描述</th>
                        <th>适用知识</th>
                        <th className="iad-number">证据</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedJobDirections.map((d) => {
                        const evidenceCount =
                          d.evidences?.length || 0;
                        return (
                          <tr
                            key={d.id}
                              tabIndex={0}
                            data-action="direction"
                            data-id={d.id}
                            aria-label={`查看方向 ${d.title}`}
                            onClick={() => {
                              setViewingDirection(d);
                              setModal("direction");
                            }}
                          >
                            <td className="exp-direction-name">{d.title}</td>
                            <td className="exp-direction-description" title={d.brief}>
                              {d.brief}
                            </td>
                            <td>{d.applies}</td>
                            <td className="iad-number">{evidenceCount} 张</td>
                            <td className="exp-direction-action" onClick={(e) => e.stopPropagation()}>
                              <IconButton icon="details" label="查看方向" title="查看方向" className="exp-direction-view-icon exp-view-detail-button" onClick={() => {
                                  setViewingDirection(d);
                                  setModal("direction");
                                }} />
                              <DeleteAction title="删除方向" name={d.title} description="保留原始模型结果和历史引用。" onDelete={async () => {
                                const removal: DirectionRemoval = {dataset_id:d.datasetId,version_id:d.versionId,direction_id:d.id};
                                await request('/exploration/directions/remove',removal);
                                setRefreshTick(value=>value+1);
                              }} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="exp-lead">本次没有形成可用的候选方向。</p>
              )}

              {/* Limitations List */}
              <div className="exp-limitations">
                <div className="exp-result-section-head">
                  <h3>整体限制</h3>
                </div>
                {selectedJobLimitations.length ? (
                  <ol>
                    {selectedJobLimitations.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="exp-lead">本次未记录整体限制。</p>
                )}
              </div>
            </section>
          )}
        </div>
      )}

            {/* Prompt Drawer */}
      {modal === "prompt" && promptText !== null && <PromptDrawer title="探索提示词"
        text={promptText || '本次作业未记录提示词正文。'} onClose={()=>setModal('')} />}

      {modal === 'save' && <ExplorationPresetDialog text={prompt} onClose={()=>setModal('')} onSaved={saved=>{
        setPresets(values=>[...values,saved]);setSelectedPresetId(saved.id);setOriginalPrompt(saved.text);setModal('');
      }} />}
      {modal === 'source' && <ExplorationSourceDialog kind={sampleTab} candidates={samplePool}
        selected={sampleTab==='normal'?normalSelected:defectSelected} loading={samplesLoading}
        onChange={sampleTab==='normal'?setNormalSelected:setDefectSelected} onClose={()=>setModal('')} />}

      {/* Direction Detail Dialog (Shared Reusable Component) */}
      {modal === "direction" && viewingDirection && (
        <DirectionDetailDialog
          direction={viewingDirection}
          evidence={currentEvidence}
          highlightRef={highlightRef}
          onHighlightRef={setHighlightRef}
          onChipFocus={handleChipFocus}
          onOpenFullscreen={handleOpenEvidenceFullscreen}
          onClose={() => {setModal("");setViewingDirection(null);}}
        />
      )}

      {/* Fullscreen Viewer (reused from FullscreenViewer.tsx) */}
      {viewerData && (
        <FullscreenViewer
          open={true}
          item={viewerData.items[viewerData.currentIndex] || null}
          items={viewerData.items}
          currentIndex={viewerData.currentIndex}
          onClose={() => setViewerData(null)}
          onNavigate={(idx) =>
            setViewerData((prev) => (prev ? { ...prev, currentIndex: idx } : null))
          }
        />
      )}
      {statusJobId && jobs.some(job=>job.run_id===statusJobId || job.root_run_id===statusJobId) && <JobStatusDrawer job={jobs.find(job=>job.run_id===statusJobId || job.root_run_id===statusJobId)!}
        onClose={()=>setStatusJobId(null)} onChanged={refreshJobs} />}
    </div>
  );
}
