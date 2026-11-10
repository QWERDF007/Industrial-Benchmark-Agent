import React from 'react';
import {initialConsistencyFilters,type ConsistencyFilterValues} from '../consistency-view.js';
import {ClearFilterButton} from './CommonFilterControls.js';
import {Select} from './Select.js';

export function ConsistencyFilters({value,modelTypes,onChange}:{
  value:ConsistencyFilterValues;modelTypes:ReadonlyArray<{value:string;label:string}>;
  onChange(value:ConsistencyFilterValues):void;
}) {
  return <div className="dc-refined-filterbar" role="group" aria-label="图像筛选">
    <label className="dc-filter-field dc-search-field">
      文件名搜索
      <input type="search" id="dc-filename-search" aria-label="文件名搜索" placeholder="搜索文件名" autoComplete="off"
        value={value.search} onChange={event=>onChange({...value,search:event.target.value})}/>
    </label>
    <label className="dc-filter-field">
      模型判断
      <Select id="dc-model-filter" aria-label="模型判断" value={value.model}
        onChange={event=>onChange({...value,model:event.target.value as ConsistencyFilterValues['model']})}>
        <option value="all">全部判断</option>
        {modelTypes.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
    </label>
    <label className="dc-filter-field">
      结论一致性
      <Select id="dc-agreement" aria-label="原结论与模型判定一致性" value={value.agreement}
        onChange={event=>onChange({...value,agreement:event.target.value as ConsistencyFilterValues['agreement']})}>
        <option value="all">全部</option><option value="same">一致</option><option value="different">不一致</option>
      </Select>
    </label>
    <label className="dc-filter-field dc-review-field">
      人工复核
      <Select id="dc-review-filter" aria-label="人工复核" value={value.review}
        onChange={event=>onChange({...value,review:event.target.value as ConsistencyFilterValues['review']})}>
        <option value="all">全部状态</option><option value="pending">待复核</option>
        <option value="confirmed">确认冲突</option><option value="rejected">排除冲突</option>
      </Select>
    </label>
    <ClearFilterButton data-dc="clear-conflict-filters" ariaLabel="清除筛选条件" title="清除筛选条件"
      disabled={!value.search&&value.model==='all'&&value.agreement==='all'&&value.review==='all'}
      onClick={()=>onChange(initialConsistencyFilters)}/>
  </div>;
}
