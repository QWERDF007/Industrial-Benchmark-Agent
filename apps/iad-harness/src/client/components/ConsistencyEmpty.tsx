import React from 'react';

export function ConsistencyEmpty({title,description,children}:{title:string;description:string;children?:React.ReactNode}) {
  return <div className="iad-consistency-empty" role="status">
    <svg aria-hidden="true" width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="6" width="26" height="24" rx="3"/><path d="m9 24 7-7 5 5 4-4 6 6"/><circle cx="24" cy="13" r="2"/></svg>
    <h2>{title}</h2><p>{description}</p>{children && <div className="iad-row">{children}</div>}
  </div>;
}
