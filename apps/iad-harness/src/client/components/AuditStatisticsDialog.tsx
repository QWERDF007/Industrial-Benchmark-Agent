import React from 'react';
import type {AuditStatistics} from '../../shared/domain.generated.js';
import type {JobSnapshot} from '../../shared/contracts.js';
import {auditIssueLabels} from '../../shared/audit.generated.js';
import {jobIsActive} from '../../shared/job-display.js';
import {useResource} from '../useResource.js';
import {Modal} from './Modal.js';

export function AuditStatisticsDialog({job,revision,onClose}:{job:JobSnapshot;revision:number;onClose():void}) {
  const result=useResource<AuditStatistics>(`/audit/jobs/${encodeURIComponent(job.run_id)}/statistics`,`${revision}:${job.status}`,jobIsActive(job));
  const data=result.data;
  return <Modal title="模型审计统计" size="form" onClose={onClose}>
    {result.error&&<p role="alert">{result.error}</p>}
    {result.loading&&<p role="status">正在读取统计…</p>}
    {data&&<div className="iad-audit-statistics">
      <dl>{[['全部图像',data.total_images],['已处理',data.completed_images],['正常',data.normal_images],['疑似问题',data.suspect_images],['未完成',data.incomplete_images]].map(([label,count])=><div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>
      <h3>问题类型分布</h3>
      {Object.keys(data.issue_types).length?<table><thead><tr><th>问题类型</th><th>图像数</th><th>问题数</th></tr></thead><tbody>
        {Object.entries(data.issue_types).map(([kind,count])=><tr key={kind}><td>{auditIssueLabels[kind as keyof typeof auditIssueLabels]||kind}</td><td>{count.image_count}</td><td>{count.occurrences}</td></tr>)}
      </tbody></table>:<p>暂无疑似问题</p>}
    </div>}
  </Modal>;
}
