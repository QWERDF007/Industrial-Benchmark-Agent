import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { FloatingMenu } from "./FloatingMenu.js";
import { MediaImage, MediaLoad } from "./MediaLoad.js";
import { AnnotationLayer } from "./AnnotationLayer.js";
import { regionSources } from "../api.js";
import { InspectionOverlay, InspectionPanel } from "./InspectionEvidence.js";
import { resolveInspection } from "../inspection.js";
import { useWorkspace } from "../workspace.js";
const emptyHover = { ids: [], dismissed: false, x: 0, y: 0 };
const minScale = 0.02, maxScale = 16;
export function AnnotatedImage({ image, visible = true, onLoad }) {
    return _jsxs("div", { className: "iad-image-frame", children: [_jsx(MediaImage, { src: image.src, alt: image.title, width: image.width, height: image.height, "data-media-label": "\u56FE\u50CF", draggable: false, onLoad: onLoad }), visible && image.annotationLayer && _jsx(AnnotationLayer, { source: image.annotationLayer })] });
}
export function ImageCanvas({ image, onClose, navigation, embedded = false, onExpand, context, closeLabel, control, focusRegion, overlay }) {
    const { workspace } = useWorkspace();
    const reference = image.inspection?.reference;
    const source = JSON.stringify(reference ? [reference.dataset_id, reference.sample_id, reference.suggestion_id] : [image.src]);
    return _jsx(CanvasViewport, { image: image, onClose: onClose, navigation: navigation, embedded: embedded, context: context, closeLabel: closeLabel, onExpand: onExpand, control: control, focusRegion: focusRegion, overlay: overlay, savedView: workspace.imageView(source), onRemember: view => workspace.rememberImageView(source, view) }, JSON.stringify([source, image.src]));
}
function CanvasViewport({ image, onClose, navigation, savedView, onRemember, embedded, onExpand, context, closeLabel, control, focusRegion, overlay }) {
    const viewport = useRef(null);
    const world = useRef(null);
    const layerMenu = useRef(null);
    const inspection = image.inspection;
    const [selection, setSelection] = useState(() => inspection ? image.initialSelection === undefined ? savedView?.selection || null : image.initialSelection : null);
    const initialTransform = image.initialTransform || (image.initialSelection === undefined || JSON.stringify(image.initialSelection) === JSON.stringify(savedView?.selection) ? savedView?.transform : undefined);
    const [hover, setHover] = useState(emptyHover);
    const hintId = useId();
    const [auxiliary, setAuxiliary] = useState(context ? "context" : "inspection");
    const [showEvidence, setShowEvidence] = useState(!!image.initialSelection);
    const [choices, setChoices] = useState([]);
    const { finding, evidence, region } = resolveInspection(inspection?.analysis, selection);
    const selectedId = region?.image.evidence_id || "";
    const [size, setSize] = useState({ width: image.width || 0, height: image.height || 0 });
    const [bounds, setBounds] = useState({ width: 0, height: 0 });
    const [localView, setLocalView] = useState({ scale: 0, x: 0, y: 0 });
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
        if (image.initialSelection) {
            if (region)
                initial[region.source] = true;
            if (finding?.location.scope === "local")
                initial.model = true;
        }
        return initial;
    });
    const regions = inspection?.analysis.regions.filter(region => region.origins.some(origin => layers[origin.source])) || [];
    const hoveredRegions = regions.filter(region => hover.ids.includes(region.image.evidence_id));
    const hint = !hover.dismissed && hoveredRegions[0];
    useEffect(() => { localStorage.setItem("iad.image-layers", JSON.stringify(layers)); }, [layers]);
    const drag = useRef(null);
    const fit = size.width && size.height ? Math.min(bounds.width / size.width, bounds.height / size.height) : 1;
    const view = control ? { scale: control.transform.zoom * fit, x: control.transform.x, y: control.transform.y } : localView;
    function setView(update) {
        if (control)
            control.onChange(previous => {
                const current = { scale: previous.zoom * fit, x: previous.x, y: previous.y };
                const next = typeof update === 'function' ? update(current) : update;
                return { zoom: next.scale && fit ? next.scale / fit : 0, x: next.x, y: next.y };
            });
        else
            setLocalView(update);
    }
    const scale = view.scale || fit;
    const remembered = useRef({ onRemember, view: { selection, transform: { zoom: 0, x: 0, y: 0 } } });
    remembered.current = { onRemember, view: { selection, transform: { zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y } } };
    useEffect(() => () => remembered.current.onRemember(remembered.current.view), []);
    useEffect(() => {
        if (!focusRegion || !bounds.width || !size.width)
            return;
        const [x1, y1, x2, y2] = focusRegion.bbox.map((value, index) => value * (index % 2 ? size.height / (image.height || size.height) : size.width / (image.width || size.width)));
        const next = Math.min(maxScale, bounds.width / Math.max(1, (x2 - x1) * 1.6), bounds.height / Math.max(1, (y2 - y1) * 1.6));
        setView({ scale: next, x: (size.width / 2 - (x1 + x2) / 2) * next, y: (size.height / 2 - (y1 + y2) / 2) * next });
    }, [focusRegion?.id, bounds.width, bounds.height, size.width, size.height]);
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
        if (!restoredTransform.current && initialTransform) {
            restoredTransform.current = true;
            setView({ scale: initialTransform.zoom ? initialTransform.zoom * fit : 0, x: initialTransform.x, y: initialTransform.y });
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
        setShowEvidence(!!target);
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
        else if (onClose) {
            onRemember(remembered.current.view);
            onClose();
        }
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
    }, [fit, !!control]);
    const fixed = [0, 1, 1.5, 2].includes(view.scale);
    const closeButton = onClose && _jsx("button", { onClick: () => { onRemember(remembered.current.view); onClose(); }, children: closeLabel || "关闭" });
    return _jsxs("div", { className: embedded ? "iad-image-canvas iad-embedded-canvas" : "iad-image-canvas iad-lightbox", onKeyDown: event => { if (navigation && ["PageUp", "PageDown"].includes(event.key) && !event.target.closest("input,select,textarea")) {
            event.preventDefault();
            event.stopPropagation();
            const offset = event.key === "PageUp" ? -1 : 1;
            if (!navigation.busy && (offset === -1 ? navigation.previous : navigation.next))
                navigation.move(offset);
        } if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            cancel();
        } }, children: [_jsxs("div", { className: "iad-lightbox-toolbar", children: [context && closeButton, _jsxs("div", { className: "iad-viewer-heading", children: [_jsx("strong", { title: image.title, children: image.title }), image.caption && _jsx("small", { children: image.caption })] }), _jsxs("div", { className: "iad-viewer-zoom", role: "group", "aria-label": "\u56FE\u50CF\u7F29\u653E", children: [_jsx("button", { className: "iad-icon-button", "aria-label": "\u7F29\u5C0F", title: "\u7F29\u5C0F", disabled: scale <= minScale, onClick: () => zoomBy(0.5), children: _jsx("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: _jsx("path", { d: "M5 12h14" }) }) }), _jsxs("select", { "aria-label": "\u7F29\u653E", value: fixed ? view.scale : "custom", onChange: e => {
                                    const next = Number(e.target.value);
                                    if (next)
                                        zoomBy(next / scale);
                                    else {
                                        setView({ scale: 0, x: 0, y: 0 });
                                        setHover(emptyHover);
                                    }
                                }, children: [_jsx("option", { value: 0, children: "\u9002\u5E94\u7A97\u53E3" }), _jsx("option", { value: 1, children: "100%" }), _jsx("option", { value: 1.5, children: "150%" }), _jsx("option", { value: 2, children: "200%" }), !fixed && _jsxs("option", { value: "custom", children: [Math.round(scale * 100), "%"] })] }), _jsx("button", { className: "iad-icon-button", "aria-label": "\u653E\u5927", title: "\u653E\u5927", disabled: scale >= maxScale, onClick: () => zoomBy(2), children: _jsx("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: _jsx("path", { d: "M5 12h14M12 5v14" }) }) })] }), (image.annotationLayer || inspection) && _jsx("button", { className: "iad-icon-button", title: layers.annotation ? "隐藏标注" : "显示标注", "aria-label": layers.annotation ? "隐藏标注" : "显示标注", "aria-pressed": layers.annotation, onClick: () => setLayers(previous => ({ ...previous, annotation: !previous.annotation })), children: _jsxs("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: [_jsx("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" }), !layers.annotation && _jsx("path", { d: "m3 3 18 18" })] }) }), inspection && _jsx(FloatingMenu, { detailsRef: layerMenu, className: "iad-layer-menu", label: "\u53EF\u89C6\u56FE\u5C42", summary: "\u56FE\u5C42", children: Object.keys(regionSources).map(source => {
                            const label = { annotation: "标注", model: "模型候选", coverage: "细节覆盖" }[source];
                            return _jsxs("label", { children: [_jsx("input", { type: "checkbox", "aria-label": `${label}图层`, checked: layers[source], onChange: event => setLayers(previous => ({ ...previous, [source]: event.target.checked })) }), label] }, source);
                        }) }), navigation && embedded && _jsxs("div", { className: "iad-viewer-navigation", role: "group", "aria-label": "\u56FE\u50CF\u5207\u6362", children: [_jsx("button", { className: "iad-image-step", disabled: navigation.busy || !navigation.previous, onClick: () => navigation.move(-1), children: "\u524D\u4E00\u5F20" }), _jsx("button", { className: "iad-image-step", disabled: navigation.busy || !navigation.next, onClick: () => navigation.move(1), children: "\u540E\u4E00\u5F20" }), navigation.busy && _jsx("span", { role: "status", children: "\u6B63\u5728\u5207\u6362\u56FE\u50CF\u2026" })] }), navigation && !embedded && navigation.busy && _jsx("span", { className: "iad-visually-hidden", role: "status", children: "\u6B63\u5728\u5207\u6362\u56FE\u50CF\u2026" }), onExpand && _jsx("button", { className: "iad-icon-button", "aria-label": "\u5168\u5C4F\u68C0\u89C6", title: "\u5168\u5C4F\u68C0\u89C6", onClick: () => { onRemember(remembered.current.view); onExpand(remembered.current.view); }, children: _jsx("svg", { width: "21", height: "21", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: _jsx("path", { d: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" }) }) }), !context && closeButton] }), navigation?.error && _jsx("p", { role: "alert", className: "iad-error", children: navigation.error }), _jsxs("div", { className: `iad-viewer-body ${inspection && !embedded ? "has-inspection" : ""} ${context ? "has-context" : ""}`, children: [_jsxs(MediaLoad, { className: "iad-viewer-media", primarySource: image.src, children: [_jsxs("div", { className: "iad-viewer-viewport", ref: viewport, tabIndex: 0, "aria-label": "\u56FE\u50CF\u89C6\u53E3", "aria-describedby": hint ? hintId : undefined, onKeyDown: event => {
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
                                        setShowEvidence(!!ids.length);
                                    }
                                } }, onPointerCancel: () => { drag.current = null; }, children: [_jsxs("div", { className: "iad-viewer-world", ref: world, "data-scale": scale, style: { width: size.width, height: size.height, "--iad-view-scale": scale,
                                            transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})` }, children: [_jsx(AnnotatedImage, { image: { ...image, ...size }, visible: layers.annotation, onLoad: event => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }) }), overlay, inspection && _jsx(InspectionOverlay, { inspection: inspection, selectedId: selectedId, hoveredIds: hover.ids, regions: regions, finding: layers.model ? finding : undefined })] }), hint && _jsxs("div", { id: hintId, role: "tooltip", className: "iad-roi-hint", style: { left: hover.x, top: hover.y + (hover.y < bounds.height / 2 ? 1 : 0), transform: hover.y >= bounds.height / 2 ? "translateY(-100%)" : undefined }, onPointerMove: event => event.stopPropagation(), onPointerDown: event => event.stopPropagation(), children: [regionSources[hint.source], " \u00B7 ", hint.label.slice(0, 80), hint.label.length > 80 ? "…" : "", hoveredRegions.length > 1 ? ` · ${hoveredRegions.length} 个重叠区域` : ""] })] }), !embedded && navigation && _jsx("nav", { className: "iad-viewer-edge-nav", "aria-label": "\u56FE\u7247\u5207\u6362", children: [-1, 1].map(offset => _jsx("button", { type: "button", className: "iad-viewer-edge-button", "aria-label": offset === -1 ? "上一张图像" : "下一张图像", title: offset === -1 ? "上一张" : "下一张", disabled: navigation.busy || !(offset === -1 ? navigation.previous : navigation.next), onClick: () => navigation.move(offset), children: _jsx("span", { className: "iad-viewer-edge-disc", "aria-hidden": "true", children: _jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.3", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: offset === -1 ? "m15 4-8 8 8 8" : "m9 4 8 8-8 8" }) }) }) }, offset)) }), context && _jsx("p", { className: "iad-viewer-hint", children: "\u62D6\u52A8\u5E73\u79FB \u00B7 \u6EDA\u8F6E\u7F29\u653E \u00B7 PgUp/PgDn \u5207\u6362" })] }, image.src), (context || (inspection && !embedded)) && _jsxs("div", { className: "iad-viewer-aux", children: [context && inspection && _jsxs("div", { className: "iad-tabs", children: [_jsx("button", { className: auxiliary === "context" ? "active" : "", onClick: () => setAuxiliary("context"), children: "\u56FE\u50CF\u8BC1\u636E" }), _jsx("button", { className: auxiliary === "inspection" ? "active" : "", onClick: () => setAuxiliary("inspection"), children: "\u68C0\u89C6\u5206\u6790" })] }), context && auxiliary === "context" && context, inspection && (!context || auxiliary === "inspection") && _jsx(InspectionPanel, { inspection: inspection, selection: selection, choices: choices, onSelect: select, transform: () => ({ zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y }) })] }), inspection && embedded && _jsxs("details", { className: "iad-embedded-evidence", open: showEvidence, onToggle: event => setShowEvidence(event.currentTarget.open), children: [_jsx("summary", { children: "\u8BC1\u636E\u4E0E\u5206\u6790" }), "    ", _jsx(InspectionPanel, { inspection: inspection, selection: selection, choices: choices, onSelect: select, transform: () => ({ zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y }) })] })] })] });
}
