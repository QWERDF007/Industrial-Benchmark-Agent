import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useRef, useState } from 'react';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
import { Pagination } from './Pagination.js';
import { ThumbnailCard } from './ThumbnailCard.js';
export function ExplorationSourceDialog({ kind, candidates, selected, loading, onChange, onClose }) {
    const [search, setSearch] = useState(''), [selectedOnly, setSelectedOnly] = useState(false), [page, setPage] = useState(1);
    const input = useRef(null), label = kind === 'normal' ? '良品' : '异常';
    const chosen = useMemo(() => new Set(selected), [selected]);
    const filtered = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        return candidates.filter(item => item.kind === kind && (!selectedOnly || chosen.has(item.id))
            && (!query || item.filename.toLocaleLowerCase().includes(query)));
    }, [candidates, kind, chosen, selectedOnly, search]);
    const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 24)));
    return _jsxs(Modal, { title: `选择${label}图像`, size: "form", initialFocus: input, onClose: onClose, children: [_jsxs("div", { className: "iad-dialog-body", children: [_jsxs("div", { className: "iad-filters", children: [_jsxs("label", { className: "iad-field", children: ["\u641C\u7D22\u56FE\u50CF", _jsx("input", { ref: input, id: "exp-source-search", type: "search", placeholder: "\u6587\u4EF6\u540D", value: search, onChange: event => { setSearch(event.target.value); setPage(1); } })] }), _jsxs("label", { className: "iad-row", children: [_jsx("input", { type: "checkbox", id: "exp-only-selected", checked: selectedOnly, onChange: event => { setSelectedOnly(event.target.checked); setPage(1); } }), "\u4EC5\u770B\u5DF2\u9009"] })] }), _jsx("div", { className: "iad-thumbnail-grid", children: filtered.slice((current - 1) * 24, current * 24).map(item => {
                            const checked = chosen.has(item.id);
                            const toggle = () => onChange(checked ? selected.filter(id => id !== item.id) : [...selected, item.id]);
                            return _jsxs("div", { className: "iad-thumbnail-option", children: [_jsx(ThumbnailCard, { src: item.url, label: item.filename, "aria-pressed": checked, onClick: toggle }), _jsxs("label", { className: "iad-row", children: [_jsx("input", { type: "checkbox", "aria-label": `选择${label} ${item.filename}`, checked: checked, onChange: toggle }), "\u9009\u62E9"] })] }, item.id);
                        }) }), loading ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u56FE\u50CF\u2026" }) : !filtered.length && _jsx("p", { children: "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u56FE\u50CF\u3002" }), _jsx(Pagination, { total: filtered.length, page: current, size: 24, unit: "\u5F20\u56FE\u50CF", onPage: setPage })] }), _jsx("footer", { className: "iad-dialog-footer", children: _jsx(Button, { variant: "primary", onClick: onClose, children: "\u5B8C\u6210\u9009\u62E9" }) })] });
}
