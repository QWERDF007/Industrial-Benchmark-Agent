import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useRef } from "react";
import { CloseIcon } from "../AuditIcon.js";
import { IconButton } from "./IconButton.js";
/**
 * Reusable modal dialog for displaying exploration direction details,
 * comparative rationale with linked evidence chips, limitations, and visual evidence cards.
 */
export function DirectionDetailDialog({ direction: dir, evidence, highlightRef, onHighlightRef, onChipFocus, onOpenFullscreen, onClose, }) {
    const evidenceContainerRef = useRef(null);
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
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
    return (_jsx("div", { className: "exp-modal exp-direction-modal", id: "exp-modal", onClick: e => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "exp-dialog exp-direction-dialog", role: "dialog", "aria-modal": "true", "aria-label": dir.title, ref: evidenceContainerRef, children: [_jsxs("div", { className: "exp-dialog-head", children: [_jsx("strong", { children: dir.title }), _jsx(IconButton, { label: "\u5173\u95ED\u65B9\u5411\u8BE6\u60C5", title: "\u5173\u95ED", className: "exp-direction-icon modal-x", onClick: onClose, children: _jsx(CloseIcon, {}) })] }), _jsx("div", { className: "exp-dialog-main", children: _jsxs("div", { className: "exp-direction-body", children: [_jsxs("section", { className: "exp-direction-goal", children: [_jsx("h3", { children: "\u89C2\u5BDF\u76EE\u6807" }), _jsx("p", { children: dir.brief })] }), _jsxs("div", { className: "exp-direction-reasoning", children: [_jsxs("section", { children: [_jsx("h3", { children: "\u6BD4\u8F83\u4F9D\u636E" }), (() => {
                                                if (dir.rationale) {
                                                    const fullText = dir.rationale;
                                                    const regex = /(img_[a-f0-9]{8,64}|(?:良品\s*)?N\d+|(?:异常\s*)?A\d+)/g;
                                                    const parts = [];
                                                    let lastIndex = 0;
                                                    let match;
                                                    while ((match = regex.exec(fullText)) !== null) {
                                                        if (match.index > lastIndex) {
                                                            parts.push(fullText.slice(lastIndex, match.index));
                                                        }
                                                        const token = match[0];
                                                        const cleanRef = token.replace(/[^NA0-9]/g, "");
                                                        const matchedEv = evidence.all.find((e) => e.evidenceId.startsWith(token) ||
                                                            token.startsWith(e.evidenceId.slice(0, 8)) ||
                                                            (e.sampleId && (e.sampleId.startsWith(token) || token.startsWith(e.sampleId.slice(0, 8)))) ||
                                                            (e.filename && (e.filename.includes(token) || token.includes(e.filename))) ||
                                                            e.ref === token ||
                                                            e.ref === cleanRef ||
                                                            e.label === token);
                                                        if (matchedEv) {
                                                            parts.push(_jsx("button", { type: "button", className: `exp-evidence-ref ${highlightRef === matchedEv.ref ? "is-related" : ""}`, "data-evidence-ref": matchedEv.ref, "aria-label": `定位证据图像 ${matchedEv.label}`, title: `${matchedEv.label} (${token.startsWith("img_") ? token : matchedEv.filename})`, onMouseEnter: () => handleChipClick(matchedEv.ref), onMouseLeave: () => onHighlightRef(null), onClick: () => handleChipClick(matchedEv.ref), children: matchedEv.label }, matchedEv.ref + match.index));
                                                        }
                                                        else {
                                                            parts.push(token);
                                                        }
                                                        lastIndex = regex.lastIndex;
                                                    }
                                                    if (lastIndex < fullText.length) {
                                                        parts.push(fullText.slice(lastIndex));
                                                    }
                                                    return _jsx("p", { children: parts });
                                                }
                                                return (_jsxs(_Fragment, { children: [_jsxs("p", { children: ["\u826F\u54C1\u6837\u4F8B", " ", evidence.normals.length ? (evidence.normals.map((item, idx) => (_jsxs(React.Fragment, { children: [idx > 0 && "、", _jsx("button", { type: "button", className: `exp-evidence-ref ${highlightRef === item.ref ? "is-related" : ""}`, "data-evidence-ref": item.ref, "aria-label": `定位证据图像 ${item.label}`, onMouseEnter: () => handleChipClick(item.ref), onMouseLeave: () => onHighlightRef(null), onClick: () => handleChipClick(item.ref), children: item.label })] }, item.ref)))) : ("暂无"), " ", "\u7528\u4E8E\u89C2\u5BDF\u6B63\u5E38\u72B6\u6001\u4E0B\u7684\u5171\u6709\u7ED3\u6784\u4E0E\u6CE2\u52A8\u3002"] }), _jsxs("p", { children: ["\u5F02\u5E38\u6837\u4F8B", " ", evidence.defects.length ? (evidence.defects.map((item, idx) => (_jsxs(React.Fragment, { children: [idx > 0 && "、", _jsx("button", { type: "button", className: `exp-evidence-ref ${highlightRef === item.ref ? "is-related" : ""}`, "data-evidence-ref": item.ref, "aria-label": `定位证据图像 ${item.label}`, onMouseEnter: () => handleChipClick(item.ref), onMouseLeave: () => onHighlightRef(null), onClick: () => handleChipClick(item.ref), children: item.label })] }, item.ref)))) : ("暂无"), " ", "\u7528\u4E8E\u6BD4\u8F83\u540C\u4E00\u4F4D\u7F6E\u6216\u76F8\u4F3C\u7ED3\u6784\u7684\u53D8\u5316\uFF1B\u5177\u4F53\u7ED3\u8BBA\u9700\u7ED3\u5408\u539F\u56FE\u518D\u6B21\u6838\u9A8C\u3002"] })] }));
                                            })()] }), _jsxs("section", { children: [_jsx("h3", { children: "\u9650\u5236\u4E0E\u5F85\u786E\u8BA4" }), _jsx("ul", { children: dir.limitations && dir.limitations.length > 0 ? (dir.limitations.map((lim, i) => _jsx("li", { children: lim }, i))) : (_jsxs(_Fragment, { children: [_jsx("li", { children: dir.limit || "候选方向仅基于本次样例，需结合原图再次核验。" }), _jsx("li", { children: "\u5019\u9009\u65B9\u5411\u4EC5\u57FA\u4E8E\u672C\u6B21\u6837\u4F8B\uFF0C\u4E0D\u80FD\u76F4\u63A5\u4F5C\u4E3A\u7F3A\u9677\u5224\u5B9A\u3002" })] })) })] })] }), _jsxs("section", { className: "exp-direction-evidence", children: [_jsx("div", { className: "exp-direction-evidence-head", children: _jsx("h3", { children: "\u56FE\u50CF\u8BC1\u636E" }) }), _jsxs("div", { className: "exp-direction-evidence-groups", children: [_jsx("section", { className: "exp-scroll-group", "data-evidence-kind": "normal", children: _jsx("div", { className: "exp-evidence-viewport", role: "group", tabIndex: 0, "aria-label": "\u5019\u9009\u826F\u54C1\u56FE\u50CF\u8BC1\u636E\uFF0C\u53EF\u5728\u533A\u57DF\u5185\u6EDA\u8F6E\u6A2A\u5411\u6EDA\u52A8", onWheel: (e) => {
                                                        const motion = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                                                        if (motion)
                                                            e.currentTarget.scrollLeft += motion;
                                                    }, children: evidence.normals.length ? (evidence.normals.map((image) => (_jsx("button", { type: "button", className: `exp-direction-evidence-card ${highlightRef === image.ref ? "is-related" : ""}`, "data-evidence-card": image.ref, "aria-label": `查看${image.label}大图`, title: `点击放大 ${image.label}`, onMouseEnter: () => onHighlightRef(image.ref), onMouseLeave: () => onHighlightRef(null), onClick: () => onOpenFullscreen(image.ref), children: _jsx("img", { src: image.url, alt: image.label, loading: "eager" }) }, image.ref)))) : (_jsx("p", { className: "exp-direction-empty", children: "\u6682\u65E0\u53EF\u7528\u826F\u54C1\u8BC1\u636E" })) }) }), _jsx("section", { className: "exp-scroll-group", "data-evidence-kind": "defect", children: _jsx("div", { className: "exp-evidence-viewport", role: "group", tabIndex: 0, "aria-label": "\u5019\u9009\u5F02\u5E38\u56FE\u50CF\u8BC1\u636E\uFF0C\u53EF\u5728\u533A\u57DF\u5185\u6EDA\u8F6E\u6A2A\u5411\u6EDA\u52A8", onWheel: (e) => {
                                                        const motion = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                                                        if (motion)
                                                            e.currentTarget.scrollLeft += motion;
                                                    }, children: evidence.defects.length ? (evidence.defects.map((image) => (_jsx("button", { type: "button", className: `exp-direction-evidence-card ${highlightRef === image.ref ? "is-related" : ""}`, "data-evidence-card": image.ref, "aria-label": `查看${image.label}大图`, title: `点击放大 ${image.label}`, onMouseEnter: () => onHighlightRef(image.ref), onMouseLeave: () => onHighlightRef(null), onClick: () => onOpenFullscreen(image.ref), children: _jsx("img", { src: image.url, alt: image.label, loading: "eager" }) }, image.ref)))) : (_jsx("p", { className: "exp-direction-empty", children: "\u6682\u65E0\u53EF\u7528\u5F02\u5E38\u8BC1\u636E" })) }) })] })] })] }) })] }) }));
}
