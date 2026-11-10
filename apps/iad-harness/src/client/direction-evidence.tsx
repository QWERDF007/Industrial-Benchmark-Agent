import React from 'react';
import type {AnalysisDirection, AnalysisPublicationView} from '../shared/domain.generated.js';

export interface EvidenceReference {
  id: string;
  label: string;
}

export function directionEvidence(snapshot: AnalysisPublicationView, direction: AnalysisDirection) {
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
  const references=new Map<string,EvidenceReference>();
  for(const item of entries){
    if(item.evidence)references.set(item.id,{id:item.ref,label:item.label});
  }
  return {entries,references,counters};
}

export function ReferencedText({text,references,onReference,onPreview,className='iad-evidence-ref',highlightedId}: {
  text:string;
  references:Map<string,EvidenceReference>;
  onReference(id:string):void;
  onPreview(id:string,active:boolean):void;
  className?:string;
  highlightedId?:string|null;
}) {
  if(!references.size)return <>{text}</>;
  const ids=[...references.keys()].map(id=>id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const pattern=new RegExp(`(?<![A-Za-z0-9_])(${ids.join('|')})(?![A-Za-z0-9_])`,'g');
  const rendered:React.ReactNode[]=[];
  const cited=new Set<string>();
  let separator='';
  for(const [index,part] of text.split(pattern).entries()){
    if(!part)continue;
    const reference=references.get(part);
    if(!reference){
      if(cited.size && /^[\s、，,和与及至到~～—–-]+$/.test(part))separator=part;
      else {rendered.push(separator,part);separator='';cited.clear();}
      continue;
    }
    if(cited.has(reference.id)){separator='';continue;}
    rendered.push(separator,<button key={index} type="button"
      className={`${className}${highlightedId===reference.id?' is-related':''}`}
      data-evidence-ref={reference.id} aria-label={`定位证据 ${reference.label}`}
      onClick={()=>onReference(reference.id)}
      onMouseEnter={()=>onPreview(reference.id,true)} onMouseLeave={()=>onPreview(reference.id,false)}
      onFocus={()=>onPreview(reference.id,true)} onBlur={()=>onPreview(reference.id,false)}
    >{reference.label}</button>);
    separator='';cited.add(reference.id);
  }
  rendered.push(separator);
  return <>{rendered}</>;
}
