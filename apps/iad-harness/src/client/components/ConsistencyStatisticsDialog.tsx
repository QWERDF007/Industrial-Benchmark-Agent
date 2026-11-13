import React from 'react';
import type {GalleryStatistics} from '../../shared/domain.generated.js';
import {conflictCategories,conflictCategoryLabels,modelConclusionLabels} from '../../shared/consistency.parameters.generated.js';
import {Modal} from './Modal.js';
import {Chart} from './charts/Chart.js';
import type {ChartDatum} from './charts/types.js';
import {Select} from './Select.js';

export type ConsistencyStatisticAction='stat-category'|'stat-model'|'stat-agreement';

export function ConsistencyStatisticsDialog({statistics,onFilter,onClose,loading=false,error}:{statistics?:GalleryStatistics;
  onFilter?(action:ConsistencyStatisticAction,id:string):void;onClose():void;loading?:boolean;error?:string}) {
  const original=conflictCategories.filter(name=>statistics?.original_categories[name]!==undefined)
    .map(name=>({id:name,label:conflictCategoryLabels[name as keyof typeof conflictCategoryLabels]||name,values:[statistics!.original_categories[name]]}));
  const model=Object.entries(statistics?.model_categories||{}).map(([name,count])=>({id:name,
    label:modelConclusionLabels[name as keyof typeof modelConclusionLabels]||name,values:[count]}));
  const maximum=Math.max(1,...original.map(row=>row.values[0]),...model.map(row=>row.values[0]));
  const agreement:ChartDatum[]=statistics?[
    {id:'same',label:'一致',value:statistics.agreement.same,tone:'success'},
    {id:'different',label:'不一致',value:statistics.agreement.different,tone:'warning'},
  ]:[];
  const choices=[
    ...original.map(row=>({action:'stat-category' as const,id:row.id,label:`差异类型：${row.label}（${row.values[0].toLocaleString('zh-CN')} 组）`})),
    ...model.map(row=>({action:'stat-model' as const,id:row.id,label:`模型判断：${row.label}（${row.values[0].toLocaleString('zh-CN')} 组）`})),
    ...agreement.map(row=>({action:'stat-agreement' as const,id:row.id,label:`结论一致性：${row.label}（${row.value.toLocaleString('zh-CN')} 组）`})),
  ];
  return <Modal title="标注冲突统计" size="form" className="dc-stats-dialog" onClose={onClose}>
    <div className="dc-stats-content">{error?<p role="alert">{error}</p>:loading?<p role="status">正在读取统计…</p>:statistics?<>
      {onFilter&&<label className="dc-stats-filter">按统计结果筛选<Select aria-label="按统计结果筛选" value="" onChange={event=>{
        const choice=choices[Number(event.target.value)];onFilter(choice.action,choice.id);
      }}><option value="" disabled>选择筛选条件</option>{choices.map((choice,index)=><option key={`${choice.action}:${choice.id}`} value={index}>{choice.label}</option>)}</Select></label>}
      <div className="dc-stats-charts">
      <Chart id="stat-category" title="差异类型" spec={{type:'bar',rows:original,series:[{label:'图组',unit:'组'}],maximum}}
        onSelect={onFilter?id=>onFilter('stat-category',id):undefined}/>
      <Chart id="stat-model" title="模型判断" spec={{type:'bar',rows:model,series:[{label:'图组',unit:'组'}],maximum}}
        onSelect={onFilter?id=>onFilter('stat-model',id):undefined}/>
      <Chart id="stat-agreement" title="结论一致性" description={statistics.unjudged?`另有 ${statistics.unjudged} 组尚无可比较的模型结论。`:undefined}
        spec={{type:'donut',unit:'组',rows:agreement}}
        onSelect={onFilter?id=>onFilter('stat-agreement',id):undefined}/>
    </div></>:<p role="status">暂无统计数据。</p>}</div>
  </Modal>;
}
