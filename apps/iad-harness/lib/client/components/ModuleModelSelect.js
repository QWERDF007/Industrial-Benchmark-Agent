import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef, useState } from 'react';
import { autoUpdate, flip, FloatingFocusManager, FloatingPortal, offset, shift, size, useClick, useDismiss, useFloating, useInteractions, useListNavigation, useRole } from '@floating-ui/react';
import { ChevronIcon } from '../AuditIcon.js';
export function ModuleModelSelect({ providers, model, loading, onChange }) {
    const id = useId(), input = useRef(null), items = useRef([]);
    const [open, setOpen] = useState(false), [search, setSearch] = useState(''), [active, setActive] = useState(null);
    const options = providers.flatMap(provider => provider.models.map(value => ({
        reference: { provider_id: provider.provider_id, model_id: value.model_id }, name: value.name || value.model_id, provider,
    })));
    const selected = options.find(option => option.reference.provider_id === model?.provider_id && option.reference.model_id === model.model_id);
    const query = search.trim().toLocaleLowerCase();
    const filtered = options.filter(option => [option.name, option.reference.model_id, option.provider.name].some(value => value.toLocaleLowerCase().includes(query)));
    const { refs, context, floatingStyles } = useFloating({ open, onOpenChange: value => {
            setOpen(value);
            if (!value) {
                setSearch('');
                setActive(null);
            }
        }, placement: 'bottom-end', strategy: 'fixed', whileElementsMounted: autoUpdate,
        middleware: [offset(6), flip({ padding: 12 }), shift({ padding: 12 }), size({ padding: 12, apply({ availableHeight, availableWidth, elements }) {
                    Object.assign(elements.floating.style, { maxHeight: `${Math.min(360, availableHeight)}px`, maxWidth: `${availableWidth}px` });
                } })] });
    const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
        useClick(context), useDismiss(context), useRole(context, { role: 'dialog' }),
        useListNavigation(context, { listRef: items, activeIndex: active, onNavigate: setActive, virtual: true, loop: true, focusItemOnOpen: false }),
    ]);
    const choose = (reference) => { onChange(reference); setOpen(false); setSearch(''); setActive(null); };
    return _jsxs("div", { className: "iad-module-model-select", children: [_jsxs("button", { type: "button", ref: refs.setReference, className: "iad-module-model-trigger", "aria-label": "\u5206\u6790\u6A21\u578B", disabled: !options.length, ...getReferenceProps(), children: [_jsx("span", { children: selected?.name || model?.model_id || (loading ? '正在读取模型…' : options.length ? '请选择具体模型' : '暂无可选模型') }), _jsx(ChevronIcon, {})] }), open && _jsx(FloatingPortal, { children: _jsx(FloatingFocusManager, { context: context, initialFocus: input, modal: false, children: _jsxs("div", { ref: refs.setFloating, className: "iad-module-model-menu", style: floatingStyles, ...getFloatingProps(), children: [_jsx("input", { ref: input, type: "search", "aria-label": "\u641C\u7D22\u6A21\u578B", placeholder: "\u641C\u7D22\u6A21\u578B\u2026", value: search, role: "combobox", "aria-expanded": "true", "aria-autocomplete": "list", "aria-controls": `${id}-list`, "aria-activedescendant": active === null ? undefined : `${id}-${active}`, onChange: event => { setSearch(event.target.value); setActive(null); }, onKeyDown: event => {
                                    if (event.key === 'Enter' && active !== null && filtered[active]) {
                                        event.preventDefault();
                                        choose(filtered[active].reference);
                                    }
                                } }), _jsx("div", { role: "listbox", id: `${id}-list`, "aria-label": "\u6A21\u578B\u5217\u8868", className: "iad-module-model-options", children: providers.map(provider => {
                                    const entries = filtered.map((option, index) => ({ option, index })).filter(({ option }) => option.provider.provider_id === provider.provider_id);
                                    return entries.length > 0 && _jsxs("div", { role: "group", "aria-label": provider.name, children: [_jsx("div", { className: "iad-module-model-heading", children: provider.name }), entries.map(({ option, index }) => {
                                                const current = option.reference.provider_id === model?.provider_id && option.reference.model_id === model.model_id;
                                                return _jsxs("div", { ref: element => { items.current[index] = element; }, id: `${id}-${index}`, role: "option", tabIndex: -1, "aria-label": `${option.name}（${provider.name}）`, "aria-selected": current, className: `iad-module-model-option${active === index ? ' is-active' : ''}`, ...getItemProps({ onClick: () => choose(option.reference) }), children: [_jsx("span", { children: option.name }), current && _jsx("svg", { "aria-hidden": "true", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", children: _jsx("path", { d: "m5 12 4 4 10-10" }) })] }, option.reference.model_id);
                                            })] }, provider.provider_id);
                                }) })] }) }) }), model && !selected && !loading && _jsx("p", { role: "alert", children: "\u6240\u9009\u6A21\u578B\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9" })] });
}
