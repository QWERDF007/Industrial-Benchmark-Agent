import React from 'react';
import {SectionHeading} from './layout/SectionHeading.js';

export function JobStartPanel({fields,actions,error,onSubmit}:{
  fields:ReadonlyArray<{label:string;value:React.ReactNode}>;
  actions:React.ReactNode;error?:string;onSubmit():void;
}) {
  return <form className="iad-job-list iad-job-start" aria-label="确认并启动"
    onSubmit={event=>{event.preventDefault();onSubmit();}}>
    <SectionHeading title="确认并启动" className="iad-job-list-header"/>
    <div className="iad-job-table-scroll"><table className="iad-job-table-grid iad-jobs-table iad-job-start-fields">
      <thead><tr>{fields.map(({label})=><th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody><tr>{fields.map(({label,value})=><td key={label} title={typeof value==='string'?value:undefined}>{value}</td>)}</tr></tbody>
    </table></div>
    {error&&<p className="iad-job-start-error iad-error" role="alert">{error}</p>}
    <footer className="iad-job-start-actions">{actions}</footer>
  </form>;
}
