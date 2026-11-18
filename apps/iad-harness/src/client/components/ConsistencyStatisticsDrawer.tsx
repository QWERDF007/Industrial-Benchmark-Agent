import React from 'react';
import type {GalleryStatistics} from '../../shared/domain.generated.js';
import {conflictCategories,conflictCategoryLabels,modelConclusionLabels} from '../../shared/consistency.parameters.generated.js';
import {StatisticsDrawer} from './StatisticsDrawer.js';
import {Chart} from './charts/Chart.js';

export function ConsistencyStatisticsDrawer({statistics,onClose,loading=false,error}:{statistics?:GalleryStatistics;
  onClose():void;loading?:boolean;error?:string}) {
  const original=conflictCategories.map(name=>({id:name,label:conflictCategoryLabels[name as keyof typeof conflictCategoryLabels]||name,
    values:[statistics?.original_categories[name]??0]}));
  const model=Object.entries(modelConclusionLabels).map(([name,label])=>({id:name,label,values:[statistics?.model_categories[name]??0]}));
  const agreement=statistics?[
    {id:'same',label:'一致',values:[statistics.agreement.same]},
    {id:'different',label:'不一致',values:[statistics.agreement.different]},
  ]:[];
  const maximum=Math.max(1,...[...original,...model,...agreement].map(row=>row.values[0]));
  return <StatisticsDrawer title="标注冲突统计" loading={loading} error={error} onClose={onClose}>
    {statistics&&<>
        <Chart id="stat-category" title="程序判断" spec={{type:'bar',rows:original,series:[{label:'图组',unit:'组'}],maximum,legendSelectable:false,labelRotation:45}}/>
        <Chart id="stat-model" title="模型判断" spec={{type:'bar',rows:model,series:[{label:'图组',unit:'组'}],maximum,legendSelectable:false,labelRotation:45}}/>
        <Chart id="stat-agreement" title="结论一致性" description={statistics.unjudged?`另有 ${statistics.unjudged} 组尚无可比较的模型结论。`:undefined}
          spec={{type:'bar',rows:agreement,series:[{label:'图组',unit:'组'}],maximum,legendSelectable:false,labelRotation:45}}/>
    </>}
  </StatisticsDrawer>;
}
