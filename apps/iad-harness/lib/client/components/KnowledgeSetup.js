import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { KnowledgeDirections } from "./KnowledgeDirections.js";
import { useWorkbenchModel, WorkbenchModelStatus } from '../models.js';
import { SourcePicker } from './SourcePicker.js';
export function KnowledgeSetup({ dataset, kind, versions, normalVersions, busy, onStart, onContinuous, directionProposal, onDirectionProposalUsed }) {
    const { workspace } = useWorkspace(), pageId = "industrial-knowledge";
    const model = useWorkbenchModel();
    const view = workspace.view(pageId);
    const [sources, setSources] = useState(null), [error, setError] = useState("");
    const [selecting, setSelecting] = useState(false);
    const [directionsPending, setDirectionsPending] = useState(true);
    const [directionState, setDirectionState] = useState({ reason: "正在读取挖掘方向。", count: 0, revision: "" });
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
    const reason = busy ? "正在启动作业。" : directionState.reason || (directionsPending ? "请先保存有效的挖掘方向。" : "") || (selecting ? "请先完成来源选择。" : error || (!sources ? "正在读取合格来源。" : unavailable ? "请按目标数量选择图像。" : !model.ready ? "请先配置工作台模型。" : ""));
    return _jsxs("section", { className: "iad-knowledge-setup", "aria-label": "\u77E5\u8BC6\u6316\u6398\u914D\u7F6E", children: [_jsxs("div", { className: "iad-mining-main iad-panel", children: [_jsxs("section", { className: "iad-setup-section", children: [_jsx("h3", { children: "1. \u65B9\u5F0F\u4E0E\u4F9D\u636E" }), _jsxs("div", { className: "iad-config-bar", children: [_jsxs("label", { className: "iad-field", children: ["\u6267\u884C\u65B9\u5F0F", _jsxs("select", { "aria-label": "\u77E5\u8BC6\u6267\u884C\u65B9\u5F0F", value: view.miningContinuous ? "continuous" : "group", disabled: busy, onChange: event => workspace.updateView(pageId, { miningContinuous: event.target.value === "continuous" }), children: [_jsx("option", { value: "group", children: "\u5F53\u524D\u56FE\u7EC4" }), _jsx("option", { value: "continuous", children: "\u8FDE\u7EED\u8303\u56F4 \u00B7 Agent\u6267\u884C" })] })] }), _jsxs("label", { className: "iad-field", children: ["\u77E5\u8BC6\u9884\u8BBE", _jsxs("select", { "aria-label": "\u77E5\u8BC6\u9884\u8BBE", value: view.miningPreset, disabled: busy || !!view.scopeRunId, onChange: e => workspace.updateView(pageId, { miningPreset: e.target.value, miningPage: 1, miningImages: [] }), children: [_jsx("option", { value: "", children: "\u4E0D\u4F7F\u7528\u9884\u8BBE" }), view.miningPreset && !versions.some(item => item.version_id === view.miningPreset) && _jsxs("option", { value: view.miningPreset, children: ["\u5DF2\u9009\u7248\u672C \u00B7 ", view.miningPreset] }), versions.map(version => _jsx("option", { value: version.version_id, children: version.version_id }, version.version_id))] })] }), kind === "defect" && _jsxs("label", { className: "iad-field", children: ["\u826F\u54C1\u6BD4\u8F83\u57FA\u51C6", _jsxs("select", { "aria-label": "\u4F9D\u636E\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.normalVersion, disabled: busy || !!view.scopeRunId, onChange: e => workspace.updateView(pageId, { normalVersion: e.target.value, miningImages: [], miningPage: 1 }), children: [_jsx("option", { value: "", children: "\u4E0D\u4F7F\u7528\u57FA\u51C6 \u00B7 \u4EC5\u6574\u7406\u5047\u8BBE" }), view.normalVersion && !normalVersions.some(item => item.version_id === view.normalVersion) && _jsxs("option", { value: view.normalVersion, children: ["\u5DF2\u9009\u7248\u672C \u00B7 ", view.normalVersion] }), normalVersions.map(version => _jsx("option", { value: version.version_id, children: version.version_id }, version.version_id))] })] })] })] }), _jsx(KnowledgeDirections, { datasetId: dataset.dataset_id, kind: kind, proposal: directionProposal, onPending: setDirectionsPending, onState: setDirectionState, onProposalUsed: onDirectionProposalUsed }, `${dataset.dataset_id}:${kind}`)] }), _jsxs("aside", { className: "iad-mining-rail", children: [_jsxs("section", { className: "iad-panel", children: [_jsx("h3", { children: "4. \u56FE\u50CF\u8303\u56F4" }), _jsxs("div", { className: "iad-config-bar", children: ["      ", _jsxs("label", { className: "iad-field iad-short-field", children: ["\u56FE\u50CF\u6570\u91CF", _jsx("input", { type: "number", min: "1", step: "1", "aria-label": "\u6316\u6398\u56FE\u50CF\u6570\u91CF", value: view.miningCount, disabled: busy || selecting, onChange: e => workspace.updateView(pageId, { miningCount: e.target.value }, true) })] }), _jsxs("label", { className: "iad-field", children: ["\u6765\u6E90\u8303\u56F4", _jsxs("select", { "aria-label": "\u6765\u6E90\u8303\u56F4", value: view.miningSourceMode, disabled: busy, onChange: e => workspace.updateView(pageId, { miningSourceMode: e.target.value, miningPage: 1, miningImages: [] }), children: [_jsx("option", { value: "uncovered", children: "\u4EC5\u672A\u89C2\u5BDF" }), _jsx("option", { value: "all", children: "\u5168\u90E8\u5408\u683C \u00B7 \u542B\u5386\u53F2\u6765\u6E90" }), _jsx("option", { value: "recheck", disabled: !view.miningPreset, children: "\u5224\u636E\u5F85\u91CD\u6838\u9A8C" })] })] })] }), sources?.coverage && _jsxs("details", { className: "iad-source-coverage", children: [_jsx("summary", { children: "\u6765\u6E90\u8986\u76D6" }), _jsxs("p", { className: "iad-muted", children: ["\u5DF2\u89C2\u5BDF ", sources.coverage.observed, " \u00B7 \u5269\u4F59 ", sources.coverage.remaining, " \u00B7 \u5F85\u6838\u5B9E ", sources.coverage.pending_review, " \u00B7 \u6765\u6E90\u5931\u6548 ", sources.coverage.stale, " \u00B7 \u5224\u636E\u5F85\u91CD\u6838\u9A8C ", sources.coverage.recheck] })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), !valid && _jsx("p", { role: "alert", children: "\u8BF7\u8F93\u5165\u6B63\u6574\u6570\u56FE\u50CF\u6570\u91CF\u3002" }), _jsx(SourcePicker, { dataset: dataset, label: "\u6765\u6E90", sources: sources, selected: view.miningImages, target: valid ? count : "—", disabled: busy, choosing: selecting, canChoose: valid, onChoose: () => void choose(), page: view.miningPage, onPage: miningPage => workspace.updateView(pageId, { miningPage }), onChange: miningImages => { setError(""); workspace.updateView(pageId, { miningImages }); }, search: view.miningSearch, onSearch: miningSearch => workspace.updateView(pageId, { miningSearch, miningPage: 1 }, true) })] }), _jsxs("section", { className: "iad-panel", children: [_jsx("h3", { children: "5. \u8FD0\u884C\u786E\u8BA4" }), _jsx(WorkbenchModelStatus, {}), _jsxs("p", { children: [view.miningContinuous ? `连续范围 · 每组 ${valid ? count : "—"} 张` : `当前图组 · ${view.miningImages.length} 张`, " \u00B7 ", view.miningPreset ? "使用所选知识预设" : "不使用知识预设"] }), _jsxs("p", { className: "iad-muted", title: directionState.revision, children: ["\u5DF2\u4FDD\u5B58\u65B9\u5411 ", directionState.count, " \u9879", directionState.revision && ` · ${directionState.revision.slice(0, 8)}`] }), view.miningContinuous && _jsx("p", { className: "iad-muted", children: "\u4EA4\u7ED9 Agent \u6309\u5F53\u524D\u51BB\u7ED3\u8303\u56F4\u8FDE\u7EED\u6267\u884C\u3002" }), reason && _jsx("p", { className: "iad-muted", children: reason }), _jsx("button", { "data-action": view.miningContinuous ? "knowledge-agent-run" : "knowledge-group-run", className: "iad-primary", disabled: !!reason, onClick: () => {
                                    if (view.miningContinuous) {
                                        onContinuous();
                                        return;
                                    }
                                    const [first, ...rest] = view.miningImages;
                                    if (!first || unavailable)
                                        return;
                                    onStart({ image_count: count, images: [first, ...rest], knowledge_preset: [view.miningPreset, ...(kind === "defect" ? [view.normalVersion] : [])].filter(Boolean) });
                                }, children: busy ? "启动中…" : view.miningContinuous ? "在Agent中连续挖掘" : `开始挖掘${kind === "normal" ? "良品" : "异常"}知识` })] })] })] });
}
