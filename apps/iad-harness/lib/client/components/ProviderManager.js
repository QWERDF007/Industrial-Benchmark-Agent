import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { message, request } from '../api.js';
import { useWorkbenchModel } from '../models.js';
import { Modal } from './Modal.js';
import { DeleteAction } from './DeleteAction.js';
export function ProviderManager() {
    const { view, refresh } = useWorkbenchModel();
    const [editing, setEditing] = useState(null);
    const [notice, setNotice] = useState('');
    return _jsxs(_Fragment, { children: [_jsxs("header", { className: "iad-section-header", children: [_jsx("h2", { children: "\u63D0\u4F9B\u5546" }), _jsx("button", { className: "iad-primary", disabled: view?.provider_revision == null, onClick: () => setEditing({ revision: view.provider_revision }), children: "\u6DFB\u52A0\u63D0\u4F9B\u5546" })] }), _jsx("p", { className: "iad-muted", children: "\u4E0E DSH \u8BBE\u7F6E\u5171\u7528\u63D0\u4F9B\u5546\u8D44\u6599\u548C\u51ED\u636E\u3002" }), _jsx("div", { className: "iad-table-scroll", children: _jsxs("table", { className: "iad-resource-table", "aria-label": "\u63D0\u4F9B\u5546\u5217\u8868", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u63D0\u4F9B\u5546\u540D\u79F0" }), _jsx("th", { children: "\u670D\u52A1\u5730\u5740" }), _jsx("th", { className: "iad-number", children: "\u6A21\u578B\u6570" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: view?.providers.map(provider => _jsxs("tr", { children: [_jsxs("td", { children: [_jsx("strong", { children: provider.name }), provider.error && _jsx("p", { className: "iad-error", children: provider.error })] }), _jsx("td", { className: "iad-provider-endpoint", children: provider.endpoint || provider.api || '尚未配置' }), _jsx("td", { className: "iad-number", children: provider.models.length }), _jsx("td", { children: _jsxs("div", { className: "iad-row", children: [_jsx("button", { disabled: !provider.editable, onClick: () => setEditing({ provider, revision: view.provider_revision }), children: "\u7F16\u8F91" }), provider.removable && _jsx(DeleteAction, { title: "\u5220\u9664\u63D0\u4F9B\u5546", name: provider.name, description: "\u4FDD\u7559\u5386\u53F2\u4F5C\u4E1A\u53CA\u5176\u51ED\u636E\u5F15\u7528\u3002\u6B63\u5728\u8FD0\u884C\u7684\u4F5C\u4E1A\u4E0D\u53D7\u5F71\u54CD\u3002", onDelete: async () => { await request(`/models/providers/${encodeURIComponent(provider.provider_id)}?expected_revision=${view.provider_revision}`, undefined, 'DELETE'); await refresh(); setNotice('已删除提供商'); } })] }) })] }, provider.provider_id)) })] }) }), notice && _jsx("p", { role: "status", children: notice }), editing && _jsx(ProviderEditor, { provider: editing.provider, revision: editing.revision, onClose: () => setEditing(null), onSaved: async () => { await refresh(); setEditing(null); setNotice('提供商已保存'); } })] });
}
function ProviderEditor({ provider, revision, onClose, onSaved }) {
    const [id] = useState(provider?.provider_id || `vision-${uuid()}`);
    const [name, setName] = useState(provider?.name || ''), [endpoint, setEndpoint] = useState(provider?.endpoint || ''), [key, setKey] = useState('');
    const [models, setModels] = useState(provider?.models || []);
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    async function discover() {
        setBusy(true);
        setError('');
        try {
            const result = await request('/models/providers/discover', { endpoint, provider_id: provider?.provider_id, api_key: key || null });
            setModels(result.models);
            if (!result.models.length)
                setError('服务未返回模型，可以手动添加');
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setBusy(false);
        }
    }
    async function save(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            const [first, ...remaining] = models;
            if (!first)
                throw new Error('请添加至少一个模型');
            const body = { expected_revision: revision, provider_id: id, name, endpoint, models: [first, ...remaining], api_key: key || null };
            await request('/models/providers', body);
            setKey('');
            await onSaved();
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsx(Modal, { title: provider ? '编辑提供商' : '添加提供商', className: "iad-provider-dialog", onClose: () => { if (!busy)
            onClose(); }, children: _jsx("form", { onSubmit: save, children: _jsxs("fieldset", { disabled: busy, children: [_jsxs("div", { className: "iad-model-fields", children: [_jsxs("label", { className: "iad-field", children: ["\u63D0\u4F9B\u5546\u540D\u79F0", _jsx("input", { autoFocus: true, required: true, "aria-label": "\u63D0\u4F9B\u5546\u540D\u79F0", value: name, onChange: event => setName(event.target.value) })] }), _jsxs("label", { className: "iad-field", children: ["\u670D\u52A1\u5730\u5740", _jsx("input", { required: true, type: "url", "aria-label": "\u670D\u52A1\u5730\u5740", placeholder: "https://\u2026/v1", value: endpoint, onChange: event => setEndpoint(event.target.value) })] })] }), _jsxs("label", { className: "iad-field", children: ["API \u5BC6\u94A5", _jsx("input", { type: "password", autoComplete: "new-password", "aria-label": "API \u5BC6\u94A5", value: key, disabled: provider?.credential_writable === false, placeholder: provider?.credential_configured ? '已配置，留空保留' : '可选', onChange: event => setKey(event.target.value) })] }), _jsxs("header", { className: "iad-section-header", children: [_jsx("h3", { children: "\u6A21\u578B" }), _jsxs("div", { className: "iad-row", children: [_jsx("button", { type: "button", disabled: !endpoint, onClick: () => void discover(), children: "\u8BFB\u53D6\u6A21\u578B" }), _jsx("button", { type: "button", onClick: () => setModels([...models, { model_id: '', name: '', input_modalities: ['text'], context_tokens: null, max_output_tokens: null }]), children: "\u6DFB\u52A0\u6A21\u578B" })] })] }), models.map((model, index) => _jsxs("div", { className: "iad-provider-model", children: [_jsxs("div", { className: "iad-model-fields", children: [_jsxs("label", { className: "iad-field", children: ["\u6A21\u578B ID", _jsx("input", { "aria-label": `模型 ID ${index + 1}`, required: true, value: model.model_id, onChange: event => setModels(models.map((row, position) => position === index ? { ...row, model_id: event.target.value } : row)) })] }), _jsxs("label", { className: "iad-field", children: ["\u663E\u793A\u540D\u79F0", _jsx("input", { "aria-label": `模型名称 ${index + 1}`, value: model.name, onChange: event => setModels(models.map((row, position) => position === index ? { ...row, name: event.target.value } : row)) })] }), _jsxs("label", { className: "iad-field", children: ["\u4E0A\u4E0B\u6587\u4E0A\u9650", _jsx("input", { type: "number", min: "1", placeholder: "\u672A\u58F0\u660E", value: model.context_tokens ?? '', onChange: event => setModels(models.map((row, position) => position === index ? { ...row, context_tokens: event.target.value ? Number(event.target.value) : null } : row)) })] }), _jsxs("label", { className: "iad-field", children: ["\u8F93\u51FA\u4E0A\u9650", _jsx("input", { type: "number", min: "1", placeholder: "\u672A\u58F0\u660E", value: model.max_output_tokens ?? '', onChange: event => setModels(models.map((row, position) => position === index ? { ...row, max_output_tokens: event.target.value ? Number(event.target.value) : null } : row)) })] })] }), _jsxs("div", { className: "iad-row", children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: model.input_modalities?.includes('image') || false, onChange: event => setModels(models.map((row, position) => position === index ? { ...row, input_modalities: event.target.checked ? ['text', 'image'] : ['text'] } : row)) }), " \u652F\u6301\u56FE\u50CF\u8F93\u5165"] }), _jsx("button", { type: "button", onClick: () => setModels(models.filter((_, position) => position !== index)), children: "\u79FB\u9664\u6A21\u578B" })] })] }, index)), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsxs("div", { className: "iad-form-actions", children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { className: "iad-primary", disabled: !name.trim() || !endpoint || !models.length, type: "submit", children: busy ? '处理中…' : '保存提供商' })] })] }) }) });
}
