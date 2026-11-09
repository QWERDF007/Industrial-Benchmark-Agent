import React from 'react';
import type {AnalysisDirection, AnalysisPublicationView} from '../shared/domain.generated.js';

export interface EvidenceReference {
  id: string;
  label: string;
}

function referencePattern(aliases: Iterable<string>): RegExp {
  const groups={image:[] as string[],other:[] as string[]};
  for(const alias of [...aliases].sort((a,b)=>b.length-a.length)){
    groups[/^img_[a-f0-9]{6,64}$/.test(alias)?'image':'other'].push(alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  }
  const alternatives=Object.entries(groups).flatMap(([kind,values])=>{
    const boundary=kind==='image'?'A-Za-z0-9_':'A-Za-z0-9_:/.-';
    return values.length?[`(?<![${boundary}])(?:${values.join('|')})(?![${boundary}])`]:[];
  });
  return new RegExp(`(${alternatives.join('|')})`,'g');
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
  const owners=new Map<string,Set<string>>();
  for(const item of all){
    for(const alias of [item.id,item.evidence.sample_id,item.title,item.filename]){
      const ids=owners.get(alias)||new Set<string>();
      const original=displayed.get(item.id);
      if(original)ids.add(original.id);
      owners.set(alias,ids);
    }
  }
  const aliases=new Map([...owners].flatMap(([alias,ids])=>ids.size===1?[[alias,[...ids][0]] as const]:[]));
  const text=[direction.instruction,direction.rationale,...direction.limitations].join('\n');
  for(const [alias] of text.matchAll(/\bimg_[a-f0-9]{6,64}\b/g)){
    const matches=all.filter(item=>item.id.startsWith(alias));
    if(matches.length===1){const original=displayed.get(matches[0].id);if(original)aliases.set(alias,original.id);}
  }
  const selected=new Set([...direction.evidence_ids,...direction.counter_evidence_ids].map(id=>displayed.get(id)?.id || id));
  if(aliases.size){
    for(const token of text.split(referencePattern(aliases.keys()))){
      const id=aliases.get(token);
      if(id)selected.add(id);
    }
  }
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
  const byId=new Map(entries.filter(item=>item.evidence).map(item=>[item.id,item]));
  const references=new Map<string,EvidenceReference>();
  for(const [alias,id] of aliases){
    const reference=byId.get(id);
    if(reference)references.set(alias,{id:reference.ref,label:reference.label});
  }
  for(const item of entries){
    if(item.evidence){const reference={id:item.ref,label:item.label};references.set(item.ref,reference);references.set(item.label,reference);}
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
  const rendered:React.ReactNode[]=[];
  const cited=new Set<string>();
  let separator='';
  for(const [index,part] of text.split(referencePattern(references.keys())).entries()){
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
