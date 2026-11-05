import React, {useCallback, useRef, useState} from "react";
import type {VisualEvidence} from "../../shared/domain.generated.js";
import {FullscreenViewer} from "./FullscreenViewer.js";
import {ThumbnailCard} from "./ThumbnailCard.js";
import {InspectionOverlay,InspectionPanel} from "./InspectionEvidence.js";
import {resolveInspection,type InspectionSelection,type InspectionTransform} from "../inspection.js";
import type {ImageNavigation,ImageSource} from "./ImageCanvas.js";
export {AnnotatedImage} from "./ImageCanvas.js";
export type {ImageSource,ImageNavigation} from "./ImageCanvas.js";

export interface EvidenceCollection {
  title:string;instruction:string;index:number;
  images:{image:ImageSource;label:string;id:string;group:string;originalSize:VisualEvidence["original_size"]}[];
}

export function ImageViewer({image,onClose,navigation,collection}:{
  image:ImageSource;onClose():void;navigation?:ImageNavigation;collection?:EvidenceCollection;
}) {
  const [index,setIndex]=useState(collection?.index || 0);
  const [selection,setSelection]=useState<InspectionSelection|null>(image.initialSelection || null);
  const transform=useRef<InspectionTransform>(image.initialTransform || {zoom:0,x:0,y:0});
  const remember=useCallback((value:InspectionTransform)=>{transform.current=value;},[]);
  const current=collection?.images[index]?.image || image;
  const inspection=current.inspection;
  const {finding,region}=resolveInspection(inspection?.analysis,selection);
  const context=collection ? <div><h3>{collection.title}</h3><p>{collection.instruction}</p>
    <div className="iad-thumbnail-grid">{collection.images.map((item,position)=><ThumbnailCard key={item.id}
      src={item.image.src} label={item.label} aria-current={position===index} onClick={()=>setIndex(position)} />)}</div></div>
    : inspection ? <InspectionPanel inspection={inspection} selection={selection} choices={[]} onSelect={setSelection}
      transform={()=>transform.current} /> : undefined;
  const items=collection?.images.map(item=>({id:item.id,title:item.image.title,imageUrl:item.image.src,
    width:item.image.width,height:item.image.height,annotationLayer:item.image.annotationLayer,sampleId:item.image.sampleId,evidence:item.image.evidence}));
  return <FullscreenViewer open item={{id:current.src,title:current.title,imageUrl:current.src,width:current.width,
    height:current.height,annotationLayer:current.annotationLayer,sampleId:current.sampleId,evidence:current.evidence}}
    items={items} currentIndex={index} onNavigate={collection?setIndex:undefined} navigation={navigation}
    context={context} initialTransform={current.initialTransform} onTransform={remember} onClose={onClose}
    overlay={inspection && <InspectionOverlay inspection={inspection} selectedId={region?.image.evidence_id || ''}
      hoveredIds={[]} regions={inspection.analysis.regions} finding={finding} />}
    onImageClick={inspection ? point=>{
      const found=inspection.analysis.regions.find(item=>point[0]>=item.crop_bbox[0]&&point[0]<=item.crop_bbox[2]
        &&point[1]>=item.crop_bbox[1]&&point[1]<=item.crop_bbox[3]);
      if(found)setSelection({kind:'evidence',id:found.image.evidence_id});
    } : undefined} />;
}
