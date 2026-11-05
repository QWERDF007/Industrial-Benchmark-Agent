import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { TabBar } from './TabBar.js';
export function PageTabs({ label, items, value, onChange, children, className }) {
    const id = useId();
    const current = items.find(item => item.id === value)?.id || items[0]?.id;
    if (!current)
        return null;
    return _jsxs(_Fragment, { children: [_jsx(TabBar, { label: label, className: className, value: current, onChange: onChange, items: items.map(item => ({ ...item,
                    buttonProps: { ...item.buttonProps, id: `${id}-${item.id}`, 'aria-controls': `${id}-panel` } })) }), _jsx("div", { className: "iad-tab-panel", role: "tabpanel", id: `${id}-panel`, "aria-labelledby": `${id}-${current}`, tabIndex: 0, children: children })] });
}
