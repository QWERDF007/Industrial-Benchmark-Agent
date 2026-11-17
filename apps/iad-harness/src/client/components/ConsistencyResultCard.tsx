import React from 'react';
import {modelConclusionLabels} from '../../shared/consistency.parameters.generated.js';
import type {ConsistencyComparisonItem} from '../consistency-view.js';
import {ThumbnailCard} from './ThumbnailCard.js';

export function ConsistencyResultCard({item,action,onOpen}:{
  item:ConsistencyComparisonItem;action:'open-conflict'|'job-image';onOpen():void;
}) {
  const program=item.model.identityConclusion?'':item.type;
  const model=item.model.modelType?modelConclusionLabels[item.model.modelType]:item.model.identityConclusion||'';
  return <ThumbnailCard src={item.url} imageLoading="eager" variant="comparison" label={item.filename} data-dc={action} data-id={item.id}
    aria-label={`${item.filename}${program?'，程序结论：'+program:''}${model?'；模型结论：'+model:''}`} onClick={onOpen}>
    <span className="iad-thumbnail-values" aria-label="程序结论与模型结论">
      <span title={program?`程序结论：${program}`:undefined}>{program}</span><span title={`模型结论：${model}`}>{model}</span>
    </span>
  </ThumbnailCard>;
}
