import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from './Button.js';
import { ThumbnailCard } from './ThumbnailCard.js';
import { IconButton } from './IconButton.js';
import { useMemo, useState } from 'react';
import { useResource } from '../useResource.js';
import { nativeAuditEvidenceUrl } from '../api.js';
import { useWorkspace } from '../workspace.js';
import { Modal } from './Modal.js';
import { ImageViewer } from './ImageViewer.js';
import { datasetImageAnnotations } from '../dataset-image-annotations.js';
import { auditSampleImage } from './AuditSampleMedia.js';
export function AuditSampleDialog({ sample, taskId, onClose }) {
    const { workspace } = useWorkspace();
    const resource = useResource(`/audit/jobs/${encodeURIComponent(sample.run_id)}/samples/${encodeURIComponent(sample.sample_id)}`);
    const [lightbox, setLightbox] = useState(null);
    const [comparisonIndex, setComparisonIndex] = useState(0);
    const detail = resource.data;
    const pictures = useMemo(() => {
        return [...(detail?.evidence || [])].sort((left, right) => Number(right.sample_id === sample.sample_id && right.image.role === 'overview') - Number(left.sample_id === sample.sample_id && left.image.role === 'overview')).map(item => {
            const record = item.source, image = item.image;
            const filename = record?.sample.relative_path || item.sample_id.slice(item.sample_id.indexOf(':') + 1);
            const view = { src: nativeAuditEvidenceUrl(sample.run_id, sample.sample_id, image), title: filename,
                width: image.original_size[0], height: image.original_size[1], sampleId: item.sample_id, evidence: image,
                ...(record ? datasetImageAnnotations(record.dataset_format, record.sample, record.annotations) : {}) };
            return { view, filename, evidence: image };
        });
    }, [detail, sample.run_id, sample.sample_id]);
    const mainImage = pictures[0]?.view || { src: auditSampleImage(sample, taskId),
        title: sample.filename, width: sample.width, height: sample.height };
    const comparison = pictures[comparisonIndex + 1];
    return _jsxs(_Fragment, { children: [_jsxs(Modal, { title: "\u56FE\u50CF\u5BA1\u8BA1\u8BE6\u60C5", className: "audit-dialog", header: false, onClose: onClose, children: [_jsxs("header", { className: "audit-dialog-head", children: [_jsx("h2", { children: "\u56FE\u50CF\u5BA1\u8BA1\u8BE6\u60C5" }), _jsx(IconButton, { icon: "close", label: "\u5173\u95ED\u56FE\u50CF\u5BA1\u8BA1\u8BE6\u60C5", onClick: onClose })] }), _jsxs("div", { className: "audit-dialog-body audit-analysis-sections", children: [resource.loading && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5BA1\u8BA1\u7ED3\u679C\u2026" }), resource.error && _jsx("p", { role: "alert", children: resource.error }), _jsxs("section", { "data-audit-section": "analysis", children: [_jsx("h3", { children: "\u7EFC\u5408\u5206\u6790" }), _jsx("p", { children: detail?.final?.analysis || '暂无综合分析。' })] }), _jsxs("section", { "data-audit-section": "conclusion", children: [_jsx("h3", { children: "\u7ED3\u8BBA" }), _jsx("p", { children: detail?.final?.conclusion || '暂无审计结论。' }), !!detail?.errors.length && _jsx("p", { children: detail.errors.join('；') })] }), _jsxs("section", { "data-audit-section": "basis", children: [_jsx("h3", { children: "\u5224\u65AD\u4F9D\u636E" }), detail?.final ? detail.final.basis.map((basis, index) => _jsx("p", { children: basis }, index)) : _jsx("p", { children: "\u6682\u65E0\u5224\u65AD\u4F9D\u636E\u3002" }), !!detail?.final?.findings.length && _jsx("ol", { children: detail.final.findings.map(finding => _jsxs("li", { "data-finding-id": finding.finding_id, children: [_jsxs("p", { children: [finding.location, "\uFF1A", finding.description] }), _jsx("p", { children: finding.normal_explanation }), !!finding.limitations.length && _jsx("p", { children: finding.limitations.join('；') })] }, finding.finding_id)) }), detail?.final?.check_assessments.map(check => _jsxs("p", { children: [check.check_id, "\uFF1A", check.description] }, check.check_id)), !!detail?.final?.limitations.length && _jsx("p", { children: detail.final.limitations.join('；') }), detail && _jsxs(_Fragment, { children: [_jsxs("details", { children: [_jsx("summary", { children: "\u672C\u56FE\u4E00\u81F4\u6027\u7ED3\u679C" }), _jsx("p", { children: detail.consistency.conclusion }), detail.consistency.result?.reason === 'MODEL_REVIEWED' && _jsxs(_Fragment, { children: [_jsx("p", { children: detail.consistency.result.overall.text }), detail.consistency.result.conclusions.map((item, index) => _jsx("p", { children: item.text }, index)), !!detail.consistency.result.limitations.length && _jsx("p", { children: detail.consistency.result.limitations.join('；') })] }), _jsx("a", { href: detail.consistency.result_ref, target: "_blank", rel: "noreferrer", children: "\u67E5\u770B\u5B8C\u6574\u4E00\u81F4\u6027\u8BB0\u5F55" })] }), _jsxs("p", { children: [detail.knowledge && _jsx("button", { type: "button", onClick: () => {
                                                            onClose();
                                                            workspace.openLocation({ pageId: 'industrial-knowledge', datasetId: sample.dataset_id,
                                                                version: detail.knowledge.selection.version_id, job: detail.knowledge.selection.job_id });
                                                        }, children: "\u67E5\u770B\u6240\u9009\u77E5\u8BC6\u7248\u672C" }), sample.session_id && _jsx("a", { href: `/api/iad/audit/jobs/${encodeURIComponent(sample.run_id)}/samples/${encodeURIComponent(sample.sample_id)}/session.jsonl`, download: true, children: "\u4E0B\u8F7D\u672C\u56FE Session" })] })] })] }), _jsxs("section", { "data-audit-section": "evidence", children: [_jsx("h3", { children: "\u56FE\u50CF\u8BC1\u636E" }), _jsx("div", { className: "iad-image-pair", children: [{ view: mainImage, filename: pictures[0]?.filename || sample.filename }, comparison].filter(Boolean).map((picture, index) => _jsx("section", { className: "iad-image-pair-side audit-evidence-item", children: _jsx(ThumbnailCard, { image: picture.view, label: picture.filename, variant: "evidence", "aria-label": index === 0 ? '放大主图' : '放大对照图像', onClick: () => setLightbox(picture.view) }) }, picture.view.src)) }), pictures.length > 1 && _jsx("div", { className: "iad-thumbnail-strip", role: "group", "aria-label": "\u5207\u6362\u5019\u9009\u56FE\u50CF", children: pictures.slice(1).map((picture, index) => _jsx(ThumbnailCard, { image: picture.view, variant: "compact", label: picture.filename, title: picture.filename, "aria-label": `切换为候选图像 ${picture.filename}`, "aria-pressed": comparisonIndex === index, onClick: () => setComparisonIndex(index) }, picture.evidence.evidence_id)) })] })] }), _jsx("footer", { className: "audit-dialog-foot", children: _jsx(Button, { onClick: onClose, children: "\u5173\u95ED" }) })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
}
