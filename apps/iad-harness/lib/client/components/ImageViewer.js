import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
export function AnnotatedImage({ image, visible = true }) {
    return _jsxs("div", { className: "iad-image-frame", children: [_jsx("img", { src: image.src, alt: image.title, draggable: false }), visible && image.annotations && _jsx("svg", { className: "iad-annotation-layer", viewBox: `0 0 ${image.width} ${image.height}`, preserveAspectRatio: "none", children: image.annotations.filter(a => a.geometry_status !== "INVALID").map(a => _jsxs("g", { children: [a.polygon ? _jsx("polygon", { points: a.polygon.map(p => p.join(",")).join(" ") }) : a.bbox && _jsx("rect", { x: a.bbox[0], y: a.bbox[1], width: a.bbox[2] - a.bbox[0], height: a.bbox[3] - a.bbox[1] }), a.bbox && _jsx("text", { x: a.bbox[0], y: Math.max(12, a.bbox[1] - 4), children: a.raw_label })] }, a.annotation_id)) }), image.focus && _jsx("svg", { className: "iad-finding-layer", "data-finding-id": image.focus.findingId, viewBox: `0 0 ${image.width} ${image.height}`, preserveAspectRatio: "none", "aria-label": image.focus.label, children: _jsx("rect", { x: image.focus.bbox[0], y: image.focus.bbox[1], width: image.focus.bbox[2] - image.focus.bbox[0], height: image.focus.bbox[3] - image.focus.bbox[1] }) })] });
}
export function ImageViewer({ image, onClose }) {
    const viewport = useRef(null);
    const [size, setSize] = useState({ width: image.width || 0, height: image.height || 0 });
    const [bounds, setBounds] = useState({ width: 0, height: 0 });
    const [view, setView] = useState({ scale: 0, x: 0, y: 0 });
    const [visible, setVisible] = useState(true);
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
        const source = new Image();
        source.onload = () => setSize({ width: source.naturalWidth, height: source.naturalHeight });
        source.src = image.src;
        const key = (event) => { if (event.key === "Escape")
            onClose(); };
        window.addEventListener("keydown", key);
        return () => { source.onload = null; window.removeEventListener("keydown", key); };
    }, [image.src, onClose]);
    useEffect(() => {
        if (!image.focus || !bounds.width || !bounds.height || !size.width || !size.height)
            return;
        const [x1, y1, x2, y2] = image.focus.bbox;
        const scale = Math.min(16, bounds.width / ((x2 - x1) * 1.4), bounds.height / ((y2 - y1) * 1.4));
        setView({ scale, x: (size.width / 2 - (x1 + x2) / 2) * scale, y: (size.height / 2 - (y1 + y2) / 2) * scale });
    }, [image.focus, bounds.width, bounds.height, size.width, size.height]);
    useEffect(() => {
        const element = viewport.current;
        const wheel = (event) => {
            event.preventDefault();
            const rect = element.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2;
            setView(previous => {
                const oldScale = previous.scale || fit;
                const next = Math.max(0.02, Math.min(16, oldScale * Math.exp(-event.deltaY * 0.0015)));
                return { scale: next, x: x - (x - previous.x) * next / oldScale, y: y - (y - previous.y) * next / oldScale };
            });
        };
        element.addEventListener("wheel", wheel, { passive: false });
        return () => element.removeEventListener("wheel", wheel);
    }, [fit]);
    const fixed = [0, 1, 1.5, 2].includes(view.scale);
    return _jsxs("div", { className: "iad-lightbox", role: "dialog", "aria-modal": "true", "aria-label": "\u539F\u56FE\u68C0\u89C6\u5668", children: [_jsxs("div", { className: "iad-lightbox-toolbar", children: [_jsx("strong", { children: image.title }), _jsxs("select", { "aria-label": "\u7F29\u653E", value: fixed ? view.scale : "custom", onChange: e => setView({ scale: Number(e.target.value), x: 0, y: 0 }), children: [_jsx("option", { value: 0, children: "\u9002\u5E94\u7A97\u53E3" }), _jsx("option", { value: 1, children: "100%" }), _jsx("option", { value: 1.5, children: "150%" }), _jsx("option", { value: 2, children: "200%" }), !fixed && _jsxs("option", { value: "custom", children: [Math.round(scale * 100), "%"] })] }), image.annotations && _jsx("button", { className: "iad-eye", title: visible ? "隐藏标注" : "显示标注", "aria-label": visible ? "隐藏标注" : "显示标注", "aria-pressed": visible, onClick: () => setVisible(v => !v), children: _jsxs("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: [_jsx("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" }), !visible && _jsx("path", { d: "m3 3 18 18" })] }) }), _jsx("button", { onClick: onClose, children: "\u5173\u95ED" })] }), _jsx("div", { className: "iad-viewer-viewport", ref: viewport, onPointerDown: event => { if (event.button !== 0)
                    return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, panX: view.x, panY: view.y }; }, onPointerMove: event => {
                    const start = drag.current;
                    if (start) {
                        const x = start.panX + event.clientX - start.x, y = start.panY + event.clientY - start.y;
                        setView(previous => ({ ...previous, x, y }));
                    }
                }, onPointerUp: () => { drag.current = null; }, onPointerCancel: () => { drag.current = null; }, children: _jsx("div", { className: "iad-viewer-world", "data-scale": scale, style: { width: size.width, height: size.height, "--iad-view-scale": scale,
                        transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})` }, children: _jsx(AnnotatedImage, { image: { ...image, ...size }, visible: visible }) }) })] });
}
