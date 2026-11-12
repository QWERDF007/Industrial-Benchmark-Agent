import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { analysisReadSource } from '../analysis-results.js';
import { jobIsActive } from '../../shared/job-display.js';
import { SectionHeading } from './layout/SectionHeading.js';
import { AnalysisExportButton } from './AnalysisExportButton.js';
import { AnalysisEvidenceViewer } from './AnalysisEvidenceViewer.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { v4 as uuid } from 'uuid';
import { ExplorationPresetDialog } from './ExplorationPresetDialog.js';
import { ExplorationSourceDialog } from './ExplorationSourceDialog.js';
import { AnalysisPromptDrawer } from './AnalysisPromptDrawer.js';
import { AgentPromptEditors } from './AgentPromptEditors.js';
import { promptDefaults } from '../../shared/prompt-defaults.generated.js';
import { JobStatusDrawer } from './JobStatusDrawer.js';
import { JobList } from './JobList.js';
import { useJobList } from '../useJobList.js';
import { Select } from './Select.js';
import { TabBar } from './layout/TabBar.js';
import { Button } from './Button.js';
import { ThumbnailCard } from "./ThumbnailCard.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mediaUrl, message, request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useDatasetCatalog } from '../useDatasetCatalog.js';
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import { PlusIcon } from "../AuditIcon.js";
import { IconButton } from "./IconButton.js";
import { DeleteAction } from './DeleteAction.js';
import { DatasetScopeSelector } from "./DatasetScopeSelector.js";
import { DirectionDetailDialog } from "./DirectionDetailDialog.js";
import { FullscreenViewer } from "./FullscreenViewer.js";
import { useModuleSettings } from '../useModuleSettings.js';
import { useResource } from "../useResource.js";
import { useWorkspace } from '../workspace.js';
import { ExplorationNarrative, explorationCandidates, explorationDirections } from "../exploration-view.js";
export function ExplorationPage({ dataset, refreshRevision, }) {
    const { workspace } = useWorkspace();
    const route = workspace.view('industrial-exploration');
    const selectedJobId = route.job;
    const selectJob = (job) => workspace.updateView('industrial-exploration', { job, version: '', selected: '' });
    const configuration = useModuleSettings('exploration');
    const catalog = useDatasetCatalog();
    const datasets = catalog.data?.datasets || [dataset], groups = catalog.data?.groups || [];
    const initialParentId = getDatasetGroupId(dataset);
    const initialChildren = datasets.filter((d) => getDatasetGroupId(d) === initialParentId);
    const [selectedParentId, setSelectedParentId] = useState(() => initialParentId);
    const [selectedChildIds, setSelectedChildIds] = useState(() => initialChildren.length > 0 ? initialChildren.map((c) => c.dataset_id) : [dataset.dataset_id]);
    // View state: 'jobs' (unified layout) or 'setup' (3-step creation)
    const [view, setView] = useState("jobs");
    const [statusJobId, setStatusJobId] = useState(null);
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
    const [systemPrompt, setSystemPrompt] = useState(promptDefaults.explorationSystem[dataset.format]);
    const [observerSystemPrompt, setObserverSystemPrompt] = useState(promptDefaults.explorationObserverSystem[dataset.format]);
    const [observerUserPrompt, setObserverUserPrompt] = useState('');
    const systemFormat = useRef(dataset.format);
    const [originalPrompt, setOriginalPrompt] = useState("");
    // Modals
    const [modal, setModal] = useState("");
    const [promptJobId, setPromptJobId] = useState(null);
    const [viewingDirection, setViewingDirection] = useState(null);
    // Direction detail interaction
    // Fullscreen Viewer state (reusing shared FullscreenViewer.tsx)
    const [viewerData, setViewerData] = useState(null);
    const [analysisImage, setAnalysisImage] = useState(null);
    // Candidate samples pool
    const [samplePool, setSamplePool] = useState([]);
    const [samplesLoaded, setSamplesLoaded] = useState(false), [samplesLoading, setSamplesLoading] = useState(false);
    const sampleById = useMemo(() => new Map(samplePool.map(item => [item.id, item])), [samplePool]);
    const progress = useCallback(() => setRefreshTick(value => value + 1), []);
    const jobQuery = useJobs('exploration', selectedChildIds, progress, selectedJobId, refreshRevision);
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
                setObserverUserPrompt(first.text);
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
    const scopeFormats = new Set(datasets.filter(item => selectedChildIds.includes(item.dataset_id)).map(item => item.format));
    const scopeFormat = scopeFormats.size === 1 ? [...scopeFormats][0] : null;
    useEffect(() => {
        if (scopeFormat && scopeFormat !== systemFormat.current) {
            systemFormat.current = scopeFormat;
            setSystemPrompt(promptDefaults.explorationSystem[scopeFormat]);
            setObserverSystemPrompt(promptDefaults.explorationObserverSystem[scopeFormat]);
        }
    }, [scopeFormat]);
    const jobList = useJobList(jobs, jobQuery.identity, selectedJobId, job => selectJob(job.root_run_id));
    const selectedJob = jobList.selected;
    const results = useResource(selectedJob ? `/analysis/results/${encodeURIComponent(selectedJob.run_id)}` : null, `${refreshTick}:${selectedJob?.status}:${selectedJob?.analysis_version_id}`, jobIsActive(selectedJob));
    const historical = useResource(route.job === selectedJob?.run_id && route.version
        ? `/analysis/publications/${encodeURIComponent(route.version)}` : null, refreshTick);
    const publication = historical.data || (jobIsActive(selectedJob) ? results.data?.current : results.data?.publication || results.data?.current);
    const publicationSource = publication ? analysisReadSource(publication) : null;
    const datasetNames = useMemo(() => Object.fromEntries(datasets.map(item => [item.dataset_id, item.name])), [datasets]);
    const narrative = useMemo(() => publication ? new ExplorationNarrative(publication, datasetNames) : null, [publication, datasetNames]);
    const selectedJobDirections = useMemo(() => explorationDirections(publication, route.selected, datasetNames), [publication, route.selected, datasetNames]);
    const selectedJobLimitations = publication?.catalog.limitations.map(text => narrative.text(text)) || [];
    const selectedJobSummary = publication ? narrative.text(publication.catalog.summary) : '';
    useEffect(() => {
        if (!route.selected || !publication)
            return;
        const direction = selectedJobDirections.find(item => item.id === route.selected);
        if (direction) {
            setViewingDirection(direction);
            setModal('direction');
        }
    }, [route.selected, publication && ('version_id' in publication ? publication.version_id : publication.revision)]);
    const runningJob = jobs.find((j) => j.status === "RUNNING" || j.status === "PENDING");
    const runReason = runningJob ? '已有探索作业正在运行' : !selectedChildIds.length ? '请选择子数据集'
        : scopeFormats.size !== 1 ? '请选择同一标注类型的子数据集'
            : !normalSelected.length && !defectSelected.length ? '至少选择一张样例图像'
                : normalSelected.some(id => defectSelected.includes(id)) ? '同一图像不能同时作为良品和异常样例'
                    : ![...normalSelected, ...defectSelected].every(id => sampleById.has(id)) ? '图像不可用，请重新选择'
                        : !configuration.settings?.model ? configuration.loading ? '正在读取模型' : '请先配置方向探索分析模型'
                            : !systemPrompt.trim() ? '请填写主 Agent 系统提示词' : !prompt.trim() ? '请填写主 Agent 用户提示词'
                                : !observerSystemPrompt.trim() ? '请填写子 Agent 系统提示词' : !observerUserPrompt.trim() ? '请填写子 Agent 用户提示词' : '';
    const canRun = !submitting && !runReason;
    const resetScope = () => {
        setSamplePool([]);
        setNormalSelected([]);
        setDefectSelected([]);
        setSamplesLoaded(false);
        setSamplesLoading(false);
        selectJob('');
    };
    // Handle parent group change
    const handleParentChange = (newParentId) => {
        resetScope();
        setSelectedParentId(newParentId);
        const children = datasets.filter((d) => getDatasetGroupId(d) === newParentId);
        setSelectedChildIds(children.map((c) => c.dataset_id));
    };
    // Toggle child dataset selection
    const handleChildToggle = (cid) => {
        resetScope();
        setSelectedChildIds((prev) => prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]);
    };
    // Preset selection
    const handlePresetChange = (presetId) => {
        const p = presets.find((x) => x.id === presetId);
        if (p) {
            setSelectedPresetId(presetId);
            setPrompt(p.text);
            setObserverUserPrompt(p.text);
            setOriginalPrompt(p.text);
        }
    };
    const handleStartExploration = async () => {
        if (!canRun)
            return;
        setSubmitting(true);
        setError('');
        try {
            const submissionBody = { analysis_kind: 'exploration',
                dataset_ids: [selectedChildIds[0], ...selectedChildIds.slice(1)], normal_images: normalSelected, defect_images: defectSelected, system_prompt: systemPrompt,
                observer_prompt: { system_prompt: observerSystemPrompt, user_prompt: observerUserPrompt },
                prompt: { preset_id: selectedPresetId, preset_name: presets.find(preset => preset.id === selectedPresetId)?.name || '自定义',
                    preset_revision: presets.find(preset => preset.id === selectedPresetId)?.revision ?? null, text: prompt } };
            const key = JSON.stringify(submissionBody);
            if (submission.current?.key !== key)
                submission.current = { key, id: uuid() };
            const res = await request('/analysis/start', { ...submissionBody, submission_id: submission.current.id });
            selectJob(res.run_id);
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
    const currentEvidence = viewingDirection?.evidences || [];
    // Open FullscreenViewer on evidence click
    const handleOpenEvidenceFullscreen = (clickedRef) => {
        const selected = currentEvidence.find(item => item.ref === clickedRef);
        if (selected && viewingDirection) {
            setAnalysisImage({ result: viewingDirection.source, source: { id: selected.evidenceId, sampleId: selected.sampleId, title: selected.filename, imageUrl: selected.fullUrl } });
            return;
        }
        const allItems = currentEvidence.map((item) => ({
            id: item.ref, sampleId: item.sampleId,
            title: item.filename,
            imageUrl: item.fullUrl,
        }));
        const index = currentEvidence.findIndex((item) => item.ref === clickedRef);
        if (index < 0) {
            setError('图像证据不可用');
            return;
        }
        setViewerData({
            items: allItems,
            currentIndex: index,
        });
    };
    return (_jsxs("div", { id: "exploration-page", className: "iad-exploration-page", children: [(error || results.error || jobQuery.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || results.error || jobQuery.error }), _jsx(WorkbenchHeader, { pageId: "industrial-exploration", className: "exp-heading", title: view === "setup" ? "新建探索" : undefined, children: _jsx("div", { className: "exp-heading-actions", children: view === "setup" ? (_jsx(Button, { type: "button", onClick: () => setView("jobs"), children: "\u8FD4\u56DE\u4F5C\u4E1A\u4E0E\u7ED3\u679C" })) : (_jsx(Button, { id: "exp-new", type: "button", variant: "primary", disabled: !!runningJob || submitting, title: runningJob ? "已有探索任务运行或排队" : "新建探索", onClick: () => {
                            resetScope();
                            const format = scopeFormat || dataset.format;
                            systemFormat.current = format;
                            setSystemPrompt(promptDefaults.explorationSystem[format]);
                            setObserverSystemPrompt(promptDefaults.explorationObserverSystem[format]);
                            setView('setup');
                        }, children: "\u65B0\u5EFA\u63A2\u7D22" })) }) }), _jsx(DatasetScopeSelector, { className: "exp-scope", groups: parentGroups, selectedGroupId: selectedParentId, onGroupChange: handleParentChange, childDatasets: currentChildDatasets, selectedChildIds: selectedChildIds, onChildToggle: handleChildToggle, disabled: submitting, groupId: "exp-parent", childId: "exp-child-toggle", childMenuId: "exp-child-menu", children: _jsx(IconButton, { icon: "refresh", id: "refresh", type: "button", title: "\u5237\u65B0\u63A2\u7D22\u4F5C\u4E1A", label: "\u5237\u65B0\u63A2\u7D22\u4F5C\u4E1A", disabled: submitting, onClick: () => {
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
                                                }, children: [_jsx(PlusIcon, { size: 24 }), !(sampleTab === "normal" ? normalSelected : defectSelected).length && _jsx("span", { children: "\u6DFB\u52A0\u56FE\u50CF" })] }) })] }) })] }), _jsxs("section", { className: "exp-panel", children: [_jsx("div", { className: "exp-panel-title", children: _jsx("h2", { children: "\u63A2\u7D22\u63D0\u793A\u8BCD" }) }), _jsxs("div", { className: "exp-prompt-head", children: [_jsxs("label", { className: "exp-input", children: ["\u63D0\u793A\u8BCD\u9884\u8BBE", _jsx(Select, { id: "exp-preset", value: selectedPresetId, onChange: (e) => handlePresetChange(e.target.value), children: presets.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id))) })] }), _jsx(Button, { type: "button", disabled: prompt === originalPrompt && observerUserPrompt === originalPrompt
                                            && systemPrompt === promptDefaults.explorationSystem[scopeFormat || dataset.format]
                                            && observerSystemPrompt === promptDefaults.explorationObserverSystem[scopeFormat || dataset.format], onClick: () => {
                                            const defaults = promptDefaults.explorationSystem[scopeFormat || dataset.format];
                                            setPrompt(originalPrompt);
                                            setObserverUserPrompt(originalPrompt);
                                            setSystemPrompt(defaults);
                                            setObserverSystemPrompt(promptDefaults.explorationObserverSystem[scopeFormat || dataset.format]);
                                        }, children: "\u91CD\u7F6E\u4E3A\u9884\u8BBE" }), _jsx(Button, { type: "button", disabled: !prompt.trim(), onClick: () => {
                                            setModal("save");
                                        }, children: "\u53E6\u5B58\u4E3A\u9884\u8BBE" })] }), _jsx(AgentPromptEditors, { id: "exp-prompt", agentLabel: "\u4E3B Agent", system: systemPrompt, user: prompt, onSystemChange: setSystemPrompt, onUserChange: setPrompt, disabled: submitting }), _jsx(AgentPromptEditors, { id: "exp-observer-prompt", agentLabel: "\u5B50 Agent", system: observerSystemPrompt, user: observerUserPrompt, onSystemChange: setObserverSystemPrompt, onUserChange: setObserverUserPrompt, disabled: submitting })] }), _jsxs("section", { className: "exp-panel", children: [_jsx("div", { className: "exp-panel-title", children: _jsx("h2", { children: "\u786E\u8BA4\u5E76\u542F\u52A8" }) }), _jsxs("div", { className: "exp-brief", children: [_jsxs("span", { children: ["\u6240\u9009\u5B50\u6570\u636E\u96C6 ", selectedChildIds.length, " \u4E2A"] }), _jsxs("span", { children: ["\u4F18\u5148\u6837\u4F8B\uFF1A\u826F\u54C1 ", normalSelected.length, "\uFF0C\u5F02\u5E38 ", defectSelected.length] }), _jsxs("span", { children: ["\u6A21\u578B ", configuration.settings?.model?.model_id || '未配置'] }), _jsx("span", { children: "\u6267\u884C\uFF1A\u6240\u9009\u5B50\u96C6\u5168\u91CF\u5206\u6279\u8FED\u4EE3" })] }), _jsxs("div", { className: "exp-summarybar", children: [_jsx("span", { children: runReason || '可启动' }), _jsx(Button, { type: "button", variant: "primary", disabled: !canRun, onClick: handleStartExploration, children: "\u542F\u52A8\u8054\u5408\u63A2\u7D22" })] })] })] })) : (_jsxs("div", { className: "exp-unified-layout", children: [_jsx(JobList, { title: "\u63A2\u7D22\u4F5C\u4E1A", className: "exp-job-list", list: jobList, datasets: datasets, loading: jobQuery.loading, actions: {
                            status: job => setStatusJobId(job.root_run_id), prompt: job => setPromptJobId(job.run_id), delete: async (job) => {
                                await request(`/analysis/delete/${encodeURIComponent(job.run_id)}`, {});
                                refreshJobs();
                            },
                        } }), !selectedJob ? (_jsxs("section", { className: "exp-panel exp-selected-result exp-empty-result", "aria-label": "\u63A2\u7D22\u7ED3\u679C", children: [_jsx(SectionHeading, { title: "\u63A2\u7D22\u7ED3\u679C" }), _jsx("div", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u6CA1\u6709\u63A2\u7D22\u7ED3\u679C" })] })) : !publication && ['PENDING', 'RUNNING'].includes(selectedJob.status) ? (_jsxs("section", { className: "exp-panel exp-selected-result", "aria-label": "\u63A2\u7D22\u7ED3\u679C", children: [_jsx(SectionHeading, { title: "\u63A2\u7D22\u7ED3\u679C" }), _jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u4F5C\u4E1A\u6CA1\u6709\u5DF2\u53D1\u5E03\u7ED3\u679C" })] })) : !publication && ['FAILED', 'CANCELLED', 'INTERRUPTED'].includes(selectedJob.status) ? (_jsxs("section", { className: "exp-panel exp-selected-result", "aria-label": "\u63A2\u7D22\u7ED3\u679C", children: [_jsx(SectionHeading, { title: "\u63A2\u7D22\u7ED3\u679C" }), _jsx("p", { className: "iad-result-empty", role: "status", children: "\u5F53\u524D\u4F5C\u4E1A\u6CA1\u6709\u5DF2\u53D1\u5E03\u7ED3\u679C" })] })) : (_jsxs("section", { className: "exp-panel exp-selected-result", "aria-label": "\u6240\u9009\u4F5C\u4E1A\u7684\u63A2\u7D22\u7ED3\u679C", children: [_jsx(SectionHeading, { title: "\u63A2\u7D22\u7ED3\u679C", children: publicationSource?.kind === 'published' && _jsx(AnalysisExportButton, { versionId: publicationSource.versionId }) }), _jsxs("div", { className: "exp-result-content", children: [selectedJobSummary && _jsx("p", { className: "exp-result-summary", children: selectedJobSummary }), selectedJobDirections.length > 0 ? (_jsx("div", { className: "exp-job-table-wrap", children: _jsxs("table", { className: "exp-job-table exp-direction-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u65B9\u5411" }), _jsx("th", { children: "\u63CF\u8FF0" }), _jsx("th", { children: "\u9002\u7528\u77E5\u8BC6" }), _jsx("th", { className: "iad-number", children: "\u8BC1\u636E" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: selectedJobDirections.map((d) => {
                                                        const evidenceCount = d.evidences?.length || 0;
                                                        return (_jsxs("tr", { tabIndex: 0, "data-action": "direction", "data-id": d.id, "aria-label": `查看方向 ${d.title}`, onClick: () => {
                                                                setViewingDirection(d);
                                                                setModal("direction");
                                                            }, children: [_jsx("td", { className: "exp-direction-name", children: d.title }), _jsx("td", { className: "exp-direction-description", title: narrative?.text(d.brief), children: d.brief }), _jsx("td", { children: d.applies }), _jsxs("td", { className: "iad-number", children: [evidenceCount, " \u5F20"] }), _jsxs("td", { className: "exp-direction-action", onClick: (e) => e.stopPropagation(), children: [_jsx(IconButton, { icon: "details", label: "\u67E5\u770B\u65B9\u5411", title: "\u67E5\u770B\u65B9\u5411", className: "exp-direction-view-icon exp-view-detail-button", onClick: () => {
                                                                                setViewingDirection(d);
                                                                                setModal("direction");
                                                                            } }), d.source.kind === 'published' && _jsx(DeleteAction, { title: "\u5220\u9664\u65B9\u5411", name: d.title, description: "\u4FDD\u7559\u539F\u59CB\u6A21\u578B\u7ED3\u679C\u548C\u5386\u53F2\u5F15\u7528\u3002", onDelete: async () => {
                                                                                const removal = { dataset_id: d.datasetId, version_id: d.source.kind === 'published' ? d.source.versionId : '', direction_id: d.id };
                                                                                await request('/exploration/directions/remove', removal);
                                                                                setRefreshTick(value => value + 1);
                                                                            } })] })] }, d.id));
                                                    }) })] }) })) : (_jsx("p", { className: "exp-lead", children: "\u672C\u6B21\u6CA1\u6709\u5F62\u6210\u53EF\u7528\u7684\u5019\u9009\u65B9\u5411\u3002" })), _jsxs("div", { className: "exp-limitations", children: [_jsx("div", { className: "exp-result-section-head", children: _jsx("h3", { children: "\u6574\u4F53\u9650\u5236" }) }), selectedJobLimitations.length ? (_jsx("ol", { children: selectedJobLimitations.map((text, i) => (_jsx("li", { children: text }, i))) })) : (_jsx("p", { className: "exp-lead", children: "\u672C\u6B21\u672A\u8BB0\u5F55\u6574\u4F53\u9650\u5236\u3002" }))] })] })] }))] })), promptJobId && _jsx(AnalysisPromptDrawer, { jobId: promptJobId, onClose: () => setPromptJobId(null) }), modal === 'save' && _jsx(ExplorationPresetDialog, { text: prompt, onClose: () => setModal(''), onSaved: saved => {
                    setPresets(values => [...values, saved]);
                    setSelectedPresetId(saved.id);
                    setOriginalPrompt(saved.text);
                    setModal('');
                } }), modal === 'source' && _jsx(ExplorationSourceDialog, { kind: sampleTab, candidates: samplePool, datasets: datasets.filter(item => selectedChildIds.includes(item.dataset_id)), selected: sampleTab === 'normal' ? normalSelected : defectSelected, loading: samplesLoading, onChange: sampleTab === 'normal' ? setNormalSelected : setDefectSelected, onClose: () => setModal('') }), modal === "direction" && viewingDirection && (_jsx(DirectionDetailDialog, { direction: viewingDirection, onOpenFullscreen: handleOpenEvidenceFullscreen, onClose: () => { setModal(""); setViewingDirection(null); workspace.updateView('industrial-exploration', { selected: '' }); } })), analysisImage && _jsx(AnalysisEvidenceViewer, { ...analysisImage, onClose: () => setAnalysisImage(null) }), viewerData && (_jsx(FullscreenViewer, { open: true, item: viewerData.items[viewerData.currentIndex] || null, items: viewerData.items, currentIndex: viewerData.currentIndex, onClose: () => setViewerData(null), onNavigate: (idx) => setViewerData((prev) => (prev ? { ...prev, currentIndex: idx } : null)) })), statusJobId && jobs.some(job => job.run_id === statusJobId || job.root_run_id === statusJobId) && _jsx(JobStatusDrawer, { job: jobs.find(job => job.run_id === statusJobId || job.root_run_id === statusJobId), onClose: () => setStatusJobId(null) })] }));
}
