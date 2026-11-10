import React from 'react';
import type {AnchorResultDetail,CandidateIdentityRecord,GalleryMember,GroupAnalysisDraft} from '../../shared/domain.generated.js';
import type {ConsistencyAnalysisReference} from '../consistency-view.js';
import {useResource} from '../useResource.js';

const identityRelations:Record<NonNullable<CandidateIdentityRecord['relation']>,string>={
  pixel_identical:'像素完全一致（程序验证）',transformed_same_content:'同一图像内容',
  content_different:'内容不同',unverified:'证据不足',
};

export function ConsistencyModelAnalysis({reference,members,result,error}:{
  reference:ConsistencyAnalysisReference;
  members:GalleryMember[];
  result:GroupAnalysisDraft|null;
  error:string;
}) {
  const detail=useResource<AnchorResultDetail>('job_id' in reference
    ? `/consistency/checks/${encodeURIComponent(reference.job_id)}/anchors/${encodeURIComponent(reference.anchor_id)}`:null);
  const reason=detail.data?.reason;
  return <section className="dc-model-panel" aria-label="模型分析">
    <h3>模型分析</h3>
    {'job_id' in reference && <div aria-label="图像身份与内容验证">
      {detail.loading ? <p role="status">正在读取图像身份验证…</p> : detail.error ?
        <p role="alert" className="iad-error">{detail.error}</p> : detail.data?.gates.length ?
          detail.data.gates.map(gate=><div key={gate.gate_id} data-dc="identity-analysis">
            <p className="dc-analysis-sources">{gate.candidate_id.slice(gate.candidate_id.indexOf(':')+1).split('/').pop()}：
              {gate.relation ? identityRelations[gate.relation] : '验证失败'}</p>
            <p>{gate.reason}</p>
            {gate.limitations.map((limitation,index)=><p key={index}>{limitation}</p>)}
          </div>) : <p>{reason==='NO_CANDIDATES' ? '未检索到候选，未进行图像身份与内容验证。' : '尚无已保存的图像身份与内容验证记录。'}</p>}
    </div>}
    <div aria-label="标注审核">
      {result ? <>
        {result.conclusions.map((conclusion,index)=><div key={index}>
          <p className="dc-analysis-sources">{conclusion.references.map(reference=>
            members.find(member=>member.image.sample.sample_id===reference.candidate_id)?.image.sample.relative_path.split('/').pop()
            || reference.candidate_id.split('/').pop()).join('、')}</p>
          <p>{conclusion.text}</p>
        </div>)}
        {result.limitations.map((limitation,index)=><p key={index}>{limitation}</p>)}
      </> : error ? <p role="alert" className="iad-error">{error}</p> : <p>{
        reason==='NO_ELIGIBLE_CANDIDATES' ? '无有效候选，未进行标注审核。' :
          reason==='NO_CANDIDATES' ? '未检索到候选，未进行标注审核。' : '暂无已保存的标注审核分析。'}</p>}
    </div>
  </section>;
}
