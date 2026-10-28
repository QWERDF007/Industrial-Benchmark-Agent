import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { useWorkspace } from "../workspace.js";
import { Modal } from "./Modal.js";
export function MiningDirectionList({ configuration, catalog, opening, focusId, savedRevision, onChange, onSource, }) {
    const { workspace, state } = useWorkspace(), view = workspace.view("industrial-knowledge"), kind = state.knowledgeKind;
    const draft = configuration;
    const focusTarget = useRef(null);
    const [category, setCategory] = useState(view.explorationVersion ? "explored" : "preset"), [search, setSearch] = useState(""), [selectedOnly, setSelectedOnly] = useState(false);
    const [editing, setEditing] = useState(null);
    const [title, setTitle] = useState(""), [instruction, setInstruction] = useState(""), [adding, setAdding] = useState(false);
    const candidates = catalog?.exploration?.directions.filter((item) => item.applies_to === "both" || item.applies_to === kind) || [];
    const rows = [
        ...(draft?.directions || []),
        ...candidates
            .filter((item) => !draft?.directions.some((row) => row.direction_id === item.direction_id))
            .map((item) => ({
            direction_id: item.direction_id,
            title: item.title,
            instruction: item.instruction,
            enabled: false,
            origin: "explored",
        })),
    ];
    const visible = rows.filter((item) => item.origin === category &&
        (!selectedOnly || item.enabled) &&
        `${item.title}\n${item.instruction}`
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase()));
    const focusOrigin = rows.find((item) => item.direction_id === focusId)?.origin;
    useEffect(() => {
        if (focusOrigin)
            setCategory(focusOrigin);
    }, [focusId, focusOrigin]);
    useEffect(() => {
        if (focusId)
            focusTarget.current?.scrollIntoView({ block: "nearest" });
    }, [category, focusId, catalog]);
    useEffect(() => {
        setEditing(null);
    }, [savedRevision]);
    function change(item, patch) {
        if (!draft)
            return;
        const exists = draft.directions.some((row) => row.direction_id === item.direction_id);
        onChange({
            ...draft,
            directions: exists
                ? draft.directions.map((row) => row.direction_id === item.direction_id ? { ...row, ...patch } : row)
                : [...draft.directions, { ...item, ...patch }],
        });
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "iad-direction-tabs", children: [
                    ["preset", "通用"],
                    ["explored", "探索"],
                    ["dataset", "自定义"],
                ].map(([origin, label]) => (_jsxs("button", { "aria-label": `${label}方向`, "aria-pressed": category === origin, onClick: () => setCategory(origin), children: [label, " ", rows.filter((item) => item.origin === origin).length] }, origin))) }), category === "explored" && (_jsxs("label", { className: "iad-field iad-exploration-version", children: ["\u63A2\u7D22\u7248\u672C", _jsxs("select", { "aria-label": "\u9009\u7528\u63A2\u7D22\u7248\u672C", value: catalog?.exploration?.version_id || "", onChange: (event) => workspace.updateView("industrial-knowledge", {
                            explorationVersion: event.target.value,
                        }), children: [_jsx("option", { value: "", disabled: true, children: "\u5C1A\u65E0\u63A2\u7D22\u7ED3\u679C" }), catalog?.versions.map((version) => (_jsxs("option", { value: version.version_id, children: [version.created_at.slice(0, 19).replace("T", " "), " \u00B7", " ", version.direction_count, " \u9879"] }, version.version_id)))] })] })), _jsxs("div", { className: "iad-direction-tools", children: [_jsxs("label", { className: "iad-field", children: ["\u641C\u7D22\u65B9\u5411", _jsx("input", { type: "search", "aria-label": "\u641C\u7D22\u6316\u6398\u65B9\u5411", value: search, onChange: (event) => setSearch(event.target.value) })] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: selectedOnly, onChange: (event) => setSelectedOnly(event.target.checked) }), "\u4EC5\u770B\u5DF2\u9009"] }), _jsx("button", { onClick: () => {
                            setTitle("");
                            setInstruction("");
                            setAdding(true);
                        }, children: "\u6DFB\u52A0\u65B9\u5411" })] }), _jsxs("p", { className: "iad-muted", children: ["\u663E\u793A ", visible.length, " \u9879 \u00B7 \u5DF2\u9009", " ", draft.directions.filter((item) => item.enabled).length, " \u9879"] }), _jsx("div", { className: "iad-direction-list", children: visible.map((item) => (_jsxs("div", { ref: focusId === item.direction_id ? focusTarget : undefined, "data-focused": focusId === item.direction_id, children: [_jsxs("div", { className: "iad-direction-row", children: [_jsx("input", { type: "checkbox", "aria-label": `${draft.directions.some((row) => row.direction_id === item.direction_id) ? "启用方向" : "启用探索方向"} ${item.title}`, checked: item.enabled, onChange: (event) => change(item, { enabled: event.target.checked }) }), _jsxs("div", { className: "iad-direction-label", children: [_jsx("strong", { children: item.title }), _jsx("p", { title: item.instruction, children: item.instruction })] }), _jsxs("div", { className: "iad-direction-actions", children: [item.origin === "explored" && (_jsx("button", { disabled: opening === item.direction_id, onClick: () => void onSource(item.direction_id), children: "\u67E5\u770B\u6765\u6E90" })), _jsx("button", { "aria-label": `编辑方向 ${item.title}`, disabled: !!editing &&
                                                editing.original.direction_id !== item.direction_id, onClick: () => setEditing({
                                                original: { ...item },
                                                existed: draft.directions.some((row) => row.direction_id === item.direction_id),
                                            }), children: "\u7F16\u8F91" })] })] }), editing?.original.direction_id === item.direction_id && (_jsxs("div", { className: "iad-direction-editor", children: [_jsxs("label", { className: "iad-field", children: ["\u540D\u79F0", _jsx("input", { "aria-label": `方向名称 ${item.direction_id}`, value: item.title, onChange: (event) => change(item, { title: event.target.value }) })] }), _jsxs("label", { className: "iad-field", children: ["\u89C2\u5BDF\u8BF4\u660E", _jsx("textarea", { "aria-label": `方向说明 ${item.direction_id}`, rows: 4, value: item.instruction, onChange: (event) => change(item, { instruction: event.target.value }) })] }), _jsxs("div", { className: "iad-row", children: [_jsx("button", { onClick: () => setEditing(null), children: "\u5B8C\u6210\u7F16\u8F91" }), _jsx("button", { onClick: () => {
                                                onChange({
                                                    ...draft,
                                                    directions: editing.existed
                                                        ? draft.directions.map((row) => row.direction_id === item.direction_id
                                                            ? editing.original
                                                            : row)
                                                        : draft.directions.filter((row) => row.direction_id !== item.direction_id),
                                                });
                                                setEditing(null);
                                            }, children: "\u53D6\u6D88\u672C\u884C\u7F16\u8F91" }), draft.directions.some((row) => row.direction_id === item.direction_id) && (_jsx("button", { className: "iad-danger", onClick: () => {
                                                onChange({
                                                    ...draft,
                                                    directions: draft.directions.filter((row) => row.direction_id !== item.direction_id),
                                                });
                                                setEditing(null);
                                            }, children: "\u5220\u9664\u65B9\u5411" }))] })] }))] }, item.direction_id))) }), !visible.length && _jsx("p", { className: "iad-muted", children: "\u6CA1\u6709\u5339\u914D\u7684\u65B9\u5411\u3002" }), adding && (_jsxs(Modal, { title: "\u6DFB\u52A0\u81EA\u5B9A\u4E49\u65B9\u5411", onClose: () => setAdding(false), className: "iad-direction-add", children: [_jsxs("label", { className: "iad-field", children: ["\u540D\u79F0", _jsx("input", { "aria-label": "\u65B0\u65B9\u5411\u540D\u79F0", value: title, onChange: (event) => setTitle(event.target.value) })] }), _jsxs("label", { className: "iad-field", children: ["\u89C2\u5BDF\u8BF4\u660E", _jsx("textarea", { "aria-label": "\u65B0\u65B9\u5411\u8BF4\u660E", rows: 3, value: instruction, onChange: (event) => setInstruction(event.target.value) })] }), _jsx("button", { disabled: !title.trim() || !instruction.trim(), onClick: () => {
                            onChange({
                                ...draft,
                                directions: [
                                    ...draft.directions,
                                    {
                                        direction_id: uuid(),
                                        title: title.trim(),
                                        instruction: instruction.trim(),
                                        enabled: true,
                                        origin: "dataset",
                                    },
                                ],
                            });
                            setCategory("dataset");
                            setAdding(false);
                        }, children: "\u6DFB\u52A0\u6570\u636E\u96C6\u65B9\u5411" })] }))] }));
}
