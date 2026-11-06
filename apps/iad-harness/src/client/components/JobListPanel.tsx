import React from 'react';

interface JobListPanelProps extends React.ComponentPropsWithoutRef<'section'> {
  title:string;
  actions?:React.ReactNode;
}

export function JobListPanel({title,actions,children,className='',...props}:JobListPanelProps) {
  return <section {...props} aria-label={title} className={`iad-job-list ${className}`}>
    <header className="iad-job-list-header"><h2>{title}</h2>{actions}</header>
    {children}
  </section>;
}
