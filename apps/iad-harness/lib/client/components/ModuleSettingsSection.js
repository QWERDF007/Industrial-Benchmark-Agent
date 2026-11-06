import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { businessModules } from '../../shared/business-modules.js';
import { useModuleSettings } from '../useModuleSettings.js';
import { useWorkbenchModel } from '../models.js';
import { Select } from './Select.js';
import { Button } from './Button.js';
import { moduleSettingsStyles } from '../styles/module-settings.js';
export function ModuleSettingsSection({ module }) {
    const { settings, save, retry, loading, saving, saved, error } = useModuleSettings(module);
    const { view, loading: modelsLoading, error: modelError } = useWorkbenchModel();
    const [thresholdInput, setThresholdInput] = useState(null), [thresholdError, setThresholdError] = useState('');
    const choices = (view?.providers || []).filter(provider => !provider.error).flatMap(provider => provider.models
        .filter(model => model.input_modalities?.includes('image')).map(model => ({ model: { provider_id: provider.provider_id, model_id: model.model_id }, label: `${model.name}（${provider.name}）` })));
    const selection = settings?.model ? JSON.stringify(settings.model) : '';
    const unavailable = !!selection && !choices.some(choice => JSON.stringify(choice.model) === selection);
    return _jsxs("section", { className: "iad-module-settings", "aria-label": `${businessModules[module]}设置`, "data-module-settings": module, children: [_jsx("style", { children: moduleSettingsStyles }), _jsx("h2", { children: businessModules[module] }), loading && !settings ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u8BBE\u7F6E\u2026" }) : settings && _jsxs("div", { children: [_jsxs("label", { className: "iad-module-row", children: [_jsx("span", { children: "\u5206\u6790\u6A21\u578B" }), _jsxs(Select, { "aria-label": "\u5206\u6790\u6A21\u578B", disabled: modelsLoading || !choices.length, value: selection, onChange: event => {
                                    const model = choices.find(choice => JSON.stringify(choice.model) === event.target.value)?.model;
                                    if (model)
                                        save({ model });
                                }, children: [_jsx("option", { value: "", disabled: true, children: modelsLoading ? '正在读取模型…' : choices.length ? '请选择具体模型' : '暂无可选模型' }), unavailable && _jsx("option", { value: selection, disabled: true, children: "\u6240\u9009\u6A21\u578B\u4E0D\u53EF\u7528" }), choices.map(choice => _jsx("option", { value: JSON.stringify(choice.model), children: choice.label }, JSON.stringify(choice.model)))] })] }), 'mode' in settings && _jsxs(_Fragment, { children: [_jsxs("label", { className: "iad-module-row", children: [_jsx("span", { children: "\u68C0\u7D22\u65B9\u5F0F" }), _jsxs(Select, { "aria-label": "\u68C0\u7D22\u65B9\u5F0F", value: settings.mode, onChange: event => {
                                            save({ mode: event.target.value });
                                            setThresholdInput(null);
                                            setThresholdError('');
                                        }, children: [_jsx("option", { value: "exact", children: "\u5B8C\u5168\u4E00\u81F4" }), _jsx("option", { value: "combined", children: "\u4E00\u81F4+\u76F8\u4F3C" })] })] }), settings.mode === 'combined' && _jsxs("label", { className: "iad-module-row", children: [_jsx("span", { children: "\u76F8\u4F3C\u5EA6\u9608\u503C" }), _jsx("input", { "aria-label": "\u76F8\u4F3C\u5EA6\u9608\u503C", type: "number", min: "0", max: "1", step: "0.01", required: true, "aria-invalid": thresholdError ? true : undefined, value: thresholdInput ?? settings.min_similarity, onChange: event => { setThresholdInput(event.target.value); setThresholdError(''); }, onKeyDown: event => { if (event.key === 'Enter')
                                            event.currentTarget.blur(); }, onBlur: event => {
                                            if (!event.currentTarget.validity.valid || !Number.isFinite(event.currentTarget.valueAsNumber)) {
                                                setThresholdError('相似度阈值需要在 0～1 之间');
                                                return;
                                            }
                                            const value = event.currentTarget.valueAsNumber;
                                            if (value !== settings.min_similarity)
                                                save({ min_similarity: value });
                                            setThresholdInput(null);
                                            setThresholdError('');
                                        } })] })] }), thresholdError && _jsx("p", { role: "alert", children: thresholdError }), modelError && _jsx("p", { role: "alert", children: modelError }), unavailable && !modelsLoading && _jsx("p", { role: "alert", children: "\u6240\u9009\u6A21\u578B\u5DF2\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9" }), _jsx("p", { className: "iad-module-status", role: "status", "aria-live": "polite", children: saving ? '正在保存…' : !error && saved ? '已保存' : '' })] }), error && _jsxs("div", { className: "iad-module-error", role: "alert", children: [_jsx("span", { children: error }), settings && _jsx(Button, { onClick: retry, children: "\u91CD\u8BD5\u4FDD\u5B58" })] })] });
}
