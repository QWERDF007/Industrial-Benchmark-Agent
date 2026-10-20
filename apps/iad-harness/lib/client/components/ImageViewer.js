import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Modal } from "./Modal.js";
import { MediaImage, MediaLoad } from "./MediaLoad.js";
import { AnnotationLayer } from "./AnnotationLayer.js";
import { regionSources } from "../api.js";
import { InspectionOverlay, InspectionPanel } from "./InspectionEvidence.js";
import { resolveInspection } from "../inspection.js";
const emptyHover = { ids: [], dismissed: false, x: 0, y: 0 };
const minScale = 0.02, maxScale = 16;
export function AnnotatedImage({ image, visible = true, onLoad }) {
    return _jsxs("div", { className: "iad-image-frame", children: [_jsx(MediaImage, { src: image.src, alt: image.title, width: image.width, height: image.height, "data-media-label": "\u56FE\u50CF", draggable: false, onLoad: onLoad }), visible && image.annotationLayer && _jsx(AnnotationLayer, { source: image.annotationLayer })] });
}
export function ImageViewer({ image, onClose }) {
    const viewport = useRef(null);
    const world = useRef(null);
    const layerMenu = useRef(null);
    const inspection = image.inspection;
    const [selection, setSelection] = useState(() => inspection ? image.initialSelection || null : null);
    const [hover, setHover] = useState(emptyHover);
    const hintId = useId();
    const [choices, setChoices] = useState([]);
    const { finding, evidence, region } = resolveInspection(inspection?.analysis, selection);
    const selectedId = region?.image.evidence_id || "";
    const [size, setSize] = useState({ width: image.width || 0, height: image.height || 0 });
    const [bounds, setBounds] = useState({ width: 0, height: 0 });
    const [view, setView] = useState({ scale: 0, x: 0, y: 0 });
    const focusedSelection = useRef();
    const restoredTransform = useRef(false);
    const [layers, setLayers] = useState(() => {
        const initial = { annotation: true, model: true, coverage: true };
        try {
            const saved = JSON.parse(localStorage.getItem("iad.image-layers") || "null");
            for (const key of Object.keys(initial)) {
                if (typeof saved?.[key] === "boolean")
                    initial[key] = saved[key];
            }
        }
        catch {
            localStorage.removeItem("iad.image-layers");
        }
        if (region)
            initial[region.source] = true;
        if (finding?.location.scope === "local")
            initial.model = true;
        return initial;
    });
    const regions = inspection?.analysis.regions.filter(region => region.origins.some(origin => layers[origin.source])) || [];
    const hoveredRegions = regions.filter(region => hover.ids.includes(region.image.evidence_id));
    const hint = !hover.dismissed && hoveredRegions[0];
    useEffect(() => { localStorage.setItem("iad.image-layers", JSON.stringify(layers)); }, [layers]);
    const drag = useRef(null);
    const fit = size.width && size.height ? Math.min(bounds.width / size.width, bounds.height / size.height) : 1;
    const scale = view.scale || fit;
    useLayoutEffect(() => {
        const element = viewport.current;
        const observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    useEffect(() => {
        if (!bounds.width || !bounds.height || !size.width || !size.height)
            return;
        const key = JSON.stringify(selection);
        if (focusedSelection.current === key)
            return;
        focusedSelection.current = key;
        if (!restoredTransform.current && image.initialTransform) {
            restoredTransform.current = true;
            setView({ scale: image.initialTransform.zoom ? image.initialTransform.zoom * fit : 0, x: image.initialTransform.x, y: image.initialTransform.y });
            return;
        }
        if (!inspection || !selection)
            return;
        const box = selection.kind === "evidence" ? evidence?.role === "overview" ? null : evidence?.crop_bbox : finding?.location.bbox;
        if (!box) {
            setView({ scale: 0, x: 0, y: 0 });
            return;
        }
        const [x1, y1, x2, y2] = box.map((value, axis) => value * (axis % 2 ? size.height : size.width) / inspection.analysis.overview.original_size[axis % 2]);
        const scale = Math.min(maxScale, bounds.width / ((x2 - x1) * 1.4), bounds.height / ((y2 - y1) * 1.4));
        setView({ scale, x: (size.width / 2 - (x1 + x2) / 2) * scale, y: (size.height / 2 - (y1 + y2) / 2) * scale });
    }, [selection, inspection, finding, evidence, bounds.width, bounds.height, size.width, size.height]);
    function select(target) {
        const { region: targetRegion, finding: targetFinding } = resolveInspection(inspection?.analysis, target);
        if (targetRegion)
            setLayers(previous => ({ ...previous, [targetRegion.source]: true }));
        if (targetFinding?.location.scope === "local")
            setLayers(previous => ({ ...previous, model: true }));
        setSelection(target);
        setChoices([]);
        setHover(emptyHover);
    }
    function regionsAt(event) {
        if (!inspection || !world.current)
            return [];
        const rect = world.current.getBoundingClientRect();
        const x = (event.clientX - rect.left) * inspection.analysis.overview.original_size[0] / rect.width;
        const y = (event.clientY - rect.top) * inspection.analysis.overview.original_size[1] / rect.height;
        return regions.filter(region => x >= region.crop_bbox[0] && x <= region.crop_bbox[2] && y >= region.crop_bbox[1] && y <= region.crop_bbox[3]).map(region => region.image.evidence_id);
    }
    function cancel() {
        if (layerMenu.current?.open) {
            layerMenu.current.open = false;
            layerMenu.current.querySelector("summary")?.focus();
        }
        else if (hint)
            setHover(previous => ({ ...previous, dismissed: true }));
        else if (choices.length)
            setChoices([]);
        else if (selection)
            setSelection(null);
        else
            onClose();
    }
    function zoomBy(factor, anchorX = 0, anchorY = 0) {
        setHover(emptyHover);
        setView(previous => {
            const oldScale = previous.scale || fit;
            const next = Math.max(minScale, Math.min(maxScale, oldScale * factor));
            return { scale: next, x: anchorX - (anchorX - previous.x) * next / oldScale, y: anchorY - (anchorY - previous.y) * next / oldScale };
        });
    }
    useEffect(() => {
        const element = viewport.current;
        const wheel = (event) => {
            event.preventDefault();
            const rect = element.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2;
            zoomBy(Math.exp(-event.deltaY * 0.0015), x, y);
        };
        element.addEventListener("wheel", wheel, { passive: false });
        return () => element.removeEventListener("wheel", wheel);
    }, [fit]);
    const fixed = [0, 1, 1.5, 2].includes(view.scale);
    return _jsx(Modal, { title: "\u539F\u56FE\u68C0\u89C6\u5668", className: "iad-viewer-dialog", onClose: cancel, children: _jsxs("div", { className: "iad-lightbox", children: [_jsxs("div", { className: "iad-lightbox-toolbar", children: [_jsx("strong", { children: image.title }), _jsx("button", { className: "iad-eye", "aria-label": "\u7F29\u5C0F", title: "\u7F29\u5C0F", disabled: scale <= minScale, onClick: () => zoomBy(0.5), children: _jsx("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: _jsx("path", { d: "M5 12h14" }) }) }), _jsxs("select", { "aria-label": "\u7F29\u653E", value: fixed ? view.scale : "custom", onChange: e => {
                                const next = Number(e.target.value);
                                if (next)
                                    zoomBy(next / scale);
                                else {
                                    setView({ scale: 0, x: 0, y: 0 });
                                    setHover(emptyHover);
                                }
                            }, children: [_jsx("option", { value: 0, children: "\u9002\u5E94\u7A97\u53E3" }), _jsx("option", { value: 1, children: "100%" }), _jsx("option", { value: 1.5, children: "150%" }), _jsx("option", { value: 2, children: "200%" }), !fixed && _jsxs("option", { value: "custom", children: [Math.round(scale * 100), "%"] })] }), _jsx("button", { className: "iad-eye", "aria-label": "\u653E\u5927", title: "\u653E\u5927", disabled: scale >= maxScale, onClick: () => zoomBy(2), children: _jsx("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: _jsx("path", { d: "M5 12h14M12 5v14" }) }) }), (image.annotationLayer || inspection) && _jsx("button", { className: "iad-eye", title: layers.annotation ? "隐藏标注" : "显示标注", "aria-label": layers.annotation ? "隐藏标注" : "显示标注", "aria-pressed": layers.annotation, onClick: () => setLayers(previous => ({ ...previous, annotation: !previous.annotation })), children: _jsxs("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: [_jsx("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" }), !layers.annotation && _jsx("path", { d: "m3 3 18 18" })] }) }), inspection && _jsxs("details", { ref: layerMenu, className: "iad-layer-menu", children: [_jsx("summary", { "aria-label": "\u53EF\u89C6\u56FE\u5C42", children: "\u56FE\u5C42" }), _jsx("div", { children: Object.keys(regionSources).map(source => {
                                        const label = { annotation: "标注", model: "模型候选", coverage: "细节覆盖" }[source];
                                        return _jsxs("label", { children: [_jsx("input", { type: "checkbox", "aria-label": `${label}图层`, checked: layers[source], onChange: event => setLayers(previous => ({ ...previous, [source]: event.target.checked })) }), label] }, source);
                                    }) })] }), _jsx("button", { onClick: onClose, children: "\u5173\u95ED" })] }), _jsxs("div", { className: `iad-viewer-body ${inspection ? "has-inspection" : ""}`, children: [_jsx(MediaLoad, { className: "iad-viewer-media", children: _jsxs("div", { className: "iad-viewer-viewport", ref: viewport, tabIndex: 0, "aria-label": "\u56FE\u50CF\u89C6\u53E3", "aria-describedby": hint ? hintId : undefined, onKeyDown: event => {
                                    const direction = { ArrowLeft: [20, 0], ArrowRight: [-20, 0], ArrowUp: [0, 20], ArrowDown: [0, -20] }[event.key];
                                    if (direction) {
                                        event.preventDefault();
                                        setView(previous => ({ ...previous, x: previous.x + direction[0], y: previous.y + direction[1] }));
                                    }
                                }, onPointerDown: event => { if (event.button !== 0)
                                    return; setHover(emptyHover); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, panX: view.x, panY: view.y, moved: false }; }, onPointerMove: event => {
                                    const start = drag.current;
                                    if (start) {
                                        const dx = event.clientX - start.x, dy = event.clientY - start.y;
                                        start.moved ||= Math.hypot(dx, dy) > 4;
                                        if (start.moved)
                                            setView(previous => ({ ...previous, x: start.panX + dx, y: start.panY + dy }));
                                    }
                                    else if (inspection && event.pointerType !== "touch") {
                                        const ids = regionsAt(event);
                                        const rect = event.currentTarget.getBoundingClientRect();
                                        const x = Math.max(12, Math.min(event.clientX - rect.left, rect.width - 292)), y = event.clientY - rect.top;
                                        setHover(previous => ids.length === previous.ids.length && ids.every((id, index) => id === previous.ids[index]) ? previous : { ids, dismissed: false, x, y });
                                    }
                                }, onPointerLeave: () => setHover(emptyHover), onPointerUp: event => { const start = drag.current; drag.current = null; if (start && !start.moved && inspection) {
                                    const ids = regionsAt(event);
                                    if (ids.length === 1)
                                        select({ kind: "evidence", id: ids[0] });
                                    else {
                                        setSelection(null);
                                        setChoices(ids);
                                    }
                                } }, onPointerCancel: () => { drag.current = null; }, children: [_jsxs("div", { className: "iad-viewer-world", ref: world, "data-scale": scale, style: { width: size.width, height: size.height, "--iad-view-scale": scale,
                                            transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})` }, children: [_jsx(AnnotatedImage, { image: { ...image, ...size }, visible: layers.annotation, onLoad: event => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }) }), inspection && _jsx(InspectionOverlay, { inspection: inspection, selectedId: selectedId, hoveredIds: hover.ids, regions: regions, finding: layers.model ? finding : undefined })] }), hint && _jsxs("div", { id: hintId, role: "tooltip", className: "iad-roi-hint", style: { left: hover.x, top: hover.y + (hover.y < bounds.height / 2 ? 1 : 0), transform: hover.y >= bounds.height / 2 ? "translateY(-100%)" : undefined }, onPointerMove: event => event.stopPropagation(), onPointerDown: event => event.stopPropagation(), children: [regionSources[hint.source], " \u00B7 ", hint.label.slice(0, 80), hint.label.length > 80 ? "…" : "", hoveredRegions.length > 1 ? ` · ${hoveredRegions.length} 个重叠区域` : ""] })] }) }, image.src), inspection && _jsx(InspectionPanel, { inspection: inspection, selection: selection, choices: choices, onSelect: select, transform: () => ({ zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y }) })] })] }) });
}
