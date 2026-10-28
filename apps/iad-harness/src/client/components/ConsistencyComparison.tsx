import React, {useEffect, useRef, useState} from 'react';
import type {ConsistencyResult,EvidenceBundle,RetrievalMember, SampleDetail} from '../../shared/contracts.js';
import type {AnnotationDifference} from '../../shared/domain.generated.js';
import type {InspectionTransform} from '../inspection.js';
import {mediaUrl, message, request} from '../api.js';
import {ImageCanvas, type ImageSource} from './ImageCanvas.js';
import {imageRelations,differenceLabels} from '../../shared/consistency-presentation.js';
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
  const [transform,setTransform]=useState<InspectionTransform>({zoom:0,x:0,y:0}),[synchronized,setSynchronized]=useState(true);
  const [rightTransform,setRightTransform]=useState<InspectionTransform>({zoom:0,x:0,y:0});
  const [showDifferences,setShowDifferences]=useState(true);
  useEffect(()=>{
    if(frozen)return;
    const controller=new AbortController();
    request<SampleDetail>(`/sample/${encodeURIComponent(member.sample_id)}`,undefined,undefined,controller.signal)
      .then(data=>{if(!controller.signal.aborted)setDetail(data);}).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[member.sample_id,frozen]);
  const selected=member.annotation?.differences.find(row=>row.difference_id===differenceId);
  const region=showDifferences && selected?.region ? {id:selected.difference_id,bbox:selected.region} : undefined;
  const image=(data:SampleDetail):ImageSource=>({src:mediaUrl(data.sample),title:data.sample.relative_path,width:data.sample.width,height:data.sample.height,
    annotationLayer:{kind:'sample',sample:data.sample,annotations:data.annotations}});
  const sources: (ImageSource|null)[]=frozen ? (['left','right'] as const).map(side=>{
    const source=frozen.sources[side],media=frozen.media.find(item=>item.side===side && item.representation==='preview' && !item.difference_id)!;
    const url=(mediaId:string)=>`/api/iad/consistency/evidence/${encodeURIComponent(frozen.result.evidence_id)}/media/${encodeURIComponent(mediaId)}`;
    const valid=frozen.media.find(item=>item.media_id===side+'-annotation_overlay')?.available;
    return {src:url(media.media_id),title:source.sample.relative_path,width:source.sample.width,height:source.sample.height,
      annotationLayer:valid ? {kind:'sample',sample:source.sample,annotations:source.annotations.annotations,
        maskUrls:Object.fromEntries(frozen.media.filter(item=>item.side===side && item.annotation_id).map(item=>[item.annotation_id!,url(item.media_id)]))} : undefined};
  }) : [query ? image(query) : temporary ? {src:temporary.preview,title:temporary.name} : null,detail ? image(detail) : null];
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
      <div className="iad-row"><label><input type="checkbox" checked={synchronized} onChange={event=>{if(!event.target.checked)setRightTransform(transform);setSynchronized(event.target.checked);}} />同步缩放与平移</label>
        <label><input type="checkbox" checked={showDifferences} onChange={event=>setShowDifferences(event.target.checked)} />差异区域</label>
        <span className="iad-muted">{member.relation==='EXACT' ? '已按原始解码像素核验' : '尚无严格同图证明'}</span>
        {!frozen && query && <button disabled={saving || !detail} onClick={()=>void save()}>{saving ? '正在保存…' : '保存比较证据'}</button>}</div>
      {error && <p className="iad-error" role="alert">{error}</p>}
      <div className="iad-consistency-canvases">
        {sources.map((source,index)=><div key={index} className="iad-consistency-side"><p>{index ? '候选图像' : '查询图像'}</p>
          {source ? <ImageCanvas image={source} embedded control={index===0 || synchronized ? {transform,onChange:setTransform} : {transform:rightTransform,onChange:setRightTransform}} focusRegion={region}
            overlay={region && source.width && source.height ? <svg className="iad-finding-layer iad-consistency-region" viewBox={`0 0 ${source.width} ${source.height}`}>
              <rect x={region.bbox[0]} y={region.bbox[1]} width={region.bbox[2]-region.bbox[0]} height={region.bbox[3]-region.bbox[1]} strokeDasharray={selected?.reference_from_other===(index ? 'right':'left') ? '6 4' : undefined} />
            </svg> : undefined} /> : <p role="status" className="iad-empty">{error ? '来源不可用' : '正在读取图像…'}</p>}</div>)}
      </div>
    </section>
    <aside className="iad-consistency-differences" aria-label="标注差异">
      <h2>标注差异</h2><p className="iad-muted">{member.annotation ? `规范${{SAME:'相同',DIFFERENT:'不同',UNKNOWN:'未知'}[member.annotation.policy_relation]} · ${member.annotation.status==='COMPLETE' ? '比较完成' : '比较不完整'}` : '尚未比较标注'}</p>
      {member.pixel.status==='COMPLETE' && <dl><dt>比较像素</dt><dd>{member.pixel.compared_pixels.toLocaleString()}</dd><dt>变化像素</dt><dd>{member.pixel.changed_pixels===null ? '未计算' : member.pixel.changed_pixels.toLocaleString()}</dd></dl>}
      {member.local && (member.local.status==='COMPLETE' ? <dl><dt>有效区域像素</dt><dd data-stat="local-compared">{member.local.compared_pixels.toLocaleString()}</dd><dt>局部变化像素</dt><dd>{member.local.changed_pixels?.toLocaleString()}</dd><dt>局部最大差值</dt><dd>{member.local.max_abs_diff}</dd></dl>
        : <p className="iad-muted">局部差异不可比较：{member.local.reason}</p>)}
      {member.near && <><p>{imageRelations[member.relation]}</p><p className="iad-muted">缩略图近似复核仅用于候选分级。</p>
        {member.near.pixel_cosine!==null && <dl><dt>灰度余弦</dt><dd>{member.near.pixel_cosine.toFixed(4)}</dd><dt>NCC</dt><dd>{member.near.ncc?.toFixed(4)}</dd></dl>}
        {member.registration?.status==='UNSUPPORTED' && <p className="iad-muted">局部配准未启用，不进行跨坐标标注对账。</p>}</>}
      {member.reason && <p className="iad-error">{member.reason}</p>}
      {member.annotation?.differences.map(difference=><button key={difference.difference_id} data-difference={difference.type} className={selected===difference ? 'is-selected' : ''} aria-pressed={selected===difference} onClick={()=>onDifference(difference.difference_id)}>
        <strong>{differenceLabels[difference.type]} · {difference.confirmed_conflict ? '已确认冲突' : '待定'}</strong>
        <span>查询：{difference.type==='QUALITY_LABEL' ? String(difference.facts.left_quality) : difference.left.map(annotation=>annotation.raw_label).join('、') || '无对应标注'}</span>
        <span>候选：{difference.type==='QUALITY_LABEL' ? String(difference.facts.right_quality) : difference.right.map(annotation=>annotation.raw_label).join('、') || '无对应标注'}</span>
        {difference.reference_from_other && <small>虚线位置来自{difference.reference_from_other==='left' ? '候选' : '查询'}图像标注，仅作参考</small>}
        {difference.pending.map((reason,index)=><small key={index}>{reason}</small>)}
      </button>)}
      {member.annotation?.differences.length===0 && <p>{member.annotation.status==='COMPLETE' ? '当前可比较标注未发现差异' : '当前未取得可判定差异'}</p>}
      {!!member.annotation?.masking.length && <details><summary>忽略区域</summary>{member.annotation.masking.map(row=><p key={row.annotation_id}>可见 {row.visible_pixels}/{row.total_pixels} 像素</p>)}</details>}
    </aside>
  </>;
}
