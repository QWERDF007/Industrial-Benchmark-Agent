import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { conflictCategoryLabels, modelConclusionLabels } from '../../shared/consistency.parameters.generated.js';
import { datasetImageAnnotations } from '../dataset-image-annotations.js';
import { useDatasetCatalog } from '../useDatasetCatalog.js';
import { ConsistencyView } from '../consistency-view.js';
import { useGroupAnalysis } from '../useGroupAnalysis.js';
import { useResource } from '../useResource.js';
import { message } from '../api.js';
import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { IconButton } from './IconButton.js';
import { ThumbnailCard } from './ThumbnailCard.js';
import { AnnotatedImageStage } from './AnnotatedImageStage.js';
import { FullscreenViewer } from './FullscreenViewer.js';
import { ConsistencyGroupReviewForm } from './ConsistencyGroupReviewForm.js';
import { ConsistencyModelAnalysis } from './ConsistencyModelAnalysis.js';
export function ConsistencyConflictDialog({ conflict: currentConflict, items: visibleConflicts, onSelect, onClose, onReviewed }) {
    const currentConflictId = currentConflict.id;
    const catalog = useDatasetCatalog();
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [conflictMembers, setConflictMembers] = useState([]);
    const [membersError, setMembersError] = useState('');
    const [zoomItem, setZoomItem] = useState(null);
    const groupReference = currentConflict.reference;
    const jobId = 'job_id' in groupReference ? groupReference.job_id : undefined;
    const groupAnalysis = useGroupAnalysis(currentConflict.candidateCount ? groupReference : null);
    useEffect(() => {
        const controller = new AbortController();
        setConflictMembers([]);
        setMembersError('');
        setCandidateIndex(0);
        if (!currentConflict.candidateCount)
            return;
        ConsistencyView.members(groupReference, controller.signal)
            .then(items => { if (!controller.signal.aborted)
            setConflictMembers(items); })
            .catch(error => { if (!controller.signal.aborted)
            setMembersError(message(error)); });
        return () => controller.abort();
    }, [groupReference, currentConflict.candidateCount]);
    const selectedMember = conflictMembers[candidateIndex] || null;
    const modelResult = groupAnalysis.analysis?.status === 'COMPLETED' ? groupAnalysis.analysis.result : null;
    const candidates = useResource(jobId ?
        `/consistency/checks/${encodeURIComponent(jobId)}/anchors/${encodeURIComponent(currentConflictId)}/candidates` : null);
    const modelConclusion = ConsistencyView.modelConclusion(modelResult?.overall.text || currentConflict.model.modelType, modelResult?.overall.verdict);
    const displayModelConclusion = modelConclusion ? modelConclusionLabels[modelConclusion] : '';
    const groupConclusion = currentConflict.type;
    const displayGroupConclusion = groupConclusion in conflictCategoryLabels
        ? conflictCategoryLabels[groupConclusion] : groupConclusion;
    const currentCandidate = useMemo(() => {
        const image = selectedMember?.image;
        return { sampleId: image?.sample.sample_id || '', filename: image?.sample.relative_path.split('/').pop() || '',
            thumbUrl: image ? ConsistencyView.media(image, true) : '', fullUrl: image ? ConsistencyView.media(image) : '',
            width: image?.sample.width, height: image?.sample.height };
    }, [selectedMember]);
    const evidenceId = selectedMember?.comparison?.evidence_id || currentConflict.image?.evidence_id;
    const compared = useResource(evidenceId ? `/consistency/evidence/${encodeURIComponent(evidenceId)}` : null);
    const anchorSide = selectedMember?.comparison?.anchor_side || currentConflict.image?.side;
    const anchorSource = anchorSide ? compared.data?.sources[anchorSide] : null;
    const candidateSource = selectedMember && anchorSide ? compared.data?.sources[anchorSide === 'left' ? 'right' : 'left'] : null;
    const anchorAnnotations = anchorSource ? datasetImageAnnotations(catalog.data?.datasets.find(dataset => dataset.dataset_id === anchorSource.sample.dataset_id)?.format, anchorSource.sample, anchorSource.annotations.annotations) : {};
    const candidateAnnotations = candidateSource ? datasetImageAnnotations(catalog.data?.datasets.find(dataset => dataset.dataset_id === candidateSource.sample.dataset_id)?.format, candidateSource.sample, candidateSource.annotations.annotations) : {};
    const handlePrevConflict = useCallback(() => {
        const list = visibleConflicts;
        const idx = list.findIndex(c => c.id === currentConflictId);
        if (idx > 0) {
            const prev = list[idx - 1];
            onSelect(prev.id);
            setCandidateIndex(0);
        }
    }, [visibleConflicts, currentConflictId, onSelect]);
    const handleNextConflict = useCallback(() => {
        const list = visibleConflicts;
        const idx = list.findIndex(c => c.id === currentConflictId);
        if (idx >= 0 && idx < list.length - 1) {
            const next = list[idx + 1];
            onSelect(next.id);
            setCandidateIndex(0);
        }
    }, [visibleConflicts, currentConflictId, onSelect]);
    return _jsxs(_Fragment, { children: [_jsxs(Modal, { title: "\u6807\u6CE8\u51B2\u7A81\u5BF9\u6BD4", id: "dc-compare-mask", className: "dc-dialog dc-conflict-dialog", header: false, onClose: onClose, children: [_jsxs("header", { className: "dc-dialog-head", children: [_jsx("h2", { id: "dc-dialog-title", children: "\u6807\u6CE8\u51B2\u7A81\u5BF9\u6BD4" }), _jsxs("div", { className: "dc-dialog-head-actions", children: [_jsx(Button, { type: "button", onClick: handlePrevConflict, children: "\u4E0A\u4E00\u7EC4" }), _jsx(Button, { type: "button", onClick: handleNextConflict, children: "\u4E0B\u4E00\u7EC4" }), _jsx(IconButton, { icon: "close", type: "button", title: "\u5173\u95ED", label: "\u5173\u95ED", onClick: onClose })] })] }), _jsxs(ConsistencyGroupReviewForm, { jobId: jobId, anchorId: currentConflictId, onClose: onClose, onReviewed: onReviewed, children: [_jsxs("div", { className: "dc-compare", children: [_jsxs("div", { className: "dc-compare-cell", children: [_jsx("div", { className: "dc-compare-photo", role: "button", tabIndex: 0, "data-dc": "zoom-anchor", "aria-label": "\u67E5\u770B\u4E3B\u56FE\u5927\u56FE", title: currentConflict.filename, onClick: () => setZoomItem({
                                                    id: currentConflict.id + '_anchor',
                                                    title: currentConflict.filename,
                                                    imageUrl: currentConflict.fullUrl || currentConflict.url,
                                                    width: currentConflict.sourceWidth,
                                                    height: currentConflict.sourceHeight,
                                                    ...anchorAnnotations,
                                                }), onKeyDown: e => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        setZoomItem({
                                                            id: currentConflict.id + '_anchor',
                                                            title: currentConflict.filename,
                                                            imageUrl: currentConflict.fullUrl || currentConflict.url,
                                                            width: currentConflict.sourceWidth,
                                                            height: currentConflict.sourceHeight,
                                                            ...anchorAnnotations,
                                                        });
                                                    }
                                                }, children: _jsx(AnnotatedImageStage, { src: currentConflict.fullUrl || currentConflict.url, alt: "\u4E3B\u56FE", width: currentConflict.sourceWidth, height: currentConflict.sourceHeight, ...anchorAnnotations }) }), _jsx("div", { className: "dc-photo-filename", title: currentConflict.filename, children: currentConflict.filename })] }), _jsxs("div", { className: "dc-compare-cell", children: [_jsx("div", { className: "dc-compare-photo", role: "button", tabIndex: 0, "data-dc": "zoom-candidate", "aria-disabled": !selectedMember, "aria-label": "\u67E5\u770B\u5019\u9009\u56FE\u5927\u56FE", title: currentCandidate.filename, onClick: () => selectedMember &&
                                                    setZoomItem({
                                                        id: currentConflict.id + '_candidate_' + candidateIndex,
                                                        title: currentCandidate.filename,
                                                        imageUrl: currentCandidate.fullUrl,
                                                        width: currentCandidate.width,
                                                        height: currentCandidate.height,
                                                        ...candidateAnnotations,
                                                    }), onKeyDown: e => {
                                                    if (selectedMember && (e.key === 'Enter' || e.key === ' ')) {
                                                        setZoomItem({
                                                            id: currentConflict.id + '_candidate_' + candidateIndex,
                                                            title: currentCandidate.filename,
                                                            imageUrl: currentCandidate.fullUrl,
                                                            width: currentCandidate.width,
                                                            height: currentCandidate.height,
                                                            ...candidateAnnotations,
                                                        });
                                                    }
                                                }, children: selectedMember && _jsx(AnnotatedImageStage, { src: currentCandidate.fullUrl || currentCandidate.thumbUrl, alt: "\u5019\u9009\u56FE", width: currentCandidate.width, height: currentCandidate.height, ...candidateAnnotations }) }), _jsx("div", { className: "dc-photo-filename", title: currentCandidate.filename, children: currentCandidate.filename })] })] }), _jsxs("section", { className: "dc-images-panel", "aria-label": "\u5BF9\u6BD4\u56FE", children: [_jsx("h3", { children: "\u5BF9\u6BD4\u56FE" }), _jsx("div", { className: "iad-thumbnail-grid", "aria-label": "\u5207\u6362\u5BF9\u6BD4\u56FE\u7247", children: conflictMembers.map((member, index) => {
                                            const filename = member.image.sample.relative_path.split('/').pop();
                                            return _jsx(ThumbnailCard, { src: ConsistencyView.media(member.image, true), variant: "comparison", label: filename, "data-dc": "candidate", "data-id": index, "aria-pressed": index === candidateIndex, onClick: () => setCandidateIndex(index) }, member.image.sample.sample_id);
                                        }) }), membersError && _jsx("p", { role: "alert", className: "iad-error", children: membersError }), compared.error && _jsx("p", { role: "alert", className: "iad-error", children: compared.error })] }), _jsxs("section", { className: "dc-images-panel", "aria-label": "\u5019\u9009\u56FE", children: [_jsx("h3", { children: "\u5019\u9009\u56FE" }), candidates.loading ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5019\u9009\u56FE\u2026" }) : candidates.error ?
                                        _jsx("p", { role: "alert", className: "iad-error", children: candidates.error }) :
                                        [['exact', '完全一致的图'], ['similar', '相似图']].map(([kind, label]) => {
                                            const previews = candidates.data?.items.filter(item => item.kind === kind) || [];
                                            return _jsxs("div", { className: "dc-candidate-group", "data-kind": kind, children: [_jsx("h4", { children: label }), previews.length ? _jsx("div", { className: "iad-thumbnail-grid", children: previews.map(candidate => {
                                                            const image = candidate.image, filename = image.sample.relative_path.split('/').pop();
                                                            return _jsx(ThumbnailCard, { variant: "comparison", label: filename, src: ConsistencyView.media(image, true), "data-dc": "retrieved-candidate", onClick: () => setZoomItem({
                                                                    id: candidate.sample_id, title: filename, imageUrl: ConsistencyView.media(image),
                                                                    width: image.sample.width, height: image.sample.height,
                                                                    ...datasetImageAnnotations(candidate.annotations.dataset_format ?? undefined, image.sample, candidate.annotations.annotations),
                                                                }) }, candidate.sample_id);
                                                        }) }) : null] }, kind);
                                        })] }), _jsxs("section", { className: "dc-fact-panel", "aria-label": "\u5224\u5B9A\u7ED3\u8BBA", children: [_jsx("h3", { children: "\u5224\u5B9A\u7ED3\u8BBA" }), _jsx("span", { className: "dc-verdict-value", children: displayGroupConclusion }), _jsxs("p", { className: "dc-verdict-description", children: ["\u4E3B\u56FE 1 \u5F20\uFF0C\u53C2\u4E0E\u5BF9\u6BD4\u5019\u9009 ", currentConflict.candidateCount, " \u5F20"] })] }), _jsx(ConsistencyModelAnalysis, { reference: groupReference, members: conflictMembers, result: modelResult, error: groupAnalysis.error || groupAnalysis.analysis?.error || '' }), _jsxs("section", { className: "dc-conclusion-panel", "aria-label": "\u6A21\u578B\u7ED3\u8BBA", children: [_jsx("h3", { children: "\u6A21\u578B\u7ED3\u8BBA" }), _jsx("span", { className: "dc-verdict-value", children: displayModelConclusion })] })] }, `${jobId}:${currentConflictId}`)] }), _jsx(FullscreenViewer, { open: !!zoomItem, item: zoomItem, onClose: () => setZoomItem(null) })] });
}
