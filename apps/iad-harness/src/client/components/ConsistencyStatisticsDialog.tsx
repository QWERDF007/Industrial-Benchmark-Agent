import React from 'react';
import type {ConflictCardItem} from '../consistency-view.js';
import {Modal} from './Modal.js';
import {conflictCategories} from '../../shared/consistency.parameters.generated.js';

export type ConsistencyStatisticAction='stat-category'|'stat-model'|'stat-agreement';
interface StatisticRow {name:string;count:number;id?:string}

function niceAxis(max:number):number {
  const target=max/4;
  const magnitude=Math.pow(10,Math.floor(Math.log10(Math.max(target,1))));
  const normalized=target/magnitude;
  const step=(normalized<=1?1:normalized<=2?2:normalized<=2.5?2.5:normalized<=5?5:10)*magnitude;
  return Math.max(step*4,Math.ceil(max/step)*step);
}

function StatisticChart({title,rows,action,axis,onFilter}:{title:string;rows:StatisticRow[];
  action:ConsistencyStatisticAction;axis:number;onFilter(action:ConsistencyStatisticAction,id:string):void}) {
  return <section className={`dc-vchart-panel ${action==='stat-agreement'?'dc-vchart-agreement':''}`} aria-label={`${title}柱状图`}>
    <h3>{title}</h3>
    <div className="dc-vchart-body">
      <div className="dc-vchart-axis" aria-hidden="true">{[axis,axis*.75,axis*.5,axis*.25,0].map((value,index)=><span key={index}>{Math.round(value)}</span>)}</div>
      <div className="dc-vchart-figure">
        <div className="dc-vchart-lines" aria-hidden="true" />
        <div className="dc-vchart-columns" style={{'--chart-cols':rows.length} as React.CSSProperties}>
          {rows.map(row=><div className="dc-vchart-column" key={row.name}>
            <div className="dc-vchart-barslot">
              <button type="button" className={`dc-vchart-bar ${row.count?'':'dc-vchart-zero'}`} style={{height:`${Math.max(.6,100*row.count/axis)}%`}}
                data-dc={action} data-id={row.id||row.name} aria-label={`${row.name} ${row.count} 组，点击查看`}
                title={`${row.name}：${row.count} 组，点击筛选`} onClick={()=>onFilter(action,row.id||row.name)}>
                <span className="dc-vchart-value">{row.count}</span>
              </button>
            </div>
            <span className="dc-vchart-label" title={row.name}>{row.name}</span>
          </div>)}
        </div>
      </div>
    </div>
  </section>;
}

export function ConsistencyStatisticsDialog({items,onFilter,onClose}:{items:ConflictCardItem[];
  onFilter(action:ConsistencyStatisticAction,id:string):void;onClose():void}) {
  const original=conflictCategories.filter(name=>items.some(item=>item.types.includes(name)))
    .map(name=>({name,count:items.filter(item=>item.types.includes(name)).length}));
  const model=[...new Set(items.map(item=>item.model.modelType))].map(name=>({name,count:items.filter(item=>item.model.modelType===name).length}));
  const agreement=[{name:'一致',id:'same',count:items.filter(item=>item.model.status==='conflict').length},
    {name:'不一致',id:'different',count:items.filter(item=>item.model.status==='no_conflict').length}];
  const distributionAxis=niceAxis(Math.max(1,...original.map(row=>row.count),...model.map(row=>row.count)));
  return <Modal title="标注冲突统计" size="form" className="dc-stats-dialog" onClose={onClose}>
    <div className="dc-stats-content"><div className="dc-stats-charts">
      <StatisticChart title="差异类型" rows={original} action="stat-category" axis={distributionAxis} onFilter={onFilter} />
      <StatisticChart title="模型判断" rows={model} action="stat-model" axis={distributionAxis} onFilter={onFilter} />
      <StatisticChart title="结论一致性" rows={agreement} action="stat-agreement" axis={niceAxis(Math.max(1,...agreement.map(row=>row.count)))} onFilter={onFilter} />
    </div></div>
  </Modal>;
}
