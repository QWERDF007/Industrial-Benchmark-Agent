import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SectionHeading } from './layout/SectionHeading.js';
import { PromptDrawer } from './PromptDrawer.js';
import { conflictCategories, conflictCategoryDefaults } from '../../shared/consistency.parameters.generated.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { v4 as uuid } from 'uuid';
import { ConsistencyStatisticsDialog } from './ConsistencyStatisticsDialog.js';
import { ConsistencyConflictDialog } from './ConsistencyConflictDialog.js';
import { MultiSelect, Select } from './Select.js';
import { Modal } from './Modal.js';
import { JobStatusDrawer, JobStatusButton, JobStatusAction } from './JobStatusDrawer.js';
import { JobListPanel } from './JobListPanel.js';
import { TabBar } from './layout/TabBar.js';
import { Button } from './Button.js';
import { ThumbnailCard } from "./ThumbnailCard.js";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildHierarchyGroups, getDatasetGroupId } from '../dataset-hierarchy.js';
import { IconButton } from './IconButton.js';
import { DeleteAction } from './DeleteAction.js';
import { ConsistencyEvidencePage } from './ConsistencyEvidencePage.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { Pagination, IBA_JOBS_PAGE_SIZE } from './Pagination.js';
import { useWorkspace } from '../workspace.js';
import { message, request } from '../api.js';
import { workbenchStyles } from '../styles.js';
import { ClearFilterButton } from './CommonFilterControls.js';
import { promptDefaults } from '../../shared/prompt-defaults.generated.js';
import { ConsistencyView } from '../consistency-view.js';
import { useQueries } from '@tanstack/react-query';
import { queryClient } from '../query-client.js';
import { useJobs } from '../useJobs.js';
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
                    _jsxs("div", { className: "iad-workbench iad-business-page", "data-page": "industrial-consistency", children: [_jsx("style", { children: workbenchStyles }), _jsx(WorkbenchHeader, { pageId: "industrial-consistency" }), _jsx("p", { role: catalog.error ? 'alert' : 'status', children: catalog.error || '正在加载数据集…' })] }) })), evidenceId && _jsx(ConsistencyEvidencePage, { evidenceId: evidenceId })] }));
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
    const [activeQueryId, setActiveQueryId] = useState('');
    const [statsModalJobId, setStatsModalJobId] = useState('');
    const [promptJob, setPromptJob] = useState(null);
    // Derive hierarchy groups
    const hierarchyGroups = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
    const currentParent = useMemo(() => hierarchyGroups.find(g => g.group_id === selectedParentId) || hierarchyGroups[0], [hierarchyGroups, selectedParentId]);
    const currentChildDatasets = useMemo(() => datasets.filter(d => getDatasetGroupId(d) === currentParent?.group_id), [datasets, hierarchyGroups, currentParent]);
    const progress = useCallback(() => setRevision(value => value + 1), []);
    const polling = useJobs('consistency', selectedChildIds, progress);
    const roots = polling.jobs;
    const programIds = [...new Set(roots.flatMap(job => job.program_batch_id ? [job.program_batch_id] : []))].sort();
    const programs = useQueries({ queries: programIds.map(id => ({ queryKey: ['iad', 'resource', `/consistency/runs/${id}`],
            queryFn: () => request(`/consistency/runs/${encodeURIComponent(id)}`), staleTime: Infinity, })) }, queryClient);
    const batches = roots.map(job => {
        const program = programs.find(item => item.data?.batch_id === job.program_batch_id)?.data;
        return { batch_id: job.program_batch_id || job.run_id, analysis: job, status: job.status,
            dataset_ids: job.dataset_ids, created_at: job.submitted_at, pair_count: program?.pair_count || 0,
            conflict_count: program?.conflict_count ?? null,
            duration_seconds: job.finished_at && job.started_at ? Math.max(0, Math.round((Date.parse(job.finished_at) - Date.parse(job.started_at)) / 1000)) : null };
    });
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
            const match = shownJobs.find(j => j.analysis.root_run_id === selectedJobId);
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
            setSelectedJobId(firstJobOnPage.analysis.root_run_id);
        }
        setPage(1);
    };
    useEffect(() => {
        const controller = new AbortController();
        setJobConflicts([]);
        setActiveQueryId('');
        setError('');
        if (!selectedJob?.analysis.program_batch_id || !['COMPLETED', 'PARTIAL'].includes(selectedJob.status))
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
            list = list.filter(c => c.types.some(type => type === kind));
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
    const selectJob = useCallback((runId) => {
        setSelectedJobId(runId);
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
                newSubmission.current = { key, id: uuid() };
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
    const currentConflict = useMemo(() => jobConflicts.find(c => c.id === currentConflictId) || null, [jobConflicts, currentConflictId]);
    async function handleDeleteJob(job) {
        await request(`/analysis/delete/${encodeURIComponent(job.analysis.run_id)}`, {});
        setRevision(value => value + 1);
    }
    const availableTypes = useMemo(() => {
        const formats = datasets.filter(dataset => selectedJob?.dataset_ids.includes(dataset.dataset_id)).map(dataset => dataset.format);
        const defaults = new Set(formats.flatMap(format => conflictCategoryDefaults[format]));
        return conflictCategories.filter(type => defaults.has(type) || jobConflicts.some(item => item.types.includes(type)));
    }, [datasets, selectedJob?.batch_id, jobConflicts]);
    const modelTypes = useMemo(() => [...new Set(jobConflicts.map(item => item.model.modelType))], [jobConflicts]);
    // Raw conflict tabs
    const conflictTabs = useMemo(() => {
        return [{ value: 'all', label: '全部冲突' }, ...availableTypes.map(t => ({ value: t, label: t }))];
    }, [availableTypes]);
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
    return (_jsxs("div", { className: "iad-workbench iad-business-page iad-consistency", "data-page": "industrial-consistency", children: [_jsx("style", { children: workbenchStyles }), _jsxs("div", { className: "dc-root", children: [_jsx(WorkbenchHeader, { pageId: "industrial-consistency", className: "heading dc-page-heading", children: _jsx("div", { className: "dc-heading-actions", children: _jsx(Button, { type: "button", variant: "primary", "data-dc": "start-check", onClick: () => {
                                    setNewPrompt(DEFAULT_CONSISTENCY_PROMPT);
                                    setModalChildIds([...selectedChildIds]);
                                    setModal('new');
                                }, children: "\u65B0\u5EFA\u68C0\u67E5" }) }) }), (error || polling.error || programs.some(program => program.error)) && _jsx("p", { role: "alert", className: "iad-error", children: error || polling.error || message(programs.find(program => program.error)?.error) }), _jsx(DatasetScopeSelector, { className: "dc-scope", groups: hierarchyGroups, selectedGroupId: selectedParentId, onGroupChange: handleParentChange, childDatasets: currentChildDatasets, selectedChildIds: selectedChildIds, onChildToggle: handleChildToggle, groupId: "dc-parent", childId: "dc-child-trigger", childMenuId: "dc-child-options", children: _jsx(IconButton, { icon: "refresh", type: "button", title: "\u5237\u65B0\u68C0\u67E5\u4F5C\u4E1A", label: "\u5237\u65B0\u68C0\u67E5\u4F5C\u4E1A", onClick: handleRefresh }) }), _jsx(JobListPanel, { title: "\u68C0\u67E5\u4F5C\u4E1A", className: `dc-section dc-jobs-section ${jobPages > 1 ? 'iba-job-multipage' : ''}`, children: availableJobs.length ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "dc-table-panel", children: _jsxs("table", { className: "dc-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4F5C\u4E1A" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u68C0\u67E5\u8303\u56F4" }), _jsx("th", { children: "\u51B2\u7A81\u603B\u6570" }), _jsx("th", { children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { children: "\u8017\u65F6" }), _jsx("th", { className: "dc-operations", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: shownJobs.map(j => {
                                                    const isSelected = j.analysis.root_run_id === selectedJob?.analysis.root_run_id;
                                                    const childNames = j.dataset_ids
                                                        .map(id => datasets.find(d => d.dataset_id === id)?.name || id)
                                                        .join('、');
                                                    const timeStr = j.created_at ? j.created_at.slice(0, 16).replace('T', ' ') : '—';
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
                                                }) })] }) }), _jsx(Pagination, { total: availableJobs.length, page: currentJobPage, onPage: handleJobPageChange, label: "\u68C0\u67E5\u4F5C\u4E1A", size: IBA_JOBS_PAGE_SIZE, hideSinglePage: true })] })) : (_jsx("div", { className: "dc-empty", children: polling.loading || programs.some(program => program.isPending) ? '正在读取检查作业…' : '当前没有检查作业' })) }), _jsxs("section", { className: "dc-section dc-results-section", children: [_jsx(SectionHeading, { title: "\u6807\u6CE8\u51B2\u7A81" }), _jsx("div", { className: "dc-results-body", children: !selectedJob ? (_jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u6CA1\u6709\u7ED3\u679C" })) : selectedJob.status !== 'COMPLETED' ? (_jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u4F5C\u4E1A\u6CA1\u6709\u5DF2\u53D1\u5E03\u7ED3\u679C" })) : conflictsLoading ? (_jsx("p", { className: "iad-result-empty", role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u7ED3\u679C\u2026" })) : !jobConflicts.length ? (_jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u6CA1\u6709\u7ED3\u679C" })) : (_jsxs(_Fragment, { children: [_jsx(TabBar, { label: "\u539F\u59CB\u6807\u6CE8\u51B2\u7A81\u7C7B\u578B", value: kind, onChange: value => { setKind(value); setPage(1); }, items: conflictTabs.map(tab => ({ id: tab.value, label: _jsxs(_Fragment, { children: [_jsx("span", { children: tab.label }), _jsx("span", { className: "iad-tab-count", children: tab.value === 'all' ? jobConflicts.length : jobConflicts.filter(conflict => conflict.types.some(type => type === tab.value)).length })] }), buttonProps: { 'data-dc': 'raw-tab', 'data-id': tab.value } })) }), _jsxs("div", { className: "dc-refined-filterbar", role: "group", "aria-label": "\u51B2\u7A81\u7B5B\u9009", children: [_jsxs("label", { className: "dc-filter-field dc-search-field", children: ["\u6587\u4EF6\u540D\u641C\u7D22", _jsx("input", { type: "search", id: "dc-filename-search", "aria-label": "\u6587\u4EF6\u540D\u641C\u7D22", placeholder: "\u641C\u7D22\u6587\u4EF6\u540D", autoComplete: "off", style: { height: '38px', minHeight: '38px', maxHeight: '38px', boxSizing: 'border-box' }, value: search, onChange: e => {
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
                                                    } })] }), paginatedConflicts.length ? (_jsx("div", { className: "iad-thumbnail-grid dc-conflict-grid", children: paginatedConflicts.map(c => (_jsx(ThumbnailCard, { src: c.url, variant: "comparison", label: c.filename, "data-dc": "open-conflict", "data-id": c.id, "aria-label": `${c.filename}，原始结论：${c.type}；模型结论：${c.model.modelType}`, onClick: () => { setCurrentConflictId(c.id); setModal('compare'); }, children: _jsxs("span", { className: "iad-thumbnail-values", "aria-label": "\u539F\u59CB\u7ED3\u8BBA\u4E0E\u6A21\u578B\u7ED3\u8BBA", children: [_jsx("span", { title: `原始结论：${c.type}`, children: c.type }), _jsx("span", { title: `模型结论：${c.model.modelType}`, children: c.model.modelType })] }) }, c.id))) })) : (_jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u51B2\u7A81\u56FE\u7EC4\u3002" })), _jsx(Pagination, { total: visibleConflicts.length, page: currentPage, size: 18, unit: "\u7EC4", onPage: setPage })] })) })] })] }), modal === 'new' && (_jsxs(Modal, { title: "\u65B0\u5EFA\u4E00\u81F4\u6027\u68C0\u67E5", size: "form", id: "dc-new-mask", className: "dc-dialog dc-new-dialog", onClose: () => setModal(''), header: false, children: [_jsxs("header", { className: "dc-dialog-head", children: [_jsx("h2", { id: "dc-new-title", children: "\u65B0\u5EFA\u4E00\u81F4\u6027\u68C0\u67E5" }), _jsx(IconButton, { icon: "close", type: "button", title: "\u5173\u95ED", label: "\u5173\u95ED", onClick: () => {
                                    setModal('');
                                } })] }), _jsxs("div", { className: "dc-dialog-body dc-new-body", children: [_jsxs("div", { className: "dc-new-field", children: [_jsx("span", { children: "\u6570\u636E\u96C6" }), _jsx("div", { className: "dc-new-parent", children: currentParent?.name || '—' })] }), _jsxs("div", { className: "dc-new-field", children: [_jsx("span", { children: "\u5B50\u6570\u636E\u96C6" }), _jsx(MultiSelect, { id: "dc-new-child-trigger", menuId: "dc-new-child-options", label: "\u5B50\u6570\u636E\u96C6", options: currentChildDatasets.map(item => ({ value: item.dataset_id, label: item.name })), selected: modalChildIds, onToggle: id => setModalChildIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]), disabled: newCheckBusy })] }), _jsxs("div", { className: "dc-new-field dc-prompt-editor", children: [(error || polling.error || programs.some(program => program.error)) && _jsx("p", { role: "alert", className: "iad-error", children: error || polling.error || message(programs.find(program => program.error)?.error) }), _jsx("label", { htmlFor: "dc-new-prompt", children: "\u6A21\u578B\u5206\u6790\u63D0\u793A\u8BCD" }), _jsx("textarea", { id: "dc-new-prompt", rows: 9, spellCheck: false, "aria-label": "\u6A21\u578B\u5206\u6790\u63D0\u793A\u8BCD", value: newPrompt, onChange: e => setNewPrompt(e.target.value) })] })] }), _jsxs("footer", { className: "dc-dialog-footer", children: [_jsx(Button, { type: "button", "data-dc": "close-new", onClick: () => {
                                    setModal('');
                                }, children: "\u53D6\u6D88" }), _jsx(Button, { type: "button", variant: "primary", "data-dc": "create-job", disabled: !modalChildIds.length || !newPrompt.trim() || newCheckBusy, onClick: handleCreateJob, children: newCheckBusy ? '启动中…' : '开始检查' })] })] })), modal === 'compare' && currentConflict && _jsx(ConsistencyConflictDialog, { conflict: currentConflict, items: visibleConflicts, queryId: activeQueryId, onSelect: setCurrentConflictId, onClose: () => setModal(''), onReviewed: () => setRevision(value => value + 1) }), promptJob && _jsx(PromptDrawer, { title: "\u67E5\u770B\u63D0\u793A\u8BCD", text: promptJob.analysis.consistency_prompt || '该作业没有保存提示词。', onClose: () => setPromptJob(null) }), !!statsModalJobId && _jsx(ConsistencyStatisticsDialog, { items: jobConflicts, onFilter: handleStatClick, onClose: () => setStatsModalJobId('') }), statusJobId && batches.some(job => job.analysis.root_run_id === statusJobId) && _jsx(JobStatusDrawer, { job: batches.find(job => job.analysis.root_run_id === statusJobId).analysis, onClose: () => setStatusJobId('') })] }));
}
