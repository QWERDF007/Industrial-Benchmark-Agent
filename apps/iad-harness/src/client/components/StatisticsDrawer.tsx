import React from 'react';
import {Modal} from './Modal.js';

export function StatisticsDrawer({title,loading,error,onClose,children,className=''}:{title:string;loading?:boolean;
  error?:string;onClose():void;children?:React.ReactNode;className?:string}) {
  return <Modal title={title} className={`iad-drawer iad-statistics-drawer ${className}`} onClose={onClose}>
    <div className="iad-dialog-body iad-statistics-content">
      {error?<p role="alert">{error}</p>:loading?<p role="status">正在读取统计…</p>:children?
        <div className="iad-statistics-charts">{children}</div>:<p role="status">暂无统计数据。</p>}
    </div>
  </Modal>;
}
