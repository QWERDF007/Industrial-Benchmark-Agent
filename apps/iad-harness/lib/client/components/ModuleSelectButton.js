import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconChevronDownOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives';
export function ModuleSelectButton({ children, open, disabled, onClick, ...control }) {
    return _jsxs("button", { ...control, type: "button", className: "iad-module-selector", disabled: disabled, "aria-haspopup": "menu", "aria-expanded": open, onClick: onClick, children: [_jsx("span", { children: children }), _jsx(IconChevronDownOutlineRegular, {})] });
}
