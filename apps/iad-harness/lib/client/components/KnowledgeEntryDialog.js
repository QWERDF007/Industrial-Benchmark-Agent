import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { v4 as uuid } from 'uuid';
import { Button } from './Button.js';
import { IconButton } from "./IconButton.js";
import { useEffect, useState } from 'react';
import { message, request } from '../api.js';
import { Modal } from './Modal.js';
import { KnowledgeCheckEvidence } from './KnowledgeCheckEvidence.js';
import { ImageViewer } from './ImageViewer.js';
import { PageTabs } from './layout/PageTabs.js';
export function KnowledgeEntryDialog({ versionId, checkId, onClose, onSaved }) {
    const [image, setImage] = useState(null);
    const [detail, setDetail] = useState(null);
    const [evidenceRole, setEvidenceRole] = useState('support');
    const [status, setStatus] = useState('pending'), [note, setNote] = useState('');
    const [saving, setSaving] = useState(false), [error, setError] = useState('');
    // Paging evidence must not discard an unsaved assessment.
    const reviewRevision = detail?.check.review.revision;
    useEffect(() => {
        if (detail) {
            setStatus(detail.check.review.status);
            setNote(detail.check.review.note);
        }
    }, [reviewRevision]);
    const open = (item) => setImage({
        src: `/api/iad/knowledge/evidence/${encodeURIComponent(versionId)}/${encodeURIComponent(item.image.evidence_id)}`,
        title: detail?.check.title || '知识证据', width: item.image.sent_size[0], height: item.image.sent_size[1], sampleId: item.sample_id, evidence: item.image
    });
    return _jsxs(_Fragment, { children: [_jsxs(Modal, { title: "\u77E5\u8BC6\u6761\u76EE\u8BE6\u60C5", className: "detail-modal knowledge-entry-dialog v46-app", header: false, onClose: () => { if (!saving)
                    onClose(); }, children: [_jsxs("header", { className: "modalheader", children: [_jsx("h2", { id: "kb-detail-title", children: detail?.check.title || '正在读取知识条目' }), _jsx(IconButton, { icon: "close", type: "button", id: "close-detail", label: "\u5173\u95ED\u77E5\u8BC6\u8BE6\u60C5", disabled: saving, onClick: onClose })] }), _jsxs("div", { className: "modalcontent", id: "entry-dialog", children: [detail && _jsxs(_Fragment, { children: [_jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "\u77E5\u8BC6\u7ED3\u8BBA" }), _jsx("p", { children: detail.check.criterion })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "\u5BF9\u8C61\u4E0E\u4F4D\u7F6E" }), _jsxs("p", { children: [detail.check.subject, "\uFF0C", detail.check.location] })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "\u5141\u8BB8\u53D8\u5316" }), _jsx("p", { children: detail.check.allowed_variations.join('；') || '未记录允许变化' })] })] }), _jsx("section", { className: "detail-section", children: _jsxs(PageTabs, { label: "\u77E5\u8BC6\u56FE\u50CF\u8BC1\u636E", items: [{ id: 'support', label: '支持证据' }, { id: 'counter', label: '反对证据' }], value: evidenceRole, onChange: setEvidenceRole, children: [_jsx("div", { hidden: evidenceRole !== 'support', children: _jsx(KnowledgeCheckEvidence, { versionId: versionId, checkId: checkId, role: "support", active: evidenceRole === 'support', onOpen: open, onLoaded: setDetail }) }), _jsx("div", { hidden: evidenceRole !== 'counter', children: _jsx(KnowledgeCheckEvidence, { versionId: versionId, checkId: checkId, role: "counter", active: evidenceRole === 'counter', onOpen: open }) })] }) }), detail && _jsxs(_Fragment, { children: [_jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "\u9002\u7528\u9650\u5236" }), _jsx("p", { children: [...detail.check.limitations, ...detail.check.support_limitations].join('；') || '未记录适用限制' })] }), _jsxs("section", { className: "detail-section detail-review", children: [_jsx("h3", { children: "\u4EBA\u5DE5\u6838\u5B9E" }), _jsx("div", { className: "knowledge-review-options", role: "radiogroup", "aria-label": "\u4EBA\u5DE5\u6838\u5B9E\u7ED3\u8BBA", children: [['pending', '待核实'], ['confirmed', '核实通过'], ['rejected', '驳回']].map(([value, label]) => _jsxs("label", { children: [_jsx("input", { type: "radio", name: "knowledge-review", value: value, checked: status === value, disabled: saving, onChange: () => setStatus(value) }), label] }, value)) }), _jsx("label", { className: "label", htmlFor: "review-note", children: "\u590D\u6838\u5907\u6CE8" }), _jsx("textarea", { className: "f textarea", id: "review-note", placeholder: "\u586B\u5199\u590D\u6838\u4F9D\u636E\uFF08\u53EF\u9009\uFF09", value: note, disabled: saving, onChange: event => setNote(event.target.value) })] })] }), error && _jsx("p", { role: "alert", children: error })] }), _jsx("footer", { className: "modalfooter", children: _jsxs("div", { className: "actions", children: [_jsx(Button, { id: "cancel-review", disabled: saving, onClick: onClose, children: "\u53D6\u6D88" }), _jsx(Button, { variant: "primary", id: "save-review", disabled: saving || !detail, onClick: async () => {
                                        if (!detail)
                                            return;
                                        setSaving(true);
                                        setError('');
                                        try {
                                            await request('/knowledge/check-review', { version_id: versionId, check_id: checkId, submission_id: uuid(),
                                                expected_revision: detail.check.review.revision, status, note });
                                            onSaved();
                                            onClose();
                                        }
                                        catch (error) {
                                            setError(message(error));
                                        }
                                        finally {
                                            setSaving(false);
                                        }
                                    }, children: saving ? '保存中…' : '保存' })] }) })] }), image && _jsx(ImageViewer, { image: image, onClose: () => setImage(null) })] });
}
