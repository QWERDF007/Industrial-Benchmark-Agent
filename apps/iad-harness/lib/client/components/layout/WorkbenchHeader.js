import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { navigation } from '../../../shared/navigation.js';
export function WorkbenchHeader({ pageId, children, title, className = '' }) {
    const page = navigation[pageId];
    return _jsxs("header", { className: `iad-header ${className}`, children: [_jsx("h1", { children: title || page.label }), children && _jsx("div", { className: "iad-header-actions", children: children })] });
}
