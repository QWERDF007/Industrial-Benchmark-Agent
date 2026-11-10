import {SectionHeading} from './layout/SectionHeading.js';
import {PromptDrawer} from './PromptDrawer.js';
import {conflictCategoryDefaults,conflictCategoryLabels,modelConclusionLabels} from '../../shared/consistency.parameters.generated.js';
import {WorkbenchHeader} from './layout/WorkbenchHeader.js';
import {ConsistencyStatisticsDialog,type ConsistencyStatisticAction} from './ConsistencyStatisticsDialog.js';
import {ConsistencyConflictDialog} from './ConsistencyConflictDialog.js';
import {ConsistencyImages} from './ConsistencyImages.js';
import {useConsistencyImages} from '../useConsistencyImages.js';
import {ConsistencyGallery} from './ConsistencyGallery.js';
import {ConsistencyFilters} from './ConsistencyFilters.js';
import {JobStatusDrawer, JobStatusButton, JobStatusAction} from './JobStatusDrawer.js';
import {JobListPanel} from './JobListPanel.js';
import {TabBar} from './layout/TabBar.js';
import {Button} from './Button.js';
import {ConsistencyResultCard} from './ConsistencyResultCard.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ConsistencyBatchSummary,
  DatasetCatalog
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
import {consistencyTaskCategories} from '../../shared/prompt-defaults.generated.js';
import {ConsistencyCheckCreate} from './ConsistencyCheckCreate.js';
import {identityPromptFields} from '../consistency-prompts.js';
import {usePagePosition} from '../usePagePosition.js';
import {ConsistencyView,consistencyImageGroups,type ConsistencyImageGroup,type ConflictCardItem,type ConsistencyFilterValues} from '../consistency-view.js';
import {useConsistencyJobs,type ConsistencyJob} from '../useConsistencyJobs.js';
import {formatJobTime,jobStatuses} from '../../shared/job-display.js';
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
  const [modelFilter, setModelFilter] = useState<ConsistencyFilterValues['model']>('all');
  const [agreement, setAgreement] = useState<ConsistencyFilterValues['agreement']>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [reviewFilter, setReviewFilter] = useState<ConsistencyFilterValues['review']>('all');

  const createOpen=state.consistency.view==='setup';
  const [modal,setModal]=useState<''|'compare'>('');
  const [currentConflictId, setCurrentConflictId] = useState<string>('');
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

  const images=useConsistencyImages(selectedJob?.analysis.consistency_check_version===1?selectedJob.analysis.run_id:undefined,
    `${revision}:${selectedJob?.status}`,!!selectedJob&&['PENDING','RUNNING'].includes(selectedJob.status));
  const imageGroup:ConsistencyImageGroup|null=kind==='images'||Object.hasOwn(consistencyImageGroups,kind)
    ?kind as ConsistencyImageGroup:null;

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
    setJobConflicts([]);setError('');
    if(!selectedJob || !['COMPLETED','PARTIAL'].includes(selectedJob.status))return;
    if(!selectedJob.analysis.program_batch_id && selectedJob.analysis.consistency_check_version!==1)return;
    setConflictsLoading(true);
    const load=selectedJob.analysis.consistency_check_version===1 ? ConsistencyView.loadCheck(selectedJob.analysis.run_id,controller.signal)
      : ConsistencyView.load(selectedJob.batch_id,controller.signal);
    load
      .then(value=>{if(!controller.signal.aborted)setJobConflicts(value.items);})
      .catch(error=>{if(!controller.signal.aborted)setError(message(error));})
      .finally(()=>{if(!controller.signal.aborted)setConflictsLoading(false);});
    return()=>controller.abort();
  },[selectedJob?.batch_id,selectedJob?.status,revision]);

  const visibleConflicts = useMemo(() => ConsistencyView.filter(jobConflicts,
    {search,model:modelFilter,agreement,review:reviewFilter})
    .filter(item=>kind==='all' || item.types.some(type=>type===kind)),
    [jobConflicts,kind,modelFilter,agreement,search,reviewFilter]);

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

  const currentConflict = useMemo(
    () => jobConflicts.find(c => c.id === currentConflictId) || null,
    [jobConflicts, currentConflictId]
  );

  async function handleDeleteJob(job: ConsistencyJob) {
    await request(`/analysis/delete/${encodeURIComponent(job.analysis.run_id)}`,{});
    setRevision(value => value + 1);
  }

  const taskType=selectedJob?.analysis.consistency_task_type;
  const modelTypes=Object.entries(modelConclusionLabels)
    .filter(([value])=>value==='EQUIVALENT' || !taskType || consistencyTaskCategories[taskType].some(category=>category===value))
    .map(([value,label])=>({value,label}));

  const conflictTabs = useMemo(() => {
    const defaults = new Set<string>(taskType?consistencyTaskCategories[taskType]:datasets.filter(dataset=>selectedJob?.dataset_ids.includes(dataset.dataset_id))
      .flatMap(dataset=>conflictCategoryDefaults[dataset.format]));
    return [...(selectedJob?.analysis.consistency_check_version===1?[{value:'images',label:'全部图像'}]:[]),
      {value: 'all', label: '全部冲突'}, ...Object.entries(conflictCategoryLabels)
      .filter(([value])=>defaults.has(value)).map(([value,label])=>({value,label})),
      ...(selectedJob?.analysis.consistency_check_version===1?Object.entries(consistencyImageGroups).map(([value,label])=>({value,label})):[])];
  }, [datasets,taskType,selectedJob?.dataset_ids,selectedJob?.analysis.consistency_check_version]);

  useEffect(()=>{
    if(!conflictTabs.some(tab=>tab.value===kind))setKind('all');
    if(modelFilter!=='all'&&!modelTypes.some(option=>option.value===modelFilter))setModelFilter('all');
  },[conflictTabs,taskType,kind,modelFilter]);

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
        setModelFilter(ConsistencyView.modelConclusion(id)||'all');
        setKind('all');
        setAgreement('all');
        setReviewFilter('all');
        setPage(1);
        setStatsModalJobId('');
      } else if (action === 'stat-agreement') {
        setAgreement(id==='same'?'same':'different');
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


  const surface=usePagePosition(createOpen?'consistency:create':`consistency:results:${selectedParentId}:${selectedJobId}`,createOpen||!conflictsLoading);

  return (
    <div ref={surface} className="iad-workbench iad-business-page iad-consistency" data-page="industrial-consistency">
      <style>{workbenchStyles}</style>

      {createOpen?<ConsistencyCheckCreate datasets={datasets} groups={groups} parentId={selectedParentId} datasetIds={selectedChildIds}
        onCancel={()=>workspace.updateConsistency({view:undefined})}
        onStarted={(job,parentId,datasetIds)=>{
          workspace.updateConsistency({view:undefined,parentId,datasetIds,batchId:job.root_run_id},true);
          setSearch('');setJobPage(1);setKind('all');setModelFilter('all');setAgreement('all');setPage(1);
          setRevision(value=>value+1);polling.refresh();
        }}/>:<div className="dc-root">
        <WorkbenchHeader pageId="industrial-consistency" className="heading dc-page-heading">
          <div className="dc-heading-actions">
            <Button
              type="button"
              variant="primary"
              data-dc="start-check"
              onClick={() => {
                workspace.rememberPagePosition('consistency:create',0);
                workspace.updateConsistency({view:'setup'});
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
        <JobListPanel title="检查作业" className="dc-section dc-jobs-section">
          {availableJobs.length ? (
            <>
              <div className="dc-table-panel iad-job-table-scroll">
                <table className="dc-table iad-job-table-grid">
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
                      const timeStr = j.created_at ? formatJobTime(j.created_at) : '—';
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
          ) : (
            <>
              <ConsistencyFilters value={{search,model:modelFilter,agreement,review:reviewFilter}} modelTypes={modelTypes}
                onChange={value=>{setSearch(value.search);setModelFilter(value.model);setAgreement(value.agreement);setReviewFilter(value.review);setPage(1);}}/>
              {/* Conflict Type Tabs */}
              <TabBar label="原始标注冲突类型" value={kind} onChange={value => {setKind(value); setPage(1);}}
                items={conflictTabs.map(tab => ({id: tab.value, label: <><span>{tab.label}</span><span className="iad-tab-count">{
                  tab.value==='images' ? selectedJob.analysis.total_samples : Object.hasOwn(consistencyImageGroups,tab.value)
                    ?images.items.filter(image=>image.reason===tab.value).length : tab.value === 'all' ? jobConflicts.length : jobConflicts.filter(conflict => conflict.types.some(type=>type===tab.value)).length
                }</span></>, buttonProps: {'data-dc': 'raw-tab', 'data-id': tab.value}}))} />

              <div className="dc-result-panel" role="tabpanel" aria-label={conflictTabs.find(tab=>tab.value===kind)?.label}>
              {imageGroup ? <ConsistencyImages key={selectedJob.analysis.run_id} jobId={selectedJob.analysis.run_id} images={images} group={imageGroup}
                filters={{search,model:modelFilter,agreement,review:reviewFilter}} onReviewed={()=>setRevision(value=>value+1)}/> : !['COMPLETED','PARTIAL'].includes(selectedJob.status) ? (
                  <p className="iad-result-empty" role="status">当前作业没有已发布结果</p>
                ) : conflictsLoading ? <p className="iad-result-empty" role="status">正在读取结果…</p>
                : !jobConflicts.length ? <p className="iad-result-empty" role="status">当前没有结果</p> : <>

              {/* Grid of conflict cards */}
              {paginatedConflicts.length ? (
                <div className="iad-thumbnail-grid dc-conflict-grid">
                  {paginatedConflicts.map(c => (
                    <ConsistencyResultCard key={c.id} item={c} action="open-conflict"
                      onOpen={()=>{setCurrentConflictId(c.id);setModal('compare');}}/>
                  ))}
                </div>
              ) : (
                <p className="iad-result-empty" role="status">当前筛选条件下没有匹配的冲突图组。</p>
              )}

              <Pagination total={visibleConflicts.length} page={currentPage} size={18} unit="组" onPage={setPage} />
              </>}
              </div>
            </>
          )}
          </div>
        </section>
      </div>}

      {modal==='compare' && currentConflict && <ConsistencyConflictDialog key={`${currentConflict.checkId}:${currentConflict.id}`} conflict={currentConflict} items={visibleConflicts}
        onSelect={setCurrentConflictId} onClose={()=>setModal('')}
        onReviewed={()=>setRevision(value=>value+1)} />}

      {promptJob && <PromptDrawer title="查看提示词" text={promptJob.analysis.consistency_prompt || '该作业没有保存提示词。'} systemText={promptJob.analysis.system_prompt}
        additionalSections={promptJob.analysis.consistency_identity_prompts?identityPromptFields.map(({name,label})=>({
          title:label,text:promptJob.analysis.consistency_identity_prompts![name]})):[]} onClose={()=>setPromptJob(null)} />}

      {!!statsModalJobId && <ConsistencyStatisticsDialog items={jobConflicts} onFilter={handleStatClick}
        onClose={()=>setStatsModalJobId('')} />}

      {statusJobId && batches.some(job=>job.analysis.root_run_id===statusJobId) && <JobStatusDrawer
        job={batches.find(job=>job.analysis.root_run_id===statusJobId)!.analysis} onClose={()=>setStatusJobId('')} />}
    </div>
  );
}
