import React from 'react';
import type {AuditRunReport,AuditReportImage} from '../../shared/domain.generated.js';
import {knowledgeStatuses} from '../../shared/knowledge-presentation.js';
import {AuditEvidenceSection} from './AuditEvidenceSection.js';

export function AuditReportKnowledge({report,imageUrl}:{report:AuditRunReport;imageUrl(item:AuditReportImage):string}) {
  const entries=report.knowledge_entries||[];
  return <section className="iad-report-section"><h2>八、引用知识及审计结果</h2>
    {report.knowledge_analysis&&<p>{report.knowledge_analysis}</p>}
    {!entries.length&&<p>{Object.values(report.knowledge_titles).join('、')||'本次未选用知识条目。'}</p>}
    {entries.map(({entry,analysis},index)=>{
      const check=entry.check,counts=report.statistics?.knowledge_assessments?.[check.check_id]||{};
      const totals=([['consistent','一致'],['deviates','偏离'],['unobservable','不可观察'],['not_applicable','不适用']] as const)
        .map(([key,label])=>`${label} ${counts[key]||0} 张`).join('；');
      return <article className="iad-audit-discovery" key={check.check_id} data-audit-knowledge={check.check_id}>
        <AuditEvidenceSection content={{number:'8.'+(index+1),title:check.title,description:analysis?.description||check.criterion,
          facts:[{label:'知识状态',text:knowledgeStatuses[check.status]},{label:'逐图核对',text:totals}],
          galleries:[{title:'知识图像证据',images:report.evidence_groups['knowledge-source:'+check.check_id]||[]},
            {title:'本次审计对照图',images:report.evidence_groups['knowledge:'+check.check_id]||[]}],analysis:[
            ...(analysis?[{title:'适用情况',text:analysis.applicability},{title:'图像观察与对照',text:analysis.analysis},
              {title:'审计作用',text:analysis.audit_impact}]:[])]}} imageUrl={imageUrl}/>
      </article>;
    })}
  </section>;
}
