import {MultiSelect, Select} from './Select.js';
import {Modal} from './Modal.js';
import {JobStatusDrawer, JobStatusButton} from './JobStatusDrawer.js';
import {TabBar} from './layout/TabBar.js';
import {Button} from './Button.js';
import {ThumbnailCard} from "./ThumbnailCard.js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ConsistencyBatchSummary,
  ConsistencyBatch,
  Dataset,
  DatasetGroup,
  JobSnapshot
} from '../../shared/contracts.js';
import type { GalleryMember } from '../../shared/domain.generated.js';
import { AnnotatedImageStage } from './AnnotatedImageStage.js';
import { buildHierarchyGroups, getDatasetGroupId } from '../dataset-hierarchy.js';
import { IconButton } from './IconButton.js';
import {DeleteAction} from './DeleteAction.js';
import { FullscreenViewer, type FullscreenViewerItem } from './FullscreenViewer.js';
import { ConsistencyEvidencePage } from './ConsistencyEvidencePage.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { Pagination, IBA_JOBS_PAGE_SIZE } from './Pagination.js';
import { useWorkspace } from '../workspace.js';
import { message, request } from '../api.js';
import { workbenchStyles } from '../styles.js';
import { ClearFilterButton } from './CommonFilterControls.js';
import {promptDefaults} from '../../shared/prompt-defaults.generated.js';
import {ConsistencyView,type ConflictCardItem} from '../consistency-view.js';
import {useGroupAnalysis} from '../useGroupAnalysis.js';
import {useResource} from '../useResource.js';
import {annotationSummary} from '../../shared/consistency-presentation.js';
import type {EvidenceBundle,ConsistencyReviewContext,ConsistencyReviewSubmission,GalleryReference,Started,NoWork} from '../../shared/domain.generated.js';

type ConsistencyJob = ConsistencyBatchSummary & {analysis:JobSnapshot};

function dcJobBadge(status: string) {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETED') return <span className="dc-state exp-pill ok">已完成</span>;
  if (s === 'PARTIAL') return <span className="dc-state exp-pill ok">部分完成</span>;
  if (s === 'RUNNING') return <span className="dc-state exp-pill running">运行中</span>;
  if (s === 'PENDING') return <span className="dc-state exp-pill pending">排队中</span>;
  return <span className="dc-state exp-pill fail">失败</span>;
}

// The job-list count is the unfiltered, raw conflict group count for that job.
// Do not substitute the currently filtered grid count or model-confirmed count.
const dcJobConflictTotal = (j: ConsistencyBatchSummary) =>
  (j.status === 'COMPLETED' || j.status === 'PARTIAL') &&
  typeof j.conflict_count === 'number' &&
  Number.isFinite(j.conflict_count) &&
  j.conflict_count >= 0
    ? String(j.conflict_count)
    : '—';

// Actual duration persisted by the job API (duration_seconds), not inferred from submission time.
const dcJobElapsed = (j: ConsistencyBatchSummary) => {
  const sec = j.duration_seconds;
  if (typeof sec !== 'number' || !Number.isFinite(sec) || sec < 0) return '—';
  const m = Math.floor(sec / 60);
  const r = Math.round(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

function niceAxis(max: number): number {
  const target = max / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(target, 1))));
  const normalized = target / magnitude;
  const step =
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude;
  return Math.max(step * 4, Math.ceil(max / step) * step);
}

export const DEFAULT_CONSISTENCY_PROMPT = promptDefaults.consistency;

export function ConsistencyPage() {
  const { state } = useWorkspace();
  const evidenceId = state.consistency.evidenceId;
  const [visited, setVisited] = useState(!evidenceId);

  useEffect(() => {
    if (!evidenceId) setVisited(true);
  }, [evidenceId]);

  return (
    <>
      {visited && (
        <div hidden={!!evidenceId} style={{ height: '100%' }}>
          <ConsistencyIntegratedWorkspace />
        </div>
      )}
      {evidenceId && <ConsistencyEvidencePage evidenceId={evidenceId} />}
    </>
  );
}

function ConsistencyIntegratedWorkspace() {
  // Datasets and hierarchy state
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [groups, setGroups] = useState<DatasetGroup[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('group-1');
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Consistency jobs state
  const [batches, setBatches] = useState<ConsistencyJob[]>([]);
  const [statusJobId, setStatusJobId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
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
  const [currentConflictId, setCurrentConflictId] = useState<string>('');
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [activeQueryId, setActiveQueryId] = useState<string>('');
  const [conflictMembers, setConflictMembers] = useState<GalleryMember[]>([]);
  const [membersError,setMembersError]=useState('');
  const [reviewBusy,setReviewBusy]=useState(false);
  const [reviewLoaded,setReviewLoaded]=useState(false);
  const [reviewError,setReviewError]=useState('');
  const pendingReview=useRef<ConsistencyReviewSubmission|null>(null);
  const [reviewDecision, setReviewDecision] = useState<'pending' | 'confirmed' | 'rejected'>('pending');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [statsModalJobId, setStatsModalJobId] = useState<string>('');
  const [zoomItem, setZoomItem] = useState<FullscreenViewerItem | null>(null);

  // Derive hierarchy groups
  const hierarchyGroups = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
  const currentParent = useMemo(
    () => hierarchyGroups.find(g => g.group_id === selectedParentId) || hierarchyGroups[0],
    [hierarchyGroups, selectedParentId]
  );
  const currentChildDatasets = useMemo(
    () => datasets.filter(d => getDatasetGroupId(d, hierarchyGroups) === currentParent?.group_id),
    [datasets, hierarchyGroups, currentParent]
  );
  // Initial load of datasets
  useEffect(() => {
    const controller = new AbortController();
    request<{ datasets: Dataset[]; groups?: DatasetGroup[] }>('/datasets', undefined, undefined, controller.signal)
      .then(res => {
        if (controller.signal.aborted) return;
        setDatasets(res.datasets);
        if (res.groups) setGroups(res.groups);
        const derived = buildHierarchyGroups(res.datasets, res.groups || []);
        const parentId = derived[0]?.group_id || 'group-1';
        setSelectedParentId(parentId);
        const children = res.datasets.filter(d => getDatasetGroupId(d, derived) === parentId);
        // Default to all child datasets in the selected group
        if (children.length > 0) {
          setSelectedChildIds(children.map(c => c.dataset_id));
        }
      })
      .catch(err => {
        if (!controller.signal.aborted) setError(message(err));
      })
      ;
    return () => controller.abort();
  }, []);

  // Poll consistency runs
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const groups=await Promise.all(selectedChildIds.map(dataset_id=>request<{jobs:JobSnapshot[]}>(
          `/analysis/jobs?${new URLSearchParams({dataset_id,analysis_kind:'consistency'})}`,undefined,undefined,controller.signal)));
        if(controller.signal.aborted)return;
        const roots=[...new Map(groups.flatMap(group=>group.jobs).map(job=>[job.run_id,job])).values()];
        const rows=await Promise.all(roots.filter(job=>job.program_batch_id).map(async job=>{
          const program=await request<ConsistencyBatch>(`/consistency/runs/${encodeURIComponent(job.program_batch_id!)}`,undefined,undefined,controller.signal);
          return {...program,analysis:job,status:job.status,
            total:job.total_samples,completed:job.completed,failed:job.failed,unprocessed:job.unprocessed,cancel_requested:job.cancel_requested,
            created_at:job.submitted_at,duration_seconds:job.finished_at&&job.started_at?Math.max(0,Math.round((Date.parse(job.finished_at)-Date.parse(job.started_at))/1000)):null};
        }));
        if(controller.signal.aborted)return;
        setBatches(rows);
        const hasActive=roots.some(item=>['RUNNING','PENDING'].includes(item.status));
        timer = setTimeout(poll, hasActive ? 1200 : 5000);
      } catch (err) {
        if (!controller.signal.aborted) {
          timer = setTimeout(poll, 5000);
        }
      }
    }

    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [revision,JSON.stringify(selectedChildIds)]);

  // Available jobs for current parent and child scope
  const availableJobs = useMemo(() => {
    if (!selectedChildIds.length) {
      return [];
    }
    return batches
      .filter(b => b.kind === 'consistency')
      .filter(b => {
        const jobDatasets = b.scopes?.subjects?.dataset_ids || [];
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
      const match = shownJobs.find(j => j.batch_id === selectedJobId);
      if (match) return match;
    }
    const withResults = shownJobs.find(
      j => (j.status === 'COMPLETED' || j.status === 'PARTIAL') && (j.pair_count || 0) > 0
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
      setSelectedJobId(firstJobOnPage.batch_id);
    }
    setPage(1);
  };

  useEffect(() => {
    const controller=new AbortController();
    setJobConflicts([]);setActiveQueryId('');setError('');
    if(!selectedJob || !['COMPLETED','PARTIAL'].includes(selectedJob.status))return;
    setConflictsLoading(true);
    ConsistencyView.load(selectedJob.batch_id,controller.signal)
      .then(value=>{if(!controller.signal.aborted){setJobConflicts(value.items);setActiveQueryId(value.queryId);}})
      .catch(error=>{if(!controller.signal.aborted)setError(message(error));})
      .finally(()=>{if(!controller.signal.aborted)setConflictsLoading(false);});
    return()=>controller.abort();
  },[selectedJob?.batch_id,selectedJob?.status,revision]);

  // Visible conflicts filtered by kind, modelFilter, agreement, search, reviewFilter
  const visibleConflicts = useMemo(() => {
    let list = [...jobConflicts];
    if (kind !== 'all') {
      list = list.filter(c => c.type === kind);
    }
    if (modelFilter !== 'all') {
      list = list.filter(c => c.model.modelType === modelFilter);
    }
    if (agreement !== 'all') {
      list = list.filter(c => c.model.status === (agreement === 'same' ? 'conflict' : 'no_conflict'));
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
      setSelectedParentId(newParentId);
      const newChildren = datasets.filter(d => getDatasetGroupId(d, hierarchyGroups) === newParentId);
      setSelectedChildIds(newChildren.map(c => c.dataset_id));
      setSelectedJobId('');
      setJobPage(1);
      setKind('all');
      setModelFilter('all');
      setAgreement('all');
      setSearch('');
      setPage(1);
      setStatsModalJobId('');
    },
    [datasets, hierarchyGroups]
  );

  // Child dataset toggle handler
  const handleChildToggle = useCallback((childId: string) => {
    setSelectedChildIds(prev => {
      const next = prev.includes(childId) ? prev.filter(id => id !== childId) : [...prev, childId];
      return next;
    });
    setSelectedJobId('');
    setJobPage(1);
    setSearch('');
    setPage(1);
    setKind('all');
    setModelFilter('all');
    setAgreement('all');
  }, []);

  // Job selection
  const selectJob = useCallback((batchId: string) => {
    setSelectedJobId(batchId);
    setSearch('');
    setPage(1);
    setKind('all');
    setModelFilter('all');
    setAgreement('all');
    setReviewFilter('all');
  }, []);

  // Refresh consistency data
  const handleRefresh = useCallback(() => {
    setJobPage(1);
    setRevision(v => v + 1);
  }, []);

  // Start new consistency check
  const handleCreateJob = async () => {
    if (!modalChildIds.length || !newPrompt.trim() || newCheckBusy) return;
    setNewCheckBusy(true);setError('');
    try {
      const key=JSON.stringify([modalChildIds,newPrompt]);
      if(newSubmission.current?.key!==key)newSubmission.current={key,id:crypto.randomUUID()};
      await request<JobSnapshot>('/analysis/start',{submission_id:newSubmission.current.id,analysis_kind:'consistency',
        dataset_ids:modalChildIds,instruction:newPrompt.trim()});
      newSubmission.current=null;
      setSelectedChildIds([...modalChildIds]);
      setModal('');
      setSearch('');
      setJobPage(1);
      setKind('all');
      setModelFilter('all');
      setAgreement('all');
      setPage(1);
      setSelectedJobId('');
      setRevision(v => v + 1);
    } catch (err) {
      setError(message(err));
    } finally {
      setNewCheckBusy(false);
    }
  };

  // Open conflict comparison modal
  const openConflict = useCallback(
    (c: ConflictCardItem) => {
      setCurrentConflictId(c.id);
      setCandidateIndex(0);
      setReviewDecision(c.review);
      setReviewNote('');
      setModal('compare');
    },
    []
  );

  const currentConflict = useMemo(
    () => jobConflicts.find(c => c.id === currentConflictId) || null,
    [jobConflicts, currentConflictId]
  );

  const groupReference=useMemo<GalleryReference|null>(()=>modal==='compare' && currentConflict && activeQueryId ? {
    query_id:activeQueryId,kind:'conflicts',group_id:currentConflict.rawItem.group_id,facts_state:currentConflict.rawItem.facts_state
  }:null,[modal,currentConflict?.id,activeQueryId]);
  const groupAnalysis=useGroupAnalysis(groupReference);
  useEffect(()=>{
    const controller=new AbortController();setConflictMembers([]);setMembersError('');setCandidateIndex(0);
    if(!groupReference)return;
    ConsistencyView.members(groupReference,controller.signal)
      .then(items=>{if(!controller.signal.aborted)setConflictMembers(items);})
      .catch(error=>{if(!controller.signal.aborted)setMembersError(message(error));});
    return()=>controller.abort();
  },[JSON.stringify(groupReference)]);
  const selectedMember=conflictMembers[candidateIndex] || null;
  const currentCandidate=useMemo(()=>{
    const image=selectedMember?.image;
    return {sampleId:image?.sample.sample_id || '',filename:image?.sample.relative_path.split('/').pop() || '',
      thumbUrl:image?ConsistencyView.media(image,true):'',fullUrl:image?ConsistencyView.media(image):'',
      width:image?.sample.width,height:image?.sample.height};
  },[selectedMember]);
  const compared=useResource<EvidenceBundle>(modal==='compare' && selectedMember?.comparison ?
    `/consistency/evidence/${encodeURIComponent(selectedMember.comparison.evidence_id)}`:null);
  const anchorSide=selectedMember?.comparison?.anchor_side;
  const anchorSource=anchorSide?compared.data?.sources[anchorSide]:null;
  const candidateSource=anchorSide?compared.data?.sources[anchorSide==='left'?'right':'left']:null;
  const anchorBboxes=anchorSource?.annotations.annotations.filter(annotation=>annotation.bbox && annotation.geometry_status!=='INVALID') || [];
  const candidateBboxes=candidateSource?.annotations.annotations.filter(annotation=>annotation.bbox && annotation.geometry_status!=='INVALID') || [];
  const readReview=useCallback(async(signal?:AbortSignal)=>{
    if(!selectedMember?.comparison)return;
    const context=await request<ConsistencyReviewContext>('/consistency/review/context',{evidence_id:selectedMember.comparison.evidence_id},undefined,signal);
    if(signal?.aborted)return;
    const latest=context.decisions.at(-1),action=latest?.request.action.kind;
    const decision=action==='CONFIRM_DIFFERENCE'?'confirmed':action==='REJECT_DIFFERENCE'?'rejected':'pending';
    setReviewDecision(decision);setReviewNote(latest?.request.comment || '');
    setReviewLoaded(true);
  },[selectedMember?.comparison?.evidence_id,currentConflict?.id]);
  useEffect(()=>{
    const controller=new AbortController();setReviewLoaded(false);setReviewError('');setReviewDecision('pending');setReviewNote('');pendingReview.current=null;
    void readReview(controller.signal).catch(error=>{if(!controller.signal.aborted)setReviewError(message(error));});
    return()=>controller.abort();
  },[readReview]);

  const handlePrevConflict = useCallback(() => {
    const list = visibleConflicts;
    const idx = list.findIndex(c => c.id === currentConflictId);
    if (idx > 0) {
      const prev = list[idx - 1];
      setCurrentConflictId(prev.id);
      setCandidateIndex(0);
      setReviewDecision(prev.review);
      setReviewNote('');
    }
  }, [visibleConflicts, currentConflictId]);

  const handleNextConflict = useCallback(() => {
    const list = visibleConflicts;
    const idx = list.findIndex(c => c.id === currentConflictId);
    if (idx >= 0 && idx < list.length - 1) {
      const next = list[idx + 1];
      setCurrentConflictId(next.id);
      setCandidateIndex(0);
      setReviewDecision(next.review);
      setReviewNote('');
    }
  }, [visibleConflicts, currentConflictId]);

  const handleSaveReview = async () => {
    if(!currentConflict || !compared.data || reviewBusy || !reviewLoaded)return;
    if(reviewDecision==='pending' && !reviewNote.trim()){setModal('');return;}
    if(!reviewNote.trim()){setReviewError('请填写复核依据');return;}
    const [firstDifference,...otherDifferences]=compared.data.result.annotation.differences;
    if(!firstDifference){setReviewError('当前比较没有可复核的差异');return;}
    setReviewBusy(true);setReviewError('');
    try{
      if(!pendingReview.current)pendingReview.current={client_request_id:crypto.randomUUID(),
        evidence_id:compared.data.result.evidence_id,result_id:compared.data.result.result_id,
        difference_ids:[firstDifference.difference_id,...otherDifferences.map(item=>item.difference_id)],
        reviewer:localStorage.getItem('iad.reviewer') || 'auditor_qc',comment:reviewNote.trim(),
        action:{kind:reviewDecision==='confirmed'?'CONFIRM_DIFFERENCE':reviewDecision==='rejected'?'REJECT_DIFFERENCE':'NEEDS_CONTEXT'}};
      await request('/consistency/review/submit',pendingReview.current);
      await readReview();pendingReview.current=null;setModal('');setRevision(value=>value+1);
    }catch(error){setReviewError(message(error));}finally{setReviewBusy(false);}
  };

  async function handleDeleteJob(job: ConsistencyJob) {
    await request(`/analysis/delete/${encodeURIComponent(job.analysis.run_id)}`,{});
    setBatches(previous => previous.filter(item => item.batch_id !== job.batch_id));
    setRevision(value => value + 1);
  }

  const availableTypes=useMemo(()=>[...new Set(jobConflicts.map(item=>item.type))],[jobConflicts]);
  const modelTypes=useMemo(()=>[...new Set(jobConflicts.map(item=>item.model.modelType))],[jobConflicts]);

  // Raw conflict tabs
  const conflictTabs = useMemo(() => {
    return [{ value: 'all', label: '全部冲突' }, ...availableTypes.map(t => ({ value: t, label: t }))];
  }, [availableTypes]);

  // Chart statistics
  const origStats = useMemo(() => {
    return availableTypes.map(name => ({
      name,
      count: jobConflicts.filter(c => c.type === name).length
    }));
  }, [availableTypes, jobConflicts]);

  const modelStats = useMemo(() => {
    return modelTypes.map(name => ({
      name,
      count: jobConflicts.filter(c => c.model.modelType === name).length
    }));
  }, [availableTypes, jobConflicts]);

  const agreementStats = useMemo(() => {
    const same = jobConflicts.filter(c => c.model.status === 'conflict').length;
    const different = jobConflicts.filter(c=>c.model.status==='no_conflict').length;
    return [
      { name: '一致', id: 'same', count: same },
      { name: '不一致', id: 'different', count: different }
    ];
  }, [jobConflicts]);

  const maxObserved = useMemo(() => {
    return Math.max(1, ...origStats.map(x => x.count), ...modelStats.map(x => x.count));
  }, [origStats, modelStats]);

  const distributionAxis = useMemo(() => niceAxis(maxObserved), [maxObserved]);
  const agreementAxis = useMemo(() => {
    const same = jobConflicts.filter(c => c.model.status === 'conflict').length;
    return niceAxis(Math.max(1,same,jobConflicts.filter(c=>c.model.status==='no_conflict').length));
  }, [jobConflicts]);

  const handleStatClick = useCallback(
    (action: 'stat-category' | 'stat-model' | 'stat-agreement', id: string) => {
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
    <div className="iad-workbench iad-consistency" data-page="industrial-consistency">
      <style>{workbenchStyles}</style>

      <div className="dc-root">
        {/* Header */}
        <header className="heading dc-page-heading">
          <div>
            <h1>数据一致性</h1>
          </div>
          <div className="dc-heading-actions">
            <Button
              type="button"
              variant="primary"
              data-dc="start-check"
              onClick={() => {
                setNewPrompt(DEFAULT_CONSISTENCY_PROMPT);
                setModalChildIds([...selectedChildIds]);
                          setModal('new');
              }}
            >
              新建检查
            </Button>
          </div>
        </header>

        {error && <p role="alert" className="iad-error">{error}</p>}

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
        <section className={`dc-section dc-jobs-section ${jobPages > 1 ? 'iba-job-multipage' : ''}`}>
          <div className="dc-section-heading">
            <h2>检查作业</h2>
          </div>
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
                      const isSelected = j.batch_id === selectedJob?.batch_id;
                      const childNames = (j.scopes?.subjects?.dataset_ids || [])
                        .map(id => datasets.find(d => d.dataset_id === id)?.name || id)
                        .join('、');
                      const timeStr = j.created_at ? j.created_at.slice(0, 16).replace('T', ' ') : '—';
                      const hasConflicts =
                        (j.status === 'COMPLETED' || j.status === 'PARTIAL') &&
                        typeof j.conflict_count === 'number' &&
                        j.conflict_count > 0;
                      return (
                        <tr
                          key={j.batch_id}
                          tabIndex={0}
                          data-dc-row={j.batch_id}
                          data-selected={isSelected}
                          aria-selected={isSelected}
                          onClick={() => selectJob(j.batch_id)}
                          onKeyDown={e => {
                            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();selectJob(j.batch_id);
                            }
                          }}
                        >
                          <td className="dc-mono">{j.batch_id}</td>
                          <td>
                            <JobStatusButton job={j.analysis} onClick={()=>setStatusJobId(j.batch_id)}>{dcJobBadge(j.status)}</JobStatusButton>
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
                            {j.status !== 'COMPLETED' && <IconButton icon="details" type="button" label={`查看作业状态 ${j.analysis.run_id}`} onClick={()=>setStatusJobId(j.batch_id)} />}
                            <IconButton icon="stats" type="button" title="查看统计结果" label="查看统计结果" data-dc="stats" data-id={j.batch_id} disabled={j.status !== 'COMPLETED' && j.status !== 'PARTIAL'} onClick={() => {
                                setSelectedJobId(j.batch_id);
                                setStatsModalJobId(j.batch_id);
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
              />
            </>
          ) : (
            <div className="dc-empty">当前范围还没有检查作业，可以创建新检查。</div>
          )}
        </section>

        {/* Results Section */}
        <section className="dc-section dc-results-section">
          <div className="dc-section-heading">
            <h2>标注冲突</h2>
          </div>

          {!selectedJob ? (
            <div className="dc-empty">选择上方的检查作业后查看结果。</div>
          ) : ['FAILED','CANCELLED','INTERRUPTED'].includes(selectedJob.status) ? (
            <div className="dc-empty">当前作业下没有对应的冲突</div>
          ) : selectedJob.status === 'PENDING' || selectedJob.status === 'RUNNING' ? (
            <div className="dc-running">
              <div className="dc-running-header">
                <span>{selectedJob.status === 'PENDING' ? '等待执行'
                  : selectedJob.analysis.phase === 'ANALYZING_CONFLICT_GROUPS' && selectedJob.analysis.total_gallery_groups != null
                    ? `正在核对图组 ${selectedJob.analysis.completed_gallery_groups ?? 0} / ${selectedJob.analysis.total_gallery_groups} 组`
                    : selectedJob.analysis.phase === 'ANALYZING_UNCOVERED_IMAGES' ? '正在补查图像' : '正在检查标注一致性'}</span>
              </div>
              <div className="dc-stages">
                {['准备图像', '检索图像候选', '对比标注', '发布结果'].map((stageName, idx) => {
                  const phase=selectedJob.analysis.phase;
                  const currentStage=phase==='CONSISTENCY_FINISHED' ? 3
                    : phase==='ANALYZING_CONFLICT_GROUPS'||phase==='ANALYZING_UNCOVERED_IMAGES' ? 2 : 1;
                  return (
                    <div
                      key={stageName}
                      className={`dc-stage ${
                        idx < currentStage ? 'done' : idx === currentStage ? 'current' : ''
                      }`}
                    >
                      {stageName}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Conflict Type Tabs */}
              <TabBar label="原始标注冲突类型" value={kind} onChange={value => {setKind(value); setPage(1);}}
                items={conflictTabs.map(tab => ({id: tab.value, label: <><span>{tab.label}</span><span className="iad-tab-count">{
                  tab.value === 'all' ? jobConflicts.length : jobConflicts.filter(conflict => conflict.type === tab.value).length
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
              {conflictsLoading ? (
                <div className="dc-empty">正在加载冲突图组…</div>
              ) : paginatedConflicts.length ? (
                <div className="iad-thumbnail-grid">
                  {paginatedConflicts.map(c => (
                    <ThumbnailCard key={c.id} src={c.url} label={c.filename} data-dc="open-conflict" data-id={c.id}
                      onClick={()=>openConflict(c)}><small>原始：{c.type}</small><small>模型：{c.model.modelType}</small></ThumbnailCard>
                  ))}
                </div>
              ) : (
                <div className="dc-empty">当前筛选条件下没有匹配的冲突图组。</div>
              )}

              <Pagination total={visibleConflicts.length} page={currentPage} size={18} unit="组" onPage={setPage} />
            </>
          )}
        </section>
      </div>

      {/* New Consistency Check Modal */}
      {modal === 'new' && (
        <Modal title="新建一致性检查" id="dc-new-mask" className="dc-dialog dc-new-dialog" onClose={()=>setModal('')} header={false}>
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
                {error && <p role="alert" className="iad-error">{error}</p>}
                <label htmlFor="dc-new-prompt">模型分析提示词</label>
                <textarea
                  id="dc-new-prompt"
                  rows={9}
                  spellCheck={false}
                  aria-label="模型分析提示词"
                  value={newPrompt}
                  onChange={e => setNewPrompt(e.target.value)}
                />
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
                disabled={!modalChildIds.length || !newPrompt.trim() || newCheckBusy}
                onClick={handleCreateJob}
              >
                {newCheckBusy ? '启动中…' : '开始检查'}
              </Button>
            </footer>
        </Modal>
      )}

      {/* Conflict Comparison Dialog */}
      {modal === 'compare' && currentConflict && (
        <Modal title="标注冲突对比" id="dc-compare-mask" className="dc-dialog dc-conflict-dialog" header={false} onClose={()=>setModal('')}>
            <header className="dc-dialog-head">
              <h2 id="dc-dialog-title">标注冲突对比</h2>
              <div className="dc-dialog-head-actions">
                <Button type="button" onClick={handlePrevConflict}>
                  上一组
                </Button>
                <Button type="button" onClick={handleNextConflict}>
                  下一组
                </Button>
                <IconButton icon="close" type="button" title="关闭" label="关闭" onClick={() => setModal('')} />
              </div>
            </header>
            <div className="dc-dialog-body">
              <div className="dc-compare">
                <div className="dc-compare-cell">
                  <div
                    className="dc-compare-photo"
                    role="button"
                    tabIndex={0}
                    data-dc="zoom-anchor"
                    aria-label="查看主图大图"
                    title="点击查看大图"
                    onClick={() =>
                      setZoomItem({
                        id: currentConflict.id + '_anchor',
                        title: currentConflict.filename,
                        imageUrl: currentConflict.fullUrl || currentConflict.url,
                        width: currentConflict.sourceWidth,
                        height: currentConflict.sourceHeight,
                        bboxes: anchorBboxes,
                      })
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setZoomItem({
                          id: currentConflict.id + '_anchor',
                          title: currentConflict.filename,
                          imageUrl: currentConflict.fullUrl || currentConflict.url,
                          width: currentConflict.sourceWidth,
                          height: currentConflict.sourceHeight,
                          bboxes: anchorBboxes,
                        });
                      }
                    }}
                  >
                    <AnnotatedImageStage
                      src={currentConflict.fullUrl || currentConflict.url}
                      alt="主图"
                      width={currentConflict.sourceWidth}
                      height={currentConflict.sourceHeight}
                      bboxes={anchorBboxes}
                    />
                  </div>
                  <div className="dc-photo-filename" title={currentConflict.filename}>
                    {currentConflict.filename}
                  </div>
                </div>

                <div className="dc-compare-cell">
                  <div
                    className="dc-compare-photo"
                    role="button"
                    tabIndex={0}
                    data-dc="zoom-candidate"
                    aria-label="查看候选图大图"
                    title="点击查看大图"
                    onClick={() =>
                      setZoomItem({
                        id: currentConflict.id + '_candidate_' + candidateIndex,
                        title: `${currentCandidate.filename} (候选图 ${candidateIndex + 1})`,
                        imageUrl: currentCandidate.fullUrl,
                        width: currentCandidate.width,
                        height: currentCandidate.height,
                        bboxes: candidateBboxes,
                      })
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setZoomItem({
                          id: currentConflict.id + '_candidate_' + candidateIndex,
                          title: `${currentCandidate.filename} (候选图 ${candidateIndex + 1})`,
                          imageUrl: currentCandidate.fullUrl,
                          width: currentCandidate.width,
                          height: currentCandidate.height,
                          bboxes: candidateBboxes,
                        });
                      }
                    }}
                  >
                    {selectedMember && <AnnotatedImageStage
                      src={currentCandidate.fullUrl || currentCandidate.thumbUrl}
                      alt="候选图"
                      width={currentCandidate.width}
                      height={currentCandidate.height}
                      bboxes={candidateBboxes}
                    />}
                  </div>
                  <div className="dc-photo-filename" title={currentCandidate.filename}>
                    {currentCandidate.filename}
                  </div>
                </div>
              </div>

              {/* Candidate strip */}
              <div className="iad-thumbnail-strip" aria-label="切换冲突图像">
                {conflictMembers.map((m, i) => {
                    const s = m.image.sample;
                    const thumb = ConsistencyView.media(m.image,true);
                    return (
                      <ThumbnailCard key={s.sample_id || i} src={thumb} label={`候选 ${i+1}`} data-dc="candidate" data-id={i}
                        aria-pressed={i===candidateIndex} onClick={()=>setCandidateIndex(i)} />
                    );
                })}
              </div>
              {membersError && <p role="alert" className="iad-error">{membersError}</p>}
              {compared.error && <p role="alert" className="iad-error">{compared.error}</p>}

              {/* 判定结论 */}
              <section className="dc-fact-panel" aria-label="判定结论">
                <h3>判定结论</h3>
                <span className="dc-verdict-value">{currentConflict.type}</span>
                <p className="dc-verdict-description">{compared.data?annotationSummary(compared.data.result.annotation):compared.error || '正在读取冻结比较记录…'}</p>
              </section>

              {/* 模型分析 */}
              <section className="dc-model-panel" aria-label="模型分析">
                <h3>模型分析</h3>
                <p>{groupAnalysis.error || groupAnalysis.analysis?.error || groupAnalysis.analysis?.result?.conclusions.map(item=>item.text).join('\n') || '暂无已保存的模型分析结果。'}</p>
              </section>

              {/* 模型结论 */}
              <section className="dc-conclusion-panel" aria-label="模型结论">
                <h3>模型结论</h3>
                <span className="dc-verdict-value">{groupAnalysis.analysis?.result?.overall.text || currentConflict.model.modelType}</span>
                <p className="dc-verdict-description">{groupAnalysis.analysis?.result?.overall.text || groupAnalysis.error || groupAnalysis.analysis?.error || '暂无已保存的模型结论。'}</p>
              </section>

              {/* Human review panel */}
              <section className="dc-review-panel" aria-label="人工复核">
                <h3>人工复核</h3>
                <div className="dc-decision-controls">
                  <label>
                    <input
                      type="radio"
                      disabled={reviewBusy || !reviewLoaded || !!pendingReview.current}
                      name="dc-review"
                      value="pending"
                      checked={reviewDecision === 'pending'}
                      onChange={() => setReviewDecision('pending')}
                    />
                    待确认
                  </label>
                  <label>
                    <input
                      type="radio"
                      disabled={reviewBusy || !reviewLoaded || !!pendingReview.current}
                      name="dc-review"
                      value="confirmed"
                      checked={reviewDecision === 'confirmed'}
                      onChange={() => setReviewDecision('confirmed')}
                    />
                    确认冲突
                  </label>
                  <label>
                    <input
                      type="radio"
                      disabled={reviewBusy || !reviewLoaded || !!pendingReview.current}
                      name="dc-review"
                      value="rejected"
                      checked={reviewDecision === 'rejected'}
                      onChange={() => setReviewDecision('rejected')}
                    />
                    排除冲突
                  </label>
                </div>
                {reviewError && <p role="alert" className="iad-error">{reviewError}</p>}
                <textarea
                  disabled={reviewBusy || !reviewLoaded || !!pendingReview.current}
                  className="dc-note"
                  id="dc-note"
                  placeholder="复核说明（可选）"
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                />
              </section>
            </div>
            <footer className="dc-dialog-footer">
              <Button type="button" onClick={() => setModal('')}>
                取消
              </Button>
              <Button variant="primary" type="button" disabled={reviewBusy || !reviewLoaded || !compared.data} onClick={handleSaveReview}>
                保存复核
              </Button>
            </footer>
        </Modal>
      )}

      {/* Statistics dialog */}
      {!!statsModalJobId && (
        <Modal title="标注冲突统计" size="form" className="dc-stats-dialog" onClose={()=>setStatsModalJobId('')}>
            <div className="dc-stats-content">
              <div className="dc-stats-charts">
                {/* 1. 原始差异类型 */}
                {(() => {
                  const ticks = [distributionAxis, distributionAxis * 0.75, distributionAxis * 0.5, distributionAxis * 0.25, 0].map(v => Math.round(v));
                  return (
                    <section className="dc-vchart-panel" aria-label="原始差异类型柱状图">
                      <h3>原始差异类型</h3>
                      <div className="dc-vchart-body">
                        <div className="dc-vchart-axis" aria-hidden="true">
                          {ticks.map((n, i) => (
                            <span key={i}>{n}</span>
                          ))}
                        </div>
                        <div className="dc-vchart-figure">
                          <div className="dc-vchart-lines" aria-hidden="true" />
                          <div className="dc-vchart-columns" style={{ ['--chart-cols' as any]: origStats.length }}>
                            {origStats.map(row => {
                              const height = (100 * row.count) / distributionAxis;
                              return (
                                <div className="dc-vchart-column" key={row.name}>
                                  <div className="dc-vchart-barslot">
                                    <button
                                      type="button"
                                      className={`dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`}
                                      style={{ height: `${Math.max(0.6, height)}%` }}
                                      data-dc="stat-category"
                                      data-id={row.name}
                                      aria-label={`${row.name} ${row.count} 组，点击查看`}
                                      title={`${row.name}：${row.count} 组，点击筛选`}
                                      onClick={() => handleStatClick('stat-category', row.name)}
                                    >
                                      <span className="dc-vchart-value">{row.count}</span>
                                    </button>
                                  </div>
                                  <span className="dc-vchart-label" title={row.name}>{row.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })()}

                {/* 2. 模型判断 */}
                {(() => {
                  const ticks = [distributionAxis, distributionAxis * 0.75, distributionAxis * 0.5, distributionAxis * 0.25, 0].map(v => Math.round(v));
                  return (
                    <section className="dc-vchart-panel" aria-label="模型判断柱状图">
                      <h3>模型判断</h3>
                      <div className="dc-vchart-body">
                        <div className="dc-vchart-axis" aria-hidden="true">
                          {ticks.map((n, i) => (
                            <span key={i}>{n}</span>
                          ))}
                        </div>
                        <div className="dc-vchart-figure">
                          <div className="dc-vchart-lines" aria-hidden="true" />
                          <div className="dc-vchart-columns" style={{ ['--chart-cols' as any]: modelStats.length }}>
                            {modelStats.map(row => {
                              const height = (100 * row.count) / distributionAxis;
                              return (
                                <div className="dc-vchart-column" key={row.name}>
                                  <div className="dc-vchart-barslot">
                                    <button
                                      type="button"
                                      className={`dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`}
                                      style={{ height: `${Math.max(0.6, height)}%` }}
                                      data-dc="stat-model"
                                      data-id={row.name}
                                      aria-label={`${row.name} ${row.count} 组，点击查看`}
                                      title={`${row.name}：${row.count} 组，点击筛选`}
                                      onClick={() => handleStatClick('stat-model', row.name)}
                                    >
                                      <span className="dc-vchart-value">{row.count}</span>
                                    </button>
                                  </div>
                                  <span className="dc-vchart-label" title={row.name}>{row.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })()}

                {/* 3. 结论一致性 */}
                {(() => {
                  const ticks = [agreementAxis, agreementAxis * 0.75, agreementAxis * 0.5, agreementAxis * 0.25, 0].map(v => Math.round(v));
                  return (
                    <section className="dc-vchart-panel dc-vchart-agreement" aria-label="结论一致性柱状图">
                      <h3>结论一致性</h3>
                      <div className="dc-vchart-body">
                        <div className="dc-vchart-axis" aria-hidden="true">
                          {ticks.map((n, i) => (
                            <span key={i}>{n}</span>
                          ))}
                        </div>
                        <div className="dc-vchart-figure">
                          <div className="dc-vchart-lines" aria-hidden="true" />
                          <div className="dc-vchart-columns" style={{ ['--chart-cols' as any]: agreementStats.length }}>
                            {agreementStats.map(row => {
                              const height = (100 * row.count) / agreementAxis;
                              return (
                                <div className="dc-vchart-column" key={row.id}>
                                  <div className="dc-vchart-barslot">
                                    <button
                                      type="button"
                                      className={`dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`}
                                      style={{ height: `${Math.max(0.6, height)}%` }}
                                      data-dc="stat-agreement"
                                      data-id={row.id}
                                      aria-label={`${row.name} ${row.count} 组，点击查看`}
                                      title={`${row.name}：${row.count} 组，点击筛选`}
                                      onClick={() => handleStatClick('stat-agreement', row.id)}
                                    >
                                      <span className="dc-vchart-value">{row.count}</span>
                                    </button>
                                  </div>
                                  <span className="dc-vchart-label" title={row.name}>{row.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })()}
              </div>
            </div>
        </Modal>
      )}

      {statusJobId && batches.some(job=>job.batch_id===statusJobId) && <JobStatusDrawer
        job={batches.find(job=>job.batch_id===statusJobId)!.analysis} onClose={()=>setStatusJobId('')} onChanged={()=>setRevision(value=>value+1)} />}
      {/* Fullscreen Image Viewer Modal */}
      <FullscreenViewer
        open={!!zoomItem}
        item={zoomItem}
        onClose={() => setZoomItem(null)}
      />
    </div>
  );
}
