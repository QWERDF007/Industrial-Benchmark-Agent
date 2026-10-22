import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { DeleteIcon } from "../AuditIcon.js";
import { message } from "../api.js";
import { Modal } from "./Modal.js";
export function DeleteAction({ title, name, description, onDelete, disabled, className = "", restoreFocus }) {
    const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
    const trigger = useRef(null), cancel = useRef(null);
    const submission = useRef(""), actionStarted = useRef(false);
    async function confirm() {
        if (busy)
            return;
        actionStarted.current = true;
        setBusy(true);
        setError("");
        try {
            await onDelete(submission.current);
            setOpen(false);
        }
        catch (error) {
            actionStarted.current = false;
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs(_Fragment, { children: [_jsx("button", { ref: trigger, type: "button", className: `iad-icon-button ${className}`, "aria-label": `${title} ${name}`, title: title, disabled: disabled || busy, onClick: () => { submission.current = uuid(); actionStarted.current = false; setError(""); setOpen(true); }, children: _jsx(DeleteIcon, {}) }), open && _jsxs(Modal, { title: title, className: "iad-confirm-dialog", initialFocus: cancel, restoreFocus: () => actionStarted.current ? restoreFocus?.() || trigger.current : trigger.current, onClose: () => { if (!busy)
                    setOpen(false); }, children: [_jsxs("p", { children: ["\u786E\u8BA4", title, "\u201C", name, "\u201D\uFF1F"] }), _jsx("p", { className: "iad-muted", children: description }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsxs("div", { className: "iad-form-actions", children: [_jsx("button", { ref: cancel, type: "button", "aria-label": "\u53D6\u6D88\u5220\u9664", disabled: busy, onClick: () => setOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "iad-danger", disabled: busy, onClick: () => void confirm(), children: busy ? "正在删除…" : "确认删除" })] })] })] });
}
