import {Button} from './Button.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {IconButton} from './IconButton.js';
import React, {useMemo, useState} from 'react';
import type {AuditSampleDetail, AuditSampleItem} from '../../shared/domain.generated.js';
import {useResource} from '../useResource.js';
import {auditEvidenceUrl, auditImageIndex} from '../api.js';
import {Modal} from './Modal.js';
import {ImageViewer, type ImageSource} from './ImageViewer.js';
import {datasetImageAnnotations} from '../dataset-image-annotations.js';
import {auditSampleImage} from './AuditSampleMedia.js';

export function AuditSampleDialog({sample, taskId, onClose}: {sample: AuditSampleItem; taskId: string; onClose(): void}) {
  const resource = useResource<AuditSampleDetail>(`/audit/jobs/${encodeURIComponent(sample.run_id)}/samples/${encodeURIComponent(sample.sample_id)}`);
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const [comparisonIndex, setComparisonIndex] = useState(0);
  const detail = resource.data, analysis = detail?.suggestion?.analysis;
  const conclusion = analysis?.conclusion;
  const synthesis = conclusion && 'analysis_text' in conclusion ? conclusion : null;
  const pictures = useMemo(() => {
    if (!detail?.suggestion?.analysis) return [];
    const analysis = detail.suggestion.analysis, images = auditImageIndex(analysis);
    return analysis.image_sources.map(source => {
      const image = images.get(source.overview_evidence_id)!;
      const view: ImageSource = {src: auditEvidenceUrl(detail.suggestion!.suggestion_id, image),
        title: source.sample.relative_path,
        width: source.sample.width, height: source.sample.height, sampleId: source.sample.sample_id, evidence: image,
        ...datasetImageAnnotations(source.dataset_format,source.sample,source.annotations)};
      return {view, filename:source.sample.relative_path,evidence: image};
    });
  }, [detail, sample.sample_id]);
  const mainImage = pictures[0]?.view || {src: detail?.suggestion?.analysis
    ? auditEvidenceUrl(detail.suggestion.suggestion_id, detail.suggestion.analysis.overview) : auditSampleImage(sample, taskId),
    title: '审计主图', width: sample.width, height: sample.height};
  const comparison = pictures[comparisonIndex + 1];
  return <><Modal title="图像审计详情" className="audit-dialog" header={false} onClose={onClose}>
    <header className="audit-dialog-head"><h2>图像审计详情</h2><IconButton icon="close" label="关闭图像审计详情" onClick={onClose} /></header>
    <div className="audit-dialog-body audit-analysis-sections">
      {resource.loading && <p role="status">正在读取审计结果…</p>}
      {resource.error && <p role="alert">{resource.error}</p>}
      <section data-audit-section="analysis"><h3>综合分析</h3>
        <p>{synthesis?.analysis_text || '暂无综合分析。'}</p></section>
      <section data-audit-section="conclusion"><h3>结论</h3>
        <p>{conclusion?.description || '暂无审计结论。'}</p>
        {detail?.source_current === false && <p>来源已变化，当前展示本次审计的冻结证据。</p>}
        {!!detail?.errors.length && <p>{detail.errors.join('；')}</p>}
      </section>
      <section data-audit-section="basis"><h3>判断依据</h3>
        {synthesis ? synthesis.basis.map((basis,index)=><p key={index}>{basis.text}</p>) : <p>暂无判断依据。</p>}
        {!!conclusion?.missing_evidence.length && <p>{conclusion.missing_evidence.join('；')}</p>}
        {!!conclusion?.conflicts.length && <p>{conclusion.conflicts.join('；')}</p>}
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
