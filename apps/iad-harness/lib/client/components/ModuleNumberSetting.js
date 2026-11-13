import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { ModuleSettingRow } from './ModuleSettingRow.js';
export function ModuleNumberSetting({ label, value, min, max, step, validationMessage, onSave, hint, disabled }) {
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState(false);
    return _jsx(ModuleSettingRow, { label: label, hint: hint, error: error ? validationMessage : undefined, children: props => _jsx("input", { ...props, type: "number", min: min, max: max, step: step, required: true, value: draft ?? value, disabled: disabled, onChange: event => { setDraft(event.target.value); setError(false); }, onKeyDown: event => { if (event.key === 'Enter')
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
            } }) });
}
