import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { differenceLabels } from '../../shared/consistency-presentation.js';
import { galleryImageUrl } from '../consistency-images.js';
import { ApiError, message, request } from '../api.js';
import { useWorkspace } from '../workspace.js';
import { MediaImage, MediaLoad } from './MediaLoad.js';
import { Pagination } from './Pagination.js';
import { ConsistencyGroupDialog } from './ConsistencyGroupDialog.js';
export function ConsistencyGallery({ queryId, kind, onExpired }) {
    const { state, workspace } = useWorkspace(), location = state.consistency;
    const [page, setPage] = useState(null), [error, setError] = useState('');
    const pendingMove = useRef(null);
    const cards = useRef(new Map()), focus = useRef(null);
    const search = location.gallerySearch || '', order = location.galleryOrder || 'recent', number = location.galleryPage || 1, differenceFilter = location.differenceFilter || 'all';
    useEffect(() => {
        const controller = new AbortController();
        setPage(null);
        setError('');
        const query = { query_id: queryId, kind, page: number, page_size: 15, search, order, difference_filter: differenceFilter };
        request('/consistency/gallery', query, undefined, controller.signal).then(value => { if (!controller.signal.aborted) {
            setPage(value);
            if (pendingMove.current) {
                const item = pendingMove.current === 1 ? value.items[0] : value.items.at(-1);
                pendingMove.current = null;
                if (item)
                    open(item);
            }
        } })
            .catch(failure => {
            if (!controller.signal.aborted) {
                if (failure instanceof ApiError && failure.code === 'REFERENCE_NOT_FOUND') {
                    pendingMove.current = null;
                    onExpired();
                }
                else
                    setError(message(failure));
            }
        });
        return () => controller.abort();
    }, [queryId, kind, number, search, order, differenceFilter, onExpired]);
    const selected = page?.items.find(item => item.group_id === location.groupId && item.facts_state === (location.facts || 'CURRENT'));
    function open(item) {
        focus.current = cards.current.get(item.group_id) || null;
        workspace.updateConsistency({ queryId, groupId: item.group_id, facts: item.facts_state, memberId: undefined, memberPage: 1, detailTab: 'summary', differenceId: undefined }, true);
    }
    function move(offset) {
        if (!selected || !page)
            return;
        const index = page.items.indexOf(selected) + offset;
        if (index >= 0 && index < page.items.length)
            open(page.items[index]);
        else {
            pendingMove.current = offset;
            workspace.updateConsistency({ galleryPage: number + offset, memberId: undefined, memberPage: 1 }, true);
        }
    }
    return _jsxs("section", { className: "iad-consistency-gallery-panel", "aria-label": kind === 'conflicts' ? '冲突图像' : '重复图组', children: [_jsxs("header", { className: "iad-consistency-panel-header", children: [_jsxs("strong", { children: [kind === 'conflicts' ? '同图标注差异' : '重复图组 · 代表图像', " ", _jsxs("span", { className: "iad-muted", children: [page?.total ?? '—', " ", kind === 'conflicts' ? '张' : '组'] })] }), _jsxs("div", { className: "iad-row", children: [_jsx("input", { type: "search", "aria-label": "\u641C\u7D22\u56FE\u50CF", placeholder: "\u641C\u7D22\u6587\u4EF6\u540D", value: search, onChange: event => workspace.updateConsistency({ gallerySearch: event.target.value, galleryPage: 1, groupId: undefined }, true) }), _jsxs("select", { "aria-label": "\u6392\u5E8F\u65B9\u5F0F", value: order, onChange: event => workspace.updateConsistency({ galleryOrder: event.target.value, galleryPage: 1, groupId: undefined }, true), children: [_jsx("option", { value: "recent", children: "\u6700\u8FD1\u6BD4\u8F83" }), _jsx("option", { value: "members", children: kind === 'conflicts' ? '候选数量从多到少' : '成员数量从多到少' })] })] })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), !page && !error && _jsx("p", { role: "status", className: "iad-empty", children: "\u6B63\u5728\u8BFB\u53D6\u56FE\u50CF\u2026" }), page && !page.total && _jsx("p", { className: "iad-empty", children: "\u6CA1\u6709\u5339\u914D\u7684\u56FE\u50CF\uFF0C\u8BF7\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\u3002" }), kind === 'conflicts' && page && _jsx("div", { className: "iad-consistency-filter-chips", role: "group", "aria-label": "\u5DEE\u5F02\u7C7B\u578B\u7B5B\u9009", children: page.filters.map(filter => _jsxs("button", { "aria-pressed": differenceFilter === filter.value, onClick: () => workspace.updateConsistency({ differenceFilter: filter.value, galleryPage: 1, groupId: undefined }, true), children: [filter.label, " ", filter.count] }, filter.value)) }), _jsx(MediaLoad, { children: _jsx("div", { className: "iad-consistency-gallery", children: page?.items.map(item => _jsxs("button", { ref: element => { if (element)
                            cards.current.set(item.group_id, element);
                        else
                            cards.current.delete(item.group_id); }, className: "iad-consistency-image-card", "data-group-id": item.group_id, "data-facts-state": item.facts_state, onClick: () => open(item), children: [_jsxs("div", { className: "iad-consistency-card-image", children: [item.anchor.available ? _jsx(MediaImage, { src: galleryImageUrl(item.anchor), alt: item.anchor.sample.relative_path, loading: "lazy" }) : _jsx("span", { children: "\u539F\u56FE\u4E0D\u53EF\u6062\u590D" }), _jsx("span", { className: "iad-consistency-card-count", children: kind === 'groups' ? `${item.member_count} 张成员` : `${item.candidate_count} 张候选` })] }), _jsxs("div", { className: "iad-consistency-card-caption", children: [_jsx("strong", { title: item.anchor.sample.relative_path, children: item.anchor.sample.relative_path.split('/').pop() }), _jsxs("div", { children: [_jsx("span", { className: "iad-consistency-badge", children: kind === 'groups' ? '严格同图' : item.difference_types.map(type => differenceLabels[type]).join('、') || '未发现标注差异' }), _jsx("span", { children: kind === 'groups' ? `${item.dataset_count} 个数据集` : '' })] })] })] }, item.group_id + item.facts_state)) }) }), _jsx(Pagination, { total: page?.total || 0, page: number, size: 15, unit: kind === 'groups' ? '组' : '张', onPage: galleryPage => workspace.updateConsistency({ galleryPage, groupId: undefined }, true) }), selected && !location.evidenceId && _jsx(ConsistencyGroupDialog, { queryId: queryId, kind: kind, item: selected, position: (number - 1) * 15 + (page?.items.indexOf(selected) || 0) + 1, total: page?.total || 0, onMove: move, onExpired: onExpired, onClose: () => workspace.updateConsistency({ groupId: undefined, memberId: undefined, differenceId: undefined, detailTab: undefined }, true), restoreFocus: () => focus.current || cards.current.get(selected.group_id) || null }, selected.group_id + selected.facts_state)] });
}
