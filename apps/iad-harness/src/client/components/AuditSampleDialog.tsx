import {Select} from './Select.js';
import {Button} from './Button.js';
import {IconButton} from './IconButton.js';
import React, {useMemo, useState} from 'react';
import type {AuditSampleDetail, AuditSampleItem} from '../../shared/domain.generated.js';
import {useResource} from '../useResource.js';
import {auditEvidenceUrl, auditImageIndex} from '../api.js';
import {Modal} from './Modal.js';
import {ImageViewer, type ImageSource} from './ImageViewer.js';
import {AnnotatedImagePair} from './AnnotatedImagePair.js';
import {AuditStatus, auditSampleImage} from './AuditSampleMedia.js';

export function AuditSampleDialog({sample, taskId, onClose}: {sample: AuditSampleItem; taskId: string; onClose(): void}) {
  const resource = useResource<AuditSampleDetail>(`/audit/jobs/${encodeURIComponent(sample.run_id)}/samples/${encodeURIComponent(sample.sample_id)}`);
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const [comparisonIndex, setComparisonIndex] = useState(0);
  const detail = resource.data, analysis = detail?.suggestion?.analysis;
  const imageIndex = useMemo(() => analysis ? auditImageIndex(analysis) : new Map(), [analysis]);
  const conclusion = analysis?.conclusion;
  const synthesis = conclusion && 'analysis_text' in conclusion ? conclusion : null;
  const pictures = useMemo(() => {
    if (!detail?.suggestion?.analysis) return [];
    const analysis = detail.suggestion.analysis, images = auditImageIndex(analysis);
    return analysis.image_sources.map(source => {
      const image = images.get(source.overview_evidence_id)!;
      const label = source.dataset_format === 'folder_classification'
        ? ({PASS: 'OK', FAIL: 'NG', UNCERTAIN: '未知'})[source.sample.quality_status]
        : [...new Set(source.annotations.map(annotation => annotation.raw_label))].join('、') || '未标注';
      const view: ImageSource = {src: auditEvidenceUrl(detail.suggestion!.suggestion_id, image),
        title: source.sample.sample_id === sample.sample_id ? '审计主图' : '对照图像',
        width: source.sample.width, height: source.sample.height, sampleId: source.sample.sample_id, evidence: image,
        annotationLayer: {kind: 'sample', sample: source.sample, annotations: source.annotations,
          maskUrls: Object.fromEntries(Object.entries(source.mask_evidence_ids).map(([id, evidenceId]) =>
            [id, auditEvidenceUrl(detail.suggestion!.suggestion_id, {evidence_id: evidenceId})]))}};
      return {view, label, evidence: image};
    });
  }, [detail, sample.sample_id]);
  const mainImage = pictures[0]?.view || {src: detail?.suggestion?.analysis
    ? auditEvidenceUrl(detail.suggestion.suggestion_id, detail.suggestion.analysis.overview) : auditSampleImage(sample, taskId),
    title: '审计主图', width: sample.width, height: sample.height};
  const comparison = pictures[comparisonIndex + 1];
  return <><Modal title="图像审计详情" className="audit-dialog" header={false} onClose={onClose}>
    <header className="audit-dialog-head"><h2>图像审计</h2><IconButton icon="close" label="关闭图像审计详情" onClick={onClose} /></header>
    <div className="audit-dialog-body audit-analysis-sections">
      {resource.loading && <p role="status">正在读取审计结果…</p>}
      {resource.error && <p role="alert">{resource.error}</p>}
      <section data-audit-section="analysis"><h3>综合分析</h3>
        <p>{synthesis?.analysis_text || '暂无综合分析。'}</p></section>
      <section data-audit-section="conclusion"><h3>结论</h3>
        <AuditStatus state={detail?.sample.audit_state || sample.audit_state} />
        <p>{conclusion?.description || '暂无审计结论。'}</p>
        {detail?.source_current === false && <p>来源已变化，当前展示本次审计的冻结证据。</p>}
        {!!detail?.errors.length && <p>{detail.errors.join('；')}</p>}
      </section>
      <section data-audit-section="basis"><h3>判断依据</h3>
        {synthesis ? <ul>{synthesis.basis.map((basis, index) => <li key={index}><p>{basis.text}</p>
          <div className="iad-actions">{pictures.filter(picture => basis.evidence_ids.some(id =>
            imageIndex.get(id)?.source_sha256 === picture.evidence.source_sha256)).map(picture =>
            <Button key={picture.evidence.evidence_id} onClick={() => setLightbox(picture.view)}>{picture.view.title}</Button>)}</div>
        </li>)}</ul> : <p>暂无判断依据。</p>}
        {!!conclusion?.missing_evidence.length && <p>{conclusion.missing_evidence.join('；')}</p>}
        {!!conclusion?.conflicts.length && <p>{conclusion.conflicts.join('；')}</p>}
      </section>
      <section data-audit-section="evidence"><h3>图像证据</h3>
        {pictures.length > 2 && <label className="iad-field">对照图像<Select aria-label="选择审计对照图像" value={comparisonIndex}
          onChange={event => setComparisonIndex(Number(event.target.value))}>
          {pictures.slice(1).map((picture, index) => <option key={picture.evidence.evidence_id} value={index}>对照 {index + 1}，{picture.label}</option>)}
        </Select></label>}
        <AnnotatedImagePair sources={[mainImage, comparison?.view || null]}
          labels={[`审计主图，${pictures[0]?.label || '未记录标注'}`, `对照图像，${comparison?.label || '暂无'}`]} onExpand={setLightbox} />
      </section>
    </div><footer className="audit-dialog-foot"><Button onClick={onClose}>关闭</Button></footer>
  </Modal>{lightbox && <ImageViewer image={lightbox} onClose={() => setLightbox(null)} />}</>;
}
