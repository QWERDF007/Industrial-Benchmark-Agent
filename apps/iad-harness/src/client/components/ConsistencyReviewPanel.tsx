import React, {useEffect, useRef, useState} from 'react';
import {v4 as uuid} from 'uuid';
import type {ConsistencyReviewContext, ConsistencyReviewSubmission, CorrectionCheck, ConsistencyResult, EvidenceBundle} from '../../shared/domain.generated.js';
import {message, request, reviewLabel} from '../api.js';
import {differenceLabels} from '../../shared/consistency-presentation.js';
import {useWorkspace} from '../workspace.js';
import {ConsistencyRegionProposal} from './ConsistencyRegionProposal.js';

type Action = ConsistencyReviewSubmission['action'];
const actions:Record<Action['kind'],string> = {CONFIRM_DIFFERENCE:'确认差异，待修正',EXPECTED_POLICY_DIFFERENCE:'属于不同规范',NEEDS_CONTEXT:'需要补充依据',SET_EFFECTIVE_QUALITY:'提交有效质量裁决',PROPOSE_REGION_CHANGE:'提出区域修正建议'};
const reviewStates = {OPEN:'待复核',NEEDS_CONTEXT:'待补充依据',RESOLVED:'已裁决'};
const correctionStates = {NOT_REQUIRED:'无需修正',PROPOSED:'建议未应用',AWAITING_RESCAN:'等待源修正及重扫',VERIFIED:'重扫已验证'};

export function ConsistencyReviewPanel({bundle}:{bundle:EvidenceBundle}) {
  const {workspace}=useWorkspace();
  const {result}=bundle, key='iad.consistency-pending:'+result.evidence_id;
  const [context,setContext]=useState<ConsistencyReviewContext|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const [selected,setSelected]=useState<string[]>([]),[kind,setKind]=useState<Action['kind']>('CONFIRM_DIFFERENCE');
  const [reviewer,setReviewer]=useState(()=>localStorage.getItem('iad.reviewer')||'auditor_qc'),[comment,setComment]=useState('');
  const [quality,setQuality]=useState<Partial<Record<string,'PASS'|'FAIL'|'HARD_NORMAL'|'UNCERTAIN'>>>({});
  const [region,setRegion]=useState<Extract<Action,{kind:'PROPOSE_REGION_CHANGE'}>|null>(null);
  const pending=useRef<ConsistencyReviewSubmission|null>(null),active=useRef(true);
  const [hasPending,setHasPending]=useState(false);
  const sources=[bundle.sources.left,bundle.sources.right];
  useEffect(()=>{
    active.current=true;const controller=new AbortController();
    try {const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved?.evidence_id===result.evidence_id && typeof saved.client_request_id==='string'){pending.current=saved;setHasPending(true);}}catch{sessionStorage.removeItem(key);}
    request<ConsistencyReviewContext>('/consistency/review/context',{evidence_id:result.evidence_id},undefined,controller.signal)
      .then(value=>{if(active.current)setContext(value);}).catch(error=>{if(!controller.signal.aborted)setError(message(error));});
    return()=>{active.current=false;controller.abort();};
  },[key,result.evidence_id]);
  const current=context?.source_states.left==='CURRENT' && context.source_states.right==='CURRENT';
  const selectedDiffs=result.annotation.differences.filter(diff=>selected.includes(diff.difference_id));
  const targets=Object.entries(quality).flatMap(([sample_id,quality])=>quality ? [{sample_id,quality}] : []);
  const canSubmit=reviewer.trim() && comment.trim() && selected.length && (kind!=='SET_EFFECTIVE_QUALITY' || (current && targets.length)) && (kind!=='PROPOSE_REGION_CHANGE' || (current && region));
  async function submit() {
    if(busy)return;setBusy(true);setError('');setNotice('');
    try {
      if(!pending.current){
        if(!canSubmit)throw new Error('请填写处置目标、复核人与说明');
        const action:Action=kind==='SET_EFFECTIVE_QUALITY' ? {kind,targets:targets.length===1?[targets[0]]:[targets[0],targets[1]]} : kind==='PROPOSE_REGION_CHANGE' ? region! : {kind};
        pending.current={client_request_id:uuid(),evidence_id:result.evidence_id,result_id:result.result_id,difference_ids:[selected[0],...selected.slice(1)],reviewer:reviewer.trim(),comment:comment.trim(),action};
        sessionStorage.setItem(key,JSON.stringify(pending.current));setHasPending(true);
      }
      const submission=pending.current;
      await request('/consistency/review/submit',submission);
      const next=await request<ConsistencyReviewContext>('/consistency/review/context',{evidence_id:result.evidence_id});
      sessionStorage.removeItem(key);localStorage.setItem('iad.reviewer',submission.reviewer);pending.current=null;
      if(active.current){setContext(next);setHasPending(false);setNotice('处置已提交');}
    }catch(error){if(active.current)setError(message(error));}finally{if(active.current)setBusy(false);}
  }
  async function verify(decision_id:string) {
    setBusy(true);setError('');
    try {
      const compared=await request<ConsistencyResult>('/consistency/compare',{sample_a:bundle.parameters.sample_a,sample_b:bundle.parameters.sample_b});
      const checked=await request<CorrectionCheck>('/consistency/review/verify',{client_request_id:uuid(),decision_id,evidence_id:compared.evidence_id,reviewer:reviewer.trim()});
      const next=await request<ConsistencyReviewContext>('/consistency/review/context',{evidence_id:result.evidence_id});
      if(active.current){setContext(next);setNotice(checked.reason);}
    }catch(error){if(active.current)setError(message(error));}finally{if(active.current)setBusy(false);}
  }
  async function compareCurrent() {
    setBusy(true);setError('');
    try {
      const compared=await request<ConsistencyResult>('/consistency/compare',{sample_a:bundle.parameters.sample_a,sample_b:bundle.parameters.sample_b});
      if(active.current)workspace.updateConsistency({evidenceId:compared.evidence_id,resultId:compared.result_id,differenceId:undefined},true);
    }catch(error){if(active.current)setError(message(error));}finally{if(active.current)setBusy(false);}
  }
  return <section className="iad-job-panel iad-consistency-review" aria-label="一致性人工处置"><h2>人工处置</h2>
    {context && <div className="iad-table-scroll"><table className="iad-resource-table"><thead><tr><th>差异</th><th>复核</th><th>源修正</th></tr></thead><tbody>
      {context.differences.map(item=><tr key={item.difference_id} data-review-state={item.review_state} data-correction-state={item.correction_state}><td><label><input type="checkbox" aria-label={`处置差异 ${result.annotation.differences.find(diff=>diff.difference_id===item.difference_id)?.type}`} disabled={busy||hasPending} checked={selected.includes(item.difference_id)} onChange={event=>setSelected(event.target.checked ? [...selected,item.difference_id] : selected.filter(id=>id!==item.difference_id))} />{differenceLabels[result.annotation.differences.find(diff=>diff.difference_id===item.difference_id)!.type]}</label></td><td>{reviewStates[item.review_state]}</td><td>{correctionStates[item.correction_state]}</td></tr>)}
    </tbody></table></div>}
    {!current && <div className="iad-row"><p className="iad-muted">历史来源可补充处置说明；质量裁决和区域建议需重新比较当前来源。</p><button disabled={busy||hasPending} onClick={()=>void compareCurrent()}>重新比较当前来源</button></div>}
    <form onSubmit={event=>{event.preventDefault();void submit();}}><fieldset disabled={busy||hasPending}>
      <div className="iad-config-bar"><label className="iad-field">处置动作<select aria-label="一致性处置动作" value={kind} onChange={event=>setKind(event.target.value as Action['kind'])}>{Object.entries(actions).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label className="iad-field">复核人<input aria-label="一致性复核人" value={reviewer} onChange={event=>setReviewer(event.target.value)} required /></label></div>
      {kind==='SET_EFFECTIVE_QUALITY' && <section aria-label="质量裁决目标"><h3>实际目标样本</h3>{sources.map(source=><label className="iad-field" key={source.sample.sample_id}>{source.sample.relative_path}<select aria-label={`质量裁决 ${source.sample.relative_path}`} value={quality[source.sample.sample_id]||''} onChange={event=>setQuality({...quality,[source.sample.sample_id]:event.target.value as typeof quality[string]})}>
        <option value="">不修改</option>{(['PASS','FAIL','HARD_NORMAL','UNCERTAIN'] as const).map(value=><option key={value} value={value}>{reviewLabel(value)}</option>)}
      </select></label>)}</section>}
      {kind==='PROPOSE_REGION_CHANGE' && <ConsistencyRegionProposal sources={sources} differences={selectedDiffs} onChange={setRegion} />}
      <label className="iad-field">处置说明<textarea aria-label="一致性处置说明" required value={comment} onChange={event=>setComment(event.target.value)} /></label>
    </fieldset>{hasPending && pending.current && <div role="status">提交结果待确认 · {actions[pending.current.action.kind]} · {pending.current.reviewer}<p>{pending.current.comment}</p>
      {pending.current.action.kind==='SET_EFFECTIVE_QUALITY' && <ul>{pending.current.action.targets.map(target=><li key={target.sample_id}>{sources.find(source=>source.sample.sample_id===target.sample_id)?.sample.relative_path} · {reviewLabel(target.quality)}</li>)}</ul>}
      {pending.current.action.kind==='PROPOSE_REGION_CHANGE' && <ul>{pending.current.action.changes.map((change,index)=><li key={index}>{sources.find(source=>source.sample.sample_id===change.sample_id)?.sample.relative_path} · {change.operation}</li>)}</ul>}
    </div>}
    <button className="iad-primary" disabled={busy||(!hasPending&&!canSubmit)}>{busy?'提交中…':hasPending?'重试同一处置':'提交处置'}</button></form>
    {error && <p role="alert" className="iad-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    {!!context?.decisions.length && <details><summary>处置记录 · {context.decisions.length}</summary>{context.decisions.map(decision=><div key={decision.decision_id}><p>{actions[decision.request.action.kind]} · {decision.request.reviewer} · {decision.request.comment}</p>
      {decision.request.action.kind==='PROPOSE_REGION_CHANGE' && <button disabled={busy||hasPending||!reviewer.trim()} onClick={()=>void verify(decision.decision_id)}>验证重扫结果</button>}
    </div>)}</details>}
  </section>;
}
