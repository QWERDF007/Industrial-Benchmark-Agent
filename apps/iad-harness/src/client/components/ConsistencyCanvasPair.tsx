import React,{useLayoutEffect,useState} from 'react';
import type {AnnotationDifference} from '../../shared/domain.generated.js';
import type {InspectionTransform} from '../inspection.js';
import {ImageCanvas,type ImageSource} from './ImageCanvas.js';

export function ConsistencyCanvasPair({sources,selected,synchronized=true,showDifferences=true,onExpand,anchorSide='left',labels=['查询图像','候选图像']}:{
  sources:readonly [ImageSource|null,ImageSource|null];selected?:AnnotationDifference;synchronized?:boolean;showDifferences?:boolean;
  onExpand?(image:ImageSource):void;anchorSide?:'left'|'right';labels?:[string,string];
}) {
  const [transform,setTransform]=useState<InspectionTransform>({zoom:0,x:0,y:0});
  const [rightTransform,setRightTransform]=useState<InspectionTransform>({zoom:0,x:0,y:0});
  useLayoutEffect(()=>{if(!synchronized)setRightTransform(transform);},[synchronized]);
  const region=showDifferences && selected?.region ? {id:selected.difference_id,bbox:selected.region} : undefined;
  return (
      <div className="iad-consistency-canvases">
        {sources.map((source,index)=><div key={index} className="iad-consistency-side"><p>{labels[index]}</p>
          {source ? <ImageCanvas image={source} embedded control={index===0 || synchronized ? {transform,onChange:setTransform} : {transform:rightTransform,onChange:setRightTransform}} onExpand={onExpand ? view=>onExpand({...source,initialSelection:view.selection,initialTransform:view.transform}) : undefined} focusRegion={region}
            overlay={region && source.width && source.height ? <svg className="iad-finding-layer iad-consistency-region" viewBox={`0 0 ${source.width} ${source.height}`}>
              <rect x={region.bbox[0]} y={region.bbox[1]} width={region.bbox[2]-region.bbox[0]} height={region.bbox[3]-region.bbox[1]} strokeDasharray={selected?.reference_from_other===(index ? anchorSide==='left' ? 'right':'left' : anchorSide) ? '6 4' : undefined} />
            </svg> : undefined} /> : <p role="status" className="iad-empty">正在读取图像…</p>}</div>)}
      </div>
  );
}
