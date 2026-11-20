import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { ModuleSettingRow } from './ModuleSettingRow.js';
export function ModuleNumberSetting({ label, value, min, max, step, validationMessage, onSave, hint, disabled, validate, commitOnChange = false, onValidityChange, fractionDigits }) {
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState(false);
    const valid = (input) => input.validity.valid && Number.isFinite(input.valueAsNumber) && (!validate || validate(input.valueAsNumber));
    return _jsx(ModuleSettingRow, { label: label, hint: hint, error: error ? validationMessage : undefined, children: props => _jsx("input", { ...props, type: "number", min: min, max: max, step: step, required: true, value: draft ?? (fractionDigits === undefined ? value : value.toFixed(fractionDigits)), disabled: disabled, onChange: event => {
                setDraft(event.target.value);
                setError(false);
                const accepted = valid(event.currentTarget);
                onValidityChange?.(accepted);
                if (commitOnChange && accepted)
                    onSave(event.currentTarget.valueAsNumber);
            }, onKeyDown: event => { if (event.key === 'Enter')
                event.currentTarget.blur(); }, onBlur: event => {
                const accepted = valid(event.currentTarget);
                onValidityChange?.(accepted);
                if (!accepted) {
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
