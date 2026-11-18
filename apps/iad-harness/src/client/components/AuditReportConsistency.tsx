import React from 'react';
import {useAuditReportSections} from '../audit-report.js';
import {AuditReportSection} from './AuditReportSection.js';
import type {AuditRunReport,AuditReportImage} from '../../shared/domain.generated.js';
import {auditConsistencyLabels,auditConsistencyDescriptions,auditIssueLabels,auditIssueDescriptions,auditIssueTypesByFormat} from '../../shared/audit.generated.js';
import {AuditEvidenceSection} from './AuditEvidenceSection.js';
import {AuditReportChart} from './AuditReportChart.js';
import {auditCaseImages} from './AuditReportCases.js';
import {AuditReportHeading} from './AuditReportHeading.js';

export function AuditReportConsistency({report,sources,imageUrl}:{report:AuditRunReport;
  sources:readonly {key:string;label:string;value:number}[];imageUrl(item:AuditReportImage):string}) {
  const auditReportSections=useAuditReportSections();
  const analyses=report.consistency_analyses||[];
  const conflicts=report.statistics?.upstream_issue_types||{};
  const program=report.statistics?.program_issue_types;
  const kinds=report.dataset_profile?auditIssueTypesByFormat[report.dataset_profile.dataset_format]:Object.keys(conflicts) as (keyof typeof auditIssueLabels)[];
  const maximum=Math.max(1,...kinds.flatMap(kind=>[program?.[kind]||0,conflicts[kind]?.image_count||0]));
  const definitions=[{key:'scope',title:'一致性检查结果说明',items:Object.entries(auditConsistencyLabels).map(([key,title])=>({key,title,
    description:key==='MODEL_REVIEWED:EQUIVALENT'&&report.dataset_profile?.dataset_format==='folder_classification'
      ?'已有内容相同的对照图，双方的整图标签相同。':auditConsistencyDescriptions[key as keyof typeof auditConsistencyDescriptions]}))},
    {key:'conflict',title:'标注冲突类型说明',items:kinds.map(key=>({key,title:auditIssueLabels[key],description:auditIssueDescriptions[key]}))}];
  return <AuditReportSection section="consistency">
    <p>{report.consistency_analysis}</p>
    <AuditReportHeading level={3} number={auditReportSections.consistency.prefix+'1'}>检查结果与冲突类型说明</AuditReportHeading>
    <p>主图是当前被检查的图，对照图是拿来与它比较的另一张图。下面的差异都按主图相对对照图来描述。</p>
    {definitions.filter(group=>group.items.length).map(group=><table className="iad-data-table iad-audit-definitions" data-consistency-definitions={group.key} key={group.key}>
      <caption>{group.title}</caption>
      <thead><tr><th scope="col">类别</th><th scope="col">含义</th></tr></thead>
      <tbody>{group.items.map(definition=><tr key={definition.key}>
        <th scope="row">{definition.title}</th><td>{definition.description}</td>
      </tr>)}</tbody>
    </table>)}
    {!!sources.length&&<><AuditReportHeading level={3} number={auditReportSections.consistency.prefix+'2'}>标注一致性</AuditReportHeading>
      <p>下面的统计来自本次选用的一致性检查。程序根据原始标注的匹配结果找出差异，模型再结合图像内容复核。两张分类图都按主图计数：同一张图在同一类中只算一次，不同类型可以重叠。</p>
      {!!kinds.length&&program!=null&&<AuditReportChart kind="program-conflicts" title="程序判定的标注差异统计" unit="张" maximum={maximum}
        rows={kinds.map(kind=>({label:auditIssueLabels[kind],value:program[kind]||0}))}/>}
      {!!kinds.length&&<AuditReportChart kind="model-conflicts" title="标注冲突统计" unit="张" maximum={maximum}
        rows={kinds.map(kind=>({label:auditIssueLabels[kind],value:conflicts[kind]?.image_count||0}))}/>}
      <AuditReportChart kind="consistency" title="一致性检查结果统计" unit="张" rows={sources}/>
    </>}
    {analyses.filter(item=>program?.[item.issue_type]||conflicts[item.issue_type]?.occurrences).map((item,index)=>{
      const pairs=report.evidence_pairs?.['consistency:'+item.issue_type]??[];
      return <article className="iad-audit-discovery" key={item.issue_type}>
        <AuditEvidenceSection content={{number:auditReportSections.consistency.prefix+(index+3),title:item.title||auditIssueLabels[item.issue_type],description:[item.description,item.analysis,item.audit_result].filter(Boolean).join('\n\n'),
          galleries:pairs.length?[{title:'图像证据',pairs}]:[{title:'图像证据',images:item.related_case_ids?.length?auditCaseImages(report,item.related_case_ids):report.evidence_groups['consistency:'+item.issue_type]||[]}],
          analysis:[]}} imageUrl={imageUrl}/>
      </article>;
    })}
  </AuditReportSection>;
}
