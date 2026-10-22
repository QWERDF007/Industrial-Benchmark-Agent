import React from 'react';
import {navigation, type PageId} from '../../../shared/navigation.js';

export function WorkbenchHeader({pageId, children}: {pageId: PageId; children?: React.ReactNode}) {
  const page = navigation[pageId];
  return <header className="iad-header">
    <div><p className="iad-breadcrumb" aria-label="所在章节">{page.chapter}</p><h1>{page.label}</h1></div>
    {children && <div className="iad-header-actions">{children}</div>}
  </header>;
}
