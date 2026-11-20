import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { consistencyTaskPrompts, consistencyIdentityPrompts, consistencyTaskFormats } from '../../shared/prompt-defaults.generated.js';
import { identityPromptFields } from '../consistency-prompts.js';
import { buildHierarchyGroups, getDatasetGroupId } from '../dataset-hierarchy.js';
import { message, request } from '../api.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { AgentPromptEditors, PromptTextEditor } from './AgentPromptEditors.js';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
import { JobStartPanel } from './JobStartPanel.js';
import { ModuleSelectSetting } from './ModuleSelectSetting.js';
import { ModuleNumberSetting } from './ModuleNumberSetting.js';
import { useModuleSettings } from '../useModuleSettings.js';
import { consistencyAgentStartParameters } from '../../shared/consistency-agent.parameters.generated.js';
export function ConsistencyCheckCreate({ datasets, groups, parentId, datasetIds, onCancel, onStarted }) {
    const [parent, setParent] = useState(parentId), [selectedIds, setSelectedIds] = useState(datasetIds);
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    const business = useModuleSettings('consistency');
    const settings = business.settings && 'mode' in business.settings ? business.settings : undefined;
    const [scaleMode, setScaleMode] = useState('original');
    const [imageSize, setImageSize] = useState(2048);
    const imageMaxSide = scaleMode === 'original' ? null : imageSize;
    const [imageSizeValid, setImageSizeValid] = useState(true);
    const [minSimilarity, setMinSimilarity] = useState(consistencyAgentStartParameters.min_similarity.default);
    const [similarityValid, setSimilarityValid] = useState(true);
    const [drafts, setDrafts] = useState({ ...consistencyTaskPrompts });
    const [identity, setIdentity] = useState({ ...consistencyIdentityPrompts });
    const submission = useRef(null);
    const submitButton = useRef(null), confirmButton = useRef(null);
    const taskTypes = [...new Set(datasets.filter(dataset => selectedIds.includes(dataset.dataset_id)).map(dataset => consistencyTaskFormats[dataset.format]))];
    const task = taskTypes.length === 1 ? taskTypes[0] : null;
    const system = task ? drafts[task].system : '', user = task ? drafts[task].user : '';
    const valid = !!settings && !business.error && imageSizeValid && similarityValid && !!selectedIds.length && !!system.trim() && !!user.trim()
        && identityPromptFields.every(({ name }) => !!identity[name].trim());
    async function start() {
        if (!valid || busy)
            return;
        const key = JSON.stringify([selectedIds, system, user, identity, imageMaxSide, minSimilarity]);
        if (submission.current?.key !== key)
            submission.current = { key, id: uuid() };
        setBusy(true);
        setError('');
        try {
            const job = await request('/analysis/start', { submission_id: submission.current.id, analysis_kind: 'consistency',
                dataset_ids: selectedIds, system_prompt: system, instruction: user, identity_prompts: identity,
                whole_image_max_side: imageMaxSide, min_similarity: minSimilarity });
            onStarted(job, parent, selectedIds);
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("section", { id: "dc-create-page", className: "iad-create-page", "aria-label": "\u65B0\u5EFA\u4E00\u81F4\u6027\u68C0\u67E5", "aria-busy": busy, children: [_jsx(WorkbenchHeader, { pageId: "industrial-consistency", title: "\u65B0\u5EFA\u68C0\u67E5", children: _jsx(Button, { disabled: busy, onClick: onCancel, children: "\u8FD4\u56DE\u4F5C\u4E1A\u4E0E\u7ED3\u679C" }) }), _jsx(DatasetScopeSelector, { groups: buildHierarchyGroups(datasets, groups), selectedGroupId: parent, onGroupChange: next => { setParent(next); setSelectedIds(datasets.filter(dataset => getDatasetGroupId(dataset) === next).map(dataset => dataset.dataset_id)); }, childDatasets: datasets.filter(dataset => getDatasetGroupId(dataset) === parent), selectedChildIds: selectedIds, onChildToggle: id => setSelectedIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]), disabled: busy, className: "dc-scope", groupId: "dc-new-parent", childId: "dc-new-child-trigger", childMenuId: "dc-new-child-options" }), _jsx(JobStartPanel, { error: business.error, onSubmit: () => void start(), fields: [
                    { label: '检查范围', value: datasets.filter(dataset => selectedIds.includes(dataset.dataset_id)).map(dataset => dataset.name).join('、') || '未选择' },
                    { label: '模型', value: settings?.model?.model_id || '未配置' },
                    { label: '检索方式', value: settings ? settings.mode === 'exact' ? '完全一致' : '一致+相似' : '' },
                    { label: '缩放方式', value: _jsx(ModuleSelectSetting, { label: "\u7F29\u653E\u65B9\u5F0F", value: scaleMode, disabled: busy, onChange: setScaleMode, options: [{ value: 'original', label: '原图尺寸' }, { value: 'limited', label: '自定义最大边' }] }) },
                    { label: '图像大小（像素）', value: _jsx(ModuleNumberSetting, { label: "\u56FE\u50CF\u5927\u5C0F", value: imageSize, min: 1, step: 1, validationMessage: "\u56FE\u50CF\u5927\u5C0F\u9700\u8981\u4E3A\u6B63\u6574\u6570", onSave: setImageSize, disabled: busy, commitOnChange: true, onValidityChange: setImageSizeValid }) },
                    { label: '相似度阈值', value: _jsx(ModuleNumberSetting, { label: "\u76F8\u4F3C\u5EA6\u9608\u503C", value: minSimilarity, min: 0, max: 1, step: .001, fractionDigits: 3, validationMessage: "\u76F8\u4F3C\u5EA6\u9608\u503C\u9700\u5728 0\uFF5E1 \u4E4B\u95F4\uFF0C\u6700\u591A\u4E09\u4F4D\u5C0F\u6570", onSave: setMinSimilarity, disabled: busy, commitOnChange: true, onValidityChange: setSimilarityValid }) },
                ], actions: _jsxs(_Fragment, { children: [_jsx(Button, { "data-dc": "close-new", disabled: busy, onClick: onCancel, children: "\u53D6\u6D88" }), _jsx(Button, { type: "submit", variant: "primary", "data-dc": "create-job", ref: submitButton, disabled: !valid || busy, children: busy ? '启动中…' : '开始检查' })] }) }), _jsxs("section", { className: "iad-panel iad-form-fields", children: [_jsx(AgentPromptEditors, { id: "dc-new-prompt", system: system, user: user, disabled: busy, onSystemChange: text => { if (task)
                            setDrafts(previous => ({ ...previous, [task]: { ...previous[task], system: text } })); }, onUserChange: text => { if (task)
                            setDrafts(previous => ({ ...previous, [task]: { ...previous[task], user: text } })); } }), _jsx("div", { className: "iad-agent-prompts", children: identityPromptFields.map(({ name, label }) => _jsx(PromptTextEditor, { id: 'dc-identity-' + name, label: label, value: identity[name], disabled: busy, onChange: text => setIdentity(previous => ({ ...previous, [name]: text })) }, name)) })] }), error && _jsxs(Modal, { title: "\u521B\u5EFA\u68C0\u67E5\u5931\u8D25", size: "compact", initialFocus: confirmButton, restoreFocus: () => submitButton.current, onClose: () => setError(''), children: [_jsx("div", { className: "iad-dialog-body", children: _jsx("p", { role: "alert", className: "iad-error", children: error }) }), _jsx("footer", { className: "iad-dialog-footer", children: _jsx(Button, { ref: confirmButton, variant: "primary", onClick: () => setError(''), children: "\u77E5\u9053\u4E86" }) })] })] });
}
