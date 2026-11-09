import {SectionHeading} from './layout/SectionHeading.js';
import {PromptDrawer} from './PromptDrawer.js';
import {conflictCategories,conflictCategoryDefaults} from '../../shared/consistency.parameters.generated.js';
import {WorkbenchHeader} from './layout/WorkbenchHeader.js';
import {v4 as uuid} from 'uuid';
import {ConsistencyStatisticsDialog,type ConsistencyStatisticAction} from './ConsistencyStatisticsDialog.js';
import {ConsistencyConflictDialog} from './ConsistencyConflictDialog.js';
import {ConsistencyGallery} from './ConsistencyGallery.js';
import {MultiSelect, Select} from './Select.js';
import {Modal} from './Modal.js';
import {JobStatusDrawer, JobStatusButton, JobStatusAction} from './JobStatusDrawer.js';
import {JobListPanel} from './JobListPanel.js';
import {TabBar} from './layout/TabBar.js';
import {Button} from './Button.js';
import {ThumbnailCard} from "./ThumbnailCard.js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ConsistencyBatchSummary,
  DatasetCatalog,
  JobSnapshot
} from '../../shared/contracts.js';
import { buildHierarchyGroups, getDatasetGroupId } from '../dataset-hierarchy.js';
import { IconButton } from './IconButton.js';
import {DeleteAction} from './DeleteAction.js';
import { ConsistencyEvidencePage } from './ConsistencyEvidencePage.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { Pagination, IBA_JOBS_PAGE_SIZE } from './Pagination.js';
import { useWorkspace } from '../workspace.js';
import { message, request } from '../api.js';
import { workbenchStyles } from '../styles.js';
import { ClearFilterButton } from './CommonFilterControls.js';
import {promptDefaults} from '../../shared/prompt-defaults.generated.js';
import {AgentPromptEditors} from './AgentPromptEditors.js';
import {ConsistencyView,type ConflictCardItem} from '../consistency-view.js';
import {useConsistencyJobs,type ConsistencyJob} from '../useConsistencyJobs.js';
import {jobStatuses} from '../../shared/job-display.js';
import {useDatasetCatalog} from '../useDatasetCatalog.js';

function dcJobBadge(status: ConsistencyJob['status']) {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETED') return <span className="dc-state exp-pill ok">已完成</span>;
  if (s === 'PARTIAL') return <span className="dc-state exp-pill ok">部分完成</span>;
  if (s === 'RUNNING') return <span className="dc-state exp-pill running">运行中</span>;
  if (s === 'PENDING') return <span className="dc-state exp-pill pending">排队中</span>;
  return <span className="dc-state exp-pill fail">{jobStatuses[status]}</span>;
}

// The job-list count is the unfiltered, raw conflict group count for that job.
// Do not substitute the currently filtered grid count or model-confirmed count.
const dcJobConflictTotal = (j: Pick<ConsistencyBatchSummary,'status'|'conflict_count'>) =>
  (j.status === 'COMPLETED' || j.status === 'PARTIAL') &&
  typeof j.conflict_count === 'number' &&
  Number.isFinite(j.conflict_count) &&
  j.conflict_count >= 0
    ? String(j.conflict_count)
    : '—';

// Actual duration persisted by the job API (duration_seconds), not inferred from submission time.
const dcJobElapsed = (j: Pick<ConsistencyBatchSummary,'duration_seconds'>) => {
  const sec = j.duration_seconds;
  if (typeof sec !== 'number' || !Number.isFinite(sec) || sec < 0) return '—';
  const m = Math.floor(sec / 60);
  const r = Math.round(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export const DEFAULT_CONSISTENCY_PROMPT = promptDefaults.consistency;

export function ConsistencyPage() {
  const { state,workspace } = useWorkspace();
  const catalog=useDatasetCatalog();
  const evidenceId = state.consistency.evidenceId;
  const queryId = state.consistency.queryId;
  const [queryError,setQueryError] = useState('');
  const onExpired = useCallback(()=>setQueryError('冻结查询已失效，请从检查作业打开结果。'),[]);
  const [visited, setVisited] = useState(!evidenceId);

  useEffect(()=>setQueryError(''),[queryId]);
  useEffect(() => {
    if (!evidenceId) setVisited(true);
  }, [evidenceId]);

  return (
    <>
      {visited && (
        <div hidden={!!evidenceId} style={{ height: '100%' }}>
          {queryId ? <div className="iad-workbench iad-business-page" data-page="industrial-consistency"><style>{workbenchStyles}</style>
            <WorkbenchHeader pageId="industrial-consistency" />
            <Button onClick={()=>workspace.updateConsistency({queryId:undefined,groupId:undefined,memberId:undefined,differenceId:undefined},true)}>检查作业</Button>
            {queryError ? <p role="alert">{queryError}</p> : <ConsistencyGallery queryId={queryId}
              kind={state.consistency.tab==='groups'?'groups':'conflicts'} onExpired={onExpired} />}
          </div> : catalog.data ? <ConsistencyIntegratedWorkspace {...catalog.data} /> :
            <div className="iad-workbench iad-business-page" data-page="industrial-consistency"><style>{workbenchStyles}</style><WorkbenchHeader pageId="industrial-consistency" />
              <p role={catalog.error?'alert':'status'}>{catalog.error || '正在加载数据集…'}</p></div>}
        </div>
      )}
      {evidenceId && <ConsistencyEvidencePage evidenceId={evidenceId} />}
    </>
  );
}

function ConsistencyIntegratedWorkspace({datasets,groups}:DatasetCatalog) {
  const {state,workspace}=useWorkspace();
  const initialParent=buildHierarchyGroups(datasets,groups)[0]?.group_id || '';
  const selectedParentId=state.consistency.parentId ?? initialParent;
  const selectedChildIds=state.consistency.datasetIds ?? datasets.filter(item=>getDatasetGroupId(item)===selectedParentId).map(item=>item.dataset_id);
  const [error, setError] = useState('');

  // Consistency jobs state
  const [statusJobId, setStatusJobId] = useState('');
  const selectedJobId=state.consistency.batchId || '';
  const setSelectedJobId=useCallback((batchId:string)=>workspace.updateConsistency({batchId:batchId||undefined},true),[workspace]);
  const [jobPage, setJobPage] = useState<number>(1);
  const [revision, setRevision] = useState(0);

  // Conflicts list and filter state
  const [jobConflicts, setJobConflicts] = useState<ConflictCardItem[]>([]);
  const [conflictsLoading, setConflictsLoading] = useState(false);
  const [kind, setKind] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [agreement, setAgreement] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [reviewFilter, setReviewFilter] = useState<string>('all');

  // Modals state
  const [modal, setModal] = useState<'' | 'new' | 'compare'>('');
  const [modalChildIds, setModalChildIds] = useState<string[]>([]);
  const [newCheckBusy, setNewCheckBusy] = useState<boolean>(false);
  const newSubmission=useRef<{key:string;id:string}|null>(null);
  const [newPrompt, setNewPrompt] = useState<string>(DEFAULT_CONSISTENCY_PROMPT);
  const [systemPrompt,setSystemPrompt]=useState<string>(promptDefaults.system.consistency);
  const [currentConflictId, setCurrentConflictId] = useState<string>('');
  const [activeQueryId, setActiveQueryId] = useState<string>('');
  const [statsModalJobId, setStatsModalJobId] = useState<string>('');
  const [promptJob,setPromptJob]=useState<ConsistencyJob|null>(null);

  // Derive hierarchy groups
  const hierarchyGroups = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
  const currentParent = useMemo(
    () => hierarchyGroups.find(g => g.group_id === selectedParentId) || hierarchyGroups[0],
    [hierarchyGroups, selectedParentId]
  );
  const currentChildDatasets = useMemo(
    () => datasets.filter(d => getDatasetGroupId(d) === currentParent?.group_id),
    [datasets, hierarchyGroups, currentParent]
  );
  const progress=useCallback(()=>setRevision(value=>value+1),[]);
  const polling=useConsistencyJobs(selectedChildIds,progress);
  const batches=polling.jobs;

  // Available jobs for current parent and child scope
  const availableJobs = useMemo(() => {
    if (!selectedChildIds.length) {
      return [];
    }
    return batches
      .filter(b => {
        const jobDatasets = b.dataset_ids;
        return jobDatasets.some(id => selectedChildIds.includes(id));
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [batches, selectedChildIds]);

  const jobPages = Math.max(1, Math.ceil(availableJobs.length / IBA_JOBS_PAGE_SIZE));
  const currentJobPage = Math.max(1, Math.min(jobPages, jobPage));
  const shownJobs = useMemo(() => {
    return availableJobs.slice(
      (currentJobPage - 1) * IBA_JOBS_PAGE_SIZE,
      currentJobPage * IBA_JOBS_PAGE_SIZE
    );
  }, [availableJobs, currentJobPage]);

  // Selected job
  const selectedJob = useMemo(() => {
    if (!shownJobs.length) return null;
    if (selectedJobId) {
      const match = shownJobs.find(j => j.analysis.root_run_id === selectedJobId || j.batch_id === selectedJobId);
      if (match) return match;
    }
    const withResults = shownJobs.find(
      j => (j.status === 'COMPLETED' || j.status === 'PARTIAL') && (j.conflict_count || 0) > 0
    );
    if (withResults) return withResults;
    const completed = shownJobs.find(j => j.status === 'COMPLETED' || j.status === 'PARTIAL');
    if (completed) return completed;
    return shownJobs[0] || null;
  }, [shownJobs, selectedJobId]);

  const handleJobPageChange = (newPage: number) => {
    const targetPage = Math.max(1, Math.min(jobPages, newPage));
    setJobPage(targetPage);
    const firstJobOnPage = availableJobs[(targetPage - 1) * IBA_JOBS_PAGE_SIZE];
    if (firstJobOnPage) {
      setSelectedJobId(firstJobOnPage.analysis.root_run_id);
    }
    setPage(1);
  };

  useEffect(() => {
    const controller=new AbortController();
    setJobConflicts([]);setActiveQueryId('');setError('');
    if(!selectedJob || !['COMPLETED','PARTIAL'].includes(selectedJob.status))return;
    if(!selectedJob.analysis.program_batch_id && selectedJob.analysis.consistency_check_version!==1)return;
    setConflictsLoading(true);
    const load=selectedJob.analysis.consistency_check_version===1 ? ConsistencyView.loadCheck(selectedJob.analysis.run_id,controller.signal)
      : ConsistencyView.load(selectedJob.batch_id,controller.signal);
    load
      .then(value=>{if(!controller.signal.aborted){setJobConflicts(value.items);setActiveQueryId(value.queryId);}})
      .catch(error=>{if(!controller.signal.aborted)setError(message(error));})
      .finally(()=>{if(!controller.signal.aborted)setConflictsLoading(false);});
    return()=>controller.abort();
  },[selectedJob?.batch_id,selectedJob?.status,revision]);

  // Visible conflicts filtered by kind, modelFilter, agreement, search, reviewFilter
  const visibleConflicts = useMemo(() => {
    let list = [...jobConflicts];
    if (kind !== 'all') {
      list = list.filter(c => c.types.some(type=>type===kind));
    }
    if (modelFilter !== 'all') {
      list = list.filter(c => c.model.modelType === modelFilter);
    }
    if (agreement !== 'all') {
      list = list.filter(c => c.agreement === agreement);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => c.filename.toLowerCase().includes(q));
    }
    if (reviewFilter !== 'all') {
      list = list.filter(c => c.review === reviewFilter);
    }
    return list;
  }, [jobConflicts, kind, modelFilter, agreement, search, reviewFilter]);

  const totalPages = Math.max(1, Math.ceil(visibleConflicts.length / 18));
  const currentPage = Math.min(totalPages, Math.max(1, page));
  const paginatedConflicts = useMemo(() => {
    const start = (currentPage - 1) * 18;
    return visibleConflicts.slice(start, start + 18);
  }, [visibleConflicts, currentPage]);

  // Parent dataset change handler
  const handleParentChange = useCallback(
    (newParentId: string) => {
      const newChildren = datasets.filter(d => getDatasetGroupId(d) === newParentId);
      workspace.updateConsistency({parentId:newParentId,datasetIds:newChildren.map(c=>c.dataset_id),batchId:undefined},true);
      setJobPage(1);
      setKind('all');
      setModelFilter('all');
      setAgreement('all');
      setSearch('');
      setPage(1);
      setStatsModalJobId('');
    },
    [datasets, workspace]
  );

  // Child dataset toggle handler
  const handleChildToggle = useCallback((childId: string) => {
    workspace.updateConsistency({parentId:selectedParentId,datasetIds:selectedChildIds.includes(childId)
      ? selectedChildIds.filter(id=>id!==childId):[...selectedChildIds,childId],batchId:undefined},true);
    setJobPage(1);
    setSearch('');
    setPage(1);
    setKind('all');
    setModelFilter('all');
    setAgreement('all');
  }, [workspace,selectedChildIds,selectedParentId]);

  // Job selection
  const selectJob = useCallback((runId: string) => {
    setSelectedJobId(runId);
    setSearch('');
    setPage(1);
    setKind('all');
    setModelFilter('all');
    setAgreement('all');
    setReviewFilter('all');
  }, [setSelectedJobId]);

  // Refresh consistency data
  const handleRefresh = useCallback(() => {
    setJobPage(1);polling.refresh();
    setRevision(v => v + 1);
  }, [polling.refresh]);

  // Start new consistency check
  const handleCreateJob = async () => {
    if (!modalChildIds.length || !newPrompt.trim() || !systemPrompt.trim() || newCheckBusy) return;
    setNewCheckBusy(true);setError('');
    try {
      const key=JSON.stringify([modalChildIds,systemPrompt,newPrompt]);
      if(newSubmission.current?.key!==key)newSubmission.current={key,id:uuid()};
      const started=await request<JobSnapshot>('/analysis/start',{submission_id:newSubmission.current.id,analysis_kind:'consistency',
        dataset_ids:modalChildIds,system_prompt:systemPrompt,instruction:newPrompt});
      newSubmission.current=null;
      workspace.updateConsistency({parentId:selectedParentId,datasetIds:[...modalChildIds],batchId:started.root_run_id},true);
      setModal('');
      setSearch('');
      setJobPage(1);
      setKind('all');
      setModelFilter('all');
      setAgreement('all');
      setPage(1);
      setRevision(v => v + 1);
    } catch (err) {
      setError(message(err));
    } finally {
      setNewCheckBusy(false);
    }
  };

  const currentConflict = useMemo(
    () => jobConflicts.find(c => c.id === currentConflictId) || null,
    [jobConflicts, currentConflictId]
  );

  async function handleDeleteJob(job: ConsistencyJob) {
    await request(`/analysis/delete/${encodeURIComponent(job.analysis.run_id)}`,{});
    setRevision(value => value + 1);
  }

  const availableTypes=useMemo(()=>{
    const formats=datasets.filter(dataset=>selectedJob?.dataset_ids.includes(dataset.dataset_id)).map(dataset=>dataset.format);
    const defaults=new Set<string>(formats.flatMap(format=>conflictCategoryDefaults[format]));
    return conflictCategories.filter(type=>defaults.has(type)||jobConflicts.some(item=>item.types.includes(type)));
  },[datasets,selectedJob?.batch_id,jobConflicts]);
  const modelTypes=useMemo(()=>[...new Set(jobConflicts.map(item=>item.model.modelType))],[jobConflicts]);

  // Raw conflict tabs
  const conflictTabs = useMemo(() => {
    return [{ value: 'all', label: '全部冲突' }, ...availableTypes.map(t => ({ value: t, label: t }))];
  }, [availableTypes]);

  const handleStatClick = useCallback(
    (action: ConsistencyStatisticAction, id: string) => {
      if (action === 'stat-category') {
        setKind(id);
        setModelFilter('all');
        setAgreement('all');
        setReviewFilter('all');
        setPage(1);
        setStatsModalJobId('');
      } else if (action === 'stat-model') {
        setModelFilter(id);
        setKind('all');
        setAgreement('all');
        setReviewFilter('all');
        setPage(1);
        setStatsModalJobId('');
      } else if (action === 'stat-agreement') {
        setAgreement(id);
        setKind('all');
        setModelFilter('all');
        setReviewFilter('all');
        setPage(1);
        setStatsModalJobId('');
      }
      setTimeout(() => {
        const el = document.querySelector('.dc-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    },
    []
  );


  return (
    <div className="iad-workbench iad-business-page iad-consistency" data-page="industrial-consistency">
      <style>{workbenchStyles}</style>

      <div className="dc-root">
        <WorkbenchHeader pageId="industrial-consistency" className="heading dc-page-heading">
          <div className="dc-heading-actions">
            <Button
              type="button"
              variant="primary"
              data-dc="start-check"
              onClick={() => {
                setNewPrompt(DEFAULT_CONSISTENCY_PROMPT);
                setSystemPrompt(promptDefaults.system.consistency);
                setModalChildIds([...selectedChildIds]);
                          setModal('new');
              }}
            >
              新建检查
            </Button>
          </div>
        </WorkbenchHeader>

        {(error||polling.error)&&<p role="alert" className="iad-error">{error||polling.error}</p>}

        {/* Scope Selector */}
        <DatasetScopeSelector
          className="dc-scope"
          groups={hierarchyGroups}
          selectedGroupId={selectedParentId}
          onGroupChange={handleParentChange}
          childDatasets={currentChildDatasets}
          selectedChildIds={selectedChildIds}
          onChildToggle={handleChildToggle}
          groupId="dc-parent"
          childId="dc-child-trigger"
          childMenuId="dc-child-options"
        >
          <IconButton icon="refresh" type="button" title="刷新检查作业" label="刷新检查作业" onClick={handleRefresh} />
        </DatasetScopeSelector>

        {/* Consistency Jobs Table */}
        <JobListPanel title="检查作业" className={`dc-section dc-jobs-section ${jobPages > 1 ? 'iba-job-multipage' : ''}`}>
          {availableJobs.length ? (
            <>
              <div className="dc-table-panel">
                <table className="dc-table">
                  <thead>
                    <tr>
                      <th>作业</th>
                      <th>状态</th>
                      <th>检查范围</th>
                      <th>冲突总数</th>
                      <th>提交时间</th>
                      <th>耗时</th>
                      <th className="dc-operations">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shownJobs.map(j => {
                      const isSelected = j.analysis.root_run_id === selectedJob?.analysis.root_run_id;
                      const childNames = j.dataset_ids
                        .map(id => datasets.find(d => d.dataset_id === id)?.name || id)
                        .join('、');
                      const timeStr = j.created_at ? j.created_at.slice(0, 16).replace('T', ' ') : '—';
                      const hasConflicts =
                        (j.status === 'COMPLETED' || j.status === 'PARTIAL') &&
                        typeof j.conflict_count === 'number' &&
                        j.conflict_count > 0;
                      return (
                        <tr
                          key={j.analysis.root_run_id}
                          tabIndex={0}
                          data-dc-row={j.batch_id}
                          data-selected={isSelected}
                          aria-selected={isSelected}
                          onClick={() => selectJob(j.analysis.root_run_id)}
                          onKeyDown={e => {
                            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();selectJob(j.analysis.root_run_id);
                            }
                          }}
                        >
                          <td className="dc-mono">{j.batch_id}</td>
                          <td>
                            <JobStatusButton job={j.analysis} onClick={()=>setStatusJobId(j.analysis.root_run_id)}>{dcJobBadge(j.status)}</JobStatusButton>
                          </td>
                          <td className="dc-job-datasets" title={childNames}>
                            {childNames || '全部'}
                          </td>
                          <td
                            className={`dc-total ${hasConflicts ? 'dc-has-conflicts' : ''}`}
                            title="原始检查检测出的冲突图组数"
                          >
                            {dcJobConflictTotal(j)}
                          </td>
                          <td className="dc-time">{timeStr}</td>
                          <td className="dc-elapsed dc-mono">{dcJobElapsed(j)}</td>
                          <td className="dc-operations" onClick={e => e.stopPropagation()}>
                            <JobStatusAction job={j.analysis} onClick={()=>setStatusJobId(j.analysis.root_run_id)} />
                            <IconButton icon="prompt" label="查看提示词" data-dc="view-prompt" data-id={j.batch_id} onClick={()=>setPromptJob(j)} />
                            <IconButton icon="stats" type="button" title="查看统计结果" label="查看统计结果" data-dc="stats" data-id={j.batch_id} disabled={j.status !== 'COMPLETED' && j.status !== 'PARTIAL'} onClick={() => {
                                setSelectedJobId(j.analysis.root_run_id);
                                setStatsModalJobId(j.analysis.root_run_id);
                              }} />
                            <DeleteAction title="删除检查作业" name={j.batch_id} onDelete={() => handleDeleteJob(j)}
                              restoreFocus={() => document.getElementById('dc-parent')} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                total={availableJobs.length}
                page={currentJobPage}
                onPage={handleJobPageChange}
                label="检查作业"
                size={IBA_JOBS_PAGE_SIZE}
                hideSinglePage
              />
            </>
          ) : (
            <div className="dc-empty">{polling.loading?'正在读取检查作业…':'当前没有检查作业'}</div>
          )}
        </JobListPanel>

        {/* Results Section */}
        <section className="dc-section dc-results-section">
          <SectionHeading title="标注冲突" />
          <div className="dc-results-body">

          {!selectedJob ? (
            <p className="iad-result-empty" role="status">当前没有结果</p>
          ) : !['COMPLETED','PARTIAL'].includes(selectedJob.status) ? (
            <p className="iad-result-empty" role="status">当前作业没有已发布结果</p>
          ) : conflictsLoading ? (
            <p className="iad-result-empty" role="status">正在读取结果…</p>
          ) : !jobConflicts.length ? (
            <p className="iad-result-empty" role="status">当前没有结果</p>
          ) : (
            <>
              {/* Conflict Type Tabs */}
              <TabBar label="原始标注冲突类型" value={kind} onChange={value => {setKind(value); setPage(1);}}
                items={conflictTabs.map(tab => ({id: tab.value, label: <><span>{tab.label}</span><span className="iad-tab-count">{
                  tab.value === 'all' ? jobConflicts.length : jobConflicts.filter(conflict => conflict.types.some(type=>type===tab.value)).length
                }</span></>, buttonProps: {'data-dc': 'raw-tab', 'data-id': tab.value}}))} />

              {/* 文件名搜索、模型判断、结论一致性与人工复核 */}
              <div className="dc-refined-filterbar" role="group" aria-label="冲突筛选">
                {/* Filename search input: 38px height, placeholder '搜索文件名' */}
                <label className="dc-filter-field dc-search-field">
                  文件名搜索
                  <input
                    type="search"
                    id="dc-filename-search"
                    aria-label="文件名搜索"
                    placeholder="搜索文件名"
                    autoComplete="off"
                    style={{ height: '38px', minHeight: '38px', maxHeight: '38px', boxSizing: 'border-box' }}
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </label>

                <label className="dc-filter-field">
                  模型判断
                  <Select
                    id="dc-model-filter"
                    aria-label="模型判断"
                    value={modelFilter}
                    onChange={e => {
                      setModelFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">全部判断</option>
                    {modelTypes.map(name => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="dc-filter-field">
                  结论一致性
                  <Select
                    id="dc-agreement"
                    aria-label="原结论与模型判定一致性"
                    value={agreement}
                    onChange={e => {
                      setAgreement(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">全部</option>
                    <option value="same">一致</option>
                    <option value="different">不一致</option>
                  </Select>
                </label>

                <label className="dc-filter-field dc-review-field">
                  人工复核
                  <Select
                    id="dc-review-filter"
                    aria-label="人工复核"
                    value={reviewFilter}
                    onChange={e => {
                      setReviewFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">全部状态</option>
                    <option value="pending">待复核</option>
                    <option value="confirmed">确认冲突</option>
                    <option value="rejected">排除冲突</option>
                  </Select>
                </label>

                <ClearFilterButton
                  data-dc="clear-conflict-filters"
                  ariaLabel="清除筛选条件"
                  title="清除筛选条件"
                  disabled={!search && modelFilter === "all" && agreement === "all" && reviewFilter === "all"}
                  onClick={() => {
                    setSearch("");
                    setModelFilter("all");
                    setAgreement("all");
                    setReviewFilter("all");
                    setPage(1);
                  }}
                />
              </div>

              {/* Grid of conflict cards */}
              {paginatedConflicts.length ? (
                <div className="iad-thumbnail-grid dc-conflict-grid">
                  {paginatedConflicts.map(c => (
                    <ThumbnailCard key={c.id} src={c.url} variant="comparison" label={c.filename} data-dc="open-conflict" data-id={c.id}
                      aria-label={`${c.filename}，原始结论：${c.type}；模型结论：${c.model.modelType}`}
                      onClick={()=>{setCurrentConflictId(c.id);setModal('compare');}}>
                      <span className="iad-thumbnail-values" aria-label="原始结论与模型结论">
                        <span title={`原始结论：${c.type}`}>{c.type}</span>
                        <span title={`模型结论：${c.model.modelType}`}>{c.model.modelType}</span>
                      </span>
                    </ThumbnailCard>
                  ))}
                </div>
              ) : (
                <p className="iad-result-empty" role="status">当前筛选条件下没有匹配的冲突图组。</p>
              )}

              <Pagination total={visibleConflicts.length} page={currentPage} size={18} unit="组" onPage={setPage} />
            </>
          )}
          </div>
        </section>
      </div>

      {/* New Consistency Check Modal */}
      {modal === 'new' && (
        <Modal title="新建一致性检查" size="form" id="dc-new-mask" className="dc-dialog dc-new-dialog" onClose={()=>setModal('')} header={false}>
            <header className="dc-dialog-head">
              <h2 id="dc-new-title">新建一致性检查</h2>
              <IconButton icon="close" type="button" title="关闭" label="关闭" onClick={() => {
                  setModal('');
                            }} />
            </header>
            <div className="dc-dialog-body dc-new-body">
              <div className="dc-new-field">
                <span>数据集</span>
                <div className="dc-new-parent">{currentParent?.name || '—'}</div>
              </div>
              <div className="dc-new-field">
                <span>子数据集</span>
                <MultiSelect id="dc-new-child-trigger" menuId="dc-new-child-options" label="子数据集"
                  options={currentChildDatasets.map(item=>({value:item.dataset_id,label:item.name}))} selected={modalChildIds}
                  onToggle={id=>setModalChildIds(previous=>previous.includes(id)?previous.filter(value=>value!==id):[...previous,id])} disabled={newCheckBusy} />
              </div>
              <div className="dc-new-field dc-prompt-editor">
                {(error||polling.error)&&<p role="alert" className="iad-error">{error||polling.error}</p>}
                <AgentPromptEditors id="dc-new-prompt" system={systemPrompt} user={newPrompt}
                  onSystemChange={setSystemPrompt} onUserChange={setNewPrompt} disabled={newCheckBusy}/>
              </div>
            </div>
            <footer className="dc-dialog-footer">
              <Button
                type="button"

                data-dc="close-new"
                onClick={() => {
                  setModal('');
                            }}
              >
                取消
              </Button>
              <Button
                type="button"
                variant="primary"
                data-dc="create-job"
                disabled={!modalChildIds.length || !newPrompt.trim() || !systemPrompt.trim() || newCheckBusy}
                onClick={handleCreateJob}
              >
                {newCheckBusy ? '启动中…' : '开始检查'}
              </Button>
            </footer>
        </Modal>
      )}

      {modal==='compare' && currentConflict && <ConsistencyConflictDialog conflict={currentConflict} items={visibleConflicts}
        queryId={activeQueryId} onSelect={setCurrentConflictId} onClose={()=>setModal('')}
        onReviewed={()=>setRevision(value=>value+1)} />}

      {promptJob && <PromptDrawer title="查看提示词" text={promptJob.analysis.consistency_prompt || '该作业没有保存提示词。'} systemText={promptJob.analysis.system_prompt} onClose={()=>setPromptJob(null)} />}

      {!!statsModalJobId && <ConsistencyStatisticsDialog items={jobConflicts} onFilter={handleStatClick}
        onClose={()=>setStatsModalJobId('')} />}

      {statusJobId && batches.some(job=>job.analysis.root_run_id===statusJobId) && <JobStatusDrawer
        job={batches.find(job=>job.analysis.root_run_id===statusJobId)!.analysis} onClose={()=>setStatusJobId('')} />}
    </div>
  );
}
