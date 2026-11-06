import type {ExplorationSnapshot, KnowledgeSourcePage} from '../shared/domain.generated.js';
import type {DirectionEvidenceItem, DirectionItem} from './components/DirectionDetailDialog.js';
import {mediaUrl, request} from './api.js';
import {directionEvidence} from './direction-evidence.js';

export interface ExplorationCandidate {
  id: string;
  filename: string;
  url: string;
  kind: 'normal'|'defect';
  datasetId: string;
}

export async function explorationCandidates(datasetIds: string[], signal?: AbortSignal): Promise<ExplorationCandidate[]> {
  const groups = await Promise.all(datasetIds.map(async datasetId => {
    const sources = await Promise.all((['normal','defect'] as const).map(async kind => {
      const items: ExplorationCandidate[]=[];
      let page=1;
      while (true) {
        const result=await request<KnowledgeSourcePage>(`/knowledge/sources?${new URLSearchParams({dataset_id:datasetId,kind,
          include_observed:'true',page:String(page),page_size:'200'})}`,undefined,undefined,signal);
        items.push(...result.items.map(item=>({id:item.sample_id,filename:item.relative_path,url:mediaUrl({task_id:datasetId,sample_id:item.sample_id},'thumbnail'),kind,datasetId})));
        if(page*200>=result.total)return items;
        page++;
      }
    }));
    const normals=new Set(sources[0].map(item=>item.id));
    return [...sources[0],...sources[1].filter(item=>!normals.has(item.id))];
  }));
  return groups.flat();
}

export function activeExplorationDirections(snapshot: ExplorationSnapshot | null, removedIds: readonly string[] = []) {
  const removed = new Set(removedIds);
  return snapshot?.directions.filter(direction => !removed.has(direction.direction_id)) || [];
}

export function explorationDirections(snapshots: ExplorationSnapshot[], removedIds: readonly string[] = []): DirectionItem[] {
  return snapshots.flatMap(snapshot=>{
    return activeExplorationDirections(snapshot, removedIds).map(direction=>{
      const {entries,references}=directionEvidence(snapshot,direction);
      const evidences: DirectionEvidenceItem[]=entries.flatMap(item=>{
        if(!item.evidence || item.kind==='unknown')return [];
        const url=`/api/iad/exploration/evidence/${encodeURIComponent(snapshot.version_id)}/${encodeURIComponent(item.id)}`;
        return [{evidenceId:item.id,sampleId:item.evidence.sample_id,ref:item.ref,label:item.label,kind:item.kind,
          url,fullUrl:url,filename:item.filename}];
      });
      const byId=new Map(evidences.map(item=>[item.evidenceId,item]));
      return {id:direction.direction_id,versionId:snapshot.version_id,datasetId:snapshot.dataset_id,title:direction.title,applies:direction.applies_to==='normal'?'良品':direction.applies_to==='defect'?'异常':'通用',
        brief:direction.instruction,rationale:direction.rationale,
        limitations:direction.limitations,evidences,
        references:new Map([...references].flatMap(([alias,reference])=>{
          const item=byId.get(reference.id);
          return item?[[alias,{id:item.ref,label:item.label}] as const]:[];
        }))};
    });
  });
}
