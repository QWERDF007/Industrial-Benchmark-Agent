import {v4 as uuid} from 'uuid';
import {Button} from './Button.js';
import {IconButton} from "./IconButton.js";
import React, {useEffect, useState} from 'react';
import type {KnowledgeCheckEvidencePage, KnowledgeCheckReview, KnowledgeEvidence} from '../../shared/domain.generated.js';
import {message, request} from '../api.js';
import {Modal} from './Modal.js';
import {KnowledgeCheckEvidence} from './KnowledgeCheckEvidence.js';
import type {ImageSource} from './ImageViewer.js';
import {AnalysisEvidenceViewer} from './AnalysisEvidenceViewer.js';
import {analysisImageUrl,type AnalysisReadSource} from '../analysis-results.js';
import {PageTabs} from './layout/PageTabs.js';

export function KnowledgeEntryDialog({source, checkId, onClose, onSaved}: {
  source:AnalysisReadSource;checkId:string;onClose():void;onSaved?():void;
}) {
  const [image,setImage]=useState<(ImageSource&{id:string;sampleId:string})|null>(null);
  const [detail,setDetail]=useState<KnowledgeCheckEvidencePage|null>(null);
  const [evidenceRole,setEvidenceRole]=useState<'support'|'counter'>('support');
  const [status,setStatus]=useState<KnowledgeCheckReview['status']>('pending'), [note,setNote]=useState('');
  const [saving,setSaving]=useState(false), [error,setError]=useState('');
  // Paging evidence must not discard an unsaved assessment.
  const reviewRevision=detail?.check.review.revision;
  useEffect(()=>{
    if(detail){setStatus(detail.check.review.status);setNote(detail.check.review.note);}
  },[reviewRevision]);
  const open=(item:KnowledgeEvidence)=>setImage({id:item.image.evidence_id,
    src:analysisImageUrl(source,item.image.evidence_id),
    title:item.sample_id.slice(item.sample_id.indexOf(':')+1),width:item.image.sent_size[0],height:item.image.sent_size[1],sampleId:item.sample_id,evidence:item.image});
  return <><Modal title="知识条目详情" className="detail-modal knowledge-entry-dialog v46-app" header={false} onClose={()=>{if(!saving)onClose();}}>
    <header className="modalheader"><h2 id="kb-detail-title">{detail?.check.title || '正在读取知识条目'}</h2>
      <IconButton icon="close" type="button" id="close-detail" label="关闭知识详情" disabled={saving} onClick={onClose} /></header>
    <div className="modalcontent" id="entry-dialog">
      {detail && <><section className="detail-section"><h3>知识结论</h3><p>{detail.check.criterion}</p></section>
        <section className="detail-section"><h3>对象与位置</h3><p>{detail.check.subject}，{detail.check.location}</p></section>
        <section className="detail-section"><h3>允许变化</h3><p>{detail.check.allowed_variations.join('；') || '未记录允许变化'}</p></section>
      </>}
      {detail&&<section className="detail-section"><h3>方向来源</h3>{detail.directions.map(direction=><p key={direction.ref}>
        {direction.source_title}
      </p>)}</section>}
      <section className="detail-section"><h3>图像证据</h3><PageTabs<'support'|'counter'> label="知识图像证据"
        items={[{id:'support',label:'支持证据'},{id:'counter',label:'反对证据'}]} value={evidenceRole} onChange={setEvidenceRole}>
        <div hidden={evidenceRole!=='support'}><KnowledgeCheckEvidence source={source} checkId={checkId}
          role="support" active={evidenceRole==='support'} onOpen={open} onLoaded={setDetail} /></div>
        <div hidden={evidenceRole!=='counter'}><KnowledgeCheckEvidence source={source} checkId={checkId}
          role="counter" active={evidenceRole==='counter'} onOpen={open} /></div>
      </PageTabs></section>
      {detail && <>
        <section className="detail-section"><h3>适用限制</h3><p>{[...detail.check.limitations,...detail.check.support_limitations].join('；') || '未记录适用限制'}</p></section>
        {source.kind==='published'&&onSaved&&<section className="detail-section detail-review"><h3>人工核实</h3><div className="knowledge-review-options" role="radiogroup" aria-label="人工核实结论">
          {([['pending','待核实'],['confirmed','核实通过'],['rejected','驳回']] as const).map(([value,label])=><label key={value}>
            <input type="radio" name="knowledge-review" value={value} checked={status===value} disabled={saving} onChange={()=>setStatus(value)} />{label}</label>)}
        </div><label className="label" htmlFor="review-note">复核备注</label>
          <textarea className="f textarea" id="review-note" placeholder="填写复核依据（可选）" value={note} disabled={saving} onChange={event=>setNote(event.target.value)} /></section>}
      </>}
      {error && <p role="alert">{error}</p>}
    </div>
    <footer className="modalfooter"><div className="actions"><Button id="cancel-review" disabled={saving} onClick={onClose}>{onSaved?'取消':'关闭'}</Button>
      {source.kind==='published'&&onSaved&&<Button variant="primary" id="save-review" disabled={saving || !detail} onClick={async()=>{
        if(!detail)return;
        setSaving(true);setError('');
        try{await request('/knowledge/check-review',{version_id:source.versionId,check_id:checkId,submission_id:uuid(),
          expected_revision:detail.check.review.revision,status,note});onSaved();onClose();}
        catch(error){setError(message(error));}finally{setSaving(false);}
      }}>{saving?'保存中…':'保存'}</Button>}</div></footer>
  </Modal>{image&&<AnalysisEvidenceViewer result={source}
    source={{id:image.id,sampleId:image.sampleId,title:image.title,imageUrl:image.src,width:image.width,height:image.height,evidence:image.evidence}} onClose={()=>setImage(null)}/>}</>;
}
