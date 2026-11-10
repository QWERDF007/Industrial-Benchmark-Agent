import React,{useState} from 'react';
import type {AuditRunReport,AuditReportImage} from '../../shared/domain.generated.js';
import {ImageViewer,type ImageSource} from './ImageViewer.js';
import {AuditReportCharts} from './AuditReportCharts.js';
import {AuditEvidenceGallery} from './AuditEvidenceGallery.js';

export function AuditReportContent({report,imageUrl}:{report:AuditRunReport;imageUrl(item:AuditReportImage):string}) {
  const [image,setImage]=useState<ImageSource|null>(null);
  const stats=report.statistics;
  return <>
    <dl className="iad-report-data"><div><dt>审计范围</dt><dd>{Object.values(report.dataset_names).join('、')}</dd></div>
      <div><dt>分析模型</dt><dd>{report.model_name||''}</dd></div>
      <div><dt>审计覆盖</dt><dd>{report.audited_samples} / {report.total_samples}，{report.coverage_percent??'—'}%</dd></div>
      {stats&&<><div><dt>独立质量疑点</dt><dd>{stats.issue_occurrences} 次，涉及 {stats.suspect_images} 张图像</dd></div>
        <div><dt>疑点图像占比</dt><dd>{stats.suspect_rate_among_completed===null?'—':(100*stats.suspect_rate_among_completed).toFixed(2)+'%'}（分母为已完成的 {stats.completed_images} 张图像）</dd></div></>}
    </dl>
    <AuditReportCharts report={report} keys={['coverage','outcomes']}/>
    {report.scope_analysis&&<section className="iad-report-section"><h3>审计范围与方法</h3><p>{report.scope_analysis}</p></section>}
    <section className="iad-report-section"><h3>主要质量疑点</h3>
      <AuditReportCharts report={report} keys={['issues','datasets']}/>
      {report.analysis&&<p>{report.analysis}</p>}
      {report.groups.map(group=><section className="iad-report-section" key={group.group_id} data-audit-group={group.group_id}>
        <h3>{group.title}</h3><p>{group.description}</p><p>涉及 {group.affected_image_count} 张图像，{group.issue_occurrences} 次问题</p>
        {group.normal_explanations.map((text,index)=><p key={index}>{text}</p>)}{group.limitations.map((text,index)=><p key={index}>{text}</p>)}
        <AuditEvidenceGallery items={report.evidence_groups[group.group_id]||[]} imageUrl={imageUrl} onOpen={setImage}/>
      </section>)}
    </section>
    <section className="iad-report-section"><h3>数据一致性的实际作用</h3>
      {report.consistency_analysis&&<p>{report.consistency_analysis}</p>}
      <AuditReportCharts report={report} keys={['consistency','assessments']}/>
    </section>
    {!!Object.keys(report.knowledge_titles).length&&<section className="iad-report-section"><h3>知识的实际作用</h3>
      {report.knowledge_analysis&&<p>{report.knowledge_analysis}</p>}
      <AuditReportCharts report={report} keys={['knowledge']}/>
    </section>}
    {(report.boundary_analysis||!!stats?.observation_occurrences)&&<section className="iad-report-section"><h3>判断边界与待判别观察</h3>
      {report.boundary_analysis&&<p>{report.boundary_analysis}</p>}
      <AuditReportCharts report={report} keys={['observations']}/>
    </section>}
    <section className="iad-report-section"><h3>整体结论与复核重点</h3><p>{report.conclusion}</p>
      {report.limitations.map((value,index)=><p key={index}>{value}</p>)}
    </section>
    {image&&<ImageViewer image={image} onClose={()=>setImage(null)}/>}
  </>;
}
