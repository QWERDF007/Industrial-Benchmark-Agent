import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { imageBackbones } from '../../shared/image-encoder.parameters.generated.js';
import { message, request } from '../api.js';
import { useUnsavedChanges } from '../useUnsavedChanges.js';
function editable(view) {
    const selection = view.selection, resources = view.resources;
    return { model_id: selection?.profile.model_id || '', weights_ref: selection?.profile.weights_ref || '',
        source_ref: selection?.profile.source_ref || '', device: resources.device, batch_size: resources.batch_size,
        gpu_memory_mb: resources.gpu_memory_mb, compute_dtype: resources.compute_dtype,
        decode_workers: resources.decode_workers, decode_memory_mb: resources.decode_memory_mb,
        storage_dtype: selection?.profile.storage_dtype || 'float32' };
}
export function ImageEncoderSettings({ refreshVersion, onStateChange }) {
    const [view, setView] = useState(null), [draft, setDraft] = useState(null);
    const [revision, setRevision] = useState(0), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
    const [error, setError] = useState(''), [notice, setNotice] = useState('');
    const changed = !!draft && !!view && JSON.stringify(draft) !== JSON.stringify(editable(view));
    useUnsavedChanges(changed && !busy);
    useEffect(() => { onStateChange({ dirty: changed, busy }); }, [changed, busy, onStateChange]);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        void request('/images/settings', undefined, undefined, controller.signal).then(settings => {
            setView(settings);
            if (!changed) {
                setDraft(editable(settings));
                setRevision(settings.revision);
            }
        }).catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); })
            .finally(() => { if (!controller.signal.aborted)
            setLoading(false); });
        return () => controller.abort();
    }, [refreshVersion]);
    const backbone = draft?.model_id ? imageBackbones[draft.model_id] : null;
    const validResources = !!draft && /^(cpu|cuda:[0-9]+)$/.test(draft.device) && Number.isInteger(draft.batch_size) && draft.batch_size >= 1 && draft.batch_size <= 256 &&
        Number.isInteger(draft.gpu_memory_mb) && draft.gpu_memory_mb >= 256 && draft.gpu_memory_mb <= 12288 && Number.isInteger(draft.decode_workers) && draft.decode_workers >= 1 && draft.decode_workers <= 8 &&
        Number.isInteger(draft.decode_memory_mb) && draft.decode_memory_mb >= 1 && draft.decode_memory_mb <= 1024 && !(draft.device === 'cpu' && draft.compute_dtype === 'float16');
    const valid = validResources && (!draft?.model_id || (!!draft.weights_ref.trim() && (backbone?.backend === 'torchscript' || backbone?.local_snapshot || !!draft.source_ref.trim())));
    async function input() {
        if (!draft || !valid)
            throw new Error('请填写有效的模型、路径和资源配置');
        if (!draft.model_id)
            return null;
        const profile = await request('/images/profiles', { model_id: draft.model_id, weights_ref: draft.weights_ref.trim(),
            source_ref: backbone?.backend === 'torchscript' ? null : draft.source_ref.trim() || null, storage_dtype: draft.storage_dtype });
        return { profile, device: draft.device, batch_size: draft.batch_size, gpu_memory_mb: draft.gpu_memory_mb, compute_dtype: draft.compute_dtype,
            decode_workers: draft.decode_workers, decode_memory_mb: draft.decode_memory_mb };
    }
    async function save(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        setNotice('');
        try {
            if (!draft)
                return;
            const { model_id, weights_ref, source_ref, storage_dtype, ...resources } = draft;
            const result = await request('/images/settings', { expected_revision: revision, selection: await input(), resources });
            setView(result);
            setDraft(editable(result));
            setRevision(result.revision);
            setNotice('已保存图像检索配置');
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
            const result = await request('/images/settings/check', { selection: await input() });
            setNotice(`加载正常 · ${result.model_id} · ${result.dim} 维 · ${result.device}`);
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("section", { className: "iad-model-configuration", "aria-label": "\u56FE\u50CF\u68C0\u7D22\u8BBE\u7F6E", "aria-busy": busy || loading, children: [_jsx("h2", { children: "\u56FE\u50CF\u68C0\u7D22" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), !draft ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u914D\u7F6E\u2026" }) : _jsx("form", { "aria-label": "\u56FE\u50CF\u68C0\u7D22\u914D\u7F6E", className: "iad-model-form", onSubmit: save, children: _jsxs("fieldset", { disabled: busy || loading, children: [_jsxs("section", { className: "iad-section-layout", children: [_jsx("div", { children: _jsx("h3", { children: "\u56FE\u50CF\u7F16\u7801\u5668" }) }), _jsxs("div", { className: "iad-model-fields", children: [_jsxs("label", { className: "iad-field", children: ["\u6A21\u578B", _jsxs("select", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u5668", value: draft.model_id, onChange: event => {
                                                        setDraft({ ...draft, model_id: event.target.value, weights_ref: '', source_ref: '' });
                                                        setError('');
                                                        setNotice('');
                                                    }, children: [_jsx("option", { value: "", children: "\u4EC5\u4E25\u683C\u540C\u56FE" }), Object.keys(imageBackbones).map(id => _jsx("option", { value: id, children: id }, id))] })] }), draft.model_id && _jsxs(_Fragment, { children: [_jsxs("label", { className: "iad-field", children: ["\u6743\u91CD\u8DEF\u5F84", _jsx("input", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u6743\u91CD\u8DEF\u5F84", required: true, value: draft.weights_ref, onChange: event => setDraft({ ...draft, weights_ref: event.target.value }) })] }), backbone?.backend === 'torch_hub' && _jsxs("label", { className: "iad-field", children: ["\u5B98\u65B9\u6E90\u7801\u76EE\u5F55", backbone.local_snapshot ? '（.pth 必填）' : '', _jsx("input", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u6E90\u7801\u76EE\u5F55", required: !backbone.local_snapshot, value: draft.source_ref, onChange: event => setDraft({ ...draft, source_ref: event.target.value }) })] }), backbone && _jsxs("p", { className: "iad-muted", children: [backbone.dim, " \u7EF4 \u00B7 ", backbone.local_snapshot ? '本地模型目录或 .pth 权重' : `${backbone.input_size} px · ${backbone.processor}`] })] })] })] }), _jsxs("section", { className: "iad-section-layout", children: [_jsx("div", { children: _jsx("h3", { children: "\u8FD0\u884C\u8D44\u6E90" }) }), _jsxs("div", { className: "iad-model-fields", children: [draft.model_id && _jsxs(_Fragment, { children: [_jsxs("label", { className: "iad-field", children: ["\u8BBE\u5907", _jsx("input", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u8BBE\u5907", required: true, pattern: "cpu|cuda:[0-9]+", value: draft.device, onChange: event => setDraft({ ...draft, device: event.target.value }) })] }), _jsxs("label", { className: "iad-field", children: ["\u6279\u91CF", _jsx("input", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u6279\u91CF", type: "number", min: 1, max: 256, value: draft.batch_size, onChange: event => setDraft({ ...draft, batch_size: Number(event.target.value) }) })] }), _jsxs("label", { className: "iad-field", children: ["\u663E\u5B58\u9884\u7B97\uFF08MiB\uFF09", _jsx("input", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u663E\u5B58\u9884\u7B97", type: "number", min: 256, max: 12288, value: draft.gpu_memory_mb, onChange: event => setDraft({ ...draft, gpu_memory_mb: Number(event.target.value) }) })] })] }), _jsxs("label", { className: "iad-field", children: ["\u89E3\u7801\u7EBF\u7A0B", _jsx("input", { "aria-label": "\u56FE\u50CF\u89E3\u7801\u7EBF\u7A0B", type: "number", min: 1, max: 8, value: draft.decode_workers, onChange: event => setDraft({ ...draft, decode_workers: Number(event.target.value) }) })] }), _jsxs("label", { className: "iad-field", children: ["\u89E3\u7801\u5185\u5B58\uFF08MiB\uFF09", _jsx("input", { "aria-label": "\u56FE\u50CF\u89E3\u7801\u5185\u5B58\u9884\u7B97", type: "number", min: 1, max: 1024, value: draft.decode_memory_mb, onChange: event => setDraft({ ...draft, decode_memory_mb: Number(event.target.value) }) })] }), draft.model_id && _jsxs(_Fragment, { children: [_jsxs("label", { className: "iad-field", children: ["\u8BA1\u7B97\u7CBE\u5EA6", _jsxs("select", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u8BA1\u7B97\u7CBE\u5EA6", value: draft.compute_dtype, onChange: event => setDraft({ ...draft, compute_dtype: event.target.value }), children: [_jsx("option", { value: "float32", children: "FP32" }), _jsx("option", { value: "float16", disabled: draft.device === 'cpu', children: "FP16" })] })] }), _jsxs("label", { className: "iad-field", children: ["\u5411\u91CF\u5B58\u50A8", _jsxs("select", { "aria-label": "\u56FE\u50CF\u5411\u91CF\u5B58\u50A8\u7CBE\u5EA6", value: draft.storage_dtype, onChange: event => setDraft({ ...draft, storage_dtype: event.target.value }), children: [_jsx("option", { value: "float32", children: "FP32" }), _jsx("option", { value: "float16", children: "FP16" })] })] })] })] })] }), view?.selection && _jsxs("details", { className: "iad-model-advanced", children: [_jsx("summary", { children: "\u5DF2\u4FDD\u5B58\u914D\u7F6E" }), _jsx("code", { children: view.selection.profile.profile_id }), _jsxs("p", { className: "iad-muted", children: [view.selection.profile.input_size, " px \u00B7 ", view.selection.profile.pooling, " \u00B7 ", view.selection.profile.color_conversion] })] }), _jsxs("div", { className: "iad-form-footer", children: [changed && _jsx("span", { className: "iad-muted", children: "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539" }), _jsx("button", { type: "button", disabled: !valid || !draft.model_id, onClick: () => void check(), children: busy ? '处理中…' : '检查加载' }), _jsx("button", { className: "iad-primary", type: "submit", disabled: !changed || !valid, children: "\u4FDD\u5B58\u56FE\u50CF\u914D\u7F6E" }), _jsx("button", { type: "button", disabled: !changed, onClick: () => { if (view)
                                        setDraft(editable(view)); setRevision(view?.revision || 0); setError(''); setNotice(''); }, children: "\u91CD\u7F6E\u56FE\u50CF\u914D\u7F6E" })] })] }) }), notice && _jsx("p", { role: "status", children: notice })] });
}
