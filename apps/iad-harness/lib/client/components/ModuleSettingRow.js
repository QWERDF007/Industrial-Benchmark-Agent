import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
export function ModuleSettingRow({ label, controlLabel, hint, error, children }) {
    const id = useId();
    return _jsxs("div", { className: "iad-module-row", children: [_jsxs("div", { className: "iad-module-row-text", children: [_jsx("label", { htmlFor: id, className: "iad-setting-label", children: label }), hint && _jsx("p", { id: id + '-hint', className: "iad-setting-hint", children: hint }), error && _jsx("p", { id: id + '-error', role: "alert", className: "iad-setting-hint", children: error })] }), _jsx("div", { className: "iad-module-control", children: children({ id, 'aria-label': controlLabel ?? label,
                    'aria-describedby': [hint ? id + '-hint' : null, error ? id + '-error' : null].filter(Boolean).join(' ') || undefined,
                    'aria-invalid': error ? true : undefined }) })] });
}
