import {SectionHeading} from './layout/SectionHeading.js';
import {AnalysisExportButton} from './AnalysisExportButton.js';
import {AnalysisEvidenceViewer} from './AnalysisEvidenceViewer.js';
import {WorkbenchHeader} from './layout/WorkbenchHeader.js';
import {v4 as uuid} from 'uuid';
import {ExplorationPresetDialog} from './ExplorationPresetDialog.js';
import {ExplorationSourceDialog} from './ExplorationSourceDialog.js';
import {AnalysisPromptDrawer} from './AnalysisPromptDrawer.js';
import {AgentPromptEditors} from './AgentPromptEditors.js';
import {promptDefaults} from '../../shared/prompt-defaults.generated.js';
import {JobStatusDrawer, JobStatusButton, JobStatusAction} from './JobStatusDrawer.js';
import {JobListPanel} from './JobListPanel.js';
import {Select} from './Select.js';
import {TabBar} from './layout/TabBar.js';
import {Button} from './Button.js';
import {ThumbnailCard} from "./ThumbnailCard.js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dataset, JobSnapshot } from "../../shared/contracts.js";
import { mediaUrl, message, request } from "../api.js";
import {useJobs} from "../useJobs.js";
import {useDatasetCatalog} from '../useDatasetCatalog.js';
import {formatJobTime,jobStatuses} from "../../shared/job-display.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import {PlusIcon} from "../AuditIcon.js";
import { IconButton } from "./IconButton.js";
import {DeleteAction} from './DeleteAction.js';
import { DatasetScopeSelector } from "./DatasetScopeSelector.js";
import { DirectionDetailDialog, type DirectionItem } from "./DirectionDetailDialog.js";
import { FullscreenViewer, type FullscreenViewerItem } from "./FullscreenViewer.js";
import { Pagination, IBA_JOBS_PAGE_SIZE } from "./Pagination.js";
import { ClearFilterButton } from "./CommonFilterControls.js";
import {ReferencedText} from '../direction-evidence.js';

import type {AnalysisPublicationView, DirectionRemoval, ExplorationPromptPreset, ExplorationAgentStart} from "../../shared/domain.generated.js";
import {useModuleSettings} from '../useModuleSettings.js';
import {useResource} from "../useResource.js";
import {useWorkspace} from '../workspace.js';
import {ExplorationNarrative,explorationCandidates,explorationDirections,type ExplorationCandidate} from "../exploration-view.js";

function expElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return (m > 0 ? `${m}分` : "") + `${s}秒`;
}

export function ExplorationPage({
  dataset,
  refreshRevision,
}: {
  dataset: Dataset;
  refreshRevision: number;
}) {
  const {workspace}=useWorkspace();
  const route=workspace.view('industrial-exploration');
  const selectedJobId=route.job;
  const selectJob=(job:string)=>workspace.updateView('industrial-exploration',{job,version:'',selected:''});
  const configuration=useModuleSettings('exploration');
  const catalog=useDatasetCatalog();
  const datasets=catalog.data?.datasets || [dataset], groups=catalog.data?.groups || [];
  const initialParentId = getDatasetGroupId(dataset);
  const initialChildren = datasets.filter(
    (d) => getDatasetGroupId(d) === initialParentId
  );
  const [selectedParentId, setSelectedParentId] = useState<string>(() => initialParentId);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(() =>
    initialChildren.length > 0 ? initialChildren.map((c) => c.dataset_id) : [dataset.dataset_id]
  );

  // View state: 'jobs' (unified layout) or 'setup' (3-step creation)
  const [view, setView] = useState<"jobs" | "setup">("jobs");
  const [jobFilter, setJobFilter] = useState("全部");
  const [jobSearch, setJobSearch] = useState("");
  const [statusJobId, setStatusJobId] = useState<string | null>(null);
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
  const [systemPrompt,setSystemPrompt]=useState<string>(promptDefaults.explorationSystem[dataset.format]);
  const [observerSystemPrompt,setObserverSystemPrompt]=useState<string>(promptDefaults.explorationObserverSystem[dataset.format]);
  const [observerUserPrompt,setObserverUserPrompt]=useState('');
  const systemFormat=useRef(dataset.format);
  const [originalPrompt, setOriginalPrompt] = useState("");

  // Modals
  const [modal, setModal] = useState<"" | "source" | "save" | "direction" | "prompt">("");
  const [promptJobId,setPromptJobId]=useState<string|null>(null);
  const [viewingDirection, setViewingDirection] = useState<DirectionItem | null>(null);

  // Direction detail interaction

  // Fullscreen Viewer state (reusing shared FullscreenViewer.tsx)
  const [viewerData, setViewerData] = useState<{
    items: FullscreenViewerItem[];
    currentIndex: number;
  } | null>(null);
  const [analysisImage,setAnalysisImage]=useState<{versionId:string;source:FullscreenViewerItem&{sampleId:string}}|null>(null);



  // Candidate samples pool
  const [samplePool, setSamplePool] = useState<ExplorationCandidate[]>([]);
  const [samplesLoaded,setSamplesLoaded]=useState(false),[samplesLoading,setSamplesLoading]=useState(false);
  const sampleById=useMemo(()=>new Map(samplePool.map(item=>[item.id,item])),[samplePool]);

  const progress=useCallback(()=>setRefreshTick(value=>value+1),[]);
  const jobQuery=useJobs('exploration',selectedChildIds,progress,selectedJobId,refreshRevision);
  const jobs=jobQuery.jobs;
  const refreshJobs=()=>{jobQuery.refresh();progress();};

  // Load datasets and hierarchy
  useEffect(() => {
    const parentId = getDatasetGroupId(dataset);
    setSelectedParentId(parentId);
    const children = datasets.filter(item=>getDatasetGroupId(item)===parentId);
    setSelectedChildIds(children.map(item=>item.dataset_id));
  }, [dataset.dataset_id]);

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
          setObserverUserPrompt(first.text);
          setOriginalPrompt(first.text);
        }
      })
      .catch(error => {if(active)setError(message(error));});
    return () => {
      active = false;
    };
  }, [refreshRevision]);

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
  const parentGroups = useMemo(()=>buildHierarchyGroups(datasets,groups),[datasets,groups]);
  const currentChildDatasets = datasets.filter((d) => getDatasetGroupId(d) === selectedParentId);
  const scopeFormats=new Set(datasets.filter(item=>selectedChildIds.includes(item.dataset_id)).map(item=>item.format));
  const scopeFormat=scopeFormats.size===1?[...scopeFormats][0]:null;
  useEffect(()=>{
    if(scopeFormat&&scopeFormat!==systemFormat.current){
      systemFormat.current=scopeFormat;
      setSystemPrompt(promptDefaults.explorationSystem[scopeFormat]);
      setObserverSystemPrompt(promptDefaults.explorationObserverSystem[scopeFormat]);
    }
  },[scopeFormat]);

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
      const match = filteredJobs.find((j: JobSnapshot) => j.root_run_id === selectedJobId || j.run_id === selectedJobId);
      if (match) return match;
    }
    return shownJobs[0] || null;
  }, [shownJobs, filteredJobs, selectedJobId]);

  useEffect(()=>{
    if(!selectedJobId)return;
    const index=filteredJobs.findIndex(job=>job.run_id===selectedJobId||job.root_run_id===selectedJobId);
    if(index>=0)setJobPage(Math.floor(index/IBA_JOBS_PAGE_SIZE)+1);
  },[selectedJobId,filteredJobs]);
  const versionId=route.job===selectedJob?.run_id&&route.version?route.version:selectedJob?.analysis_version_id;
  const results=useResource<AnalysisPublicationView>(versionId?`/analysis/publications/${encodeURIComponent(versionId)}`:null,refreshTick);
  const publication=results.data;
  const datasetNames=useMemo(()=>Object.fromEntries(datasets.map(item=>[item.dataset_id,item.name])),[datasets]);
  const narrative=useMemo(()=>publication?new ExplorationNarrative(publication,datasetNames):null,[publication,datasetNames]);
  const selectedJobDirections=useMemo(()=>explorationDirections(publication,route.selected,datasetNames),[publication,route.selected,datasetNames]);
  const selectedJobLimitations=publication?.catalog.limitations.map(text=>narrative!.text(text))||[];
  const selectedJobSummary=publication?narrative!.text(publication.catalog.summary):'';
  useEffect(()=>{
    if(!route.selected||!publication)return;
    const direction=selectedJobDirections.find(item=>item.id===route.selected);
    if(direction){setViewingDirection(direction);setModal('direction');}
  },[route.selected,publication?.version_id]);

  const handleJobPageChange = (newPage: number) => {
    const targetPage = Math.max(1, Math.min(jobPages, newPage));
    setJobPage(targetPage);
    const firstOnPage = filteredJobs[(targetPage - 1) * IBA_JOBS_PAGE_SIZE];
    if (firstOnPage) {
      selectJob(firstOnPage.root_run_id);
    }
  };

  const runningJob = jobs.find((j) => j.status === "RUNNING" || j.status === "PENDING");
  const runReason=runningJob ? '已有探索作业正在运行' : !selectedChildIds.length ? '请选择子数据集'
    : scopeFormats.size!==1 ? '请选择同一标注类型的子数据集'
    : !normalSelected.length && !defectSelected.length ? '至少选择一张样例图像'
    : normalSelected.some(id=>defectSelected.includes(id)) ? '同一图像不能同时作为良品和异常样例'
    : ![...normalSelected,...defectSelected].every(id=>sampleById.has(id)) ? '图像不可用，请重新选择'
    : !configuration.settings?.model ? configuration.loading ? '正在读取模型' : '请先配置方向探索分析模型'
    : !systemPrompt.trim() ? '请填写主 Agent 系统提示词' : !prompt.trim() ? '请填写主 Agent 用户提示词'
    : !observerSystemPrompt.trim() ? '请填写子 Agent 系统提示词' : !observerUserPrompt.trim() ? '请填写子 Agent 用户提示词' : '';
  const canRun = !submitting && !runReason;

  const resetScope = () => {
    setSamplePool([]);setNormalSelected([]);setDefectSelected([]);setSamplesLoaded(false);setSamplesLoading(false);
    selectJob('');
  };

  // Handle parent group change
  const handleParentChange = (newParentId: string) => {
    resetScope();
    setSelectedParentId(newParentId);
    const children = datasets.filter((d) => getDatasetGroupId(d) === newParentId);
    setSelectedChildIds(children.map((c) => c.dataset_id));
    setJobPage(1);
  };

  // Toggle child dataset selection
  const handleChildToggle = (cid: string) => {
    resetScope();
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
      setObserverUserPrompt(p.text);
      setOriginalPrompt(p.text);
    }
  };

  const handleStartExploration = async () => {
    if(!canRun)return;
    setSubmitting(true);setError('');
    try {
      const submissionBody: Omit<ExplorationAgentStart,'submission_id'> = {analysis_kind:'exploration',
        dataset_ids:[selectedChildIds[0],...selectedChildIds.slice(1)],normal_images:normalSelected,defect_images:defectSelected,system_prompt:systemPrompt,
        observer_prompt:{system_prompt:observerSystemPrompt,user_prompt:observerUserPrompt},
        prompt:{preset_id:selectedPresetId,preset_name:presets.find(preset=>preset.id===selectedPresetId)?.name||'自定义',
          preset_revision:presets.find(preset=>preset.id===selectedPresetId)?.revision??null,text:prompt}};
      const key=JSON.stringify(submissionBody);
      if(submission.current?.key!==key)submission.current={key,id:uuid()};
      const res=await request<JobSnapshot>('/analysis/start',{...submissionBody,submission_id:submission.current.id});
      selectJob(res.run_id);setJobPage(1);refreshJobs();setView('jobs');submission.current=null;
    } catch(error){setError(message(error));} finally {setSubmitting(false);}
  };

  const currentEvidence=viewingDirection?.evidences||[];

  // Open FullscreenViewer on evidence click
  const handleOpenEvidenceFullscreen = (clickedRef: string) => {
    const selected=currentEvidence.find(item=>item.ref===clickedRef);
    if(selected&&viewingDirection?.versionId.startsWith('analysis_version_')){
      setAnalysisImage({versionId:viewingDirection.versionId,source:{id:selected.evidenceId,sampleId:selected.sampleId,title:selected.filename,imageUrl:selected.fullUrl}});return;
    }
    const allItems: FullscreenViewerItem[] = currentEvidence.map((item) => ({
      id: item.ref,sampleId:item.sampleId,
      title: item.filename,
      imageUrl: item.fullUrl,
    }));
    const index = currentEvidence.findIndex((item) => item.ref === clickedRef);
    if(index<0){setError('图像证据不可用');return;}
    setViewerData({
      items: allItems,
      currentIndex: index,
    });
  };

  return (
    <div id="exploration-page" className="iad-exploration-page">
      {(error||results.error||jobQuery.error)&&<p role="alert" className="iad-error">{error||results.error||jobQuery.error}</p>}
      <WorkbenchHeader pageId="industrial-exploration" className="exp-heading" title={view === "setup" ? "新建探索" : undefined}>
        <div className="exp-heading-actions">
          {view === "setup" ? (
            <Button type="button"  onClick={() => setView("jobs")}>
              返回作业与结果
            </Button>
          ) : (
            <Button
              id="exp-new"
              type="button"
              variant="primary"
              disabled={!!runningJob || submitting}
              title={runningJob ? "已有探索任务运行或排队" : "新建探索"}
              onClick={() => {
                resetScope();
                const format=scopeFormat||dataset.format;
                systemFormat.current=format;setSystemPrompt(promptDefaults.explorationSystem[format]);
                setObserverSystemPrompt(promptDefaults.explorationObserverSystem[format]);
                setView('setup');
              }}
            >
              新建探索
            </Button>
          )}
        </div>
      </WorkbenchHeader>

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

                disabled={prompt === originalPrompt && observerUserPrompt === originalPrompt
                  && systemPrompt === promptDefaults.explorationSystem[scopeFormat||dataset.format]
                  && observerSystemPrompt === promptDefaults.explorationObserverSystem[scopeFormat||dataset.format]}
                onClick={() => {
                  const defaults=promptDefaults.explorationSystem[scopeFormat||dataset.format];
                  setPrompt(originalPrompt);setObserverUserPrompt(originalPrompt);
                  setSystemPrompt(defaults);setObserverSystemPrompt(promptDefaults.explorationObserverSystem[scopeFormat||dataset.format]);
                }}
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
            <AgentPromptEditors id="exp-prompt" agentLabel="主 Agent" system={systemPrompt} user={prompt}
              onSystemChange={setSystemPrompt} onUserChange={setPrompt} disabled={submitting}/>
            <AgentPromptEditors id="exp-observer-prompt" agentLabel="子 Agent" system={observerSystemPrompt} user={observerUserPrompt}
              onSystemChange={setObserverSystemPrompt} onUserChange={setObserverUserPrompt} disabled={submitting}/>
          </section>

          {/* Step 3: Confirm and Start */}
          <section className="exp-panel">
            <div className="exp-panel-title">
              <h2>确认并启动</h2>
            </div>
            <div className="exp-brief">
              <span>所选子数据集 {selectedChildIds.length} 个</span>
              <span>优先样例：良品 {normalSelected.length}，异常 {defectSelected.length}</span>
              <span>模型 {configuration.settings?.model?.model_id || '未配置'}</span>
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
          <JobListPanel title="探索作业" className="exp-job-list" actions={jobs.length>0&&
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
            }>

            {filteredJobs.length ? (
              <>
                <div className="exp-job-table-wrap iad-job-table-scroll" role="region" aria-label="探索作业列表" tabIndex={0}>
                  <table className="exp-job-table iad-job-table-grid">
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
                          onClick={() => selectJob(j.root_run_id)}
                          onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();selectJob(j.root_run_id);}}}
                        >
                          <td>
                            <strong className="exp-row-title">{j.run_id}</strong>
                          </td>
                          <td><JobStatusButton job={j} onClick={()=>setStatusJobId(j.root_run_id)} /></td>
                          <td><div className="exp-job-dataset" title={datasetNames}><span className="exp-job-dataset-name">{datasetNames}</span></div></td>
                          <td className="exp-job-time">{formatJobTime(j.submitted_at)}</td>
                          <td className="exp-job-duration">
                            {j.status === "PENDING" ? "—" : expElapsed(elapsed)}
                          </td>
                          <td className="exp-prompt-action-col">
                            <div className="exp-job-icon-actions" onClick={(e) => e.stopPropagation()}>
                              <JobStatusAction job={j} onClick={()=>setStatusJobId(j.root_run_id)} />
                              <IconButton icon="prompt" label="查看提示词" title="查看提示词" data-exp="show-prompt" data-id={j.run_id} onClick={() => {
                                  setPromptJobId(j.run_id);
                                  setModal("prompt");
                                }} />
                              <DeleteAction title="删除探索作业" name={j.run_id} confirmLabel="删除作业" confirmation={<>确定删除作业 {j.run_id} 吗？</>} description="删除后不再显示该作业及其探索结果。" disabled={j.status === 'RUNNING' || j.status === 'PENDING'}
                                restoreFocus={()=>document.getElementById(jobs.length>1?'exp-jobsearch':'exp-new')} onDelete={async()=>{
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
                  hideSinglePage
                />
              </>
            ) : (
              <div className="exp-job-empty" role="status">
                {jobQuery.loading?"正在读取探索作业…":jobs.length ? "没有符合筛选条件的探索作业。" : "当前没有探索作业"}
              </div>
            )}
          </JobListPanel>

          {/* Lower Panel: 探索结果 */}
          {!selectedJob ? (
            <section className="exp-panel exp-selected-result exp-empty-result" aria-label="探索结果">
              <SectionHeading title="探索结果" />
              <div className="iad-result-empty" role="status">
                当前没有探索结果
              </div>
            </section>
          ) : !publication && ['PENDING','RUNNING'].includes(selectedJob.status) ? (
            <section className="exp-panel exp-selected-result" aria-label="探索结果"><SectionHeading title="探索结果" />
              <p className="iad-result-empty" role="status">当前作业没有已发布结果</p></section>
          ) : !publication && ['FAILED','CANCELLED','INTERRUPTED'].includes(selectedJob.status) ? (
            <section className="exp-panel exp-selected-result" aria-label="探索结果"><SectionHeading title="探索结果" />
              <p className="iad-result-empty" role="status">当前作业没有已发布结果</p></section>
          ) : (
            <section className="exp-panel exp-selected-result" aria-label="所选作业的探索结果">
              <SectionHeading title="探索结果">
                {publication&&<AnalysisExportButton versionId={publication.version_id}/>}</SectionHeading>
              <div className="exp-result-content">
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
                            <td className="exp-direction-description" title={narrative?.text(d.brief)}>
                              <ReferencedText text={d.brief} references={d.references}
                                onReference={()=>{setViewingDirection(d);setModal('direction');}} onPreview={()=>{}}/>
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
              </div>
            </section>
          )}
        </div>
      )}

            {/* Prompt Drawer */}
      {modal === "prompt" && promptJobId && <AnalysisPromptDrawer jobId={promptJobId} onClose={()=>setModal('')} />}

      {modal === 'save' && <ExplorationPresetDialog text={prompt} onClose={()=>setModal('')} onSaved={saved=>{
        setPresets(values=>[...values,saved]);setSelectedPresetId(saved.id);setOriginalPrompt(saved.text);setModal('');
      }} />}
      {modal === 'source' && <ExplorationSourceDialog kind={sampleTab} candidates={samplePool}
        datasets={datasets.filter(item=>selectedChildIds.includes(item.dataset_id))}
        selected={sampleTab==='normal'?normalSelected:defectSelected} loading={samplesLoading}
        onChange={sampleTab==='normal'?setNormalSelected:setDefectSelected} onClose={()=>setModal('')} />}

      {/* Direction Detail Dialog (Shared Reusable Component) */}
      {modal === "direction" && viewingDirection && (
        <DirectionDetailDialog
          direction={viewingDirection}
          onOpenFullscreen={handleOpenEvidenceFullscreen}
          onClose={() => {setModal("");setViewingDirection(null);workspace.updateView('industrial-exploration',{selected:''});}}
        />
      )}

      {/* Fullscreen Viewer (reused from FullscreenViewer.tsx) */}
      {analysisImage&&<AnalysisEvidenceViewer {...analysisImage} onClose={()=>setAnalysisImage(null)}/>}
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
        onClose={()=>setStatusJobId(null)} />}
    </div>
  );
}
