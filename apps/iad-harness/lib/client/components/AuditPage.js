import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SectionHeading } from './layout/SectionHeading.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { TabBar } from './layout/TabBar.js';
import { Button } from './Button.js';
import { ThumbnailCard } from "./ThumbnailCard.js";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { auditStateLabels } from '../../shared/audit.generated.js';
import { buildHierarchyGroups, getDatasetGroupId } from '../dataset-hierarchy.js';
import { useJobs } from '../useJobs.js';
import { useResource } from '../useResource.js';
import { useAuditJobSelection } from '../useAuditJobSelection.js';
import { useWorkspace } from '../workspace.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { PageTabs } from './layout/PageTabs.js';
import { RefreshIconButton, ClearFilterButton } from './CommonFilterControls.js';
import { AuditJobs } from './AuditJobs.js';
import { AuditReport } from './AuditReport.js';
import { AuditSampleDialog } from './AuditSampleDialog.js';
import { auditSampleImage } from './AuditSampleMedia.js';
import { AuditSetup } from './AuditSetup.js';
import { Pagination } from './Pagination.js';
import { JobStatusDrawer } from './JobStatusDrawer.js';
export function AuditPage({ dataset, datasets, groups, refreshRevision, onDatasetsChanged }) {
    const { workspace } = useWorkspace();
    const hierarchy = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
    const [groupId, setGroupId] = useState(() => getDatasetGroupId(dataset));
    const children = useMemo(() => datasets.filter(item => getDatasetGroupId(item) === groupId), [datasets, hierarchy, groupId]);
    const [selectedIds, setSelectedIds] = useState([dataset.dataset_id]);
    const ids = selectedIds.filter(id => children.some(child => child.dataset_id === id));
    const scope = JSON.stringify([...ids].sort());
    const [tab, setTab] = useState('audit');
    const [revision, setRevision] = useState(0);
    const progress = useCallback(() => setRevision(value => value + 1), []);
    const jobs = useJobs('audit', ids, progress, '', refreshRevision);
    const selection = useAuditJobSelection(jobs.jobs, scope);
    const job = selection.selected;
    const [search, setSearch] = useState(''), [status, setStatus] = useState('all'), [page, setPage] = useState(1);
    const createOpen = workspace.view('industrial-audit').tab === 'setup';
    const setCreateOpen = (open) => workspace.updateView('industrial-audit', { tab: open ? 'setup' : 'results' });
    const [jobDetails, setJobDetails] = useState(null);
    const [creatingBusy, setCreatingBusy] = useState(false);
    const [sample, setSample] = useState(null);
    useEffect(() => { setPage(1); setSearch(''); setStatus('all'); setSample(null); }, [job?.run_id]);
    useEffect(() => {
        if (!hierarchy.some(group => group.group_id === groupId)) {
            const next = hierarchy[0]?.group_id || '';
            setGroupId(next);
            setSelectedIds(datasets.filter(item => getDatasetGroupId(item) === next).slice(0, 1).map(item => item.dataset_id));
        }
    }, [datasets, hierarchy, groupId]);
    const query = new URLSearchParams({ page: String(page), page_size: '18', status, search });
    const readable = !!job && (job.completed > 0 || !['PENDING', 'RUNNING'].includes(job.status));
    const result = useResource(readable && job && !createOpen && tab === 'audit'
        ? `/audit/jobs/${encodeURIComponent(job.run_id)}/samples?${query}` : null, revision);
    const hasResults = readable && !!result.data && Object.values(result.data.distribution).some(value => value > 0);
    const setupDatasets = datasets.filter(item => ids.includes(item.dataset_id));
    const refresh = () => { jobs.refresh(); progress(); onDatasetsChanged(); };
    return _jsxs("div", { id: "audit-page", children: [_jsx(WorkbenchHeader, { pageId: "industrial-audit", className: "audit-heading", title: createOpen ? '新建审计' : undefined, children: createOpen
                    ? _jsx(Button, { type: "button", disabled: creatingBusy, onClick: () => setCreateOpen(false), children: "\u8FD4\u56DE\u4F5C\u4E1A\u4E0E\u7ED3\u679C" })
                    : _jsx(Button, { variant: "primary", type: "button", disabled: !ids.length, title: "\u65B0\u5EFA\u5BA1\u8BA1", onClick: () => {
                            workspace.selectDataset(ids[0]);
                            setCreateOpen(true);
                        }, children: "\u65B0\u5EFA\u5BA1\u8BA1" }) }), _jsx(DatasetScopeSelector, { groups: hierarchy, selectedGroupId: groupId, onGroupChange: next => {
                    setGroupId(next);
                    setSelectedIds(datasets.filter(item => getDatasetGroupId(item) === next).slice(0, 1).map(item => item.dataset_id));
                }, childDatasets: children, selectedChildIds: ids, onChildToggle: id => setSelectedIds(previous => previous.includes(id)
                    ? previous.filter(value => value !== id) : [...previous, id]), disabled: createOpen, className: "audit-scope", groupId: "audit-dataset", childId: "audit-child-trigger", childMenuId: "audit-child-menu", children: _jsx(RefreshIconButton, { onClick: refresh }) }), jobs.error && _jsx("p", { role: "alert", children: jobs.error }), createOpen ? _jsx(AuditSetup, { datasets: setupDatasets, jobs: jobs.jobs, revision: revision + refreshRevision, onBusyChange: setCreatingBusy, onCancel: () => setCreateOpen(false), onStarted: started => {
                    workspace.updateView('industrial-audit', { job: started[0]?.run_id || '' });
                    selection.clear();
                    setCreateOpen(false);
                    setTab('audit');
                    refresh();
                } }, scope) : _jsxs(PageTabs, { label: "\u5BA1\u8BA1\u89C6\u56FE", className: "audit-tabs", items: [{ id: 'audit', label: '模型审计' }, { id: 'reports', label: '报告' }], value: tab, onChange: setTab, children: [_jsxs("div", { hidden: tab !== 'audit', children: [_jsx(AuditJobs, { loading: jobs.loading, selection: selection, datasets: datasets, onDetails: setJobDetails }), _jsxs("section", { className: "audit-panel", "aria-label": "\u5BA1\u8BA1\u7ED3\u679C", children: [_jsx(SectionHeading, { title: "\u5BA1\u8BA1\u7ED3\u679C", children: hasResults && _jsxs("div", { className: "audit-filters", children: [_jsxs("label", { className: "audit-field", children: [_jsx("span", { children: "\u6587\u4EF6\u540D" }), _jsx("input", { type: "search", "aria-label": "\u641C\u7D22\u5BA1\u8BA1\u56FE\u50CF", value: search, onChange: event => { setSearch(event.target.value); setPage(1); } })] }), _jsx(ClearFilterButton, { onClick: () => { setSearch(''); setStatus('all'); setPage(1); } })] }) }), hasResults && _jsx(TabBar, { label: "\u5BA1\u8BA1\u56FE\u50CF\u72B6\u6001", value: status, onChange: value => { setStatus(value); setPage(1); }, items: ['all', ...Object.keys(auditStateLabels)].map(value => ({ id: value,
                                            label: _jsxs(_Fragment, { children: [value === 'all' ? '全部图像' : auditStateLabels[value], result.data && _jsx("span", { className: "iad-tab-count", children: value === 'all'
                                                            ? Object.values(result.data.distribution).reduce((sum, value) => sum + value, 0) : result.data.distribution[value] })] }) })) }), _jsxs("div", { id: "audit-images", children: [!job && _jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u6CA1\u6709\u7ED3\u679C" }), job && !readable && _jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u4F5C\u4E1A\u5C1A\u672A\u4EA7\u751F\u5BA1\u8BA1\u7EC8\u7A3F" }), result.loading && _jsx("p", { className: "audit-empty", role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u4F5C\u4E1A\u56FE\u50CF\u2026" }), result.error && _jsx("p", { role: "alert", children: result.error }), job && result.data && _jsxs(_Fragment, { children: [_jsx("div", { className: "iad-thumbnail-grid", children: result.data.items.map(item => _jsx(ThumbnailCard, { src: auditSampleImage(item, job.task_id), label: item.filename, onClick: () => setSample(item), "data-sample-id": item.sample_id }, item.sample_id)) }), !result.data.items.length && _jsx("p", { className: "audit-empty", children: "\u6CA1\u6709\u5339\u914D\u7684\u5BA1\u8BA1\u56FE\u50CF\u3002" }), _jsx(Pagination, { total: result.data.total, page: page, size: 18, unit: "\u5F20\u56FE\u50CF", onPage: setPage })] })] })] })] }), tab === 'reports' && _jsx(AuditReport, { job: job, revision: revision, onSample: setSample }, job?.run_id)] }), sample && _jsx(AuditSampleDialog, { sample: sample, taskId: datasets.find(item => item.dataset_id === sample.dataset_id)?.task_id || dataset.task_id, onClose: () => setSample(null) }, `${sample.run_id}:${sample.sample_id}`), jobDetails && _jsx(JobStatusDrawer, { job: jobs.jobs.find(job => job.root_run_id === jobDetails.root_run_id) || jobDetails, onClose: () => setJobDetails(null), stale: jobs.syncState === 'stale' })] });
}
