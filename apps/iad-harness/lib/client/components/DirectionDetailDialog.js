import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Modal } from './Modal.js';
import { ThumbnailCard } from "./ThumbnailCard.js";
import { useRef, useState } from "react";
import { IconButton } from "./IconButton.js";
import { ReferencedText } from "../direction-evidence.js";
/**
 * Reusable modal dialog for displaying exploration direction details,
 * comparative rationale with linked evidence chips, limitations, and visual evidence cards.
 */
export function DirectionDetailDialog({ direction: dir, onOpenFullscreen, onClose, }) {
    const evidenceContainerRef = useRef(null);
    const [highlightRef, setHighlightRef] = useState(null);
    const groups = [{ kind: 'normal', label: '良品' }, { kind: 'defect', label: '异常' }, { kind: 'unknown', label: '未分类' }]
        .map(group => ({ ...group, items: dir.evidences.filter(item => item.kind === group.kind) }))
        .filter(group => group.kind !== 'unknown' || group.items.length);
    const handleChipClick = (ref) => {
        setHighlightRef(ref);
        if (!evidenceContainerRef.current)
            return;
        const cardEl = evidenceContainerRef.current.querySelector(`[data-evidence-card="${ref}"]`);
        if (cardEl && cardEl.parentElement) {
            const vp = cardEl.parentElement;
            const left = cardEl.offsetLeft - vp.offsetLeft;
            const right = left + cardEl.offsetWidth;
            if (left < vp.scrollLeft + 6)
                vp.scrollTo({ left: Math.max(0, left - 4), behavior: "smooth" });
            else if (right > vp.scrollLeft + vp.clientWidth - 6)
                vp.scrollTo({ left: right - vp.clientWidth + 4, behavior: "smooth" });
        }
    };
    const renderText = (text) => _jsx(ReferencedText, { text: text, references: dir.references, className: "exp-evidence-ref", highlightedId: highlightRef, onReference: handleChipClick, onPreview: (ref, active) => { if (active)
            handleChipClick(ref);
        else
            setHighlightRef(null); } });
    return (_jsxs(Modal, { title: dir.title, className: "exp-dialog exp-direction-dialog", id: "exp-modal", header: false, onClose: onClose, children: [_jsxs("div", { className: "exp-dialog-head", children: [_jsx("strong", { children: dir.title }), _jsx(IconButton, { icon: "close", label: "\u5173\u95ED\u65B9\u5411\u8BE6\u60C5", title: "\u5173\u95ED", onClick: onClose })] }), _jsx("div", { className: "exp-dialog-main", ref: evidenceContainerRef, children: _jsxs("div", { className: "exp-direction-body", children: [_jsxs("section", { className: "exp-direction-goal", children: [_jsx("h3", { children: "\u89C2\u5BDF\u76EE\u6807" }), _jsx("p", { children: renderText(dir.brief) })] }), _jsxs("section", { className: "exp-direction-rationale", children: [_jsx("h3", { children: "\u6BD4\u8F83\u4F9D\u636E" }), _jsx("p", { children: renderText(dir.rationale) })] }), _jsxs("section", { className: "exp-direction-limitations", children: [_jsx("h3", { children: "\u9650\u5236\u4E0E\u5F85\u786E\u8BA4" }), dir.limitations.length ? _jsx("ul", { children: dir.limitations.map((lim, i) => _jsx("li", { children: renderText(lim) }, i)) }) : _jsx("p", { children: "\u672A\u8BB0\u5F55\u9650\u5236" })] }), _jsxs("section", { className: "exp-direction-evidence", children: [_jsx("div", { className: "exp-direction-evidence-head", children: _jsx("h3", { children: "\u56FE\u50CF\u8BC1\u636E" }) }), _jsx("div", { className: "exp-direction-evidence-groups", style: { gridTemplateColumns: `repeat(${groups.length},minmax(0,1fr))` }, children: groups.map(group => _jsx("section", { className: "exp-scroll-group", "data-evidence-kind": group.kind, children: _jsx("div", { className: "exp-evidence-viewport", role: "group", tabIndex: 0, "aria-label": `${group.label}图像证据，可在区域内滚轮横向滚动`, onWheel: event => {
                                                const motion = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
                                                if (motion)
                                                    event.currentTarget.scrollLeft += motion;
                                            }, children: group.items.length ? group.items.map(image => _jsx(ThumbnailCard, { className: `exp-direction-evidence-card ${highlightRef === image.ref ? 'is-related' : ''}`, "data-evidence-card": image.ref, "data-highlighted": highlightRef === image.ref, "aria-label": `查看${image.label}大图`, title: `点击放大 ${image.label}`, src: image.url, label: image.label, onMouseEnter: () => setHighlightRef(image.ref), onMouseLeave: () => setHighlightRef(null), onFocus: () => setHighlightRef(image.ref), onBlur: () => setHighlightRef(null), onClick: () => onOpenFullscreen(image.ref) }, image.ref)) : _jsxs("p", { className: "exp-direction-empty", children: ["\u6682\u65E0\u53EF\u7528", group.label, "\u8BC1\u636E"] }) }) }, group.kind)) })] })] }) })] }));
}
