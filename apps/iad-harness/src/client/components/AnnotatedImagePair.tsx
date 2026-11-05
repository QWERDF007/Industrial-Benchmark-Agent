import React, {useLayoutEffect, useState} from 'react';
import type {InspectionTransform} from '../inspection.js';
import {ImageCanvas, type ImageSource} from './ImageCanvas.js';

export function AnnotatedImagePair({sources, labels, synchronized=false, focusRegion, overlays, onExpand}: {
  sources: readonly [ImageSource | null, ImageSource | null]; labels: [string, string]; synchronized?: boolean;
  focusRegion?: {id: string; bbox: number[]}; overlays?: [React.ReactNode, React.ReactNode];
  onExpand?(image: ImageSource): void;
}) {
  const [transform, setTransform] = useState<InspectionTransform>({zoom: 0, x: 0, y: 0});
  const [rightTransform, setRightTransform] = useState<InspectionTransform>({zoom: 0, x: 0, y: 0});
  useLayoutEffect(() => {if (!synchronized) setRightTransform(transform);}, [synchronized]);
  return <div className="iad-image-pair">{sources.map((source, index) => <div key={index} className="iad-image-pair-side">
    <p>{labels[index]}</p>
    {source ? <ImageCanvas image={source}
      control={index === 0 || synchronized ? {transform, onChange: setTransform} : {transform: rightTransform, onChange: setRightTransform}}
      onExpand={onExpand ? view => onExpand({...source, initialSelection: view.selection, initialTransform: view.transform}) : undefined}
      focusRegion={focusRegion} overlay={overlays?.[index]} /> : <p className="iad-empty">暂无对照图像。</p>}
  </div>)}</div>;
}
