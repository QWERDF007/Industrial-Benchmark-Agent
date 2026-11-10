import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
export function ModuleNumberSetting({ label, value, min, max, step, validationMessage, onSave }) {
    const id = useId();
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState(false);
    return _jsxs("div", { children: [_jsxs("label", { className: "iad-module-row", children: [_jsx("span", { children: label }), _jsx("input", { "aria-label": label, type: "number", min: min, max: max, step: step, required: true, value: draft ?? value, "aria-invalid": error || undefined, "aria-describedby": error ? id : undefined, onChange: event => { setDraft(event.target.value); setError(false); }, onKeyDown: event => { if (event.key === 'Enter')
                            event.currentTarget.blur(); }, onBlur: event => {
                            if (!event.currentTarget.validity.valid || !Number.isFinite(event.currentTarget.valueAsNumber)) {
                                setError(true);
                                return;
                            }
                            const next = event.currentTarget.valueAsNumber;
                            if (next !== value)
                                onSave(next);
                            setDraft(null);
                            setError(false);
                        } })] }), error && _jsx("p", { id: id, role: "alert", children: validationMessage })] });
}
