import React from 'react';
import {auditReportSections} from '../audit-report.js';
import {AuditReportSection} from './AuditReportSection.js';
import type {AuditRunReport,AuditReportImage} from '../../shared/domain.generated.js';
import {auditConsistencyLabels,auditConsistencyDescriptions,auditIssueLabels,auditIssueDescriptions,auditIssueTypesByFormat} from '../../shared/audit.generated.js';
import {AuditEvidenceSection} from './AuditEvidenceSection.js';
import {AuditReportChart} from './AuditReportChart.js';
import {auditCaseImages} from './AuditReportCases.js';
import {AuditEvidenceGallery} from './AuditEvidenceGallery.js';
import {AuditReportHeading} from './AuditReportHeading.js';

export function AuditReportConsistency({report,sources,imageUrl}:{report:AuditRunReport;
  sources:readonly {key:string;label:string;value:number}[];imageUrl(item:AuditReportImage):string}) {
  const analyses=report.consistency_analyses||[];
  const conflicts=report.statistics?.upstream_issue_types||{};
  const program=report.statistics?.program_issue_types;
  const kinds=report.dataset_profile?auditIssueTypesByFormat[report.dataset_profile.dataset_format]:Object.keys(conflicts) as (keyof typeof auditIssueLabels)[];
  const maximum=Math.max(1,...kinds.flatMap(kind=>[program?.[kind]||0,conflicts[kind]?.image_count||0]));
  const definitions=[{key:'scope',title:'对照图与比较结果',items:Object.entries(auditConsistencyLabels).map(([key,title])=>({key,title,
    description:key==='MODEL_REVIEWED:EQUIVALENT'&&report.dataset_profile?.dataset_format==='folder_classification'
      ?'已有内容相同的对照图，双方的整图标签相同。':auditConsistencyDescriptions[key as keyof typeof auditConsistencyDescriptions]}))},
    {key:'conflict',title:'标注冲突类别',items:kinds.map(key=>({key,title:auditIssueLabels[key],description:auditIssueDescriptions[key]}))}];
  const scopes=['NO_CANDIDATES','NO_ELIGIBLE_CANDIDATES','MODEL_REVIEWED:EQUIVALENT',
    ...sources.filter(item=>['MODEL_REVIEWED:MATERIAL','MODEL_REVIEWED:UNCERTAIN'].includes(item.key)&&item.value>0).map(item=>item.key)];
  return <AuditReportSection section="consistency">
    <p>{report.consistency_analysis}</p>
    <AuditReportHeading level={3} number={auditReportSections.consistency.prefix+'1'}>各类结果是什么意思</AuditReportHeading>
    <p>主图是当前被检查的图，对照图是拿来与它比较的另一张图。下面的差异都按主图相对对照图来描述。</p>
    {definitions.filter(group=>group.items.length).map(group=><table className="iad-data-table iad-audit-definitions" data-consistency-definitions={group.key} key={group.key}>
      <caption>{group.title}</caption>
      <thead><tr><th scope="col">类别</th><th scope="col">含义</th></tr></thead>
      <tbody>{group.items.map(definition=><tr key={definition.key}>
        <th scope="row">{definition.title}</th><td>{definition.description}</td>
      </tr>)}</tbody>
    </table>)}
    {!!sources.length&&<><AuditReportHeading level={3} number={auditReportSections.consistency.prefix+'2'}>程序统计与模型复核统计</AuditReportHeading>
      <p>下面的统计来自本次选用的一致性检查。程序根据原始标注的匹配结果找出差异，模型再结合图像内容复核。两张分类图都按主图计数：同一张图在同一类中只算一次，不同类型可以重叠。</p>
      {!!kinds.length&&program!=null&&<AuditReportChart kind="program-conflicts" title="程序统计：标注差异分类" unit="张" maximum={maximum}
        rows={kinds.map(kind=>({label:auditIssueLabels[kind],value:program[kind]||0}))}/>}
      {!!kinds.length&&<AuditReportChart kind="model-conflicts" title="模型复核统计：标注冲突分类" unit="张" maximum={maximum}
        rows={kinds.map(kind=>({label:auditIssueLabels[kind],value:conflicts[kind]?.image_count||0}))}/>}
      <AuditReportChart kind="consistency" title="来源检查的对照图与比较结果" unit="张" rows={sources}/>
      {scopes.map((key,index)=><article className="iad-audit-discovery" data-consistency-scope={key} key={key}>
        <AuditReportHeading level={3} number={auditReportSections.consistency.prefix+(index+3)}>{auditConsistencyLabels[key as keyof typeof auditConsistencyLabels]}</AuditReportHeading>
        <p>{sources.find(item=>item.key===key)?.value||0} 张图像</p>
        {(report.consistency_scopes||[]).filter(item=>item.source_status===key).map(item=><p key={item.source_status}>{item.analysis}</p>)}
        <AuditEvidenceGallery items={report.evidence_groups['scope:'+key]||[]} imageUrl={imageUrl} heading={{level:4,number:auditReportSections.consistency.prefix+(index+3)+'.1'}}/>
      </article>)}</>}
    {analyses.filter(item=>program?.[item.issue_type]||conflicts[item.issue_type]?.occurrences).map((item,index)=>{
      const count=conflicts[item.issue_type];
      return <article className="iad-audit-discovery" key={item.issue_type}>
        <AuditEvidenceSection content={{number:auditReportSections.consistency.prefix+(scopes.length+index+3),title:item.title||auditIssueLabels[item.issue_type],description:item.description||'',
          facts:[...(program==null?[]:[{label:'程序发现差异',text:`${program[item.issue_type]||0} 张图像`}]),
            {label:'模型复核后保留',text:`${count?.image_count||0} 张图像，${count?.occurrences||0} 项`}],
          galleries:[{title:'图像证据',images:item.related_case_ids?.length?auditCaseImages(report,item.related_case_ids):report.evidence_groups['consistency:'+item.issue_type]||[]}],analysis:[
            {title:'图像观察与对照',text:item.analysis},
            {title:'本次判断',text:item.audit_result||''} ]}} imageUrl={imageUrl}/>
      </article>;
    })}
  </AuditReportSection>;
}
