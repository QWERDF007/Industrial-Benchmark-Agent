import type {GalleryImage} from '../shared/domain.generated.js';
import type {EvidenceBundle,RetrievalMember} from '../shared/contracts.js';
import type {ImageSource} from './components/ImageCanvas.js';

export function frozenConsistencyImage(bundle:EvidenceBundle,side:'left'|'right'):ImageSource {
  const source=bundle.sources[side],media=bundle.media.find(item=>item.side===side && item.representation==='preview' && !item.difference_id)!;
  const url=(mediaId:string)=>`/api/iad/consistency/evidence/${encodeURIComponent(bundle.result.evidence_id)}/media/${encodeURIComponent(mediaId)}`;
  const valid=bundle.media.find(item=>item.media_id===side+'-annotation_overlay')?.available;
  return {src:url(media.media_id),title:source.sample.relative_path,width:source.sample.width,height:source.sample.height,
    annotationLayer:valid ? {kind:'sample',sample:source.sample,annotations:source.annotations.annotations,
      maskUrls:Object.fromEntries(bundle.media.filter(item=>item.side===side && item.annotation_id).map(item=>[item.annotation_id!,url(item.media_id)]))} : undefined};
}

export function frozenConsistencyMember(bundle:EvidenceBundle):RetrievalMember {
  const result=bundle.result;
  return {sample_id:bundle.sources.right.sample.sample_id,dataset_id:bundle.sources.right.sample.dataset_id!,
    quality_status:bundle.sources.right.sample.quality_status,relation:result.verification.relation,pixel:result.verification.pixel,
    near:result.verification.relation==='EXACT' ? null : result.verification,local:result.verification.local,
    registration:result.verification.registration,annotation:result.annotation,error_code:null,reason:null};
}

export const galleryImageUrl=(image:GalleryImage)=>`/api/iad/consistency/evidence/${encodeURIComponent(image.evidence_id)}/media/${image.side}-preview?max_side=360`;
