import React, {useState} from 'react';
import {ModuleSettingRow} from './ModuleSettingRow.js';

export function ModuleNumberSetting({label, value, min, max, step, validationMessage, onSave, hint, disabled}: {
  label: string; value: number; min: number; max?: number; step: number;
  validationMessage: string; onSave(value: number): void;
  hint?: string; disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState(false);
  return <ModuleSettingRow label={label} hint={hint} error={error?validationMessage:undefined}>{props=>
      <input {...props} type="number" min={min} max={max} step={step} required value={draft ?? value}
        disabled={disabled}
        onChange={event => {setDraft(event.target.value);setError(false);}}
        onKeyDown={event => {if (event.key === 'Enter') event.currentTarget.blur();}}
        onBlur={event => {
          if (!event.currentTarget.validity.valid || !Number.isFinite(event.currentTarget.valueAsNumber)) {setError(true);return;}
          const next = event.currentTarget.valueAsNumber;
          if (next !== value) onSave(next);
          setDraft(null);setError(false);
        }} />
    }</ModuleSettingRow>;
}
