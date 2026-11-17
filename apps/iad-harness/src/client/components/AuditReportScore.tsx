import React,{useState} from 'react';
import type {AuditReportImage,AuditRunReport,QualityScore} from '../../shared/domain.generated.js';
import {Chart} from './charts/Chart.js';
import {chartNumber} from './charts/options.js';
import {AuditReportSection} from './AuditReportSection.js';
import {AuditReportHeading} from './AuditReportHeading.js';
import {AuditEvidenceGallery} from './AuditEvidenceGallery.js';
import {AuditEvidenceSection} from './AuditEvidenceSection.js';
import {auditScoreItemDetails} from '../audit-score-item.js';
import {useAuditReportSections} from '../audit-report.js';

export function AuditScoreSummary({score}:{score:QualityScore}) {
  const contributions=Object.entries(score.dimensions).map(([id,dimension])=>{
    const weight=score.weights[id],value=dimension.score===null?null:dimension.score*weight;
    return {id,label:dimension.label,value,details:dimension.label+'：'+(dimension.score===null
      ?`证据不足（系数 ${chartNumber(weight,'decimal')}）`
      :`${chartNumber(dimension.score,'score')} × ${chartNumber(weight,'decimal')} = ${chartNumber(value,'score')} 分`)};
  });
  return <div className="iad-score-summary">
    <Chart id="quality-score-summary" title="综合得分" spec={{type:'donut',unit:'分',format:'score',
      center:{label:'综合得分',value:score.total},rows:score.total===null?[]:[
        ...contributions.flatMap(row=>row.value===null?[]:[{...row,value:row.value}]),
        {id:'unearned',label:'未得分',value:100-score.total,tone:'muted'},
      ]}}/>
    {!!score.limitations.length&&<p>{score.limitations.join('；')}</p>}
  </div>;
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
      const detailItems=items.filter(item=>item.dimension!=='diversity'||item.deduction!==0||item.suppressed_by);
      return <section key={direction}>
        <AuditReportHeading level={3} number={heading.prefix+(index+1)}>{direction}</AuditReportHeading>
        <p>{detailItems.length?'下图展示各评分项的扣分；具体场景、分析与图像证据见下方分项。':'本组未发现需要扣分的覆盖问题。'}</p>
        <Chart id={`score-${index}`} title={`${direction}扣分`} spec={{type:'bar',format:'score',
          series:[{label:'扣分',unit:'分',tone:'warning'}],rows:items.map(item=>{
            const details=auditScoreItemDetails(item,score.items);
            return {id:item.code,label:item.label,values:[item.deduction],details:[details.scenarioTitle,details.analysis,
              `扣分上限 ${chartNumber(item.maximum,'score')} 分`].filter(Boolean).join('\n')};
          })}}/>
        {score.items.findIndex(item=>item.dimension===items[0].dimension)===score.items.indexOf(items[0])
          ?<p>{dimension.label}得分 {dimension.score===null?'证据不足':chartNumber(dimension.score,'score')+' 分'}。</p>:null}
        {detailItems.map((item,itemIndex)=>{
          const details=auditScoreItemDetails(item,score.items),number=heading.prefix+(index+1)+'.'+(itemIndex+1);
          const images=report.evidence_groups['score:'+(score.dataset_id?score.dataset_id+':':'')+item.code]??[];
          return <article className="iad-audit-discovery" data-score-rule={item.code} key={item.code}>
            <AuditReportHeading level={4} number={number}>{item.label}</AuditReportHeading>
            <p>{details.description}</p>
            {details.scenarioTitle?<AuditEvidenceSection level={5} content={{number:number+'.1',title:details.scenarioTitle,
              description:details.analysis,galleries:[{title:'图像证据',images}],analysis:[]}} imageUrl={imageUrl}/>
              :<><p>{details.analysis}</p><AuditEvidenceGallery items={images} imageUrl={imageUrl}
                heading={{level:5,number:number+'.1'}}/></>}
          </article>;
        })}

      </section>;
    })}
  </AuditReportSection>;
}
