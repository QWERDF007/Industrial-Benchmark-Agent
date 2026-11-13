import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { IconCheckOutlineRegular, Input, Menu, MenuGroup, MenuItemButton } from '@deepseek-ai/dsh-client-ui-primitives';
import { ModuleSelectButton } from './ModuleSelectButton.js';
export function ModuleModelSelect({ providers, model, loading, onChange, ...control }) {
    const [open, setOpen] = useState(false), [search, setSearch] = useState('');
    const options = providers.flatMap(provider => provider.models.map(value => ({
        reference: { provider_id: provider.provider_id, model_id: value.model_id }, name: value.name || value.model_id, provider,
    })));
    const selected = options.find(option => option.reference.provider_id === model?.provider_id && option.reference.model_id === model.model_id);
    const query = search.trim().toLocaleLowerCase();
    const filtered = options.filter(option => [option.name, option.reference.model_id, option.provider.name].some(value => value.toLocaleLowerCase().includes(query)));
    const close = () => { setOpen(false); setSearch(''); };
    return _jsxs("div", { className: "iad-module-model-select", children: [_jsxs(Menu, { open: open, onClose: close, portal: true, align: "end", listClassName: "iad-module-model-menu", anchor: _jsx(ModuleSelectButton, { ...control, open: open, disabled: !options.length, onClick: () => { setSearch(''); setOpen(!open); }, children: selected?.name || model?.model_id || (loading ? '正在读取模型…' : options.length ? '请选择具体模型' : '暂无可选模型') }), children: [_jsx(Input, { autoFocus: true, type: "search", "aria-label": "\u641C\u7D22\u6A21\u578B", placeholder: "\u641C\u7D22\u6A21\u578B\u2026", value: search, className: "iad-module-model-search", onChange: event => setSearch(event.target.value) }), _jsxs("div", { className: "iad-module-model-options", children: [providers.map(provider => {
                                const entries = filtered.filter(option => option.provider.provider_id === provider.provider_id);
                                return entries.length > 0 && _jsx(MenuGroup, { label: provider.name, children: entries.map(option => _jsx(MenuItemButton, { onSelect: () => { if (option !== selected)
                                            onChange(option.reference); close(); }, children: _jsxs("span", { className: "iad-module-model-label", children: [_jsx("span", { children: option.name }), option === selected && _jsx(IconCheckOutlineRegular, {})] }) }, option.reference.model_id)) }, provider.provider_id);
                            }), !filtered.length && _jsx("p", { role: "status", className: "iad-module-status", children: "\u6CA1\u6709\u5339\u914D\u7684\u6A21\u578B" })] })] }), model && !selected && !loading && _jsx("p", { role: "alert", children: "\u6240\u9009\u6A21\u578B\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9" })] });
}
