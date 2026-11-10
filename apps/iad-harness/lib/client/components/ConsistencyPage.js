import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SectionHeading } from './layout/SectionHeading.js';
import { PromptDrawer } from './PromptDrawer.js';
import { conflictCategoryDefaults, conflictCategoryLabels, modelConclusionLabels } from '../../shared/consistency.parameters.generated.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { ConsistencyStatisticsDialog } from './ConsistencyStatisticsDialog.js';
import { ConsistencyConflictDialog } from './ConsistencyConflictDialog.js';
import { ConsistencyImages } from './ConsistencyImages.js';
import { useConsistencyImages } from '../useConsistencyImages.js';
import { ConsistencyGallery } from './ConsistencyGallery.js';
import { ConsistencyFilters } from './ConsistencyFilters.js';
import { JobStatusDrawer, JobStatusButton, JobStatusAction } from './JobStatusDrawer.js';
import { JobListPanel } from './JobListPanel.js';
import { TabBar } from './layout/TabBar.js';
import { Button } from './Button.js';
import { ConsistencyResultCard } from './ConsistencyResultCard.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildHierarchyGroups, getDatasetGroupId } from '../dataset-hierarchy.js';
import { IconButton } from './IconButton.js';
import { DeleteAction } from './DeleteAction.js';
import { ConsistencyEvidencePage } from './ConsistencyEvidencePage.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { Pagination, IBA_JOBS_PAGE_SIZE } from './Pagination.js';
import { useWorkspace } from '../workspace.js';
import { message, request } from '../api.js';
import { workbenchStyles } from '../styles.js';
import { consistencyTaskCategories } from '../../shared/prompt-defaults.generated.js';
import { ConsistencyCheckCreate } from './ConsistencyCheckCreate.js';
import { identityPromptFields } from '../consistency-prompts.js';
import { usePagePosition } from '../usePagePosition.js';
import { ConsistencyView, consistencyImageGroups } from '../consistency-view.js';
import { useConsistencyJobs } from '../useConsistencyJobs.js';
import { formatJobTime, jobStatuses } from '../../shared/job-display.js';
import { useDatasetCatalog } from '../useDatasetCatalog.js';
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
    return _jsx("span", { className: "dc-state exp-pill fail", children: jobStatuses[status] });
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
export function ConsistencyPage() {
    const { state, workspace } = useWorkspace();
    const catalog = useDatasetCatalog();
    const evidenceId = state.consistency.evidenceId;
    const queryId = state.consistency.queryId;
    const [queryError, setQueryError] = useState('');
    const onExpired = useCallback(() => setQueryError('冻结查询已失效，请从检查作业打开结果。'), []);
    const [visited, setVisited] = useState(!evidenceId);
    useEffect(() => setQueryError(''), [queryId]);
    useEffect(() => {
        if (!evidenceId)
            setVisited(true);
    }, [evidenceId]);
    return (_jsxs(_Fragment, { children: [visited && (_jsx("div", { hidden: !!evidenceId, style: { height: '100%' }, children: queryId ? _jsxs("div", { className: "iad-workbench iad-business-page", "data-page": "industrial-consistency", children: [_jsx("style", { children: workbenchStyles }), _jsx(WorkbenchHeader, { pageId: "industrial-consistency" }), _jsx(Button, { onClick: () => workspace.updateConsistency({ queryId: undefined, groupId: undefined, memberId: undefined, differenceId: undefined }, true), children: "\u68C0\u67E5\u4F5C\u4E1A" }), queryError ? _jsx("p", { role: "alert", children: queryError }) : _jsx(ConsistencyGallery, { queryId: queryId, kind: state.consistency.tab === 'groups' ? 'groups' : 'conflicts', onExpired: onExpired })] }) : catalog.data ? _jsx(ConsistencyIntegratedWorkspace, { ...catalog.data }) :
                    _jsxs("div", { className: "iad-workbench iad-business-page", "data-page": "industrial-consistency", children: [_jsx("style", { children: workbenchStyles }), _jsx(WorkbenchHeader, { pageId: "industrial-consistency" }), _jsx("p", { role: catalog.error ? 'alert' : 'status', children: catalog.error || '正在加载数据集…' })] }) })), evidenceId && _jsx(ConsistencyEvidencePage, { evidenceId: evidenceId })] }));
}
function ConsistencyIntegratedWorkspace({ datasets, groups }) {
    const { state, workspace } = useWorkspace();
    const initialParent = buildHierarchyGroups(datasets, groups)[0]?.group_id || '';
    const selectedParentId = state.consistency.parentId ?? initialParent;
    const selectedChildIds = state.consistency.datasetIds ?? datasets.filter(item => getDatasetGroupId(item) === selectedParentId).map(item => item.dataset_id);
    const [error, setError] = useState('');
    // Consistency jobs state
    const [statusJobId, setStatusJobId] = useState('');
    const selectedJobId = state.consistency.batchId || '';
    const setSelectedJobId = useCallback((batchId) => workspace.updateConsistency({ batchId: batchId || undefined }, true), [workspace]);
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
    const createOpen = state.consistency.view === 'setup';
    const [modal, setModal] = useState('');
    const [currentConflictId, setCurrentConflictId] = useState('');
    const [statsModalJobId, setStatsModalJobId] = useState('');
    const [promptJob, setPromptJob] = useState(null);
    // Derive hierarchy groups
    const hierarchyGroups = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
    const currentParent = useMemo(() => hierarchyGroups.find(g => g.group_id === selectedParentId) || hierarchyGroups[0], [hierarchyGroups, selectedParentId]);
    const currentChildDatasets = useMemo(() => datasets.filter(d => getDatasetGroupId(d) === currentParent?.group_id), [datasets, hierarchyGroups, currentParent]);
    const progress = useCallback(() => setRevision(value => value + 1), []);
    const polling = useConsistencyJobs(selectedChildIds, progress);
    const batches = polling.jobs;
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
        return availableJobs.slice((currentJobPage - 1) * IBA_JOBS_PAGE_SIZE, currentJobPage * IBA_JOBS_PAGE_SIZE);
    }, [availableJobs, currentJobPage]);
    // Selected job
    const selectedJob = useMemo(() => {
        if (!shownJobs.length)
            return null;
        if (selectedJobId) {
            const match = shownJobs.find(j => j.analysis.root_run_id === selectedJobId || j.batch_id === selectedJobId);
            if (match)
                return match;
        }
        const withResults = shownJobs.find(j => (j.status === 'COMPLETED' || j.status === 'PARTIAL') && (j.conflict_count || 0) > 0);
        if (withResults)
            return withResults;
        const completed = shownJobs.find(j => j.status === 'COMPLETED' || j.status === 'PARTIAL');
        if (completed)
            return completed;
        return shownJobs[0] || null;
    }, [shownJobs, selectedJobId]);
    const images = useConsistencyImages(selectedJob?.analysis.consistency_check_version === 1 ? selectedJob.analysis.run_id : undefined, `${revision}:${selectedJob?.status}`, !!selectedJob && ['PENDING', 'RUNNING'].includes(selectedJob.status));
    const imageGroup = kind === 'images' || Object.hasOwn(consistencyImageGroups, kind)
        ? kind : null;
    const handleJobPageChange = (newPage) => {
        const targetPage = Math.max(1, Math.min(jobPages, newPage));
        setJobPage(targetPage);
        const firstJobOnPage = availableJobs[(targetPage - 1) * IBA_JOBS_PAGE_SIZE];
        if (firstJobOnPage) {
            setSelectedJobId(firstJobOnPage.analysis.root_run_id);
        }
        setPage(1);
    };
    useEffect(() => {
        const controller = new AbortController();
        setJobConflicts([]);
        setError('');
        if (!selectedJob || !['COMPLETED', 'PARTIAL'].includes(selectedJob.status))
            return;
        if (!selectedJob.analysis.program_batch_id && selectedJob.analysis.consistency_check_version !== 1)
            return;
        setConflictsLoading(true);
        const load = selectedJob.analysis.consistency_check_version === 1 ? ConsistencyView.loadCheck(selectedJob.analysis.run_id, controller.signal)
            : ConsistencyView.load(selectedJob.batch_id, controller.signal);
        load
            .then(value => { if (!controller.signal.aborted)
            setJobConflicts(value.items); })
            .catch(error => { if (!controller.signal.aborted)
            setError(message(error)); })
            .finally(() => { if (!controller.signal.aborted)
            setConflictsLoading(false); });
        return () => controller.abort();
    }, [selectedJob?.batch_id, selectedJob?.status, revision]);
    const visibleConflicts = useMemo(() => ConsistencyView.filter(jobConflicts, { search, model: modelFilter, agreement, review: reviewFilter })
        .filter(item => kind === 'all' || item.types.some(type => type === kind)), [jobConflicts, kind, modelFilter, agreement, search, reviewFilter]);
    const totalPages = Math.max(1, Math.ceil(visibleConflicts.length / 18));
    const currentPage = Math.min(totalPages, Math.max(1, page));
    const paginatedConflicts = useMemo(() => {
        const start = (currentPage - 1) * 18;
        return visibleConflicts.slice(start, start + 18);
    }, [visibleConflicts, currentPage]);
    // Parent dataset change handler
    const handleParentChange = useCallback((newParentId) => {
        const newChildren = datasets.filter(d => getDatasetGroupId(d) === newParentId);
        workspace.updateConsistency({ parentId: newParentId, datasetIds: newChildren.map(c => c.dataset_id), batchId: undefined }, true);
        setJobPage(1);
        setKind('all');
        setModelFilter('all');
        setAgreement('all');
        setSearch('');
        setPage(1);
        setStatsModalJobId('');
    }, [datasets, workspace]);
    // Child dataset toggle handler
    const handleChildToggle = useCallback((childId) => {
        workspace.updateConsistency({ parentId: selectedParentId, datasetIds: selectedChildIds.includes(childId)
                ? selectedChildIds.filter(id => id !== childId) : [...selectedChildIds, childId], batchId: undefined }, true);
        setJobPage(1);
        setSearch('');
        setPage(1);
        setKind('all');
        setModelFilter('all');
        setAgreement('all');
    }, [workspace, selectedChildIds, selectedParentId]);
    // Job selection
    const selectJob = useCallback((runId) => {
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
        setJobPage(1);
        polling.refresh();
        setRevision(v => v + 1);
    }, [polling.refresh]);
    const currentConflict = useMemo(() => jobConflicts.find(c => c.id === currentConflictId) || null, [jobConflicts, currentConflictId]);
    async function handleDeleteJob(job) {
        await request(`/analysis/delete/${encodeURIComponent(job.analysis.run_id)}`, {});
        setRevision(value => value + 1);
    }
    const taskType = selectedJob?.analysis.consistency_task_type;
    const modelTypes = Object.entries(modelConclusionLabels)
        .filter(([value]) => value === 'EQUIVALENT' || !taskType || consistencyTaskCategories[taskType].some(category => category === value))
        .map(([value, label]) => ({ value, label }));
    const conflictTabs = useMemo(() => {
        const defaults = new Set(taskType ? consistencyTaskCategories[taskType] : datasets.filter(dataset => selectedJob?.dataset_ids.includes(dataset.dataset_id))
            .flatMap(dataset => conflictCategoryDefaults[dataset.format]));
        return [...(selectedJob?.analysis.consistency_check_version === 1 ? [{ value: 'images', label: '全部图像' }] : []),
            { value: 'all', label: '全部冲突' }, ...Object.entries(conflictCategoryLabels)
                .filter(([value]) => defaults.has(value)).map(([value, label]) => ({ value, label })),
            ...(selectedJob?.analysis.consistency_check_version === 1 ? Object.entries(consistencyImageGroups).map(([value, label]) => ({ value, label })) : [])];
    }, [datasets, taskType, selectedJob?.dataset_ids, selectedJob?.analysis.consistency_check_version]);
    useEffect(() => {
        if (!conflictTabs.some(tab => tab.value === kind))
            setKind('all');
        if (modelFilter !== 'all' && !modelTypes.some(option => option.value === modelFilter))
            setModelFilter('all');
    }, [conflictTabs, taskType, kind, modelFilter]);
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
            setModelFilter(ConsistencyView.modelConclusion(id) || 'all');
            setKind('all');
            setAgreement('all');
            setReviewFilter('all');
            setPage(1);
            setStatsModalJobId('');
        }
        else if (action === 'stat-agreement') {
            setAgreement(id === 'same' ? 'same' : 'different');
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
    const surface = usePagePosition(createOpen ? 'consistency:create' : `consistency:results:${selectedParentId}:${selectedJobId}`, createOpen || !conflictsLoading);
    return (_jsxs("div", { ref: surface, className: "iad-workbench iad-business-page iad-consistency", "data-page": "industrial-consistency", children: [_jsx("style", { children: workbenchStyles }), createOpen ? _jsx(ConsistencyCheckCreate, { datasets: datasets, groups: groups, parentId: selectedParentId, datasetIds: selectedChildIds, onCancel: () => workspace.updateConsistency({ view: undefined }), onStarted: (job, parentId, datasetIds) => {
                    workspace.updateConsistency({ view: undefined, parentId, datasetIds, batchId: job.root_run_id }, true);
                    setSearch('');
                    setJobPage(1);
                    setKind('all');
                    setModelFilter('all');
                    setAgreement('all');
                    setPage(1);
                    setRevision(value => value + 1);
                    polling.refresh();
                } }) : _jsxs("div", { className: "dc-root", children: [_jsx(WorkbenchHeader, { pageId: "industrial-consistency", className: "heading dc-page-heading", children: _jsx("div", { className: "dc-heading-actions", children: _jsx(Button, { type: "button", variant: "primary", "data-dc": "start-check", onClick: () => {
                                    workspace.rememberPagePosition('consistency:create', 0);
                                    workspace.updateConsistency({ view: 'setup' });
                                }, children: "\u65B0\u5EFA\u68C0\u67E5" }) }) }), (error || polling.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || polling.error }), _jsx(DatasetScopeSelector, { className: "dc-scope", groups: hierarchyGroups, selectedGroupId: selectedParentId, onGroupChange: handleParentChange, childDatasets: currentChildDatasets, selectedChildIds: selectedChildIds, onChildToggle: handleChildToggle, groupId: "dc-parent", childId: "dc-child-trigger", childMenuId: "dc-child-options", children: _jsx(IconButton, { icon: "refresh", type: "button", title: "\u5237\u65B0\u68C0\u67E5\u4F5C\u4E1A", label: "\u5237\u65B0\u68C0\u67E5\u4F5C\u4E1A", onClick: handleRefresh }) }), _jsx(JobListPanel, { title: "\u68C0\u67E5\u4F5C\u4E1A", className: "dc-section dc-jobs-section", children: availableJobs.length ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "dc-table-panel iad-job-table-scroll", children: _jsxs("table", { className: "dc-table iad-job-table-grid", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4F5C\u4E1A" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u68C0\u67E5\u8303\u56F4" }), _jsx("th", { children: "\u51B2\u7A81\u603B\u6570" }), _jsx("th", { children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { children: "\u8017\u65F6" }), _jsx("th", { className: "dc-operations", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: shownJobs.map(j => {
                                                    const isSelected = j.analysis.root_run_id === selectedJob?.analysis.root_run_id;
                                                    const childNames = j.dataset_ids
                                                        .map(id => datasets.find(d => d.dataset_id === id)?.name || id)
                                                        .join('、');
                                                    const timeStr = j.created_at ? formatJobTime(j.created_at) : '—';
                                                    const hasConflicts = (j.status === 'COMPLETED' || j.status === 'PARTIAL') &&
                                                        typeof j.conflict_count === 'number' &&
                                                        j.conflict_count > 0;
                                                    return (_jsxs("tr", { tabIndex: 0, "data-dc-row": j.batch_id, "data-selected": isSelected, "aria-selected": isSelected, onClick: () => selectJob(j.analysis.root_run_id), onKeyDown: e => {
                                                            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                                                                e.preventDefault();
                                                                selectJob(j.analysis.root_run_id);
                                                            }
                                                        }, children: [_jsx("td", { className: "dc-mono", children: j.batch_id }), _jsx("td", { children: _jsx(JobStatusButton, { job: j.analysis, onClick: () => setStatusJobId(j.analysis.root_run_id), children: dcJobBadge(j.status) }) }), _jsx("td", { className: "dc-job-datasets", title: childNames, children: childNames || '全部' }), _jsx("td", { className: `dc-total ${hasConflicts ? 'dc-has-conflicts' : ''}`, title: "\u539F\u59CB\u68C0\u67E5\u68C0\u6D4B\u51FA\u7684\u51B2\u7A81\u56FE\u7EC4\u6570", children: dcJobConflictTotal(j) }), _jsx("td", { className: "dc-time", children: timeStr }), _jsx("td", { className: "dc-elapsed dc-mono", children: dcJobElapsed(j) }), _jsxs("td", { className: "dc-operations", onClick: e => e.stopPropagation(), children: [_jsx(JobStatusAction, { job: j.analysis, onClick: () => setStatusJobId(j.analysis.root_run_id) }), _jsx(IconButton, { icon: "prompt", label: "\u67E5\u770B\u63D0\u793A\u8BCD", "data-dc": "view-prompt", "data-id": j.batch_id, onClick: () => setPromptJob(j) }), _jsx(IconButton, { icon: "stats", type: "button", title: "\u67E5\u770B\u7EDF\u8BA1\u7ED3\u679C", label: "\u67E5\u770B\u7EDF\u8BA1\u7ED3\u679C", "data-dc": "stats", "data-id": j.batch_id, disabled: j.status !== 'COMPLETED' && j.status !== 'PARTIAL', onClick: () => {
                                                                            setSelectedJobId(j.analysis.root_run_id);
                                                                            setStatsModalJobId(j.analysis.root_run_id);
                                                                        } }), _jsx(DeleteAction, { title: "\u5220\u9664\u68C0\u67E5\u4F5C\u4E1A", name: j.batch_id, onDelete: () => handleDeleteJob(j), restoreFocus: () => document.getElementById('dc-parent') })] })] }, j.analysis.root_run_id));
                                                }) })] }) }), _jsx(Pagination, { total: availableJobs.length, page: currentJobPage, onPage: handleJobPageChange, label: "\u68C0\u67E5\u4F5C\u4E1A", size: IBA_JOBS_PAGE_SIZE, hideSinglePage: true })] })) : (_jsx("div", { className: "dc-empty", children: polling.loading ? '正在读取检查作业…' : '当前没有检查作业' })) }), _jsxs("section", { className: "dc-section dc-results-section", children: [_jsx(SectionHeading, { title: "\u6807\u6CE8\u51B2\u7A81" }), _jsx("div", { className: "dc-results-body", children: !selectedJob ? (_jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u6CA1\u6709\u7ED3\u679C" })) : (_jsxs(_Fragment, { children: [_jsx(ConsistencyFilters, { value: { search, model: modelFilter, agreement, review: reviewFilter }, modelTypes: modelTypes, onChange: value => { setSearch(value.search); setModelFilter(value.model); setAgreement(value.agreement); setReviewFilter(value.review); setPage(1); } }), _jsx(TabBar, { label: "\u539F\u59CB\u6807\u6CE8\u51B2\u7A81\u7C7B\u578B", value: kind, onChange: value => { setKind(value); setPage(1); }, items: conflictTabs.map(tab => ({ id: tab.value, label: _jsxs(_Fragment, { children: [_jsx("span", { children: tab.label }), _jsx("span", { className: "iad-tab-count", children: tab.value === 'images' ? selectedJob.analysis.total_samples : Object.hasOwn(consistencyImageGroups, tab.value)
                                                                ? images.items.filter(image => image.reason === tab.value).length : tab.value === 'all' ? jobConflicts.length : jobConflicts.filter(conflict => conflict.types.some(type => type === tab.value)).length })] }), buttonProps: { 'data-dc': 'raw-tab', 'data-id': tab.value } })) }), _jsx("div", { className: "dc-result-panel", role: "tabpanel", "aria-label": conflictTabs.find(tab => tab.value === kind)?.label, children: imageGroup ? _jsx(ConsistencyImages, { jobId: selectedJob.analysis.run_id, images: images, group: imageGroup, filters: { search, model: modelFilter, agreement, review: reviewFilter }, onReviewed: () => setRevision(value => value + 1) }, selectedJob.analysis.run_id) : !['COMPLETED', 'PARTIAL'].includes(selectedJob.status) ? (_jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u4F5C\u4E1A\u6CA1\u6709\u5DF2\u53D1\u5E03\u7ED3\u679C" })) : conflictsLoading ? _jsx("p", { className: "iad-result-empty", role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u7ED3\u679C\u2026" })
                                                : !jobConflicts.length ? _jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u6CA1\u6709\u7ED3\u679C" }) : _jsxs(_Fragment, { children: [paginatedConflicts.length ? (_jsx("div", { className: "iad-thumbnail-grid dc-conflict-grid", children: paginatedConflicts.map(c => (_jsx(ConsistencyResultCard, { item: c, action: "open-conflict", onOpen: () => { setCurrentConflictId(c.id); setModal('compare'); } }, c.id))) })) : (_jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u51B2\u7A81\u56FE\u7EC4\u3002" })), _jsx(Pagination, { total: visibleConflicts.length, page: currentPage, size: 18, unit: "\u7EC4", onPage: setPage })] }) })] })) })] })] }), modal === 'compare' && currentConflict && _jsx(ConsistencyConflictDialog, { conflict: currentConflict, items: visibleConflicts, onSelect: setCurrentConflictId, onClose: () => setModal(''), onReviewed: () => setRevision(value => value + 1) }, `${currentConflict.checkId}:${currentConflict.id}`), promptJob && _jsx(PromptDrawer, { title: "\u67E5\u770B\u63D0\u793A\u8BCD", text: promptJob.analysis.consistency_prompt || '该作业没有保存提示词。', systemText: promptJob.analysis.system_prompt, additionalSections: promptJob.analysis.consistency_identity_prompts ? identityPromptFields.map(({ name, label }) => ({
                    title: label, text: promptJob.analysis.consistency_identity_prompts[name]
                })) : [], onClose: () => setPromptJob(null) }), !!statsModalJobId && _jsx(ConsistencyStatisticsDialog, { items: jobConflicts, onFilter: handleStatClick, onClose: () => setStatsModalJobId('') }), statusJobId && batches.some(job => job.analysis.root_run_id === statusJobId) && _jsx(JobStatusDrawer, { job: batches.find(job => job.analysis.root_run_id === statusJobId).analysis, onClose: () => setStatusJobId('') })] }));
}
