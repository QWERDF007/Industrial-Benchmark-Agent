import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
/**
 * Reusable full-dialog image viewer.
 * Provides pan, zoom, fit to window, annotation overlay toggle, and keyboard navigation.
 * Standardized across Image Browsing and Direction Exploration pages.
 */
export function FullscreenViewer({ open, item, items = [], currentIndex = -1, onClose, onNavigate, }) {
    const [zoomMode, setZoomMode] = useState("fit");
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [showAnnotation, setShowAnnotation] = useState(true);
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [stageBounds, setStageBounds] = useState({ width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef(null);
    const stageRef = useRef(null);
    const bigImageRef = useRef(null);
    const worldRef = useRef(null);
    const imgW = naturalSize.width || item?.width || 800;
    const imgH = naturalSize.height || item?.height || 600;
    // Fit scale calculation: dynamically scale to fit the stage area
    const fitScale = useMemo(() => {
        if (stageBounds.width <= 0 || stageBounds.height <= 0 || imgW <= 0 || imgH <= 0)
            return 1;
        const availableW = Math.max(100, stageBounds.width - 128);
        const availableH = Math.max(100, stageBounds.height - 40);
        const scaleX = availableW / imgW;
        const scaleY = availableH / imgH;
        return Math.max(0.05, Math.min(scaleX, scaleY));
    }, [stageBounds.width, stageBounds.height, imgW, imgH]);
    const effectiveScale = zoomMode === "fit" ? fitScale : zoomLevel;
    const setZoom = useCallback((next) => {
        setZoomMode("custom");
        setZoomLevel(Math.max(0.1, Math.min(10, next)));
    }, []);
    const handleFit = useCallback(() => {
        setZoomMode("fit");
        setPanX(0);
        setPanY(0);
    }, []);
    // Measure stage bounds for accurate fit calculation
    useLayoutEffect(() => {
        const stage = stageRef.current;
        if (!stage || !open)
            return;
        const observer = new ResizeObserver(([entry]) => {
            setStageBounds({ width: entry.contentRect.width, height: entry.contentRect.height });
        });
        observer.observe(stage);
        setStageBounds({ width: stage.clientWidth, height: stage.clientHeight });
        return () => observer.disconnect();
    }, [open]);
    // Pan / Drag handlers
    const onPointerDown = useCallback((e) => {
        if (e.target.closest("button") || e.target.closest("select"))
            return;
        dragRef.current = { x: e.clientX, y: e.clientY, panX, panY };
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [panX, panY]);
    const onPointerMove = useCallback((e) => {
        if (!dragRef.current)
            return;
        setPanX(dragRef.current.panX + e.clientX - dragRef.current.x);
        setPanY(dragRef.current.panY + e.clientY - dragRef.current.y);
    }, []);
    const onPointerUp = useCallback(() => {
        dragRef.current = null;
        setIsDragging(false);
    }, []);
    // Wheel zoom
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage || !open)
            return;
        function onWheel(e) {
            e.preventDefault();
            setZoomMode("custom");
            setZoomLevel(prev => {
                const base = zoomMode === "fit" ? fitScale : prev;
                return Math.max(0.1, Math.min(10, base * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
            });
        }
        stage.addEventListener("wheel", onWheel, { passive: false });
        return () => stage.removeEventListener("wheel", onWheel);
    }, [open, zoomMode, fitScale]);
    // Navigate prev / next
    const moveViewer = useCallback((step) => {
        if (currentIndex < 0 || !items.length || !onNavigate)
            return;
        const next = Math.max(0, Math.min(items.length - 1, currentIndex + step));
        onNavigate(next);
        setPanX(0);
        setPanY(0);
        setZoomMode("fit");
    }, [currentIndex, items.length, onNavigate]);
    // Keyboard navigation
    useEffect(() => {
        if (!open)
            return;
        function onKeyDown(e) {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
            else if (e.key === "PageUp") {
                e.preventDefault();
                moveViewer(-1);
            }
            else if (e.key === "PageDown") {
                e.preventDefault();
                moveViewer(1);
            }
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, onClose, moveViewer]);
    // Auto-fit on open or item change
    useEffect(() => {
        if (open && item) {
            setPanX(0);
            setPanY(0);
            setZoomMode("fit");
            setShowAnnotation(true);
        }
    }, [open, item?.id]);
    if (!open || !item)
        return null;
    const bboxes = item.bboxes || [];
    const filename = item.title.split("/").pop() || item.title;
    const content = (_jsx("div", { id: "full-overlay", className: "full-overlay", role: "presentation", children: _jsxs("section", { className: "full-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u539F\u56FE\u68C0\u89C6\u5668", children: [_jsxs("header", { className: "full-toolbar", role: "toolbar", "aria-label": "\u56FE\u50CF\u67E5\u770B\u5DE5\u5177", children: [_jsx("div", { className: "full-file", id: "full-file-name", title: item.title, style: { color: "#f4f7fd" }, children: filename }), _jsxs("div", { className: "full-actions", children: [_jsx("button", { type: "button", id: "zoom-out", title: "\u7F29\u5C0F", "aria-label": "\u7F29\u5C0F", onClick: () => setZoom(effectiveScale / 1.25), children: _jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "11", cy: "11", r: "7" }), _jsx("path", { d: "m21 21-4.35-4.35M8 11h6" })] }) }), _jsxs("span", { className: "zoom-wrap", style: { background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.22)" }, children: [_jsxs("select", { id: "zoom", title: "\u7F29\u653E\u6BD4\u4F8B", "aria-label": "\u7F29\u653E\u6BD4\u4F8B", style: { color: "#f4f7fd", background: "transparent" }, value: zoomMode === "fit"
                                                ? "fit"
                                                : [0.5, 1, 1.5, 2].some(v => Math.abs(effectiveScale - v) < 0.001)
                                                    ? String(effectiveScale)
                                                    : "custom", onChange: e => {
                                                const v = e.target.value;
                                                if (v === "fit") {
                                                    handleFit();
                                                }
                                                else if (v !== "custom") {
                                                    setZoom(Number(v));
                                                }
                                            }, children: [_jsx("option", { value: "fit", children: "\u9002\u5E94\u7A97\u53E3" }), _jsx("option", { value: "0.5", children: "50%" }), _jsx("option", { value: "1", children: "100%" }), _jsx("option", { value: "1.5", children: "150%" }), _jsx("option", { value: "2", children: "200%" }), _jsx("option", { value: "custom", children: zoomMode === "fit"
                                                        ? "自定义"
                                                        : [0.5, 1, 1.5, 2].some(v => Math.abs(effectiveScale - v) < 0.001)
                                                            ? "自定义"
                                                            : `${Math.round(effectiveScale * 100)}%` })] }), _jsx("span", { className: "zoom-chevron", "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 24 24", children: _jsx("path", { d: "m6 9 6 6 6-6" }) }) })] }), _jsx("button", { type: "button", id: "zoom-in", title: "\u653E\u5927", "aria-label": "\u653E\u5927", onClick: () => setZoom(effectiveScale * 1.25), children: _jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "11", cy: "11", r: "7" }), _jsx("path", { d: "m21 21-4.35-4.35M11 8v6M8 11h6" })] }) }), _jsx("button", { type: "button", id: "fit", title: "\u9002\u5E94\u7A97\u53E3", "aria-label": "\u9002\u5E94\u7A97\u53E3", onClick: handleFit, children: _jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "2.8" }), _jsx("path", { d: "M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" })] }) }), _jsx("button", { type: "button", id: "annotation-toggle", title: showAnnotation ? "隐藏标注" : "查看标注", "aria-label": showAnnotation ? "隐藏标注" : "查看标注", "aria-pressed": showAnnotation, disabled: bboxes.length === 0, onClick: () => setShowAnnotation(v => !v), children: _jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" }), !showAnnotation && _jsx("path", { d: "m3 3 18 18" })] }) }), _jsx("button", { type: "button", className: "full-close", id: "full-close", title: "\u5173\u95ED", "aria-label": "\u5173\u95ED", onClick: onClose, children: _jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M18 6 6 18M6 6l12 12" }) }) })] })] }), _jsxs("div", { className: `full-stage ${isDragging ? "dragging" : ""}`, id: "stage", tabIndex: 0, ref: stageRef, "aria-label": "\u5927\u56FE\u67E5\u770B\u533A\u57DF", onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerCancel: onPointerUp, children: [_jsxs("div", { id: "image-world", ref: worldRef, className: "full-image-world", style: {
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: `${imgW}px`,
                                height: `${imgH}px`,
                                transformOrigin: "center",
                                transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${effectiveScale})`,
                            }, children: [_jsx("img", { id: "big-image", ref: bigImageRef, src: item.imageUrl, alt: filename, draggable: false, style: {
                                        width: "100%",
                                        height: "100%",
                                        display: "block",
                                        objectFit: "contain",
                                        pointerEvents: "none",
                                        userSelect: "none",
                                    }, onLoad: e => {
                                        const img = e.currentTarget;
                                        if (img.naturalWidth && img.naturalHeight) {
                                            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                                        }
                                    } }), showAnnotation && (_jsx("span", { id: "full-annotation-layer", className: "full-annotation-layer", children: bboxes.map((box, bIdx) => {
                                        if (!box.bbox)
                                            return null;
                                        const [x1, y1, x2, y2] = box.bbox;
                                        return (_jsx("span", { className: "bbox", "data-label": box.raw_label.replace(/^类别\s*/, ""), style: {
                                                position: "absolute",
                                                left: `${((x1 / imgW) * 100).toFixed(3)}%`,
                                                top: `${((y1 / imgH) * 100).toFixed(3)}%`,
                                                width: `${(((x2 - x1) / imgW) * 100).toFixed(3)}%`,
                                                height: `${(((y2 - y1) / imgH) * 100).toFixed(3)}%`,
                                            } }, box.annotation_id || bIdx));
                                    }) }))] }), items.length > 1 && onNavigate && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "full-side-nav prev", id: "prev-img", "aria-label": "\u4E0A\u4E00\u5F20\u56FE\u50CF", title: "\u4E0A\u4E00\u5F20\u56FE\u50CF", disabled: currentIndex <= 0, onClick: e => {
                                        e.stopPropagation();
                                        moveViewer(-1);
                                    }, children: "\u2039" }), _jsx("button", { type: "button", className: "full-side-nav next", id: "next-img", "aria-label": "\u4E0B\u4E00\u5F20\u56FE\u50CF", title: "\u4E0B\u4E00\u5F20\u56FE\u50CF", disabled: currentIndex >= items.length - 1, onClick: e => {
                                        e.stopPropagation();
                                        moveViewer(1);
                                    }, children: "\u203A" })] }))] })] }) }));
    if (typeof document !== "undefined") {
        return createPortal(content, document.body);
    }
    return content;
}
