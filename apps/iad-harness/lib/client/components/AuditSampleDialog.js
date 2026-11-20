import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { conflictCategoryLabels } from '../../shared/consistency.parameters.generated.js';
import { auditAssessmentLabels, auditIssueLabels } from '../../shared/audit.generated.js';
import { Button } from './Button.js';
import { ThumbnailCard } from './ThumbnailCard.js';
import { AnnotatedImageStage } from './AnnotatedImageStage.js';
import { IconButton } from './IconButton.js';
import { useMemo } from 'react';
import { useResource } from '../useResource.js';
import { nativeAuditEvidenceUrl } from '../api.js';
import { Modal } from './Modal.js';
import { ImageGalleryViewer } from './ImageGalleryViewer.js';
import { datasetImageAnnotations } from '../dataset-image-annotations.js';
import { auditSampleImage } from './AuditSampleMedia.js';
export function AuditSampleDialog({ sample, taskId, imageIndex, onImageIndexChange, navigation, onClose }) {
    const resource = useResource(`/audit/jobs/${encodeURIComponent(sample.run_id)}/samples/${encodeURIComponent(sample.sample_id)}`);
    const detail = resource.data;
    const upstream = detail?.upstream_conclusion?.summary;
    const modelConclusion = upstream?.model_conclusion;
    const upstreamTitle = upstream ? (modelConclusion ? `模型：${modelConclusion === '无冲突' ? '一致' : conflictCategoryLabels[modelConclusion]} - 程序：${upstream.program_conclusion}`
        : upstream.identity_model_reviewed && upstream.reason === 'NO_ELIGIBLE_CANDIDATES' ? '模型：无有效候选' : `程序：${upstream.program_conclusion}`) : '';
    const pictures = useMemo(() => {
        return [...(detail?.evidence || []).filter(item => item.image.role === 'overview' && item.image.representation === 'raw')].sort((left, right) => Number(right.sample_id === sample.sample_id) - Number(left.sample_id === sample.sample_id)).map(item => {
            const record = item.source, image = item.image;
            const view = { src: nativeAuditEvidenceUrl(sample.run_id, sample.sample_id, image),
                title: record?.sample.relative_path ?? item.sample_id.slice(item.sample_id.indexOf(':') + 1),
                width: image.original_size[0], height: image.original_size[1], sampleId: item.sample_id, evidence: image,
                ...(record ? datasetImageAnnotations(record.dataset_format, record.sample, record.annotations) : {}) };
            return { view, evidence: image };
        });
    }, [detail, sample.run_id, sample.sample_id]);
    const mainImage = pictures[0]?.view || { src: auditSampleImage(sample, taskId),
        title: sample.filename, width: sample.width, height: sample.height, sampleId: sample.sample_id,
        ...(detail?.registration ? datasetImageAnnotations(detail.registration.dataset_format, detail.registration.sample, detail.registration.annotations) : {}) };
    const images = pictures.length ? pictures.map(picture => picture.view) : [mainImage];
    return _jsxs(_Fragment, { children: [_jsxs(Modal, { title: "\u56FE\u50CF\u5BA1\u8BA1\u8BE6\u60C5", className: "audit-dialog", header: false, onClose: onClose, children: [_jsxs("header", { className: "audit-dialog-head", children: [_jsx("h2", { children: "\u56FE\u50CF\u5BA1\u8BA1\u8BE6\u60C5" }), _jsx(IconButton, { icon: "close", label: "\u5173\u95ED\u56FE\u50CF\u5BA1\u8BA1\u8BE6\u60C5", onClick: onClose })] }), _jsxs("div", { className: "audit-dialog-body audit-analysis-sections", children: [resource.loading && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5BA1\u8BA1\u7ED3\u679C\u2026" }), resource.error && _jsx("p", { role: "alert", children: resource.error }), _jsx("div", { className: "dc-compare", "data-audit-section": "images", style: { gridTemplateColumns: 'minmax(0,1fr)' }, children: _jsx("div", { className: "dc-compare-cell", children: _jsx("div", { className: "dc-compare-photo", role: "button", tabIndex: 0, "aria-label": "\u653E\u5927\u4E3B\u56FE", title: mainImage.title, onClick: () => onImageIndexChange(0), onKeyDown: event => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                onImageIndexChange(0);
                                            }
                                        }, children: _jsx(AnnotatedImageStage, { sampleId: mainImage.sampleId, src: mainImage.src, alt: mainImage.title, width: mainImage.width, height: mainImage.height, annotationLayer: 'annotationLayer' in mainImage ? mainImage.annotationLayer : undefined, qualityLabel: 'qualityLabel' in mainImage ? mainImage.qualityLabel : undefined }) }) }) }), pictures.length > 1 && _jsxs("section", { className: "dc-images-panel", "data-audit-section": "references", "aria-label": "\u53C2\u8003\u56FE", children: [_jsx("h3", { children: "\u53C2\u8003\u56FE" }), _jsx("div", { className: "iad-thumbnail-grid", "aria-label": "\u53C2\u8003\u56FE\u50CF\u8BC1\u636E", children: pictures.slice(1).map((picture, index) => _jsx(ThumbnailCard, { image: picture.view, label: `参考证据 ${index + 1}`, title: `参考证据 ${index + 1}`, "aria-label": `放大参考证据 ${index + 1}`, onClick: () => onImageIndexChange(index + 1) }, picture.evidence.evidence_id)) })] }), _jsxs("section", { className: "dc-fact-panel", "data-audit-section": "conclusion", children: [_jsx("h3", { children: "\u5224\u5B9A\u7ED3\u8BBA" }), _jsx("p", { children: upstreamTitle || detail?.final?.conclusion || '' }), !!detail?.errors.length && _jsx("p", { children: detail.errors.join('；') })] }), detail?.upstream_conclusion && _jsxs("section", { className: "dc-analysis-panel", children: [_jsx("h3", { children: "\u4E0A\u6E38\u4E00\u81F4\u6027\u7ED3\u8BBA" }), _jsx("p", { children: "\u5F15\u7528\u6570\u636E\u4E00\u81F4\u6027\u4F5C\u4E1A\u7684\u5DF2\u5B8C\u6210\u7ED3\u679C\u3002" }), detail.upstream_conclusion.result.issues.map(issue => _jsxs("p", { children: [auditIssueLabels[issue.type], "\uFF1A", issue.description] }, issue.issue_id))] }), !detail?.upstream_conclusion && _jsxs("section", { className: "dc-analysis-panel", "data-audit-section": "analysis", children: [_jsx("h3", { children: "\u6A21\u578B\u5206\u6790" }), _jsx("p", { children: detail?.final?.analysis || '' }), !!detail?.final?.findings.length && _jsx("ol", { children: detail.final.findings.map(finding => _jsxs("li", { "data-finding-id": finding.finding_id, children: [_jsxs("p", { children: ['type' in finding ? auditIssueLabels[finding.type] + '：' : '', finding.location, "\uFF1A", finding.description] }), _jsx("p", { children: finding.normal_explanation }), !!finding.limitations.length && _jsx("p", { children: finding.limitations.join('；') })] }, finding.finding_id)) }), detail?.final && 'consistency_review' in detail.final && detail.final.consistency_review.map(review => _jsxs("p", { children: [auditAssessmentLabels[review.assessment], "\uFF1A", review.reason] }, review.source_issue_id)), detail?.final?.check_assessments.filter(check => check.status === 'deviates' || check.status === 'unobservable' || detail.final.findings.some(finding => finding.check_ids.includes(check.check_id)))
                                        .map(check => _jsxs("p", { children: [detail.knowledge?.entries.find(item => item.check.check_id === check.check_id)?.check.title || '知识条目', "\uFF1A", check.description] }, check.check_id)), detail?.final && 'observations' in detail.final && detail.final.observations.map((item, index) => _jsxs("p", { children: ["\u89C2\u5BDF\uFF1A", item.description] }, index)), !!detail?.final?.limitations.length && _jsx("p", { children: detail.final.limitations.join('；') })] })] }), _jsx("footer", { className: "audit-dialog-foot", children: _jsx(Button, { onClick: onClose, children: "\u5173\u95ED" }) })] }), _jsx(ImageGalleryViewer, { images: images, current: imageIndex, onChange: onImageIndexChange, navigation: images.length === 1 ? navigation : undefined })] });
}
