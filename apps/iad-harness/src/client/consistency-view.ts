import type {AnchorImageItem, AnchorImagePage, ConsistencyAnchorRun, ConsistencyReport, GalleryItem, GalleryPage, GalleryMember, GalleryMemberPage, GalleryReference} from '../shared/domain.generated.js';
import {conflictCategories,modelConclusionLabels} from '../shared/consistency.parameters.generated.js';
import {mediaUrl,request} from './api.js';

export interface ConsistencyComparisonItem {
  id:string;
  type:string;
  filename:string;
  url:string;
  fullUrl:string;
  sourceWidth?:number;
  sourceHeight?:number;
  candidateCount:number;
  reference:ConsistencyAnalysisReference;
  image?:GalleryItem['anchor'];
  model:{status:'conflict'|'no_conflict'|'unknown';modelType:keyof typeof modelConclusionLabels|''};
  review:GalleryItem['review_state'];
  agreement:'same'|'different'|null;
}

export interface ConflictCardItem extends ConsistencyComparisonItem {
  types:GalleryItem['conflict_categories'];
  memberCount:number;
  rawItem:GalleryItem;
  checkId?:string;
}

export interface ConsistencyFilterValues {
  search:string;
  model:keyof typeof modelConclusionLabels|'all';
  agreement:NonNullable<ConsistencyComparisonItem['agreement']>|'all';
  review:ConsistencyComparisonItem['review']|'all';
}

export const initialConsistencyFilters:ConsistencyFilterValues={search:'',model:'all',agreement:'all',review:'all'};

export type AnchorReviewReference=Pick<ConsistencyAnchorRun,'job_id'|'anchor_id'>;
export type ConsistencyAnalysisReference=GalleryReference|AnchorReviewReference;

export class ConsistencyView {
  static modelConclusion(value:string|null|undefined,verdict?:GalleryItem['model_state']|null):keyof typeof modelConclusionLabels|'' {
    if(verdict==='EQUIVALENT')return 'EQUIVALENT';
    return value && Object.hasOwn(modelConclusionLabels,value) ? value as keyof typeof modelConclusionLabels : '';
  }

  static agreement(program:string,model:ConsistencyComparisonItem['model']['modelType']):ConsistencyComparisonItem['agreement'] {
    if(!model)return null;
    return program===model || program===modelConclusionLabels[model] ? 'same':'different';
  }

  static filter<T extends ConsistencyComparisonItem>(items:T[],filters:ConsistencyFilterValues):T[] {
    const search=filters.search.trim().toLowerCase();
    return items.filter(item=>(!search || item.filename.toLowerCase().includes(search))
      && (filters.model==='all' || item.model.modelType===filters.model)
      && (filters.agreement==='all' || item.agreement===filters.agreement)
      && (filters.review==='all' || item.review===filters.review));
  }

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
    return {queryId,items:this.cards(items,{query_id:queryId})};
  }

  static async loadCheck(runId:string,signal:AbortSignal):Promise<{queryId:string;items:ConflictCardItem[]}> {
    const items:GalleryItem[]=[];
    for(let page=1;;page++){
      const result=await request<GalleryPage>(`/consistency/checks/${encodeURIComponent(runId)}/gallery?page=${page}&page_size=200`,undefined,undefined,signal);
      items.push(...result.items);
      if(items.length>=result.total)break;
    }
    return {queryId:runId,items:this.cards(items,{job_id:runId})};
  }

  static async loadImages(runId:string,signal:AbortSignal):Promise<ConsistencyComparisonItem[]> {
    const items:AnchorImageItem[]=[];
    for(let page=1;;page++) {
      const result=await request<AnchorImagePage>(`/consistency/checks/${encodeURIComponent(runId)}/images?page=${page}&page_size=200`,undefined,undefined,signal);
      items.push(...result.items);
      if(items.length>=result.total)break;
    }
    return this.imageCards(runId,items);
  }

  private static cards(items:GalleryItem[],source:{job_id:string}|{query_id:string}):ConflictCardItem[] {
    const checkId='job_id' in source?source.job_id:undefined;
    return items.map(item=>({id:item.group_id,checkId,
      reference:'job_id' in source?{job_id:source.job_id,anchor_id:item.group_id}:{query_id:source.query_id,kind:'conflicts',group_id:item.group_id,facts_state:item.facts_state},
      image:item.anchor,candidateCount:item.candidate_count,
      types:checkId?item.conflict_categories:conflictCategories.filter(category=>item.conflict_categories.includes(category)||item.model_categories.includes(category)),
      type:item.annotation_conclusion,
      filename:item.anchor.sample.relative_path.split('/').pop()!,url:this.media(item.anchor,true),fullUrl:this.media(item.anchor),
      sourceWidth:item.anchor.sample.width,sourceHeight:item.anchor.sample.height,memberCount:item.member_count,review:item.review_state,
      model:{status:item.model_state==='MATERIAL'?'conflict':item.model_state==='EQUIVALENT'?'no_conflict':'unknown',
        modelType:this.modelConclusion(item.model_conclusion,item.model_state)},rawItem:item,
      agreement:this.agreement(item.annotation_conclusion,this.modelConclusion(item.model_conclusion,item.model_state))}));
  }

  static imageCards(runId:string,items:AnchorImageItem[]):ConsistencyComparisonItem[] {
    return items.map(({sample,summary,image,review_state})=>({id:sample.sample_id,type:summary.program_conclusion,
      filename:(image?.sample.relative_path || sample.sample_id.slice(sample.sample_id.indexOf(':')+1)).split('/').pop()!,
      url:image?this.media(image,true):mediaUrl(sample,'thumbnail'),fullUrl:image?this.media(image):mediaUrl(sample),
      sourceWidth:image?.sample.width,sourceHeight:image?.sample.height,image:image??undefined,
      candidateCount:summary.outcome?.candidate_stats?.eligible??((summary.selected_exact??0)+(summary.selected_similar??0)),
      reference:{job_id:runId,anchor_id:sample.sample_id},
      review:review_state,
      agreement:this.agreement(summary.program_conclusion,summary.reason==='MODEL_REVIEWED'?this.modelConclusion(summary.model_conclusion,summary.verdict):''),
      model:{status:summary.reason==='MODEL_REVIEWED'&&summary.verdict==='MATERIAL'?'conflict':summary.reason==='MODEL_REVIEWED'&&summary.verdict==='EQUIVALENT'?'no_conflict':'unknown',
        modelType:summary.reason==='MODEL_REVIEWED'?this.modelConclusion(summary.model_conclusion,summary.verdict):''},
    }));
  }

  static async members(reference:ConsistencyAnalysisReference,signal:AbortSignal):Promise<GalleryMember[]> {
    if('job_id' in reference){
      return (await request<GalleryMemberPage>(`/consistency/checks/${encodeURIComponent(reference.job_id)}/anchors/${encodeURIComponent(reference.anchor_id)}/members`,undefined,undefined,signal)).items;
    }
    const items:GalleryMember[]=[];
    for(let page=1;;page++){
      const result=await request<GalleryMemberPage>('/consistency/gallery/members',{...reference,page,page_size:200},undefined,signal);
      items.push(...result.items);
      if(items.length>=result.total)return items;
    }
  }
}
