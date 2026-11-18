import React from 'react';
import type {AuditStatistics} from '../../shared/domain.generated.js';
import type {JobSnapshot} from '../../shared/contracts.js';
import {auditIssueLabels} from '../../shared/audit.generated.js';
import {jobIsActive} from '../../shared/job-display.js';
import {useResource} from '../useResource.js';
import {AuditOutcomeChart} from './AuditReportChart.js';
import {StatisticsDrawer} from './StatisticsDrawer.js';
import {Chart} from './charts/Chart.js';
import {chartNumber} from './charts/options.js';

export function AuditStatisticsDrawer({job,revision,onClose}:{job:JobSnapshot;revision:number;onClose():void}) {
  const {data,loading,error}=useResource<AuditStatistics>(`/audit/jobs/${encodeURIComponent(job.run_id)}/statistics`,
    `${revision}:${job.status}`,jobIsActive(job));
  return <StatisticsDrawer title="模型审计统计" loading={loading} error={error} onClose={onClose}>
    {data&&<>
      <AuditOutcomeChart title="审计结果" normal={data.normal_images} suspect={data.suspect_images} incomplete={data.incomplete_images}
        description={`已处理 ${chartNumber(data.completed_images)} / ${chartNumber(data.total_images)} 张`}/>
      <Chart id="audit-issue-types" title="问题类型分布" spec={{type:'bar',
        series:[{label:'涉及图像',unit:'张'},{label:'问题次数',unit:'次'}],
        rows:Object.entries(data.issue_types).map(([kind,count])=>({id:kind,
          label:auditIssueLabels[kind as keyof typeof auditIssueLabels]||kind,values:[count.image_count,count.occurrences]}))}}/>
    </>}
  </StatisticsDrawer>;
}
