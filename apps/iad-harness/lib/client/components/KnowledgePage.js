import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { jobIsActive } from '../../shared/job-display.js';
import { AnalysisExportButton } from './AnalysisExportButton.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { v4 as uuid } from 'uuid';
import { AnalysisPromptDrawer } from './AnalysisPromptDrawer.js';
import { Select } from './Select.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { useQueries } from '@tanstack/react-query';
import { queryClient } from '../query-client.js';
import { Button } from './Button.js';
import { useCallback, useEffect, useMemo, useState } from "react";
import { message, request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useResource } from "../useResource.js";
import { useDatasetCatalog } from '../useDatasetCatalog.js';
import { useWorkspace } from "../workspace.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import { JobList } from './JobList.js';
import { KnowledgeEntryList } from './KnowledgeEntryList.js';
import { useJobList } from '../useJobList.js';
import { JobStatusDrawer } from './JobStatusDrawer.js';
import { KnowledgeEntryDialog } from "./KnowledgeEntryDialog.js";
import { KnowledgeMiningCreate } from "./KnowledgeMiningCreate.js";
import { KnowledgeConfirmation } from "./KnowledgeConfirmation.js";
import { RefreshIconButton } from "./CommonFilterControls.js";
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
    const jobList = useJobList(polling.jobs, scopeKey, view.job, job => workspace.updateView(pageId, { job: job.run_id, version: '' }));
    const selectedJob = jobList.selected;
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
    useEffect(() => { setDetailItem(null); }, [scopeKey, selectedJob?.run_id]);
    const askDeleteEntry = (item) => {
        if (!selectedVersionId || !selectedJob)
            return;
        setConfirmState({ title: '移除知识条目', message: `从当前知识中移除“${item.title}”并生成维护版本？`, danger: true,
            onConfirm: async () => {
                try {
                    const version = await request(`/knowledge/versions/${encodeURIComponent(selectedVersionId)}/checks/remove`, { submission_id: uuid(), check_id: item.check_id });
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
                                        } }), _jsx("section", { className: "panel", id: "knowledge-panel", children: _jsx(KnowledgeEntryList, { source: readSource, revision: revision + refreshRevision, headerActions: selectedVersionId?.startsWith('analysis_version_') && _jsx(AnalysisExportButton, { versionId: selectedVersionId }), actions: { view: entry => { if (readSource)
                                                    setDetailItem({ source: readSource, checkId: entry.check_id }); }, remove: { enabled: canMaintain, run: askDeleteEntry } }, children: selectedVersionId && resultVersions.length > 1 && _jsxs("label", { className: "control", children: ["\u7ED3\u679C\u7248\u672C", _jsx(Select, { className: "f", "aria-label": "\u77E5\u8BC6\u7ED3\u679C\u7248\u672C", value: selectedVersionId, onChange: event => workspace.updateView(pageId, { job: selectedJob.run_id, version: event.target.value }), children: resultVersions.map(version => _jsxs("option", { value: version.version_id, children: [version.manually_edited ? '维护版本' : '作业冻结版本', " ", version.version_id.slice(-8)] }, version.version_id)) })] }) }, selectedVersionId || selectedJob?.run_id || 'empty') }), (loadError || polling.error || versionError || results.error) && _jsx("p", { role: "alert", children: loadError || polling.error || results.error || (versionError ? message(versionError) : '') })] }), createOpen && _jsx(KnowledgeMiningCreate, { dataset: dataset, datasets: datasets, groups: parentGroups, selectedParentId: selectedParentId, selectedChildIds: selectedChildIds, onClose: () => workspace.updateView(pageId, { tab: 'results' }), onStarted: jobs => {
                                    const first = jobs[0];
                                    if (first) {
                                        workspace.openLocation({ pageId, datasetId: first.dataset_id, datasetIds: first.dataset_ids, job: first.run_id, version: '', tab: 'results' });
                                    }
                                    polling.refresh();
                                    updated();
                                    toast('挖掘作业已启动');
                                } }, scopeKey)] }) }), promptJob && _jsx(AnalysisPromptDrawer, { title: "\u77E5\u8BC6\u6316\u6398\u63D0\u793A\u8BCD", jobId: promptJob.run_id, onClose: () => setPromptJob(null) }), detailItem && _jsx(KnowledgeEntryDialog, { ...detailItem, onClose: () => setDetailItem(null), onSaved: () => { updated(); toast('人工核实已保存'); } }, detailItem.checkId), jobDetails && polling.jobs.some(job => job.run_id === jobDetails || job.root_run_id === jobDetails) && _jsx(JobStatusDrawer, { job: polling.jobs.find(job => job.run_id === jobDetails || job.root_run_id === jobDetails), onClose: () => setJobDetails(null), stale: polling.syncState === 'stale' }), _jsx(KnowledgeConfirmation, { state: confirmState, onClose: () => setConfirmState(null) }), _jsx("div", { className: `toast ${toastMsg ? "show" : ""}`, id: "toast", role: "status", children: toastMsg })] }) }));
}
