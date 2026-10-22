import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { mediaUrl, message, request } from "../api.js";
import { ImageViewer } from "./ImageViewer.js";
export function ExplorationSources({ dataset, kind, count, images, disabled, onCount, onImages, onSelecting }) {
    const label = kind === "normal" ? "良品" : "异常";
    const [page, setPage] = useState(1), [sources, setSources] = useState(null);
    const [error, setError] = useState(""), [selecting, setSelecting] = useState(false), [image, setImage] = useState(null);
    const query = new URLSearchParams({ dataset_id: dataset.dataset_id, kind });
    useEffect(() => {
        const controller = new AbortController();
        setError("");
        request(`/knowledge/sources?${query}&page=${page}&page_size=10`, undefined, undefined, controller.signal)
            .then(result => { if (!controller.signal.aborted)
            setSources(result); }).catch(e => { if (!controller.signal.aborted)
            setError(message(e)); });
        return () => controller.abort();
    }, [dataset.dataset_id, kind, page]);
    async function select() {
        setSelecting(true);
        onSelecting(true);
        setError("");
        try {
            const selected = [];
            for (let next = 1; selected.length < Number(count); next++) {
                const result = await request(`/knowledge/sources?${query}&page=${next}&page_size=100`);
                selected.push(...result.items.slice(0, Number(count) - selected.length).map(item => item.sample_id));
                if (next * 100 >= result.total)
                    break;
            }
            if (selected.length !== Number(count))
                throw new Error(`可用${label}不足${count}张，请调整数量`);
            onImages(selected);
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setSelecting(false);
            onSelecting(false);
        }
    }
    return _jsxs("section", { className: "iad-info-group", children: [_jsxs("h3", { children: [label, "\u6837\u4F8B"] }), _jsxs("fieldset", { disabled: disabled || selecting, children: [_jsxs("div", { className: "iad-row", children: [_jsxs("label", { className: "iad-field", children: ["\u56FE\u50CF\u6570\u91CF", _jsx("input", { type: "number", min: "1", "aria-label": `${label}图像数量`, value: count, onChange: e => onCount(e.target.value) })] }), _jsx("button", { disabled: !Number.isInteger(Number(count)) || Number(count) < 1, onClick: () => void select(), children: selecting ? "选取中…" : `选取${label}图像` }), _jsxs("span", { children: ["\u5DF2\u9009 ", images.length, " / ", count || "—", " \u5F20", sources ? ` · 可用 ${sources.total}` : ""] }), _jsx("button", { disabled: !images.length, onClick: () => onImages([]), children: "\u6E05\u7A7A" })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsx("div", { className: "iad-reference-grid", children: sources?.items.map(item => _jsxs("div", { className: "iad-source-option", children: [_jsx("button", { "aria-label": `放大样例 ${item.relative_path}`, onClick: () => setImage({ src: mediaUrl({ task_id: dataset.task_id, sample_id: item.sample_id }, "image"), title: item.relative_path }), children: _jsx("img", { src: mediaUrl({ task_id: dataset.task_id, sample_id: item.sample_id }, "thumbnail"), alt: item.relative_path, loading: "lazy" }) }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", "aria-label": `选择${label} ${item.relative_path}`, checked: images.includes(item.sample_id), onChange: e => onImages(e.target.checked ? [...images, item.sample_id] : images.filter(id => id !== item.sample_id)) }), item.relative_path] })] }, item.sample_id)) }), _jsxs("div", { className: "iad-row", children: [_jsx("button", { disabled: page <= 1, onClick: () => setPage(v => v - 1), children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { children: ["\u7B2C ", page, " \u9875"] }), _jsx("button", { disabled: !sources || page * 10 >= sources.total, onClick: () => setPage(v => v + 1), children: "\u4E0B\u4E00\u9875" })] })] }), image && _jsx(ImageViewer, { image: image, onClose: () => setImage(null) })] });
}
