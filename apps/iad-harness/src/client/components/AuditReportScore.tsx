import React,{useState} from 'react';
import type {AuditReportImage,AuditRunReport,QualityScore} from '../../shared/domain.generated.js';
import {Chart} from './charts/Chart.js';
import {chartNumber} from './charts/options.js';
import {AuditReportSection} from './AuditReportSection.js';
import {AuditReportHeading} from './AuditReportHeading.js';
import {AuditEvidenceGallery} from './AuditEvidenceGallery.js';
import {useAuditReportSections} from '../audit-report.js';

export function AuditScoreSummary({score}:{score:QualityScore}) {
  return <>
    <p><strong>综合得分 {score.total===null?'证据不足':chartNumber(score.total,'score')+' 分'}</strong></p>
    <Chart id="quality-score-summary" title="数据集质量得分" spec={{type:'bar',maximum:100,format:'score',
      series:[{label:'得分',unit:'分'}],rows:[{id:'total',label:'综合得分',values:[score.total]},
        ...Object.entries(score.dimensions).map(([id,dimension])=>({id,label:dimension.label,values:[dimension.score]}))]}}/>
    {!!score.limitations.length&&<p>{score.limitations.join('；')}</p>}
  </>;
}

export function AuditReportScore({report,imageUrl}:{report:AuditRunReport;imageUrl(item:AuditReportImage):string}) {
  const [dataset,setDataset]=useState('');
  const sections=useAuditReportSections(),overall=report.quality_score;
  const heading=sections.score;
  if(!overall||!heading)return null;
  const score=overall.dataset_scores.find(item=>item.dataset_id===dataset)??overall;
  const directions=[...new Set(score.items.map(item=>item.direction))];
  return <AuditReportSection section="score">
    {overall.dataset_scores.length>1&&<label>评分范围 <select aria-label="评分范围" value={dataset} onChange={event=>setDataset(event.target.value)}>
      <option value="">整体</option>{overall.dataset_scores.map(item=><option key={item.dataset_id} value={item.dataset_id??''}>{report.dataset_names[item.dataset_id??'']??item.dataset_id}</option>)}
    </select></label>}
    {dataset&&<AuditScoreSummary score={score}/>}
    <p>评分覆盖 {score.completed_images} / {score.total_images} 张，场景归类 {score.observed_images} 张。
      综合得分系数：{Object.entries(score.weights).map(([key,weight])=>`${score.dimensions[key].label} ${chartNumber(weight,'percent')}`).join('，')}。</p>
    {directions.map((direction,index)=>{
      const items=score.items.filter(item=>item.direction===direction);
      const dimension=score.dimensions[items[0].dimension];
      return <section key={direction}>
        <AuditReportHeading level={3} number={heading.prefix+(index+1)}>{direction}</AuditReportHeading>
        <Chart id={`score-${index}`} title={`${direction}扣分`} spec={{type:'bar',format:'score',
          series:[{label:'扣分',unit:'分',tone:'warning'}],rows:items.map(item=>({id:item.code,
            label:`${item.dimension==='consistency'?'':item.code+' '}${item.label}`,values:[item.deduction],details:[
              item.scenario,`${item.count} / ${item.denominator}，占比 ${item.ratio===null?'不适用':chartNumber(item.ratio,'percent')}`,
              `扣分上限 ${chartNumber(item.maximum,'score')} 分`,
              item.deduction===null?'证据不足':item.suppressed_by?`同一原因已计入 ${item.suppressed_by}`:
                item.count===0?'未出现，不扣分':'',
            ].filter(Boolean).join('\n')}))}}/>
        {score.items.findIndex(item=>item.dimension===items[0].dimension)===score.items.indexOf(items[0])
          ?<p>{dimension.label}得分 {dimension.score===null?'证据不足':chartNumber(dimension.score,'score')+' 分'}。</p>:null}
        {items.filter(item=>(item.deduction??0)>0).map(item=><AuditEvidenceGallery key={item.code}
          items={report.evidence_groups['score:'+(score.dataset_id?score.dataset_id+':':'')+item.code]??[]} imageUrl={imageUrl}
          title={`${item.dimension==='consistency'?'':item.code+' '}${item.scenario||item.label}`}/>) }
      </section>;
    })}
  </AuditReportSection>;
}
