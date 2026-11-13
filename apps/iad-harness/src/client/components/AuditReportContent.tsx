import React from 'react';
import {auditReportSections,auditMetadataLabels} from '../audit-report.js';
import {AuditReportSection} from './AuditReportSection.js';
import {AuditReportDistribution} from './AuditReportDistribution.js';
import type {AuditRunReport,AuditReportImage} from '../../shared/domain.generated.js';
import {auditCapabilityLabels,auditCoverageLabels,auditPurposeLabels,auditUsabilityLabels,auditReadinessLabels,auditIssueLabels,auditIssueTypesByFormat,auditConsistencyLabels} from '../../shared/audit.generated.js';
import {AuditEvidenceGallery} from './AuditEvidenceGallery.js';
import {AuditReportChart} from './AuditReportChart.js';
import {AuditCaseGallery,auditCaseImages} from './AuditReportCases.js';
import {AuditEvidenceSection} from './AuditEvidenceSection.js';
import {AuditReportConsistency} from './AuditReportConsistency.js';
import {AuditReportKnowledge} from './AuditReportKnowledge.js';
import {AuditReportHeading} from './AuditReportHeading.js';

export function AuditReportContent({report,imageUrl}:{report:AuditRunReport;imageUrl(item:AuditReportImage):string}) {
  const stats=report.statistics,profile=report.dataset_profile;
  const {coverage_topics:topics=[],report_cases:cases=[],capability_topics:capabilityTopics=[]}=report;
  const kinds=profile?auditIssueTypesByFormat[profile.dataset_format]:Object.keys(stats?.issue_types||{}) as (keyof typeof auditIssueLabels)[];
  const sources=stats?Object.entries(auditConsistencyLabels).map(([key,label])=>({key,label,
    value:Object.values(stats.consistency_cross[key]||{}).reduce((sum,count)=>sum+count,0)})):[];
  const compared=sources.filter(item=>item.key.startsWith('MODEL_REVIEWED:')).reduce((sum,item)=>sum+item.value,0);
  const showReadiness=report.capabilities.some(item=>item.readiness_status!=='not_evaluated');
  const qualityCases=cases.filter(item=>item.evidence_refs.some(reference=>reference.kind==='finding'));
  return <article className="iad-audit-document">
    <header className="iad-audit-report-intro"><h1>模型审计报告</h1>
      <p>{Object.values(report.dataset_names).join('、')}</p>
      <div className="iad-audit-report-meta"><span>审计覆盖 {report.audited_samples} / {report.total_samples} 张</span>
        {report.model_name&&<span>审计模型 {report.model_name}</span>}
        {report.finished_at&&<span>报告完成时间 {new Date(report.finished_at).toLocaleString('zh-CN',{hour12:false})}</span>}
        {profile&&<span>数据格式 {profile.dataset_format==='labelme'?'Labelme':'目录分类'}</span>}
      </div>
    </header>
    <AuditReportSection section="conclusion">
      <p>{report.conclusion||'整体分析尚未完成。'}</p>
      {stats&&<p>已检查 {stats.completed_images} 张图像，其中 {stats.suspect_images} 张需要复核。
        {!!sources.length&&<>已有的一致性检查对 {compared} 张图像做过跨图比较。</>}</p>}
      <AuditReportChart kind="outcomes" title="本轮审计结果" unit="张" rows={[
        {label:'审计正常',value:stats?.normal_images??report.distribution.normal??0},
        {label:'发现疑点',value:report.suspect_samples},{label:'未完成',value:report.total_samples-report.audited_samples}]}/>
    </AuditReportSection>
    <AuditReportDistribution key={report.run_id} report={report}/>
    <AuditReportConsistency report={report} sources={sources} imageUrl={imageUrl}/>
    <AuditReportSection section="quality">
      {stats?stats.suspect_images>0?<p>有 {stats.suspect_images} 张图像需要复核，共 {stats.issue_occurrences} 处。
        {stats.suspect_rate_among_completed!==null&&<>占已完成图像的 {(100*stats.suspect_rate_among_completed).toLocaleString('zh-CN',{maximumFractionDigits:2})}%。</>}</p>
        :<p>本次已完成的图像检查中，没有发现需要保留的标注疑点。</p>:<p>本作业尚无质量汇总统计。</p>}
      {!!stats?.issue_occurrences&&<AuditReportChart kind="issues" title="需要复核的问题" unit="项"
        rows={kinds.map(kind=>({label:auditIssueLabels[kind],value:stats.issue_types[kind]?.occurrences??0}))}/>}
      {qualityCases.map((item,index)=><article className="iad-audit-discovery" key={item.case_id}>
        <AuditEvidenceSection content={{number:auditReportSections.quality.prefix+(index+1),title:item.title,description:item.observation,
          galleries:[{title:'图像证据',images:auditCaseImages(report,[item.case_id])}],
          analysis:[{title:'跨图对照',text:item.comparison},{title:'复核重点',text:item.significance}]}} imageUrl={imageUrl}/>
      </article>)}
      {!!report.review_priorities.length&&<><AuditReportHeading level={3} number={auditReportSections.quality.prefix+(qualityCases.length+1)}>复核重点</AuditReportHeading><ul>{report.review_priorities.map((item,index)=><li key={index}>{item}</li>)}</ul></>}
    </AuditReportSection>
    <AuditReportSection section="coverage"><p>{report.coverage_analysis}</p>
      {topics.map((topic,index)=><article className="iad-audit-discovery" data-audit-topic="coverage" key={index}>
        <AuditReportHeading level={3} number={auditReportSections.coverage.prefix+(index+1)}>{topic.title}</AuditReportHeading><p>{topic.analysis}</p><AuditCaseGallery ids={topic.related_case_ids||[]} report={report} imageUrl={imageUrl} heading={{level:4,number:auditReportSections.coverage.prefix+(index+1)+'.1'}}/>
        {!topic.related_case_ids?.length&&<AuditEvidenceGallery items={report.evidence_groups['coverage:'+index]||[]} imageUrl={imageUrl} heading={{level:4,number:auditReportSections.coverage.prefix+(index+1)+'.1'}}/>}
      </article>)}
      {!cases.length&&report.discoveries.map((discovery,index)=><article className="iad-audit-discovery" key={discovery.group_id} data-audit-discovery={discovery.group_id}>
        <AuditReportHeading level={3} number={auditReportSections.coverage.prefix+(topics.length+index+1)}>{discovery.title}</AuditReportHeading><p>{discovery.description}</p>
        <AuditEvidenceGallery items={report.evidence_groups[discovery.group_id]||[]} imageUrl={imageUrl} heading={{level:4,number:auditReportSections.coverage.prefix+(topics.length+index+1)+'.1'}}/>
      </article>)}
    </AuditReportSection>
    <AuditReportSection section="independence"><p>{report.independence_analysis}</p>
      {profile&&<dl className="iad-report-data">{Object.entries(profile.metadata).filter(([,item])=>item.covered_images>0).map(([key,item])=><div key={key}>
        <dt>{auditMetadataLabels[key]}</dt><dd>{item.distinct_count} 种登记值，覆盖 {item.covered_images} / {profile.total_images} 张图像</dd></div>)}
        {profile.strict_duplicate_groups!==null&&<div><dt>严格重复</dt><dd>{profile.strict_duplicate_groups} 组，涉及 {profile.strict_duplicate_images} 张图像</dd></div>}
        {profile.near_candidate_pairs>0&&<div><dt>相近候选</dt><dd>{profile.near_candidate_pairs} 对</dd></div>}
      </dl>}
    </AuditReportSection>
    <AuditReportSection section="capabilities">
      {capabilityTopics.map((topic,index)=><article className="iad-audit-discovery" key={index}>
        <AuditReportHeading level={3} number={auditReportSections.capabilities.prefix+(index+1)}>{topic.title}</AuditReportHeading><p>{topic.summary}</p>
        {topic.points.map((point,pointIndex)=><section key={pointIndex} data-capability-point>
          <AuditReportHeading level={4} number={auditReportSections.capabilities.prefix+(index+1)+'.'+(pointIndex+1)}>{point.title}</AuditReportHeading><p>{point.observation_and_comparison}</p><p>{point.evaluation_value}</p>
          <AuditCaseGallery ids={point.case_ids} report={report} imageUrl={imageUrl} heading={{level:5,number:auditReportSections.capabilities.prefix+(index+1)+'.'+(pointIndex+1)+'.1'}}/>
        </section>)}
        {!!topic.missing_conditions.length&&<p>{topic.missing_conditions.join('；')}</p>}
      </article>)}
      {!!capabilityTopics.length&&report.capabilities.some(item=>item.coverage_status==='not_observed')&&<>
        <AuditReportHeading level={3} number={auditReportSections.capabilities.prefix+(capabilityTopics.length+1)}>尚缺的能力场景或评测证据</AuditReportHeading><ul>{report.capabilities.filter(item=>item.coverage_status==='not_observed').map(item=>
          <li key={item.tag}>{auditCapabilityLabels[item.tag]}：{item.reason}</li>)}</ul></>}
      {!capabilityTopics.length&&report.capabilities.map((item,index)=><article className="iad-audit-discovery" key={item.tag}>
        <AuditReportHeading level={3} number={auditReportSections.capabilities.prefix+(index+1)}>{auditCapabilityLabels[item.tag]}</AuditReportHeading>
        <p><span className="iad-audit-status" data-status={item.coverage_status}>{auditCoverageLabels[item.coverage_status]}</span></p>
        <p>{item.reason}</p>{!!item.missing_conditions.length&&<p>{item.missing_conditions.join('；')}</p>}
        {showReadiness&&<p>{item.readiness_track&&<>{item.readiness_track}，</>}{auditReadinessLabels[item.readiness_status]}</p>}
        <AuditEvidenceGallery items={report.evidence_groups['capability:'+item.tag]||[]} imageUrl={imageUrl} heading={{level:4,number:auditReportSections.capabilities.prefix+(index+1)+'.1'}}/>
      </article>)}
    </AuditReportSection>
    <AuditReportSection section="usability">
      {report.usability.map((item,index)=><article className="iad-audit-discovery" key={item.purpose}>
        <AuditReportHeading level={3} number={auditReportSections.usability.prefix+(index+1)}>{auditPurposeLabels[item.purpose]}</AuditReportHeading>
        <p><span className="iad-audit-status" data-status={item.status}>{auditUsabilityLabels[item.status]}</span></p><p>{item.reason}</p>
      </article>)}
      {profile?.benchmark&&<><AuditReportHeading level={3} number={auditReportSections.usability.prefix+(report.usability.length+1)}>已有评测成果</AuditReportHeading>
        <p>划分覆盖本次审计 {profile.benchmark.covered_images} / {profile.total_images} 张图像，
          {profile.benchmark.source_matches_scope?'与审计范围一致。':'成果范围与审计范围不同。'}</p>
        {Object.entries(profile.benchmark.readiness).map(([key,track],index)=><section key={key}>
          <AuditReportHeading level={4} number={auditReportSections.usability.prefix+(report.usability.length+1)+'.'+(index+1)}>{track.track_name}</AuditReportHeading><p>{auditReadinessLabels[track.status.toLowerCase() as keyof typeof auditReadinessLabels]}</p><p>{track.reason}</p>
        </section>)}
      </>}
      {!!report.limitations.length&&<><AuditReportHeading level={3} number={auditReportSections.usability.prefix+(report.usability.length+1+(profile?.benchmark?1:0))}>当前缺失条件</AuditReportHeading>{report.limitations.map((item,index)=><p key={index}>{item}</p>)}</>}
    </AuditReportSection>
    <AuditReportKnowledge report={report} imageUrl={imageUrl}/>
  </article>;
}
