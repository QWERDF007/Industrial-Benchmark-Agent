import React from 'react';
import type {AnnotationDifference} from '../../shared/domain.generated.js';
import type {ImageSource} from './ImageCanvas.js';
import {AnnotatedImagePair} from './AnnotatedImagePair.js';

export function ConsistencyCanvasPair({sources,selected,synchronized=true,showDifferences=true,onExpand,anchorSide='left',labels=['查询图像','候选图像']}:{
  sources:readonly [ImageSource|null,ImageSource|null];selected?:AnnotationDifference;synchronized?:boolean;showDifferences?:boolean;
  onExpand?(image:ImageSource):void;anchorSide?:'left'|'right';labels?:[string,string];
}) {
  const region=showDifferences && selected?.region ? {id:selected.difference_id,bbox:selected.region} : undefined;
  const overlays=sources.map((source,index)=>region && source?.width && source.height ? <svg className="iad-finding-layer iad-consistency-region" viewBox={`0 0 ${source.width} ${source.height}`}>
              <rect x={region.bbox[0]} y={region.bbox[1]} width={region.bbox[2]-region.bbox[0]} height={region.bbox[3]-region.bbox[1]} strokeDasharray={selected?.reference_from_other===(index ? anchorSide==='left' ? 'right':'left' : anchorSide) ? '6 4' : undefined} />
            </svg> : undefined) as [React.ReactNode,React.ReactNode];
  return <AnnotatedImagePair sources={sources} labels={labels} synchronized={synchronized} focusRegion={region}
    overlays={overlays} onExpand={onExpand} />;
}
