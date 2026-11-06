import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SectionHeading } from './layout/SectionHeading.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { v4 as uuid } from 'uuid';
import { ExplorationPresetDialog } from './ExplorationPresetDialog.js';
import { ExplorationSourceDialog } from './ExplorationSourceDialog.js';
import { PromptDrawer } from './PromptDrawer.js';
import { JobStatusDrawer, JobStatusButton, JobStatusAction } from './JobStatusDrawer.js';
import { JobListPanel } from './JobListPanel.js';
import { Select } from './Select.js';
import { TabBar } from './layout/TabBar.js';
import { Button } from './Button.js';
import { ThumbnailCard } from "./ThumbnailCard.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mediaUrl, message, request } from "../api.js";
import { useWorkbenchModel } from "../models.js";
import { useJobs } from "../useJobs.js";
import { useDatasetCatalog } from '../useDatasetCatalog.js';
import { jobStatuses } from "../../shared/job-display.js";
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
export function ExplorationPage({ dataset, refreshRevision, }) {
    const model = useWorkbenchModel();
    const catalog = useDatasetCatalog();
    const datasets = catalog.data?.datasets || [dataset], groups = catalog.data?.groups || [];
    const initialParentId = getDatasetGroupId(dataset);
    const initialChildren = datasets.filter((d) => getDatasetGroupId(d) === initialParentId);
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
    const [promptText, setPromptText] = useState(null);
    const [viewingDirection, setViewingDirection] = useState(null);
    // Direction detail interaction
    const [highlightRef, setHighlightRef] = useState(null);
    // Fullscreen Viewer state (reusing shared FullscreenViewer.tsx)
    const [viewerData, setViewerData] = useState(null);
    // Candidate samples pool
    const [samplePool, setSamplePool] = useState([]);
    const [samplesLoaded, setSamplesLoaded] = useState(false), [samplesLoading, setSamplesLoading] = useState(false);
    const sampleById = useMemo(() => new Map(samplePool.map(item => [item.id, item])), [samplePool]);
    const progress = useCallback(() => setRefreshTick(value => value + 1), []);
    const jobQuery = useJobs('exploration', selectedChildIds, progress, '', refreshRevision);
    const jobs = jobQuery.jobs;
    const refreshJobs = () => { jobQuery.refresh(); progress(); };
    // Load datasets and hierarchy
    useEffect(() => {
        const parentId = getDatasetGroupId(dataset);
        setSelectedParentId(parentId);
        const children = datasets.filter(item => getDatasetGroupId(item) === parentId);
        setSelectedChildIds(children.map(item => item.dataset_id));
    }, [dataset.dataset_id]);
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
    // Derived state
    const parentGroups = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
    const currentChildDatasets = datasets.filter((d) => getDatasetGroupId(d) === selectedParentId);
    const filteredJobs = useMemo(() => {
        const q = jobSearch.trim().toLowerCase();
        return jobs.filter((j) => {
            const matchStatus = jobFilter === "全部" || j.status === jobFilter;
            const matchSearch = !q || [j.run_id, j.root_run_id].some(id => id.toLowerCase().includes(q));
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
            const match = shownJobs.find((j) => j.root_run_id === selectedJobId || j.run_id === selectedJobId);
            if (match)
                return match;
        }
        return shownJobs[0] || null;
    }, [shownJobs, selectedJobId]);
    const selectedSnapshot = selectedJob;
    const versionKey = (selectedSnapshot?.dataset_results || []).map(result => result.exploration_version_id || '').join('|');
    const results = useResource(selectedJob ? `/analysis/results/${encodeURIComponent(selectedJob.run_id)}` : null, `${versionKey}|${refreshTick}`);
    const snapshots = useMemo(() => (results.data?.snapshots || []).filter(snapshot => selectedChildIds.includes(snapshot.dataset_id)), [results.data, selectedChildIds]);
    const selectedJobDirections = useMemo(() => explorationDirections(snapshots, results.data?.removed_direction_ids), [snapshots, results.data]);
    const selectedJobLimitations = snapshots.flatMap(snapshot => snapshot.limitations);
    const selectedJobSummary = snapshots.map(snapshot => snapshot.summary).join('\n');
    const handleJobPageChange = (newPage) => {
        const targetPage = Math.max(1, Math.min(jobPages, newPage));
        setJobPage(targetPage);
        const firstOnPage = filteredJobs[(targetPage - 1) * IBA_JOBS_PAGE_SIZE];
        if (firstOnPage) {
            setSelectedJobId(firstOnPage.root_run_id);
        }
    };
    const runningJob = jobs.find((j) => j.status === "RUNNING" || j.status === "PENDING");
    const runReason = runningJob ? '已有探索作业正在运行' : !selectedChildIds.length ? '请选择子数据集'
        : ![...normalSelected, ...defectSelected].every(id => sampleById.has(id)) ? '图像不可用，请重新选择'
            : !model.ready ? model.loading ? '正在读取模型' : '请先配置工作台模型'
                : !prompt.trim() ? '请填写探索提示词' : '';
    const canRun = !submitting && !runReason;
    const resetSamples = () => {
        setSamplePool([]);
        setNormalSelected([]);
        setDefectSelected([]);
        setSamplesLoaded(false);
        setSamplesLoading(false);
    };
    const openSetup = async (copy) => {
        setSubmitting(true);
        setError('');
        try {
            const frozen = copy ? await request(`/analysis/node/${encodeURIComponent(copy.root_run_id)}`) : null;
            const original = frozen?.request.submission;
            const ids = original?.dataset_ids || selectedChildIds;
            const normals = original?.normal_images || [], defects = original?.defect_images || [];
            const pool = normals.length || defects.length ? await explorationCandidates(ids) : [];
            setSelectedChildIds(ids);
            setSamplePool(pool);
            setSamplesLoaded(pool.length > 0);
            setNormalSelected(normals);
            setDefectSelected(defects);
            const frozenPrompt = original?.prompt || copy?.exploration_prompt;
            if (frozenPrompt) {
                setPrompt(frozenPrompt.text);
                setOriginalPrompt(frozenPrompt.text);
                setSelectedPresetId(frozenPrompt.preset_id || '');
            }
            setView('setup');
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setSubmitting(false);
        }
    };
    // Handle parent group change
    const handleParentChange = (newParentId) => {
        resetSamples();
        setSelectedParentId(newParentId);
        const children = datasets.filter((d) => getDatasetGroupId(d) === newParentId);
        setSelectedChildIds(children.map((c) => c.dataset_id));
        setJobPage(1);
    };
    // Toggle child dataset selection
    const handleChildToggle = (cid) => {
        resetSamples();
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
                submission.current = { key, id: uuid() };
            const res = await request('/analysis/start', { submission_id: submission.current.id, analysis_kind: 'exploration',
                dataset_ids: selectedChildIds, normal_images: normalSelected, defect_images: defectSelected,
                prompt: { preset_id: selectedPresetId, preset_name: presets.find(preset => preset.id === selectedPresetId)?.name || '自定义', text: prompt } });
            setSelectedJobId(res.run_id);
            setJobPage(1);
            refreshJobs();
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
    return (_jsxs("div", { id: "exploration-page", className: "iad-exploration-page", children: [(error || results.error || jobQuery.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || results.error || jobQuery.error }), _jsx(WorkbenchHeader, { pageId: "industrial-exploration", className: "exp-heading", title: view === "setup" ? "新建探索" : undefined, children: _jsx("div", { className: "exp-heading-actions", children: view === "setup" ? (_jsx(Button, { type: "button", onClick: () => setView("jobs"), children: "\u8FD4\u56DE\u4F5C\u4E1A\u4E0E\u7ED3\u679C" })) : (_jsx(Button, { id: "exp-new", type: "button", variant: "primary", disabled: !!runningJob || submitting, title: runningJob ? "已有探索任务运行或排队" : "新建探索", onClick: () => void openSetup(), children: "\u65B0\u5EFA\u63A2\u7D22" })) }) }), _jsx(DatasetScopeSelector, { className: "exp-scope", groups: parentGroups, selectedGroupId: selectedParentId, onGroupChange: handleParentChange, childDatasets: currentChildDatasets, selectedChildIds: selectedChildIds, onChildToggle: handleChildToggle, disabled: submitting, groupId: "exp-parent", childId: "exp-child-toggle", childMenuId: "exp-child-menu", children: _jsx(IconButton, { icon: "refresh", id: "refresh", type: "button", title: "\u5237\u65B0\u63A2\u7D22\u4F5C\u4E1A", label: "\u5237\u65B0\u63A2\u7D22\u4F5C\u4E1A", disabled: submitting, onClick: () => {
                        refreshJobs();
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
                                                    setModal("source");
                                                }, children: [_jsx(PlusIcon, { size: 24 }), !(sampleTab === "normal" ? normalSelected : defectSelected).length && _jsx("span", { children: "\u6DFB\u52A0\u56FE\u50CF" })] }) })] }) })] }), _jsxs("section", { className: "exp-panel", children: [_jsx("div", { className: "exp-panel-title", children: _jsx("h2", { children: "\u63A2\u7D22\u63D0\u793A\u8BCD" }) }), _jsxs("div", { className: "exp-prompt-head", children: [_jsxs("label", { className: "exp-input", children: ["\u63D0\u793A\u8BCD\u9884\u8BBE", _jsx(Select, { id: "exp-preset", value: selectedPresetId, onChange: (e) => handlePresetChange(e.target.value), children: presets.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id))) })] }), _jsx(Button, { type: "button", disabled: prompt === originalPrompt, onClick: () => setPrompt(originalPrompt), children: "\u91CD\u7F6E\u4E3A\u9884\u8BBE" }), _jsx(Button, { type: "button", disabled: !prompt.trim(), onClick: () => {
                                            setModal("save");
                                        }, children: "\u53E6\u5B58\u4E3A\u9884\u8BBE" })] }), _jsxs("label", { className: "exp-input", children: ["\u63D0\u793A\u8BCD\u6B63\u6587", _jsx("textarea", { id: "exp-prompt", rows: 7, value: prompt, onChange: (e) => setPrompt(e.target.value) })] })] }), _jsxs("section", { className: "exp-panel", children: [_jsx("div", { className: "exp-panel-title", children: _jsx("h2", { children: "\u786E\u8BA4\u5E76\u542F\u52A8" }) }), _jsxs("div", { className: "exp-brief", children: [_jsxs("span", { children: ["\u6240\u9009\u5B50\u6570\u636E\u96C6 ", selectedChildIds.length, " \u4E2A"] }), _jsxs("span", { children: ["\u4F18\u5148\u6837\u4F8B\uFF1A\u826F\u54C1 ", normalSelected.length, "\uFF0C\u5F02\u5E38 ", defectSelected.length] }), _jsxs("span", { children: ["\u6A21\u578B ", model.view?.selection?.model_id || '未配置'] }), _jsx("span", { children: "\u6267\u884C\uFF1A\u6240\u9009\u5B50\u96C6\u5168\u91CF\u5206\u6279\u8FED\u4EE3" })] }), _jsxs("div", { className: "exp-summarybar", children: [_jsx("span", { children: runReason || '可启动' }), _jsx(Button, { type: "button", variant: "primary", disabled: !canRun, onClick: handleStartExploration, children: "\u542F\u52A8\u8054\u5408\u63A2\u7D22" })] })] })] })) : (_jsxs("div", { className: "exp-unified-layout", children: [_jsx(JobListPanel, { title: "\u63A2\u7D22\u4F5C\u4E1A", className: `exp-job-list ${jobPages > 1 ? 'iba-job-multipage' : ''}`, actions: jobs.length > 0 &&
                            _jsxs("div", { className: "exp-job-list-actions", children: [_jsx("label", { className: "exp-input exp-filter-control", "aria-label": "\u641C\u7D22\u4F5C\u4E1A", children: _jsx("input", { id: "exp-jobsearch", type: "search", placeholder: "\u641C\u7D22\u4F5C\u4E1A ID", value: jobSearch, "aria-label": "\u641C\u7D22\u4F5C\u4E1A ID", autoComplete: "off", onChange: (e) => {
                                                setJobSearch(e.target.value);
                                                setJobPage(1);
                                            } }) }), _jsx("label", { className: "exp-input exp-filter-control", "aria-label": "\u7B5B\u9009\u4F5C\u4E1A\u72B6\u6001", children: _jsxs(Select, { id: "exp-jobfilter", "aria-label": "\u4EFB\u52A1\u72B6\u6001", value: jobFilter, onChange: (e) => {
                                                setJobFilter(e.target.value);
                                                setJobPage(1);
                                            }, children: [_jsx("option", { value: "\u5168\u90E8", children: "\u5168\u90E8\u72B6\u6001" }), Object.entries(jobStatuses).map(([value, label]) => _jsx("option", { value: value, children: label }, value))] }) }), _jsx(ClearFilterButton, { "data-exp": "clear-job-filters", ariaLabel: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", title: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", disabled: !jobSearch && jobFilter === "全部", onClick: () => {
                                            setJobSearch("");
                                            setJobFilter("全部");
                                            setJobPage(1);
                                        } })] }), children: filteredJobs.length ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "exp-job-table-wrap", role: "region", "aria-label": "\u63A2\u7D22\u4F5C\u4E1A\u5217\u8868", tabIndex: 0, children: _jsxs("table", { className: "exp-job-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4F5C\u4E1A ID" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u6570\u636E\u96C6" }), _jsx("th", { children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { children: "\u8017\u65F6" }), _jsx("th", { className: "exp-prompt-action-col", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: shownJobs.map(j => {
                                                    const datasetNames = j.dataset_ids.map(id => datasets.find(dataset => dataset.dataset_id === id)?.name || id).join('、');
                                                    const elapsed = j.started_at ? Math.max(0, Math.round(((j.finished_at ? Date.parse(j.finished_at) : Date.now()) - Date.parse(j.started_at)) / 1000)) : 0;
                                                    return (_jsxs("tr", { "data-action": "select-job", "data-id": j.run_id, "data-selected": selectedJob?.run_id === j.run_id, "aria-selected": selectedJob?.run_id === j.run_id, tabIndex: 0, "aria-label": `选择作业 ${j.run_id}`, onClick: () => setSelectedJobId(j.root_run_id), onKeyDown: event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                                                            event.preventDefault();
                                                            setSelectedJobId(j.root_run_id);
                                                        } }, children: [_jsx("td", { children: _jsx("strong", { className: "exp-row-title", children: j.run_id }) }), _jsx("td", { children: _jsx(JobStatusButton, { job: j, onClick: () => setStatusJobId(j.root_run_id) }) }), _jsx("td", { children: _jsx("div", { className: "exp-job-dataset", title: datasetNames, children: _jsx("span", { className: "exp-job-dataset-name", children: datasetNames }) }) }), _jsx("td", { className: "exp-job-time", children: new Date(j.submitted_at).toLocaleString('zh-CN', { hour12: false }) }), _jsx("td", { className: "exp-job-duration", children: j.status === "PENDING" ? "—" : expElapsed(elapsed) }), _jsx("td", { className: "exp-prompt-action-col", children: _jsxs("div", { className: "exp-job-icon-actions", onClick: (e) => e.stopPropagation(), children: [_jsx(JobStatusAction, { job: j, onClick: () => setStatusJobId(j.root_run_id) }), ['FAILED', 'CANCELLED', 'INTERRUPTED'].includes(j.status) && _jsx(IconButton, { icon: "copy", label: "\u4F7F\u7528\u8BE5\u914D\u7F6E\u65B0\u5EFA", "data-exp": "copy-job", disabled: !!runningJob || submitting, onClick: () => void openSetup(j) }), _jsx(IconButton, { icon: "prompt", label: "\u67E5\u770B\u63D0\u793A\u8BCD", title: "\u67E5\u770B\u63D0\u793A\u8BCD", "data-exp": "show-prompt", "data-id": j.run_id, onClick: () => {
                                                                                setPromptText(j.exploration_prompt?.text || '');
                                                                                setModal("prompt");
                                                                            } }), _jsx(DeleteAction, { title: "\u5220\u9664\u63A2\u7D22\u4F5C\u4E1A", name: j.run_id, confirmLabel: "\u5220\u9664\u4F5C\u4E1A", confirmation: _jsxs(_Fragment, { children: ["\u786E\u5B9A\u5220\u9664\u4F5C\u4E1A ", j.run_id, " \u5417\uFF1F"] }), description: "\u5220\u9664\u540E\u4E0D\u518D\u663E\u793A\u8BE5\u4F5C\u4E1A\u53CA\u5176\u63A2\u7D22\u7ED3\u679C\u3002", disabled: j.status === 'RUNNING' || j.status === 'PENDING', restoreFocus: () => document.getElementById(jobs.length > 1 ? 'exp-jobsearch' : 'exp-new'), onDelete: async () => {
                                                                                await request(`/analysis/delete/${encodeURIComponent(j.run_id)}`, {});
                                                                                refreshJobs();
                                                                            } })] }) })] }, j.run_id));
                                                }) })] }) }), _jsx(Pagination, { total: filteredJobs.length, page: currentJobPage, onPage: handleJobPageChange, label: "\u63A2\u7D22\u4F5C\u4E1A", size: IBA_JOBS_PAGE_SIZE, hideSinglePage: true })] })) : (_jsx("div", { className: "exp-job-empty", role: "status", children: jobQuery.loading ? "正在读取探索作业…" : jobs.length ? "没有符合筛选条件的探索作业。" : "当前没有探索作业" })) }), !selectedJob ? (_jsxs("section", { className: "exp-panel exp-selected-result exp-empty-result", "aria-label": "\u63A2\u7D22\u7ED3\u679C", children: [_jsx(SectionHeading, { title: "\u63A2\u7D22\u7ED3\u679C" }), _jsx("div", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u6CA1\u6709\u63A2\u7D22\u7ED3\u679C" })] })) : ['PENDING', 'RUNNING'].includes(selectedJob.status) ? (_jsxs("section", { className: "exp-panel exp-selected-result", "aria-label": "\u63A2\u7D22\u7ED3\u679C", children: [_jsx(SectionHeading, { title: "\u63A2\u7D22\u7ED3\u679C" }), _jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u4F5C\u4E1A\u6CA1\u6709\u5DF2\u53D1\u5E03\u7ED3\u679C" })] })) : ['FAILED', 'CANCELLED', 'INTERRUPTED'].includes(selectedJob.status) ? (_jsxs("section", { className: "exp-panel exp-selected-result", "aria-label": "\u63A2\u7D22\u7ED3\u679C", children: [_jsx(SectionHeading, { title: "\u63A2\u7D22\u7ED3\u679C" }), _jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u4F5C\u4E1A\u6CA1\u6709\u5DF2\u53D1\u5E03\u7ED3\u679C" })] })) : (_jsxs("section", { className: "exp-panel exp-selected-result", "aria-label": "\u6240\u9009\u4F5C\u4E1A\u7684\u63A2\u7D22\u7ED3\u679C", children: [_jsx(SectionHeading, { title: "\u63A2\u7D22\u7ED3\u679C", children: _jsx("span", { className: "exp-selected-sub", children: selectedJob.run_id }) }), _jsxs("div", { className: "exp-result-content", children: [selectedJobSummary && _jsx("p", { className: "exp-result-summary", children: selectedJobSummary }), selectedJobDirections.length > 0 ? (_jsx("div", { className: "exp-job-table-wrap", children: _jsxs("table", { className: "exp-job-table exp-direction-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u65B9\u5411" }), _jsx("th", { children: "\u63CF\u8FF0" }), _jsx("th", { children: "\u9002\u7528\u77E5\u8BC6" }), _jsx("th", { className: "iad-number", children: "\u8BC1\u636E" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: selectedJobDirections.map((d) => {
                                                        const evidenceCount = d.evidences?.length || 0;
                                                        return (_jsxs("tr", { tabIndex: 0, "data-action": "direction", "data-id": d.id, "aria-label": `查看方向 ${d.title}`, onClick: () => {
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
                                                    }) })] }) })) : (_jsx("p", { className: "exp-lead", children: "\u672C\u6B21\u6CA1\u6709\u5F62\u6210\u53EF\u7528\u7684\u5019\u9009\u65B9\u5411\u3002" })), _jsxs("div", { className: "exp-limitations", children: [_jsx("div", { className: "exp-result-section-head", children: _jsx("h3", { children: "\u6574\u4F53\u9650\u5236" }) }), selectedJobLimitations.length ? (_jsx("ol", { children: selectedJobLimitations.map((text, i) => (_jsx("li", { children: text }, i))) })) : (_jsx("p", { className: "exp-lead", children: "\u672C\u6B21\u672A\u8BB0\u5F55\u6574\u4F53\u9650\u5236\u3002" }))] })] })] }))] })), modal === "prompt" && promptText !== null && _jsx(PromptDrawer, { title: "\u63A2\u7D22\u63D0\u793A\u8BCD", text: promptText || '本次作业未记录提示词正文。', onClose: () => setModal('') }), modal === 'save' && _jsx(ExplorationPresetDialog, { text: prompt, onClose: () => setModal(''), onSaved: saved => {
                    setPresets(values => [...values, saved]);
                    setSelectedPresetId(saved.id);
                    setOriginalPrompt(saved.text);
                    setModal('');
                } }), modal === 'source' && _jsx(ExplorationSourceDialog, { kind: sampleTab, candidates: samplePool, selected: sampleTab === 'normal' ? normalSelected : defectSelected, loading: samplesLoading, onChange: sampleTab === 'normal' ? setNormalSelected : setDefectSelected, onClose: () => setModal('') }), modal === "direction" && viewingDirection && (_jsx(DirectionDetailDialog, { direction: viewingDirection, evidence: currentEvidence, highlightRef: highlightRef, onHighlightRef: setHighlightRef, onChipFocus: handleChipFocus, onOpenFullscreen: handleOpenEvidenceFullscreen, onClose: () => { setModal(""); setViewingDirection(null); } })), viewerData && (_jsx(FullscreenViewer, { open: true, item: viewerData.items[viewerData.currentIndex] || null, items: viewerData.items, currentIndex: viewerData.currentIndex, onClose: () => setViewerData(null), onNavigate: (idx) => setViewerData((prev) => (prev ? { ...prev, currentIndex: idx } : null)) })), statusJobId && jobs.some(job => job.run_id === statusJobId || job.root_run_id === statusJobId) && _jsx(JobStatusDrawer, { job: jobs.find(job => job.run_id === statusJobId || job.root_run_id === statusJobId), onClose: () => setStatusJobId(null) })] }));
}
