import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { jobIsActive } from '../../shared/job-display.js';
import { SectionHeading } from './layout/SectionHeading.js';
import { AnalysisExportButton } from './AnalysisExportButton.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { v4 as uuid } from 'uuid';
import { AnalysisPromptDrawer } from './AnalysisPromptDrawer.js';
import { Select } from './Select.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { useQueries } from '@tanstack/react-query';
import { queryClient } from '../query-client.js';
import { Button } from './Button.js';
import { IconButton } from "./IconButton.js";
import { Pagination } from "./Pagination.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { message, request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useResource } from "../useResource.js";
import { useDatasetCatalog } from '../useDatasetCatalog.js';
import { useWorkspace } from "../workspace.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import { JobList } from './JobList.js';
import { useJobList } from '../useJobList.js';
import { JobStatusDrawer } from './JobStatusDrawer.js';
import { KnowledgeEntryDialog } from "./KnowledgeEntryDialog.js";
import { KnowledgeMiningCreate } from "./KnowledgeMiningCreate.js";
import { KnowledgeConfirmation } from "./KnowledgeConfirmation.js";
import { ClearFilterButton, RefreshIconButton } from "./CommonFilterControls.js";
export function KnowledgePage({ dataset, refreshRevision }) {
    const { workspace } = useWorkspace();
    const pageId = "industrial-knowledge";
    const view = workspace.view(pageId);
    const catalog = useDatasetCatalog();
    const datasets = catalog.data?.datasets || [dataset], groups = catalog.data?.groups || [];
    // Hierarchy
    const selectedParentId = getDatasetGroupId(dataset);
    const selectedChildIds = view.datasetIds ?? [dataset.dataset_id];
    const scopeKey = JSON.stringify(selectedChildIds);
    // Jobs & Knowledge hooks
    const [revision, setRevision] = useState(0);
    const updated = useCallback(() => setRevision(v => v + 1), []);
    const polling = useJobs("knowledge", selectedChildIds, updated, view.job);
    const versionResources = useQueries({ queries: selectedChildIds.map(dataset_id => {
            const path = `/knowledge/versions?${new URLSearchParams({ dataset_id })}`;
            return { queryKey: ['iad', 'resource', path], queryFn: () => request(path) };
        }) }, queryClient);
    const versions = [...new Map(versionResources.flatMap(result => result.data?.versions || []).map(version => [version.version_id, version])).values()];
    const versionError = versionResources.find(result => result.error)?.error;
    useEffect(() => {
        for (const dataset_id of JSON.parse(scopeKey))
            void queryClient.invalidateQueries({ queryKey: ['iad', 'resource', `/knowledge/versions?${new URLSearchParams({ dataset_id })}`], exact: true });
    }, [scopeKey, revision, refreshRevision]);
    const loadError = catalog.error;
    const [jobDetails, setJobDetails] = useState(null);
    const jobList = useJobList(polling.jobs, scopeKey, view.job, job => selectJob(job.run_id));
    const selectedJob = jobList.selected;
    // Lower panel search & filter
    const [knowledgeSearch, setKnowledgeSearch] = useState("");
    const [knowledgeStatus, setKnowledgeStatus] = useState("all");
    const [entryPage, setEntryPage] = useState(1);
    // Modals & Drawers
    const [promptJob, setPromptJob] = useState(null);
    const [detailItem, setDetailItem] = useState(null);
    const [confirmState, setConfirmState] = useState(null);
    const createOpen = view.tab === 'setup';
    const [toastMsg, setToastMsg] = useState("");
    const toast = useCallback((msg) => setToastMsg(msg), []);
    useEffect(() => { if (!toastMsg)
        return; const timer = setTimeout(() => setToastMsg(""), 2800); return () => clearTimeout(timer); }, [toastMsg]);
    // Current scope datasets
    const parentGroups = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
    const currentChildDatasets = useMemo(() => {
        return datasets.filter(d => getDatasetGroupId(d) === selectedParentId);
    }, [datasets, groups, selectedParentId]);
    const handleParentChange = (parentId) => {
        const children = datasets.filter(d => getDatasetGroupId(d) === parentId);
        if (children.length)
            workspace.openLocation({ pageId, datasetId: children[0].dataset_id,
                datasetIds: children.map(child => child.dataset_id), job: '', version: '', tab: 'results' });
    };
    const handleChildToggle = (childId) => {
        const next = selectedChildIds.includes(childId) ? selectedChildIds.filter(id => id !== childId) : [...selectedChildIds, childId];
        workspace.openLocation({ pageId, datasetId: next[0] || dataset.dataset_id, datasetIds: next, job: '', version: '', tab: 'results' });
    };
    const handleRefresh = () => {
        polling.refresh();
        updated();
        toast("已刷新当前数据");
    };
    function selectJob(id) {
        workspace.updateView(pageId, { job: id, version: '' });
        setEntryPage(1);
        setKnowledgeSearch('');
        setKnowledgeStatus('all');
    }
    const resultVersions = useMemo(() => {
        if (!selectedJob?.knowledge_version_id)
            return [];
        const ids = new Set([selectedJob.knowledge_version_id,
            ...versions.filter(version => version.source_run_id === selectedJob.run_id).map(version => version.version_id)]);
        let changed = true;
        while (changed) {
            changed = false;
            for (const version of versions)
                if (version.manually_edited && version.parent_version_id && ids.has(version.parent_version_id) && !ids.has(version.version_id)) {
                    ids.add(version.version_id);
                    changed = true;
                }
        }
        return versions.filter(version => ids.has(version.version_id));
    }, [versions, selectedJob?.knowledge_version_id]);
    const selectedVersionId = view.job === selectedJob?.run_id && resultVersions.some(version => version.version_id === view.version)
        ? view.version : jobIsActive(selectedJob) ? null : selectedJob?.knowledge_version_id;
    const results = useResource(selectedJob ? `/analysis/results/${encodeURIComponent(selectedJob.run_id)}` : null, `${revision}:${refreshRevision}:${selectedJob?.status}:${selectedJob?.analysis_version_id}`, jobIsActive(selectedJob));
    const preview = selectedVersionId ? null : results.data?.current;
    const readSource = selectedVersionId ? { kind: 'published', versionId: selectedVersionId } : preview ? { kind: 'current', view: preview } : null;
    const canMaintain = !!selectedVersionId && versionResources.some(result => result.data?.current_version_id === selectedVersionId);
    const checkQuery = new URLSearchParams({ version_id: selectedVersionId || '', page: String(entryPage), page_size: '8', search: knowledgeSearch, review_status: knowledgeStatus });
    const checksResource = useResource(selectedVersionId ? `/knowledge/details?${checkQuery}` : null, revision + refreshRevision);
    const previewChecks = preview?.checks.filter(check => (!knowledgeSearch || `${check.title} ${check.criterion}`.toLocaleLowerCase().includes(knowledgeSearch.toLocaleLowerCase()))
        && (knowledgeStatus === 'all' || knowledgeStatus === check.review.status || knowledgeStatus === 'conflict' && check.status === 'conflicted')) || [];
    const totalChecks = selectedVersionId ? checksResource.data?.total || 0 : previewChecks.length;
    const maxEntryPages = Math.max(1, Math.ceil(totalChecks / 8));
    const currentEntryPage = Math.min(maxEntryPages, Math.max(1, entryPage));
    const filteredChecks = selectedVersionId ? checksResource.data?.items || [] : previewChecks.slice((currentEntryPage - 1) * 8, currentEntryPage * 8);
    useEffect(() => { if (entryPage > maxEntryPages && !checksResource.loading)
        setEntryPage(maxEntryPages); }, [entryPage, maxEntryPages, checksResource.loading]);
    const pagedChecks = filteredChecks.map(check => ({ id: check.check_id, name: check.title,
        summary: check.criterion, supportCount: check.support_count, counterCount: check.counter_count, review: check.review }));
    useEffect(() => { setDetailItem(null); }, [scopeKey, selectedJob?.run_id]);
    useEffect(() => { setEntryPage(1); }, [selectedJob?.run_id, selectedVersionId]);
    // Prompt drawer handlers
    const closePrompt = () => setPromptJob(null);
    const openDetail = (item) => { if (readSource)
        setDetailItem({ source: readSource, checkId: item.id }); };
    const closeDetail = () => setDetailItem(null);
    const askDeleteEntry = (item) => {
        if (!selectedVersionId || !selectedJob)
            return;
        setConfirmState({ title: '移除知识条目', message: `从当前知识中移除“${item.name}”并生成维护版本？`, danger: true,
            onConfirm: async () => {
                try {
                    const version = await request(`/knowledge/versions/${encodeURIComponent(selectedVersionId)}/checks/remove`, { submission_id: uuid(), check_id: item.id });
                    workspace.updateView(pageId, { job: selectedJob.run_id, version: version.version_id });
                    updated();
                    toast('已生成维护版本');
                }
                catch (error) {
                    toast(message(error));
                }
            } });
    };
    const openCreate = () => workspace.updateView(pageId, { tab: 'setup' });
    return (_jsx("div", { id: "knowledge-page", className: "iad-knowledge-page", children: _jsxs("div", { className: `kb-v45 v46-app ${createOpen ? "kb-creating" : ""}`, children: [_jsx("div", { className: "kb-v45-main", children: _jsxs("div", { className: "main-inner", children: [!createOpen && _jsxs(_Fragment, { children: [_jsx(WorkbenchHeader, { pageId: "industrial-knowledge", className: "topline", children: _jsx("div", { className: "actions", children: _jsx(Button, { variant: "primary", id: "create-btn", disabled: !selectedChildIds.length, onClick: openCreate, children: "\uFF0B \u65B0\u5EFA\u6316\u6398" }) }) }), _jsxs(DatasetScopeSelector, { className: "context", groups: parentGroups, selectedGroupId: selectedParentId, onGroupChange: handleParentChange, childDatasets: currentChildDatasets, selectedChildIds: selectedChildIds, onChildToggle: handleChildToggle, groupId: "dataset", childId: "subset", childMenuId: "subset-menu", children: [_jsx("div", { className: "kb-context-actions", children: _jsx(RefreshIconButton, { id: "kb-refresh", title: "\u5237\u65B0\u5F53\u524D\u9875\u9762", ariaLabel: "\u5237\u65B0\u5F53\u524D\u9875\u9762", onClick: handleRefresh }) }), _jsx("div", { className: "context-info", id: "dataset-info" })] }), _jsx(JobList, { title: "\u6316\u6398\u4F5C\u4E1A", list: jobList, datasets: datasets, loading: polling.loading, actions: {
                                            status: job => setJobDetails(job.root_run_id), prompt: setPromptJob, delete: async (job) => {
                                                await request(`/analysis/delete/${encodeURIComponent(job.run_id)}`, {});
                                                polling.refresh();
                                                updated();
                                            },
                                        } }), _jsxs("section", { className: "panel", id: "knowledge-panel", "aria-labelledby": "knowledge-heading", children: [_jsxs(SectionHeading, { title: "\u77E5\u8BC6\u6761\u76EE", titleId: "knowledge-heading", children: [selectedVersionId?.startsWith('analysis_version_') && _jsx(AnalysisExportButton, { versionId: selectedVersionId }), (selectedVersionId ? versions.find(version => version.version_id === selectedVersionId)?.check_count : preview?.checks.length) ? (_jsxs("div", { className: "filterset", id: "knowledge-filterset", children: [_jsx("input", { className: "f", id: "knowledge-search", placeholder: "\u641C\u7D22\u77E5\u8BC6\u6761\u76EE", "aria-label": "\u641C\u7D22\u77E5\u8BC6\u6761\u76EE", value: knowledgeSearch, onChange: e => {
                                                                    setKnowledgeSearch(e.target.value);
                                                                    setEntryPage(1);
                                                                } }), _jsxs(Select, { className: "f", id: "knowledge-status", "aria-label": "\u7B5B\u9009\u6838\u5B9E\u72B6\u6001", value: knowledgeStatus, onChange: e => {
                                                                    setKnowledgeStatus(e.target.value);
                                                                    setEntryPage(1);
                                                                }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u6761\u76EE" }), _jsx("option", { value: "pending", children: "\u5F85\u6838\u5B9E" }), _jsx("option", { value: "confirmed", children: "\u5DF2\u901A\u8FC7" }), _jsx("option", { value: "rejected", children: "\u5DF2\u9A73\u56DE" }), _jsx("option", { value: "conflict", children: "\u5B58\u5728\u77DB\u76FE" })] }), _jsx(ClearFilterButton, { id: "kb-clear-knowledge-filters", ariaLabel: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", title: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", disabled: !knowledgeSearch && knowledgeStatus === "all", onClick: () => {
                                                                    setKnowledgeSearch("");
                                                                    setKnowledgeStatus("all");
                                                                    setEntryPage(1);
                                                                } })] })) : null] }), selectedVersionId && resultVersions.length > 1 && _jsxs("label", { className: "control", children: ["\u7ED3\u679C\u7248\u672C", _jsx(Select, { className: "f", "aria-label": "\u77E5\u8BC6\u7ED3\u679C\u7248\u672C", value: selectedVersionId || '', onChange: event => workspace.updateView(pageId, { job: selectedJob.run_id, version: event.target.value }), children: resultVersions.map(version => _jsxs("option", { value: version.version_id, children: [version.manually_edited ? '维护版本' : '作业冻结版本', " ", version.version_id.slice(-8)] }, version.version_id)) })] }), _jsx("div", { className: "knowledge-wrap", id: "knowledge-body", children: !selectedJob ? (_jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u6CA1\u6709\u77E5\u8BC6\u6761\u76EE" })) : !readSource ? (_jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u6CA1\u6709\u77E5\u8BC6\u6761\u76EE" })) : checksResource.error ? _jsx("p", { role: "alert", children: checksResource.error })
                                                    : checksResource.loading ? _jsx("div", { className: "blank", children: "\u6B63\u5728\u8BFB\u53D6\u4F5C\u4E1A\u51BB\u7ED3\u77E5\u8BC6" })
                                                        : filteredChecks.length === 0 ? (_jsx("div", { className: "blank", children: knowledgeSearch || knowledgeStatus !== "all" ? "没有符合筛选条件的知识条目。" : "当前作业暂无知识条目。" })) : (_jsxs("div", { className: "knowledge-list", children: [_jsxs("div", { className: "knowledge-head", children: [_jsx("span", { children: "\u77E5\u8BC6\u6761\u76EE" }), _jsx("span", { children: "\u63CF\u8FF0" }), _jsx("span", { children: "\u652F\u6301/\u53CD\u5BF9" }), _jsx("span", { children: "\u64CD\u4F5C" })] }), _jsx("div", { className: "knowledge-items", children: pagedChecks.map(item => (_jsxs("div", { className: "knowledge-row", "data-detail-entry": item.id, role: "row", tabIndex: 0, "aria-label": `查看知识条目：${item.name}`, onClick: () => openDetail(item), onKeyDown: e => {
                                                                            if (e.key === "Enter" || e.key === " ") {
                                                                                e.preventDefault();
                                                                                openDetail(item);
                                                                            }
                                                                        }, children: [_jsx("span", { className: "row-title knowledge-entry-name", children: item.name }), _jsx("span", { className: "row-desc knowledge-entry-description", title: item.summary, children: item.summary }), _jsxs("span", { className: "row-count col-evidence-count", title: `支持 ${item.supportCount} 张，反对 ${item.counterCount} 张`, children: [item.supportCount, "/", item.counterCount] }), _jsxs("span", { className: "col-action jobact", onClick: e => e.stopPropagation(), children: [_jsx(IconButton, { icon: "details", type: "button", className: "knowledge-entry-view", "data-view-entry": item.id, label: `查看知识条目 ${item.name}`, title: "\u67E5\u770B\u77E5\u8BC6\u6761\u76EE", onClick: () => openDetail(item) }), _jsx(IconButton, { icon: "delete", type: "button", className: "knowledge-entry-delete", "data-delete-entry": item.id, disabled: !canMaintain, label: `删除知识条目 ${item.name}`, title: "\u5220\u9664\u77E5\u8BC6\u6761\u76EE", onClick: () => askDeleteEntry(item) })] })] }, item.id))) }), _jsx(Pagination, { hideSinglePage: true, total: totalChecks, page: currentEntryPage, size: 8, onPage: setEntryPage, label: "\u77E5\u8BC6\u6761\u76EE" })] })) })] }), (loadError || polling.error || versionError || results.error) && _jsx("p", { role: "alert", children: loadError || polling.error || results.error || (versionError ? message(versionError) : '') })] }), createOpen && _jsx(KnowledgeMiningCreate, { dataset: dataset, datasets: datasets, groups: parentGroups, selectedParentId: selectedParentId, selectedChildIds: selectedChildIds, onClose: () => workspace.updateView(pageId, { tab: 'results' }), onStarted: jobs => {
                                    const first = jobs[0];
                                    if (first) {
                                        workspace.openLocation({ pageId, datasetId: first.dataset_id, datasetIds: first.dataset_ids, job: first.run_id, version: '', tab: 'results' });
                                    }
                                    polling.refresh();
                                    updated();
                                    toast('挖掘作业已启动');
                                } }, scopeKey)] }) }), promptJob && _jsx(AnalysisPromptDrawer, { title: "\u77E5\u8BC6\u6316\u6398\u63D0\u793A\u8BCD", jobId: promptJob.run_id, onClose: closePrompt }), detailItem && _jsx(KnowledgeEntryDialog, { ...detailItem, onClose: closeDetail, onSaved: () => { updated(); toast('人工核实已保存'); } }, detailItem.checkId), jobDetails && polling.jobs.some(job => job.run_id === jobDetails || job.root_run_id === jobDetails) && _jsx(JobStatusDrawer, { job: polling.jobs.find(job => job.run_id === jobDetails || job.root_run_id === jobDetails), onClose: () => setJobDetails(null), stale: polling.syncState === 'stale' }), _jsx(KnowledgeConfirmation, { state: confirmState, onClose: () => setConfirmState(null) }), _jsx("div", { className: `toast ${toastMsg ? "show" : ""}`, id: "toast", role: "status", children: toastMsg })] }) }));
}
