import {analysisReadSource,type AnalysisReadSource} from '../analysis-results.js';
import {jobIsActive} from '../../shared/job-display.js';
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
import {JobStatusDrawer} from './JobStatusDrawer.js';
import {JobList} from './JobList.js';
import {useJobList} from '../useJobList.js';
import {Select} from './Select.js';
import {TabBar} from './layout/TabBar.js';
import {Button} from './Button.js';
import {ThumbnailCard} from "./ThumbnailCard.js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dataset, JobSnapshot } from "../../shared/contracts.js";
import { mediaUrl, message, request } from "../api.js";
import {useJobs} from "../useJobs.js";
import {useDatasetCatalog} from '../useDatasetCatalog.js';
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import {PlusIcon} from "../AuditIcon.js";
import { IconButton } from "./IconButton.js";
import {DeleteAction} from './DeleteAction.js';
import { DatasetScopeSelector } from "./DatasetScopeSelector.js";
import { DirectionDetailDialog, type DirectionItem } from "./DirectionDetailDialog.js";
import { FullscreenViewer, type FullscreenViewerItem } from "./FullscreenViewer.js";

import type {AnalysisPublicationView, AnalysisResults, DirectionRemoval, ExplorationPromptPreset, ExplorationAgentStart} from "../../shared/domain.generated.js";
import {useModuleSettings} from '../useModuleSettings.js';
import {useResource} from "../useResource.js";
import {useWorkspace} from '../workspace.js';
import {ExplorationNarrative,explorationCandidates,explorationDirections,type ExplorationCandidate} from "../exploration-view.js";

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
  const [statusJobId, setStatusJobId] = useState<string | null>(null);
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
  const [modal, setModal] = useState<"" | "source" | "save" | "direction">("");
  const [promptJobId,setPromptJobId]=useState<string|null>(null);
  const [viewingDirection, setViewingDirection] = useState<DirectionItem | null>(null);

  // Direction detail interaction

  // Fullscreen Viewer state (reusing shared FullscreenViewer.tsx)
  const [viewerData, setViewerData] = useState<{
    items: FullscreenViewerItem[];
    currentIndex: number;
  } | null>(null);
  const [analysisImage,setAnalysisImage]=useState<{result:AnalysisReadSource;source:FullscreenViewerItem&{sampleId:string}}|null>(null);



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

  const jobList=useJobList(jobs,jobQuery.identity,selectedJobId,job=>selectJob(job.root_run_id));
  const selectedJob=jobList.selected;
  const results=useResource<AnalysisResults>(selectedJob?`/analysis/results/${encodeURIComponent(selectedJob.run_id)}`:null,
    `${refreshTick}:${selectedJob?.status}:${selectedJob?.analysis_version_id}`,jobIsActive(selectedJob));
  const historical=useResource<AnalysisPublicationView>(route.job===selectedJob?.run_id&&route.version
    ?`/analysis/publications/${encodeURIComponent(route.version)}`:null,refreshTick);
  const publication=historical.data||(jobIsActive(selectedJob)?results.data?.current:results.data?.publication||results.data?.current);
  const publicationSource=publication?analysisReadSource(publication):null;
  const datasetNames=useMemo(()=>Object.fromEntries(datasets.map(item=>[item.dataset_id,item.name])),[datasets]);
  const narrative=useMemo(()=>publication?new ExplorationNarrative(publication,datasetNames):null,[publication,datasetNames]);
  const selectedJobDirections=useMemo(()=>explorationDirections(publication,route.selected,datasetNames),[publication,route.selected,datasetNames]);
  const selectedJobLimitations=publication?.catalog.limitations.map(text=>narrative!.text(text))||[];
  const selectedJobSummary=publication?narrative!.text(publication.catalog.summary):'';
  useEffect(()=>{
    if(!route.selected||!publication)return;
    const direction=selectedJobDirections.find(item=>item.id===route.selected);
    if(direction){setViewingDirection(direction);setModal('direction');}
  },[route.selected,publication&&('version_id' in publication?publication.version_id:publication.revision)]);

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

  };

  // Toggle child dataset selection
  const handleChildToggle = (cid: string) => {
    resetScope();
    setSelectedChildIds((prev) =>
      prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]
    );

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
      selectJob(res.run_id);refreshJobs();setView('jobs');submission.current=null;
    } catch(error){setError(message(error));} finally {setSubmitting(false);}
  };

  const currentEvidence=viewingDirection?.evidences||[];

  // Open FullscreenViewer on evidence click
  const handleOpenEvidenceFullscreen = (clickedRef: string) => {
    const selected=currentEvidence.find(item=>item.ref===clickedRef);
    if(selected&&viewingDirection){
      setAnalysisImage({result:viewingDirection.source,source:{id:selected.evidenceId,sampleId:selected.sampleId,title:selected.filename,imageUrl:selected.fullUrl}});return;
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
          <JobList title="探索作业" className="exp-job-list" list={jobList} datasets={datasets} loading={jobQuery.loading} actions={{
            status:job=>setStatusJobId(job.root_run_id),prompt:job=>setPromptJobId(job.run_id),delete:async job=>{
              await request(`/analysis/delete/${encodeURIComponent(job.run_id)}`,{});refreshJobs();
            },
          }}/>


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
                {publicationSource?.kind==='published'&&<AnalysisExportButton versionId={publicationSource.versionId}/>}</SectionHeading>
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
                              {d.brief}
                            </td>
                            <td>{d.applies}</td>
                            <td className="iad-number">{evidenceCount} 张</td>
                            <td className="exp-direction-action" onClick={(e) => e.stopPropagation()}>
                              <IconButton icon="details" label="查看方向" title="查看方向" className="exp-direction-view-icon exp-view-detail-button" onClick={() => {
                                  setViewingDirection(d);
                                  setModal("direction");
                                }} />
                              {d.source.kind==='published'&&<DeleteAction title="删除方向" name={d.title} description="保留原始模型结果和历史引用。" onDelete={async () => {
                                const removal: DirectionRemoval = {dataset_id:d.datasetId,version_id:d.source.kind==='published'?d.source.versionId:'',direction_id:d.id};
                                await request('/exploration/directions/remove',removal);
                                setRefreshTick(value=>value+1);
                              }} />}
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
      {promptJobId && <AnalysisPromptDrawer jobId={promptJobId} onClose={()=>setPromptJobId(null)} />}

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
