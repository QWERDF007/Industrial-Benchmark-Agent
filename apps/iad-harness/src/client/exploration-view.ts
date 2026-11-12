import {analysisImageUrl,analysisReadSource} from './analysis-results.js';
import type {AnalysisPublicationView, AnalysisResultView, AnalysisCurrentResultView, AnalysisSource, AnalysisSourceCatalog, AnalysisTarget} from '../shared/domain.generated.js';
import type {DirectionEvidenceItem, DirectionItem} from './components/DirectionDetailDialog.js';
import {mediaUrl, request} from './api.js';
import {directionEvidence} from './direction-evidence.js';

export class ExplorationNarrative {
  private readonly names = new Map<string,string>();
  private readonly pattern: RegExp;

  constructor(publication: AnalysisResultView | AnalysisPublicationView, datasetNames: Record<string,string> = {}) {
    for (const [id,name] of Object.entries(datasetNames)) this.names.set(id,name);
    for (const direction of publication.catalog.directions) {
      for (const id of direction.dataset_ids) if(!this.names.has(id))this.names.set(id,'所选子数据集');
      this.names.set(direction.direction_id,direction.title);
    }
    for (const item of publication.evidence) {
      const label=item.sampling_group==='normal'?'良品图像':item.sampling_group==='abnormal'?'异常图像':'图像';
      for(const id of [item.sample_id,item.evidence_id,item.filename,item.filename.split('/').at(-1)!])this.names.set(id,label);
      for (const id of item.image.annotation_ids ?? []) this.names.set(id,'原始标注');
    }
    for (const [id,name] of [[publication.job_id,'本次探索'],['version_id' in publication?publication.version_id:'','本次结果'],[publication.session_id,'探索会话']])
      if(id)this.names.set(id,name!);
    const ids=[...this.names.keys()].sort((a,b)=>b.length-a.length).map(id=>id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    this.pattern=new RegExp(`(?<![A-Za-z0-9_])\\[?(${ids.join('|')})\\]?(?![A-Za-z0-9_])`,'g');
  }

  text(value: string): string {
    return value.replace(this.pattern,(_match,id:string)=>this.names.get(id)!);
  }
}

export type ExplorationRole = NonNullable<AnalysisTarget['candidate_role']>;

export interface ExplorationCandidate extends Pick<AnalysisSource,'candidate_role'|'annotation_categories'> {
  id: string;
  filename: string;
  url: string;
  datasetId: string;
}

export async function explorationCandidates(datasetIds: string[], signal?: AbortSignal): Promise<ExplorationCandidate[]> {
  const sources = await request<AnalysisSourceCatalog>(`/analysis/sources?${new URLSearchParams({dataset_ids:JSON.stringify(datasetIds)})}`,undefined,undefined,signal);
  return sources.items.map(item=>({id:item.sample_id,filename:item.relative_path.replace(/^.*[\\/]/,''),datasetId:item.dataset_id,
    candidate_role:item.candidate_role,annotation_categories:item.annotation_categories,
    url:mediaUrl({task_id:item.dataset_id,sample_id:item.sample_id},'thumbnail')}));
}

export function explorationDirections(publication: AnalysisCurrentResultView | AnalysisPublicationView | null | undefined, referencedDirectionId?: string,
    datasetNames: Record<string,string> = {}): DirectionItem[] {
  const narrative=publication?new ExplorationNarrative(publication,datasetNames):null;
  return publication?.catalog.directions.filter(direction=>direction.direction_id===referencedDirectionId||!publication.removed_direction_ids.includes(direction.direction_id)).map(direction => {
    const projection=directionEvidence(publication,direction);
    const evidences = projection.entries.flatMap((item):DirectionEvidenceItem[]=>{
      if(!item.evidence)return [];
      const url=analysisImageUrl(analysisReadSource(publication),item.id);
      return [{evidenceId:item.id,sampleId:item.evidence.sample_id,kind:item.kind,ref:item.ref,label:item.label,
        url,fullUrl:url,filename:item.title}];
    });
    return {id:direction.direction_id, source:analysisReadSource(publication), datasetId:direction.dataset_ids[0], title:narrative!.text(direction.title),
      applies:direction.applies_to === 'normal' ? '良品' : direction.applies_to === 'defect' ? '异常' : '通用',
      brief:narrative!.text(direction.instruction), rationale:narrative!.text(direction.rationale),
      limitations:direction.limitations.map(text=>narrative!.text(text)), evidences};
  }) || [];
}
