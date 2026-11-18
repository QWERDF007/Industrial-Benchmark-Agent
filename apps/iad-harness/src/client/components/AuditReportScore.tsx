import React,{useId,useState} from 'react';
import type {AuditReportImage,AuditRunReport,QualityScore} from '../../shared/domain.generated.js';
import {Chart,type ChartPanel} from './charts/Chart.js';
import type {ChartSpec} from './charts/types.js';
import {chartNumber} from './charts/options.js';
import {AuditReportSection} from './AuditReportSection.js';
import {AuditReportHeading} from './AuditReportHeading.js';
import {AuditEvidenceGallery} from './AuditEvidenceGallery.js';
import {AuditEvidenceSection} from './AuditEvidenceSection.js';
import {auditScoreItemDetails} from '../audit-score-item.js';
import {useAuditReportSections} from '../audit-report.js';
import {MultiSelect} from './Select.js';

function scoreDonut(score:QualityScore):ChartSpec {
  const contributions=Object.entries(score.dimensions).map(([id,dimension])=>{
    const weight=score.weights[id],value=dimension.score===null?null:dimension.score*weight;
    return {id,label:dimension.label,value,details:dimension.label+'：'+(dimension.score===null
      ?`证据不足（系数 ${chartNumber(weight,'decimal')}）`
      :`${chartNumber(dimension.score,'score')} × ${chartNumber(weight,'decimal')} = ${chartNumber(value,'score')} 分`)};
  });
  return {type:'donut',unit:'分',format:'score',center:{label:'综合得分',value:score.total},rows:score.total===null?[]:[
    ...contributions.flatMap(row=>row.value===null?[]:[{...row,value:row.value}]),
    {id:'unearned',label:'未得分',value:100-score.total,tone:'muted'},
  ]};
}

export function AuditScoreSummary({score,panels,controls}:{score:QualityScore|null;
  panels?:readonly ChartPanel[];controls?:React.ReactNode}) {
  return <div className="iad-score-summary">
    <Chart id="quality-score-summary" title="综合得分" controls={controls} spec={score?scoreDonut(score):null} panels={panels}/>
    {!!score?.limitations.length&&<p>{score.limitations.join('；')}</p>}
  </div>;
}

function useScoreScope(overall:QualityScore,names:AuditRunReport['dataset_names']) {
  const id=useId();
  const options=overall.dataset_scores.flatMap(item=>item.dataset_id?[{value:item.dataset_id,label:names[item.dataset_id]??item.dataset_id}]:[]);
  const [selected,setSelected]=useState(()=>options.map(item=>item.value));
  const scores=selected.length===options.length?[{label:'',score:overall}]:overall.dataset_scores
    .filter(item=>item.dataset_id&&selected.includes(item.dataset_id)).map(score=>({label:names[score.dataset_id!]??score.dataset_id!,score}));
  const controls=<MultiSelect id={id} label="子数据集" options={options} selected={selected}
    onToggle={value=>setSelected(current=>current.includes(value)?current.filter(id=>id!==value):[...current,value])}/>;
  return {scores,controls};
}

export function AuditReportScore({report,imageUrl}:{report:AuditRunReport;imageUrl(item:AuditReportImage):string}) {
  const sections=useAuditReportSections(),overall=report.quality_score;
  const heading=sections.score;
  if(!overall||!heading)return null;
  return <AuditReportSection section="score">
    <ScoreSummaryScope report={report} overall={overall}/>
    {[...new Set(overall.items.map(item=>item.direction))].map((direction,index)=><ScoreDirection key={direction}
      report={report} overall={overall} direction={direction} number={heading.prefix+(index+1)} imageUrl={imageUrl}/>)}
  </AuditReportSection>;
}

function ScoreSummaryScope({report,overall}:{report:AuditRunReport;overall:QualityScore}) {
  const {scores,controls}=useScoreScope(overall,report.dataset_names);
  const score=scores.length===1?scores[0].score:null;
  return <>
    <AuditScoreSummary score={score} controls={controls} panels={scores.length>1?scores.map(({label,score})=>({label,spec:scoreDonut(score)})):undefined}/>
    {score&&<p>评分覆盖 {score.completed_images} / {score.total_images} 张{report.audit_scope!=='consistency'&&<>，场景归类 {score.observed_images} 张</>}。
      综合得分系数：{Object.entries(score.weights).map(([key,weight])=>`${score.dimensions[key].label} ${chartNumber(weight,'percent')}`).join('，')}。</p>}
  </>;
}

function ScoreDirection({report,overall,direction,number,imageUrl}:{report:AuditRunReport;overall:QualityScore;
  direction:string;number:string;imageUrl(item:AuditReportImage):string}) {
  const {scores,controls}=useScoreScope(overall,report.dataset_names);
  const views=scores.map(({label,score})=>{
    const items=score.items.filter(item=>item.direction===direction);
    const spec:ChartSpec={type:'bar',format:'score',series:[{label:'扣分',unit:'分',tone:'warning'}],rows:items.map(item=>{
      const row={id:item.code,label:item.label,values:[item.deduction]};
      if(item.dimension==='consistency')return {...row,tooltip:[item.label,
        `扣分：${chartNumber(item.deduction,'score')}/100`,`数量：${item.count}/${item.denominator}`,
        `百分比：${chartNumber(item.ratio,'percent')}`].join('\n')};
      const details=auditScoreItemDetails(item,score.items);
      return {...row,details:[details.scenarioTitle,details.analysis,
        `扣分上限 ${chartNumber(item.maximum,'score')} 分`].filter(Boolean).join('\n')};
    })};
    return {label,score,items,spec};
  });
  const details=views.flatMap(view=>view.items.filter(item=>item.dimension!=='consistency'&&(item.dimension!=='diversity'||item.deduction!==0||item.suppressed_by))
    .map(item=>({item,view})));
  return <section>
    <AuditReportHeading level={3} number={number}>{direction}</AuditReportHeading>
    {views.some(view=>view.items.some(item=>item.dimension!=='consistency'))&&<p>{details.length?'下图展示各评分项的扣分，具体统计与说明见下方分项。':'本组未发现需要扣分的覆盖问题。'}</p>}
    <Chart id={`score-${direction}`} title={`${direction}扣分`} controls={controls}
      spec={views.length===1?views[0].spec:null} panels={views.length>1?views:undefined}/>
    {views.map(({label,score,items})=>{
      const dimension=items.length?score.dimensions[items[0].dimension]:null;
      return dimension&&score.items.findIndex(item=>item.dimension===items[0].dimension)===score.items.indexOf(items[0])
        ?<p key={score.dataset_id??''}>{views.length>1?label+'，':''}{dimension.label}得分 {dimension.score===null?'证据不足':chartNumber(dimension.score,'score')+' 分'}。</p>:null;
    })}
    {details.map(({item,view},itemIndex)=>{
      const details=auditScoreItemDetails(item,view.score.items),itemNumber=number+'.'+(itemIndex+1);
      const images=report.evidence_groups['score:'+(view.score.dataset_id?view.score.dataset_id+':':'')+item.code]??[];
      return <article className="iad-audit-discovery" data-score-rule={item.code} key={`${view.score.dataset_id}:${item.code}`}>
        <AuditReportHeading level={4} number={itemNumber}>{views.length>1?view.label+' / ':''}{item.label}</AuditReportHeading>
        <p>{details.description}</p>
        {details.scenarioTitle?<AuditEvidenceSection level={5} content={{number:itemNumber+'.1',title:details.scenarioTitle,
          description:details.analysis,galleries:[{title:'图像证据',images}],analysis:[]}} imageUrl={imageUrl}/>
          :<><p>{details.analysis}</p><AuditEvidenceGallery items={images} imageUrl={imageUrl}
            heading={{level:5,number:itemNumber+'.1'}}/></>}
      </article>;
    })}
  </section>;
}
