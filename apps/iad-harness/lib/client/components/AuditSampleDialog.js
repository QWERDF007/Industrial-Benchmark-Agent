import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from './Button.js';
import { ThumbnailCard } from './ThumbnailCard.js';
import { IconButton } from './IconButton.js';
import { useMemo, useState } from 'react';
import { useResource } from '../useResource.js';
import { auditEvidenceUrl, auditImageIndex } from '../api.js';
import { Modal } from './Modal.js';
import { ImageViewer } from './ImageViewer.js';
import { datasetImageAnnotations } from '../dataset-image-annotations.js';
import { auditSampleImage } from './AuditSampleMedia.js';
export function AuditSampleDialog({ sample, taskId, onClose }) {
    const resource = useResource(`/audit/jobs/${encodeURIComponent(sample.run_id)}/samples/${encodeURIComponent(sample.sample_id)}`);
    const [lightbox, setLightbox] = useState(null);
    const [comparisonIndex, setComparisonIndex] = useState(0);
    const detail = resource.data, analysis = detail?.suggestion?.analysis;
    const conclusion = analysis?.conclusion;
    const synthesis = conclusion && 'analysis_text' in conclusion ? conclusion : null;
    const pictures = useMemo(() => {
        if (!detail?.suggestion?.analysis)
            return [];
        const analysis = detail.suggestion.analysis, images = auditImageIndex(analysis);
        return analysis.image_sources.map(source => {
            const image = images.get(source.overview_evidence_id);
            const view = { src: auditEvidenceUrl(detail.suggestion.suggestion_id, image),
                title: source.sample.relative_path,
                width: source.sample.width, height: source.sample.height, sampleId: source.sample.sample_id, evidence: image,
                ...datasetImageAnnotations(source.dataset_format, source.sample, source.annotations) };
            return { view, filename: source.sample.relative_path, evidence: image };
        });
    }, [detail, sample.sample_id]);
    const mainImage = pictures[0]?.view || { src: detail?.suggestion?.analysis
            ? auditEvidenceUrl(detail.suggestion.suggestion_id, detail.suggestion.analysis.overview) : auditSampleImage(sample, taskId),
        title: '审计主图', width: sample.width, height: sample.height };
    const comparison = pictures[comparisonIndex + 1];
    return _jsxs(_Fragment, { children: [_jsxs(Modal, { title: "\u56FE\u50CF\u5BA1\u8BA1\u8BE6\u60C5", className: "audit-dialog", header: false, onClose: onClose, children: [_jsxs("header", { className: "audit-dialog-head", children: [_jsx("h2", { children: "\u56FE\u50CF\u5BA1\u8BA1\u8BE6\u60C5" }), _jsx(IconButton, { icon: "close", label: "\u5173\u95ED\u56FE\u50CF\u5BA1\u8BA1\u8BE6\u60C5", onClick: onClose })] }), _jsxs("div", { className: "audit-dialog-body audit-analysis-sections", children: [resource.loading && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5BA1\u8BA1\u7ED3\u679C\u2026" }), resource.error && _jsx("p", { role: "alert", children: resource.error }), _jsxs("section", { "data-audit-section": "analysis", children: [_jsx("h3", { children: "\u7EFC\u5408\u5206\u6790" }), _jsx("p", { children: synthesis?.analysis_text || '暂无综合分析。' })] }), _jsxs("section", { "data-audit-section": "conclusion", children: [_jsx("h3", { children: "\u7ED3\u8BBA" }), _jsx("p", { children: conclusion?.description || '暂无审计结论。' }), detail?.source_current === false && _jsx("p", { children: "\u6765\u6E90\u5DF2\u53D8\u5316\uFF0C\u5F53\u524D\u5C55\u793A\u672C\u6B21\u5BA1\u8BA1\u7684\u51BB\u7ED3\u8BC1\u636E\u3002" }), !!detail?.errors.length && _jsx("p", { children: detail.errors.join('；') })] }), _jsxs("section", { "data-audit-section": "basis", children: [_jsx("h3", { children: "\u5224\u65AD\u4F9D\u636E" }), synthesis ? synthesis.basis.map((basis, index) => _jsx("p", { children: basis.text }, index)) : _jsx("p", { children: "\u6682\u65E0\u5224\u65AD\u4F9D\u636E\u3002" }), !!conclusion?.missing_evidence.length && _jsx("p", { children: conclusion.missing_evidence.join('；') }), !!conclusion?.conflicts.length && _jsx("p", { children: conclusion.conflicts.join('；') })] }), _jsxs("section", { "data-audit-section": "evidence", children: [_jsx("h3", { children: "\u56FE\u50CF\u8BC1\u636E" }), _jsx("div", { className: "iad-image-pair", children: [{ view: mainImage, filename: pictures[0]?.filename || sample.filename }, comparison].filter(Boolean).map((picture, index) => _jsx("section", { className: "iad-image-pair-side audit-evidence-item", children: _jsx(ThumbnailCard, { image: picture.view, label: picture.filename, variant: "evidence", "aria-label": index === 0 ? '放大主图' : '放大对照图像', onClick: () => setLightbox(picture.view) }) }, picture.view.src)) }), pictures.length > 1 && _jsx("div", { className: "iad-thumbnail-strip", role: "group", "aria-label": "\u5207\u6362\u5019\u9009\u56FE\u50CF", children: pictures.slice(1).map((picture, index) => _jsx(ThumbnailCard, { image: picture.view, variant: "compact", label: picture.filename, title: picture.filename, "aria-label": `切换为候选图像 ${picture.filename}`, "aria-pressed": comparisonIndex === index, onClick: () => setComparisonIndex(index) }, picture.evidence.evidence_id)) })] })] }), _jsx("footer", { className: "audit-dialog-foot", children: _jsx(Button, { onClick: onClose, children: "\u5173\u95ED" }) })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
}
