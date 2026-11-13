import React from 'react';
import {Chart} from './charts/Chart.js';

export function AuditReportChart({kind,title,rows,unit,maximum}:{
  kind:'outcomes'|'issues'|'consistency'|'program-conflicts'|'model-conflicts';title:string;
  rows:readonly {label:string;value:number}[];unit:string;maximum?:number;
}) {
  return <Chart id={kind} title={title} spec={kind==='outcomes'?{type:'donut',unit,
    rows:rows.map((row,index)=>({id:row.label,...row,tone:(['success','warning','muted'] as const)[index]}))}
    :{type:'bar',series:[{label:'数量',unit}],rows:rows.map(row=>({id:row.label,label:row.label,values:[row.value]})),maximum}}/>;
}
