import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { imageRelations, annotationSummary } from '../../shared/consistency-presentation.js';
import { CloseIcon } from '../AuditIcon.js';
import { message, request } from '../api.js';
import { galleryImageUrl, frozenConsistencyImage, frozenConsistencyMember } from '../consistency-images.js';
import { useConsistencyEvidence } from '../useConsistencyEvidence.js';
import { useWorkspace } from '../workspace.js';
import { Modal } from './Modal.js';
import { IconButton } from './IconButton.js';
import { ImageViewer } from './ImageViewer.js';
import { MediaImage, MediaLoad } from './MediaLoad.js';
import { PageTabs } from './layout/PageTabs.js';
import { ConsistencyCanvasPair } from './ConsistencyCanvasPair.js';
import { ConsistencyDifferences } from './ConsistencyDifferences.js';
import { ConsistencyGroupAnalysis } from './ConsistencyGroupAnalysis.js';
import { ConsistencyReviewPanel } from './ConsistencyReviewPanel.js';
const tabs = [{ id: 'summary', label: 'MLLM 分析' }, { id: 'evidence', label: '证据清单' }, { id: 'review', label: '人工复核' }];
export function ConsistencyGroupDialog({ queryId, kind, item, position, total, onMove, onClose, restoreFocus }) {
    const { state, workspace } = useWorkspace(), location = state.consistency;
    const [members, setMembers] = useState(null), [error, setError] = useState(''), [asking, setAsking] = useState(false);
    const [lightbox, setLightbox] = useState(null);
    const memberPage = location.memberPage || 1, tab = location.detailTab || 'summary';
    useEffect(() => {
        const controller = new AbortController();
        setMembers(null);
        setError('');
        request('/consistency/gallery/members', { query_id: queryId, kind, group_id: item.group_id, facts_state: item.facts_state, page: memberPage, page_size: 20 }, undefined, controller.signal)
            .then(value => { if (!controller.signal.aborted) {
            setMembers(value);
            if (!value.items.some(row => row.image.sample.sample_id === location.memberId))
                workspace.updateConsistency({ memberId: value.items[0]?.image.sample.sample_id, differenceId: undefined }, true);
        } })
            .catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); });
        return () => controller.abort();
    }, [queryId, kind, item.group_id, item.facts_state, memberPage, workspace]);
    const selected = members?.items.find(row => row.image.sample.sample_id === location.memberId) || members?.items[0];
    const anchor = useConsistencyEvidence(members?.anchor.evidence_id), candidate = useConsistencyEvidence(selected?.image.evidence_id);
    const comparison = selected?.comparison && candidate.bundle?.result.evidence_id === selected.comparison.evidence_id ? candidate.bundle : null;
    const sources = [anchor.bundle && members ? frozenConsistencyImage(anchor.bundle, members.anchor.side) : null, candidate.bundle && selected ? frozenConsistencyImage(candidate.bundle, selected.image.side) : null];
    const difference = comparison?.result.annotation.differences.find(row => row.difference_id === location.differenceId);
    return _jsxs(Modal, { title: "\u56FE\u7EC4\u8BE6\u60C5", header: false, className: "iad-consistency-group-dialog", onClose: onClose, restoreFocus: restoreFocus, onKeyDown: event => {
            if (event.defaultPrevented || event.target.closest('input,textarea,select,[role=tablist],.iad-image-canvas'))
                return;
            if (event.key === 'ArrowLeft' && position > 1) {
                event.preventDefault();
                onMove(-1);
            }
            if (event.key === 'ArrowRight' && position < total) {
                event.preventDefault();
                onMove(1);
            }
        }, children: [_jsxs("header", { className: "iad-group-header", children: [_jsxs("div", { children: [_jsx("span", { className: "iad-muted", children: kind === 'groups' ? '严格同图成员' : '候选集合核验' }), _jsxs("h2", { children: [kind === 'groups' ? '重复图组' : '标注差异', " \u00B7 ", item.anchor.sample.relative_path.split('/').pop()] }), _jsx("p", { children: kind === 'groups' ? `${item.member_count} 张成员` : `查询图像 1 张 · ${item.candidate_count} 张候选` })] }), _jsxs("div", { className: "iad-row", children: [_jsx("button", { disabled: position <= 1, onClick: () => onMove(-1), children: "\u4E0A\u4E00\u7EC4" }), _jsxs("span", { className: "iad-muted", children: [position, " / ", total] }), _jsx("button", { disabled: position >= total, onClick: () => onMove(1), children: "\u4E0B\u4E00\u7EC4" }), _jsx(IconButton, { label: "\u5173\u95ED\u56FE\u7EC4\u8BE6\u60C5", onClick: onClose, children: _jsx(CloseIcon, {}) })] })] }), _jsxs("div", { className: "iad-group-scroll", children: [(error || anchor.error || candidate.error) && _jsx("p", { className: "iad-error", role: "alert", children: error || anchor.error || candidate.error }), !members && !error && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5019\u9009\u56FE\u50CF\u2026" }), members && _jsxs(_Fragment, { children: [_jsx(ConsistencyCanvasPair, { sources: sources, labels: [kind === 'groups' ? '组代表图像（固定）' : '查询图像（固定）', kind === 'groups' ? '组内成员' : '当前候选'], selected: difference, anchorSide: selected?.comparison?.anchor_side, onExpand: setLightbox }), _jsx("div", { className: "iad-group-image-names", children: sources.map((source, index) => _jsx("span", { title: source?.title, children: source?.title }, index)) }), _jsxs("section", { className: "iad-group-candidates", "aria-label": "\u5019\u9009\u56FE\u50CF", children: [_jsxs("div", { className: "iad-row", children: [_jsxs("h3", { children: [kind === 'groups' ? '同图组成员' : '相似候选', "\uFF08", members.total, " \u5F20", kind === 'groups' ? ' · 不含固定代表图' : '', "\uFF09"] }), _jsxs("span", { className: "iad-muted", children: [memberPage, " / ", Math.max(1, Math.ceil(members.total / 20))] }), members.total > 20 && _jsxs(_Fragment, { children: [_jsx("button", { disabled: memberPage <= 1, onClick: () => workspace.updateConsistency({ memberPage: memberPage - 1, memberId: undefined, differenceId: undefined }, true), children: "\u4E0A\u4E00\u9875\u5019\u9009" }), _jsx("button", { disabled: memberPage * 20 >= members.total, onClick: () => workspace.updateConsistency({ memberPage: memberPage + 1, memberId: undefined, differenceId: undefined }, true), children: "\u4E0B\u4E00\u9875\u5019\u9009" })] })] }), _jsx(MediaLoad, { children: _jsx("div", { className: "iad-group-candidate-strip", children: members.items.map((row, index) => _jsxs("button", { "data-sample-id": row.image.sample.sample_id, "aria-pressed": selected === row, onClick: () => workspace.updateConsistency({ memberId: row.image.sample.sample_id, differenceId: undefined }, true), children: [row.image.available ? _jsx(MediaImage, { src: galleryImageUrl(row.image), alt: row.image.sample.relative_path, loading: "lazy" }) : _jsx("span", { children: "\u539F\u56FE\u4E0D\u53EF\u6062\u590D" }), _jsxs("strong", { children: [kind === 'groups' ? '成员' : '候选', " ", (memberPage - 1) * 20 + index + 1] }), _jsx("span", { title: row.image.sample.relative_path, children: row.image.sample.relative_path.split('/').pop() })] }, row.image.sample.sample_id)) }) })] }), _jsx("div", { className: "iad-group-analysis", children: _jsxs(PageTabs, { label: "\u56FE\u7EC4\u8BE6\u60C5\u9875\u7B7E", items: tabs, value: tab, onChange: detailTab => workspace.updateConsistency({ detailTab }, true), children: [tab === 'summary' && _jsxs(_Fragment, { children: [_jsx(ConsistencyGroupAnalysis, { reference: { query_id: queryId, kind, group_id: item.group_id, facts_state: item.facts_state }, onLocate: (citation, offset) => workspace.updateConsistency({ memberPage: Math.floor(offset / 20) + 1, memberId: citation.candidate_id, differenceId: citation.comparison?.difference_id ?? undefined, detailTab: 'evidence' }, true) }), comparison && _jsxs("div", { className: "iad-group-fact", children: [_jsx("strong", { children: "\u786E\u5B9A\u6027\u4E8B\u5B9E" }), _jsxs("span", { children: [imageRelations[comparison.result.verification.relation], " \u00B7 ", annotationSummary(comparison.result.annotation)] }), _jsx("button", { className: "iad-consistency-text-button", onClick: () => workspace.updateConsistency({ detailTab: 'evidence' }, true), children: "\u67E5\u770B\u5F53\u524D\u5019\u9009\u8BC1\u636E" })] })] }), tab === 'evidence' && (comparison ? _jsxs(_Fragment, { children: [_jsxs("dl", { className: "iad-group-references", children: [_jsx("dt", { children: "\u6BD4\u8F83" }), _jsx("dd", { children: comparison.result.result_id }), _jsx("dt", { children: "\u8BC1\u636E" }), _jsx("dd", { children: comparison.result.evidence_id })] }), _jsx(ConsistencyDifferences, { member: frozenConsistencyMember(comparison), differenceId: location.differenceId, onDifference: differenceId => workspace.updateConsistency({ differenceId }, true), anchorSide: selected?.comparison?.anchor_side })] }) : _jsx("p", { className: "iad-muted", children: "\u5F53\u524D\u6210\u5458\u4E0E\u56FA\u5B9A\u4E3B\u56FE\u4E4B\u95F4\u6CA1\u6709\u5DF2\u4FDD\u5B58\u7684\u76F4\u63A5\u6BD4\u8F83\u8BC1\u636E\u3002" })), tab === 'review' && (comparison ? _jsx(ConsistencyReviewPanel, { bundle: comparison }, comparison.result.evidence_id) : _jsx("p", { className: "iad-muted", children: "\u53D6\u5F97\u5F53\u524D\u53CC\u56FE\u7684\u6BD4\u8F83\u8BC1\u636E\u540E\u53EF\u4EBA\u5DE5\u590D\u6838\u3002" }))] }) })] })] }), _jsxs("footer", { className: "iad-group-footer", children: [_jsx("div", { className: "iad-row", children: _jsx("button", { disabled: !comparison || asking, onClick: async () => { if (!comparison)
                                return; setAsking(true); try {
                                await workspace.explainConsistency(comparison.result);
                            }
                            catch (failure) {
                                setError(message(failure));
                            }
                            finally {
                                setAsking(false);
                            } }, children: asking ? '正在打开会话…' : '在 DSH 中解释' }) }), _jsx("button", { className: "iad-primary", disabled: !comparison, onClick: () => workspace.updateConsistency({ detailTab: 'review' }, true), children: "\u4EBA\u5DE5\u590D\u6838" })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
}
