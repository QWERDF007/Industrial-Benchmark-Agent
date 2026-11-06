import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { v4 as uuid } from 'uuid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConsistencyView } from '../consistency-view.js';
import { useGroupAnalysis } from '../useGroupAnalysis.js';
import { useResource } from '../useResource.js';
import { message, request } from '../api.js';
import { annotationSummary } from '../../shared/consistency-presentation.js';
import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { IconButton } from './IconButton.js';
import { ThumbnailCard } from './ThumbnailCard.js';
import { AnnotatedImageStage } from './AnnotatedImageStage.js';
import { FullscreenViewer } from './FullscreenViewer.js';
function OriginalAnnotationLabel({ source }) {
    if (!source)
        return null;
    const categories = [...new Set(source.annotations.annotations.map(annotation => annotation.raw_label))];
    const label = categories.join('、') || ({ PASS: 'OK', FAIL: 'NG', UNCERTAIN: '未标注' })[source.sample.quality_status];
    return _jsxs("span", { className: "dc-source-label", title: `原始标注 ${label}`, children: ["\u539F\u59CB\u6807\u6CE8 ", label] });
}
export function ConsistencyConflictDialog({ conflict: currentConflict, items: visibleConflicts, queryId: activeQueryId, onSelect, onClose, onReviewed }) {
    const currentConflictId = currentConflict.id;
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [conflictMembers, setConflictMembers] = useState([]);
    const [membersError, setMembersError] = useState('');
    const [reviewBusy, setReviewBusy] = useState(false);
    const [reviewLoaded, setReviewLoaded] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const pendingReview = useRef(null);
    const [reviewDecision, setReviewDecision] = useState('pending');
    const [reviewNote, setReviewNote] = useState('');
    const [zoomItem, setZoomItem] = useState(null);
    const groupReference = useMemo(() => activeQueryId ? {
        query_id: activeQueryId, kind: 'conflicts', group_id: currentConflict.rawItem.group_id, facts_state: currentConflict.rawItem.facts_state
    } : null, [currentConflict.rawItem.group_id, currentConflict.rawItem.facts_state, activeQueryId]);
    const groupAnalysis = useGroupAnalysis(groupReference);
    useEffect(() => {
        const controller = new AbortController();
        setConflictMembers([]);
        setMembersError('');
        setCandidateIndex(0);
        if (!groupReference)
            return;
        ConsistencyView.members(groupReference, controller.signal)
            .then(items => { if (!controller.signal.aborted)
            setConflictMembers(items); })
            .catch(error => { if (!controller.signal.aborted)
            setMembersError(message(error)); });
        return () => controller.abort();
    }, [groupReference]);
    const selectedMember = conflictMembers[candidateIndex] || null;
    const currentCandidate = useMemo(() => {
        const image = selectedMember?.image;
        return { sampleId: image?.sample.sample_id || '', filename: image?.sample.relative_path.split('/').pop() || '',
            thumbUrl: image ? ConsistencyView.media(image, true) : '', fullUrl: image ? ConsistencyView.media(image) : '',
            width: image?.sample.width, height: image?.sample.height };
    }, [selectedMember]);
    const compared = useResource(selectedMember?.comparison ?
        `/consistency/evidence/${encodeURIComponent(selectedMember.comparison.evidence_id)}` : null);
    const anchorSide = selectedMember?.comparison?.anchor_side;
    const anchorSource = anchorSide ? compared.data?.sources[anchorSide] : null;
    const candidateSource = anchorSide ? compared.data?.sources[anchorSide === 'left' ? 'right' : 'left'] : null;
    const anchorBboxes = anchorSource?.annotations.annotations.filter(annotation => annotation.bbox && annotation.geometry_status !== 'INVALID') || [];
    const candidateBboxes = candidateSource?.annotations.annotations.filter(annotation => annotation.bbox && annotation.geometry_status !== 'INVALID') || [];
    const readReview = useCallback(async (signal) => {
        if (!selectedMember?.comparison)
            return;
        const context = await request('/consistency/review/context', { evidence_id: selectedMember.comparison.evidence_id }, undefined, signal);
        if (signal?.aborted)
            return;
        const latest = context.decisions.at(-1), action = latest?.request.action.kind;
        const decision = action === 'CONFIRM_DIFFERENCE' ? 'confirmed' : action === 'REJECT_DIFFERENCE' ? 'rejected' : 'pending';
        setReviewDecision(decision);
        setReviewNote(latest?.request.comment || '');
        setReviewLoaded(true);
    }, [selectedMember?.comparison?.evidence_id, currentConflictId]);
    useEffect(() => {
        const controller = new AbortController();
        setReviewLoaded(false);
        setReviewError('');
        setReviewDecision('pending');
        setReviewNote('');
        pendingReview.current = null;
        void readReview(controller.signal).catch(error => { if (!controller.signal.aborted)
            setReviewError(message(error)); });
        return () => controller.abort();
    }, [readReview]);
    const handlePrevConflict = useCallback(() => {
        const list = visibleConflicts;
        const idx = list.findIndex(c => c.id === currentConflictId);
        if (idx > 0) {
            const prev = list[idx - 1];
            onSelect(prev.id);
            setCandidateIndex(0);
            setReviewDecision(prev.review);
            setReviewNote('');
        }
    }, [visibleConflicts, currentConflictId, onSelect]);
    const handleNextConflict = useCallback(() => {
        const list = visibleConflicts;
        const idx = list.findIndex(c => c.id === currentConflictId);
        if (idx >= 0 && idx < list.length - 1) {
            const next = list[idx + 1];
            onSelect(next.id);
            setCandidateIndex(0);
            setReviewDecision(next.review);
            setReviewNote('');
        }
    }, [visibleConflicts, currentConflictId, onSelect]);
    const handleSaveReview = async () => {
        if (!compared.data || reviewBusy || !reviewLoaded)
            return;
        if (reviewDecision === 'pending' && !reviewNote.trim()) {
            onClose();
            return;
        }
        if (!reviewNote.trim()) {
            setReviewError('请填写复核依据');
            return;
        }
        const [firstDifference, ...otherDifferences] = compared.data.result.annotation.differences;
        if (!firstDifference) {
            setReviewError('当前比较没有可复核的差异');
            return;
        }
        setReviewBusy(true);
        setReviewError('');
        try {
            if (!pendingReview.current)
                pendingReview.current = { client_request_id: uuid(),
                    evidence_id: compared.data.result.evidence_id, result_id: compared.data.result.result_id,
                    difference_ids: [firstDifference.difference_id, ...otherDifferences.map(item => item.difference_id)],
                    reviewer: localStorage.getItem('iad.reviewer') || 'auditor_qc', comment: reviewNote.trim(),
                    action: { kind: reviewDecision === 'confirmed' ? 'CONFIRM_DIFFERENCE' : reviewDecision === 'rejected' ? 'REJECT_DIFFERENCE' : 'NEEDS_CONTEXT' } };
            await request('/consistency/review/submit', pendingReview.current);
            await readReview();
            pendingReview.current = null;
            onClose();
            onReviewed();
        }
        catch (error) {
            setReviewError(message(error));
        }
        finally {
            setReviewBusy(false);
        }
    };
    return _jsxs(_Fragment, { children: [_jsxs(Modal, { title: "\u6807\u6CE8\u51B2\u7A81\u5BF9\u6BD4", id: "dc-compare-mask", className: "dc-dialog dc-conflict-dialog", header: false, onClose: onClose, children: [_jsxs("header", { className: "dc-dialog-head", children: [_jsx("h2", { id: "dc-dialog-title", children: "\u6807\u6CE8\u51B2\u7A81\u5BF9\u6BD4" }), _jsxs("div", { className: "dc-dialog-head-actions", children: [_jsx(Button, { type: "button", onClick: handlePrevConflict, children: "\u4E0A\u4E00\u7EC4" }), _jsx(Button, { type: "button", onClick: handleNextConflict, children: "\u4E0B\u4E00\u7EC4" }), _jsx(IconButton, { icon: "close", type: "button", title: "\u5173\u95ED", label: "\u5173\u95ED", onClick: onClose })] })] }), _jsxs("div", { className: "dc-dialog-body", children: [_jsxs("div", { className: "dc-compare", children: [_jsxs("div", { className: "dc-compare-cell", children: [_jsx("h3", { className: "dc-compare-title", children: "\u4E3B\u56FE" }), _jsxs("div", { className: "dc-compare-photo", role: "button", tabIndex: 0, "data-dc": "zoom-anchor", "aria-label": "\u67E5\u770B\u4E3B\u56FE\u5927\u56FE", title: "\u70B9\u51FB\u67E5\u770B\u5927\u56FE", onClick: () => setZoomItem({
                                                    id: currentConflict.id + '_anchor',
                                                    title: currentConflict.filename,
                                                    imageUrl: currentConflict.fullUrl || currentConflict.url,
                                                    width: currentConflict.sourceWidth,
                                                    height: currentConflict.sourceHeight,
                                                    bboxes: anchorBboxes,
                                                }), onKeyDown: e => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        setZoomItem({
                                                            id: currentConflict.id + '_anchor',
                                                            title: currentConflict.filename,
                                                            imageUrl: currentConflict.fullUrl || currentConflict.url,
                                                            width: currentConflict.sourceWidth,
                                                            height: currentConflict.sourceHeight,
                                                            bboxes: anchorBboxes,
                                                        });
                                                    }
                                                }, children: [_jsx(AnnotatedImageStage, { src: currentConflict.fullUrl || currentConflict.url, alt: "\u4E3B\u56FE", width: currentConflict.sourceWidth, height: currentConflict.sourceHeight, bboxes: anchorBboxes }), _jsx(OriginalAnnotationLabel, { source: anchorSource })] }), _jsx("div", { className: "dc-photo-filename", title: currentConflict.filename, children: currentConflict.filename })] }), _jsxs("div", { className: "dc-compare-cell", children: [_jsx("h3", { className: "dc-compare-title", children: "\u5BF9\u7167\u56FE\u50CF" }), _jsxs("div", { className: "dc-compare-photo", role: "button", tabIndex: 0, "data-dc": "zoom-candidate", "aria-label": "\u67E5\u770B\u5019\u9009\u56FE\u5927\u56FE", title: "\u70B9\u51FB\u67E5\u770B\u5927\u56FE", onClick: () => setZoomItem({
                                                    id: currentConflict.id + '_candidate_' + candidateIndex,
                                                    title: `${currentCandidate.filename} (候选图 ${candidateIndex + 1})`,
                                                    imageUrl: currentCandidate.fullUrl,
                                                    width: currentCandidate.width,
                                                    height: currentCandidate.height,
                                                    bboxes: candidateBboxes,
                                                }), onKeyDown: e => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        setZoomItem({
                                                            id: currentConflict.id + '_candidate_' + candidateIndex,
                                                            title: `${currentCandidate.filename} (候选图 ${candidateIndex + 1})`,
                                                            imageUrl: currentCandidate.fullUrl,
                                                            width: currentCandidate.width,
                                                            height: currentCandidate.height,
                                                            bboxes: candidateBboxes,
                                                        });
                                                    }
                                                }, children: [selectedMember && _jsx(AnnotatedImageStage, { src: currentCandidate.fullUrl || currentCandidate.thumbUrl, alt: "\u5019\u9009\u56FE", width: currentCandidate.width, height: currentCandidate.height, bboxes: candidateBboxes }), _jsx(OriginalAnnotationLabel, { source: candidateSource })] }), _jsx("div", { className: "dc-photo-filename", title: currentCandidate.filename, children: currentCandidate.filename })] })] }), _jsx("div", { className: "iad-thumbnail-strip", "aria-label": "\u5207\u6362\u51B2\u7A81\u56FE\u50CF", children: conflictMembers.map((m, i) => {
                                    const s = m.image.sample;
                                    const thumb = ConsistencyView.media(m.image, true);
                                    return (_jsx(ThumbnailCard, { src: thumb, variant: "compact", label: `候选 ${i + 1}`, "data-dc": "candidate", "data-id": i, "aria-pressed": i === candidateIndex, onClick: () => setCandidateIndex(i) }, s.sample_id || i));
                                }) }), membersError && _jsx("p", { role: "alert", className: "iad-error", children: membersError }), compared.error && _jsx("p", { role: "alert", className: "iad-error", children: compared.error }), _jsxs("section", { className: "dc-fact-panel", "aria-label": "\u5224\u5B9A\u7ED3\u8BBA", children: [_jsx("h3", { children: "\u5224\u5B9A\u7ED3\u8BBA" }), _jsx("span", { className: "dc-verdict-value", children: currentConflict.type }), _jsx("p", { className: "dc-verdict-description", children: compared.data ? annotationSummary(compared.data.result.annotation) : compared.error || '正在读取冻结比较记录…' })] }), _jsxs("section", { className: "dc-model-panel", "aria-label": "\u6A21\u578B\u5206\u6790", children: [_jsx("h3", { children: "\u6A21\u578B\u5206\u6790" }), _jsx("p", { children: groupAnalysis.error || groupAnalysis.analysis?.error || groupAnalysis.analysis?.result?.conclusions.map(item => item.text).join('\n') || '暂无已保存的模型分析结果。' })] }), _jsxs("section", { className: "dc-conclusion-panel", "aria-label": "\u6A21\u578B\u7ED3\u8BBA", children: [_jsx("h3", { children: "\u6A21\u578B\u7ED3\u8BBA" }), _jsx("span", { className: "dc-verdict-value", children: groupAnalysis.analysis?.result?.overall.text || currentConflict.model.modelType }), _jsx("p", { className: "dc-verdict-description", children: groupAnalysis.analysis?.result?.overall.text || groupAnalysis.error || groupAnalysis.analysis?.error || '暂无已保存的模型结论。' })] }), _jsxs("section", { className: "dc-review-panel", "aria-label": "\u4EBA\u5DE5\u590D\u6838", children: [_jsx("h3", { children: "\u4EBA\u5DE5\u590D\u6838" }), _jsxs("div", { className: "dc-decision-controls", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", disabled: reviewBusy || !reviewLoaded || !!pendingReview.current, name: "dc-review", value: "pending", checked: reviewDecision === 'pending', onChange: () => setReviewDecision('pending') }), "\u5F85\u786E\u8BA4"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", disabled: reviewBusy || !reviewLoaded || !!pendingReview.current, name: "dc-review", value: "confirmed", checked: reviewDecision === 'confirmed', onChange: () => setReviewDecision('confirmed') }), "\u786E\u8BA4\u51B2\u7A81"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", disabled: reviewBusy || !reviewLoaded || !!pendingReview.current, name: "dc-review", value: "rejected", checked: reviewDecision === 'rejected', onChange: () => setReviewDecision('rejected') }), "\u6392\u9664\u51B2\u7A81"] })] }), reviewError && _jsx("p", { role: "alert", className: "iad-error", children: reviewError }), _jsx("textarea", { disabled: reviewBusy || !reviewLoaded || !!pendingReview.current, className: "dc-note", id: "dc-note", placeholder: "\u590D\u6838\u8BF4\u660E\uFF08\u53EF\u9009\uFF09", value: reviewNote, onChange: e => setReviewNote(e.target.value) })] })] }), _jsxs("footer", { className: "dc-dialog-footer", children: [_jsx(Button, { type: "button", onClick: () => onClose(), children: "\u53D6\u6D88" }), _jsx(Button, { variant: "primary", type: "button", disabled: reviewBusy || !reviewLoaded || !compared.data, onClick: handleSaveReview, children: "\u4FDD\u5B58\u590D\u6838" })] })] }), _jsx(FullscreenViewer, { open: !!zoomItem, item: zoomItem, onClose: () => setZoomItem(null) })] });
}
