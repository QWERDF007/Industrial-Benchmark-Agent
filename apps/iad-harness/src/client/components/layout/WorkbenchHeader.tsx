import React from 'react';
import {navigation, type PageId} from '../../../shared/navigation.js';

export function WorkbenchHeader({pageId, children, title, className = ''}: {pageId: PageId; children?: React.ReactNode; title?: string; className?: string}) {
  const page = navigation[pageId];
  return <header className={`iad-header ${className}`}>
    <h1>{title || page.label}</h1>
    {children && <div className="iad-header-actions">{children}</div>}
  </header>;
}
