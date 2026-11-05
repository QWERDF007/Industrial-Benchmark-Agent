import type {ConsistencyReport, GalleryItem, GalleryPage, GalleryMember, GalleryMemberPage, GalleryReference} from '../shared/domain.generated.js';
import {differenceLabels} from '../shared/consistency-presentation.js';
import {modelAssessmentLabels} from '../shared/consistency.parameters.generated.js';
import {request} from './api.js';

export interface ConflictCardItem {
  id:string;
  type:string;
  filename:string;
  url:string;
  fullUrl:string;
  sourceWidth:number;
  sourceHeight:number;
  memberCount:number;
  review:GalleryItem['review_state'];
  model:{status:'conflict'|'no_conflict'|'unknown';modelType:string};
  rawItem:GalleryItem;
}

export class ConsistencyView {
  static media(image:GalleryItem['anchor'],thumbnail=false):string {
    return `/api/iad/consistency/evidence/${encodeURIComponent(image.evidence_id)}/media/${image.side}-original${thumbnail?'?max_side=480':''}`;
  }

  static async load(batchId:string,signal:AbortSignal):Promise<{queryId:string;items:ConflictCardItem[]}> {
    const report=await request<ConsistencyReport>('/consistency/report',{
      selection:{kind:'batch',batch_id:batchId},page_size:1
    },undefined,signal);
    const queryId=report.page.query_id,items:GalleryItem[]=[];
    for(let page=1;;page++){
      const result=await request<GalleryPage>('/consistency/gallery',{query_id:queryId,kind:'conflicts',page,page_size:200},undefined,signal);
      items.push(...result.items);
      if(items.length>=result.total)break;
    }
    const cards:ConflictCardItem[]=items.map(item=>({id:item.group_id,
      type:item.difference_types.map(type=>differenceLabels[type]).join('、') || '标注待核对',
      filename:item.anchor.sample.relative_path.split('/').pop()!,url:this.media(item.anchor,true),fullUrl:this.media(item.anchor),
      sourceWidth:item.anchor.sample.width,sourceHeight:item.anchor.sample.height,memberCount:item.member_count,review:item.review_state,
      model:{status:item.model_state==='MATERIAL'?'conflict':item.model_state==='EQUIVALENT'?'no_conflict':'unknown',
        modelType:modelAssessmentLabels[item.model_state]},rawItem:item}));
    return {queryId,items:cards};
  }

  static async members(reference:GalleryReference,signal:AbortSignal):Promise<GalleryMember[]> {
    const items:GalleryMember[]=[];
    for(let page=1;;page++){
      const result=await request<GalleryMemberPage>('/consistency/gallery/members',{...reference,page,page_size:200},undefined,signal);
      items.push(...result.items);
      if(items.length>=result.total)return items;
    }
  }
}
