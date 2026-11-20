import React, {useState} from 'react';
import {ModuleSettingRow} from './ModuleSettingRow.js';

export function ModuleNumberSetting({label, value, min, max, step, validationMessage, onSave, hint, disabled, validate,
  commitOnChange=false,onValidityChange,fractionDigits}: {
  label: string; value: number; min: number; max?: number; step: number;
  validationMessage: string; onSave(value: number): void;
  hint?: string; disabled?: boolean;validate?(value:number):boolean;
  commitOnChange?:boolean;onValidityChange?(valid:boolean):void;
  fractionDigits?:number;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const valid=(input:HTMLInputElement)=>input.validity.valid&&Number.isFinite(input.valueAsNumber)&&(!validate||validate(input.valueAsNumber));
  return <ModuleSettingRow label={label} hint={hint} error={error?validationMessage:undefined}>{props=>
      <input {...props} type="number" min={min} max={max} step={step} required
        value={draft ?? (fractionDigits===undefined?value:value.toFixed(fractionDigits))}
        disabled={disabled}
        onChange={event => {
          setDraft(event.target.value);setError(false);
          const accepted=valid(event.currentTarget);onValidityChange?.(accepted);
          if(commitOnChange&&accepted)onSave(event.currentTarget.valueAsNumber);
        }}
        onKeyDown={event => {if (event.key === 'Enter') event.currentTarget.blur();}}
        onBlur={event => {
          const accepted=valid(event.currentTarget);onValidityChange?.(accepted);
          if (!accepted) {setError(true);return;}
          const next = event.currentTarget.valueAsNumber;
          if (next !== value) onSave(next);
          setDraft(null);setError(false);
        }} />
    }</ModuleSettingRow>;
}
