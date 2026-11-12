import React from 'react';

export function AuditReportChart({kind,title,rows,unit}:{
  kind:'outcomes'|'issues';title:string;rows:readonly {label:string;value:number}[];unit:string;
}) {
  const maximum=Math.max(1,...rows.map(row=>row.value));
  const columns={gridTemplateColumns:`repeat(${rows.length},minmax(0,1fr))`};
  return <figure className="iad-audit-chart" data-chart={kind}>
    <figcaption>{title}</figcaption>
    <div className="iad-audit-chart-bars" style={columns} role="img"
      aria-label={rows.map(row=>`${row.label} ${row.value} ${unit}`).join('；')}>
      {rows.map(row=><div className="iad-audit-chart-column" key={row.label}>
        <span className="iad-audit-chart-value">{row.value.toLocaleString('zh-CN')}</span>
        <span className="iad-audit-chart-bar" style={{height:`${row.value/maximum*85}%`}}/>
      </div>)}
    </div>
    <div className="iad-audit-chart-labels" style={columns} aria-hidden="true">
      {rows.map(row=><span key={row.label}>{row.label}</span>)}
    </div>
  </figure>;
}
