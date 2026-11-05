import React, {useId} from 'react';
import {TabBar, type TabItem} from './TabBar.js';

export function PageTabs<T extends string>({label, items, value, onChange, children, className}: {
  label: string; items: readonly TabItem<T>[]; value: T; onChange(value: T): void; children: React.ReactNode; className?: string;
}) {
  const id = useId();
  const current = items.find(item => item.id === value)?.id || items[0]?.id;
  if (!current) return null;
  return <>
    <TabBar label={label} className={className} value={current} onChange={onChange} items={items.map(item => ({...item,
      buttonProps: {...item.buttonProps, id: `${id}-${item.id}`, 'aria-controls': `${id}-panel`}}))} />
    <div className="iad-tab-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${current}`} tabIndex={0}>{children}</div>
  </>;
}
