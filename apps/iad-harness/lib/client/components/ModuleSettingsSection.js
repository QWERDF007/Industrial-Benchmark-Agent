import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { businessModules } from '../../shared/business-modules.js';
import { useModuleSettings } from '../useModuleSettings.js';
import { useWorkbenchModel } from '../models.js';
import { Select } from './Select.js';
import { Button } from './Button.js';
import { ModuleNumberSetting } from './ModuleNumberSetting.js';
import { moduleSettingsStyles } from '../styles/module-settings.js';
function ModuleModelSetting({ label, choices, model, loading, onSave }) {
    const selection = model ? JSON.stringify(model) : '';
    const unavailable = !!selection && !choices.some(choice => JSON.stringify(choice.model) === selection);
    return _jsxs("div", { children: [_jsxs("label", { className: "iad-module-row", children: [_jsx("span", { children: label }), _jsxs(Select, { "aria-label": label, disabled: loading || !choices.length, value: selection, onChange: event => {
                            const selected = choices.find(choice => JSON.stringify(choice.model) === event.target.value);
                            if (selected)
                                onSave(selected.model);
                        }, children: [_jsx("option", { value: "", disabled: true, children: loading ? '正在读取模型…' : choices.length ? '请选择具体模型' : '暂无可选模型' }), unavailable && _jsx("option", { value: selection, disabled: true, children: "\u6240\u9009\u6A21\u578B\u4E0D\u53EF\u7528" }), choices.map(choice => _jsx("option", { value: JSON.stringify(choice.model), children: choice.label }, JSON.stringify(choice.model)))] })] }), unavailable && !loading && _jsxs("p", { role: "alert", children: [label, "\u5DF2\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9"] })] });
}
export function ModuleSettingsSection({ module }) {
    const { settings, save, retry, loading, saving, saved, error } = useModuleSettings(module);
    const { view, loading: modelsLoading, error: modelError } = useWorkbenchModel();
    const choices = (view?.providers || []).filter(provider => !provider.error).flatMap(provider => provider.models
        .map(model => ({ model: { provider_id: provider.provider_id, model_id: model.model_id }, label: `${model.name}（${provider.name}）`, image: !!model.input_modalities?.includes('image') })));
    return _jsxs("section", { className: "iad-module-settings", "aria-label": `${businessModules[module]}设置`, "data-module-settings": module, children: [_jsx("style", { children: moduleSettingsStyles }), _jsx("h2", { children: businessModules[module] }), loading && !settings ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u8BBE\u7F6E\u2026" }) : settings && _jsxs("div", { children: [_jsx(ModuleModelSetting, { label: "\u5206\u6790\u6A21\u578B", choices: choices.filter(choice => choice.image), model: settings.model, loading: modelsLoading, onSave: model => save({ model }) }), 'mode' in settings && _jsxs(_Fragment, { children: [_jsxs("label", { className: "iad-module-row", children: [_jsx("span", { children: "\u68C0\u7D22\u65B9\u5F0F" }), _jsxs(Select, { "aria-label": "\u68C0\u7D22\u65B9\u5F0F", value: settings.mode, onChange: event => save({ mode: event.target.value }), children: [_jsx("option", { value: "exact", children: "\u5B8C\u5168\u4E00\u81F4" }), _jsx("option", { value: "combined", children: "\u4E00\u81F4+\u76F8\u4F3C" })] })] }), settings.mode === 'combined' && _jsx(ModuleNumberSetting, { label: "\u76F8\u4F3C\u5EA6\u9608\u503C", value: settings.min_similarity, min: 0, max: 1, step: .01, validationMessage: "\u76F8\u4F3C\u5EA6\u9608\u503C\u9700\u8981\u5728 0\uFF5E1 \u4E4B\u95F4", onSave: min_similarity => save({ min_similarity }) }), _jsx(ModuleNumberSetting, { label: "\u5B8C\u5168\u4E00\u81F4\u56FE\u4E0A\u9650", value: settings.max_exact_candidates, min: 1, step: 1, validationMessage: "\u5B8C\u5168\u4E00\u81F4\u56FE\u4E0A\u9650\u9700\u8981\u4E3A\u6B63\u6574\u6570", onSave: max_exact_candidates => save({ max_exact_candidates }) }), settings.mode === 'combined' && _jsx(ModuleNumberSetting, { label: "\u76F8\u4F3C\u56FE\u4E0A\u9650", value: settings.max_similar_candidates, min: 1, step: 1, validationMessage: "\u76F8\u4F3C\u56FE\u4E0A\u9650\u9700\u8981\u4E3A\u6B63\u6574\u6570", onSave: max_similar_candidates => save({ max_similar_candidates }) })] }), modelError && _jsx("p", { role: "alert", children: modelError }), _jsx("p", { className: "iad-module-status", role: "status", "aria-live": "polite", children: saving ? '正在保存…' : !error && saved ? '已保存' : '' })] }), error && _jsxs("div", { className: "iad-module-error", role: "alert", children: [_jsx("span", { children: error }), settings && _jsx(Button, { onClick: retry, children: "\u91CD\u8BD5\u4FDD\u5B58" })] })] });
}
