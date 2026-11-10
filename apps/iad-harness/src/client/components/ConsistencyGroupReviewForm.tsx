import React, {useEffect, useRef, useState} from 'react';
import {v4 as uuid} from 'uuid';
import type {GroupReviewContext, GroupReviewSubmission} from '../../shared/domain.generated.js';
import {message, request} from '../api.js';
import {Button} from './Button.js';

export function ConsistencyGroupReviewForm({jobId,anchorId,onClose,onReviewed,children}:{
  jobId?:string;anchorId:string;onClose():void;onReviewed():void;children:React.ReactNode;
}) {
  const [context,setContext]=useState<GroupReviewContext|null>(null);
  const [decision,setDecision]=useState<'pending'|'confirmed'|'rejected'>('pending');
  const [note,setNote]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const pending=useRef<GroupReviewSubmission|null>(null);
  const mounted=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const path=jobId?`/consistency/checks/${encodeURIComponent(jobId)}/anchors/${encodeURIComponent(anchorId)}/review`:null;
  useEffect(()=>{
    const controller=new AbortController();
    if(!path){setError('图组缺少可复核的作业引用');return;}
    request<GroupReviewContext>(path,undefined,undefined,controller.signal).then(value=>{
      if(controller.signal.aborted)return;
      setContext(value);setDecision(value.disposition);
      const latest=[...value.decisions].reverse().find(item=>item.request.result_fingerprint===value.result_fingerprint);
      setNote(latest?.request.comment || '');
    }).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[path]);
  const locked=busy || !context || !!pending.current;
  async function save(event:React.FormEvent) {
    event.preventDefault();
    if(!path || !context || busy)return;
    if(decision==='pending' && !note.trim()){onClose();return;}
    if(!note.trim()){setError('请填写复核依据');return;}
    if(!pending.current)pending.current={client_request_id:uuid(),result_fingerprint:context.result_fingerprint,
      reviewer:localStorage.getItem('iad.reviewer') || 'auditor_qc',comment:note.trim(),
      action:{kind:decision==='confirmed'?'CONFIRM_DIFFERENCE':decision==='rejected'?'REJECT_DIFFERENCE':'NEEDS_CONTEXT'}};
    setBusy(true);setError('');
    try{
      await request(path,pending.current);
      pending.current=null;
      if(mounted.current)onClose();
      onReviewed();
    }catch(failure){if(mounted.current)setError(message(failure));}
    finally{if(mounted.current)setBusy(false);}
  }
  return <form className="dc-group-review-form" onSubmit={save}>
    <div className="dc-dialog-body">
      {children}
      <section className="dc-review-panel" aria-label="人工复核">
        <h3>人工复核</h3>
        <div className="dc-decision-controls">
          {([['pending','待确认'],['confirmed','确认冲突'],['rejected','排除冲突']] as const).map(([value,label])=>
            <label key={value}><input type="radio" name="dc-review" value={value} disabled={locked}
              checked={decision===value} onChange={()=>setDecision(value)}/>{label}</label>)}
        </div>
        {error && <p role="alert" className="iad-error">{error}</p>}
        <textarea disabled={locked} className="dc-note" id="dc-note" aria-label="复核说明"
          placeholder="复核说明" value={note} onChange={event=>setNote(event.target.value)}/>
      </section>
    </div>
    <footer className="dc-dialog-footer">
      <Button onClick={onClose}>取消</Button>
      <Button variant="primary" type="submit" disabled={busy || !context}>保存复核</Button>
    </footer>
  </form>;
}
