import React, {useRef} from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: React.ReactNode;
  buttonProps?: Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, 'id' | 'aria-controls'>
    & {[key: `data-${string}`]: string | undefined};
}

export function TabBar<T extends string>({label, items, value, onChange, className = ''}: {
  label: string; items: readonly TabItem<T>[]; value: T; onChange(value: T): void; className?: string;
}) {
  const buttons = useRef(new Map<T, HTMLButtonElement>());
  function navigate(event: React.KeyboardEvent, index: number) {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : event.key === 'ArrowRight' ? (index + 1) % items.length : event.key === 'ArrowLeft' ? (index + items.length - 1) % items.length : null;
    if (next === null) return;
    event.preventDefault(); onChange(items[next].id); buttons.current.get(items[next].id)?.focus({preventScroll:true});
  }
  return <div className={`iad-tabs ${className}`.trim()} role="tablist" aria-label={label}>
    {items.map((item, index) => <button {...item.buttonProps} key={item.id} type="button" role="tab" aria-selected={value === item.id}
      tabIndex={value === item.id ? 0 : -1} className={value === item.id ? 'active' : ''}
      ref={button => {if (button) buttons.current.set(item.id, button); else buttons.current.delete(item.id);}}
      onKeyDown={event => navigate(event, index)} onClick={() => onChange(item.id)}>{item.label}</button>)}
  </div>;
}
