import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { v4 as uuid } from 'uuid';
import { Modal } from './Modal.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { TabBar } from './layout/TabBar.js';
import { Button } from './Button.js';
import { AgentPromptEditors } from './AgentPromptEditors.js';
import { IconButton } from "./IconButton.js";
import { promptDefaults } from '../../shared/prompt-defaults.generated.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message, request } from '../api.js';
import { useModuleSettings } from '../useModuleSettings.js';
import { getDatasetGroupId } from '../dataset-hierarchy.js';
import { KnowledgeConfirmation } from './KnowledgeConfirmation.js';
export function KnowledgeMiningCreate({ dataset, datasets, groups, selectedParentId, selectedChildId, onClose, onStarted }) {
    const parentGroups = groups.filter(group => group.group_id !== 'single');
    const configuration = useModuleSettings('knowledge');
    const configuredBatch = configuration.settings && 'batch_size' in configuration.settings ? configuration.settings.batch_size : undefined;
    const [batchSize, setBatchSize] = useState(null);
    useEffect(() => { if (configuredBatch !== undefined)
        setBatchSize(configuredBatch); }, [configuredBatch]);
    const started = useRef(null);
    const submission = useRef(null);
    const [confirmState, setConfirmState] = useState(null);
    const [setupDataset, setSetupDataset] = useState(selectedParentId);
    const [setupSubsets, setSetupSubsets] = useState(new Set([selectedChildId]));
    const [setupGeneral, setSetupGeneral] = useState(new Set());
    const [setupExplored, setSetupExplored] = useState(new Set());
    const [setupEdits, setSetupEdits] = useState({});
    const [setupTab, setSetupTab] = useState('preset');
    const [setupPrompt, setSetupPrompt] = useState("");
    const [systemPrompt, setSystemPrompt] = useState(promptDefaults.system.knowledge);
    const [setupPromptDirty, setSetupPromptDirty] = useState(false);
    const [formError, setFormError] = useState("");
    const [editingDir, setEditingDir] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingText, setEditingText] = useState("");
    const [dirEditError, setDirEditError] = useState("");
    const currentSetupParent = useMemo(() => {
        return parentGroups.find(g => g.group_id === setupDataset) || parentGroups[0];
    }, [parentGroups, setupDataset]);
    const currentSetupChildDatasets = useMemo(() => {
        return datasets.filter(d => getDatasetGroupId(d) === setupDataset);
    }, [datasets, groups, setupDataset]);
    const [presetDirections, setPresetDirections] = useState([]);
    const [exploredDirections, setExploredDirections] = useState([]);
    const [directionsError, setDirectionsError] = useState('');
    const [presetsLoading, setPresetsLoading] = useState(true);
    const [directionsLoading, setDirectionsLoading] = useState(true);
    const [presetsError, setPresetsError] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        request('/knowledge/presets', undefined, undefined, controller.signal)
            .then(({ directions }) => {
            if (controller.signal.aborted)
                return;
            setPresetDirections(directions.map(d => ({ id: 'preset:' + d.direction_id, directionId: d.direction_id, name: d.title, text: d.instruction, origin: d.origin, source: d.source })));
            setPresetsLoading(false);
        }).catch(error => { if (!controller.signal.aborted) {
            setPresetsError(message(error));
            setPresetsLoading(false);
        } });
        return () => controller.abort();
    }, []);
    const subsetIds = JSON.stringify([...setupSubsets].sort());
    useEffect(() => {
        const controller = new AbortController();
        setDirectionsError('');
        setDirectionsLoading(true);
        const ids = JSON.parse(subsetIds);
        request(`/analysis/directions?${new URLSearchParams({ dataset_ids: JSON.stringify(ids) })}`, undefined, undefined, controller.signal)
            .then(({ directions }) => {
            if (controller.signal.aborted)
                return;
            const explored = directions.map(d => ({ id: JSON.stringify(d.source), directionId: d.direction_id, name: d.title, text: d.instruction, origin: d.origin, source: d.source }));
            const available = new Set(explored.map(d => d.id));
            setExploredDirections(explored);
            setSetupExplored(previous => new Set([...previous].filter(id => available.has(id))));
            setDirectionsLoading(false);
        }).catch(error => { if (!controller.signal.aborted) {
            setDirectionsError(message(error));
            setDirectionsLoading(false);
        } });
        return () => controller.abort();
    }, [subsetIds]);
    const kbExploredDirs = exploredDirections;
    const getDirInfo = useCallback((item, dirKind) => {
        const edit = setupEdits[`${dirKind}:${item.id}`];
        return edit ? { ...item, ...edit } : item;
    }, [setupEdits]);
    const allSelectedDirItems = useMemo(() => {
        const presetsList = presetDirections
            .filter(p => setupGeneral.has(p.id))
            .map(p => getDirInfo(p, "preset"));
        const exploredList = kbExploredDirs
            .filter(e => setupExplored.has(e.id))
            .map(e => getDirInfo(e, "explore"));
        return [...presetsList, ...exploredList];
    }, [setupGeneral, setupExplored, kbExploredDirs, presetDirections, getDirInfo]);
    const generatePromptText = useCallback((datasetName, subsetsNames, dirs) => {
        return [
            "挖掘目标：",
            promptDefaults.knowledgeObjective,
            `数据集：${datasetName}`,
            `子数据集：${subsetsNames.join("、")}`,
            "来源范围：所选子数据集的全部登记图像。",
            "用户选择的观察方向：",
            ...dirs.map((x, index) => `D${index + 1} | ${x.name}：${x.text}`),
        ].join("\n");
    }, []);
    useEffect(() => {
        if (setupPromptDirty)
            return;
        const parentName = currentSetupParent?.name || dataset.name;
        const subsetsNames = currentSetupChildDatasets
            .filter((c) => setupSubsets.has(c.dataset_id))
            .map((c) => c.name);
        setSetupPrompt(generatePromptText(parentName, subsetsNames, allSelectedDirItems));
    }, [setupPromptDirty, currentSetupParent, currentSetupChildDatasets, setupSubsets, allSelectedDirItems, generatePromptText, dataset.name]);
    const validationProblem = useMemo(() => {
        if (!configuration.settings?.model)
            return configuration.loading ? '正在读取模型' : '请先配置知识挖掘分析模型';
        if (configuration.saving)
            return '正在保存每批图像数';
        if (configuration.error)
            return configuration.error;
        if (directionsLoading || presetsLoading)
            return '正在读取方向';
        if (!Number.isInteger(batchSize) || batchSize === null || batchSize < 1 || batchSize > 200)
            return '每批图像数应为1至200的整数';
        if (directionsError || presetsError)
            return directionsError || presetsError;
        if (!setupSubsets.size)
            return "请选择子数据集";
        if (!allSelectedDirItems.length)
            return "请选择挖掘方向";
        if (!systemPrompt.trim())
            return '请填写系统提示词';
        if (!setupPrompt.trim())
            return '请填写用户提示词';
        return "";
    }, [setupSubsets.size, allSelectedDirItems.length, setupPrompt, systemPrompt, directionsError, presetsError, directionsLoading, presetsLoading, presetDirections.length, configuration.settings, configuration.loading, configuration.saving, configuration.error, batchSize]);
    const handleRestorePrompt = () => {
        if (setupPromptDirty && setupPrompt.trim()) {
            setConfirmState({
                title: "恢复自动生成提示词",
                message: "恢复将覆盖手工修改的提示词。",
                danger: false,
                onConfirm: () => {
                    setSetupPromptDirty(false);
                    const parentName = currentSetupParent?.name || dataset.name;
                    const subsetsNames = currentSetupChildDatasets
                        .filter((c) => setupSubsets.has(c.dataset_id))
                        .map((c) => c.name);
                    setSetupPrompt(generatePromptText(parentName, subsetsNames, allSelectedDirItems));
                    setConfirmState(null);
                }
            });
            return;
        }
        setSetupPromptDirty(false);
        const parentName = currentSetupParent?.name || dataset.name;
        const subsetsNames = currentSetupChildDatasets
            .filter((c) => setupSubsets.has(c.dataset_id))
            .map((c) => c.name);
        setSetupPrompt(generatePromptText(parentName, subsetsNames, allSelectedDirItems));
    };
    const closeCreate = () => {
        if (submitting)
            return;
        if (started.current)
            onStarted([started.current]);
        else
            onClose();
    };
    const saveDirEdit = () => {
        if (!editingDir)
            return;
        const name = editingName.trim();
        const text = editingText.trim();
        if (!name || !text) {
            setDirEditError("标题和描述不能为空。");
            return;
        }
        setSetupEdits(prev => ({
            ...prev,
            [`${editingDir.kind}:${editingDir.id}`]: { name, text }
        }));
        setEditingDir(null);
    };
    const closeDirDrawer = () => {
        setEditingDir(null);
        setDirEditError("");
    };
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => { if (!started.current)
        submission.current = null; }, [setupDataset, setupPrompt, systemPrompt, batchSize, JSON.stringify(Array.from(setupSubsets).sort())]);
    const handleSubmitJob = async () => {
        if (validationProblem || submitting)
            return;
        setSubmitting(true);
        setFormError('');
        try {
            const miningPrompt = {
                objective: `${currentSetupParent?.name || dataset.name}知识挖掘`, instruction: setupPrompt, exploration: null,
                directions: allSelectedDirItems.map(item => ({ direction_id: item.directionId, title: item.name, instruction: item.text, enabled: true,
                    origin: item.origin, source: item.source })),
            };
            if (batchSize !== configuredBatch)
                await configuration.saveAsync({ batch_size: batchSize });
            submission.current ||= uuid();
            const job = await request('/analysis/start', { submission_id: submission.current, analysis_kind: 'knowledge',
                dataset_ids: [...setupSubsets], system_prompt: systemPrompt, mining_prompt: miningPrompt });
            started.current = job;
            onStarted([job]);
        }
        catch (error) {
            setFormError(message(error));
        }
        finally {
            setSubmitting(false);
        }
    };
    return _jsxs(_Fragment, { children: [_jsxs("section", { id: "kb-setup-page", className: "kb-setup-page", "aria-label": "\u65B0\u5EFA\u77E5\u8BC6\u6316\u6398\u914D\u7F6E", children: [_jsx(WorkbenchHeader, { pageId: "industrial-knowledge", title: "\u65B0\u5EFA\u6316\u6398", children: _jsx(Button, { type: "button", id: "kb-setup-back", onClick: closeCreate, disabled: submitting, children: "\u8FD4\u56DE\u4F5C\u4E1A\u4E0E\u7ED3\u679C" }) }), _jsxs("fieldset", { className: "kb-create-fields", disabled: submitting || directionsLoading || presetsLoading || !!started.current, children: [_jsx(DatasetScopeSelector, { className: "kb-setup-scope", groups: parentGroups, selectedGroupId: setupDataset, onGroupChange: id => {
                                    setSetupDataset(id);
                                    const first = datasets.find(item => getDatasetGroupId(item) === id)?.dataset_id;
                                    setSetupSubsets(new Set(first ? [first] : []));
                                    setSetupExplored(new Set());
                                }, childDatasets: currentSetupChildDatasets, selectedChildIds: setupSubsets, onChildToggle: id => setSetupSubsets(previous => {
                                    const next = new Set(previous);
                                    if (next.has(id))
                                        next.delete(id);
                                    else
                                        next.add(id);
                                    return next;
                                }), disabled: submitting || directionsLoading || presetsLoading || !!started.current, groupId: "kb-setup-dataset", childId: "kb-setup-child-trigger", childMenuId: "kb-setup-child-menu" }), _jsxs("section", { className: "exp-panel kb-setup-directions", "aria-labelledby": "kb-direction-heading", children: [_jsx("h2", { id: "kb-direction-heading", children: "\u9009\u62E9\u6316\u6398\u65B9\u5411" }), _jsx(TabBar, { label: "\u6316\u6398\u65B9\u5411\u7C7B\u578B", value: setupTab, onChange: setSetupTab, items: [
                                            { id: 'preset', label: '通用预设方向', buttonProps: { id: 'kb-tab-preset', 'aria-controls': 'kb-preset-panel', 'data-kb-tab': 'preset' } },
                                            { id: 'explore', label: '方向探索', buttonProps: { id: 'kb-tab-explore', 'aria-controls': 'kb-explore-panel', 'data-kb-tab': 'explore' } },
                                        ] }), _jsx("div", { id: "kb-preset-panel", role: "tabpanel", "aria-labelledby": "kb-tab-preset", className: setupTab !== "preset" ? "hide" : "", children: _jsx("div", { className: "kb-direction-table-wrap", children: _jsxs("table", { className: "kb-direction-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "kb-dir-check", children: _jsx("span", { className: "sr-only", children: "\u9009\u62E9" }) }), _jsx("th", { className: "kb-dir-title", children: "\u65B9\u5411" }), _jsx("th", { children: "\u63CF\u8FF0" }), _jsx("th", { className: "kb-dir-action", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { id: "general-directions", children: presetDirections.map(p => {
                                                            const info = getDirInfo(p, "preset");
                                                            const checked = setupGeneral.has(p.id);
                                                            return (_jsxs("tr", { children: [_jsx("td", { className: "kb-dir-check", children: _jsx("input", { type: "checkbox", "data-dir-kind": "preset", "data-dir-id": p.id, "aria-label": `选择${info.name}`, checked: checked, onChange: e => {
                                                                                const next = new Set(setupGeneral);
                                                                                if (e.target.checked)
                                                                                    next.add(p.id);
                                                                                else
                                                                                    next.delete(p.id);
                                                                                setSetupGeneral(next);
                                                                            } }) }), _jsx("td", { children: info.name }), _jsx("td", { children: info.text }), _jsx("td", { className: "kb-dir-action", children: _jsx(IconButton, { icon: "edit", type: "button", "data-edit-kind": "preset", "data-edit-id": p.id, label: `编辑方向 ${info.name}`, title: "\u7F16\u8F91\u65B9\u5411", onClick: () => {
                                                                                setEditingDir({ kind: "preset", id: p.id });
                                                                                setEditingName(info.name);
                                                                                setEditingText(info.text);
                                                                                setDirEditError("");
                                                                            } }) })] }, p.id));
                                                        }) })] }) }) }), _jsx("div", { id: "kb-explore-panel", role: "tabpanel", "aria-labelledby": "kb-tab-explore", className: setupTab !== "explore" ? "hide" : "", children: _jsx("div", { className: "kb-direction-table-wrap", children: _jsxs("table", { className: "kb-direction-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "kb-dir-check", children: _jsx("span", { className: "sr-only", children: "\u9009\u62E9" }) }), _jsx("th", { className: "kb-dir-title", children: "\u65B9\u5411" }), _jsx("th", { children: "\u63CF\u8FF0" }), _jsx("th", { className: "kb-dir-action", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { id: "explored-directions", children: kbExploredDirs.length ? (kbExploredDirs.map(e => {
                                                            const info = getDirInfo(e, "explore");
                                                            const checked = setupExplored.has(e.id);
                                                            return (_jsxs("tr", { children: [_jsx("td", { className: "kb-dir-check", children: _jsx("input", { type: "checkbox", "data-dir-kind": "explore", "data-dir-id": e.id, "aria-label": `选择${info.name}`, checked: checked, onChange: ev => {
                                                                                const next = new Set(setupExplored);
                                                                                if (ev.target.checked)
                                                                                    next.add(e.id);
                                                                                else
                                                                                    next.delete(e.id);
                                                                                setSetupExplored(next);
                                                                            } }) }), _jsx("td", { children: info.name }), _jsx("td", { children: info.text }), _jsx("td", { className: "kb-dir-action", children: _jsx(IconButton, { icon: "edit", type: "button", "data-edit-kind": "explore", "data-edit-id": e.id, label: `编辑方向 ${info.name}`, title: "\u7F16\u8F91\u65B9\u5411", onClick: () => {
                                                                                setEditingDir({ kind: "explore", id: e.id });
                                                                                setEditingName(info.name);
                                                                                setEditingText(info.text);
                                                                                setDirEditError("");
                                                                            } }) })] }, e.id));
                                                        })) : (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "kb-directions-empty", children: "\u6240\u9009\u5B50\u6570\u636E\u96C6\u6682\u65E0\u65B9\u5411\u63A2\u7D22\u7ED3\u679C\u3002" }) })) })] }) }) })] }), _jsxs("section", { className: "exp-panel kb-setup-prompt", "aria-labelledby": "kb-prompt-title", children: [_jsxs("div", { className: "kb-prompt-header", children: [_jsx("h2", { id: "kb-prompt-title", children: "\u63D0\u793A\u8BCD" }), _jsx(Button, { type: "button", id: "compose-prompt", onClick: handleRestorePrompt, children: "\u6062\u590D\u81EA\u52A8\u751F\u6210" })] }), _jsx(AgentPromptEditors, { id: "prompt-text", system: systemPrompt, user: setupPrompt, onSystemChange: setSystemPrompt, onUserChange: text => {
                                            setSetupPrompt(text);
                                            setSetupPromptDirty(true);
                                        }, disabled: submitting }), _jsx("div", { className: "kb-prompt-note", id: "prompt-note", "aria-live": "polite", children: setupPromptDirty ? "已手动修改，方向调整后保持当前内容。" : "" })] })] }), _jsxs("section", { className: "exp-panel kb-setup-confirm", "aria-labelledby": "kb-confirm-title", children: [_jsx("div", { className: "exp-panel-title", children: _jsx("h2", { id: "kb-confirm-title", children: "\u786E\u8BA4\u5E76\u542F\u52A8" }) }), _jsxs("div", { className: "exp-brief", id: "kb-run-summary", "aria-live": "polite", children: [_jsxs("span", { children: ["\u5B50\u6570\u636E\u96C6 ", setupSubsets.size, " \u4E2A"] }), _jsxs("span", { children: ["\u6316\u6398\u65B9\u5411 ", allSelectedDirItems.length, " \u9879"] }), _jsx("span", { children: "\u8303\u56F4 \u5168\u90E8\u767B\u8BB0\u56FE\u50CF" }), _jsxs("label", { children: ["\u6BCF\u6279\u56FE\u50CF\u6570 ", _jsx("input", { className: "f", "aria-label": "\u6BCF\u6279\u6316\u6398\u56FE\u50CF\u6570", type: "number", min: "1", max: "200", value: batchSize ?? '', disabled: submitting || !!started.current || configuration.loading, "aria-describedby": "kb-run-check", onChange: e => setBatchSize(Number(e.target.value)), onBlur: () => { if (batchSize !== null && Number.isInteger(batchSize) && batchSize >= 1 && batchSize <= 200 && batchSize !== configuredBatch)
                                                    configuration.save({ batch_size: batchSize }); } })] }), _jsxs("span", { children: ["\u6A21\u578B ", configuration.settings?.model?.model_id || '未配置'] })] }), _jsxs("div", { className: "exp-summarybar", children: [_jsx("span", { id: "kb-run-check", role: "status", children: validationProblem || "已满足启动条件" }), _jsx("div", { className: "exp-actions", children: _jsx(Button, { type: "button", variant: "primary", id: "submit-job", disabled: !!validationProblem || submitting, onClick: handleSubmitJob, children: submitting ? "启动中…" : "开始挖掘" }) })] }), formError && (_jsx("div", { id: "form-alert", className: "kb-setup-error", role: "alert", children: formError }))] })] }), editingDir && _jsxs(Modal, { title: "\u7F16\u8F91\u6316\u6398\u65B9\u5411", className: "iad-drawer", id: "kb-dir-drawer", onClose: closeDirDrawer, children: [_jsxs("div", { className: "iad-dialog-body", children: [_jsxs("label", { className: "iad-field", htmlFor: "kb-dir-edit-name", children: ["\u6807\u9898", _jsx("input", { id: "kb-dir-edit-name", maxLength: 120, value: editingName, onChange: event => setEditingName(event.target.value) })] }), _jsxs("label", { className: "iad-field", htmlFor: "kb-dir-edit-text", children: ["\u63CF\u8FF0", _jsx("textarea", { id: "kb-dir-edit-text", rows: 9, value: editingText, onChange: event => setEditingText(event.target.value) })] }), dirEditError && _jsx("p", { id: "kb-dir-edit-error", role: "alert", children: dirEditError })] }), _jsxs("footer", { className: "iad-dialog-footer", children: [_jsx(Button, { id: "kb-dir-cancel", onClick: closeDirDrawer, children: "\u53D6\u6D88" }), _jsx(Button, { variant: "primary", id: "kb-dir-save", onClick: saveDirEdit, children: "\u4FDD\u5B58" })] })] }), _jsx(KnowledgeConfirmation, { state: confirmState, onClose: () => setConfirmState(null) })] });
}
