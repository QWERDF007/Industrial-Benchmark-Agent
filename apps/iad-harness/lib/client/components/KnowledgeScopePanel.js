import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
export function KnowledgeScopePanel({ scopeRunId, datasetId, kind, revision, onScope }) {
    const { workspace } = useWorkspace(), view = workspace.view("industrial-knowledge");
    const [scope, setScope] = useState(null), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    const update = useCallback((value) => { if (value.dataset_id !== datasetId || value.kind !== kind)
        throw new Error("范围不属于当前数据集和知识类型"); onScope(value); setScope(value); setError(""); }, [onScope, datasetId, kind]);
    useEffect(() => {
        const controller = new AbortController();
        setScope(current => current?.scope_run_id === scopeRunId ? current : null);
        request(`/knowledge/scopes/${encodeURIComponent(scopeRunId)}`, undefined, undefined, controller.signal)
            .then(value => { if (!controller.signal.aborted)
            update(value); })
            .catch(error => { if (!controller.signal.aborted)
            setError(message(error)); });
        return () => controller.abort();
    }, [scopeRunId, revision, update]);
    async function change(action) {
        setBusy(true);
        setError("");
        try {
            update(await request(`/knowledge/scopes/${encodeURIComponent(scopeRunId)}/${action}`, {}));
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("section", { className: "iad-job-section iad-knowledge-scope", "aria-label": "\u8FDE\u7EED\u6765\u6E90\u8303\u56F4", children: [_jsxs("div", { className: "iad-row", children: [_jsx("h2", { children: "\u8FDE\u7EED\u8303\u56F4" }), scope && _jsx("span", { "data-field": "knowledge-scope-state", children: scope.status === "STOPPED" ? "已停止" : scope.active_run_ids.length ? "执行中" : !scope.unprocessed ? "观察完成" : "待继续" })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), !scope && !error && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u8303\u56F4\u2026" }), scope && _jsxs(_Fragment, { children: [_jsxs("div", { className: "iad-scope-progress", children: [_jsxs("p", { role: "status", "aria-atomic": "true", "aria-label": "\u8FDE\u7EED\u8303\u56F4\u8FDB\u5EA6", children: ["\u5DF2\u89C2\u5BDF ", scope.observed, " / ", scope.total, " \u00B7 \u5269\u4F59 ", scope.remaining, !!scope.pending_review && ` · 待人审 ${scope.pending_review}`, !!scope.stale && ` · 来源失效 ${scope.stale}`, !!scope.recheck && ` · 判据待重核验 ${scope.recheck}`, !!scope.excluded && ` · 已移出支持 ${scope.excluded}`] }), _jsx("progress", { "aria-label": "\u6765\u6E90\u89C2\u5BDF\u8FDB\u5EA6", max: scope.total || 1, value: scope.observed })] }), _jsxs("div", { className: "iad-row", children: [_jsx("button", { disabled: busy, onClick: () => void change(scope.status === "STOPPED" ? "resume" : "stop"), children: scope.status === "STOPPED" ? "继续范围" : "停止范围" }), _jsx("button", { disabled: busy, onClick: () => workspace.updateView("industrial-knowledge", { tab: "setup", scopeRunId, scopeSessionId: view.scopeRunId === scopeRunId ? view.scopeSessionId : "", miningPreset: scope.current_version_id || "", normalVersion: scope.normal_version_id || "", miningImages: [], miningPage: 1 }), children: "\u9009\u62E9\u6B64\u8303\u56F4" }), scope.current_version_id && _jsx("button", { onClick: () => workspace.updateView("industrial-knowledge", { version: scope.current_version_id || "", tab: "results" }), children: "\u67E5\u770B\u8303\u56F4\u77E5\u8BC6" }), view.scopeSessionId && _jsx("button", { onClick: () => void workspace.openSession(view.scopeSessionId), children: "\u67E5\u770B\u4F1A\u8BDD" }), scope.status === "STOPPED" && view.scopeRunId && _jsx("button", { onClick: () => workspace.updateView("industrial-knowledge", { scopeRunId: "", scopeSessionId: "", miningContinuous: false, miningImages: [] }), children: "\u8FD4\u56DE\u5355\u7EC4\u914D\u7F6E" })] })] })] });
}
