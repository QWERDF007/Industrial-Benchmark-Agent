import React, {useEffect,useMemo,useState} from 'react';
import type {AnnotationDifference, ConsistencyReviewSubmission, FrozenEvidenceSource} from '../../shared/domain.generated.js';

type Proposal=Extract<ConsistencyReviewSubmission['action'],{kind:'PROPOSE_REGION_CHANGE'}>;
type Change=Proposal['changes'][number];
export function ConsistencyRegionProposal({sources,differences,onChange}:{sources:FrozenEvidenceSource[];differences:AnnotationDifference[];onChange(value:Proposal|null):void}) {
  const [sampleId,setSampleId]=useState(''),[annotationId,setAnnotationId]=useState(''),[operation,setOperation]=useState<Change['operation']>('relabel');
  const [category,setCategory]=useState(''),[geometryKind,setGeometryKind]=useState<'bbox'|'polygon'>('bbox'),[geometryText,setGeometryText]=useState('');
  const annotations=differences.flatMap(diff=>[...diff.left,...diff.right]).filter((item,index,items)=>items.findIndex(other=>other.annotation_id===item.annotation_id)===index && item.sample_id===sampleId);
  const value=useMemo<Proposal|null>(()=>{
    if(!sampleId || (operation!=='add'&&!annotationId))return null;
    if(operation==='remove')return {kind:'PROPOSE_REGION_CHANGE',changes:[{operation,sample_id:sampleId,annotation_id:annotationId}]};
    if(operation==='relabel')return category.trim()?{kind:'PROPOSE_REGION_CHANGE',changes:[{operation,sample_id:sampleId,annotation_id:annotationId,category:category.trim()}]}:null;
    const numbers=geometryText.trim().split(/[\s,，]+/).filter(Boolean).map(Number);
    if(!numbers.every(Number.isFinite))return null;
    const points=Array.from({length:Math.floor(numbers.length/2)},(_,index)=>[numbers[index*2],numbers[index*2+1]] as [number,number]);
    const geometry:Extract<Change,{operation:'add'}>['geometry']|null=geometryKind==='bbox' && numbers.length===4 ? {kind:'bbox',coordinates:[numbers[0],numbers[1],numbers[2],numbers[3]]}
      : geometryKind==='polygon' && numbers.length>=6 && numbers.length%2===0 ? {kind:'polygon',points:[points[0],points[1],points[2],...points.slice(3)]} : null;
    if(!geometry || (operation==='add'&&!category.trim()))return null;
    const change:Change=operation==='add'?{operation,sample_id:sampleId,category:category.trim(),geometry}:{operation,sample_id:sampleId,annotation_id:annotationId,geometry};
    return {kind:'PROPOSE_REGION_CHANGE',changes:[change]};
  },[sampleId,annotationId,operation,category,geometryKind,geometryText]);
  useEffect(()=>onChange(value),[value,onChange]);
  return <section aria-label="区域修正建议"><p className="iad-muted">建议不会改写源标注。实际修正并重扫后再验证。</p>
    <div className="iad-config-bar"><label className="iad-field">目标样本<select aria-label="区域建议目标" value={sampleId} onChange={event=>{setSampleId(event.target.value);setAnnotationId('');}}><option value="">请选择</option>{sources.map(source=><option key={source.sample.sample_id} value={source.sample.sample_id}>{source.sample.relative_path}</option>)}</select></label>
    <label className="iad-field">修正方式<select aria-label="区域修正方式" value={operation} onChange={event=>setOperation(event.target.value as Change['operation'])}><option value="relabel">修改类别</option><option value="reshape">修改形状</option><option value="add">新增区域</option><option value="remove">删除区域</option></select></label></div>
    {operation!=='add' && <label className="iad-field">所选差异中的区域<select aria-label="建议目标区域" value={annotationId} onChange={event=>setAnnotationId(event.target.value)}><option value="">请选择</option>{annotations.map(annotation=><option key={annotation.annotation_id} value={annotation.annotation_id}>{annotation.raw_label} · {annotation.bbox?.join(', ')}</option>)}</select></label>}
    {(operation==='add'||operation==='relabel') && <label className="iad-field">建议类别<input aria-label="建议类别" value={category} onChange={event=>setCategory(event.target.value)} /></label>}
    {(operation==='add'||operation==='reshape') && <><label className="iad-field">形状<select value={geometryKind} onChange={event=>setGeometryKind(event.target.value as 'bbox'|'polygon')}><option value="bbox">矩形</option><option value="polygon">多边形</option></select></label>
    <label className="iad-field">{geometryKind==='bbox'?'原图坐标 x1, y1, x2, y2':'原图顶点 x1, y1, x2, y2, …'}<input aria-label="建议区域坐标" value={geometryText} onChange={event=>setGeometryText(event.target.value)} /></label></>}
  </section>;
}
