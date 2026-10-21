import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { message, request } from "../api.js";
export function DatasetName({ dataset, label, onChanged }) {
    const [editing, setEditing] = useState(false), [value, setValue] = useState(dataset.name);
    const [busy, setBusy] = useState(false), [error, setError] = useState("");
    const trigger = useRef(null), restoreFocus = useRef(false);
    useEffect(() => setValue(dataset.name), [dataset.name]);
    useEffect(() => { if (!editing && restoreFocus.current) {
        trigger.current?.focus();
        restoreFocus.current = false;
    } }, [editing]);
    async function save(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
            await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, { name: value.trim() }, "PATCH");
            onChanged();
            setEditing(false);
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsx("div", { className: "iad-dataset-name", children: editing ? _jsxs("form", { "aria-label": `${label}重命名`, onSubmit: save, onKeyDown: event => {
                if (event.key === "Escape" && !busy) {
                    event.preventDefault();
                    event.stopPropagation();
                    setEditing(false);
                }
            }, children: [_jsx("input", { "aria-label": label, autoFocus: true, required: true, maxLength: 120, disabled: busy, value: value, onChange: event => setValue(event.target.value) }), _jsxs("div", { className: "iad-row", children: [_jsx("button", { type: "button", disabled: busy, onClick: () => setEditing(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", className: "iad-primary", disabled: busy || !value.trim() || value.trim() === dataset.name, children: busy ? "保存中…" : "保存名称" })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error })] }) : _jsxs("button", { ref: trigger, type: "button", className: "iad-name-trigger", "aria-label": `修改数据集名称 ${dataset.name}`, title: "\u4FEE\u6539\u6570\u636E\u96C6\u540D\u79F0", onClick: () => {
                setValue(dataset.name);
                setError("");
                restoreFocus.current = true;
                setEditing(true);
            }, children: [_jsx("span", { children: dataset.name }), _jsx("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { d: "m16 3 5 5L8 21H3v-5L16 3Z M13 6l5 5" }) })] }) });
}
