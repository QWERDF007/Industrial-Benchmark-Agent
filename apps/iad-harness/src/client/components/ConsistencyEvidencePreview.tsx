import React,{useEffect,useState} from 'react';
import type {EvidenceBundle} from '../../shared/contracts.js';
import {imageRelations} from '../../shared/consistency-presentation.js';
import {message,request,reviewLabels} from '../api.js';
import {useWorkspace} from '../workspace.js';
import {FrozenConsistencyComparison} from './FrozenConsistencyComparison.js';

export function ConsistencyEvidencePreview({evidenceId}:{evidenceId:string}) {
  const {workspace}=useWorkspace();
  const [bundle,setBundle]=useState<EvidenceBundle|null>(null),[error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();setBundle(null);setError('');
    request<EvidenceBundle>(`/consistency/evidence/${encodeURIComponent(evidenceId)}`,undefined,undefined,controller.signal)
      .then(value=>{if(!controller.signal.aborted)setBundle(value);}).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[evidenceId]);
  const open=()=>workspace.updateConsistency({batchId:undefined,evidenceId,resultId:bundle?.result.result_id},true);
  return <section className="iad-consistency-detail" aria-label="选中图组证据" aria-busy={!bundle&&!error}>
    <header className="iad-consistency-panel-header"><strong>图组证据</strong>{bundle && <span>{imageRelations[bundle.result.verification.relation]} · {bundle.result.annotation.differences.length} 项差异</span>}</header>
    {error && <p role="alert" className="iad-error">{error}</p>}
    {!bundle && !error && <p role="status" className="iad-empty">正在读取图组证据…</p>}
    {bundle && <div className="iad-consistency-detail-body">
      <div className="iad-consistency-pair-meta">{(['left','right'] as const).map(side=>{const sample=bundle.sources[side].sample;return <div key={side}><strong title={sample.relative_path}>{sample.relative_path}</strong><span>原标签：{reviewLabels[sample.quality_status as keyof typeof reviewLabels] || sample.quality_status}</span></div>;})}</div>
      <FrozenConsistencyComparison key={evidenceId} bundle={bundle} compact />
      <footer className="iad-consistency-detail-actions"><button onClick={open}>查看原图对比</button><button className="iad-primary" onClick={open}>人工复核</button>
        <button onClick={()=>window.location.assign(`/api/iad/consistency/evidence/${encodeURIComponent(evidenceId)}/export`)}>导出证据</button></footer>
    </div>}
  </section>;
}
