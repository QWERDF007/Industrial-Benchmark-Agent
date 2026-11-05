import {PromptDrawer} from './PromptDrawer.js';
import {JobStatusDrawer, JobStatusButton} from './JobStatusDrawer.js';
import {Select} from './Select.js';
import {TabBar} from './layout/TabBar.js';
import {Button} from './Button.js';
import {ThumbnailCard} from "./ThumbnailCard.js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Dataset, DatasetGroup, JobSnapshot } from "../../shared/contracts.js";
import { mediaUrl, message, request } from "../api.js";
import {useWorkbenchModel} from "../models.js";
import { useWorkspace } from "../workspace.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import {PlusIcon} from "../AuditIcon.js";
import { IconButton } from "./IconButton.js";
import {DeleteAction} from './DeleteAction.js';
import { DatasetScopeSelector } from "./DatasetScopeSelector.js";
import { DirectionDetailDialog, type DirectionItem } from "./DirectionDetailDialog.js";
import { FullscreenViewer, type FullscreenViewerItem } from "./FullscreenViewer.js";
import { Pagination, IBA_JOBS_PAGE_SIZE } from "./Pagination.js";
import { ClearFilterButton } from "./CommonFilterControls.js";

import type {ExplorationResults, DirectionRemoval} from "../../shared/domain.generated.js";
import {useResource} from "../useResource.js";
import {explorationCandidates,explorationDirections} from "../exploration-view.js";

interface PresetItem {
  id: string;
  name: string;
  text: string;
}

interface JobItem {
  id: string;
  parentId?: string;
  scopeKey: string;
  datasetIds: string[];
  normal: string[];
  defect: string[];
  prompt: string;
  preset: string;
  status: JobSnapshot["status"];
  phase: number;
  elapsed: number;
  time: string;
  error?: string;
  summary?: string;
  directions?: DirectionItem[];
  limitations?: string[];
  explorationVersionId?: string;
}

interface SampleItem {
  id: string;
  filename: string;
  url: string;
  kind: "normal" | "defect";
  category?: string;
  datasetId: string;
}

function expElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return (m > 0 ? `${m}分` : "") + `${s}秒`;
}

function expJobBadge(status: string) {
  if (status === "COMPLETED") return <span className="exp-pill ok">已完成</span>;
  if (status === "RUNNING") return <span className="exp-pill running">运行中</span>;
  if (status === "PENDING") return <span className="exp-pill pending">排队中</span>;
  return <span className="exp-pill fail">失败</span>;
}

function expJobState(status: string) {
  if (status === "PENDING") return "排队中";
  if (status === "RUNNING") return "运行中";
  if (status === "COMPLETED") return "已完成";
  if (status === "FAILED") return "失败";
  return "已取消";
}

let cachedDatasets: Dataset[] | null = null;
let cachedGroups: DatasetGroup[] | null = null;

export function ExplorationPage({
  dataset,
  refreshRevision,
  headerActions,
}: {
  dataset: Dataset;
  refreshRevision: number;
  headerActions: React.ReactNode;
}) {
  const { workspace } = useWorkspace();
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
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");

  // Modals
  const [modal, setModal] = useState<"" | "source" | "delete-job" | "save" | "direction" | "prompt">("");
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string | null>(null);
  const [viewingDirection, setViewingDirection] = useState<DirectionItem | null>(null);
  const [newPresetName, setNewPresetName] = useState("");

  // Source picker modal state
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceCategory, setSourceCategory] = useState("all");
  const [sourceSelectedOnly, setSourceSelectedOnly] = useState(false);
  const [sourcePage, setSourcePage] = useState(1);

  // Direction detail interaction
  const [highlightRef, setHighlightRef] = useState<string | null>(null);

  // Fullscreen Viewer state (reusing shared FullscreenViewer.tsx)
  const [viewerData, setViewerData] = useState<{
    items: FullscreenViewerItem[];
    currentIndex: number;
  } | null>(null);



  // Candidate samples pool
  const [samplePool, setSamplePool] = useState<SampleItem[]>([]);
  const [samplesLoaded,setSamplesLoaded]=useState(false),[samplesLoading,setSamplesLoading]=useState(false);
  const sampleById=useMemo(()=>new Map(samplePool.map(item=>[item.id,item])),[samplePool]);

  // Jobs state initialized to empty array (loaded dynamically from backend API)
  const [jobs, setJobs] = useState<JobItem[]>([]);

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
    request<{ presets: PresetItem[] }>("/exploration/presets")
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

  const [jobSnapshots,setJobSnapshots]=useState<JobSnapshot[]>([]);
  useEffect(()=>{
    const controller=new AbortController();
    if(!selectedChildIds.length){setJobs([]);setJobSnapshots([]);return;}
    Promise.all(selectedChildIds.map(dataset_id=>request<{jobs:JobSnapshot[]}>(`/analysis/jobs?${new URLSearchParams({dataset_id,analysis_kind:'exploration'})}`,
      undefined,undefined,controller.signal))).then(results=>{
      if(controller.signal.aborted)return;
      const snapshots=[...new Map(results.flatMap(result=>result.jobs).map(job=>[job.run_id,job])).values()]
        .sort((a,b)=>b.submitted_at.localeCompare(a.submitted_at));
      setJobSnapshots(snapshots);
      setJobs(snapshots.map(job=>({id:job.run_id,scopeKey:job.dataset_ids.join('|'),datasetIds:job.dataset_ids,normal:[],defect:[],
        prompt:job.exploration_prompt?.text||'',preset:job.exploration_prompt?.preset_id||'',status:job.status,
        phase:job.status==='COMPLETED'?3:job.status==='PENDING'?0:2,
        elapsed:job.started_at?Math.max(0,Math.round(((job.finished_at?Date.parse(job.finished_at):Date.now())-Date.parse(job.started_at))/1000)):0,
        time:new Date(job.submitted_at).toLocaleString('zh-CN',{hour12:false}),error:job.errors[0]?.message})));
      setSelectedJobId(previous=>snapshots.some(job=>job.run_id===previous)?previous:snapshots[0]?.run_id||null);
      setError('');
    }).catch(error=>{if(!controller.signal.aborted)setError(message(error));});
    return()=>controller.abort();
  },[selectedChildIds,refreshRevision,refreshTick]);

  // Polling for active background jobs
  useEffect(() => {
    const hasActiveJob = jobs.some((j) => j.status === "RUNNING" || j.status === "PENDING");
    if (!hasActiveJob) return;
    const interval = setInterval(() => {
      setRefreshTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [jobs]);

  // Derived state
  const parentGroups = groups.length ? groups : buildHierarchyGroups([dataset], []);
  const currentChildDatasets = datasets.filter((d) => getDatasetGroupId(d, groups) === selectedParentId);

  const filteredJobs: JobItem[] = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchStatus = jobFilter === "全部" || j.status === jobFilter;
      const matchSearch = !q || j.id.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [jobs, jobFilter, jobSearch]);

  const jobPages = Math.max(1, Math.ceil(filteredJobs.length / IBA_JOBS_PAGE_SIZE));
  const currentJobPage = Math.max(1, Math.min(jobPages, jobPage));
  const shownJobs: JobItem[] = useMemo(() => {
    return filteredJobs.slice(
      (currentJobPage - 1) * IBA_JOBS_PAGE_SIZE,
      currentJobPage * IBA_JOBS_PAGE_SIZE
    );
  }, [filteredJobs, currentJobPage]);

  const selectedJob: JobItem | null = useMemo(() => {
    if (!shownJobs.length) return null;
    if (selectedJobId) {
      const match = shownJobs.find((j: JobItem) => j.id === selectedJobId);
      if (match) return match;
    }
    return shownJobs[0] || null;
  }, [shownJobs, selectedJobId]);

  const selectedSnapshot=jobSnapshots.find(job=>job.run_id===selectedJob?.id);
  const versionKey=(selectedSnapshot?.dataset_results||[]).map(result=>result.exploration_version_id||'').join('|');
  const results=useResource<ExplorationResults>(selectedJob?`/analysis/results/${encodeURIComponent(selectedJob.id)}`:null,`${versionKey}|${refreshTick}`);
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
      setSelectedJobId(firstOnPage.id);
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
      setSelectedJobId(res.run_id);setJobPage(1);setRefreshTick(value=>value+1);setView('jobs');submission.current=null;
    } catch(error){setError(message(error));} finally {setSubmitting(false);}
  };

  const handleConfirmDeleteJob=async()=>{
    if(!deletingJobId)return;
    try {
      await request(`/analysis/delete/${encodeURIComponent(deletingJobId)}`,{});
      setModal('');setDeletingJobId(null);setRefreshTick(value=>value+1);
    } catch(error){setError(message(error));}
  };

  const renderJobDataset = (j: JobItem) => {
    const parentId = j.parentId || (j.scopeKey || "").split("|")[0];
    const storedIds = (j.datasetIds && j.datasetIds.length > 0)
      ? j.datasetIds
      : (j.scopeKey || "").split("|")[1]?.split(",").filter(Boolean) || [];
    const childNames = storedIds
      .map((id) => {
        const d = datasets.find((item) => item.dataset_id === id);
        return d ? d.name : id;
      })
      .filter((name) => {
        return !groups.some((g) => g.name === name || g.group_id === name);
      });
    const fallbackNames = selectedChildIds
      .map((id) => datasets.find((d) => d.dataset_id === id)?.name)
      .filter((name): name is string => Boolean(name) && !groups.some((g) => g.name === name || g.group_id === name));
    const text = childNames.join("、") || (fallbackNames.length > 0 ? fallbackNames.join("、") : "暂无子数据集");
    return (
      <div className="exp-job-dataset" title={text}>
        <span className="exp-job-dataset-name">{text}</span>
      </div>
    );
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
      {(error||results.error)&&<p role="alert" className="iad-error">{error||results.error}</p>}
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
            setRefreshTick((t) => t + 1);
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
                      setSourceSearch("");
                      setSourceCategory("all");
                      setSourceSelectedOnly(false);
                      setSourcePage(1);
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
                  setNewPresetName("");
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
                    <option value="PENDING">排队中</option>
                    <option value="RUNNING">运行中</option>
                    <option value="COMPLETED">已完成</option>
                    <option value="FAILED">失败</option>
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
                      {shownJobs.map((j) => (
                        <tr
                          key={j.id}
                          data-action="select-job"
                          data-id={j.id}
                          data-selected={selectedJob?.id === j.id}
                          aria-selected={selectedJob?.id === j.id}
                          tabIndex={0}
                          role="button"
                          aria-label={`选择作业 ${j.id}`}
                          onClick={() => setSelectedJobId(j.id)}
                        >
                          <td>
                            <strong className="exp-row-title">{j.id}</strong>
                          </td>
                          <td><JobStatusButton job={jobSnapshots.find(job=>job.run_id===j.id)!} onClick={()=>setStatusJobId(jobSnapshots.find(job=>job.run_id===j.id)!.root_run_id)}>{expJobBadge(j.status)}</JobStatusButton></td>
                          <td>{renderJobDataset(j)}</td>
                          <td className="exp-job-time">{j.time || "—"}</td>
                          <td className="exp-job-duration">
                            {j.status === "PENDING" ? "—" : expElapsed(j.elapsed)}
                          </td>
                          <td className="exp-prompt-action-col">
                            <div className="exp-job-icon-actions" onClick={(e) => e.stopPropagation()}>
                              {j.status !== 'COMPLETED' && <IconButton icon="details" label={`查看作业状态 ${j.id}`} onClick={()=>setStatusJobId(jobSnapshots.find(job=>job.run_id===j.id)!.root_run_id)} />}
                              <IconButton icon="prompt" label="查看提示词" title="查看提示词" data-exp="show-prompt" data-id={j.id} onClick={() => {
                                  setPromptText(j.prompt);
                                  setModal("prompt");
                                }} />
                              <IconButton icon="delete" label="删除作业" title={j.status === "RUNNING" || j.status === "PENDING" ? "请先停止运行中的作业" : "删除作业"} data-delete="true" data-exp="ask-delete-job" data-id={j.id} className="danger" disabled={j.status === "RUNNING" || j.status === "PENDING"} onClick={() => {
                                  setDeletingJobId(j.id);
                                  setModal("delete-job");
                                }} />
                            </div>
                          </td>
                        </tr>
                      ))}
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
          ) : (selectedJob.status === "PENDING" || selectedJob.status === "RUNNING") && !selectedJobDirections.length ? (
            <section className="exp-panel exp-selected-result" aria-label="所选作业的执行阶段">
              <div className="exp-selected-head">
                <div>
                  <h2>运行状态</h2>
                  <span className="exp-selected-sub">{selectedJob.id}</span>
                </div>
              </div>
              <div className="exp-job-current-title" style={{ margin: "0 0 17px" }}>
                <span className={`exp-pill ${selectedJob.status === "PENDING" ? "pending" : "running"}`}>
                  {selectedJob.status === "PENDING" ? "排队中" : "运行中"}
                </span>
                <strong>
                  {selectedJob.status === "PENDING"
                    ? "等待执行"
                    : ["准备图像", "容量检查", "模型联合分析", "校验并发布方向"][selectedJob.phase || 0]}
                </strong>
                <span className="exp-lead">
                  {selectedJob.status === "PENDING" ? "等待队列安排" : `已用时 ${expElapsed(selectedJob.elapsed)}`}
                </span>
              </div>
              <div className="exp-job-stages" role="list" aria-label="执行阶段">
                {["准备图像", "容量检查", "模型联合分析", "校验并发布方向"].map((p, i) => {
                  const pending = selectedJob.status === "PENDING";
                  const state = pending ? "waiting" : i < selectedJob.phase ? "done" : i === selectedJob.phase ? "current" : "waiting";
                  return (
                    <div key={p} role="listitem" className="exp-job-stage" data-state={state}>
                      <span className="exp-job-stage-icon">
                        {!pending && i < selectedJob.phase ? "✓" : i + 1}
                      </span>
                      <span className="exp-job-stage-label">{p}</span>
                    </div>
                  );
                })}
              </div>
              <div className="exp-result-neutral">
                方向发布后将在这里显示。
              </div>
            </section>
          ) : selectedJob.status === "FAILED" ? (
            <section className="exp-panel exp-selected-result" aria-label="所选作业的错误信息">
              <div className="exp-selected-head">
                <div>
                  <h2>作业失败</h2>
                  <span className="exp-selected-sub">{selectedJob.id}</span>
                </div>
              </div>
              <p className="exp-error-message">{selectedJob.error || "任务未成功完成，未生成探索结果。"}</p>
              <p className="exp-lead">本次作业没有可用的候选方向或整体限制。</p>
              <Button
                type="button"

                disabled={!!runningJob}
                onClick={() => {
                  setNormalSelected([...selectedJob.normal]);
                  setDefectSelected([...selectedJob.defect]);
                  setPrompt(selectedJob.prompt);
                  setView("setup");
                }}
              >
                使用该配置新建
              </Button>
            </section>
          ) : (
            <section className="exp-panel exp-selected-result" aria-label="所选作业的探索结果">
              <div className="exp-selected-head">
                <div>
                  <h2>探索结果</h2>
                  <span className="exp-selected-sub">{selectedJob.id}</span>
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
                            role="button"
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

      {/* Modals & Overlays Portalled to document.body */}
      {typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Prompt Drawer */}
      {modal === "prompt" && promptText !== null && <PromptDrawer title="探索提示词"
        text={promptText || '本次作业未记录提示词正文。'} onClose={()=>setModal('')} />}

      {/* Delete Job Confirmation Modal */}
      {modal === "delete-job" && deletingJobId && (
        <div className="exp-modal" id="exp-modal">
          <div className="exp-dialog small" role="dialog" aria-modal="true" aria-label="删除探索作业">
            <div className="exp-dialog-head">
              <strong>删除探索作业</strong>
              <IconButton icon="close" label="关闭" onClick={() => setModal("")} />
            </div>
            <div className="exp-dialog-main">
              <p className="exp-delete-text">
                确定删除作业 {deletingJobId} 吗？
              </p>
            </div>
            <div className="exp-dialog-foot">
              <Button type="button"  onClick={() => setModal("")}>
                取消
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirmDeleteJob}
              >
                删除作业
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {modal === "save" && (
        <div className="exp-modal" id="exp-modal">
          <div className="exp-dialog small" role="dialog" aria-modal="true" aria-label="另存为提示词预设">
            <div className="exp-dialog-head">
              <strong>另存为提示词预设</strong>
              <IconButton icon="close" label="关闭" onClick={() => setModal("")} />
            </div>
            <div className="exp-dialog-main">
              <label className="exp-input">
                预设名称
                <input
                  id="exp-new-preset"
                  placeholder="请输入预设名称"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                />
              </label>
            </div>
            <div className="exp-dialog-foot">
              <Button type="button"  onClick={() => setModal("")}>
                取消
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!newPresetName.trim()}
                onClick={async()=>{try {const saved=await request<PresetItem>("/exploration/presets",{name:newPresetName.trim(),text:prompt});setPresets(values=>[...values,saved]);setSelectedPresetId(saved.id);setOriginalPrompt(prompt);setModal("");}catch(error){setError(message(error));}}}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Source Image Picker Modal */}
      {modal === "source" && (
        <div className="exp-modal" id="exp-modal">
          <div className="exp-dialog exp-source-dialog" role="dialog" aria-modal="true" aria-label={`选择${sampleTab === "normal" ? "良品" : "异常"}图像`}>
            <div className="exp-dialog-head">
              <strong>选择{sampleTab === "normal" ? "良品" : "异常"}图像</strong>
              <IconButton icon="close" label="关闭" onClick={() => setModal("")} />
            </div>
            <div className="exp-dialog-main">
              <div className="exp-source-scope exp-source-scope-clean">
                <label className="exp-input">
                  搜索图像
                  <input
                    id="exp-source-search"
                    type="search"
                    placeholder="文件名"
                    value={sourceSearch}
                    onChange={(e) => {
                      setSourceSearch(e.target.value);
                      setSourcePage(1);
                    }}
                  />
                </label>
                {sampleTab === "defect" && (
                  <label className="exp-input">
                    标注类别
                    <Select
                      id="exp-source-category"
                      value={sourceCategory}
                      onChange={(e) => {
                        setSourceCategory(e.target.value);
                        setSourcePage(1);
                      }}
                    >
                      <option value="all">全部类别</option>
                      {[...new Set(samplePool.map((s) => s.category).filter(Boolean))].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </label>
                )}
                <label className="exp-source-only">
                  <input
                    id="exp-only-selected"
                    type="checkbox"
                    checked={sourceSelectedOnly}
                    onChange={(e) => {
                      setSourceSelectedOnly(e.target.checked);
                      setSourcePage(1);
                    }}
                  />
                  仅看已选
                </label>
              </div>

              {/* Candidate Grid */}
              {(() => {
                const selectedList = sampleTab === "normal" ? normalSelected : defectSelected;
                const filtered = samplePool.filter((s) => {
                  if (s.kind !== sampleTab) return false;
                  if (sourceSelectedOnly && !selectedList.includes(s.id)) return false;
                  if (sourceSearch.trim() && !s.filename.toLowerCase().includes(sourceSearch.trim().toLowerCase())) return false;
                  if (sourceCategory !== "all" && s.category !== sourceCategory) return false;
                  return true;
                });
                const totalPages = Math.ceil(filtered.length / 24) || 1;
                const page = Math.max(1, Math.min(sourcePage, totalPages));
                const visible = filtered.slice((page - 1) * 24, page * 24);

                return (
                  <>
                    <div className="iad-thumbnail-grid">
                      {visible.map((item) => {
                        const isChosen = selectedList.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className="iad-thumbnail-option"
                          >
                            <ThumbnailCard src={item.url} label={item.filename} aria-pressed={isChosen} onClick={event=>{
                              event.preventDefault();
                              if(sampleTab==="normal")setNormalSelected(prev=>isChosen?prev.filter(id=>id!==item.id):[...prev,item.id]);
                              else setDefectSelected(prev=>isChosen?prev.filter(id=>id!==item.id):[...prev,item.id]);
                            }} />
                            <span className="exp-select-meta">
                              <input
                                type="checkbox"
                                checked={isChosen}
                                onChange={(e) => {
                                  if (sampleTab === "normal") {
                                    setNormalSelected((prev) =>
                                      e.target.checked ? [...prev, item.id] : prev.filter((x) => x !== item.id)
                                    );
                                  } else {
                                    setDefectSelected((prev) =>
                                      e.target.checked ? [...prev, item.id] : prev.filter((x) => x !== item.id)
                                    );
                                  }
                                }}
                              />
                              <span title={item.filename}>{item.filename}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {samplesLoading ? <p role="status">正在读取图像…</p> : !visible.length && <p className="exp-lead">没有符合条件的图像</p>}
                    <Pagination total={filtered.length} page={page} size={24} unit="张图像" onPage={setSourcePage} />
                  </>
                );
              })()}
            </div>
            <div className="exp-dialog-foot">
              <Button
                type="button"
                variant="primary"
                onClick={() => setModal("")}
              >
                完成选择
              </Button>
            </div>
          </div>
        </div>
      )}

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
          </>,
          document.body
        )}
      {statusJobId && jobSnapshots.some(job=>job.run_id===statusJobId || job.root_run_id===statusJobId) && <JobStatusDrawer job={jobSnapshots.find(job=>job.run_id===statusJobId || job.root_run_id===statusJobId)!}
        onClose={()=>setStatusJobId(null)} onChanged={()=>setRefreshTick(value=>value+1)} />}
    </div>
  );
}
