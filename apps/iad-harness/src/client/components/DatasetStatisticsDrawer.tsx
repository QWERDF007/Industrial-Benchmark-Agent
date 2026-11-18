import React from 'react';
import type {DistributionHeatmap} from '../../shared/domain.generated.js';
import {useResource} from '../useResource.js';
import {Chart} from './charts/Chart.js';
import {imageDimensionsChart} from './charts/image-dimensions.js';
import {StatisticsDrawer} from './StatisticsDrawer.js';

export interface DatasetStatisticsTarget {kind:'group'|'dataset';id:string;name:string}

export function DatasetStatisticsDrawer({target,onClose}:{target:DatasetStatisticsTarget;onClose():void}) {
  const {data,loading,error}=useResource<DistributionHeatmap>(`/datasets/${target.kind==='group'?'groups/':''}${encodeURIComponent(target.id)}/image-dimensions`);
  return <StatisticsDrawer title={`${target.name} 统计`} loading={loading} error={error} onClose={onClose}
    className="iad-dataset-statistics-drawer">
    {!!data?.cells.length&&<Chart id="image-dimensions" title="图像宽高分布" spec={imageDimensionsChart(data)}/>}
  </StatisticsDrawer>;
}
