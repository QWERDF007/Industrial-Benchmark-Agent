import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SectionHeading } from './layout/SectionHeading.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { TabBar } from './layout/TabBar.js';
import { Button } from './Button.js';
import { ThumbnailCard } from "./ThumbnailCard.js";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { auditStateLabels, auditIssueLabels, auditAssessmentLabels } from '../../shared/audit.generated.js';
import { buildHierarchyGroups, getDatasetGroupId } from '../dataset-hierarchy.js';
import { useJobs } from '../useJobs.js';
import { useResource } from '../useResource.js';
import { useJobList } from '../useJobList.js';
import { useWorkspace } from '../workspace.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { PageTabs } from './layout/PageTabs.js';
import { RefreshIconButton, ClearFilterButton } from './CommonFilterControls.js';
import { JobList } from './JobList.js';
import { AuditStatisticsDrawer } from './AuditStatisticsDrawer.js';
import { AuditReport } from './AuditReport.js';
import { AuditSampleDialog } from './AuditSampleDialog.js';
import { auditSampleImage } from './AuditSampleMedia.js';
import { AuditPromptDrawer } from './AuditPromptDrawer.js';
import { AuditSetup } from './AuditSetup.js';
import { Select } from './Select.js';
import { Pagination } from './Pagination.js';
import { JobStatusDrawer } from './JobStatusDrawer.js';
import { request } from '../api.js';
export function AuditPage({ dataset, datasets, groups, refreshRevision, onDatasetsChanged }) {
    const { workspace } = useWorkspace();
    const view = workspace.view('industrial-audit');
    const hierarchy = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
    const groupId = hierarchy.find(group => group.group_id === view.datasetGroupId)?.group_id ?? getDatasetGroupId(dataset);
    const children = useMemo(() => datasets.filter(item => getDatasetGroupId(item) === groupId), [datasets, groupId]);
    const ids = (view.datasetIds ?? [dataset.dataset_id]).filter(id => children.some(child => child.dataset_id === id));
    const scope = JSON.stringify([...ids].sort());
    const [tab, setTab] = useState('audit');
    const [revision, setRevision] = useState(0);
    const [promptJob, setPromptJob] = useState('');
    const progress = useCallback(() => setRevision(value => value + 1), []);
    const jobs = useJobs('audit', ids, progress, view.job, refreshRevision);
    const selection = useJobList(jobs.jobs, scope, view.job, job => workspace.updateView('industrial-audit', { job: job.root_run_id }));
    const [statisticsJob, setStatisticsJob] = useState(null);
    const job = selection.selected;
    const [issueType, setIssueType] = useState(''), [sourceAssessment, setSourceAssessment] = useState('');
    const [search, setSearch] = useState(''), [status, setStatus] = useState('all'), [page, setPage] = useState(1);
    const createOpen = view.tab === 'setup';
    const setCreateOpen = (open) => workspace.updateView('industrial-audit', { tab: open ? 'setup' : 'results' });
    const [jobDetails, setJobDetails] = useState(null);
    const [creatingBusy, setCreatingBusy] = useState(false);
    const [sample, setSample] = useState(null);
    const [imageIndex, setImageIndex] = useState(null);
    const pendingMove = useRef(null);
    useEffect(() => { setPage(1); setSearch(''); setStatus('all'); setIssueType(''); setSourceAssessment(''); setSample(null); setImageIndex(null); pendingMove.current = null; }, [job?.run_id]);
    const query = new URLSearchParams({ page: String(page), page_size: '18', status, search, ...(issueType ? { issue_type: issueType } : {}), ...(sourceAssessment ? { consistency_assessment: sourceAssessment } : {}) });
    const result = useResource(job && !createOpen && tab === 'audit'
        ? `/audit/jobs/${encodeURIComponent(job.run_id)}/samples?${query}` : null, revision);
    useEffect(() => {
        if (!result.loading && pendingMove.current) {
            if (result.data && !result.error)
                setSample(pendingMove.current === 1 ? result.data.items[0] || null : result.data.items.at(-1) || null);
            pendingMove.current = null;
        }
    }, [result.data, result.loading, result.error]);
    const position = result.data?.items.findIndex(item => item.sample_id === sample?.sample_id) ?? -1;
    function moveSample(offset) {
        if (position < 0 || result.loading || pendingMove.current || !result.data)
            return;
        const next = result.data.items[position + offset];
        if (next) {
            setSample(next);
            setImageIndex(0);
        }
        else if ((offset < 0 && page > 1) || (offset > 0 && page * 18 < result.data.total)) {
            pendingMove.current = offset;
            setImageIndex(0);
            setPage(page + offset);
        }
    }
    const hasResults = !!job && job.total_samples > 0 && !result.data?.archived;
    const setupDatasets = datasets.filter(item => ids.includes(item.dataset_id));
    const refresh = () => { jobs.refresh(); progress(); onDatasetsChanged(); };
    return _jsxs("div", { id: "audit-page", children: [_jsx(WorkbenchHeader, { pageId: "industrial-audit", className: "audit-heading", title: createOpen ? '新建审计' : undefined, children: createOpen
                    ? _jsx(Button, { type: "button", disabled: creatingBusy, onClick: () => setCreateOpen(false), children: "\u8FD4\u56DE\u4F5C\u4E1A\u4E0E\u7ED3\u679C" })
                    : _jsx(Button, { id: "audit-new", variant: "primary", type: "button", disabled: !ids.length, title: "\u65B0\u5EFA\u5BA1\u8BA1", onClick: () => setCreateOpen(true), children: "\u65B0\u5EFA\u5BA1\u8BA1" }) }), _jsx(DatasetScopeSelector, { groups: hierarchy, selectedGroupId: groupId, onGroupChange: next => {
                    const first = datasets.find(item => getDatasetGroupId(item) === next);
                    workspace.openLocation({ pageId: 'industrial-audit', datasetId: first?.dataset_id || dataset.dataset_id,
                        datasetGroupId: next, datasetIds: first ? [first.dataset_id] : [], job: '', tab: 'results' });
                }, childDatasets: children, selectedChildIds: ids, onChildToggle: id => {
                    const next = ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
                    workspace.openLocation({ pageId: 'industrial-audit', datasetId: next[0] || dataset.dataset_id,
                        datasetGroupId: groupId, datasetIds: next, job: '', tab: 'results' });
                }, disabled: createOpen, className: "audit-scope", groupId: "audit-dataset", childId: "audit-child-trigger", childMenuId: "audit-child-menu", children: _jsx(RefreshIconButton, { onClick: refresh }) }), jobs.error && _jsx("p", { role: "alert", children: jobs.error }), createOpen ? _jsx(AuditSetup, { datasets: setupDatasets, availableDatasets: datasets, jobs: jobs.jobs, revision: revision + refreshRevision, onBusyChange: setCreatingBusy, onCancel: () => setCreateOpen(false), onStarted: started => {
                    workspace.updateView('industrial-audit', { job: started[0]?.run_id || '' });
                    selection.clear();
                    setCreateOpen(false);
                    setTab('audit');
                    refresh();
                } }, scope) : _jsxs(PageTabs, { label: "\u5BA1\u8BA1\u89C6\u56FE", className: "audit-tabs", items: [{ id: 'audit', label: '模型审计' }, { id: 'reports', label: '报告' }], value: tab, onChange: setTab, children: [_jsxs("div", { hidden: tab !== 'audit', children: [_jsx(JobList, { title: "\u5BA1\u8BA1\u4F5C\u4E1A", list: selection, datasets: datasets, loading: jobs.loading, actions: {
                                    status: setJobDetails, prompt: job => setPromptJob(job.run_id), delete: async (job) => {
                                        await request(`/audit/delete/${encodeURIComponent(job.run_id)}`, {});
                                        refresh();
                                    }, additional: [{ id: 'statistics', label: '统计', icon: 'stats', onClick: setStatisticsJob }],
                                } }), _jsxs("section", { className: "audit-panel", "aria-label": "\u5BA1\u8BA1\u7ED3\u679C", children: [_jsx(SectionHeading, { title: "\u5BA1\u8BA1\u7ED3\u679C", children: hasResults && _jsxs("div", { className: "audit-filters", children: [_jsxs("label", { className: "audit-field", children: [_jsx("span", { children: "\u6587\u4EF6\u540D" }), _jsx("input", { type: "search", "aria-label": "\u641C\u7D22\u5BA1\u8BA1\u56FE\u50CF", value: search, onChange: event => { setSearch(event.target.value); setPage(1); } })] }), _jsxs("label", { className: "audit-field", children: [_jsx("span", { children: "\u95EE\u9898\u7C7B\u522B" }), _jsxs(Select, { "aria-label": "\u5BA1\u8BA1\u95EE\u9898\u7C7B\u522B", value: issueType, onChange: event => { setIssueType(event.target.value); setPage(1); }, children: [_jsx("option", { value: "", children: "\u5168\u90E8\u7C7B\u522B" }), Object.entries(auditIssueLabels).map(([value, label]) => _jsx("option", { value: value, children: label }, value))] })] }), result.data?.audit_scope !== 'consistency' && _jsxs("label", { className: "audit-field", children: [_jsx("span", { children: "\u4E00\u81F4\u6027\u6838\u5BF9" }), _jsxs(Select, { "aria-label": "\u4E00\u81F4\u6027\u5DEE\u5F02\u5904\u7406", value: sourceAssessment, onChange: event => { setSourceAssessment(event.target.value); setPage(1); }, children: [_jsx("option", { value: "", children: "\u5168\u90E8\u5904\u7406" }), Object.entries(auditAssessmentLabels).map(([value, label]) => _jsx("option", { value: value, children: label }, value))] })] }), _jsx(ClearFilterButton, { onClick: () => { setIssueType(''); setSourceAssessment(''); setSearch(''); setStatus('all'); setPage(1); } })] }) }), hasResults && _jsx(TabBar, { label: "\u5BA1\u8BA1\u56FE\u50CF\u72B6\u6001", value: status, onChange: value => { setStatus(value); setPage(1); }, items: ['all', ...Object.keys(result.data?.distribution || {})].map(value => ({ id: value,
                                            label: _jsxs(_Fragment, { children: [value === 'all' ? '全部图像' : (result.data?.audit_scope === 'consistency' && value === 'suspect' ? '标注冲突' : auditStateLabels[value]), result.data && _jsx("span", { className: "iad-tab-count", children: value === 'all'
                                                            ? Object.values(result.data.distribution).reduce((sum, value) => sum + value, 0) : result.data.distribution[value] })] }) })) }), _jsxs("div", { id: "audit-images", children: [!job && _jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u6CA1\u6709\u7ED3\u679C" }), result.loading && _jsx("p", { className: "audit-empty", role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u4F5C\u4E1A\u56FE\u50CF\u2026" }), result.error && _jsx("p", { role: "alert", children: result.error }), result.data?.archived && _jsx("p", { children: "\u5386\u53F2\u5BA1\u8BA1\u5DF2\u5F52\u6863\uFF0C\u53EF\u5728\u62A5\u544A\u9875\u4E0B\u8F7D\u51BB\u7ED3\u62A5\u544A\u3002" }), job && result.data && !result.data.archived && _jsxs(_Fragment, { children: [_jsx("div", { className: "iad-thumbnail-grid", children: result.data.items.map(item => _jsx(ThumbnailCard, { src: auditSampleImage(item, job.task_id), label: item.filename.split('/').pop(), onClick: () => { setImageIndex(null); setSample(item); }, "data-sample-id": item.sample_id }, item.sample_id)) }), _jsx(Pagination, { total: result.data.total, page: page, size: 18, unit: "\u5F20\u56FE\u50CF", onPage: setPage })] })] })] })] }), tab === 'reports' && _jsx(AuditReport, { job: job, revision: revision }, job?.run_id)] }), statisticsJob && _jsx(AuditStatisticsDrawer, { job: jobs.jobs.find(job => job.run_id === statisticsJob.run_id) || statisticsJob, revision: revision, onClose: () => setStatisticsJob(null) }), promptJob && _jsx(AuditPromptDrawer, { runId: promptJob, onClose: () => setPromptJob('') }), sample && _jsx(AuditSampleDialog, { sample: sample, taskId: datasets.find(item => item.dataset_id === sample.dataset_id)?.task_id || dataset.task_id, imageIndex: imageIndex, onImageIndexChange: setImageIndex, navigation: { previous: position >= 0 && (position > 0 || page > 1),
                    next: position >= 0 && (position < (result.data?.items.length || 0) - 1 || page * 18 < (result.data?.total || 0)),
                    busy: result.loading || pendingMove.current !== null, error: result.error, move: moveSample }, onClose: () => { pendingMove.current = null; setSample(null); setImageIndex(null); } }, `${sample.run_id}:${sample.sample_id}`), jobDetails && _jsx(JobStatusDrawer, { job: jobs.jobs.find(job => job.root_run_id === jobDetails.root_run_id) || jobDetails, onClose: () => setJobDetails(null), stale: jobs.syncState === 'stale' })] });
}
