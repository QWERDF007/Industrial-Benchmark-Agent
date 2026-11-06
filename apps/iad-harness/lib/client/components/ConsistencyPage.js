import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MultiSelect, Select } from './Select.js';
import { Modal } from './Modal.js';
import { JobStatusDrawer, JobStatusButton, JobStatusAction } from './JobStatusDrawer.js';
import { TabBar } from './layout/TabBar.js';
import { Button } from './Button.js';
import { ThumbnailCard } from "./ThumbnailCard.js";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnnotatedImageStage } from './AnnotatedImageStage.js';
import { buildHierarchyGroups, getDatasetGroupId } from '../dataset-hierarchy.js';
import { IconButton } from './IconButton.js';
import { DeleteAction } from './DeleteAction.js';
import { FullscreenViewer } from './FullscreenViewer.js';
import { ConsistencyEvidencePage } from './ConsistencyEvidencePage.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { Pagination, IBA_JOBS_PAGE_SIZE } from './Pagination.js';
import { useWorkspace } from '../workspace.js';
import { message, request } from '../api.js';
import { workbenchStyles } from '../styles.js';
import { ClearFilterButton } from './CommonFilterControls.js';
import { promptDefaults } from '../../shared/prompt-defaults.generated.js';
import { ConsistencyView } from '../consistency-view.js';
import { useGroupAnalysis } from '../useGroupAnalysis.js';
import { useQueries } from '@tanstack/react-query';
import { queryClient } from '../query-client.js';
import { useJobs } from '../useJobs.js';
import { useResource } from '../useResource.js';
import { useDatasetCatalog } from '../useDatasetCatalog.js';
import { annotationSummary } from '../../shared/consistency-presentation.js';
function dcJobBadge(status) {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED')
        return _jsx("span", { className: "dc-state exp-pill ok", children: "\u5DF2\u5B8C\u6210" });
    if (s === 'PARTIAL')
        return _jsx("span", { className: "dc-state exp-pill ok", children: "\u90E8\u5206\u5B8C\u6210" });
    if (s === 'RUNNING')
        return _jsx("span", { className: "dc-state exp-pill running", children: "\u8FD0\u884C\u4E2D" });
    if (s === 'PENDING')
        return _jsx("span", { className: "dc-state exp-pill pending", children: "\u6392\u961F\u4E2D" });
    return _jsx("span", { className: "dc-state exp-pill fail", children: "\u5931\u8D25" });
}
// The job-list count is the unfiltered, raw conflict group count for that job.
// Do not substitute the currently filtered grid count or model-confirmed count.
const dcJobConflictTotal = (j) => (j.status === 'COMPLETED' || j.status === 'PARTIAL') &&
    typeof j.conflict_count === 'number' &&
    Number.isFinite(j.conflict_count) &&
    j.conflict_count >= 0
    ? String(j.conflict_count)
    : '—';
// Actual duration persisted by the job API (duration_seconds), not inferred from submission time.
const dcJobElapsed = (j) => {
    const sec = j.duration_seconds;
    if (typeof sec !== 'number' || !Number.isFinite(sec) || sec < 0)
        return '—';
    const m = Math.floor(sec / 60);
    const r = Math.round(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};
function niceAxis(max) {
    const target = max / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(target, 1))));
    const normalized = target / magnitude;
    const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude;
    return Math.max(step * 4, Math.ceil(max / step) * step);
}
export const DEFAULT_CONSISTENCY_PROMPT = promptDefaults.consistency;
export function ConsistencyPage() {
    const { state } = useWorkspace();
    const catalog = useDatasetCatalog();
    const evidenceId = state.consistency.evidenceId;
    const [visited, setVisited] = useState(!evidenceId);
    useEffect(() => {
        if (!evidenceId)
            setVisited(true);
    }, [evidenceId]);
    return (_jsxs(_Fragment, { children: [visited && (_jsx("div", { hidden: !!evidenceId, style: { height: '100%' }, children: catalog.data ? _jsx(ConsistencyIntegratedWorkspace, { ...catalog.data }) :
                    _jsxs("div", { className: "iad-workbench", "data-page": "industrial-consistency", children: [_jsx("style", { children: workbenchStyles }), _jsx("h1", { children: "\u6570\u636E\u4E00\u81F4\u6027" }), _jsx("p", { role: catalog.error ? 'alert' : 'status', children: catalog.error || '正在加载数据集…' })] }) })), evidenceId && _jsx(ConsistencyEvidencePage, { evidenceId: evidenceId })] }));
}
function ConsistencyIntegratedWorkspace({ datasets, groups }) {
    const initialParent = buildHierarchyGroups(datasets, groups)[0]?.group_id || '';
    const [selectedParentId, setSelectedParentId] = useState(initialParent);
    const [selectedChildIds, setSelectedChildIds] = useState(() => datasets.filter(item => getDatasetGroupId(item) === initialParent).map(item => item.dataset_id));
    const [error, setError] = useState('');
    // Consistency jobs state
    const [statusJobId, setStatusJobId] = useState('');
    const [selectedJobId, setSelectedJobId] = useState('');
    const [jobPage, setJobPage] = useState(1);
    const [revision, setRevision] = useState(0);
    // Conflicts list and filter state
    const [jobConflicts, setJobConflicts] = useState([]);
    const [conflictsLoading, setConflictsLoading] = useState(false);
    const [kind, setKind] = useState('all');
    const [modelFilter, setModelFilter] = useState('all');
    const [agreement, setAgreement] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [reviewFilter, setReviewFilter] = useState('all');
    // Modals state
    const [modal, setModal] = useState('');
    const [modalChildIds, setModalChildIds] = useState([]);
    const [newCheckBusy, setNewCheckBusy] = useState(false);
    const newSubmission = useRef(null);
    const [newPrompt, setNewPrompt] = useState(DEFAULT_CONSISTENCY_PROMPT);
    const [currentConflictId, setCurrentConflictId] = useState('');
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [activeQueryId, setActiveQueryId] = useState('');
    const [conflictMembers, setConflictMembers] = useState([]);
    const [membersError, setMembersError] = useState('');
    const [reviewBusy, setReviewBusy] = useState(false);
    const [reviewLoaded, setReviewLoaded] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const pendingReview = useRef(null);
    const [reviewDecision, setReviewDecision] = useState('pending');
    const [reviewNote, setReviewNote] = useState('');
    const [statsModalJobId, setStatsModalJobId] = useState('');
    const [zoomItem, setZoomItem] = useState(null);
    // Derive hierarchy groups
    const hierarchyGroups = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
    const currentParent = useMemo(() => hierarchyGroups.find(g => g.group_id === selectedParentId) || hierarchyGroups[0], [hierarchyGroups, selectedParentId]);
    const currentChildDatasets = useMemo(() => datasets.filter(d => getDatasetGroupId(d) === currentParent?.group_id), [datasets, hierarchyGroups, currentParent]);
    const progress = useCallback(() => setRevision(value => value + 1), []);
    const polling = useJobs('consistency', selectedChildIds, progress);
    const roots = polling.jobs.filter(job => job.program_batch_id);
    const programIds = [...new Set(roots.map(job => job.program_batch_id))].sort();
    const programs = useQueries({ queries: programIds.map(id => ({ queryKey: ['iad', 'resource', `/consistency/runs/${id}`],
            queryFn: () => request(`/consistency/runs/${encodeURIComponent(id)}`), staleTime: Infinity, })) }, queryClient);
    const batches = roots.flatMap(job => {
        const program = programs.find(item => item.data?.batch_id === job.program_batch_id)?.data;
        return program ? [{ ...program, analysis: job, status: job.status, total: job.total_samples, completed: job.completed,
                failed: job.failed, unprocessed: job.unprocessed, cancel_requested: job.cancel_requested, created_at: job.submitted_at,
                duration_seconds: job.finished_at && job.started_at ? Math.max(0, Math.round((Date.parse(job.finished_at) - Date.parse(job.started_at)) / 1000)) : null }] : [];
    });
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
        return availableJobs.slice((currentJobPage - 1) * IBA_JOBS_PAGE_SIZE, currentJobPage * IBA_JOBS_PAGE_SIZE);
    }, [availableJobs, currentJobPage]);
    // Selected job
    const selectedJob = useMemo(() => {
        if (!shownJobs.length)
            return null;
        if (selectedJobId) {
            const match = shownJobs.find(j => j.batch_id === selectedJobId);
            if (match)
                return match;
        }
        const withResults = shownJobs.find(j => (j.status === 'COMPLETED' || j.status === 'PARTIAL') && (j.pair_count || 0) > 0);
        if (withResults)
            return withResults;
        const completed = shownJobs.find(j => j.status === 'COMPLETED' || j.status === 'PARTIAL');
        if (completed)
            return completed;
        return shownJobs[0] || null;
    }, [shownJobs, selectedJobId]);
    const handleJobPageChange = (newPage) => {
        const targetPage = Math.max(1, Math.min(jobPages, newPage));
        setJobPage(targetPage);
        const firstJobOnPage = availableJobs[(targetPage - 1) * IBA_JOBS_PAGE_SIZE];
        if (firstJobOnPage) {
            setSelectedJobId(firstJobOnPage.batch_id);
        }
        setPage(1);
    };
    useEffect(() => {
        const controller = new AbortController();
        setJobConflicts([]);
        setActiveQueryId('');
        setError('');
        if (!selectedJob || !['COMPLETED', 'PARTIAL'].includes(selectedJob.status))
            return;
        setConflictsLoading(true);
        ConsistencyView.load(selectedJob.batch_id, controller.signal)
            .then(value => { if (!controller.signal.aborted) {
            setJobConflicts(value.items);
            setActiveQueryId(value.queryId);
        } })
            .catch(error => { if (!controller.signal.aborted)
            setError(message(error)); })
            .finally(() => { if (!controller.signal.aborted)
            setConflictsLoading(false); });
        return () => controller.abort();
    }, [selectedJob?.batch_id, selectedJob?.status, revision]);
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
    const handleParentChange = useCallback((newParentId) => {
        setSelectedParentId(newParentId);
        const newChildren = datasets.filter(d => getDatasetGroupId(d) === newParentId);
        setSelectedChildIds(newChildren.map(c => c.dataset_id));
        setSelectedJobId('');
        setJobPage(1);
        setKind('all');
        setModelFilter('all');
        setAgreement('all');
        setSearch('');
        setPage(1);
        setStatsModalJobId('');
    }, [datasets, hierarchyGroups]);
    // Child dataset toggle handler
    const handleChildToggle = useCallback((childId) => {
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
    const selectJob = useCallback((batchId) => {
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
        polling.refresh();
        programs.forEach(program => void program.refetch({ cancelRefetch: false }));
        setRevision(v => v + 1);
    }, [polling.refresh, programs]);
    // Start new consistency check
    const handleCreateJob = async () => {
        if (!modalChildIds.length || !newPrompt.trim() || newCheckBusy)
            return;
        setNewCheckBusy(true);
        setError('');
        try {
            const key = JSON.stringify([modalChildIds, newPrompt]);
            if (newSubmission.current?.key !== key)
                newSubmission.current = { key, id: crypto.randomUUID() };
            await request('/analysis/start', { submission_id: newSubmission.current.id, analysis_kind: 'consistency',
                dataset_ids: modalChildIds, instruction: newPrompt.trim() });
            newSubmission.current = null;
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
        }
        catch (err) {
            setError(message(err));
        }
        finally {
            setNewCheckBusy(false);
        }
    };
    // Open conflict comparison modal
    const openConflict = useCallback((c) => {
        setCurrentConflictId(c.id);
        setCandidateIndex(0);
        setReviewDecision(c.review);
        setReviewNote('');
        setModal('compare');
    }, []);
    const currentConflict = useMemo(() => jobConflicts.find(c => c.id === currentConflictId) || null, [jobConflicts, currentConflictId]);
    const groupReference = useMemo(() => modal === 'compare' && currentConflict && activeQueryId ? {
        query_id: activeQueryId, kind: 'conflicts', group_id: currentConflict.rawItem.group_id, facts_state: currentConflict.rawItem.facts_state
    } : null, [modal, currentConflict?.id, activeQueryId]);
    const groupAnalysis = useGroupAnalysis(groupReference);
    useEffect(() => {
        const controller = new AbortController();
        setConflictMembers([]);
        setMembersError('');
        setCandidateIndex(0);
        if (!groupReference)
            return;
        ConsistencyView.members(groupReference, controller.signal)
            .then(items => { if (!controller.signal.aborted)
            setConflictMembers(items); })
            .catch(error => { if (!controller.signal.aborted)
            setMembersError(message(error)); });
        return () => controller.abort();
    }, [JSON.stringify(groupReference)]);
    const selectedMember = conflictMembers[candidateIndex] || null;
    const currentCandidate = useMemo(() => {
        const image = selectedMember?.image;
        return { sampleId: image?.sample.sample_id || '', filename: image?.sample.relative_path.split('/').pop() || '',
            thumbUrl: image ? ConsistencyView.media(image, true) : '', fullUrl: image ? ConsistencyView.media(image) : '',
            width: image?.sample.width, height: image?.sample.height };
    }, [selectedMember]);
    const compared = useResource(modal === 'compare' && selectedMember?.comparison ?
        `/consistency/evidence/${encodeURIComponent(selectedMember.comparison.evidence_id)}` : null);
    const anchorSide = selectedMember?.comparison?.anchor_side;
    const anchorSource = anchorSide ? compared.data?.sources[anchorSide] : null;
    const candidateSource = anchorSide ? compared.data?.sources[anchorSide === 'left' ? 'right' : 'left'] : null;
    const anchorBboxes = anchorSource?.annotations.annotations.filter(annotation => annotation.bbox && annotation.geometry_status !== 'INVALID') || [];
    const candidateBboxes = candidateSource?.annotations.annotations.filter(annotation => annotation.bbox && annotation.geometry_status !== 'INVALID') || [];
    const readReview = useCallback(async (signal) => {
        if (!selectedMember?.comparison)
            return;
        const context = await request('/consistency/review/context', { evidence_id: selectedMember.comparison.evidence_id }, undefined, signal);
        if (signal?.aborted)
            return;
        const latest = context.decisions.at(-1), action = latest?.request.action.kind;
        const decision = action === 'CONFIRM_DIFFERENCE' ? 'confirmed' : action === 'REJECT_DIFFERENCE' ? 'rejected' : 'pending';
        setReviewDecision(decision);
        setReviewNote(latest?.request.comment || '');
        setReviewLoaded(true);
    }, [selectedMember?.comparison?.evidence_id, currentConflict?.id]);
    useEffect(() => {
        const controller = new AbortController();
        setReviewLoaded(false);
        setReviewError('');
        setReviewDecision('pending');
        setReviewNote('');
        pendingReview.current = null;
        void readReview(controller.signal).catch(error => { if (!controller.signal.aborted)
            setReviewError(message(error)); });
        return () => controller.abort();
    }, [readReview]);
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
        if (!currentConflict || !compared.data || reviewBusy || !reviewLoaded)
            return;
        if (reviewDecision === 'pending' && !reviewNote.trim()) {
            setModal('');
            return;
        }
        if (!reviewNote.trim()) {
            setReviewError('请填写复核依据');
            return;
        }
        const [firstDifference, ...otherDifferences] = compared.data.result.annotation.differences;
        if (!firstDifference) {
            setReviewError('当前比较没有可复核的差异');
            return;
        }
        setReviewBusy(true);
        setReviewError('');
        try {
            if (!pendingReview.current)
                pendingReview.current = { client_request_id: crypto.randomUUID(),
                    evidence_id: compared.data.result.evidence_id, result_id: compared.data.result.result_id,
                    difference_ids: [firstDifference.difference_id, ...otherDifferences.map(item => item.difference_id)],
                    reviewer: localStorage.getItem('iad.reviewer') || 'auditor_qc', comment: reviewNote.trim(),
                    action: { kind: reviewDecision === 'confirmed' ? 'CONFIRM_DIFFERENCE' : reviewDecision === 'rejected' ? 'REJECT_DIFFERENCE' : 'NEEDS_CONTEXT' } };
            await request('/consistency/review/submit', pendingReview.current);
            await readReview();
            pendingReview.current = null;
            setModal('');
            setRevision(value => value + 1);
        }
        catch (error) {
            setReviewError(message(error));
        }
        finally {
            setReviewBusy(false);
        }
    };
    async function handleDeleteJob(job) {
        await request(`/analysis/delete/${encodeURIComponent(job.analysis.run_id)}`, {});
        setRevision(value => value + 1);
    }
    const availableTypes = useMemo(() => [...new Set(jobConflicts.map(item => item.type))], [jobConflicts]);
    const modelTypes = useMemo(() => [...new Set(jobConflicts.map(item => item.model.modelType))], [jobConflicts]);
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
        const different = jobConflicts.filter(c => c.model.status === 'no_conflict').length;
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
        return niceAxis(Math.max(1, same, jobConflicts.filter(c => c.model.status === 'no_conflict').length));
    }, [jobConflicts]);
    const handleStatClick = useCallback((action, id) => {
        if (action === 'stat-category') {
            setKind(id);
            setModelFilter('all');
            setAgreement('all');
            setReviewFilter('all');
            setPage(1);
            setStatsModalJobId('');
        }
        else if (action === 'stat-model') {
            setModelFilter(id);
            setKind('all');
            setAgreement('all');
            setReviewFilter('all');
            setPage(1);
            setStatsModalJobId('');
        }
        else if (action === 'stat-agreement') {
            setAgreement(id);
            setKind('all');
            setModelFilter('all');
            setReviewFilter('all');
            setPage(1);
            setStatsModalJobId('');
        }
        setTimeout(() => {
            const el = document.querySelector('.dc-results-section');
            if (el)
                el.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    }, []);
    return (_jsxs("div", { className: "iad-workbench iad-consistency", "data-page": "industrial-consistency", children: [_jsx("style", { children: workbenchStyles }), _jsxs("div", { className: "dc-root", children: [_jsxs("header", { className: "heading dc-page-heading", children: [_jsx("div", { children: _jsx("h1", { children: "\u6570\u636E\u4E00\u81F4\u6027" }) }), _jsx("div", { className: "dc-heading-actions", children: _jsx(Button, { type: "button", variant: "primary", "data-dc": "start-check", onClick: () => {
                                        setNewPrompt(DEFAULT_CONSISTENCY_PROMPT);
                                        setModalChildIds([...selectedChildIds]);
                                        setModal('new');
                                    }, children: "\u65B0\u5EFA\u68C0\u67E5" }) })] }), (error || polling.error || programs.some(program => program.error)) && _jsx("p", { role: "alert", className: "iad-error", children: error || polling.error || message(programs.find(program => program.error)?.error) }), _jsx(DatasetScopeSelector, { className: "dc-scope", groups: hierarchyGroups, selectedGroupId: selectedParentId, onGroupChange: handleParentChange, childDatasets: currentChildDatasets, selectedChildIds: selectedChildIds, onChildToggle: handleChildToggle, groupId: "dc-parent", childId: "dc-child-trigger", childMenuId: "dc-child-options", children: _jsx(IconButton, { icon: "refresh", type: "button", title: "\u5237\u65B0\u68C0\u67E5\u4F5C\u4E1A", label: "\u5237\u65B0\u68C0\u67E5\u4F5C\u4E1A", onClick: handleRefresh }) }), _jsxs("section", { className: `dc-section dc-jobs-section ${jobPages > 1 ? 'iba-job-multipage' : ''}`, children: [_jsx("div", { className: "dc-section-heading", children: _jsx("h2", { children: "\u68C0\u67E5\u4F5C\u4E1A" }) }), availableJobs.length ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "dc-table-panel", children: _jsxs("table", { className: "dc-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4F5C\u4E1A" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u68C0\u67E5\u8303\u56F4" }), _jsx("th", { children: "\u51B2\u7A81\u603B\u6570" }), _jsx("th", { children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { children: "\u8017\u65F6" }), _jsx("th", { className: "dc-operations", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: shownJobs.map(j => {
                                                        const isSelected = j.batch_id === selectedJob?.batch_id;
                                                        const childNames = (j.scopes?.subjects?.dataset_ids || [])
                                                            .map(id => datasets.find(d => d.dataset_id === id)?.name || id)
                                                            .join('、');
                                                        const timeStr = j.created_at ? j.created_at.slice(0, 16).replace('T', ' ') : '—';
                                                        const hasConflicts = (j.status === 'COMPLETED' || j.status === 'PARTIAL') &&
                                                            typeof j.conflict_count === 'number' &&
                                                            j.conflict_count > 0;
                                                        return (_jsxs("tr", { tabIndex: 0, "data-dc-row": j.batch_id, "data-selected": isSelected, "aria-selected": isSelected, onClick: () => selectJob(j.batch_id), onKeyDown: e => {
                                                                if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                                                                    e.preventDefault();
                                                                    selectJob(j.batch_id);
                                                                }
                                                            }, children: [_jsx("td", { className: "dc-mono", children: j.batch_id }), _jsx("td", { children: _jsx(JobStatusButton, { job: j.analysis, onClick: () => setStatusJobId(j.batch_id), children: dcJobBadge(j.status) }) }), _jsx("td", { className: "dc-job-datasets", title: childNames, children: childNames || '全部' }), _jsx("td", { className: `dc-total ${hasConflicts ? 'dc-has-conflicts' : ''}`, title: "\u539F\u59CB\u68C0\u67E5\u68C0\u6D4B\u51FA\u7684\u51B2\u7A81\u56FE\u7EC4\u6570", children: dcJobConflictTotal(j) }), _jsx("td", { className: "dc-time", children: timeStr }), _jsx("td", { className: "dc-elapsed dc-mono", children: dcJobElapsed(j) }), _jsxs("td", { className: "dc-operations", onClick: e => e.stopPropagation(), children: [_jsx(JobStatusAction, { job: j.analysis, onClick: () => setStatusJobId(j.batch_id) }), _jsx(IconButton, { icon: "stats", type: "button", title: "\u67E5\u770B\u7EDF\u8BA1\u7ED3\u679C", label: "\u67E5\u770B\u7EDF\u8BA1\u7ED3\u679C", "data-dc": "stats", "data-id": j.batch_id, disabled: j.status !== 'COMPLETED' && j.status !== 'PARTIAL', onClick: () => {
                                                                                setSelectedJobId(j.batch_id);
                                                                                setStatsModalJobId(j.batch_id);
                                                                            } }), _jsx(DeleteAction, { title: "\u5220\u9664\u68C0\u67E5\u4F5C\u4E1A", name: j.batch_id, onDelete: () => handleDeleteJob(j), restoreFocus: () => document.getElementById('dc-parent') })] })] }, j.batch_id));
                                                    }) })] }) }), _jsx(Pagination, { total: availableJobs.length, page: currentJobPage, onPage: handleJobPageChange, label: "\u68C0\u67E5\u4F5C\u4E1A", size: IBA_JOBS_PAGE_SIZE })] })) : (_jsx("div", { className: "dc-empty", children: polling.loading || programs.some(program => program.isPending) ? '正在读取检查作业…' : '当前范围还没有检查作业，可以创建新检查。' }))] }), _jsxs("section", { className: "dc-section dc-results-section", children: [!selectedJob || !['FAILED', 'CANCELLED', 'INTERRUPTED'].includes(selectedJob.status) ? _jsx("div", { className: "dc-section-heading", children: _jsx("h2", { children: "\u6807\u6CE8\u51B2\u7A81" }) }) : null, !selectedJob ? (_jsx("div", { className: "dc-empty", children: "\u9009\u62E9\u4E0A\u65B9\u7684\u68C0\u67E5\u4F5C\u4E1A\u540E\u67E5\u770B\u7ED3\u679C\u3002" })) : ['FAILED', 'CANCELLED', 'INTERRUPTED'].includes(selectedJob.status) ? (_jsx("p", { className: "iad-plain-empty", role: "status", children: "\u5F53\u524D\u4F5C\u4E1A\u4E0B\u6CA1\u6709\u5BF9\u5E94\u7684\u51B2\u7A81" })) : selectedJob.status === 'PENDING' || selectedJob.status === 'RUNNING' ? (_jsxs("div", { className: "dc-running", children: [_jsx("div", { className: "dc-running-header", children: _jsx("span", { children: selectedJob.status === 'PENDING' ? '等待执行'
                                                : selectedJob.analysis.phase === 'ANALYZING_CONFLICT_GROUPS' && selectedJob.analysis.total_gallery_groups != null
                                                    ? `正在核对图组 ${selectedJob.analysis.completed_gallery_groups ?? 0} / ${selectedJob.analysis.total_gallery_groups} 组`
                                                    : selectedJob.analysis.phase === 'ANALYZING_UNCOVERED_IMAGES' ? '正在补查图像' : '正在检查标注一致性' }) }), _jsx("div", { className: "dc-stages", children: ['准备图像', '检索图像候选', '对比标注', '发布结果'].map((stageName, idx) => {
                                            const phase = selectedJob.analysis.phase;
                                            const currentStage = phase === 'CONSISTENCY_FINISHED' ? 3
                                                : phase === 'ANALYZING_CONFLICT_GROUPS' || phase === 'ANALYZING_UNCOVERED_IMAGES' ? 2 : 1;
                                            return (_jsx("div", { className: `dc-stage ${idx < currentStage ? 'done' : idx === currentStage ? 'current' : ''}`, children: stageName }, stageName));
                                        }) })] })) : (_jsxs(_Fragment, { children: [_jsx(TabBar, { label: "\u539F\u59CB\u6807\u6CE8\u51B2\u7A81\u7C7B\u578B", value: kind, onChange: value => { setKind(value); setPage(1); }, items: conflictTabs.map(tab => ({ id: tab.value, label: _jsxs(_Fragment, { children: [_jsx("span", { children: tab.label }), _jsx("span", { className: "iad-tab-count", children: tab.value === 'all' ? jobConflicts.length : jobConflicts.filter(conflict => conflict.type === tab.value).length })] }), buttonProps: { 'data-dc': 'raw-tab', 'data-id': tab.value } })) }), _jsxs("div", { className: "dc-refined-filterbar", role: "group", "aria-label": "\u51B2\u7A81\u7B5B\u9009", children: [_jsxs("label", { className: "dc-filter-field dc-search-field", children: ["\u6587\u4EF6\u540D\u641C\u7D22", _jsx("input", { type: "search", id: "dc-filename-search", "aria-label": "\u6587\u4EF6\u540D\u641C\u7D22", placeholder: "\u641C\u7D22\u6587\u4EF6\u540D", autoComplete: "off", style: { height: '38px', minHeight: '38px', maxHeight: '38px', boxSizing: 'border-box' }, value: search, onChange: e => {
                                                            setSearch(e.target.value);
                                                            setPage(1);
                                                        } })] }), _jsxs("label", { className: "dc-filter-field", children: ["\u6A21\u578B\u5224\u65AD", _jsxs(Select, { id: "dc-model-filter", "aria-label": "\u6A21\u578B\u5224\u65AD", value: modelFilter, onChange: e => {
                                                            setModelFilter(e.target.value);
                                                            setPage(1);
                                                        }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u5224\u65AD" }), modelTypes.map(name => (_jsx("option", { value: name, children: name }, name)))] })] }), _jsxs("label", { className: "dc-filter-field", children: ["\u7ED3\u8BBA\u4E00\u81F4\u6027", _jsxs(Select, { id: "dc-agreement", "aria-label": "\u539F\u7ED3\u8BBA\u4E0E\u6A21\u578B\u5224\u5B9A\u4E00\u81F4\u6027", value: agreement, onChange: e => {
                                                            setAgreement(e.target.value);
                                                            setPage(1);
                                                        }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8" }), _jsx("option", { value: "same", children: "\u4E00\u81F4" }), _jsx("option", { value: "different", children: "\u4E0D\u4E00\u81F4" })] })] }), _jsxs("label", { className: "dc-filter-field dc-review-field", children: ["\u4EBA\u5DE5\u590D\u6838", _jsxs(Select, { id: "dc-review-filter", "aria-label": "\u4EBA\u5DE5\u590D\u6838", value: reviewFilter, onChange: e => {
                                                            setReviewFilter(e.target.value);
                                                            setPage(1);
                                                        }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u72B6\u6001" }), _jsx("option", { value: "pending", children: "\u5F85\u590D\u6838" }), _jsx("option", { value: "confirmed", children: "\u786E\u8BA4\u51B2\u7A81" }), _jsx("option", { value: "rejected", children: "\u6392\u9664\u51B2\u7A81" })] })] }), _jsx(ClearFilterButton, { "data-dc": "clear-conflict-filters", ariaLabel: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", title: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", disabled: !search && modelFilter === "all" && agreement === "all" && reviewFilter === "all", onClick: () => {
                                                    setSearch("");
                                                    setModelFilter("all");
                                                    setAgreement("all");
                                                    setReviewFilter("all");
                                                    setPage(1);
                                                } })] }), conflictsLoading ? (_jsx("div", { className: "dc-empty", children: "\u6B63\u5728\u52A0\u8F7D\u51B2\u7A81\u56FE\u7EC4\u2026" })) : paginatedConflicts.length ? (_jsx("div", { className: "iad-thumbnail-grid", children: paginatedConflicts.map(c => (_jsxs(ThumbnailCard, { src: c.url, label: c.filename, "data-dc": "open-conflict", "data-id": c.id, onClick: () => openConflict(c), children: [_jsxs("small", { children: ["\u539F\u59CB\uFF1A", c.type] }), _jsxs("small", { children: ["\u6A21\u578B\uFF1A", c.model.modelType] })] }, c.id))) })) : (_jsx("div", { className: "dc-empty", children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u51B2\u7A81\u56FE\u7EC4\u3002" })), _jsx(Pagination, { total: visibleConflicts.length, page: currentPage, size: 18, unit: "\u7EC4", onPage: setPage })] }))] })] }), modal === 'new' && (_jsxs(Modal, { title: "\u65B0\u5EFA\u4E00\u81F4\u6027\u68C0\u67E5", id: "dc-new-mask", className: "dc-dialog dc-new-dialog", onClose: () => setModal(''), header: false, children: [_jsxs("header", { className: "dc-dialog-head", children: [_jsx("h2", { id: "dc-new-title", children: "\u65B0\u5EFA\u4E00\u81F4\u6027\u68C0\u67E5" }), _jsx(IconButton, { icon: "close", type: "button", title: "\u5173\u95ED", label: "\u5173\u95ED", onClick: () => {
                                    setModal('');
                                } })] }), _jsxs("div", { className: "dc-dialog-body dc-new-body", children: [_jsxs("div", { className: "dc-new-field", children: [_jsx("span", { children: "\u6570\u636E\u96C6" }), _jsx("div", { className: "dc-new-parent", children: currentParent?.name || '—' })] }), _jsxs("div", { className: "dc-new-field", children: [_jsx("span", { children: "\u5B50\u6570\u636E\u96C6" }), _jsx(MultiSelect, { id: "dc-new-child-trigger", menuId: "dc-new-child-options", label: "\u5B50\u6570\u636E\u96C6", options: currentChildDatasets.map(item => ({ value: item.dataset_id, label: item.name })), selected: modalChildIds, onToggle: id => setModalChildIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]), disabled: newCheckBusy })] }), _jsxs("div", { className: "dc-new-field dc-prompt-editor", children: [(error || polling.error || programs.some(program => program.error)) && _jsx("p", { role: "alert", className: "iad-error", children: error || polling.error || message(programs.find(program => program.error)?.error) }), _jsx("label", { htmlFor: "dc-new-prompt", children: "\u6A21\u578B\u5206\u6790\u63D0\u793A\u8BCD" }), _jsx("textarea", { id: "dc-new-prompt", rows: 9, spellCheck: false, "aria-label": "\u6A21\u578B\u5206\u6790\u63D0\u793A\u8BCD", value: newPrompt, onChange: e => setNewPrompt(e.target.value) })] })] }), _jsxs("footer", { className: "dc-dialog-footer", children: [_jsx(Button, { type: "button", "data-dc": "close-new", onClick: () => {
                                    setModal('');
                                }, children: "\u53D6\u6D88" }), _jsx(Button, { type: "button", variant: "primary", "data-dc": "create-job", disabled: !modalChildIds.length || !newPrompt.trim() || newCheckBusy, onClick: handleCreateJob, children: newCheckBusy ? '启动中…' : '开始检查' })] })] })), modal === 'compare' && currentConflict && (_jsxs(Modal, { title: "\u6807\u6CE8\u51B2\u7A81\u5BF9\u6BD4", id: "dc-compare-mask", className: "dc-dialog dc-conflict-dialog", header: false, onClose: () => setModal(''), children: [_jsxs("header", { className: "dc-dialog-head", children: [_jsx("h2", { id: "dc-dialog-title", children: "\u6807\u6CE8\u51B2\u7A81\u5BF9\u6BD4" }), _jsxs("div", { className: "dc-dialog-head-actions", children: [_jsx(Button, { type: "button", onClick: handlePrevConflict, children: "\u4E0A\u4E00\u7EC4" }), _jsx(Button, { type: "button", onClick: handleNextConflict, children: "\u4E0B\u4E00\u7EC4" }), _jsx(IconButton, { icon: "close", type: "button", title: "\u5173\u95ED", label: "\u5173\u95ED", onClick: () => setModal('') })] })] }), _jsxs("div", { className: "dc-dialog-body", children: [_jsxs("div", { className: "dc-compare", children: [_jsxs("div", { className: "dc-compare-cell", children: [_jsx("div", { className: "dc-compare-photo", role: "button", tabIndex: 0, "data-dc": "zoom-anchor", "aria-label": "\u67E5\u770B\u4E3B\u56FE\u5927\u56FE", title: "\u70B9\u51FB\u67E5\u770B\u5927\u56FE", onClick: () => setZoomItem({
                                                    id: currentConflict.id + '_anchor',
                                                    title: currentConflict.filename,
                                                    imageUrl: currentConflict.fullUrl || currentConflict.url,
                                                    width: currentConflict.sourceWidth,
                                                    height: currentConflict.sourceHeight,
                                                    bboxes: anchorBboxes,
                                                }), onKeyDown: e => {
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
                                                }, children: _jsx(AnnotatedImageStage, { src: currentConflict.fullUrl || currentConflict.url, alt: "\u4E3B\u56FE", width: currentConflict.sourceWidth, height: currentConflict.sourceHeight, bboxes: anchorBboxes }) }), _jsx("div", { className: "dc-photo-filename", title: currentConflict.filename, children: currentConflict.filename })] }), _jsxs("div", { className: "dc-compare-cell", children: [_jsx("div", { className: "dc-compare-photo", role: "button", tabIndex: 0, "data-dc": "zoom-candidate", "aria-label": "\u67E5\u770B\u5019\u9009\u56FE\u5927\u56FE", title: "\u70B9\u51FB\u67E5\u770B\u5927\u56FE", onClick: () => setZoomItem({
                                                    id: currentConflict.id + '_candidate_' + candidateIndex,
                                                    title: `${currentCandidate.filename} (候选图 ${candidateIndex + 1})`,
                                                    imageUrl: currentCandidate.fullUrl,
                                                    width: currentCandidate.width,
                                                    height: currentCandidate.height,
                                                    bboxes: candidateBboxes,
                                                }), onKeyDown: e => {
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
                                                }, children: selectedMember && _jsx(AnnotatedImageStage, { src: currentCandidate.fullUrl || currentCandidate.thumbUrl, alt: "\u5019\u9009\u56FE", width: currentCandidate.width, height: currentCandidate.height, bboxes: candidateBboxes }) }), _jsx("div", { className: "dc-photo-filename", title: currentCandidate.filename, children: currentCandidate.filename })] })] }), _jsx("div", { className: "iad-thumbnail-strip", "aria-label": "\u5207\u6362\u51B2\u7A81\u56FE\u50CF", children: conflictMembers.map((m, i) => {
                                    const s = m.image.sample;
                                    const thumb = ConsistencyView.media(m.image, true);
                                    return (_jsx(ThumbnailCard, { src: thumb, label: `候选 ${i + 1}`, "data-dc": "candidate", "data-id": i, "aria-pressed": i === candidateIndex, onClick: () => setCandidateIndex(i) }, s.sample_id || i));
                                }) }), membersError && _jsx("p", { role: "alert", className: "iad-error", children: membersError }), compared.error && _jsx("p", { role: "alert", className: "iad-error", children: compared.error }), _jsxs("section", { className: "dc-fact-panel", "aria-label": "\u5224\u5B9A\u7ED3\u8BBA", children: [_jsx("h3", { children: "\u5224\u5B9A\u7ED3\u8BBA" }), _jsx("span", { className: "dc-verdict-value", children: currentConflict.type }), _jsx("p", { className: "dc-verdict-description", children: compared.data ? annotationSummary(compared.data.result.annotation) : compared.error || '正在读取冻结比较记录…' })] }), _jsxs("section", { className: "dc-model-panel", "aria-label": "\u6A21\u578B\u5206\u6790", children: [_jsx("h3", { children: "\u6A21\u578B\u5206\u6790" }), _jsx("p", { children: groupAnalysis.error || groupAnalysis.analysis?.error || groupAnalysis.analysis?.result?.conclusions.map(item => item.text).join('\n') || '暂无已保存的模型分析结果。' })] }), _jsxs("section", { className: "dc-conclusion-panel", "aria-label": "\u6A21\u578B\u7ED3\u8BBA", children: [_jsx("h3", { children: "\u6A21\u578B\u7ED3\u8BBA" }), _jsx("span", { className: "dc-verdict-value", children: groupAnalysis.analysis?.result?.overall.text || currentConflict.model.modelType }), _jsx("p", { className: "dc-verdict-description", children: groupAnalysis.analysis?.result?.overall.text || groupAnalysis.error || groupAnalysis.analysis?.error || '暂无已保存的模型结论。' })] }), _jsxs("section", { className: "dc-review-panel", "aria-label": "\u4EBA\u5DE5\u590D\u6838", children: [_jsx("h3", { children: "\u4EBA\u5DE5\u590D\u6838" }), _jsxs("div", { className: "dc-decision-controls", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", disabled: reviewBusy || !reviewLoaded || !!pendingReview.current, name: "dc-review", value: "pending", checked: reviewDecision === 'pending', onChange: () => setReviewDecision('pending') }), "\u5F85\u786E\u8BA4"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", disabled: reviewBusy || !reviewLoaded || !!pendingReview.current, name: "dc-review", value: "confirmed", checked: reviewDecision === 'confirmed', onChange: () => setReviewDecision('confirmed') }), "\u786E\u8BA4\u51B2\u7A81"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", disabled: reviewBusy || !reviewLoaded || !!pendingReview.current, name: "dc-review", value: "rejected", checked: reviewDecision === 'rejected', onChange: () => setReviewDecision('rejected') }), "\u6392\u9664\u51B2\u7A81"] })] }), reviewError && _jsx("p", { role: "alert", className: "iad-error", children: reviewError }), _jsx("textarea", { disabled: reviewBusy || !reviewLoaded || !!pendingReview.current, className: "dc-note", id: "dc-note", placeholder: "\u590D\u6838\u8BF4\u660E\uFF08\u53EF\u9009\uFF09", value: reviewNote, onChange: e => setReviewNote(e.target.value) })] })] }), _jsxs("footer", { className: "dc-dialog-footer", children: [_jsx(Button, { type: "button", onClick: () => setModal(''), children: "\u53D6\u6D88" }), _jsx(Button, { variant: "primary", type: "button", disabled: reviewBusy || !reviewLoaded || !compared.data, onClick: handleSaveReview, children: "\u4FDD\u5B58\u590D\u6838" })] })] })), !!statsModalJobId && (_jsx(Modal, { title: "\u6807\u6CE8\u51B2\u7A81\u7EDF\u8BA1", size: "form", className: "dc-stats-dialog", onClose: () => setStatsModalJobId(''), children: _jsx("div", { className: "dc-stats-content", children: _jsxs("div", { className: "dc-stats-charts", children: [(() => {
                                const ticks = [distributionAxis, distributionAxis * 0.75, distributionAxis * 0.5, distributionAxis * 0.25, 0].map(v => Math.round(v));
                                return (_jsxs("section", { className: "dc-vchart-panel", "aria-label": "\u539F\u59CB\u5DEE\u5F02\u7C7B\u578B\u67F1\u72B6\u56FE", children: [_jsx("h3", { children: "\u539F\u59CB\u5DEE\u5F02\u7C7B\u578B" }), _jsxs("div", { className: "dc-vchart-body", children: [_jsx("div", { className: "dc-vchart-axis", "aria-hidden": "true", children: ticks.map((n, i) => (_jsx("span", { children: n }, i))) }), _jsxs("div", { className: "dc-vchart-figure", children: [_jsx("div", { className: "dc-vchart-lines", "aria-hidden": "true" }), _jsx("div", { className: "dc-vchart-columns", style: { ['--chart-cols']: origStats.length }, children: origStats.map(row => {
                                                                const height = (100 * row.count) / distributionAxis;
                                                                return (_jsxs("div", { className: "dc-vchart-column", children: [_jsx("div", { className: "dc-vchart-barslot", children: _jsx("button", { type: "button", className: `dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`, style: { height: `${Math.max(0.6, height)}%` }, "data-dc": "stat-category", "data-id": row.name, "aria-label": `${row.name} ${row.count} 组，点击查看`, title: `${row.name}：${row.count} 组，点击筛选`, onClick: () => handleStatClick('stat-category', row.name), children: _jsx("span", { className: "dc-vchart-value", children: row.count }) }) }), _jsx("span", { className: "dc-vchart-label", title: row.name, children: row.name })] }, row.name));
                                                            }) })] })] })] }));
                            })(), (() => {
                                const ticks = [distributionAxis, distributionAxis * 0.75, distributionAxis * 0.5, distributionAxis * 0.25, 0].map(v => Math.round(v));
                                return (_jsxs("section", { className: "dc-vchart-panel", "aria-label": "\u6A21\u578B\u5224\u65AD\u67F1\u72B6\u56FE", children: [_jsx("h3", { children: "\u6A21\u578B\u5224\u65AD" }), _jsxs("div", { className: "dc-vchart-body", children: [_jsx("div", { className: "dc-vchart-axis", "aria-hidden": "true", children: ticks.map((n, i) => (_jsx("span", { children: n }, i))) }), _jsxs("div", { className: "dc-vchart-figure", children: [_jsx("div", { className: "dc-vchart-lines", "aria-hidden": "true" }), _jsx("div", { className: "dc-vchart-columns", style: { ['--chart-cols']: modelStats.length }, children: modelStats.map(row => {
                                                                const height = (100 * row.count) / distributionAxis;
                                                                return (_jsxs("div", { className: "dc-vchart-column", children: [_jsx("div", { className: "dc-vchart-barslot", children: _jsx("button", { type: "button", className: `dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`, style: { height: `${Math.max(0.6, height)}%` }, "data-dc": "stat-model", "data-id": row.name, "aria-label": `${row.name} ${row.count} 组，点击查看`, title: `${row.name}：${row.count} 组，点击筛选`, onClick: () => handleStatClick('stat-model', row.name), children: _jsx("span", { className: "dc-vchart-value", children: row.count }) }) }), _jsx("span", { className: "dc-vchart-label", title: row.name, children: row.name })] }, row.name));
                                                            }) })] })] })] }));
                            })(), (() => {
                                const ticks = [agreementAxis, agreementAxis * 0.75, agreementAxis * 0.5, agreementAxis * 0.25, 0].map(v => Math.round(v));
                                return (_jsxs("section", { className: "dc-vchart-panel dc-vchart-agreement", "aria-label": "\u7ED3\u8BBA\u4E00\u81F4\u6027\u67F1\u72B6\u56FE", children: [_jsx("h3", { children: "\u7ED3\u8BBA\u4E00\u81F4\u6027" }), _jsxs("div", { className: "dc-vchart-body", children: [_jsx("div", { className: "dc-vchart-axis", "aria-hidden": "true", children: ticks.map((n, i) => (_jsx("span", { children: n }, i))) }), _jsxs("div", { className: "dc-vchart-figure", children: [_jsx("div", { className: "dc-vchart-lines", "aria-hidden": "true" }), _jsx("div", { className: "dc-vchart-columns", style: { ['--chart-cols']: agreementStats.length }, children: agreementStats.map(row => {
                                                                const height = (100 * row.count) / agreementAxis;
                                                                return (_jsxs("div", { className: "dc-vchart-column", children: [_jsx("div", { className: "dc-vchart-barslot", children: _jsx("button", { type: "button", className: `dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`, style: { height: `${Math.max(0.6, height)}%` }, "data-dc": "stat-agreement", "data-id": row.id, "aria-label": `${row.name} ${row.count} 组，点击查看`, title: `${row.name}：${row.count} 组，点击筛选`, onClick: () => handleStatClick('stat-agreement', row.id), children: _jsx("span", { className: "dc-vchart-value", children: row.count }) }) }), _jsx("span", { className: "dc-vchart-label", title: row.name, children: row.name })] }, row.id));
                                                            }) })] })] })] }));
                            })()] }) }) })), statusJobId && batches.some(job => job.batch_id === statusJobId) && _jsx(JobStatusDrawer, { job: batches.find(job => job.batch_id === statusJobId).analysis, onClose: () => setStatusJobId('') }), _jsx(FullscreenViewer, { open: !!zoomItem, item: zoomItem, onClose: () => setZoomItem(null) })] }));
}
