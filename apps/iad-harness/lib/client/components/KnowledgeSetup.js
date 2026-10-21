import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { mediaUrl, message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
export function KnowledgeSetup({ dataset, kind, versions, normalVersions, busy, onStart, onContinuous }) {
    const { workspace } = useWorkspace(), pageId = "industrial-knowledge";
    const view = workspace.view(pageId);
    const [sources, setSources] = useState(null), [error, setError] = useState("");
    const [selecting, setSelecting] = useState(false);
    const query = new URLSearchParams({ dataset_id: dataset.dataset_id, kind, page: String(view.miningPage), page_size: "10", search: view.miningSearch, include_observed: String(view.miningSourceMode === "all"),
        ...(view.miningSourceMode === "recheck" && view.miningPreset ? { recheck_from_version: view.miningPreset } : {}),
        ...(view.scopeRunId ? { scope_run_id: view.scopeRunId } : view.miningPreset ? { uncovered_from_version: view.miningPreset } : {}),
        ...(kind === "defect" && view.normalVersion ? { normal_version_id: view.normalVersion } : {}) }).toString();
    useEffect(() => {
        const controller = new AbortController();
        setSources(null);
        setError("");
        request(`/knowledge/sources?${query}`, undefined, undefined, controller.signal)
            .then(value => { if (!controller.signal.aborted)
            setSources(value); })
            .catch(error => { if (!controller.signal.aborted)
            setError(message(error)); });
        return () => controller.abort();
    }, [query]);
    const count = Number(view.miningCount), valid = Number.isInteger(count) && count > 0;
    async function choose() {
        if (!valid)
            return;
        setSelecting(true);
        setError("");
        try {
            const ids = [], pageSize = Math.min(count, 200);
            for (let page = 1; ids.length < count; page++) {
                const parameters = new URLSearchParams(query);
                parameters.set("page", String(page));
                parameters.set("page_size", String(pageSize));
                const result = await request(`/knowledge/sources?${parameters}`);
                if (result.total < count)
                    throw new Error(`当前筛选仅有 ${result.total} 张合格来源，请调整数量。`);
                ids.push(...result.items.map(item => item.sample_id));
                if (!result.items.length)
                    throw new Error("来源范围已变化，请重新选择。");
            }
            const current = workspace.getSnapshot(), latest = workspace.view(pageId);
            if (current.datasetId === dataset.dataset_id && current.knowledgeKind === kind && latest.miningCount === view.miningCount
                && latest.miningSearch === view.miningSearch && latest.normalVersion === view.normalVersion
                && latest.miningPreset === view.miningPreset && latest.scopeRunId === view.scopeRunId && latest.miningSourceMode === view.miningSourceMode)
                workspace.updateView(pageId, { miningImages: ids.slice(0, count) });
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setSelecting(false);
        }
    }
    const unavailable = !valid || (view.miningContinuous ? !!view.miningImages.length && view.miningImages.length !== count : view.miningImages.length !== count);
    return _jsxs("section", { className: "iad-job-section", "aria-label": "\u77E5\u8BC6\u6316\u6398\u914D\u7F6E", children: [_jsxs("div", { className: "iad-config-bar", children: [_jsxs("label", { className: "iad-field", children: ["\u6267\u884C\u65B9\u5F0F", _jsxs("select", { "aria-label": "\u77E5\u8BC6\u6267\u884C\u65B9\u5F0F", value: view.miningContinuous ? "continuous" : "group", disabled: busy, onChange: event => workspace.updateView(pageId, { miningContinuous: event.target.value === "continuous" }), children: [_jsx("option", { value: "group", children: "\u5F53\u524D\u56FE\u7EC4" }), _jsx("option", { value: "continuous", children: "\u8FDE\u7EED\u8303\u56F4 \u00B7 Agent\u6267\u884C" })] })] }), _jsxs("label", { className: "iad-field", children: ["\u77E5\u8BC6\u9884\u8BBE", _jsxs("select", { "aria-label": "\u77E5\u8BC6\u9884\u8BBE", value: view.miningPreset, disabled: busy || !!view.scopeRunId, onChange: e => workspace.updateView(pageId, { miningPreset: e.target.value, miningPage: 1, miningImages: [] }), children: [_jsx("option", { value: "", children: "\u4E0D\u4F7F\u7528\u9884\u8BBE" }), view.miningPreset && !versions.some(item => item.version_id === view.miningPreset) && _jsxs("option", { value: view.miningPreset, children: ["\u5DF2\u9009\u7248\u672C \u00B7 ", view.miningPreset] }), versions.map(version => _jsx("option", { value: version.version_id, children: version.version_id }, version.version_id))] })] }), kind === "defect" && _jsxs("label", { className: "iad-field", children: ["\u826F\u54C1\u6BD4\u8F83\u57FA\u51C6", _jsxs("select", { "aria-label": "\u4F9D\u636E\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.normalVersion, disabled: busy || !!view.scopeRunId, onChange: e => workspace.updateView(pageId, { normalVersion: e.target.value, miningImages: [], miningPage: 1 }), children: [_jsx("option", { value: "", children: "\u4E0D\u4F7F\u7528\u57FA\u51C6 \u00B7 \u4EC5\u6574\u7406\u5047\u8BBE" }), view.normalVersion && !normalVersions.some(item => item.version_id === view.normalVersion) && _jsxs("option", { value: view.normalVersion, children: ["\u5DF2\u9009\u7248\u672C \u00B7 ", view.normalVersion] }), normalVersions.map(version => _jsx("option", { value: version.version_id, children: version.version_id }, version.version_id))] })] }), _jsxs("label", { className: "iad-field", children: ["\u56FE\u50CF\u6570\u91CF", _jsx("input", { type: "number", min: "1", step: "1", "aria-label": "\u6316\u6398\u56FE\u50CF\u6570\u91CF", value: view.miningCount, disabled: busy, onChange: e => workspace.updateView(pageId, { miningCount: e.target.value }, true) })] }), _jsx("button", { disabled: busy || selecting || !valid, onClick: () => void choose(), children: selecting ? "选择中…" : "按数量选择" }), _jsx("button", { "data-action": view.miningContinuous ? "knowledge-agent-run" : "knowledge-group-run", className: "iad-primary", disabled: busy || selecting || !!error || unavailable, onClick: () => {
                            if (view.miningContinuous) {
                                onContinuous();
                                return;
                            }
                            const [first, ...rest] = view.miningImages;
                            if (!first || unavailable)
                                return;
                            onStart({ image_count: count, images: [first, ...rest], knowledge_preset: [view.miningPreset, ...(kind === "defect" ? [view.normalVersion] : [])].filter(Boolean) });
                        }, children: busy ? "启动中…" : view.miningContinuous ? "在Agent中连续挖掘" : `开始挖掘${kind === "normal" ? "良品" : "异常"}知识` })] }), _jsxs("div", { className: "iad-row", children: [_jsxs("label", { className: "iad-field", children: ["\u6765\u6E90\u8303\u56F4", _jsxs("select", { "aria-label": "\u6765\u6E90\u8303\u56F4", value: view.miningSourceMode, disabled: busy, onChange: e => workspace.updateView(pageId, { miningSourceMode: e.target.value, miningPage: 1, miningImages: [] }), children: [_jsx("option", { value: "uncovered", children: "\u4EC5\u672A\u89C2\u5BDF" }), _jsx("option", { value: "all", children: "\u5168\u90E8\u5408\u683C \u00B7 \u542B\u5386\u53F2\u6765\u6E90" }), _jsx("option", { value: "recheck", disabled: !view.miningPreset, children: "\u5224\u636E\u5F85\u91CD\u6838\u9A8C" })] })] }), _jsxs("label", { className: "iad-field", children: ["\u7B5B\u9009\u6765\u6E90", _jsx("input", { type: "search", "aria-label": "\u7B5B\u9009\u6316\u6398\u6765\u6E90", disabled: !!view.scopeRunId, value: view.miningSearch, onChange: e => workspace.updateView(pageId, { miningSearch: e.target.value, miningPage: 1 }, true) })] }), _jsxs("span", { role: "status", children: ["\u5DF2\u9009 ", view.miningImages.length, " / ", valid ? count : "—", " \u5F20", sources ? ` · 可选 ${sources.total} 张` : ""] }), _jsx("button", { disabled: busy || !view.miningImages.length, onClick: () => workspace.updateView(pageId, { miningImages: [] }), children: "\u6E05\u7A7A\u9009\u62E9" })] }), sources?.coverage && _jsxs("p", { className: "iad-muted", children: ["\u5DF2\u89C2\u5BDF ", sources.coverage.observed, " \u00B7 \u5269\u4F59 ", sources.coverage.remaining, " \u00B7 \u5F85\u6838\u5B9E ", sources.coverage.pending_review, " \u00B7 \u6765\u6E90\u5931\u6548 ", sources.coverage.stale, " \u00B7 \u5224\u636E\u5F85\u91CD\u6838\u9A8C ", sources.coverage.recheck] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), !valid && _jsx("p", { role: "alert", children: "\u8BF7\u8F93\u5165\u6B63\u6574\u6570\u56FE\u50CF\u6570\u91CF\u3002" }), _jsxs("fieldset", { disabled: busy || selecting, className: "iad-source-picker", children: [_jsx("legend", { children: "\u672C\u6B21\u56FE\u50CF" }), _jsxs("div", { className: "iad-reference-grid", children: [sources?.items.map(item => _jsxs("label", { className: "iad-source-option", children: [_jsx("img", { loading: "lazy", src: mediaUrl({ task_id: dataset.task_id, sample_id: item.sample_id }, "thumbnail"), alt: "" }), _jsxs("span", { children: [_jsx("input", { type: "checkbox", "aria-label": `选择来源 ${item.relative_path}`, checked: view.miningImages.includes(item.sample_id), onChange: e => { setError(""); workspace.updateView(pageId, { miningImages: e.target.checked ? [...view.miningImages, item.sample_id] : view.miningImages.filter(id => id !== item.sample_id) }); } }), item.relative_path] })] }, item.sample_id)), !sources && !error && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u6765\u6E90\u2026" }), sources && !sources.total && _jsx("p", { children: "\u6CA1\u6709\u5339\u914D\u7684\u5408\u683C\u6765\u6E90\u3002" })] })] }), _jsxs("div", { className: "iad-row", children: [_jsx("button", { disabled: view.miningPage <= 1, onClick: () => workspace.updateView(pageId, { miningPage: view.miningPage - 1 }), children: "\u4E0A\u4E00\u9875\u6765\u6E90" }), _jsxs("span", { children: ["\u7B2C ", view.miningPage, " \u9875"] }), _jsx("button", { disabled: !sources || view.miningPage * 10 >= sources.total, onClick: () => workspace.updateView(pageId, { miningPage: view.miningPage + 1 }), children: "\u4E0B\u4E00\u9875\u6765\u6E90" })] })] });
}
