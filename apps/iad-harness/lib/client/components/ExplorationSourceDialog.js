import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
import { Pagination } from './Pagination.js';
import { ThumbnailCard } from './ThumbnailCard.js';
import { MultiSelect, Select } from './Select.js';
import { ClearFilterButton } from './CommonFilterControls.js';
export function ExplorationSourceDialog({ kind, datasets, candidates, selected, loading, onChange, onClose }) {
    const [search, setSearch] = useState(''), [selectedOnly, setSelectedOnly] = useState(false), [page, setPage] = useState(1);
    const [subsetIds, setSubsetIds] = useState(() => datasets.map(item => item.dataset_id)), [category, setCategory] = useState('');
    const input = useRef(null), label = kind === 'normal' ? '良品' : '异常';
    const scroll = useRef(null);
    const chosen = useMemo(() => new Set(selected), [selected]);
    const pool = useMemo(() => candidates.filter(item => item.candidate_role === kind && subsetIds.includes(item.datasetId)), [candidates, kind, subsetIds]);
    const showCategory = kind === 'defect' && datasets.some(item => subsetIds.includes(item.dataset_id) && item.format === 'labelme');
    const categories = useMemo(() => [...new Set(pool.flatMap(item => item.annotation_categories))]
        .sort((left, right) => left.localeCompare(right, 'zh-CN', { numeric: true })), [pool]);
    const activeCategory = showCategory && categories.includes(category) ? category : '';
    useEffect(() => { if (category !== activeCategory)
        setCategory(activeCategory); }, [category, activeCategory]);
    const filtered = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        return pool.filter(item => (!selectedOnly || chosen.has(item.id))
            && (!activeCategory || item.annotation_categories.includes(activeCategory))
            && (!query || item.filename.toLocaleLowerCase().includes(query)));
    }, [pool, chosen, selectedOnly, search, activeCategory]);
    const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 24)));
    useEffect(() => { scroll.current?.scrollTo({ top: 0 }); }, [current, search, subsetIds, activeCategory, selectedOnly]);
    const filtersActive = !!search || selectedOnly || !!activeCategory || subsetIds.length !== datasets.length;
    return _jsxs(Modal, { title: `选择${label}图像`, size: "form", className: "exp-source-dialog", initialFocus: input, onClose: onClose, children: [_jsxs("div", { className: "iad-dialog-body exp-source-body", children: [_jsxs("div", { className: "exp-source-filters", role: "group", "aria-label": "\u56FE\u50CF\u7B5B\u9009", children: [_jsxs("label", { className: "iad-field exp-source-search-field", children: ["\u6587\u4EF6\u540D\u641C\u7D22", _jsx("input", { ref: input, id: "exp-source-search", type: "search", placeholder: "\u641C\u7D22\u6587\u4EF6\u540D", value: search, onChange: event => { setSearch(event.target.value); setPage(1); } })] }), _jsxs("div", { className: "iad-field exp-source-child-field", children: [_jsx("label", { htmlFor: "exp-source-children", children: "\u5B50\u6570\u636E\u96C6" }), _jsx(MultiSelect, { id: "exp-source-children", menuId: "exp-source-children-options", label: "\u5B50\u6570\u636E\u96C6", options: datasets.map(item => ({ value: item.dataset_id, label: item.name })), selected: subsetIds, onToggle: id => { setSubsetIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]); setPage(1); } })] }), _jsx("div", { className: "exp-source-category-field", children: showCategory && _jsxs("label", { className: "iad-field", children: ["\u7C7B\u522B", _jsxs(Select, { id: "exp-source-category", value: activeCategory, onChange: event => { setCategory(event.target.value); setPage(1); }, children: [_jsx("option", { value: "", children: "\u5168\u90E8\u7C7B\u522B" }), categories.map(value => _jsx("option", { value: value, children: value }, value))] })] }) }), _jsxs("label", { className: "iad-row exp-source-only", children: [_jsx("input", { type: "checkbox", id: "exp-only-selected", checked: selectedOnly, onChange: event => { setSelectedOnly(event.target.checked); setPage(1); } }), "\u4EC5\u770B\u5DF2\u9009"] }), _jsx(ClearFilterButton, { ariaLabel: "\u6E05\u9664\u56FE\u50CF\u7B5B\u9009", title: "\u6E05\u9664\u56FE\u50CF\u7B5B\u9009", disabled: !filtersActive, onClick: () => { setSearch(''); setSubsetIds(datasets.map(item => item.dataset_id)); setCategory(''); setSelectedOnly(false); setPage(1); } })] }), _jsxs("div", { className: "exp-source-scroll", ref: scroll, "aria-busy": loading, children: [_jsx("div", { className: "iad-thumbnail-grid", "aria-label": `${label}图像`, children: filtered.slice((current - 1) * 24, current * 24).map(item => {
                                    const checked = chosen.has(item.id);
                                    const toggle = () => onChange(checked ? selected.filter(id => id !== item.id) : [...selected, item.id]);
                                    return _jsxs("div", { className: "iad-thumbnail-option", children: [_jsx(ThumbnailCard, { src: item.url, label: item.filename, "aria-pressed": checked, onClick: toggle }), _jsxs("label", { className: "iad-row", children: [_jsx("input", { type: "checkbox", "aria-label": `选择${label} ${item.filename}`, checked: checked, onChange: toggle }), "\u9009\u62E9"] })] }, item.id);
                                }) }), loading && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u56FE\u50CF\u2026" })] }), _jsx("div", { className: "exp-source-pagination", children: _jsx(Pagination, { total: filtered.length, page: current, size: 24, unit: "\u5F20\u56FE\u50CF", onPage: setPage }) })] }), _jsx("footer", { className: "iad-dialog-footer", children: _jsx(Button, { variant: "primary", onClick: onClose, children: "\u5B8C\u6210\u9009\u62E9" }) })] });
}
