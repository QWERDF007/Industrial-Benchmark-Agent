import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef } from 'react';
export function PageTabs({ label, items, value, onChange, children }) {
    const id = useId(), buttons = useRef(new Map());
    const current = items.find(item => item.id === value)?.id || items[0].id;
    function navigate(event, index) {
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
            : event.key === 'ArrowRight' ? (index + 1) % items.length : event.key === 'ArrowLeft' ? (index + items.length - 1) % items.length : null;
        if (next === null)
            return;
        event.preventDefault();
        onChange(items[next].id);
        buttons.current.get(items[next].id)?.focus();
    }
    return _jsxs(_Fragment, { children: [_jsx("div", { className: "iad-tabs", role: "tablist", "aria-label": label, children: items.map((item, index) => _jsx("button", { id: `${id}-${item.id}`, role: "tab", "aria-selected": current === item.id, "aria-controls": `${id}-panel`, tabIndex: current === item.id ? 0 : -1, className: current === item.id ? 'active' : '', ref: button => { if (button)
                        buttons.current.set(item.id, button);
                    else
                        buttons.current.delete(item.id); }, onKeyDown: event => navigate(event, index), onClick: () => onChange(item.id), children: item.label }, item.id)) }), _jsx("div", { className: "iad-tab-panel", role: "tabpanel", id: `${id}-panel`, "aria-labelledby": `${id}-${current}`, tabIndex: 0, children: children })] });
}
