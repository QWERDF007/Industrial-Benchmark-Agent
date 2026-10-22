import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { message, request } from "../api.js";
import { ImageViewer } from "./ImageViewer.js";
export function KnowledgeJobEvidence({ job }) {
    const [open, setOpen] = useState(false), [page, setPage] = useState(1);
    const [result, setResult] = useState(null), [error, setError] = useState("");
    const [image, setImage] = useState(null);
    useEffect(() => {
        if (!open)
            return;
        const controller = new AbortController();
        setError("");
        request(`/knowledge/observations/${encodeURIComponent(job.run_id)}?page=${page}`, undefined, undefined, controller.signal)
            .then(value => { if (!controller.signal.aborted)
            setResult(value); })
            .catch(error => { if (!controller.signal.aborted)
            setError(message(error)); });
        return () => controller.abort();
    }, [open, page, job.run_id, job.status, job.observation_progress?.observed_visuals]);
    return _jsxs("details", { onToggle: event => setOpen(event.currentTarget.open), children: [_jsx("summary", { children: "\u89C2\u5BDF\u8BC1\u636E" }), job.mining_prompt && _jsxs("details", { children: [_jsx("summary", { children: "\u672C\u6B21\u51BB\u7ED3\u6316\u6398\u63D0\u793A\u8BCD" }), _jsx("pre", { className: "iad-observation", children: job.mining_prompt.instruction })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), open && !result && !error && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u51BB\u7ED3\u89C2\u5BDF\u2026" }), open && result && _jsxs(_Fragment, { children: [_jsxs("p", { className: "iad-muted", children: ["\u89C4\u5212 ", result.progress.planned_visuals, " \u4E2A\u89C6\u56FE \u00B7 \u5DF2\u63A5\u53D7\u89C2\u5BDF ", result.progress.observed_visuals, " \u4E2A \u00B7 \u5DF2\u53D1\u5E03 ", result.progress.published_sources, " \u5F20\u6765\u6E90"] }), _jsx("div", { className: "iad-reference-grid", children: result.items.map(item => {
                            const src = `/api/iad/knowledge/observations/${encodeURIComponent(job.run_id)}/evidence/${encodeURIComponent(item.image.evidence_id)}`;
                            const title = `${item.image.role} · ${item.observed ? "已接受观察" : "尚未完成观察"}`;
                            return _jsxs("button", { title: "\u653E\u5927\u51BB\u7ED3\u89C2\u5BDF\u8BC1\u636E", onClick: () => setImage({ src, title, width: item.image.sent_size[0], height: item.image.sent_size[1] }), children: [_jsx("img", { src: src, alt: title, loading: "lazy" }), _jsx("small", { children: title })] }, item.image.evidence_id);
                        }) }), !result.total && _jsx("p", { children: "\u5C1A\u672A\u89C4\u5212\u56FE\u50CF\u8BC1\u636E\u3002" }), result.total > result.page_size && _jsxs("div", { className: "iad-row", children: [_jsx("button", { disabled: page <= 1, onClick: () => setPage(value => value - 1), children: "\u4E0A\u4E00\u9875\u8BC1\u636E" }), _jsxs("span", { children: ["\u7B2C ", page, " \u9875"] }), _jsx("button", { disabled: page * result.page_size >= result.total, onClick: () => setPage(value => value + 1), children: "\u4E0B\u4E00\u9875\u8BC1\u636E" })] })] }), image && _jsx(ImageViewer, { image: image, onClose: () => setImage(null) })] });
}
