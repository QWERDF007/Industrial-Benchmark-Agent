import {PromptDrawer} from './PromptDrawer.js';
import {Select} from './Select.js';
import {Button} from './Button.js';
import {IconButton} from "./IconButton.js";
import {Pagination} from "./Pagination.js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Dataset, JobSnapshot } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useResource } from "../useResource.js";
import {useDatasetCatalog} from '../useDatasetCatalog.js';
import { useWorkspace } from "../workspace.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";

import type { KnowledgeCheckPage, KnowledgeCheckReview, KnowledgeVersion, KnowledgeVersionCatalog } from "../../shared/domain.generated.js";
import {jobStatuses} from '../../shared/job-display.js';
import {JobStatusDrawer, JobStatusButton, JobStatusAction} from './JobStatusDrawer.js';
import {KnowledgeEntryDialog} from "./KnowledgeEntryDialog.js";
import {KnowledgeMiningCreate} from "./KnowledgeMiningCreate.js";
import {KnowledgeConfirmation, type KnowledgeConfirmationState} from "./KnowledgeConfirmation.js";
import { ClearFilterButton, RefreshIconButton } from "./CommonFilterControls.js";

interface KnowledgeItemData {
  id: string;
  name: string;
  summary: string;
  supportCount: number;
  counterCount: number;
  review: KnowledgeCheckReview;
}

interface UiJobItem {
  id: string;
  name: string;
  subset: string;
  status: "completed" | "running" | "interrupted" | "failed";
  statusLabel: string;
  statusBadgeClass: string;
  count: number | null;
  at: string;
  durationText: string;
  prompt: string;
  knowledgeVersionId: string | null;
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function KnowledgePage({
  dataset,
  refreshRevision
}: {
  dataset: Dataset;
  refreshRevision: number;
}) {
  const { workspace } = useWorkspace();
  const pageId = "industrial-knowledge";
  const view = workspace.view(pageId);
  const catalog=useDatasetCatalog();
  const datasets=catalog.data?.datasets || [dataset], groups=catalog.data?.groups || [];

  // Hierarchy
  const initialParentId = getDatasetGroupId(dataset);
  const [selectedParentId, setSelectedParentId] = useState<string>(() => initialParentId);
  const [selectedChildId, setSelectedChildId] = useState<string>(() => dataset.dataset_id);

  // Jobs & Knowledge hooks
  const [revision, setRevision] = useState(0);
  const updated = useCallback(() => setRevision(v => v + 1), []);
  const polling = useJobs("knowledge", selectedChildId, updated, view.job);
  const versionsResource = useResource<KnowledgeVersionCatalog>(`/knowledge/versions?${new URLSearchParams({dataset_id: selectedChildId})}`, revision + refreshRevision);
  const versions = versionsResource.data?.versions || [];
  const loadError=catalog.error;

  // Local job list & selection
  const [selectedJobId, setSelectedJobId] = useState<string | null>(view.job || null);
  const [jobDetails, setJobDetails] = useState<string | null>(null);
  useEffect(()=>setSelectedJobId(view.job || null),[view.job]);
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatus, setJobStatus] = useState("all");
  const [jobPage, setJobPage] = useState(1);

  // Lower panel search & filter
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [knowledgeStatus, setKnowledgeStatus] = useState("all");
  const [entryPage, setEntryPage] = useState(1);

  // Modals & Drawers
  const [promptJob, setPromptJob] = useState<UiJobItem | null>(null);
  const [detailItem, setDetailItem] = useState<Pick<React.ComponentProps<typeof KnowledgeEntryDialog>, 'versionId' | 'checkId'> | null>(null);
  const [confirmState, setConfirmState] = useState<KnowledgeConfirmationState | null>(null);
  const createOpen = view.tab === 'setup';
  const [toastMsg, setToastMsg] = useState("");

  const toast = useCallback((msg: string) => setToastMsg(msg), []);
  useEffect(()=>{if(!toastMsg)return;const timer=setTimeout(()=>setToastMsg(""),2800);return()=>clearTimeout(timer);},[toastMsg]);

  // Sync datasets and hierarchy
  useEffect(() => {
    setSelectedParentId(getDatasetGroupId(dataset));
    setSelectedChildId(dataset.dataset_id);
  }, [dataset.dataset_id]);

  const jobList: UiJobItem[] = polling.jobs.map(job => {
    const status = job.status === 'COMPLETED' ? 'completed' : ['RUNNING', 'PENDING'].includes(job.status) ? 'running'
      : ['INTERRUPTED', 'CANCELLED'].includes(job.status) ? 'interrupted' : 'failed';
    const seconds = job.finished_at && job.started_at ? Math.max(0, Math.round((Date.parse(job.finished_at) - Date.parse(job.started_at)) / 1000)) : null;
    return {id: job.run_id, name: job.mining_prompt?.configuration.objective.split('\n')[0] || `知识挖掘 ${job.run_id.slice(-6)}`,
      subset: job.dataset_ids.includes(selectedChildId) ? selectedChildId : job.dataset_id, status, statusLabel: jobStatuses[job.status],
      statusBadgeClass: {completed:'green',running:'blue',interrupted:'gray',failed:'red'}[status],
      count: versions.find(version => version.version_id === job.knowledge_version_id)?.check_count ?? null,
      at: new Date(job.submitted_at).toLocaleString('zh-CN', {hour12:false}), durationText: formatDuration(seconds),
      prompt: job.mining_prompt?.instruction || '',
      knowledgeVersionId: job.knowledge_version_id || null};
  });

  // Current scope datasets
  const parentGroups = useMemo(()=>buildHierarchyGroups(datasets,groups),[datasets,groups]);
  const currentChildDatasets = useMemo(() => {
    return datasets.filter(d => getDatasetGroupId(d) === selectedParentId);
  }, [datasets, groups, selectedParentId]);

  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId);
    const children = datasets.filter(d => getDatasetGroupId(d) === parentId);
    if (children.length > 0) {
      setSelectedChildId(children[0].dataset_id);
      workspace.selectDataset(children[0].dataset_id);
    }
  };

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    workspace.selectDataset(childId);
  };

  const handleRefresh = () => {
    polling.refresh();
    updated();
    toast("已刷新当前数据");
  };

  // Filter jobs by current dataset/subset, search and status
  const scopedJobs = jobList.filter(job => job.subset === selectedChildId);

  const filteredJobs = useMemo(() => {
    return scopedJobs.filter(j => {
      const matchSearch = !jobSearch.trim() || j.name.toLowerCase().includes(jobSearch.toLowerCase());
      const matchStatus = jobStatus === "all" || j.status === jobStatus;
      return matchSearch && matchStatus;
    });
  }, [scopedJobs, jobSearch, jobStatus]);

  // Job pagination (8 per page SSOT)
  const jobsPerPage = 8;
  const maxJobPages = Math.max(1, Math.ceil(filteredJobs.length / jobsPerPage));
  const currentJobPage = Math.min(maxJobPages, Math.max(1, jobPage));
  const pageJobs = useMemo(() => {
    return filteredJobs.slice((currentJobPage - 1) * jobsPerPage, currentJobPage * jobsPerPage);
  }, [filteredJobs, currentJobPage]);

  // Selected job
  const selectedJob = useMemo(() => {
    return filteredJobs.find(j => j.id === selectedJobId) || filteredJobs[0] || null;
  }, [jobList, selectedJobId, filteredJobs]);

  const selectJob = (id: string) => {
    setSelectedJobId(id);
    workspace.updateView(pageId, {job:id, version:""});
    setEntryPage(1);
    setKnowledgeSearch("");
    setKnowledgeStatus("all");
  };

  const resultVersions = useMemo(() => {
    if (!selectedJob?.knowledgeVersionId) return [];
    const ids = new Set([selectedJob.knowledgeVersionId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const version of versions) if (version.manually_edited && version.parent_version_id && ids.has(version.parent_version_id) && !ids.has(version.version_id)) {
        ids.add(version.version_id); changed = true;
      }
    }
    return versions.filter(version => ids.has(version.version_id));
  }, [versions, selectedJob?.knowledgeVersionId]);
  const selectedVersionId = view.job === selectedJob?.id && resultVersions.some(version => version.version_id === view.version)
    ? view.version : selectedJob?.knowledgeVersionId;
  const canMaintain = !!selectedVersionId && versionsResource.data?.current_version_id === selectedVersionId;
  const checkQuery = new URLSearchParams({version_id:selectedVersionId || '', page:String(entryPage), page_size:'8', search:knowledgeSearch, review_status:knowledgeStatus});
  const checksResource = useResource<KnowledgeCheckPage>(selectedVersionId ? `/knowledge/details?${checkQuery}` : null, revision + refreshRevision);
  const filteredChecks = checksResource.data?.items || [];
  const maxEntryPages = Math.max(1, Math.ceil((checksResource.data?.total || 0) / 8));
  const currentEntryPage = Math.min(maxEntryPages, Math.max(1, entryPage));
  useEffect(() => {if (entryPage > maxEntryPages && !checksResource.loading) setEntryPage(maxEntryPages);}, [entryPage, maxEntryPages, checksResource.loading]);
  const pagedChecks: KnowledgeItemData[] = filteredChecks.map(check => ({id:check.check_id, name:check.title,
    summary:check.criterion, supportCount:check.support_count, counterCount:check.counter_count, review:check.review}));
  useEffect(() => {setDetailItem(null);}, [selectedChildId, selectedJob?.id]);
  useEffect(() => {setEntryPage(1);}, [selectedJob?.id, selectedVersionId]);

  // Prompt drawer handlers
  const openJobPrompt = (id: string) => {
    const j = jobList.find(v => v.id === id);
    if (!j) return;
    setPromptJob(j);
  };

  const closePrompt = () => {
    setPromptJob(null);
  };

  const openDetail = (item: KnowledgeItemData) => {
    if (selectedVersionId) setDetailItem({versionId:selectedVersionId, checkId:item.id});
  };
  const closeDetail = () => setDetailItem(null);
  const askDeleteJob = (id: string) => {
    const job = jobList.find(item => item.id === id);
    if (!job) return;
    setConfirmState({title:'删除挖掘作业', message:`确定删除“${job.name}”的作业记录吗？`, danger:true,confirmLabel:'删除',
      onConfirm: async () => {
        try {await request(`/analysis/delete/${encodeURIComponent(id)}`, {}); polling.refresh(); updated(); toast('作业已删除');}
        catch (error) {toast(message(error));}
      }});
  };
  const askDeleteEntry = (item: KnowledgeItemData) => {
    if (!selectedVersionId || !selectedJob) return;
    setConfirmState({title:'移除知识条目', message:`从当前知识中移除“${item.name}”并生成维护版本？`, danger:true,
      onConfirm: async () => {
        try {
          const version = await request<KnowledgeVersion>(`/knowledge/versions/${encodeURIComponent(selectedVersionId)}/checks/remove`,
            {submission_id:crypto.randomUUID(), check_id:item.id});
          workspace.updateView(pageId, {job:selectedJob.id, version:version.version_id}); updated(); toast('已生成维护版本');
        } catch (error) {toast(message(error));}
      }});
  };

  const openCreate = () => workspace.updateView(pageId, {tab:'setup'});



  return (
    <div id="knowledge-page" className="iad-knowledge-page">
      <div className={`kb-v45 v46-app ${createOpen ? "kb-creating" : ""}`}>
        <div className="kb-v45-main">
        <div className="main-inner">
          {!createOpen && <>
          {/* Topline Header */}
          <header className="topline">
            <div className="titlebar">
              <h1>知识挖掘</h1>
            </div>
            <div className="actions">
              <Button variant="primary" id="create-btn" onClick={openCreate}>
                ＋ 新建挖掘
              </Button>
            </div>
          </header>

          {/* Context Scope Selector */}
          <section className="context" aria-label="选择数据范围">
            <div className="control">
              <label className="label" htmlFor="dataset">
                数据集
              </label>
              <Select
                id="dataset"
                className="f wide select"
                aria-label="当前数据集"
                value={selectedParentId}
                onChange={e => handleParentChange(e.target.value)}
              >
                {parentGroups.map(g => (
                  <option key={g.group_id} value={g.group_id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="control">
              <label className="label" htmlFor="subset">
                子数据集
              </label>
              <Select
                id="subset"
                className="f wide select"
                aria-label="子数据集"
                value={selectedChildId}
                onChange={e => handleChildChange(e.target.value)}
              >
                {currentChildDatasets.map(d => (
                  <option key={d.dataset_id} value={d.dataset_id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="kb-context-actions">
              <RefreshIconButton
                id="kb-refresh"
                title="刷新当前页面"
                ariaLabel="刷新当前页面"
                onClick={handleRefresh}
              />
            </div>
            <div className="context-info" id="dataset-info"></div>
          </section>

          {/* Upper Panel: 挖掘作业 */}
          <section className="panel" aria-labelledby="jobs-heading">
            <div className="panelbar">
              <div>
                <h2 id="jobs-heading">
                  挖掘作业
                  <span aria-hidden="true" className="count hide" id="jobs-count"></span>
                </h2>
              </div>
              <div className="filterset">
                <input
                  className="f"
                  id="job-search"
                  placeholder="搜索作业名称"
                  aria-label="搜索作业名称"
                  value={jobSearch}
                  onChange={e => {
                    setJobSearch(e.target.value);
                    setJobPage(1);
                  }}
                />
                <Select
                  className="f"
                  id="job-status"
                  aria-label="筛选作业状态"
                  value={jobStatus}
                  onChange={e => {
                    setJobStatus(e.target.value);
                    setJobPage(1);
                  }}
                >
                  <option value="all">全部状态</option>
                  <option value="completed">已完成</option>
                  <option value="running">运行中</option>
                  <option value="interrupted">已中断</option>
                  <option value="failed">失败</option>
                </Select>
                <ClearFilterButton
                  id="kb-clear-job-filters"
                  ariaLabel="清除筛选条件"
                  title="清除筛选条件"
                  disabled={!jobSearch && jobStatus === "all"}
                  onClick={() => {
                    setJobSearch("");
                    setJobStatus("all");
                    setJobPage(1);
                  }}
                />
              </div>
            </div>
            <div className="tableframe" id="jobs-table-frame" style={{ minHeight: maxJobPages > 1 ? "465px" : "" }}>
              {filteredJobs.length > 0 ? (
                <table className="jobs-table" id="jobs-table">
                  <thead>
                    <tr>
                      <th style={{ width: "36%" }}>作业名称</th>
                      <th>状态</th>
                      <th className="num" title="关联发布知识版本中的判据数量">
                        判据数
                      </th>
                      <th>提交时间</th>
                      <th>耗时</th>
                      <th className="right">操作</th>
                    </tr>
                  </thead>
                  <tbody id="job-rows">
                    {pageJobs.map(j => (
                      <tr
                        key={j.id}
                        tabIndex={0}
                        aria-label={`选择挖掘作业 ${j.name}`}
                        aria-selected={j.id === selectedJob?.id}
                        className={j.id === selectedJob?.id ? "current" : ""}
                        data-pick-job={j.id}
                        onClick={() => selectJob(j.id)}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectJob(j.id);
                          }
                        }}
                      >
                        <td>
                          <div className="jobtitle" title={j.name}>
                            {j.name}
                          </div>
                        </td>
                        <td>
                          <JobStatusButton job={polling.jobs.find(job=>job.run_id===j.id)!} onClick={()=>setJobDetails(polling.jobs.find(job=>job.run_id===j.id)!.root_run_id)}>
                            <span className={`status ${j.statusBadgeClass}`}>{j.statusLabel}</span></JobStatusButton>
                        </td>
                        <td className="num">{j.count ?? "—"}</td>
                        <td>{j.at}</td>
                        <td>{j.durationText}</td>
                        <td>
                          <div className="jobact" onClick={e => e.stopPropagation()}>
                            <JobStatusAction job={polling.jobs.find(job=>job.run_id===j.id)!} onClick={()=>setJobDetails(polling.jobs.find(job=>job.run_id===j.id)!.root_run_id)} />
                            <IconButton icon="prompt" type="button" title="查看提示词" label="查看提示词" data-job-prompt={j.id} onClick={() => openJobPrompt(j.id)} />
                            <IconButton icon="delete" type="button" title="删除作业" label={`删除作业 ${j.name}`} data-remove-job={j.id} onClick={() => askDeleteJob(j.id)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div id="jobs-empty" className="tableempty">
                  {scopedJobs.length ? "没有符合筛选条件的挖掘作业。" : polling.loading?"正在读取挖掘作业…":"当前范围还没有挖掘作业，可以创建新挖掘。"}
                </div>
              )}
            </div>
            <Pagination id="job-pager" total={filteredJobs.length} page={currentJobPage} size={jobsPerPage} onPage={setJobPage} label="挖掘作业" />
          </section>

          {/* Lower Panel: 知识条目 */}
          <section className="panel" id="knowledge-panel" aria-labelledby="knowledge-heading">
            <div className="panelbar knowledgebar">
              <div>
                <h2 id="knowledge-heading">
                  知识条目
                  <span aria-hidden="true" className="count hide" id="knowledge-count"></span>
                </h2>
                <div className="scope-name hide" id="knowledge-job-name"></div>
              </div>
              {selectedJob?.knowledgeVersionId ? (
                <div className="filterset" id="knowledge-filterset">
                  <input
                    className="f"
                    id="knowledge-search"
                    placeholder="搜索知识条目"
                    aria-label="搜索知识条目"
                    value={knowledgeSearch}
                    onChange={e => {
                      setKnowledgeSearch(e.target.value);
                      setEntryPage(1);
                    }}
                  />
                  <Select
                    className="f"
                    id="knowledge-status"
                    aria-label="筛选核实状态"
                    value={knowledgeStatus}
                    onChange={e => {
                      setKnowledgeStatus(e.target.value);
                      setEntryPage(1);
                    }}
                  >
                    <option value="all">全部条目</option>
                    <option value="pending">待核实</option>
                    <option value="confirmed">已通过</option>
                    <option value="rejected">已驳回</option>
                    <option value="conflict">存在矛盾</option>
                  </Select>
                  <ClearFilterButton
                    id="kb-clear-knowledge-filters"
                    ariaLabel="清除筛选条件"
                    title="清除筛选条件"
                    disabled={!knowledgeSearch && knowledgeStatus === "all"}
                    onClick={() => {
                      setKnowledgeSearch("");
                      setKnowledgeStatus("all");
                      setEntryPage(1);
                    }}
                  />
                </div>
              ) : null}
            </div>
            {resultVersions.length > 1 && <label className="control">结果版本<Select className="f" aria-label="知识结果版本" value={selectedVersionId || ''}
              onChange={event=>workspace.updateView(pageId,{job:selectedJob!.id,version:event.target.value})}>
              {resultVersions.map(version=><option key={version.version_id} value={version.version_id}>{version.manually_edited ? '维护版本' : '作业冻结版本'} {version.version_id.slice(-8)}</option>)}
            </Select></label>}
            <div className="knowledge-wrap" id="knowledge-body">
              {!selectedJob ? (
                <div className="blank">
                  请选择上方的挖掘作业查看知识条目。
                </div>
              ) : selectedJob.status==='failed'&&!selectedJob.knowledgeVersionId ? <p className="iad-plain-empty" role="status">当前作业下没有对应的知识</p> : !selectedJob.knowledgeVersionId ? (
                <div className="blank">
                  {selectedJob.status === "running"
                    ? "作业正在运行，知识发布后将在这里显示。"
                    : "当前作业下没有对应的知识"}
                </div>
              ) : checksResource.error ? <p role="alert">{checksResource.error}</p>
                : checksResource.loading ? <div className="blank">正在读取作业冻结知识</div>
                : filteredChecks.length === 0 ? (
                <div className="blank">
                  {knowledgeSearch || knowledgeStatus !== "all" ? "没有符合筛选条件的知识条目。" : "当前作业暂无知识条目。"}
                </div>
              ) : (
                <div className="knowledge-list">
                  <div className="knowledge-head">
                    <span>知识条目</span>
                    <span>描述</span>
                    <span>支持/反对</span>
                    <span>操作</span>
                  </div>
                  <div className="knowledge-items">
                    {pagedChecks.map(item => (
                      <div
                        key={item.id}
                        className="knowledge-row"
                        data-detail-entry={item.id}
                        role="row"
                        tabIndex={0}
                        aria-label={`查看知识条目：${item.name}`}
                        onClick={() => openDetail(item)}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDetail(item);
                          }
                        }}
                      >
                        <span className="row-title knowledge-entry-name">{item.name}</span>
                        <span className="row-desc knowledge-entry-description" title={item.summary}>
                          {item.summary}
                        </span>
                        <span
                          className="row-count col-evidence-count"
                          title={`支持 ${item.supportCount} 张，反对 ${item.counterCount} 张`}
                        >
                          {item.supportCount}/{item.counterCount}
                        </span>
                        <span className="col-action jobact" onClick={e => e.stopPropagation()}>
                          <IconButton icon="details" type="button" className="knowledge-entry-view" data-view-entry={item.id} label={`查看知识条目 ${item.name}`} title="查看知识条目" onClick={() => openDetail(item)} />
                          <IconButton icon="delete" type="button" className="knowledge-entry-delete" data-delete-entry={item.id} disabled={!canMaintain} label={`删除知识条目 ${item.name}`} title="删除知识条目" onClick={() => askDeleteEntry(item)} />
                        </span>
                      </div>
                    ))}
                  </div>
                  <Pagination total={checksResource.data?.total || 0} page={currentEntryPage} size={8} onPage={setEntryPage} label="知识条目" />
                </div>
              )}
            </div>
          </section>

          {(loadError || polling.error || versionsResource.error) && <p role="alert">{loadError || polling.error || versionsResource.error}</p>}
          </>}

            {createOpen && <KnowledgeMiningCreate key={selectedChildId} dataset={dataset} datasets={datasets} groups={parentGroups}
              selectedParentId={selectedParentId} selectedChildId={selectedChildId}
              onClose={()=>workspace.updateView(pageId,{tab:'results'})} onStarted={jobs=>{
                const first=jobs[0];
                if(first) {workspace.openLocation({pageId,datasetId:first.dataset_id,job:first.run_id,version:'',tab:'results'}); setSelectedJobId(first.run_id);}
                polling.refresh(); updated(); toast('挖掘作业已启动');
              }} />}
        </div>
      </div>

      {/* Overlays and Drawers */}
      {/* 1. Job Prompt Drawer */}
      {promptJob && <PromptDrawer title="查看提示词" text={promptJob.prompt || '该历史作业未记录冻结提示词。'} onClose={closePrompt} />}

            {detailItem && <KnowledgeEntryDialog key={`${detailItem.versionId}:${detailItem.checkId}`} {...detailItem}
              onClose={closeDetail} onSaved={()=>{updated();toast('人工核实已保存');}} />}
            {jobDetails && polling.jobs.some(job=>job.run_id===jobDetails || job.root_run_id===jobDetails) && <JobStatusDrawer
              job={polling.jobs.find(job=>job.run_id===jobDetails || job.root_run_id===jobDetails)!} onClose={()=>setJobDetails(null)}
              stale={polling.syncState === 'stale'} />}
<KnowledgeConfirmation state={confirmState} onClose={()=>setConfirmState(null)} />
            {/* 6. Toast */}
            <div className={`toast ${toastMsg ? "show" : ""}`} id="toast" role="status">
              {toastMsg}
            </div>
      </div>
    </div>
  );
}
