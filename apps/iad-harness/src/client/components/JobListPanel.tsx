import {SectionHeading} from './layout/SectionHeading.js';
import React from 'react';

interface JobListPanelProps extends React.ComponentPropsWithoutRef<'section'> {
  title:string;
  actions?:React.ReactNode;
}

export function JobListPanel({title,actions,children,className='',...props}:JobListPanelProps) {
  return <section {...props} aria-label={title} className={`iad-job-list ${className}`}>
    <SectionHeading className="iad-job-list-header" title={title}>{actions}</SectionHeading>
    {children}
  </section>;
}
