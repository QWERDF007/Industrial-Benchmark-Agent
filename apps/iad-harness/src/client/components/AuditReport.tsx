import React from 'react';
import type {AuditRunReport} from '../../shared/domain.generated.js';
import type {JobSnapshot} from '../../shared/contracts.js';
import {useResource} from '../useResource.js';
import {nativeAuditEvidenceUrl} from '../api.js';
import {Button} from './Button.js';
import {AuditReportContent} from './AuditReportContent.js';

export function AuditReport({job,revision}:{job:JobSnapshot|null;revision:number}) {
  const terminal=!!job&&!['PENDING','RUNNING'].includes(job.status);
  const resource=useResource<AuditRunReport>(terminal?`/audit/jobs/${encodeURIComponent(job.run_id)}/report`:null,revision);
  const report=resource.data;
  return <section className="audit-panel iad-dataset-report" id="audit-report" data-run-id={job?.run_id}>
    <header className="audit-panel-head">{!report&&<h2>模型审计报告</h2>}<div className="iad-actions">
      <Button disabled={!report?.export_ready} onClick={()=>window.location.assign(`/api/iad/audit/jobs/${encodeURIComponent(job!.run_id)}/export`)}>导出 HTML</Button>
    </div></header>
    <div className="iad-report-body">
      {!job&&<p className="iad-result-empty">当前没有审计作业</p>}
      {job&&!terminal&&<p role="status">审计完成后生成本作业报告。</p>}
      {resource.loading&&<p role="status">正在读取本作业报告…</p>}
      {resource.error&&<p role="alert">{resource.error}</p>}
      {report?.statistics&&report.report_state!=='COMPLETED'&&<p role="status">整体报告未完成</p>}
      {report?.archived&&<p>历史审计已归档，可下载冻结报告。</p>}
      {report&&!report.archived&&<AuditReportContent report={report} imageUrl={item=>nativeAuditEvidenceUrl(report.run_id,item.sample_id,item.image)}/>}
    </div>
  </section>;
}
