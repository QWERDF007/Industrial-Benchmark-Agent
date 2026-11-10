import { jsx as _jsx } from "react/jsx-runtime";
import { createElement as _createElement } from "react";
import { useRef } from 'react';
export function TabBar({ label, items, value, onChange, className = '' }) {
    const buttons = useRef(new Map());
    function navigate(event, index) {
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
            : event.key === 'ArrowRight' ? (index + 1) % items.length : event.key === 'ArrowLeft' ? (index + items.length - 1) % items.length : null;
        if (next === null)
            return;
        event.preventDefault();
        onChange(items[next].id);
        buttons.current.get(items[next].id)?.focus({ preventScroll: true });
    }
    return _jsx("div", { className: `iad-tabs ${className}`.trim(), role: "tablist", "aria-label": label, children: items.map((item, index) => _createElement("button", { ...item.buttonProps, key: item.id, type: "button", role: "tab", "aria-selected": value === item.id, tabIndex: value === item.id ? 0 : -1, className: value === item.id ? 'active' : '', ref: button => { if (button)
                buttons.current.set(item.id, button);
            else
                buttons.current.delete(item.id); }, onKeyDown: event => navigate(event, index), onClick: () => onChange(item.id) }, item.label)) });
}
