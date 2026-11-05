import React from 'react';
import {navigation, type PageId} from '../../../shared/navigation.js';

export function WorkbenchHeader({pageId, children, title}: {pageId: PageId; children?: React.ReactNode; title?: string}) {
  const page = navigation[pageId];
  return <header className="iad-header">
    <h1>{title || page.label}</h1>
    {children && <div className="iad-header-actions">{children}</div>}
  </header>;
}
