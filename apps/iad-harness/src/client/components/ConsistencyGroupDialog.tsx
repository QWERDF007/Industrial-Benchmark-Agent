import React,{useEffect,useState} from 'react';
import type {GalleryItem,GalleryMemberPage} from '../../shared/domain.generated.js';
import {imageRelations} from '../../shared/consistency-presentation.js';
import {CloseIcon} from '../AuditIcon.js';
import {message,request} from '../api.js';
import {galleryImageUrl,frozenConsistencyImage,frozenConsistencyMember} from '../consistency-images.js';
import {useConsistencyEvidence} from '../useConsistencyEvidence.js';
import {useWorkspace} from '../workspace.js';
import {Modal} from './Modal.js';
import {IconButton} from './IconButton.js';
import {ImageViewer,type ImageSource} from './ImageViewer.js';
import {MediaImage,MediaLoad} from './MediaLoad.js';
import {PageTabs} from './layout/PageTabs.js';
import {ConsistencyCanvasPair} from './ConsistencyCanvasPair.js';
import {ConsistencyDifferences} from './ConsistencyDifferences.js';
import {ConsistencyGroupAnalysis} from './ConsistencyGroupAnalysis.js';
import {ConsistencyReviewPanel} from './ConsistencyReviewPanel.js';

const tabs=[{id:'summary',label:'MLLM 分析'},{id:'evidence',label:'证据清单'},{id:'review',label:'人工复核'}] as const;

export function ConsistencyGroupDialog({queryId,kind,item,position,total,onMove,onClose,restoreFocus}:{
  queryId:string;kind:'conflicts'|'groups';item:GalleryItem;position:number;total:number;
  onMove(offset:-1|1):void;onClose():void;restoreFocus():HTMLElement|null;
}) {
  const {state,workspace}=useWorkspace(),location=state.consistency;
  const [members,setMembers]=useState<GalleryMemberPage|null>(null),[error,setError]=useState(''),[asking,setAsking]=useState(false);
  const [lightbox,setLightbox]=useState<ImageSource|null>(null);
  const memberPage=location.memberPage||1,tab=location.detailTab||'summary';
  useEffect(()=>{
    const controller=new AbortController();setMembers(null);setError('');
    request<GalleryMemberPage>('/consistency/gallery/members',{query_id:queryId,kind,group_id:item.group_id,facts_state:item.facts_state,page:memberPage,page_size:20},undefined,controller.signal)
      .then(value=>{if(!controller.signal.aborted){setMembers(value);if(!value.items.some(row=>row.image.sample.sample_id===location.memberId))workspace.updateConsistency({memberId:value.items[0]?.image.sample.sample_id,differenceId:undefined},true);}})
      .catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[queryId,kind,item.group_id,item.facts_state,memberPage,workspace]);
  const selected=members?.items.find(row=>row.image.sample.sample_id===location.memberId)||members?.items[0];
  const anchor=useConsistencyEvidence(members?.anchor.evidence_id),candidate=useConsistencyEvidence(selected?.image.evidence_id);
  const comparison=selected?.comparison&&candidate.bundle?.result.evidence_id===selected.comparison.evidence_id ? candidate.bundle : null;
  const sources:[ImageSource|null,ImageSource|null]=[anchor.bundle&&members ? frozenConsistencyImage(anchor.bundle,members.anchor.side) : null,candidate.bundle&&selected ? frozenConsistencyImage(candidate.bundle,selected.image.side) : null];
  const difference=comparison?.result.annotation.differences.find(row=>row.difference_id===location.differenceId);
  const openEvidence=()=>{if(comparison)workspace.updateConsistency({batchId:undefined,evidenceId:comparison.result.evidence_id,resultId:comparison.result.result_id},true);};
  return <Modal title="图组详情" header={false} className="iad-consistency-group-dialog" onClose={onClose} restoreFocus={restoreFocus} onKeyDown={event=>{
    if(event.defaultPrevented || (event.target as HTMLElement).closest('input,textarea,select,[role=tablist],.iad-image-canvas'))return;
    if(event.key==='ArrowLeft' && position>1){event.preventDefault();onMove(-1);}
    if(event.key==='ArrowRight' && position<total){event.preventDefault();onMove(1);}
  }}>
    <header className="iad-group-header"><div><span className="iad-muted">{kind==='groups' ? '严格同图成员' : '候选集合核验'}</span><h2>{kind==='groups' ? '重复图组' : '冲突图像'} · {item.anchor.sample.relative_path.split('/').pop()}</h2><p>{kind==='groups' ? `${item.member_count} 张成员` : `查询图像 1 张 · ${item.candidate_count} 张候选`}</p></div>
      <div className="iad-row"><button disabled={position<=1} onClick={()=>onMove(-1)}>上一组</button><span className="iad-muted">{position} / {total}</span><button disabled={position>=total} onClick={()=>onMove(1)}>下一组</button><IconButton label="关闭图组详情" onClick={onClose}><CloseIcon /></IconButton></div></header>
    <div className="iad-group-scroll">
      {(error||anchor.error||candidate.error) && <p className="iad-error" role="alert">{error||anchor.error||candidate.error}</p>}
      {!members&&!error && <p role="status">正在读取候选图像…</p>}
      {members && <>
        <ConsistencyCanvasPair sources={sources} labels={[kind==='groups' ? '组代表图像（固定）' : '查询图像（固定）',kind==='groups' ? '组内成员' : '当前候选']} selected={difference} anchorSide={selected?.comparison?.anchor_side} onExpand={setLightbox} />
        <div className="iad-group-image-names">{sources.map((source,index)=><span key={index} title={source?.title}>{source?.title}</span>)}</div>
        <section className="iad-group-candidates" aria-label="候选图像"><div className="iad-row"><h3>{kind==='groups' ? '同图组成员' : '相似候选'}（{members.total} 张{kind==='groups' ? ' · 不含固定代表图' : ''}）</h3>
          <span className="iad-muted">{memberPage} / {Math.max(1,Math.ceil(members.total/20))}</span>
          {members.total>20 && <><button disabled={memberPage<=1} onClick={()=>workspace.updateConsistency({memberPage:memberPage-1,memberId:undefined,differenceId:undefined},true)}>上一页候选</button><button disabled={memberPage*20>=members.total} onClick={()=>workspace.updateConsistency({memberPage:memberPage+1,memberId:undefined,differenceId:undefined},true)}>下一页候选</button></>}</div>
          <MediaLoad><div className="iad-group-candidate-strip">{members.items.map((row,index)=><button key={row.image.sample.sample_id} data-sample-id={row.image.sample.sample_id} aria-pressed={selected===row} onClick={()=>workspace.updateConsistency({memberId:row.image.sample.sample_id,differenceId:undefined},true)}>
            {row.image.available ? <MediaImage src={galleryImageUrl(row.image)} alt={row.image.sample.relative_path} loading="lazy" /> : <span>原图不可恢复</span>}<strong>{kind==='groups' ? '成员' : '候选'} {(memberPage-1)*20+index+1}</strong><span title={row.image.sample.relative_path}>{row.image.sample.relative_path.split('/').pop()}</span></button>)}</div></MediaLoad>
        </section>
        <div className="iad-group-analysis"><PageTabs label="图组详情页签" items={tabs} value={tab} onChange={detailTab=>workspace.updateConsistency({detailTab},true)}>
          {tab==='summary' && <><ConsistencyGroupAnalysis reference={{query_id:queryId,kind,group_id:item.group_id,facts_state:item.facts_state}} onLocate={(citation,offset)=>workspace.updateConsistency({memberPage:Math.floor(offset/20)+1,memberId:citation.candidate_id,differenceId:citation.comparison?.difference_id??undefined,detailTab:'evidence'},true)} />
            {comparison && <div className="iad-group-fact"><strong>确定性事实</strong><span>{imageRelations[comparison.result.verification.relation]} · {comparison.result.annotation.differences.length} 项标注差异</span><button className="iad-consistency-text-button" onClick={()=>workspace.updateConsistency({detailTab:'evidence'},true)}>查看当前候选证据</button></div>}</>}
          {tab==='evidence' && (comparison ? <><dl className="iad-group-references"><dt>比较</dt><dd>{comparison.result.result_id}</dd><dt>证据</dt><dd>{comparison.result.evidence_id}</dd></dl><ConsistencyDifferences member={frozenConsistencyMember(comparison)} differenceId={location.differenceId} onDifference={differenceId=>workspace.updateConsistency({differenceId},true)} anchorSide={selected?.comparison?.anchor_side} /></> : <p className="iad-muted">当前成员与固定主图之间没有已保存的直接比较证据。</p>)}
          {tab==='review' && (comparison ? <ConsistencyReviewPanel key={comparison.result.evidence_id} bundle={comparison} /> : <p className="iad-muted">取得当前双图的比较证据后可人工复核。</p>)}
        </PageTabs></div>
      </>}
    </div>
    <footer className="iad-group-footer"><div className="iad-row"><button disabled={!comparison} onClick={openEvidence}>查看比较证据</button><button disabled={!comparison||asking} onClick={async()=>{if(!comparison)return;setAsking(true);try{await workspace.explainConsistency(comparison.result);}catch(failure){setError(message(failure));}finally{setAsking(false);}}}>{asking ? '正在打开会话…' : '在 DSH 中解释'}</button></div><button className="iad-primary" disabled={!comparison} onClick={()=>workspace.updateConsistency({detailTab:'review'},true)}>人工复核</button></footer>
    {lightbox && <ImageViewer image={lightbox} onClose={()=>setLightbox(null)} />}
  </Modal>;
}
