import React from 'react';
import type {RetrievalMember} from '../../shared/contracts.js';
import {imageRelations,differenceLabels} from '../../shared/consistency-presentation.js';

export function ConsistencyDifferences({member,differenceId,onDifference,anchorSide='left'}:{member:RetrievalMember;differenceId?:string;onDifference(id:string):void;anchorSide?:'left'|'right'}) {
  const selected=member.annotation?.differences.find(row=>row.difference_id===differenceId);
  return (
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
        {difference.type!=='POLICY_UNCONFIRMED' && <><span>{anchorSide==='left' ? '查询' : '候选'}：{difference.type==='QUALITY_LABEL' ? String(difference.facts.left_quality) : difference.left.map(annotation=>annotation.raw_label).join('、') || '无对应标注'}</span>
        <span>{anchorSide==='left' ? '候选' : '查询'}：{difference.type==='QUALITY_LABEL' ? String(difference.facts.right_quality) : difference.right.map(annotation=>annotation.raw_label).join('、') || '无对应标注'}</span></>}
        {difference.reference_from_other && <small>虚线位置来自{difference.reference_from_other===anchorSide ? '候选' : '查询'}图像标注，仅作参考</small>}
        {difference.pending.map((reason,index)=><small key={index}>{reason}</small>)}
      </button>)}
      {member.annotation?.differences.length===0 && <p>{member.annotation.status==='COMPLETE' ? '当前可比较标注未发现差异' : '当前未取得可判定差异'}</p>}
      {!!member.annotation?.masking.length && <details><summary>忽略区域</summary>{member.annotation.masking.map(row=><p key={row.annotation_id}>可见 {row.visible_pixels}/{row.total_pixels} 像素</p>)}</details>}
    </aside>
  );
}
