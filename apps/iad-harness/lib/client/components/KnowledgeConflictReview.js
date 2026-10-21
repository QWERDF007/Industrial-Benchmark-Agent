import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { ImageViewer } from "./ImageViewer.js";
const states = { pending_review: "待人工确认", pending_recheck: "待重核验", resolved: "已生效" };
const actions = { retain: "保留判据", revise: "修订判据", retire: "退役判据", need_evidence: "要求补证" };
export function KnowledgeConflictReview({ datasetId }) {
    const { workspace } = useWorkspace(), view = workspace.view("industrial-review");
    const [state, setState] = useState("");
    const [items, setItems] = useState([]);
    const [context, setContext] = useState(null);
    const [error, setError] = useState(""), [revision, setRevision] = useState(0), [busy, setBusy] = useState(false);
    const [reviewer, setReviewer] = useState(""), [reason, setReason] = useState(""), [instruction, setInstruction] = useState("");
    const [action, setAction] = useState("retain");
    const [pending, setPending] = useState(null);
    const [lightbox, setLightbox] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        request(`/review/knowledge/queue?${new URLSearchParams({ dataset_id: datasetId })}`, undefined, undefined, controller.signal)
            .then(result => { if (!controller.signal.aborted)
            setItems(result.items); })
            .catch(error => { if (!controller.signal.aborted)
            setError(message(error)); });
        return () => controller.abort();
    }, [datasetId, revision]);
    const filtered = items.filter(item => !state || item.state === state);
    const selected = filtered.find(item => item.conflict_id === view.conflictId && item.version_id === view.version) || filtered[0];
    useEffect(() => {
        const controller = new AbortController();
        setContext(null);
        setError("");
        if (selected)
            request(`/review/knowledge?${new URLSearchParams({ version_id: selected.version_id, conflict_id: selected.conflict_id })}`, undefined, undefined, controller.signal)
                .then(result => { if (!controller.signal.aborted) {
                setContext(result);
                setPending(null);
            } })
                .catch(error => { if (!controller.signal.aborted)
                setError(message(error)); });
        return () => controller.abort();
    }, [selected?.conflict_id, selected?.version_id, revision]);
    async function submit() {
        if (!context)
            return;
        const submission = pending || { ...context.reference, submission_id: crypto.randomUUID(), context_signature: context.context_signature, reviewer, action, instruction, reason };
        setPending(submission);
        setBusy(true);
        setError("");
        try {
            await request("/review/knowledge", submission);
            setReason("");
            setInstruction("");
            setRevision(value => value + 1);
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("section", { className: "iad-job-section", "aria-label": "\u77E5\u8BC6\u51B2\u7A81\u590D\u6838", children: [error && _jsxs("p", { role: "alert", className: "iad-error", children: [error, " ", _jsx("button", { onClick: () => setRevision(value => value + 1), children: "\u91CD\u65B0\u8BFB\u53D6" })] }), _jsxs("label", { className: "iad-field", children: ["\u72B6\u6001", _jsxs("select", { "aria-label": "\u77E5\u8BC6\u51B2\u7A81\u72B6\u6001", value: state, onChange: event => setState(event.target.value), children: [_jsx("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }), Object.entries(states).map(([value, label]) => _jsx("option", { value: value, children: label }, value))] })] }), _jsxs("div", { className: "iad-knowledge-split", children: [_jsxs("div", { className: "iad-check-list", "aria-label": "\u77E5\u8BC6\u51B2\u7A81\u961F\u5217", children: [filtered.map(item => _jsxs("button", { "aria-pressed": selected?.conflict_id === item.conflict_id, onClick: () => workspace.updateView("industrial-review", { conflictId: item.conflict_id, version: item.version_id }), children: [_jsx("strong", { children: item.description }), _jsxs("span", { children: [item.kind === "normal" ? "良品" : "异常", " \u00B7 ", states[item.state]] })] }, item.conflict_id)), !filtered.length && _jsx("p", { children: "\u6682\u65E0\u5339\u914D\u7684\u77E5\u8BC6\u51B2\u7A81\u3002" })] }), context && _jsxs("article", { className: "iad-info-group", children: [_jsx("h2", { children: "\u77E5\u8BC6\u5904\u7F6E" }), _jsx("p", { role: "status", "data-field": "knowledge-review-state", children: states[context.state] }), _jsx("p", { children: context.conflict.description }), _jsxs("p", { children: ["\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A", context.conflict.normal_explanation || "未提供"] }), context.checks.map(check => _jsxs("div", { children: [_jsx("h3", { children: check.title }), _jsx("p", { children: check.criterion }), _jsxs("p", { className: "iad-muted", children: [check.subject, " \u00B7 ", check.location] })] }, check.check_id)), _jsx("div", { className: "iad-reference-grid", children: context.evidence.map(item => {
                                    const image = item.image, src = `/api/iad/knowledge/evidence/${encodeURIComponent(context.reference.version_id)}/${encodeURIComponent(image.evidence_id)}`;
                                    return _jsxs("button", { onClick: () => setLightbox({ src, title: `${image.role} · ${image.crop_bbox.join(", ")}`, width: image.sent_size[0], height: image.sent_size[1] }), title: "\u653E\u5927\u51BB\u7ED3\u8BC1\u636E", children: [_jsx("img", { src: src, alt: `${image.role} · ${image.representation}` }), _jsxs("small", { children: [context.conflict.new_evidence_ids.includes(image.evidence_id) ? "冲突图像" : "历史比较", " \u00B7 ", image.role] })] }, image.evidence_id);
                                }) }), _jsx("p", { className: "iad-muted", children: context.conflict.limitations.join("；") }), _jsx("button", { onClick: () => workspace.openLocation({ pageId: "industrial-review", datasetId, selected: context.conflict.sample_id, tab: "results" }), children: "\u590D\u6838\u6B64\u56FE\u50CF" }), !context.is_latest && _jsx("p", { role: "status", children: "\u6B63\u5728\u67E5\u770B\u5386\u53F2\u51B2\u7A81\uFF0C\u63D0\u4EA4\u524D\u8BF7\u8BFB\u53D6\u5F53\u524D\u7248\u672C\u3002" }), !context.source_current && _jsx("p", { role: "status", children: "\u6765\u6E90\u5185\u5BB9\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6838\u9A8C\u3002" }), _jsxs("form", { "aria-label": "\u77E5\u8BC6\u5904\u7F6E", onSubmit: event => { event.preventDefault(); void submit(); }, children: [_jsxs("fieldset", { disabled: busy || !!pending || !context.is_latest || !context.source_current, children: [_jsxs("label", { className: "iad-field", children: ["\u590D\u6838\u4EBA", _jsx("input", { "aria-label": "\u77E5\u8BC6\u590D\u6838\u4EBA", required: true, value: reviewer, onChange: event => setReviewer(event.target.value) })] }), _jsxs("label", { className: "iad-field", children: ["\u77E5\u8BC6\u5904\u7F6E", _jsx("select", { "aria-label": "\u77E5\u8BC6\u5904\u7F6E\u65B9\u5F0F", value: action, onChange: event => setAction(event.target.value), children: Object.entries(actions).map(([value, label]) => _jsx("option", { value: value, children: label }, value)) })] }), action === "revise" && _jsxs("label", { className: "iad-field", children: ["\u5F85\u6838\u9A8C\u4FEE\u8BA2", _jsx("textarea", { "aria-label": "\u77E5\u8BC6\u4FEE\u8BA2\u5EFA\u8BAE", required: true, value: instruction, onChange: event => setInstruction(event.target.value) })] }), _jsxs("label", { className: "iad-field", children: ["\u539F\u56E0", _jsx("textarea", { "aria-label": "\u77E5\u8BC6\u590D\u6838\u539F\u56E0", required: true, value: reason, onChange: event => setReason(event.target.value) })] })] }), _jsx("div", { className: "iad-form-actions", children: _jsx("button", { type: "submit", className: "iad-primary", disabled: busy || !context.is_latest || !context.source_current, children: busy ? "提交中…" : pending ? "重试相同提交" : "提交知识处置" }) })] }), context.state === "pending_recheck" && _jsx("button", { onClick: () => workspace.openLocation({ pageId: "industrial-knowledge", datasetId, knowledgeKind: items.find(item => item.conflict_id === context.reference.conflict_id)?.kind || "normal", miningPreset: context.reference.version_id, scopeRunId: context.scope_run_id || "", miningSourceMode: "all", miningContinuous: false, version: "", tab: "results" }), children: "\u9009\u62E9\u56FE\u50CF\u91CD\u6838\u9A8C" }), !!context.events.length && _jsxs("details", { children: [_jsxs("summary", { children: ["\u5904\u7F6E\u8BB0\u5F55 \u00B7 ", context.events.length, " \u6B21"] }), context.events.map(event => _jsxs("div", { children: [_jsxs("p", { children: [actions[event.action], " \u00B7 ", event.reviewer] }), _jsx("p", { children: event.instruction || event.reason }), _jsx("time", { dateTime: event.created_at, children: new Date(event.created_at).toLocaleString() })] }, event.submission_id))] })] })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
}
