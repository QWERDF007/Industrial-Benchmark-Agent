import React, {forwardRef, useEffect, useId, useRef, useState} from 'react';
import {autoUpdate, flip, offset, shift, size, useFloating} from '@floating-ui/react';
import {ChevronIcon} from '../AuditIcon.js';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({className = '', ...props}, ref) {
    return <select {...props} ref={ref} className={`iad-select ${className}`} />;
  },
);

export interface MultiSelectOption {value: string; label: string}
export function MultiSelect({id, menuId, label, options, selected, onToggle, disabled = false, emptyText = '暂无选项'}: {
  id: string; menuId?: string; label: string; options: MultiSelectOption[]; selected: readonly string[] | ReadonlySet<string>;
  onToggle(value: string): void; disabled?: boolean; emptyText?: string;
}) {
  const generatedId = useId();
  const panelId = menuId || generatedId;
  const panel = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const values = new Set(selected);
  const {refs, floatingStyles, isPositioned, update} = useFloating({open, placement:'bottom-start', strategy:'fixed',
    middleware:[offset(6), flip({padding:12}), shift({padding:12}), size({padding:12, apply({availableHeight, rects, elements}) {
      Object.assign(elements.floating.style, {width:`${rects.reference.width}px`, maxHeight:`${Math.min(300, availableHeight)}px`});
    }})],
  });
  useEffect(() => {
    const element = panel.current!;
    const trigger = refs.reference.current as HTMLButtonElement;
    element.popover = 'auto';
    trigger.popoverTargetElement = element;
    const toggle = (event: Event) => setOpen((event as ToggleEvent).newState === 'open');
    element.addEventListener('beforetoggle', toggle);
    return () => {element.removeEventListener('beforetoggle', toggle);trigger.popoverTargetElement = null;};
  }, [refs.reference]);
  useEffect(() => {
    if (!open || !refs.reference.current || !refs.floating.current) return;
    return autoUpdate(refs.reference.current, refs.floating.current, update);
  }, [open, refs, update]);
  useEffect(() => {if (disabled) panel.current?.hidePopover();}, [disabled]);
  return <div className="iad-multiselect">
    <button ref={refs.setReference} id={id} type="button" className="iad-select iad-multiselect-trigger" disabled={disabled}
      aria-label={`选择${label}`} aria-expanded={open} aria-controls={panelId}>
      <span>{values.size ? `已选 ${values.size} 个${label}` : `请选择${label}`}</span><ChevronIcon size={16} />
    </button>
    <div ref={element => {panel.current = element; refs.setFloating(element);}} id={panelId}
      className="iad-select-popover" style={{...floatingStyles,visibility:open && isPositioned ? 'visible' : 'hidden'}} role="group" aria-label={`${label}选择`}>
      {options.length ? options.map(option => <label key={option.value} className="iad-select-option">
        <input type="checkbox" value={option.value} checked={values.has(option.value)} disabled={disabled} onChange={() => onToggle(option.value)} />
        <span>{option.label}</span>
      </label>) : <p className="iad-select-empty">{emptyText}</p>}
    </div>
  </div>;
}
