import React, {useId, useState} from 'react';

export function ModuleNumberSetting({label, value, min, max, step, validationMessage, onSave}: {
  label: string; value: number; min: number; max?: number; step: number;
  validationMessage: string; onSave(value: number): void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState(false);
  return <div>
    <label className="iad-module-row"><span>{label}</span>
      <input aria-label={label} type="number" min={min} max={max} step={step} required value={draft ?? value}
        aria-invalid={error || undefined} aria-describedby={error ? id : undefined}
        onChange={event => {setDraft(event.target.value);setError(false);}}
        onKeyDown={event => {if (event.key === 'Enter') event.currentTarget.blur();}}
        onBlur={event => {
          if (!event.currentTarget.validity.valid || !Number.isFinite(event.currentTarget.valueAsNumber)) {setError(true);return;}
          const next = event.currentTarget.valueAsNumber;
          if (next !== value) onSave(next);
          setDraft(null);setError(false);
        }} />
    </label>
    {error && <p id={id} role="alert">{validationMessage}</p>}
  </div>;
}
