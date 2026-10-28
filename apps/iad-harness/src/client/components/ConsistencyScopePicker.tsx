import React from 'react';
import type {Dataset} from '../../shared/contracts.js';
import type {ConsistencyLocation} from '../../shared/navigation.js';

type CorpusScope=NonNullable<ConsistencyLocation['scope']>;

export function ConsistencyScopePicker({datasets,value,onChange}:{datasets:Dataset[];value:CorpusScope;onChange(value:CorpusScope):void}) {
  return <>
    <label className="iad-filter">检索范围<select aria-label="检索范围" value={value.kind==='all_registered' ? 'all' : 'selected'} onChange={event=>onChange(event.target.value==='all' ? {kind:'all_registered'} : {kind:'datasets',dataset_ids:[datasets[0].dataset_id]})}>
      <option value="all">全部已注册数据集</option><option value="selected" disabled={!datasets.length}>指定数据集</option></select></label>
    {value.kind==='datasets' && <details className="iad-consistency-scope"><summary>已选 {value.dataset_ids.length} 个数据集</summary>{datasets.map(row=><label key={row.dataset_id}>
      <input type="checkbox" checked={value.dataset_ids.includes(row.dataset_id)} disabled={value.dataset_ids.length===1 && value.dataset_ids.includes(row.dataset_id)} onChange={event=>{
        const ids=event.target.checked ? [...value.dataset_ids,row.dataset_id] : value.dataset_ids.filter(id=>id!==row.dataset_id);
        if(ids.length)onChange({kind:'datasets',dataset_ids:[ids[0],...ids.slice(1)]});
      }} />{row.name}</label>)}</details>}
  </>;
}
