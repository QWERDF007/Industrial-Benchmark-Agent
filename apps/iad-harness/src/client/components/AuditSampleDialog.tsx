import {Button} from './Button.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {IconButton} from './IconButton.js';
import React, {useMemo, useState} from 'react';
import type {AuditSampleItem, NativeAuditSampleDetail} from '../../shared/domain.generated.js';
import {useResource} from '../useResource.js';
import {nativeAuditEvidenceUrl} from '../api.js';
import {useWorkspace} from '../workspace.js';
import {Modal} from './Modal.js';
import {ImageViewer, type ImageSource} from './ImageViewer.js';
import {datasetImageAnnotations} from '../dataset-image-annotations.js';
import {auditSampleImage} from './AuditSampleMedia.js';

export function AuditSampleDialog({sample, taskId, onClose}: {sample: AuditSampleItem; taskId: string; onClose(): void}) {
  const {workspace}=useWorkspace();
  const resource = useResource<NativeAuditSampleDetail>(`/audit/jobs/${encodeURIComponent(sample.run_id)}/samples/${encodeURIComponent(sample.sample_id)}`);
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const [comparisonIndex, setComparisonIndex] = useState(0);
  const detail = resource.data;
  const pictures = useMemo(() => {
    return [...(detail?.evidence||[])].sort((left,right)=>Number(right.sample_id===sample.sample_id&&right.image.role==='overview')-Number(left.sample_id===sample.sample_id&&left.image.role==='overview')).map(item=>{
      const record=item.source,image=item.image;
      const filename=record?.sample.relative_path||item.sample_id;
      const view:ImageSource={src:nativeAuditEvidenceUrl(sample.run_id,sample.sample_id,image),title:filename,
        width:image.original_size[0],height:image.original_size[1],sampleId:item.sample_id,evidence:image,
        ...(record?datasetImageAnnotations(record.dataset_format,record.sample,record.annotations):{})};
      return {view,filename,evidence:image};
    });
  }, [detail, sample.run_id, sample.sample_id]);
  const mainImage = pictures[0]?.view || {src:auditSampleImage(sample, taskId),
    title:'审计主图', width:sample.width, height:sample.height};
  const comparison = pictures[comparisonIndex + 1];
  return <><Modal title="图像审计详情" className="audit-dialog" header={false} onClose={onClose}>
    <header className="audit-dialog-head"><h2>图像审计详情</h2><IconButton icon="close" label="关闭图像审计详情" onClick={onClose} /></header>
    <div className="audit-dialog-body audit-analysis-sections">
      {resource.loading && <p role="status">正在读取审计结果…</p>}
      {resource.error && <p role="alert">{resource.error}</p>}
      <section data-audit-section="analysis"><h3>综合分析</h3>
        <p>{detail?.final?.analysis || '暂无综合分析。'}</p></section>
      <section data-audit-section="conclusion"><h3>结论</h3>
        <p>{detail?.final?.conclusion || '暂无审计结论。'}</p>
        {!!detail?.errors.length && <p>{detail.errors.join('；')}</p>}
      </section>
      <section data-audit-section="basis"><h3>判断依据</h3>
        {detail?.final?detail.final.basis.map((basis,index)=><p key={index}>{basis}</p>): <p>暂无判断依据。</p>}
        {!!detail?.final?.findings.length&&<ol>{detail.final.findings.map(finding=><li key={finding.finding_id} data-finding-id={finding.finding_id}>
          <p>{finding.location}：{finding.description}</p><p>{finding.normal_explanation}</p>
          {!!finding.limitations.length&&<p>{finding.limitations.join('；')}</p>}
        </li>)}</ol>}
        {detail?.final?.check_assessments.map(check=><p key={check.check_id}>{check.check_id}：{check.description}</p>)}
        {!!detail?.final?.limitations.length&&<p>{detail.final.limitations.join('；')}</p>}
        {detail&&<><details><summary>本图一致性结果</summary><p>{detail.consistency.conclusion}</p>
          {detail.consistency.result?.reason==='MODEL_REVIEWED'&&<><p>{detail.consistency.result.overall.text}</p>
            {detail.consistency.result.conclusions.map((item,index)=><p key={index}>{item.text}</p>)}
            {!!detail.consistency.result.limitations.length&&<p>{detail.consistency.result.limitations.join('；')}</p>}</>}
          <a href={detail.consistency.result_ref} target="_blank" rel="noreferrer">查看完整一致性记录</a></details>
          <p>{detail.knowledge&&<button type="button" onClick={()=>{onClose();workspace.openLocation({pageId:'industrial-knowledge',datasetId:sample.dataset_id,
            version:detail.knowledge!.selection.version_id,job:detail.knowledge!.selection.job_id});}}>查看所选知识版本</button>}
          {sample.session_id&&<a href={`/api/iad/audit/jobs/${encodeURIComponent(sample.run_id)}/samples/${encodeURIComponent(sample.sample_id)}/session.jsonl`} download>下载本图 Session</a>}</p></>}
      </section>
      <section data-audit-section="evidence"><h3>图像证据</h3>
        <div className="iad-image-pair">{[{view:mainImage,filename:pictures[0]?.filename || sample.filename},comparison].filter(Boolean).map((picture,index)=><section className="iad-image-pair-side audit-evidence-item" key={picture!.view.src}>
          <ThumbnailCard image={picture!.view} label={picture!.filename} variant="evidence" aria-label={index===0?'放大主图':'放大对照图像'} onClick={()=>setLightbox(picture!.view)} />
        </section>)}</div>
        {pictures.length>1&&<div className="iad-thumbnail-strip" role="group" aria-label="切换候选图像">
          {pictures.slice(1).map((picture,index)=><ThumbnailCard key={picture.evidence.evidence_id} image={picture.view}
            variant="compact" label={picture.filename} title={picture.filename} aria-label={`切换为候选图像 ${picture.filename}`}
            aria-pressed={comparisonIndex===index} onClick={()=>setComparisonIndex(index)} />)}
        </div>}
      </section>
    </div><footer className="audit-dialog-foot"><Button onClick={onClose}>关闭</Button></footer>
  </Modal>{lightbox && <ImageViewer image={lightbox} onClose={() => setLightbox(null)} />}</>;
}
