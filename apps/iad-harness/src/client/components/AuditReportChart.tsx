import React from 'react';
import {Chart} from './charts/Chart.js';

export function AuditOutcomeChart({title,normal,suspect,incomplete,description}:{title:string;normal:number;
  suspect:number;incomplete?:number;description?:string}) {
  return <Chart id="outcomes" title={title} description={description} spec={{type:'donut',unit:'张',rows:[
    {id:'normal',label:'审计正常',value:normal,tone:'success'},
    {id:'suspect',label:'发现疑点',value:suspect,tone:'warning'},
    ...(incomplete===undefined?[]:[{id:'incomplete',label:'未完成',value:incomplete,tone:'muted' as const}]),
  ]}}/>;
}

export function AuditReportChart({kind,title,rows,unit,maximum}:{
  kind:'issues'|'consistency'|'program-conflicts'|'model-conflicts';title:string;
  rows:readonly {label:string;value:number}[];unit:string;maximum?:number;
}) {
  return <Chart id={kind} title={title} spec={{type:'bar',series:[{label:'数量',unit}],
    rows:rows.map(row=>({id:row.label,label:row.label,values:[row.value]})),maximum}}/>;
}
