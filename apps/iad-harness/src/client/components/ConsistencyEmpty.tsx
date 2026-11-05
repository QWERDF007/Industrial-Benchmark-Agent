import React from 'react';

export function ConsistencyEmpty({message,children}:{message:string;children?:React.ReactNode}) {
  return <div className="iad-consistency-empty" role="status">
    <p>{message}</p>{children && <div className="iad-row">{children}</div>}
  </div>;
}
