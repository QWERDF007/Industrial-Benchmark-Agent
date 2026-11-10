import React from 'react';
import {conflictCategoryLabels} from '../../shared/consistency.parameters.generated.js';
import type {ConsistencyComparisonItem} from '../consistency-view.js';
import {ThumbnailCard} from './ThumbnailCard.js';

export function ConsistencyResultCard({item,action,onOpen}:{
  item:ConsistencyComparisonItem;action:'open-conflict'|'job-image';onOpen():void;
}) {
  const [program,model]=[item.type,item.model.modelType].map(value=>
    value in conflictCategoryLabels?conflictCategoryLabels[value as keyof typeof conflictCategoryLabels]:value);
  return <ThumbnailCard src={item.url} variant="comparison" label={item.filename} data-dc={action} data-id={item.id}
    aria-label={`${item.filename}，程序结论：${program}；模型结论：${model}`} onClick={onOpen}>
    <span className="iad-thumbnail-values" aria-label="程序结论与模型结论">
      <span title={`程序结论：${program}`}>{program}</span><span title={`模型结论：${model}`}>{model}</span>
    </span>
  </ThumbnailCard>;
}
