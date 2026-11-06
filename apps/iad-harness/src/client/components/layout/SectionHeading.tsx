import React from 'react';

export function SectionHeading({title,titleId,children,className=''}:{title:string;titleId?:string;children?:React.ReactNode;className?:string}) {
  return <header className={`iad-section-heading ${className}`}>
    <h2 id={titleId} className="iad-section-title">{title}</h2>
    {children&&<div className="iad-section-actions">{children}</div>}
  </header>;
}
