import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useState } from 'react';
import { defaultModelLimits } from '../../shared/model-settings.generated.js';
import { message, request } from '../api.js';
import { useWorkbenchModel } from '../models.js';
import { workbenchStyles } from '../styles.js';
import { ProviderManager } from './ProviderManager.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { PageTabs } from './layout/PageTabs.js';
import { useUnsavedChanges } from '../useUnsavedChanges.js';
const numbers = [
    ['context_tokens', '上下文上限'], ['max_output_tokens', '单次输出上限'], ['max_visual_inputs', '视觉输入上限'],
    ['max_request_bytes', '请求体上限（字节）'], ['generation_timeout_seconds', '生成超时（秒）'],
    ['connect_timeout_seconds', '连接超时（秒）'], ['write_timeout_seconds', '发送超时（秒）'], ['pool_timeout_seconds', '连接池等待（秒）'],
];
export function ModelSettingsPage() {
    const { view, loading, error: loadError, refresh } = useWorkbenchModel();
    const savedSelection = view?.selection || { provider_id: '', model_id: '', limits: { ...defaultModelLimits } };
    const parametersId = useId();
    const [tab, setTab] = useState('model');
    const [draft, setDraft] = useState(null), [expectedRevision, setExpectedRevision] = useState(0);
    const [parameters, setParameters] = useState('{}'), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
    const reset = () => {
        if (!view)
            return;
        setDraft(structuredClone(savedSelection));
        setExpectedRevision(view.revision);
        setParameters(JSON.stringify(savedSelection.limits.request_parameters, null, 2));
        setError('');
        setNotice('');
    };
    useEffect(() => { if (view && !draft)
        reset(); }, [view, draft]);
    const provider = view?.providers.find(row => row.provider_id === draft?.provider_id);
    const changed = !!draft && (JSON.stringify(draft) !== JSON.stringify(savedSelection) || parameters !== JSON.stringify(savedSelection.limits.request_parameters, null, 2));
    useUnsavedChanges(changed && !busy);
    let parsedParameters = {}, parametersError = '';
    try {
        const parsed = JSON.parse(parameters);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
            parametersError = '服务扩展参数必须是 JSON 对象';
        else
            parsedParameters = parsed;
    }
    catch {
        parametersError = '请输入有效的 JSON 对象';
    }
    const input = () => {
        if (!draft?.provider_id || !draft.model_id)
            throw new Error('请选择提供商和模型');
        if (parametersError)
            throw new Error(parametersError);
        return { ...draft, limits: { ...draft.limits, request_parameters: parsedParameters } };
    };
    async function save(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const result = await request('/models', { expected_revision: expectedRevision, selection: input() });
            setDraft(result.selection);
            setExpectedRevision(result.revision);
            setParameters(JSON.stringify(result.selection.limits.request_parameters, null, 2));
            await refresh();
            setNotice('已保存，新作业使用此模型');
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setBusy(false);
        }
    }
    async function check() {
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const result = await request('/models/check', input());
            setDraft(previous => previous ? { ...previous, limits: { ...previous.limits, capacity_mode: result.capacity_mode } } : previous);
            setNotice(`连接正常 · 服务上下文 ${result.context_tokens.toLocaleString()} token；尚未发送图像`);
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("div", { className: "iad-workbench", "data-page": "industrial-model-settings", children: [_jsx("style", { children: workbenchStyles }), _jsx(WorkbenchHeader, { pageId: "industrial-model-settings", children: _jsx("button", { disabled: busy || loading, onClick: () => void refresh(), children: "\u5237\u65B0" }) }), _jsxs(PageTabs, { label: "\u6A21\u578B\u8BBE\u7F6E\u5206\u533A", items: [{ id: 'model', label: '工作台模型' }, { id: 'providers', label: '提供商' }], value: tab, onChange: value => { setTab(value); if (value === 'model')
                    void refresh(); }, children: [(loadError || error) && _jsx("p", { role: "alert", className: "iad-error", children: error || loadError }), tab === 'providers' ? _jsx("section", { className: "iad-provider-manager", "aria-label": "\u63D0\u4F9B\u5546\u7BA1\u7406", children: _jsx(ProviderManager, {}) }) : _jsxs("section", { className: "iad-model-configuration", children: [_jsx("h2", { children: "\u5DE5\u4F5C\u53F0\u6A21\u578B" }), _jsx("p", { className: "iad-muted", children: "\u63A2\u7D22\u3001\u6316\u6398\u548C\u5BA1\u8BA1\u5171\u7528\u6B64\u914D\u7F6E\uFF1B\u4F1A\u8BDD\u6A21\u578B\u72EC\u7ACB\u9009\u62E9\u3002" }), view?.error && _jsxs("p", { role: "status", className: "iad-muted", children: ["\u5DF2\u4FDD\u5B58\u914D\u7F6E\uFF1A", view.error] }), !draft ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u914D\u7F6E\u2026" }) : _jsx("form", { className: "iad-model-form", onSubmit: save, children: _jsxs("fieldset", { disabled: busy || loading, children: [_jsxs("section", { className: "iad-section-layout", children: [_jsx("div", { children: _jsx("h3", { children: "\u6A21\u578B\u9009\u62E9" }) }), _jsxs("div", { children: [_jsxs("div", { className: "iad-model-fields", children: [_jsxs("label", { className: "iad-field", children: ["\u63D0\u4F9B\u5546", _jsxs("select", { "aria-label": "\u5DE5\u4F5C\u53F0\u63D0\u4F9B\u5546", value: draft.provider_id, onChange: event => {
                                                                                setDraft({ provider_id: event.target.value, model_id: '', limits: { ...defaultModelLimits } });
                                                                                setParameters('{}');
                                                                                setError('');
                                                                                setNotice('');
                                                                            }, children: [_jsx("option", { value: "", children: "\u9009\u62E9\u63D0\u4F9B\u5546" }), draft.provider_id && !provider && _jsxs("option", { value: draft.provider_id, children: ["\u5DF2\u5931\u6548 \u00B7 ", draft.provider_id] }), view?.providers.map(row => _jsxs("option", { value: row.provider_id, disabled: !!row.error, children: [row.name, row.error ? ' · 暂不可用' : ''] }, row.provider_id))] })] }), _jsxs("label", { className: "iad-field", children: ["\u6A21\u578B", _jsxs("select", { "aria-label": "\u5DE5\u4F5C\u53F0\u6A21\u578B", value: draft.model_id, disabled: !provider || !!provider.error, onChange: event => { setDraft({ ...draft, model_id: event.target.value }); setError(''); setNotice(''); }, children: [_jsx("option", { value: "", children: "\u9009\u62E9\u6A21\u578B" }), draft.model_id && !provider?.models.some(row => row.model_id === draft.model_id) && _jsxs("option", { value: draft.model_id, children: ["\u5DF2\u5931\u6548 \u00B7 ", draft.model_id] }), provider?.models.map(row => _jsxs("option", { value: row.model_id, disabled: !row.input_modalities?.includes('image'), children: [row.name, row.input_modalities?.includes('image') ? '' : ' · 未声明图像能力'] }, row.model_id))] })] })] }), provider && _jsxs("div", { className: "iad-model-endpoint", children: [_jsx("span", { className: "iad-muted", children: "\u670D\u52A1\u5730\u5740" }), _jsx("p", { children: provider.endpoint || provider.error })] })] })] }), _jsxs("section", { className: "iad-section-layout", children: [_jsxs("div", { children: [_jsx("h3", { children: "\u9AD8\u7EA7\u8BBE\u7F6E" }), _jsx("p", { className: "iad-muted", children: "\u672A\u586B\u5199\u65F6\u4F7F\u7528\u670D\u52A1\u58F0\u660E\u503C" })] }), _jsxs("details", { className: "iad-model-advanced", children: [_jsx("summary", { children: "\u5BB9\u91CF\u4E0E\u8D85\u65F6" }), _jsxs("div", { className: "iad-model-fields", children: [_jsxs("label", { className: "iad-field", children: ["\u5BB9\u91CF\u9884\u68C0", _jsxs("select", { "aria-label": "\u5BB9\u91CF\u9884\u68C0\u534F\u8BAE", value: draft.limits.capacity_mode || '', onChange: event => setDraft({ ...draft, limits: { ...draft.limits, capacity_mode: event.target.value === 'vllm_tokenize' ? 'vllm_tokenize' : null } }), children: [_jsx("option", { value: "", children: "\u5C1A\u672A\u786E\u8BA4" }), _jsx("option", { value: "vllm_tokenize", children: "vLLM /tokenize" })] })] }), numbers.map(([key, label]) => _jsxs("label", { className: "iad-field", children: [label, _jsx("input", { type: "number", "aria-label": label, min: key.endsWith('_seconds') ? 0 : 1, step: key.endsWith('_seconds') ? 'any' : '1', value: draft.limits[key] ?? '', placeholder: "\u4F7F\u7528\u670D\u52A1\u58F0\u660E\u503C", onChange: event => setDraft({ ...draft, limits: { ...draft.limits, [key]: event.target.value === '' ? null : Number(event.target.value) } }) })] }, key))] }), _jsxs("label", { className: "iad-field", children: ["\u670D\u52A1\u6269\u5C55\u53C2\u6570\uFF08JSON\uFF09", _jsx("textarea", { "aria-label": "\u670D\u52A1\u6269\u5C55\u53C2\u6570", "aria-invalid": parametersError ? true : undefined, "aria-describedby": parametersError ? parametersId : undefined, rows: 4, value: parameters, onChange: event => setParameters(event.target.value) })] }), parametersError && _jsx("p", { id: parametersId, role: "alert", className: "iad-error", children: parametersError })] })] }), _jsxs("div", { className: "iad-form-footer", children: [changed && _jsx("span", { className: "iad-muted", children: "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539" }), _jsx("button", { type: "button", disabled: !draft.provider_id || !draft.model_id || !!parametersError, onClick: () => void check(), children: "\u68C0\u67E5\u8FDE\u63A5" }), _jsx("button", { className: "iad-primary", type: "submit", disabled: !changed || !draft.provider_id || !draft.model_id || !!parametersError, children: busy ? '处理中…' : '保存配置' }), _jsx("button", { type: "button", disabled: !changed, onClick: reset, children: "\u91CD\u7F6E" })] })] }) }), notice && _jsx("p", { role: "status", children: notice })] })] })] });
}
