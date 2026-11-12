import type {AnalysisDirection, AnalysisResultView} from '../shared/domain.generated.js';

export function directionEvidence(snapshot: AnalysisResultView, direction: AnalysisDirection) {
  const all=snapshot.evidence.map(evidence=>{
    return {id:evidence.evidence_id,evidence,title:evidence.filename,filename:evidence.filename.split('/').at(-1)!};
  });
  const originals=new Map(all.filter(item=>item.evidence.image.representation==='raw'
    && item.evidence.image.role==='overview'
    && item.evidence.image.crop_bbox.every((value,index)=>value===[0,0,...item.evidence.image.original_size][index]))
    .map(item=>[JSON.stringify([item.evidence.sample_id,item.evidence.image.source_sha256]),item]));
  const displayed=new Map(all.map(item=>[item.id,originals.get(JSON.stringify([item.evidence.sample_id,item.evidence.image.source_sha256]))]));
  const ids=direction.key_evidence?.map(item=>item.evidence_id)
    ?? (snapshot.finalization ? [] : [...direction.evidence_ids,...direction.counter_evidence_ids]);
  const selected=new Set(ids.map(id=>displayed.get(id)?.id || id));
  const counters={normal:0,defect:0,unknown:0};
  const images=new Map([...originals.values()].map(item=>[item.id,item]));
  const entries=[...selected].map(id=>{
    const item=images.get(id);
    if(!item)return {id,evidence:null,label:'证据缺失',ref:'',kind:'unknown' as const,title:id,filename:id};
    const kind:'normal'|'defect'|'unknown'=item.evidence.sampling_group==='normal'?'normal':item.evidence.sampling_group==='abnormal'?'defect'
      :item.evidence.candidate_role||'unknown';
    const ref={normal:'N',defect:'A',unknown:'U'}[kind]+ ++counters[kind];
    return {...item,kind,ref,label:`${{normal:'良品',defect:'异常',unknown:'未分类'}[kind]} ${ref}`};
  });
  return {entries,counters};
}
