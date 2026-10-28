import React, {useEffect, useRef, useState} from 'react';
import type {ConsistencyResult,EvidenceBundle,RetrievalMember, SampleDetail} from '../../shared/contracts.js';
import {mediaUrl, message, request} from '../api.js';
import {type ImageSource} from './ImageCanvas.js';
import {frozenConsistencyImage} from '../consistency-images.js';
import {ConsistencyCanvasPair} from './ConsistencyCanvasPair.js';
import {ConsistencyDifferences} from './ConsistencyDifferences.js';
import {useWorkspace} from '../workspace.js';



export function ConsistencyComparison({member,query,temporary,differenceId,onDifference,frozen}: {
  member:RetrievalMember;query:SampleDetail|null;temporary:{preview:string;name:string}|null;
  differenceId?:string;onDifference(id:string):void;
  frozen?:EvidenceBundle;
}) {
  const {workspace}=useWorkspace();
  const [saving,setSaving]=useState(false);
  const saveRequest=useRef<AbortController|null>(null);
  useEffect(()=>()=>saveRequest.current?.abort(),[]);
  const [detail,setDetail]=useState<SampleDetail|null>(null),[error,setError]=useState('');
  const [synchronized,setSynchronized]=useState(true);
  const [showDifferences,setShowDifferences]=useState(true);
  useEffect(()=>{
    if(frozen)return;
    const controller=new AbortController();
    request<SampleDetail>(`/sample/${encodeURIComponent(member.sample_id)}`,undefined,undefined,controller.signal)
      .then(data=>{if(!controller.signal.aborted)setDetail(data);}).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[member.sample_id,frozen]);
  const selected=member.annotation?.differences.find(row=>row.difference_id===differenceId);
  const image=(data:SampleDetail):ImageSource=>({src:mediaUrl(data.sample),title:data.sample.relative_path,width:data.sample.width,height:data.sample.height,
    annotationLayer:{kind:'sample',sample:data.sample,annotations:data.annotations}});
  const sources:[ImageSource|null,ImageSource|null]=frozen ? [frozenConsistencyImage(frozen,'left'),frozenConsistencyImage(frozen,'right')] : [query ? image(query) : temporary ? {src:temporary.preview,title:temporary.name} : null,detail ? image(detail) : null];
  async function save(){
    if(!query)return;setSaving(true);setError('');
    const controller=new AbortController();saveRequest.current=controller;
    try {
      const result=await request<ConsistencyResult>('/consistency/compare',{sample_a:query.sample.sample_id,sample_b:member.sample_id},undefined,controller.signal);
      if(controller.signal.aborted)return;
      workspace.updateConsistency({batchId:undefined,evidenceId:result.evidence_id,resultId:result.result_id},true);
    }catch(failure){if(!controller.signal.aborted)setError(message(failure));}finally{if(!controller.signal.aborted)setSaving(false);}
  }
  return <>
    <section className="iad-consistency-comparison" aria-label="双图比较">
      <div className="iad-row"><label><input type="checkbox" checked={synchronized} onChange={event=>setSynchronized(event.target.checked)} />同步缩放与平移</label>
        <label><input type="checkbox" checked={showDifferences} onChange={event=>setShowDifferences(event.target.checked)} />差异区域</label>
        <span className="iad-muted">{member.relation==='EXACT' ? '已按原始解码像素核验' : '尚无严格同图证明'}</span>
        {!frozen && query && <button disabled={saving || !detail} onClick={()=>void save()}>{saving ? '正在保存…' : '保存比较证据'}</button>}</div>
      {error && <p className="iad-error" role="alert">{error}</p>}
      <ConsistencyCanvasPair sources={sources} selected={selected} synchronized={synchronized} showDifferences={showDifferences} />
    </section>
    <ConsistencyDifferences member={member} differenceId={differenceId} onDifference={onDifference} />
  </>;
}
