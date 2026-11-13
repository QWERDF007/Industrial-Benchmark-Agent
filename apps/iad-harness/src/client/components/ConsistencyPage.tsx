import {useQuery} from '@tanstack/react-query';
import {queryClient} from '../query-client.js';
import {JOB_POLL_INTERVAL,jobIsActive} from '../../shared/job-display.js';
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
import {JobStatusDrawer} from './JobStatusDrawer.js';
import {JobList} from './JobList.js';
import {useJobList} from '../useJobList.js';
import {TabBar} from './layout/TabBar.js';
import {Button} from './Button.js';
import {ConsistencyResultCard} from './ConsistencyResultCard.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  JobSnapshot,
  DatasetCatalog
} from '../../shared/contracts.js';
import { buildHierarchyGroups, getDatasetGroupId } from '../dataset-hierarchy.js';
import { IconButton } from './IconButton.js';
import { ConsistencyEvidencePage } from './ConsistencyEvidencePage.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { Pagination } from './Pagination.js';
import { useWorkspace } from '../workspace.js';
import { message, request } from '../api.js';
import { workbenchStyles } from '../styles.js';
import {consistencyTaskCategories} from '../../shared/prompt-defaults.generated.js';
import {ConsistencyCheckCreate} from './ConsistencyCheckCreate.js';
import {identityPromptFields} from '../consistency-prompts.js';
import {usePagePosition} from '../usePagePosition.js';
import {ConsistencyView,consistencyImageGroups,initialConsistencyFilters,type ConsistencyImageGroup,type ConsistencyFilterValues} from '../consistency-view.js';
import {useJobs} from '../useJobs.js';
import {useDatasetCatalog} from '../useDatasetCatalog.js';

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

  // Consistency jobs state
  const [statusJobId, setStatusJobId] = useState('');
  const selectedJobId=state.consistency.batchId || '';
  const setSelectedJobId=useCallback((batchId:string)=>workspace.updateConsistency({batchId:batchId||undefined},true),[workspace]);
  const [revision, setRevision] = useState(0);

  // Conflicts list and filter state
  const [kind, setKind] = useState<string>('images');
  const [modelFilter, setModelFilter] = useState<ConsistencyFilterValues['model']>('all');
  const [agreement, setAgreement] = useState<ConsistencyFilterValues['agreement']>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [reviewFilter, setReviewFilter] = useState<ConsistencyFilterValues['review']>('all');

  const createOpen=state.consistency.view==='setup';
  const [modal,setModal]=useState<''|'compare'>('');
  const [currentConflictId, setCurrentConflictId] = useState<string>('');
  const [statsModalJobId, setStatsModalJobId] = useState<string>('');
  const [promptJob,setPromptJob]=useState<JobSnapshot|null>(null);

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
  const polling=useJobs('consistency',selectedChildIds,progress,selectedJobId);
  const batches=polling.jobs;

  const jobList=useJobList(batches,polling.identity,selectedJobId,job=>selectJob(job.root_run_id));
  const selectedJob=jobList.selected;

  const images=useConsistencyImages(selectedJob?.consistency_check_version===1?selectedJob.run_id:undefined,
    `${revision}:${selectedJob?.status}`,!!selectedJob&&['PENDING','RUNNING'].includes(selectedJob.status));
  const imageGroup:ConsistencyImageGroup|null=kind==='images'||Object.hasOwn(consistencyImageGroups,kind)
    ?kind as ConsistencyImageGroup:null;

  const conflictQuery=useQuery({queryKey:['iad','consistency-conflicts',selectedJob?.run_id],enabled:!!selectedJob,
    queryFn:({signal})=>selectedJob!.consistency_check_version===1?ConsistencyView.loadCheck(selectedJob!.run_id,signal):ConsistencyView.load(selectedJob!.program_batch_id!,signal),
    refetchInterval:jobIsActive(selectedJob)?JOB_POLL_INTERVAL:false,refetchOnWindowFocus:true,
  },queryClient);
  const jobConflicts=conflictQuery.data?.items||[];
  const conflictsLoading=!!selectedJob&&conflictQuery.isPending;
  useEffect(()=>{
    if(selectedJob)void conflictQuery.refetch({cancelRefetch:false});
  },[selectedJob?.run_id,selectedJob?.status,revision]);

  const visibleConflicts = useMemo(() => ConsistencyView.filter(jobConflicts,
    {search,model:modelFilter,agreement,review:reviewFilter})
    .filter(item=>item.types.some(type=>type===kind)),
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

      setKind('images');
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

    setSearch('');
    setPage(1);
    setKind('images');
    setModelFilter('all');
    setAgreement('all');
  }, [workspace,selectedChildIds,selectedParentId]);

  // Job selection
  const selectJob = useCallback((runId: string) => {
    setSelectedJobId(runId);
    setSearch('');
    setPage(1);
    setKind('images');
    setModelFilter('all');
    setAgreement('all');
    setReviewFilter('all');
  }, [setSelectedJobId]);

  // Refresh consistency data
  const handleRefresh = useCallback(() => {
    polling.refresh();
    setRevision(v => v + 1);
  }, [polling.refresh]);

  const currentConflict = useMemo(
    () => jobConflicts.find(c => c.id === currentConflictId) || null,
    [jobConflicts, currentConflictId]
  );

  const taskType=selectedJob?.consistency_task_type;
  const modelTypes=Object.entries(modelConclusionLabels)
    .filter(([value])=>value==='EQUIVALENT' || !taskType || consistencyTaskCategories[taskType].some(category=>category===value))
    .map(([value,label])=>({value,label}));

  const conflictTabs = useMemo(() => {
    if(!selectedJob)return [];
    const defaults = new Set<string>(taskType?consistencyTaskCategories[taskType]:datasets.filter(dataset=>selectedJob?.dataset_ids.includes(dataset.dataset_id))
      .flatMap(dataset=>conflictCategoryDefaults[dataset.format]));
    return [...(selectedJob?.consistency_check_version===1?[{value:'images',label:'全部图像'}]:[]),
      ...Object.entries(conflictCategoryLabels)
      .filter(([value])=>defaults.has(value)).map(([value,label])=>({value,label})),
      ...(selectedJob?.consistency_check_version===1?Object.entries(consistencyImageGroups).map(([value,label])=>({value,label})):[])];
  }, [datasets,taskType,selectedJob?.dataset_ids,selectedJob?.consistency_check_version]);

  useEffect(()=>{
    if(conflictTabs.length&&!conflictTabs.some(tab=>tab.value===kind))setKind(conflictTabs[0].value);
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
        setKind('images');
        setAgreement('all');
        setReviewFilter('all');
        setPage(1);
        setStatsModalJobId('');
      } else if (action === 'stat-agreement') {
        setAgreement(id==='same'?'same':'different');
        setKind('images');
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
          setSearch('');setKind('images');setModelFilter('all');setAgreement('all');setPage(1);
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

        {(polling.error||conflictQuery.error)&&<p role="alert" className="iad-error">{polling.error||message(conflictQuery.error)}</p>}

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
        <JobList title="检查作业" className="dc-jobs-section" list={jobList} datasets={datasets} loading={polling.loading} actions={{
          status:job=>setStatusJobId(job.root_run_id),prompt:setPromptJob,
          delete:async job=>{await request(`/analysis/delete/${encodeURIComponent(job.run_id)}`,{});polling.refresh();setRevision(value=>value+1);},
          additional:[{id:'statistics',label:'统计',icon:'stats',onClick:job=>{selectJob(job.root_run_id);setStatsModalJobId(job.root_run_id);}}],
        }}/>


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
                  tab.value==='images' ? selectedJob.total_samples : Object.hasOwn(consistencyImageGroups,tab.value)
                    ?ConsistencyView.filter(images.items,initialConsistencyFilters,tab.value as keyof typeof consistencyImageGroups).length : jobConflicts.filter(conflict => conflict.types.some(type=>type===tab.value)).length
                }</span></>, buttonProps: {'data-dc': 'raw-tab', 'data-id': tab.value}}))} />

              <div className="dc-result-panel" role="tabpanel" aria-label={conflictTabs.find(tab=>tab.value===kind)?.label}>
              {imageGroup ? <ConsistencyImages key={selectedJob.run_id} jobId={selectedJob.run_id} images={images} group={imageGroup}
                filters={{search,model:modelFilter,agreement,review:reviewFilter}} onReviewed={()=>setRevision(value=>value+1)}/> : conflictsLoading ? <p className="iad-result-empty" role="status">正在读取结果…</p>
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

      {promptJob && <PromptDrawer title="查看提示词" text={promptJob.consistency_prompt || '该作业没有保存提示词。'} systemText={promptJob.system_prompt}
        additionalSections={promptJob.consistency_identity_prompts?identityPromptFields.map(({name,label})=>({
          title:label,text:promptJob.consistency_identity_prompts![name]})):[]} onClose={()=>setPromptJob(null)} />}

      {!!statsModalJobId && <ConsistencyStatisticsDialog statistics={conflictQuery.data?.statistics} onFilter={handleStatClick}
        loading={conflictsLoading} error={conflictQuery.error?.message}
        onClose={()=>setStatsModalJobId('')} />}

      {statusJobId && batches.some(job=>job.root_run_id===statusJobId) && <JobStatusDrawer
        job={batches.find(job=>job.root_run_id===statusJobId)!} onClose={()=>setStatusJobId('')} />}
    </div>
  );
}
