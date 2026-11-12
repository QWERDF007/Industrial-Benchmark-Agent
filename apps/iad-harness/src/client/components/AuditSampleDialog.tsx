import {auditAssessmentLabels,auditIssueLabels} from '../../shared/audit.generated.js';
import {Button} from './Button.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {AnnotatedImageStage} from './AnnotatedImageStage.js';
import {IconButton} from './IconButton.js';
import React, {useMemo, useState} from 'react';
import type {AuditSampleItem, NativeAuditSampleDetail} from '../../shared/domain.generated.js';
import {useResource} from '../useResource.js';
import {nativeAuditEvidenceUrl} from '../api.js';
import {Modal} from './Modal.js';
import {ImageViewer, type ImageSource} from './ImageViewer.js';
import {datasetImageAnnotations} from '../dataset-image-annotations.js';
import {auditSampleImage} from './AuditSampleMedia.js';

export function AuditSampleDialog({sample, taskId, onClose}: {sample: AuditSampleItem; taskId: string; onClose(): void}) {
  const resource = useResource<NativeAuditSampleDetail>(`/audit/jobs/${encodeURIComponent(sample.run_id)}/samples/${encodeURIComponent(sample.sample_id)}`);
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const detail = resource.data;
  const pictures = useMemo(() => {
    return [...(detail?.evidence||[]).filter(item=>item.image.role==='overview'&&item.image.representation==='raw')].sort((left,right)=>Number(right.sample_id===sample.sample_id)-Number(left.sample_id===sample.sample_id)).map(item=>{
      const record=item.source,image=item.image;
      const view:ImageSource={src:nativeAuditEvidenceUrl(sample.run_id,sample.sample_id,image),
        title:record?.sample.relative_path??item.sample_id.slice(item.sample_id.indexOf(':')+1),
        width:image.original_size[0],height:image.original_size[1],sampleId:item.sample_id,evidence:image,
        ...(record?datasetImageAnnotations(record.dataset_format,record.sample,record.annotations):{})};
      return {view,evidence:image};
    });
  }, [detail, sample.run_id, sample.sample_id]);
  const mainImage = pictures[0]?.view || {src:auditSampleImage(sample, taskId),
    title:sample.filename, width:sample.width, height:sample.height};
  return <><Modal title="图像审计详情" className="audit-dialog" header={false} onClose={onClose}>
    <header className="audit-dialog-head"><h2>图像审计详情</h2><IconButton icon="close" label="关闭图像审计详情" onClick={onClose} /></header>
    <div className="audit-dialog-body audit-analysis-sections">
      {resource.loading && <p role="status">正在读取审计结果…</p>}
      {resource.error && <p role="alert">{resource.error}</p>}
      <div className="dc-compare" data-audit-section="images" style={{gridTemplateColumns:'minmax(0,1fr)'}}>
        <div className="dc-compare-cell">
          <div className="dc-compare-photo" role="button" tabIndex={0} aria-label="放大主图" title={mainImage.title}
            onClick={()=>setLightbox(mainImage)} onKeyDown={event=>{
              if(event.key==='Enter'||event.key===' '){event.preventDefault();setLightbox(mainImage);}
            }}>
            <AnnotatedImageStage src={mainImage.src} alt={mainImage.title} width={mainImage.width} height={mainImage.height}
              annotationLayer={'annotationLayer' in mainImage?mainImage.annotationLayer:undefined} qualityLabel={'qualityLabel' in mainImage?mainImage.qualityLabel:undefined}/>
          </div>
        </div>
      </div>
      {pictures.length>1&&<section className="dc-images-panel" data-audit-section="references" aria-label="参考图">
        <h3>参考图</h3>
        <div className="iad-thumbnail-grid" aria-label="参考图像证据">
          {pictures.slice(1).map((picture,index)=><ThumbnailCard key={picture.evidence.evidence_id} image={picture.view}
            label={`参考证据 ${index+1}`} title={`参考证据 ${index+1}`} aria-label={`放大参考证据 ${index+1}`}
            onClick={()=>setLightbox(picture.view)}/>)}
        </div>
      </section>}
      <section className="dc-fact-panel" data-audit-section="conclusion"><h3>判定结论</h3>
        <p>{detail?.final?.conclusion || ''}</p>
        {!!detail?.errors.length && <p>{detail.errors.join('；')}</p>}
      </section>
      <section className="dc-analysis-panel" data-audit-section="analysis"><h3>模型分析</h3>
        <p>{detail?.final?.analysis || ''}</p>
        {!!detail?.final?.findings.length&&<ol>{detail.final.findings.map(finding=><li key={finding.finding_id} data-finding-id={finding.finding_id}>
          <p>{'type' in finding?auditIssueLabels[finding.type]+'：':''}{finding.location}：{finding.description}</p><p>{finding.normal_explanation}</p>
          {!!finding.limitations.length&&<p>{finding.limitations.join('；')}</p>}
        </li>)}</ol>}
        {detail?.final&&'consistency_review' in detail.final&&detail.final.consistency_review.map(review=><p key={review.source_issue_id}>{auditAssessmentLabels[review.assessment]}：{review.reason}</p>)}
        {detail?.final?.check_assessments.filter(check=>check.status==='deviates'||check.status==='unobservable'||detail.final!.findings.some(finding=>finding.check_ids.includes(check.check_id)))
          .map(check=><p key={check.check_id}>{detail.knowledge?.entries.find(item=>item.check.check_id===check.check_id)?.check.title||'知识条目'}：{check.description}</p>)}
        {detail?.final&&'observations' in detail.final&&detail.final.observations.map((item,index)=><p key={index}>观察：{item.description}</p>)}
        {!!detail?.final?.limitations.length&&<p>{detail.final.limitations.join('；')}</p>}
      </section>

    </div><footer className="audit-dialog-foot"><Button onClick={onClose}>关闭</Button></footer>
  </Modal>{lightbox && <ImageViewer image={lightbox} onClose={() => setLightbox(null)} />}</>;
}
