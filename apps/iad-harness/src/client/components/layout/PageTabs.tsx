import React, {useId, useRef} from 'react';

export function PageTabs<T extends string>({label, items, value, onChange, children}: {
  label: string; items: readonly {id: T; label: string}[]; value: T; onChange(value: T): void; children: React.ReactNode;
}) {
  const id = useId(), buttons = useRef(new Map<T, HTMLButtonElement>());
  const current = items.find(item => item.id === value)?.id || items[0].id;
  function navigate(event: React.KeyboardEvent, index: number) {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : event.key === 'ArrowRight' ? (index + 1) % items.length : event.key === 'ArrowLeft' ? (index + items.length - 1) % items.length : null;
    if (next === null) return;
    event.preventDefault(); onChange(items[next].id); buttons.current.get(items[next].id)?.focus();
  }
  return <>
    <div className="iad-tabs" role="tablist" aria-label={label}>{items.map((item, index) => <button key={item.id} id={`${id}-${item.id}`} role="tab"
      aria-selected={current === item.id} aria-controls={`${id}-panel`} tabIndex={current === item.id ? 0 : -1}
      className={current === item.id ? 'active' : ''} ref={button => {if (button) buttons.current.set(item.id, button); else buttons.current.delete(item.id);}}
      onKeyDown={event => navigate(event, index)} onClick={() => onChange(item.id)}>{item.label}</button>)}</div>
    <div className="iad-tab-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${current}`} tabIndex={0}>{children}</div>
  </>;
}
