import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PromptDrawer } from './PromptDrawer.js';
import { JobStatusDrawer, JobStatusButton } from './JobStatusDrawer.js';
import { Select } from './Select.js';
import { TabBar } from './layout/TabBar.js';
import { Button } from './Button.js';
import { ThumbnailCard } from "./ThumbnailCard.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mediaUrl, message, request } from "../api.js";
import { useWorkbenchModel } from "../models.js";
import { useWorkspace } from "../workspace.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import { PlusIcon } from "../AuditIcon.js";
import { IconButton } from "./IconButton.js";
import { DeleteAction } from './DeleteAction.js';
import { DatasetScopeSelector } from "./DatasetScopeSelector.js";
import { DirectionDetailDialog } from "./DirectionDetailDialog.js";
import { FullscreenViewer } from "./FullscreenViewer.js";
import { Pagination, IBA_JOBS_PAGE_SIZE } from "./Pagination.js";
import { ClearFilterButton } from "./CommonFilterControls.js";
import { useResource } from "../useResource.js";
import { explorationCandidates, explorationDirections } from "../exploration-view.js";
function expElapsed(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return (m > 0 ? `${m}分` : "") + `${s}秒`;
}
function expJobBadge(status) {
    if (status === "COMPLETED")
        return _jsx("span", { className: "exp-pill ok", children: "\u5DF2\u5B8C\u6210" });
    if (status === "RUNNING")
        return _jsx("span", { className: "exp-pill running", children: "\u8FD0\u884C\u4E2D" });
    if (status === "PENDING")
        return _jsx("span", { className: "exp-pill pending", children: "\u6392\u961F\u4E2D" });
    return _jsx("span", { className: "exp-pill fail", children: "\u5931\u8D25" });
}
function expJobState(status) {
    if (status === "PENDING")
        return "排队中";
    if (status === "RUNNING")
        return "运行中";
    if (status === "COMPLETED")
        return "已完成";
    if (status === "FAILED")
        return "失败";
    return "已取消";
}
let cachedDatasets = null;
let cachedGroups = null;
export function ExplorationPage({ dataset, refreshRevision, headerActions, }) {
    const { workspace } = useWorkspace();
    const model = useWorkbenchModel();
    const initialGroups = buildHierarchyGroups(cachedDatasets || [dataset], cachedGroups || []);
    const initialParentId = getDatasetGroupId(dataset, initialGroups);
    const initialChildren = (cachedDatasets || [dataset]).filter((d) => getDatasetGroupId(d, initialGroups) === initialParentId);
    const [datasets, setDatasets] = useState(() => cachedDatasets || [dataset]);
    const [groups, setGroups] = useState(() => initialGroups);
    const [selectedParentId, setSelectedParentId] = useState(() => initialParentId);
    const [selectedChildIds, setSelectedChildIds] = useState(() => initialChildren.length > 0 ? initialChildren.map((c) => c.dataset_id) : [dataset.dataset_id]);
    // View state: 'jobs' (unified layout) or 'setup' (3-step creation)
    const [view, setView] = useState("jobs");
    const [jobFilter, setJobFilter] = useState("全部");
    const [jobSearch, setJobSearch] = useState("");
    const [statusJobId, setStatusJobId] = useState(null);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [jobPage, setJobPage] = useState(1);
    const [refreshTick, setRefreshTick] = useState(0);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const submission = useRef(null);
    // Setup state
    const [sampleTab, setSampleTab] = useState("normal");
    const [normalSelected, setNormalSelected] = useState([]);
    const [defectSelected, setDefectSelected] = useState([]);
    const [presets, setPresets] = useState([]);
    const [selectedPresetId, setSelectedPresetId] = useState("");
    const [prompt, setPrompt] = useState("");
    const [originalPrompt, setOriginalPrompt] = useState("");
    // Modals
    const [modal, setModal] = useState("");
    const [deletingJobId, setDeletingJobId] = useState(null);
    const [promptText, setPromptText] = useState(null);
    const [viewingDirection, setViewingDirection] = useState(null);
    const [newPresetName, setNewPresetName] = useState("");
    // Source picker modal state
    const [sourceSearch, setSourceSearch] = useState("");
    const [sourceCategory, setSourceCategory] = useState("all");
    const [sourceSelectedOnly, setSourceSelectedOnly] = useState(false);
    const [sourcePage, setSourcePage] = useState(1);
    // Direction detail interaction
    const [highlightRef, setHighlightRef] = useState(null);
    // Fullscreen Viewer state (reusing shared FullscreenViewer.tsx)
    const [viewerData, setViewerData] = useState(null);
    // Candidate samples pool
    const [samplePool, setSamplePool] = useState([]);
    const [samplesLoaded, setSamplesLoaded] = useState(false), [samplesLoading, setSamplesLoading] = useState(false);
    const sampleById = useMemo(() => new Map(samplePool.map(item => [item.id, item])), [samplePool]);
    // Jobs state initialized to empty array (loaded dynamically from backend API)
    const [jobs, setJobs] = useState([]);
    // Load datasets and hierarchy
    useEffect(() => {
        let active = true;
        request("/datasets")
            .then((res) => {
            if (!active)
                return;
            const dsList = res.datasets || [dataset];
            const grpList = buildHierarchyGroups(dsList, res.groups || []);
            cachedDatasets = dsList;
            cachedGroups = res.groups || [];
            setDatasets(dsList);
            setGroups(grpList);
            const parentId = getDatasetGroupId(dataset, grpList);
            setSelectedParentId(parentId);
            const children = dsList.filter((d) => getDatasetGroupId(d, grpList) === parentId);
            setSelectedChildIds(children.length > 0 ? children.map((c) => c.dataset_id) : [dataset.dataset_id]);
        })
            .catch(() => {
            if (!active)
                return;
            const grpList = buildHierarchyGroups([dataset], []);
            setGroups(grpList);
            const parentId = getDatasetGroupId(dataset, grpList);
            setSelectedParentId(parentId);
            setSelectedChildIds((prev) => (prev.length ? prev : [dataset.dataset_id]));
        });
        return () => {
            active = false;
        };
    }, [dataset, refreshRevision]);
    // Load presets from server if available
    useEffect(() => {
        let active = true;
        request("/exploration/presets")
            .then((res) => {
            if (active && res.presets?.length) {
                setPresets(res.presets);
                const first = res.presets[0];
                setSelectedPresetId(first.id);
                setPrompt(first.text);
                setOriginalPrompt(first.text);
            }
        })
            .catch(error => { if (active)
            setError(message(error)); });
        return () => {
            active = false;
        };
    }, [refreshRevision]);
    useEffect(() => {
        if (view !== 'setup')
            return;
        setSamplePool([]);
        setNormalSelected([]);
        setDefectSelected([]);
        setSamplesLoaded(false);
        setSamplesLoading(false);
    }, [selectedChildIds, view]);
    useEffect(() => {
        if (view !== 'setup' || modal !== 'source' || samplesLoaded)
            return;
        const controller = new AbortController();
        setSamplesLoading(true);
        explorationCandidates(selectedChildIds, controller.signal).then(pool => {
            if (controller.signal.aborted)
                return;
            setSamplePool(pool);
            setSamplesLoaded(true);
            setSamplesLoading(false);
        }).catch(error => { if (!controller.signal.aborted) {
            setSamplesLoading(false);
            setError(message(error));
        } });
        return () => controller.abort();
    }, [selectedChildIds, view, modal, samplesLoaded]);
    const [jobSnapshots, setJobSnapshots] = useState([]);
    useEffect(() => {
        const controller = new AbortController();
        if (!selectedChildIds.length) {
            setJobs([]);
            setJobSnapshots([]);
            return;
        }
        Promise.all(selectedChildIds.map(dataset_id => request(`/analysis/jobs?${new URLSearchParams({ dataset_id, analysis_kind: 'exploration' })}`, undefined, undefined, controller.signal))).then(results => {
            if (controller.signal.aborted)
                return;
            const snapshots = [...new Map(results.flatMap(result => result.jobs).map(job => [job.run_id, job])).values()]
                .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
            setJobSnapshots(snapshots);
            setJobs(snapshots.map(job => ({ id: job.run_id, scopeKey: job.dataset_ids.join('|'), datasetIds: job.dataset_ids, normal: [], defect: [],
                prompt: job.exploration_prompt?.text || '', preset: job.exploration_prompt?.preset_id || '', status: job.status,
                phase: job.status === 'COMPLETED' ? 3 : job.status === 'PENDING' ? 0 : 2,
                elapsed: job.started_at ? Math.max(0, Math.round(((job.finished_at ? Date.parse(job.finished_at) : Date.now()) - Date.parse(job.started_at)) / 1000)) : 0,
                time: new Date(job.submitted_at).toLocaleString('zh-CN', { hour12: false }), error: job.errors[0]?.message })));
            setSelectedJobId(previous => snapshots.some(job => job.run_id === previous) ? previous : snapshots[0]?.run_id || null);
            setError('');
        }).catch(error => { if (!controller.signal.aborted)
            setError(message(error)); });
        return () => controller.abort();
    }, [selectedChildIds, refreshRevision, refreshTick]);
    // Polling for active background jobs
    useEffect(() => {
        const hasActiveJob = jobs.some((j) => j.status === "RUNNING" || j.status === "PENDING");
        if (!hasActiveJob)
            return;
        const interval = setInterval(() => {
            setRefreshTick((t) => t + 1);
        }, 3000);
        return () => clearInterval(interval);
    }, [jobs]);
    // Derived state
    const parentGroups = groups.length ? groups : buildHierarchyGroups([dataset], []);
    const currentChildDatasets = datasets.filter((d) => getDatasetGroupId(d, groups) === selectedParentId);
    const filteredJobs = useMemo(() => {
        const q = jobSearch.trim().toLowerCase();
        return jobs.filter((j) => {
            const matchStatus = jobFilter === "全部" || j.status === jobFilter;
            const matchSearch = !q || j.id.toLowerCase().includes(q);
            return matchStatus && matchSearch;
        });
    }, [jobs, jobFilter, jobSearch]);
    const jobPages = Math.max(1, Math.ceil(filteredJobs.length / IBA_JOBS_PAGE_SIZE));
    const currentJobPage = Math.max(1, Math.min(jobPages, jobPage));
    const shownJobs = useMemo(() => {
        return filteredJobs.slice((currentJobPage - 1) * IBA_JOBS_PAGE_SIZE, currentJobPage * IBA_JOBS_PAGE_SIZE);
    }, [filteredJobs, currentJobPage]);
    const selectedJob = useMemo(() => {
        if (!shownJobs.length)
            return null;
        if (selectedJobId) {
            const match = shownJobs.find((j) => j.id === selectedJobId);
            if (match)
                return match;
        }
        return shownJobs[0] || null;
    }, [shownJobs, selectedJobId]);
    const selectedSnapshot = jobSnapshots.find(job => job.run_id === selectedJob?.id);
    const versionKey = (selectedSnapshot?.dataset_results || []).map(result => result.exploration_version_id || '').join('|');
    const results = useResource(selectedJob ? `/analysis/results/${encodeURIComponent(selectedJob.id)}` : null, `${versionKey}|${refreshTick}`);
    const snapshots = useMemo(() => (results.data?.snapshots || []).filter(snapshot => selectedChildIds.includes(snapshot.dataset_id)), [results.data, selectedChildIds]);
    const selectedJobDirections = useMemo(() => explorationDirections(snapshots, results.data?.removed_direction_ids), [snapshots, results.data]);
    const selectedJobLimitations = snapshots.flatMap(snapshot => snapshot.limitations);
    const selectedJobSummary = snapshots.map(snapshot => snapshot.summary).join('\n');
    const handleJobPageChange = (newPage) => {
        const targetPage = Math.max(1, Math.min(jobPages, newPage));
        setJobPage(targetPage);
        const firstOnPage = filteredJobs[(targetPage - 1) * IBA_JOBS_PAGE_SIZE];
        if (firstOnPage) {
            setSelectedJobId(firstOnPage.id);
        }
    };
    const runningJob = jobs.find((j) => j.status === "RUNNING" || j.status === "PENDING");
    const runReason = runningJob ? '已有探索作业正在运行' : !selectedChildIds.length ? '请选择子数据集'
        : ![...normalSelected, ...defectSelected].every(id => sampleById.has(id)) ? '图像不可用，请重新选择'
            : !model.ready ? model.loading ? '正在读取模型' : '请先配置工作台模型'
                : !prompt.trim() ? '请填写探索提示词' : '';
    const canRun = !submitting && !runReason;
    // Handle parent group change
    const handleParentChange = (newParentId) => {
        setSelectedParentId(newParentId);
        const children = datasets.filter((d) => getDatasetGroupId(d, groups) === newParentId);
        setSelectedChildIds(children.map((c) => c.dataset_id));
        setJobPage(1);
    };
    // Toggle child dataset selection
    const handleChildToggle = (cid) => {
        setSelectedChildIds((prev) => prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]);
        setJobPage(1);
    };
    // Preset selection
    const handlePresetChange = (presetId) => {
        const p = presets.find((x) => x.id === presetId);
        if (p) {
            setSelectedPresetId(presetId);
            setPrompt(p.text);
            setOriginalPrompt(p.text);
        }
    };
    const handleStartExploration = async () => {
        if (!canRun)
            return;
        setSubmitting(true);
        setError('');
        try {
            const key = JSON.stringify([selectedChildIds, normalSelected, defectSelected, prompt, selectedPresetId]);
            if (submission.current?.key !== key)
                submission.current = { key, id: crypto.randomUUID() };
            const res = await request('/analysis/start', { submission_id: submission.current.id, analysis_kind: 'exploration',
                dataset_ids: selectedChildIds, normal_images: normalSelected, defect_images: defectSelected,
                prompt: { preset_id: selectedPresetId, preset_name: presets.find(preset => preset.id === selectedPresetId)?.name || '自定义', text: prompt } });
            setSelectedJobId(res.run_id);
            setJobPage(1);
            setRefreshTick(value => value + 1);
            setView('jobs');
            submission.current = null;
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleConfirmDeleteJob = async () => {
        if (!deletingJobId)
            return;
        try {
            await request(`/analysis/delete/${encodeURIComponent(deletingJobId)}`, {});
            setModal('');
            setDeletingJobId(null);
            setRefreshTick(value => value + 1);
        }
        catch (error) {
            setError(message(error));
        }
    };
    const renderJobDataset = (j) => {
        const parentId = j.parentId || (j.scopeKey || "").split("|")[0];
        const storedIds = (j.datasetIds && j.datasetIds.length > 0)
            ? j.datasetIds
            : (j.scopeKey || "").split("|")[1]?.split(",").filter(Boolean) || [];
        const childNames = storedIds
            .map((id) => {
            const d = datasets.find((item) => item.dataset_id === id);
            return d ? d.name : id;
        })
            .filter((name) => {
            return !groups.some((g) => g.name === name || g.group_id === name);
        });
        const fallbackNames = selectedChildIds
            .map((id) => datasets.find((d) => d.dataset_id === id)?.name)
            .filter((name) => Boolean(name) && !groups.some((g) => g.name === name || g.group_id === name));
        const text = childNames.join("、") || (fallbackNames.length > 0 ? fallbackNames.join("、") : "暂无子数据集");
        return (_jsx("div", { className: "exp-job-dataset", title: text, children: _jsx("span", { className: "exp-job-dataset-name", children: text }) }));
    };
    const currentEvidence = useMemo(() => {
        const all = viewingDirection?.evidences || [];
        return { normals: all.filter(item => item.kind === 'normal'), defects: all.filter(item => item.kind === 'defect'), all };
    }, [viewingDirection]);
    // Scroll evidence into view when hovering or clicking chips
    const handleChipFocus = (ref) => {
        setHighlightRef(ref);
    };
    // Open FullscreenViewer on evidence click
    const handleOpenEvidenceFullscreen = (clickedRef) => {
        const allItems = currentEvidence.all.map((item) => ({
            id: item.ref, sampleId: item.sampleId,
            title: `${item.label} ${item.filename}`,
            imageUrl: item.fullUrl,
        }));
        const index = currentEvidence.all.findIndex((item) => item.ref === clickedRef);
        if (index < 0) {
            setError('图像证据不可用');
            return;
        }
        setViewerData({
            items: allItems,
            currentIndex: index,
        });
    };
    return (_jsxs("div", { id: "exploration-page", className: "iad-exploration-page", children: [(error || results.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || results.error }), _jsxs("div", { className: "exp-heading", children: [_jsx("div", { children: _jsx("h1", { children: view === "setup" ? "新建探索" : "方向探索" }) }), _jsx("div", { className: "exp-heading-actions", children: view === "setup" ? (_jsx(Button, { type: "button", onClick: () => setView("jobs"), children: "\u8FD4\u56DE\u4F5C\u4E1A\u4E0E\u7ED3\u679C" })) : (_jsx(Button, { type: "button", variant: "primary", disabled: !!runningJob, title: runningJob ? "已有探索任务运行或排队" : "新建探索", onClick: () => setView("setup"), children: "\u65B0\u5EFA\u63A2\u7D22" })) })] }), _jsx(DatasetScopeSelector, { className: "exp-scope", groups: parentGroups, selectedGroupId: selectedParentId, onGroupChange: handleParentChange, childDatasets: currentChildDatasets, selectedChildIds: selectedChildIds, onChildToggle: handleChildToggle, disabled: submitting, groupId: "exp-parent", childId: "exp-child-toggle", childMenuId: "exp-child-menu", children: _jsx(IconButton, { icon: "refresh", id: "refresh", type: "button", title: "\u5237\u65B0\u63A2\u7D22\u4F5C\u4E1A", label: "\u5237\u65B0\u63A2\u7D22\u4F5C\u4E1A", disabled: submitting, onClick: () => {
                        setRefreshTick((t) => t + 1);
                    } }) }), view === "setup" ? (_jsxs("div", { children: [_jsxs("section", { className: "exp-panel", children: [_jsx("div", { className: "exp-panel-title", children: _jsx("h2", { children: "\u9009\u62E9\u5BF9\u6BD4\u6837\u4F8B" }) }), _jsxs("div", { className: "exp-tab-header", children: [_jsx(TabBar, { label: "\u5BF9\u6BD4\u6837\u4F8B", value: sampleTab, onChange: setSampleTab, items: [
                                            { id: 'normal', label: `良品样例 (${normalSelected.length})` },
                                            { id: 'defect', label: `异常样例 (${defectSelected.length})` },
                                        ] }), _jsx(IconButton, { icon: "delete", type: "button", disabled: sampleTab === "normal" ? !normalSelected.length : !defectSelected.length, title: "\u6E05\u7A7A\u5F53\u524D\u9875\u5DF2\u9009\u56FE\u50CF", label: `清空${sampleTab === "normal" ? "良品" : "异常"}已选图像`, onClick: () => {
                                            if (sampleTab === "normal")
                                                setNormalSelected([]);
                                            else
                                                setDefectSelected([]);
                                        } })] }), _jsx("div", { className: "exp-sample-body", children: _jsxs("div", { className: "exp-previews exp-previews-wide", children: [(sampleTab === "normal" ? normalSelected : defectSelected).map((id) => {
                                            const item = sampleById.get(id);
                                            return (_jsx("div", { className: "exp-preview", children: item && _jsx(ThumbnailCard, { src: item.url, label: item.filename, onClick: () => setViewerData({ items: [{
                                                                id: item.id, sampleId: item.id, title: item.filename, imageUrl: mediaUrl({ task_id: item.datasetId, sample_id: item.id })
                                                            }], currentIndex: 0 }) }) }, id));
                                        }), _jsx("div", { className: "exp-preview add-tile", children: _jsxs("button", { type: "button", className: "exp-add-image", "aria-label": `继续添加${sampleTab === "normal" ? "良品" : "异常"}图像`, title: "\u7EE7\u7EED\u6DFB\u52A0\u56FE\u50CF", onClick: () => {
                                                    setSourceSearch("");
                                                    setSourceCategory("all");
                                                    setSourceSelectedOnly(false);
                                                    setSourcePage(1);
                                                    setModal("source");
                                                }, children: [_jsx(PlusIcon, { size: 24 }), !(sampleTab === "normal" ? normalSelected : defectSelected).length && _jsx("span", { children: "\u6DFB\u52A0\u56FE\u50CF" })] }) })] }) })] }), _jsxs("section", { className: "exp-panel", children: [_jsx("div", { className: "exp-panel-title", children: _jsx("h2", { children: "\u63A2\u7D22\u63D0\u793A\u8BCD" }) }), _jsxs("div", { className: "exp-prompt-head", children: [_jsxs("label", { className: "exp-input", children: ["\u63D0\u793A\u8BCD\u9884\u8BBE", _jsx(Select, { id: "exp-preset", value: selectedPresetId, onChange: (e) => handlePresetChange(e.target.value), children: presets.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id))) })] }), _jsx(Button, { type: "button", disabled: prompt === originalPrompt, onClick: () => setPrompt(originalPrompt), children: "\u91CD\u7F6E\u4E3A\u9884\u8BBE" }), _jsx(Button, { type: "button", disabled: !prompt.trim(), onClick: () => {
                                            setNewPresetName("");
                                            setModal("save");
                                        }, children: "\u53E6\u5B58\u4E3A\u9884\u8BBE" })] }), _jsxs("label", { className: "exp-input", children: ["\u63D0\u793A\u8BCD\u6B63\u6587", _jsx("textarea", { id: "exp-prompt", rows: 7, value: prompt, onChange: (e) => setPrompt(e.target.value) })] })] }), _jsxs("section", { className: "exp-panel", children: [_jsx("div", { className: "exp-panel-title", children: _jsx("h2", { children: "\u786E\u8BA4\u5E76\u542F\u52A8" }) }), _jsxs("div", { className: "exp-brief", children: [_jsxs("span", { children: ["\u6240\u9009\u5B50\u6570\u636E\u96C6 ", selectedChildIds.length, " \u4E2A"] }), _jsxs("span", { children: ["\u4F18\u5148\u6837\u4F8B\uFF1A\u826F\u54C1 ", normalSelected.length, "\uFF0C\u5F02\u5E38 ", defectSelected.length] }), _jsxs("span", { children: ["\u6A21\u578B ", model.view?.selection?.model_id || '未配置'] }), _jsx("span", { children: "\u6267\u884C\uFF1A\u6240\u9009\u5B50\u96C6\u5168\u91CF\u5206\u6279\u8FED\u4EE3" })] }), _jsxs("div", { className: "exp-summarybar", children: [_jsx("span", { children: runReason || '可启动' }), _jsx(Button, { type: "button", variant: "primary", disabled: !canRun, onClick: handleStartExploration, children: "\u542F\u52A8\u8054\u5408\u63A2\u7D22" })] })] })] })) : (_jsxs("div", { className: "exp-unified-layout", children: [_jsxs("section", { className: `exp-panel exp-job-list ${jobPages > 1 ? 'iba-job-multipage' : ''}`, "aria-label": "\u63A2\u7D22\u4F5C\u4E1A", children: [_jsxs("div", { className: "exp-job-list-head", children: [_jsx("h2", { children: "\u63A2\u7D22\u4F5C\u4E1A" }), _jsxs("div", { className: "exp-job-list-actions", children: [_jsx("label", { className: "exp-input exp-filter-control", "aria-label": "\u641C\u7D22\u4F5C\u4E1A", children: _jsx("input", { id: "exp-jobsearch", type: "search", placeholder: "\u641C\u7D22\u4F5C\u4E1A ID", value: jobSearch, "aria-label": "\u641C\u7D22\u4F5C\u4E1A ID", autoComplete: "off", onChange: (e) => {
                                                        setJobSearch(e.target.value);
                                                        setJobPage(1);
                                                    } }) }), _jsx("label", { className: "exp-input exp-filter-control", "aria-label": "\u7B5B\u9009\u4F5C\u4E1A\u72B6\u6001", children: _jsxs(Select, { id: "exp-jobfilter", "aria-label": "\u4EFB\u52A1\u72B6\u6001", value: jobFilter, onChange: (e) => {
                                                        setJobFilter(e.target.value);
                                                        setJobPage(1);
                                                    }, children: [_jsx("option", { value: "\u5168\u90E8", children: "\u5168\u90E8\u72B6\u6001" }), _jsx("option", { value: "PENDING", children: "\u6392\u961F\u4E2D" }), _jsx("option", { value: "RUNNING", children: "\u8FD0\u884C\u4E2D" }), _jsx("option", { value: "COMPLETED", children: "\u5DF2\u5B8C\u6210" }), _jsx("option", { value: "FAILED", children: "\u5931\u8D25" })] }) }), _jsx(ClearFilterButton, { "data-exp": "clear-job-filters", ariaLabel: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", title: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", disabled: !jobSearch && jobFilter === "全部", onClick: () => {
                                                    setJobSearch("");
                                                    setJobFilter("全部");
                                                    setJobPage(1);
                                                } })] })] }), filteredJobs.length ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "exp-job-table-wrap", role: "region", "aria-label": "\u63A2\u7D22\u4F5C\u4E1A\u5217\u8868", tabIndex: 0, children: _jsxs("table", { className: "exp-job-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4F5C\u4E1A ID" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u6570\u636E\u96C6" }), _jsx("th", { children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { children: "\u8017\u65F6" }), _jsx("th", { className: "exp-prompt-action-col", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: shownJobs.map((j) => (_jsxs("tr", { "data-action": "select-job", "data-id": j.id, "data-selected": selectedJob?.id === j.id, "aria-selected": selectedJob?.id === j.id, tabIndex: 0, role: "button", "aria-label": `选择作业 ${j.id}`, onClick: () => setSelectedJobId(j.id), children: [_jsx("td", { children: _jsx("strong", { className: "exp-row-title", children: j.id }) }), _jsx("td", { children: _jsx(JobStatusButton, { job: jobSnapshots.find(job => job.run_id === j.id), onClick: () => setStatusJobId(jobSnapshots.find(job => job.run_id === j.id).root_run_id), children: expJobBadge(j.status) }) }), _jsx("td", { children: renderJobDataset(j) }), _jsx("td", { className: "exp-job-time", children: j.time || "—" }), _jsx("td", { className: "exp-job-duration", children: j.status === "PENDING" ? "—" : expElapsed(j.elapsed) }), _jsx("td", { className: "exp-prompt-action-col", children: _jsxs("div", { className: "exp-job-icon-actions", onClick: (e) => e.stopPropagation(), children: [j.status !== 'COMPLETED' && _jsx(IconButton, { icon: "details", label: `查看作业状态 ${j.id}`, onClick: () => setStatusJobId(jobSnapshots.find(job => job.run_id === j.id).root_run_id) }), _jsx(IconButton, { icon: "prompt", label: "\u67E5\u770B\u63D0\u793A\u8BCD", title: "\u67E5\u770B\u63D0\u793A\u8BCD", "data-exp": "show-prompt", "data-id": j.id, onClick: () => {
                                                                                setPromptText(j.prompt);
                                                                                setModal("prompt");
                                                                            } }), _jsx(IconButton, { icon: "delete", label: "\u5220\u9664\u4F5C\u4E1A", title: j.status === "RUNNING" || j.status === "PENDING" ? "请先停止运行中的作业" : "删除作业", "data-delete": "true", "data-exp": "ask-delete-job", "data-id": j.id, className: "danger", disabled: j.status === "RUNNING" || j.status === "PENDING", onClick: () => {
                                                                                setDeletingJobId(j.id);
                                                                                setModal("delete-job");
                                                                            } })] }) })] }, j.id))) })] }) }), _jsx(Pagination, { total: filteredJobs.length, page: currentJobPage, onPage: handleJobPageChange, label: "\u63A2\u7D22\u4F5C\u4E1A", size: IBA_JOBS_PAGE_SIZE })] })) : (_jsx("div", { className: "exp-job-empty", role: "status", children: jobs.length ? "没有符合筛选条件的探索作业。" : "当前范围还没有探索作业，可以创建新探索。" }))] }), !selectedJob ? (_jsxs("section", { className: "exp-panel exp-selected-result exp-empty-result", "aria-label": "\u63A2\u7D22\u7ED3\u679C", children: [_jsx("div", { className: "exp-selected-head", children: _jsx("div", { children: _jsx("h2", { children: "\u63A2\u7D22\u7ED3\u679C" }) }) }), _jsx("div", { className: "exp-result-empty-message", role: "status", children: "\u8BF7\u9009\u62E9\u4E0A\u65B9\u7684\u63A2\u7D22\u4F5C\u4E1A\u67E5\u770B\u7ED3\u679C\u3002" })] })) : (selectedJob.status === "PENDING" || selectedJob.status === "RUNNING") && !selectedJobDirections.length ? (_jsxs("section", { className: "exp-panel exp-selected-result", "aria-label": "\u6240\u9009\u4F5C\u4E1A\u7684\u6267\u884C\u9636\u6BB5", children: [_jsx("div", { className: "exp-selected-head", children: _jsxs("div", { children: [_jsx("h2", { children: "\u8FD0\u884C\u72B6\u6001" }), _jsx("span", { className: "exp-selected-sub", children: selectedJob.id })] }) }), _jsxs("div", { className: "exp-job-current-title", style: { margin: "0 0 17px" }, children: [_jsx("span", { className: `exp-pill ${selectedJob.status === "PENDING" ? "pending" : "running"}`, children: selectedJob.status === "PENDING" ? "排队中" : "运行中" }), _jsx("strong", { children: selectedJob.status === "PENDING"
                                            ? "等待执行"
                                            : ["准备图像", "容量检查", "模型联合分析", "校验并发布方向"][selectedJob.phase || 0] }), _jsx("span", { className: "exp-lead", children: selectedJob.status === "PENDING" ? "等待队列安排" : `已用时 ${expElapsed(selectedJob.elapsed)}` })] }), _jsx("div", { className: "exp-job-stages", role: "list", "aria-label": "\u6267\u884C\u9636\u6BB5", children: ["准备图像", "容量检查", "模型联合分析", "校验并发布方向"].map((p, i) => {
                                    const pending = selectedJob.status === "PENDING";
                                    const state = pending ? "waiting" : i < selectedJob.phase ? "done" : i === selectedJob.phase ? "current" : "waiting";
                                    return (_jsxs("div", { role: "listitem", className: "exp-job-stage", "data-state": state, children: [_jsx("span", { className: "exp-job-stage-icon", children: !pending && i < selectedJob.phase ? "✓" : i + 1 }), _jsx("span", { className: "exp-job-stage-label", children: p })] }, p));
                                }) }), _jsx("div", { className: "exp-result-neutral", children: "\u65B9\u5411\u53D1\u5E03\u540E\u5C06\u5728\u8FD9\u91CC\u663E\u793A\u3002" })] })) : selectedJob.status === "FAILED" ? (_jsxs("section", { className: "exp-panel exp-selected-result", "aria-label": "\u6240\u9009\u4F5C\u4E1A\u7684\u9519\u8BEF\u4FE1\u606F", children: [_jsx("div", { className: "exp-selected-head", children: _jsxs("div", { children: [_jsx("h2", { children: "\u4F5C\u4E1A\u5931\u8D25" }), _jsx("span", { className: "exp-selected-sub", children: selectedJob.id })] }) }), _jsx("p", { className: "exp-error-message", children: selectedJob.error || "任务未成功完成，未生成探索结果。" }), _jsx("p", { className: "exp-lead", children: "\u672C\u6B21\u4F5C\u4E1A\u6CA1\u6709\u53EF\u7528\u7684\u5019\u9009\u65B9\u5411\u6216\u6574\u4F53\u9650\u5236\u3002" }), _jsx(Button, { type: "button", disabled: !!runningJob, onClick: () => {
                                    setNormalSelected([...selectedJob.normal]);
                                    setDefectSelected([...selectedJob.defect]);
                                    setPrompt(selectedJob.prompt);
                                    setView("setup");
                                }, children: "\u4F7F\u7528\u8BE5\u914D\u7F6E\u65B0\u5EFA" })] })) : (_jsxs("section", { className: "exp-panel exp-selected-result", "aria-label": "\u6240\u9009\u4F5C\u4E1A\u7684\u63A2\u7D22\u7ED3\u679C", children: [_jsx("div", { className: "exp-selected-head", children: _jsxs("div", { children: [_jsx("h2", { children: "\u63A2\u7D22\u7ED3\u679C" }), _jsx("span", { className: "exp-selected-sub", children: selectedJob.id })] }) }), selectedJobSummary && _jsx("p", { className: "exp-result-summary", children: selectedJobSummary }), selectedJobDirections.length > 0 ? (_jsx("div", { className: "exp-job-table-wrap", children: _jsxs("table", { className: "exp-job-table exp-direction-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u65B9\u5411" }), _jsx("th", { children: "\u63CF\u8FF0" }), _jsx("th", { children: "\u9002\u7528\u77E5\u8BC6" }), _jsx("th", { className: "iad-number", children: "\u8BC1\u636E" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: selectedJobDirections.map((d) => {
                                                const evidenceCount = d.evidences?.length || 0;
                                                return (_jsxs("tr", { role: "button", tabIndex: 0, "data-action": "direction", "data-id": d.id, "aria-label": `查看方向 ${d.title}`, onClick: () => {
                                                        setViewingDirection(d);
                                                        setModal("direction");
                                                    }, children: [_jsx("td", { className: "exp-direction-name", children: d.title }), _jsx("td", { className: "exp-direction-description", title: d.brief, children: d.brief }), _jsx("td", { children: d.applies }), _jsxs("td", { className: "iad-number", children: [evidenceCount, " \u5F20"] }), _jsxs("td", { className: "exp-direction-action", onClick: (e) => e.stopPropagation(), children: [_jsx(IconButton, { icon: "details", label: "\u67E5\u770B\u65B9\u5411", title: "\u67E5\u770B\u65B9\u5411", className: "exp-direction-view-icon exp-view-detail-button", onClick: () => {
                                                                        setViewingDirection(d);
                                                                        setModal("direction");
                                                                    } }), _jsx(DeleteAction, { title: "\u5220\u9664\u65B9\u5411", name: d.title, description: "\u4FDD\u7559\u539F\u59CB\u6A21\u578B\u7ED3\u679C\u548C\u5386\u53F2\u5F15\u7528\u3002", onDelete: async () => {
                                                                        const removal = { dataset_id: d.datasetId, version_id: d.versionId, direction_id: d.id };
                                                                        await request('/exploration/directions/remove', removal);
                                                                        setRefreshTick(value => value + 1);
                                                                    } })] })] }, d.id));
                                            }) })] }) })) : (_jsx("p", { className: "exp-lead", children: "\u672C\u6B21\u6CA1\u6709\u5F62\u6210\u53EF\u7528\u7684\u5019\u9009\u65B9\u5411\u3002" })), _jsxs("div", { className: "exp-limitations", children: [_jsx("div", { className: "exp-result-section-head", children: _jsx("h3", { children: "\u6574\u4F53\u9650\u5236" }) }), selectedJobLimitations.length ? (_jsx("ol", { children: selectedJobLimitations.map((text, i) => (_jsx("li", { children: text }, i))) })) : (_jsx("p", { className: "exp-lead", children: "\u672C\u6B21\u672A\u8BB0\u5F55\u6574\u4F53\u9650\u5236\u3002" }))] })] }))] })), typeof document !== "undefined" &&
                createPortal(_jsxs(_Fragment, { children: [modal === "prompt" && promptText !== null && _jsx(PromptDrawer, { title: "\u63A2\u7D22\u63D0\u793A\u8BCD", text: promptText || '本次作业未记录提示词正文。', onClose: () => setModal('') }), modal === "delete-job" && deletingJobId && (_jsx("div", { className: "exp-modal", id: "exp-modal", children: _jsxs("div", { className: "exp-dialog small", role: "dialog", "aria-modal": "true", "aria-label": "\u5220\u9664\u63A2\u7D22\u4F5C\u4E1A", children: [_jsxs("div", { className: "exp-dialog-head", children: [_jsx("strong", { children: "\u5220\u9664\u63A2\u7D22\u4F5C\u4E1A" }), _jsx(IconButton, { icon: "close", label: "\u5173\u95ED", onClick: () => setModal("") })] }), _jsx("div", { className: "exp-dialog-main", children: _jsxs("p", { className: "exp-delete-text", children: ["\u786E\u5B9A\u5220\u9664\u4F5C\u4E1A ", deletingJobId, " \u5417\uFF1F"] }) }), _jsxs("div", { className: "exp-dialog-foot", children: [_jsx(Button, { type: "button", onClick: () => setModal(""), children: "\u53D6\u6D88" }), _jsx(Button, { type: "button", variant: "danger", onClick: handleConfirmDeleteJob, children: "\u5220\u9664\u4F5C\u4E1A" })] })] }) })), modal === "save" && (_jsx("div", { className: "exp-modal", id: "exp-modal", children: _jsxs("div", { className: "exp-dialog small", role: "dialog", "aria-modal": "true", "aria-label": "\u53E6\u5B58\u4E3A\u63D0\u793A\u8BCD\u9884\u8BBE", children: [_jsxs("div", { className: "exp-dialog-head", children: [_jsx("strong", { children: "\u53E6\u5B58\u4E3A\u63D0\u793A\u8BCD\u9884\u8BBE" }), _jsx(IconButton, { icon: "close", label: "\u5173\u95ED", onClick: () => setModal("") })] }), _jsx("div", { className: "exp-dialog-main", children: _jsxs("label", { className: "exp-input", children: ["\u9884\u8BBE\u540D\u79F0", _jsx("input", { id: "exp-new-preset", placeholder: "\u8BF7\u8F93\u5165\u9884\u8BBE\u540D\u79F0", value: newPresetName, onChange: (e) => setNewPresetName(e.target.value) })] }) }), _jsxs("div", { className: "exp-dialog-foot", children: [_jsx(Button, { type: "button", onClick: () => setModal(""), children: "\u53D6\u6D88" }), _jsx(Button, { type: "button", variant: "primary", disabled: !newPresetName.trim(), onClick: async () => { try {
                                                    const saved = await request("/exploration/presets", { name: newPresetName.trim(), text: prompt });
                                                    setPresets(values => [...values, saved]);
                                                    setSelectedPresetId(saved.id);
                                                    setOriginalPrompt(prompt);
                                                    setModal("");
                                                }
                                                catch (error) {
                                                    setError(message(error));
                                                } }, children: "\u4FDD\u5B58" })] })] }) })), modal === "source" && (_jsx("div", { className: "exp-modal", id: "exp-modal", children: _jsxs("div", { className: "exp-dialog exp-source-dialog", role: "dialog", "aria-modal": "true", "aria-label": `选择${sampleTab === "normal" ? "良品" : "异常"}图像`, children: [_jsxs("div", { className: "exp-dialog-head", children: [_jsxs("strong", { children: ["\u9009\u62E9", sampleTab === "normal" ? "良品" : "异常", "\u56FE\u50CF"] }), _jsx(IconButton, { icon: "close", label: "\u5173\u95ED", onClick: () => setModal("") })] }), _jsxs("div", { className: "exp-dialog-main", children: [_jsxs("div", { className: "exp-source-scope exp-source-scope-clean", children: [_jsxs("label", { className: "exp-input", children: ["\u641C\u7D22\u56FE\u50CF", _jsx("input", { id: "exp-source-search", type: "search", placeholder: "\u6587\u4EF6\u540D", value: sourceSearch, onChange: (e) => {
                                                                    setSourceSearch(e.target.value);
                                                                    setSourcePage(1);
                                                                } })] }), sampleTab === "defect" && (_jsxs("label", { className: "exp-input", children: ["\u6807\u6CE8\u7C7B\u522B", _jsxs(Select, { id: "exp-source-category", value: sourceCategory, onChange: (e) => {
                                                                    setSourceCategory(e.target.value);
                                                                    setSourcePage(1);
                                                                }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u7C7B\u522B" }), [...new Set(samplePool.map((s) => s.category).filter(Boolean))].map((c) => (_jsx("option", { value: c, children: c }, c)))] })] })), _jsxs("label", { className: "exp-source-only", children: [_jsx("input", { id: "exp-only-selected", type: "checkbox", checked: sourceSelectedOnly, onChange: (e) => {
                                                                    setSourceSelectedOnly(e.target.checked);
                                                                    setSourcePage(1);
                                                                } }), "\u4EC5\u770B\u5DF2\u9009"] })] }), (() => {
                                                const selectedList = sampleTab === "normal" ? normalSelected : defectSelected;
                                                const filtered = samplePool.filter((s) => {
                                                    if (s.kind !== sampleTab)
                                                        return false;
                                                    if (sourceSelectedOnly && !selectedList.includes(s.id))
                                                        return false;
                                                    if (sourceSearch.trim() && !s.filename.toLowerCase().includes(sourceSearch.trim().toLowerCase()))
                                                        return false;
                                                    if (sourceCategory !== "all" && s.category !== sourceCategory)
                                                        return false;
                                                    return true;
                                                });
                                                const totalPages = Math.ceil(filtered.length / 24) || 1;
                                                const page = Math.max(1, Math.min(sourcePage, totalPages));
                                                const visible = filtered.slice((page - 1) * 24, page * 24);
                                                return (_jsxs(_Fragment, { children: [_jsx("div", { className: "iad-thumbnail-grid", children: visible.map((item) => {
                                                                const isChosen = selectedList.includes(item.id);
                                                                return (_jsxs("label", { className: "iad-thumbnail-option", children: [_jsx(ThumbnailCard, { src: item.url, label: item.filename, "aria-pressed": isChosen, onClick: event => {
                                                                                event.preventDefault();
                                                                                if (sampleTab === "normal")
                                                                                    setNormalSelected(prev => isChosen ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                                                                                else
                                                                                    setDefectSelected(prev => isChosen ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                                                                            } }), _jsxs("span", { className: "exp-select-meta", children: [_jsx("input", { type: "checkbox", checked: isChosen, onChange: (e) => {
                                                                                        if (sampleTab === "normal") {
                                                                                            setNormalSelected((prev) => e.target.checked ? [...prev, item.id] : prev.filter((x) => x !== item.id));
                                                                                        }
                                                                                        else {
                                                                                            setDefectSelected((prev) => e.target.checked ? [...prev, item.id] : prev.filter((x) => x !== item.id));
                                                                                        }
                                                                                    } }), _jsx("span", { title: item.filename, children: item.filename })] })] }, item.id));
                                                            }) }), samplesLoading ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u56FE\u50CF\u2026" }) : !visible.length && _jsx("p", { className: "exp-lead", children: "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u56FE\u50CF" }), _jsx(Pagination, { total: filtered.length, page: page, size: 24, unit: "\u5F20\u56FE\u50CF", onPage: setSourcePage })] }));
                                            })()] }), _jsx("div", { className: "exp-dialog-foot", children: _jsx(Button, { type: "button", variant: "primary", onClick: () => setModal(""), children: "\u5B8C\u6210\u9009\u62E9" }) })] }) })), modal === "direction" && viewingDirection && (_jsx(DirectionDetailDialog, { direction: viewingDirection, evidence: currentEvidence, highlightRef: highlightRef, onHighlightRef: setHighlightRef, onChipFocus: handleChipFocus, onOpenFullscreen: handleOpenEvidenceFullscreen, onClose: () => { setModal(""); setViewingDirection(null); } })), viewerData && (_jsx(FullscreenViewer, { open: true, item: viewerData.items[viewerData.currentIndex] || null, items: viewerData.items, currentIndex: viewerData.currentIndex, onClose: () => setViewerData(null), onNavigate: (idx) => setViewerData((prev) => (prev ? { ...prev, currentIndex: idx } : null)) }))] }), document.body), statusJobId && jobSnapshots.some(job => job.run_id === statusJobId || job.root_run_id === statusJobId) && _jsx(JobStatusDrawer, { job: jobSnapshots.find(job => job.run_id === statusJobId || job.root_run_id === statusJobId), onClose: () => setStatusJobId(null), onChanged: () => setRefreshTick(value => value + 1) })] }));
}
