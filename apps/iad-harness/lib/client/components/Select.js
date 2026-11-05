import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/react';
import { ChevronIcon } from '../AuditIcon.js';
export const Select = forwardRef(function Select({ className = '', ...props }, ref) {
    return _jsx("select", { ...props, ref: ref, className: `iad-select ${className}` });
});
export function MultiSelect({ id, menuId, label, options, selected, onToggle, disabled = false, emptyText = '暂无选项' }) {
    const generatedId = useId();
    const panelId = menuId || generatedId;
    const panel = useRef(null);
    const [open, setOpen] = useState(false);
    const values = new Set(selected);
    const { refs, floatingStyles, isPositioned, update } = useFloating({ open, placement: 'bottom-start', strategy: 'fixed',
        middleware: [offset(6), flip({ padding: 12 }), shift({ padding: 12 }), size({ padding: 12, apply({ availableHeight, rects, elements }) {
                    Object.assign(elements.floating.style, { width: `${rects.reference.width}px`, maxHeight: `${Math.min(300, availableHeight)}px` });
                } })],
    });
    useEffect(() => {
        const element = panel.current;
        element.popover = 'auto';
        const toggle = (event) => setOpen(event.newState === 'open');
        element.addEventListener('beforetoggle', toggle);
        return () => element.removeEventListener('beforetoggle', toggle);
    }, []);
    useEffect(() => {
        if (!open || !refs.reference.current || !refs.floating.current)
            return;
        return autoUpdate(refs.reference.current, refs.floating.current, update);
    }, [open, refs, update]);
    useEffect(() => { if (disabled)
        panel.current?.hidePopover(); }, [disabled]);
    return _jsxs("div", { className: "iad-multiselect", children: [_jsxs("button", { ref: refs.setReference, id: id, type: "button", className: "iad-select iad-multiselect-trigger", disabled: disabled, "aria-label": `选择${label}`, "aria-expanded": open, "aria-controls": panelId, onClick: () => panel.current?.togglePopover(), children: [_jsx("span", { children: values.size ? `已选 ${values.size} 个${label}` : `请选择${label}` }), _jsx(ChevronIcon, { size: 16 })] }), _jsx("div", { ref: element => { panel.current = element; refs.setFloating(element); }, id: panelId, className: "iad-select-popover", style: { ...floatingStyles, visibility: open && !isPositioned ? 'hidden' : undefined }, role: "group", "aria-label": `${label}选择`, children: options.length ? options.map(option => _jsxs("label", { className: "iad-select-option", children: [_jsx("input", { type: "checkbox", value: option.value, checked: values.has(option.value), disabled: disabled, onChange: () => onToggle(option.value) }), _jsx("span", { children: option.label })] }, option.value)) : _jsx("p", { className: "iad-select-empty", children: emptyText }) })] });
}
