import React,{useMemo,useState} from 'react';
import type {AnalysisSampleEvidence} from '../../shared/domain.generated.js';
import {useResource} from '../useResource.js';
import {datasetImageAnnotations} from '../dataset-image-annotations.js';
import {FullscreenViewer,type FullscreenViewerItem} from './FullscreenViewer.js';

export function AnalysisEvidenceViewer({versionId,source,onClose}:{versionId:string;source:FullscreenViewerItem&{sampleId:string};onClose():void}) {
  const resource=useResource<AnalysisSampleEvidence>(`/analysis/publications/${encodeURIComponent(versionId)}/samples/${encodeURIComponent(source.sampleId)}/evidence`);
  const [selected,setSelected]=useState(source.id);
  const items=useMemo(()=>resource.data?.items.map(item=>{
    const registration=resource.data!.registration;
    return {id:item.evidence_id,sampleId:item.sample_id,title:item.filename,
      imageUrl:`/api/iad/${resource.data!.module}/evidence/${encodeURIComponent(versionId)}/${encodeURIComponent(item.evidence_id)}`,
      width:item.image.sent_size[0],height:item.image.sent_size[1],evidence:item.image,
      ...datasetImageAnnotations(registration.dataset_format,registration.sample,registration.annotations)};
  }),[resource.data,versionId]);
  const index=items?.findIndex(item=>item.id===selected)??0;
  return <FullscreenViewer open item={items?.[index]||{...source,annotationLayer:null}} items={items||[source]} currentIndex={index}
    onNavigate={position=>setSelected(items![position].id)} onClose={onClose}
    context={resource.error?<p role="alert">{resource.error}</p>:undefined}/>;
}
