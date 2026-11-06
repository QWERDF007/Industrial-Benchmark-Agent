import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { businessModules } from '../../shared/business-modules.js';
import { request, message } from '../api.js';
import { useWorkbenchModel } from '../models.js';
import { Select } from './Select.js';
import { Button } from './Button.js';
import { moduleSettingsStyles } from '../styles/module-settings.js';
export function ModuleSettingsSection({ module }) {
    const client = useQueryClient();
    const resource = useQuery({ queryKey: ['iad', 'module-settings', module], queryFn: () => request(`/settings/modules/${module}`) });
    const { view } = useWorkbenchModel();
    const [draft, setDraft] = useState(null), [revision, setRevision] = useState(0);
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
    useEffect(() => { if (resource.data && !draft) {
        setDraft(structuredClone(resource.data.settings));
        setRevision(resource.data.revision);
    } }, [resource.data, draft]);
    const changed = !!draft && JSON.stringify(draft) !== JSON.stringify(resource.data?.settings);
    const choices = (view?.providers || []).filter(provider => !provider.error).flatMap(provider => provider.models
        .filter(model => model.input_modalities?.includes('image')).map(model => ({ model: { provider_id: provider.provider_id, model_id: model.model_id }, label: `${model.name}（${provider.name}）` })));
    const selection = draft?.model ? JSON.stringify(draft.model) : '';
    async function save(event) {
        event.preventDefault();
        if (!draft)
            return;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const saved = await request(`/settings/modules/${module}`, { expected_revision: revision, settings: draft });
            client.setQueryData(['iad', 'module-settings', module], saved);
            setDraft(saved.settings);
            setRevision(saved.revision);
            setNotice('已保存');
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("section", { className: "iad-module-settings", "aria-label": `${businessModules[module]}设置`, "data-module-settings": module, children: [_jsx("style", { children: moduleSettingsStyles }), _jsx("h2", { children: businessModules[module] }), resource.isPending ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u8BBE\u7F6E\u2026" }) : resource.error ? _jsx("p", { role: "alert", children: message(resource.error) }) : draft && _jsxs("form", { onSubmit: save, children: [_jsxs("fieldset", { disabled: busy, children: [_jsxs("label", { className: "iad-module-row", children: [_jsx("span", { children: "\u5206\u6790\u6A21\u578B" }), _jsxs(Select, { "aria-label": "\u5206\u6790\u6A21\u578B", value: selection, onChange: event => { setDraft({ ...draft, model: choices.find(choice => JSON.stringify(choice.model) === event.target.value)?.model ?? null }); setNotice(''); }, children: [_jsx("option", { value: "", children: "\u4F7F\u7528\u5DE5\u4F5C\u53F0\u6A21\u578B" }), selection && !choices.some(choice => JSON.stringify(choice.model) === selection) && _jsx("option", { value: selection, disabled: true, children: "\u6240\u9009\u6A21\u578B\u4E0D\u53EF\u7528" }), choices.map(choice => _jsx("option", { value: JSON.stringify(choice.model), children: choice.label }, JSON.stringify(choice.model)))] })] }), 'mode' in draft && _jsxs(_Fragment, { children: [_jsxs("label", { className: "iad-module-row", children: [_jsx("span", { children: "\u68C0\u7D22\u65B9\u5F0F" }), _jsxs(Select, { "aria-label": "\u68C0\u7D22\u65B9\u5F0F", value: draft.mode, onChange: event => setDraft({ ...draft, mode: event.target.value }), children: [_jsx("option", { value: "exact", children: "\u5B8C\u5168\u4E00\u81F4" }), _jsx("option", { value: "combined", children: "\u4E00\u81F4+\u76F8\u4F3C" })] })] }), draft.mode === 'combined' && _jsxs("label", { className: "iad-module-row", children: [_jsx("span", { children: "\u76F8\u4F3C\u5EA6\u9608\u503C" }), _jsx("input", { "aria-label": "\u76F8\u4F3C\u5EA6\u9608\u503C", type: "number", min: "0", max: "1", step: "0.01", required: true, value: draft.min_similarity, onChange: event => setDraft({ ...draft, min_similarity: event.target.valueAsNumber }) })] })] }), _jsxs("footer", { children: [_jsx("span", { role: "status", children: changed ? '有未保存的更改' : notice }), _jsx("button", { type: "button", onClick: () => { setDraft(structuredClone(resource.data.defaults)); setNotice(''); }, children: "\u6062\u590D\u9ED8\u8BA4" }), _jsx(Button, { variant: "primary", type: "submit", disabled: !changed, children: busy ? '保存中…' : '保存设置' })] })] }), error && _jsx("p", { role: "alert", children: error })] })] });
}
