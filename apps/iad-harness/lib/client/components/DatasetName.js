import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { message, request } from "../api.js";
export function DatasetName({ dataset, label, onChanged }) {
    const [editing, setEditing] = useState(false), [value, setValue] = useState("");
    const [busy, setBusy] = useState(false), [error, setError] = useState("");
    const trigger = useRef(null), restoreFocus = useRef(false);
    const session = useRef("idle");
    useEffect(() => { if (!editing && restoreFocus.current) {
        trigger.current?.focus();
        restoreFocus.current = false;
    } }, [editing]);
    function close(restore) { session.current = "idle"; restoreFocus.current = restore; setEditing(false); }
    async function save(restore) {
        if (session.current !== "editing")
            return;
        const name = value.trim();
        if (name === dataset.name) {
            close(restore);
            return;
        }
        if (!name) {
            setError("数据集名称不能为空");
            return;
        }
        session.current = "saving";
        setBusy(true);
        setError("");
        try {
            await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, { name }, "PATCH");
            onChanged();
            close(restore);
        }
        catch (e) {
            session.current = "editing";
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsx("div", { className: "iad-dataset-name", children: editing ? _jsxs(_Fragment, { children: [_jsx("input", { "aria-label": label, "aria-busy": busy, autoFocus: true, maxLength: 120, disabled: busy, value: value, onChange: event => setValue(event.target.value), onBlur: () => void save(false), onKeyDown: event => {
                        if (event.nativeEvent.isComposing)
                            return;
                        if (event.key === "Enter") {
                            event.preventDefault();
                            event.stopPropagation();
                            void save(true);
                        }
                        if (event.key === "Escape" && !busy) {
                            event.preventDefault();
                            event.stopPropagation();
                            close(true);
                        }
                    } }), error && _jsx("p", { role: "alert", className: "iad-error", children: error })] }) : _jsxs("button", { ref: trigger, type: "button", className: "iad-name-trigger", "aria-label": `修改数据集名称 ${dataset.name}`, title: "\u4FEE\u6539\u6570\u636E\u96C6\u540D\u79F0", onClick: () => {
                session.current = "editing";
                setValue(dataset.name);
                setError("");
                setEditing(true);
            }, children: [_jsx("span", { children: dataset.name }), _jsx("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { d: "m16 3 5 5L8 21H3v-5L16 3Z M13 6l5 5" }) })] }) });
}
