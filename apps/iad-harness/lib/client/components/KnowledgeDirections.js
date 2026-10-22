import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { message, request } from "../api.js";
import { useUnsavedChanges } from "../useUnsavedChanges.js";
import { useWorkspace } from "../workspace.js";
export function KnowledgeDirections({ datasetId, kind, proposal, onPending, onProposalUsed }) {
    const { workspace } = useWorkspace();
    const explorationVersion = workspace.view("industrial-knowledge").explorationVersion;
    const [catalog, setCatalog] = useState(null), [catalogError, setCatalogError] = useState("");
    const [saved, setSaved] = useState(null), [draft, setDraft] = useState(null);
    const [error, setError] = useState(""), [saving, setSaving] = useState(false), [revision, setRevision] = useState(0);
    const [title, setTitle] = useState(""), [instruction, setInstruction] = useState(""), [open, setOpen] = useState(false);
    const applied = useRef(""), alive = useRef(true);
    const query = new URLSearchParams({ dataset_id: datasetId, kind }).toString();
    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({ dataset_id: datasetId });
        if (explorationVersion)
            params.set("version_id", explorationVersion);
        setCatalog(null);
        setCatalogError("");
        request(`/exploration?${params}`, undefined, undefined, controller.signal)
            .then(value => { if (!controller.signal.aborted)
            setCatalog(value); }).catch(e => { if (!controller.signal.aborted)
            setCatalogError(message(e)); });
        return () => controller.abort();
    }, [datasetId, explorationVersion, revision]);
    useEffect(() => {
        alive.current = true;
        return () => { alive.current = false; };
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        setSaved(null);
        setDraft(null);
        setError("");
        request(`/knowledge/prompt?${query}`, undefined, undefined, controller.signal)
            .then(value => { if (!controller.signal.aborted) {
            setSaved(value);
            setDraft(value.configuration);
        } })
            .catch(error => { if (!controller.signal.aborted)
            setError(message(error)); });
        return () => controller.abort();
    }, [query, revision]);
    useEffect(() => {
        if (!proposal || !draft || saving || applied.current === proposal.id || proposal.datasetId !== datasetId || proposal.kind !== kind)
            return;
        applied.current = proposal.id;
        setOpen(true);
        onProposalUsed();
        if (draft.directions.some(item => item.title.trim().toLocaleLowerCase() === proposal.title.trim().toLocaleLowerCase())) {
            setError("已有同名方向，请编辑现有说明。");
            return;
        }
        setDraft({ ...draft, directions: [...draft.directions, { direction_id: crypto.randomUUID(), title: proposal.title,
                    instruction: proposal.instruction, enabled: true, origin: "dataset" }] });
    }, [proposal, draft, saving, datasetId, kind, onProposalUsed]);
    const dirty = !!saved && JSON.stringify(saved.configuration) !== JSON.stringify(draft);
    useUnsavedChanges(dirty);
    const invalid = !!draft && (!draft.objective.trim() || draft.directions.some(item => !item.title.trim() || !item.instruction.trim())
        || new Set(draft.directions.map(item => item.title.trim().toLocaleLowerCase())).size !== draft.directions.length);
    useEffect(() => onPending(!saved || dirty || saving || invalid || !!error), [saved, dirty, saving, invalid, error, onPending]);
    function change(index, patch) {
        if (draft)
            setDraft({ ...draft, directions: draft.directions.map((item, i) => i === index ? { ...item, ...patch } : item) });
        setError("");
    }
    async function save(reset = false) {
        if (!saved || !draft)
            return;
        setSaving(true);
        setError("");
        try {
            const result = await request("/knowledge/prompt", { dataset_id: datasetId, kind, expected_revision: saved.revision,
                configuration: reset ? null : draft });
            if (alive.current) {
                setSaved(result);
                setDraft(result.configuration);
            }
        }
        catch (error) {
            if (alive.current)
                setError(message(error));
        }
        finally {
            if (alive.current)
                setSaving(false);
        }
    }
    return _jsxs("details", { className: "iad-mining-directions", open: open, onToggle: event => setOpen(event.currentTarget.open), children: [_jsxs("summary", { "data-action": "mining-directions", children: ["\u6316\u6398\u65B9\u5411", draft ? ` · 已选 ${draft.directions.filter(item => item.enabled).length} 项` : "", dirty ? " · 未保存" : ""] }), !saved && !error && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u6316\u6398\u65B9\u5411\u2026" }), error && _jsxs("p", { role: "alert", className: "iad-error", children: [error, " ", _jsx("button", { onClick: () => setRevision(value => value + 1), children: "\u91CD\u65B0\u8BFB\u53D6" })] }), draft && _jsxs("fieldset", { disabled: saving, className: "iad-directions-form", children: [_jsxs("label", { className: "iad-field", children: ["\u6316\u6398\u76EE\u6807", _jsx("textarea", { "aria-label": "\u6316\u6398\u76EE\u6807", rows: 3, value: draft.objective, onChange: event => { setDraft({ ...draft, objective: event.target.value }); setError(""); } })] }), [['preset', '通用方向'], ['dataset', '数据集方向'], ['explored', '探索方向']].map(([origin, label]) => _jsxs("fieldset", { className: "iad-direction-group", children: [_jsx("legend", { children: label }), origin === "explored" && _jsxs(_Fragment, { children: [_jsxs("label", { className: "iad-field", children: ["\u63A2\u7D22\u7ED3\u679C\u7248\u672C", _jsxs("select", { "aria-label": "\u9009\u7528\u63A2\u7D22\u7248\u672C", value: catalog?.exploration?.version_id || "", onChange: e => workspace.updateView("industrial-knowledge", { explorationVersion: e.target.value }), children: [_jsx("option", { value: "", disabled: true, children: "\u5C1A\u65E0\u63A2\u7D22\u7ED3\u679C" }), catalog?.versions.map(v => _jsxs("option", { value: v.version_id, children: [v.created_at.slice(0, 19).replace("T", " "), " \u00B7 ", v.direction_count, " \u9879"] }, v.version_id))] })] }), catalogError && _jsx("p", { role: "alert", children: catalogError })] }), _jsxs("div", { className: "iad-direction-grid", children: [draft.directions.map((item, index) => item.origin !== origin ? null : _jsxs("div", { className: "iad-direction", children: [_jsxs("label", { className: "iad-direction-toggle", children: [_jsx("input", { type: "checkbox", "aria-label": `启用方向 ${item.title}`, checked: item.enabled, onChange: event => change(index, { enabled: event.target.checked }) }), item.title] }), origin === "explored" && _jsx("button", { onClick: () => {
                                                    request(`/exploration?${new URLSearchParams({ dataset_id: datasetId, direction_id: item.direction_id })}`)
                                                        .then(value => { if (value.exploration && workspace.getSnapshot().datasetId === datasetId && workspace.getSnapshot().knowledgeKind === kind)
                                                        workspace.openLocation({ pageId: "industrial-exploration", datasetId, version: value.exploration.version_id }); })
                                                        .catch(e => setError(message(e)));
                                                }, children: "\u67E5\u770B\u6765\u6E90" }), _jsxs("details", { children: [_jsx("summary", { "aria-label": `编辑方向 ${item.title}`, children: "\u7F16\u8F91" }), _jsxs("label", { className: "iad-field", children: ["\u540D\u79F0", _jsx("input", { "aria-label": `方向名称 ${item.direction_id}`, value: item.title, onChange: event => change(index, { title: event.target.value }) })] }), _jsxs("label", { className: "iad-field", children: ["\u89C2\u5BDF\u8BF4\u660E", _jsx("textarea", { "aria-label": `方向说明 ${item.direction_id}`, rows: 4, value: item.instruction, onChange: event => change(index, { instruction: event.target.value }) })] }), _jsx("button", { onClick: () => { setDraft({ ...draft, directions: draft.directions.filter((_, i) => i !== index) }); setError(""); }, children: "\u5220\u9664\u65B9\u5411" })] })] }, item.direction_id)), origin === "explored" && catalog?.exploration?.directions.filter(item => (item.applies_to === "both" || item.applies_to === kind) && !draft.directions.some(d => d.direction_id === item.direction_id)).map(item => _jsxs("label", { className: "iad-direction iad-direction-toggle", children: [_jsx("input", { type: "checkbox", "aria-label": `启用探索方向 ${item.title}`, checked: false, onChange: () => setDraft({ ...draft, directions: [...draft.directions, { direction_id: item.direction_id, title: item.title, instruction: item.instruction, origin: "explored", enabled: true }] }) }), item.title, _jsx("span", { className: "iad-muted", children: item.instruction })] }, item.direction_id))] }), origin === "dataset" && !draft.directions.some(item => item.origin === origin) && _jsx("p", { className: "iad-muted", children: "\u5C1A\u65E0\u6570\u636E\u96C6\u4E13\u5C5E\u65B9\u5411\u3002" })] }, origin)), _jsxs("details", { className: "iad-direction-add", children: [_jsx("summary", { children: "\u6DFB\u52A0\u81EA\u5B9A\u4E49\u65B9\u5411" }), _jsxs("label", { className: "iad-field", children: ["\u540D\u79F0", _jsx("input", { "aria-label": "\u65B0\u65B9\u5411\u540D\u79F0", value: title, onChange: event => setTitle(event.target.value) })] }), _jsxs("label", { className: "iad-field", children: ["\u89C2\u5BDF\u8BF4\u660E", _jsx("textarea", { "aria-label": "\u65B0\u65B9\u5411\u8BF4\u660E", rows: 3, value: instruction, onChange: event => setInstruction(event.target.value) })] }), _jsx("button", { disabled: !title.trim() || !instruction.trim(), onClick: () => {
                                    setDraft({ ...draft, directions: [...draft.directions, { direction_id: crypto.randomUUID(), title: title.trim(), instruction: instruction.trim(), enabled: true, origin: "dataset" }] });
                                    setTitle("");
                                    setInstruction("");
                                    setError("");
                                }, children: "\u6DFB\u52A0\u6570\u636E\u96C6\u65B9\u5411" })] }), _jsx("p", { className: "iad-muted", children: "\u6A21\u578B\u53EF\u81EA\u4E3B\u53D1\u73B0\u65B0\u65B9\u5411\u3002\u4FDD\u5B58\u7528\u4E8E\u4E0B\u4E00\u6B21\u542F\u52A8\u7684\u56FE\u7EC4\uFF1B\u672A\u4FDD\u5B58\u7684\u4FEE\u6539\u4E0D\u53C2\u4E0E\u6316\u6398\u3002" }), invalid && _jsx("p", { role: "alert", children: "\u8BF7\u586B\u5199\u76EE\u6807\u3001\u65B9\u5411\u540D\u79F0\u548C\u8BF4\u660E\uFF0C\u65B9\u5411\u540D\u79F0\u4E0D\u80FD\u91CD\u590D\u3002" }), _jsxs("div", { className: "iad-row", children: [_jsx("button", { "data-action": "save-mining-directions", disabled: !dirty || invalid || saving, onClick: () => void save(), children: saving ? "保存中…" : "保存方向" }), _jsx("button", { disabled: !dirty || saving, onClick: () => { setDraft(saved.configuration); setError(""); }, children: "\u653E\u5F03\u4FEE\u6539" }), _jsx("button", { disabled: saving || (!saved?.customized && !dirty), onClick: () => void save(true), children: "\u6062\u590D\u9ED8\u8BA4\u65B9\u5411" })] }), saved && _jsxs("details", { children: [_jsx("summary", { children: "\u5DF2\u4FDD\u5B58\u7684\u6316\u6398\u63D0\u793A\u8BCD" }), _jsx("pre", { className: "iad-observation", children: saved.instruction })] })] })] });
}
