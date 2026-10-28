import React, {useEffect,useState} from 'react';
import type {EvidenceBundle} from '../../shared/contracts.js';
import {message,request} from '../api.js';
import {useWorkspace} from '../workspace.js';
import {workbenchStyles} from '../styles.js';
import {WorkbenchHeader} from './layout/WorkbenchHeader.js';
import {FrozenConsistencyComparison} from './FrozenConsistencyComparison.js';
import {ConsistencyReviewPanel} from './ConsistencyReviewPanel.js';

const sourceStates={CURRENT:'来源与当次检查一致',CHANGED:'来源已变化',MISSING:'来源已移除',UNKNOWN:'来源状态未知'} as const;

export function ConsistencyEvidencePage({evidenceId}:{evidenceId:string}) {
  const {workspace,state}=useWorkspace();
  const [bundle,setBundle]=useState<EvidenceBundle|null>(null),[error,setError]=useState('');
  const [asking,setAsking]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();setBundle(null);setError('');
    request<EvidenceBundle>(`/consistency/evidence/${encodeURIComponent(evidenceId)}`,undefined,undefined,controller.signal)
      .then(value=>{if(!controller.signal.aborted)setBundle(value);}).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[evidenceId]);
  return <div className="iad-workbench iad-consistency" data-page="industrial-consistency" data-evidence-id={evidenceId}><style>{workbenchStyles}</style>
    <WorkbenchHeader pageId="industrial-consistency" title="比较证据"><button disabled={!!state.consistency.returnPage && !bundle} onClick={()=>{
      const pageId=state.consistency.returnPage, queryId=state.consistency.query?.sample_id;
      const source=queryId && bundle ? [bundle.sources.left.sample,bundle.sources.right.sample].find(sample=>sample.sample_id===queryId) : bundle?.sources.left.sample;
      if(pageId && source?.dataset_id) workspace.openLocation({pageId,datasetId:source.dataset_id,selected:source.sample_id});
      else workspace.updateConsistency({evidenceId:undefined,resultId:state.consistency.tab==='conflicts' ? state.consistency.resultId : undefined,tab:state.consistency.batchId ? 'jobs' : state.consistency.tab || 'search'},true);
    }}>{state.consistency.returnPage==='industrial-audit' ? '返回审计' : state.consistency.returnPage==='industrial-review' ? '返回复核' : state.consistency.returnPage==='industrial-images' ? '返回图像' : state.consistency.batchId ? '返回批次' : state.consistency.tab==='conflicts' || state.consistency.tab==='groups' ? '返回结果' : '返回检索'}</button>
      <button disabled={!bundle || asking} onClick={async()=>{if(!bundle)return;setAsking(true);setError('');try{await workspace.explainConsistency(bundle.result);}catch(failure){setError(message(failure));}finally{setAsking(false);}}}>{asking ? '正在打开会话…' : '在 DSH 中解释'}</button>
      <button disabled={!bundle} onClick={()=>window.location.assign(`/api/iad/consistency/evidence/${encodeURIComponent(evidenceId)}/export`)}>下载证据</button></WorkbenchHeader>
    {error && <p role="alert" className="iad-error">{error}</p>}
    {!bundle && !error && <p role="status">正在读取冻结证据…</p>}
    {bundle && <>
      <div className="iad-row"><strong>当次检查的冻结内容</strong><time dateTime={bundle.checked_at}>{new Date(bundle.checked_at).toLocaleString()}</time></div>
      <p className="iad-muted">查询：{sourceStates[bundle.source_states.left]} · 候选：{sourceStates[bundle.source_states.right]}</p>
      <FrozenConsistencyComparison bundle={bundle} />
      <ConsistencyReviewPanel key={bundle.result.evidence_id} bundle={bundle} />
    </>}
  </div>;
}
