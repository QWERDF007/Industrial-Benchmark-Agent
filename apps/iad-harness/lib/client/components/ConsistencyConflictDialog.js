import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { modelConclusionLabels } from '../../shared/consistency.parameters.generated.js';
import { datasetImageAnnotations } from '../dataset-image-annotations.js';
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
import { TabBar } from './layout/TabBar.js';
const candidateTabs = [{ id: 'compared', label: '实际对比' }, { id: 'exact', label: '完全一致' }, { id: 'similar', label: '相似' }];
export function ConsistencyConflictDialog({ conflict: currentConflict, items: visibleConflicts, onSelect, onMove, onClose, onReviewed }) {
    const currentConflictId = currentConflict.id;
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [candidateTab, setCandidateTab] = useState('compared');
    const [conflictMembers, setConflictMembers] = useState([]);
    const [membersError, setMembersError] = useState('');
    const [membersLoading, setMembersLoading] = useState(false);
    const [zoomItem, setZoomItem] = useState(null);
    const groupReference = currentConflict.reference;
    const jobId = 'job_id' in groupReference ? groupReference.job_id : undefined;
    const groupAnalysis = useGroupAnalysis(currentConflict.candidateCount ? groupReference : null);
    useEffect(() => {
        const controller = new AbortController();
        setConflictMembers([]);
        setMembersError('');
        setCandidateIndex(0);
        setCandidateTab('compared');
        setMembersLoading(Boolean(currentConflict.candidateCount));
        if (currentConflict.candidateCount)
            ConsistencyView.members(groupReference, controller.signal)
                .then(items => { if (!controller.signal.aborted)
                setConflictMembers(items); })
                .catch(error => { if (!controller.signal.aborted)
                setMembersError(message(error)); })
                .finally(() => { if (!controller.signal.aborted)
                setMembersLoading(false); });
        return () => controller.abort();
    }, [groupReference, currentConflict.candidateCount]);
    const modelResult = groupAnalysis.analysis?.status === 'COMPLETED' ? groupAnalysis.analysis.result : null;
    const candidates = useResource(jobId ?
        `/consistency/checks/${encodeURIComponent(jobId)}/anchors/${encodeURIComponent(currentConflictId)}/candidates` : null);
    const candidateImages = useMemo(() => candidateTab === 'compared' ? conflictMembers.map(member => member.image) :
        (candidates.data?.items.filter(item => item.kind === candidateTab).map(item => item.image) || []), [candidateTab, conflictMembers, candidates.data]);
    const selectedImage = candidateImages[candidateIndex] || null;
    const imagesLoading = candidateTab === 'compared' ? membersLoading : candidates.loading;
    const imagesError = candidateTab === 'compared' ? membersError : candidates.error;
    const modelConclusion = ConsistencyView.modelConclusion(modelResult?.overall.text || currentConflict.model.modelType, modelResult?.overall.verdict);
    const displayModelConclusion = modelConclusion ? modelConclusionLabels[modelConclusion] : currentConflict.model.identityConclusion || '';
    const displayGroupConclusion = currentConflict.type;
    const dialogTitle = currentConflict.model.identityConclusion && !modelConclusion ? `模型：${displayModelConclusion}` :
        displayModelConclusion ? `模型：${displayModelConclusion} - 程序：${displayGroupConclusion}` : `程序：${displayGroupConclusion}`;
    const currentCandidate = useMemo(() => {
        const image = selectedImage;
        return { sampleId: image?.sample.sample_id || '', filename: image?.sample.relative_path.split('/').pop() || '',
            thumbUrl: image ? ConsistencyView.media(image, true) : '', fullUrl: image ? ConsistencyView.media(image) : '',
            width: image?.sample.width, height: image?.sample.height };
    }, [selectedImage]);
    const evidenceId = selectedImage?.evidence_id || currentConflict.image?.evidence_id;
    const compared = useResource(evidenceId ? `/consistency/evidence/${encodeURIComponent(evidenceId)}` : null);
    const anchorSide = selectedImage ? (selectedImage.side === 'left' ? 'right' : 'left') : currentConflict.image?.side;
    const anchorSource = anchorSide ? compared.data?.sources[anchorSide] : null;
    const candidateSource = selectedImage ? compared.data?.sources[selectedImage.side] : null;
    const anchorAnnotations = anchorSource ? datasetImageAnnotations(anchorSource.annotations.dataset_format ?? undefined, anchorSource.sample, anchorSource.annotations.annotations) : {};
    const candidateAnnotations = candidateSource ? datasetImageAnnotations(candidateSource.annotations.dataset_format ?? undefined, candidateSource.sample, candidateSource.annotations.annotations) : {};
    const handlePrevConflict = useCallback(() => {
        if (onMove) {
            onMove(-1);
            return;
        }
        const list = visibleConflicts;
        const idx = list.findIndex(c => c.id === currentConflictId);
        if (idx > 0) {
            const prev = list[idx - 1];
            onSelect(prev.id);
            setCandidateIndex(0);
        }
    }, [visibleConflicts, currentConflictId, onSelect, onMove]);
    const handleNextConflict = useCallback(() => {
        if (onMove) {
            onMove(1);
            return;
        }
        const list = visibleConflicts;
        const idx = list.findIndex(c => c.id === currentConflictId);
        if (idx >= 0 && idx < list.length - 1) {
            const next = list[idx + 1];
            onSelect(next.id);
            setCandidateIndex(0);
        }
    }, [visibleConflicts, currentConflictId, onSelect, onMove]);
    return _jsxs(_Fragment, { children: [_jsxs(Modal, { title: dialogTitle, id: "dc-compare-mask", className: "dc-dialog dc-conflict-dialog", header: false, onClose: onClose, children: [_jsxs("header", { className: "dc-dialog-head", children: [_jsx("h2", { id: "dc-dialog-title", children: dialogTitle }), _jsxs("div", { className: "dc-dialog-head-actions", children: [_jsx(Button, { type: "button", onClick: handlePrevConflict, children: "\u4E0A\u4E00\u7EC4" }), _jsx(Button, { type: "button", onClick: handleNextConflict, children: "\u4E0B\u4E00\u7EC4" }), _jsx(IconButton, { icon: "close", type: "button", title: "\u5173\u95ED", label: "\u5173\u95ED", onClick: onClose })] })] }), _jsxs(ConsistencyGroupReviewForm, { jobId: jobId, anchorId: currentConflictId, onClose: onClose, onReviewed: onReviewed, children: [_jsx(TabBar, { label: "\u5019\u9009\u56FE\u7247\u5206\u7C7B", items: candidateTabs.map(tab => ({ ...tab,
                                    buttonProps: { id: `dc-candidate-tab-${tab.id}`, 'aria-controls': 'dc-candidate-panel' } })), value: candidateTab, onChange: tab => { if (tab !== candidateTab) {
                                    setCandidateTab(tab);
                                    setCandidateIndex(0);
                                } } }), _jsxs("div", { id: "dc-candidate-panel", role: "tabpanel", "aria-labelledby": `dc-candidate-tab-${candidateTab}`, children: [_jsxs("div", { className: "dc-compare", children: [_jsxs("div", { className: "dc-compare-cell", children: [_jsx("div", { className: "dc-compare-photo", role: "button", tabIndex: 0, "data-dc": "zoom-anchor", "aria-label": "\u67E5\u770B\u4E3B\u56FE\u5927\u56FE", title: currentConflict.filename, onClick: () => setZoomItem({
                                                            id: currentConflict.id + '_anchor',
                                                            sampleId: currentConflict.sampleId,
                                                            title: currentConflict.filename,
                                                            imageUrl: currentConflict.fullUrl || currentConflict.url,
                                                            width: currentConflict.sourceWidth,
                                                            height: currentConflict.sourceHeight,
                                                            ...anchorAnnotations,
                                                        }), onKeyDown: e => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                setZoomItem({
                                                                    id: currentConflict.id + '_anchor',
                                                                    sampleId: currentConflict.sampleId,
                                                                    title: currentConflict.filename,
                                                                    imageUrl: currentConflict.fullUrl || currentConflict.url,
                                                                    width: currentConflict.sourceWidth,
                                                                    height: currentConflict.sourceHeight,
                                                                    ...anchorAnnotations,
                                                                });
                                                            }
                                                        }, children: _jsx(AnnotatedImageStage, { sampleId: currentConflict.sampleId, src: currentConflict.fullUrl || currentConflict.url, alt: "\u4E3B\u56FE", width: currentConflict.sourceWidth, height: currentConflict.sourceHeight, ...anchorAnnotations }) }), _jsx("div", { className: "dc-photo-filename", title: currentConflict.filename, children: currentConflict.filename })] }), _jsxs("div", { className: "dc-compare-cell", children: [_jsxs("div", { className: "dc-compare-photo", role: "button", tabIndex: selectedImage ? 0 : -1, "data-dc": "zoom-candidate", "aria-disabled": !selectedImage, "aria-label": "\u67E5\u770B\u5019\u9009\u56FE\u5927\u56FE", title: currentCandidate.filename, onClick: () => selectedImage &&
                                                            setZoomItem({
                                                                id: currentConflict.id + '_candidate_' + candidateIndex,
                                                                sampleId: currentCandidate.sampleId,
                                                                title: currentCandidate.filename,
                                                                imageUrl: currentCandidate.fullUrl,
                                                                width: currentCandidate.width,
                                                                height: currentCandidate.height,
                                                                ...candidateAnnotations,
                                                            }), onKeyDown: e => {
                                                            if (selectedImage && (e.key === 'Enter' || e.key === ' ')) {
                                                                setZoomItem({
                                                                    id: currentConflict.id + '_candidate_' + candidateIndex,
                                                                    sampleId: currentCandidate.sampleId,
                                                                    title: currentCandidate.filename,
                                                                    imageUrl: currentCandidate.fullUrl,
                                                                    width: currentCandidate.width,
                                                                    height: currentCandidate.height,
                                                                    ...candidateAnnotations,
                                                                });
                                                            }
                                                        }, children: [selectedImage && _jsx(AnnotatedImageStage, { sampleId: currentCandidate.sampleId, src: currentCandidate.fullUrl || currentCandidate.thumbUrl, alt: "\u5019\u9009\u56FE", width: currentCandidate.width, height: currentCandidate.height, ...candidateAnnotations }), !selectedImage && _jsx("span", { role: "status", className: "iad-result-empty", children: imagesLoading ? '正在读取…' : imagesError ? '读取失败' :
                                                                    `暂无${candidateTabs.find(tab => tab.id === candidateTab).label}图` })] }), _jsx("div", { className: "dc-photo-filename", title: currentCandidate.filename, children: currentCandidate.filename })] })] }), _jsxs("section", { className: "dc-images-panel", "aria-label": "\u5019\u9009\u56FE\u7247", children: [_jsx("div", { className: "iad-thumbnail-grid", "aria-label": "\u5207\u6362\u5BF9\u6BD4\u56FE\u7247", children: candidateImages.map((image, index) => {
                                                    const filename = image.sample.relative_path.split('/').pop();
                                                    return _jsx(ThumbnailCard, { src: ConsistencyView.media(image, true), variant: "comparison", label: filename, "data-dc": "candidate", "data-id": index, "aria-pressed": index === candidateIndex, onClick: () => setCandidateIndex(index) }, image.sample.sample_id);
                                                }) }), imagesError && _jsx("p", { role: "alert", className: "iad-error", children: imagesError }), compared.error && _jsx("p", { role: "alert", className: "iad-error", children: compared.error })] })] }), _jsxs("section", { className: "dc-fact-panel", "aria-label": "\u5224\u5B9A\u7ED3\u8BBA", children: [_jsx("h3", { children: "\u5224\u5B9A\u7ED3\u8BBA" }), _jsx("span", { className: "dc-verdict-value", children: displayGroupConclusion }), _jsxs("p", { className: "dc-verdict-description", children: ["\u4E3B\u56FE 1 \u5F20\uFF0C\u53C2\u4E0E\u5BF9\u6BD4\u5019\u9009 ", currentConflict.candidateCount, " \u5F20"] })] }), _jsx(ConsistencyModelAnalysis, { reference: groupReference, members: conflictMembers, result: modelResult, error: groupAnalysis.error || groupAnalysis.analysis?.error || '' }), _jsxs("section", { className: "dc-conclusion-panel", "aria-label": "\u6A21\u578B\u7ED3\u8BBA", children: [_jsx("h3", { children: "\u6A21\u578B\u7ED3\u8BBA" }), _jsx("span", { className: "dc-verdict-value", children: displayModelConclusion })] })] }, `${jobId}:${currentConflictId}`)] }), _jsx(FullscreenViewer, { open: !!zoomItem, item: zoomItem, onClose: () => setZoomItem(null) })] });
}
