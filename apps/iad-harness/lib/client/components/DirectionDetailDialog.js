import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ThumbnailCard } from "./ThumbnailCard.js";
import { useEffect, useRef } from "react";
import { IconButton } from "./IconButton.js";
import { ReferencedText } from "../direction-evidence.js";
/**
 * Reusable modal dialog for displaying exploration direction details,
 * comparative rationale with linked evidence chips, limitations, and visual evidence cards.
 */
export function DirectionDetailDialog({ direction: dir, evidence, highlightRef, onHighlightRef, onChipFocus, onOpenFullscreen, onClose, }) {
    const evidenceContainerRef = useRef(null);
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && !e.defaultPrevented) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);
    const handleChipClick = (ref) => {
        onChipFocus(ref);
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
            onHighlightRef(null); } });
    return (_jsx("div", { className: "exp-modal exp-direction-modal", id: "exp-modal", onClick: e => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "exp-dialog exp-direction-dialog", role: "dialog", "aria-modal": "true", "aria-label": dir.title, ref: evidenceContainerRef, children: [_jsxs("div", { className: "exp-dialog-head", children: [_jsx("strong", { children: dir.title }), _jsx(IconButton, { icon: "close", label: "\u5173\u95ED\u65B9\u5411\u8BE6\u60C5", title: "\u5173\u95ED", onClick: onClose })] }), _jsx("div", { className: "exp-dialog-main", children: _jsxs("div", { className: "exp-direction-body", children: [_jsxs("section", { className: "exp-direction-goal", children: [_jsx("h3", { children: "\u89C2\u5BDF\u76EE\u6807" }), _jsx("p", { children: renderText(dir.brief) })] }), _jsxs("section", { className: "exp-direction-rationale", children: [_jsx("h3", { children: "\u6BD4\u8F83\u4F9D\u636E" }), _jsx("p", { children: renderText(dir.rationale) })] }), _jsxs("section", { className: "exp-direction-limitations", children: [_jsx("h3", { children: "\u9650\u5236\u4E0E\u5F85\u786E\u8BA4" }), dir.limitations.length ? _jsx("ul", { children: dir.limitations.map((lim, i) => _jsx("li", { children: renderText(lim) }, i)) }) : _jsx("p", { children: "\u672A\u8BB0\u5F55\u9650\u5236" })] }), _jsxs("section", { className: "exp-direction-evidence", children: [_jsx("div", { className: "exp-direction-evidence-head", children: _jsx("h3", { children: "\u56FE\u50CF\u8BC1\u636E" }) }), _jsxs("div", { className: "exp-direction-evidence-groups", children: [_jsx("section", { className: "exp-scroll-group", "data-evidence-kind": "normal", children: _jsx("div", { className: "exp-evidence-viewport", role: "group", tabIndex: 0, "aria-label": "\u5019\u9009\u826F\u54C1\u56FE\u50CF\u8BC1\u636E\uFF0C\u53EF\u5728\u533A\u57DF\u5185\u6EDA\u8F6E\u6A2A\u5411\u6EDA\u52A8", onWheel: (e) => {
                                                        const motion = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                                                        if (motion)
                                                            e.currentTarget.scrollLeft += motion;
                                                    }, children: evidence.normals.length ? (evidence.normals.map((image) => (_jsx(ThumbnailCard, { type: "button", className: `exp-direction-evidence-card ${highlightRef === image.ref ? "is-related" : ""}`, "data-evidence-card": image.ref, "aria-label": `查看${image.label}大图`, title: `点击放大 ${image.label}`, src: image.url, label: image.label, "data-highlighted": highlightRef === image.ref, onMouseEnter: () => onHighlightRef(image.ref), onMouseLeave: () => onHighlightRef(null), onClick: () => onOpenFullscreen(image.ref) }, image.ref)))) : (_jsx("p", { className: "exp-direction-empty", children: "\u6682\u65E0\u53EF\u7528\u826F\u54C1\u8BC1\u636E" })) }) }), _jsx("section", { className: "exp-scroll-group", "data-evidence-kind": "defect", children: _jsx("div", { className: "exp-evidence-viewport", role: "group", tabIndex: 0, "aria-label": "\u5019\u9009\u5F02\u5E38\u56FE\u50CF\u8BC1\u636E\uFF0C\u53EF\u5728\u533A\u57DF\u5185\u6EDA\u8F6E\u6A2A\u5411\u6EDA\u52A8", onWheel: (e) => {
                                                        const motion = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                                                        if (motion)
                                                            e.currentTarget.scrollLeft += motion;
                                                    }, children: evidence.defects.length ? (evidence.defects.map((image) => (_jsx(ThumbnailCard, { type: "button", className: `exp-direction-evidence-card ${highlightRef === image.ref ? "is-related" : ""}`, "data-evidence-card": image.ref, "aria-label": `查看${image.label}大图`, title: `点击放大 ${image.label}`, src: image.url, label: image.label, "data-highlighted": highlightRef === image.ref, onMouseEnter: () => onHighlightRef(image.ref), onMouseLeave: () => onHighlightRef(null), onClick: () => onOpenFullscreen(image.ref) }, image.ref)))) : (_jsx("p", { className: "exp-direction-empty", children: "\u6682\u65E0\u53EF\u7528\u5F02\u5E38\u8BC1\u636E" })) }) })] })] })] }) })] }) }));
}
