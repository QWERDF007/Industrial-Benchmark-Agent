import React from 'react';
import type {AuditRunReport,AuditSampleItem} from '../../shared/domain.generated.js';
import type {JobSnapshot} from '../../shared/contracts.js';
import {auditStateLabels} from '../../shared/audit.generated.js';
import {useResource} from '../useResource.js';
import {Button} from './Button.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {auditSampleImage} from './AuditSampleMedia.js';

interface ReportChart {
  title: string;
  axis_max: number;
  columns: {label: string; value: number; muted: boolean}[];
}

function CountChart({chart}: {chart:ReportChart}) {
  return <figure className="iad-report-chart" aria-label={chart.title}><figcaption>{chart.title}</figcaption>
    <div className="iad-report-chart-body"><div className="iad-report-chart-axis" aria-hidden="true">
      {[4,3,2,1,0].map(index=><span key={index}>{chart.axis_max*index/4}</span>)}</div>
      <div className="iad-report-chart-figure"><div className="iad-report-chart-grid" aria-hidden="true" />
        <div className="iad-report-chart-columns" style={{'--chart-columns':Math.max(1,chart.columns.length)} as React.CSSProperties}>
          {chart.columns.map((column,index)=><div className="iad-report-chart-column" key={index}>
            <div className="iad-report-chart-slot"><div className="iad-report-chart-bar" data-muted={column.muted}
              style={{height:`${100*column.value/chart.axis_max}%`}}><span className="iad-report-chart-value">{column.value}</span></div></div>
            <span className="iad-report-chart-label">{column.label}</span></div>)}
        </div></div></div>
  </figure>;
}

export function AuditReport({job,revision,onSample}: {job:JobSnapshot|null;revision:number;onSample(sample:AuditSampleItem):void}) {
  const terminal=!!job&&!['PENDING','RUNNING'].includes(job.status);
  const resource=useResource<AuditRunReport>(terminal?`/audit/jobs/${encodeURIComponent(job.run_id)}/report`:null,revision);
  const report=resource.data;
  const charts:ReportChart[]=report?[
    {title:'审计覆盖',axis_max:Math.max(1,report.total_samples),columns:[
      {label:'已审计',value:report.audited_samples,muted:false},{label:'未处理',value:report.total_samples-report.audited_samples,muted:true}]},
    {title:'图级状态',axis_max:Math.max(1,...Object.values(report.distribution)),columns:
      Object.entries(report.distribution).map(([state,count])=>({label:auditStateLabels[state as keyof typeof auditStateLabels],value:count,muted:state==='unprocessed'}))},
  ]:[];
  return <section className="audit-panel iad-dataset-report" id="audit-report" data-run-id={job?.run_id}>
    <header className="audit-panel-head"><h2>模型审计报告</h2><div className="iad-actions">
      <Button disabled={!report} onClick={()=>window.location.assign(`/api/iad/audit/jobs/${encodeURIComponent(job!.run_id)}/export`)}>导出 HTML</Button>
    </div></header>
    <div className="iad-report-body">
      {!job&&<p className="iad-result-empty">当前没有审计作业</p>}
      {job&&!terminal&&<p role="status">审计完成后生成本作业报告。</p>}
      {resource.loading&&<p role="status">正在读取本作业报告…</p>}
      {resource.error&&<p role="alert">{resource.error}</p>}
      {report&&<><dl className="iad-report-data">
        <div><dt>审计作业</dt><dd>{report.run_id}</dd></div>
        <div><dt>分析模型</dt><dd>{report.model_name||'未记录'}</dd></div>
        <div><dt>知识版本</dt><dd>{report.knowledge_version_id||'未选用知识'}</dd></div>
        <div><dt>审计覆盖</dt><dd>{report.audited_samples} / {report.total_samples}，{report.coverage_percent??'—'}%</dd></div>
      </dl><div className="iad-report-charts">{charts.map(chart=><CountChart key={chart.title} chart={chart}/>)}</div>
        <section className="iad-report-section"><h3>整体分析</h3><p>{report.analysis}</p></section>
        <section className="iad-report-section"><h3>审计结论</h3><p>{report.conclusion}</p></section>
        <section className="iad-report-section"><h3>限制</h3>{report.limitations.map((value,index)=><p key={index}>{value}</p>)}</section>
        <section className="iad-report-section"><h3>图像证据</h3><div className="iad-thumbnail-grid">
          {report.key_evidence.map(item=><ThumbnailCard key={item.sample_id} src={auditSampleImage(item,job!.task_id)}
            label={item.filename} onClick={()=>onSample(item)}/>)}
        </div></section>
      </>}
    </div>
  </section>;
}
