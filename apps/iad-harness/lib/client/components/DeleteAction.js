import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { message } from "../api.js";
import { Modal } from "./Modal.js";
import { IconButton } from "./IconButton.js";
import { Button } from './Button.js';
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
    return _jsxs(_Fragment, { children: [_jsx(IconButton, { icon: "delete", ref: trigger, className: className, label: `${title} ${name}`, title: title, disabled: disabled || busy, onClick: () => { submission.current = uuid(); actionStarted.current = false; setError(""); setOpen(true); } }), open && _jsxs(Modal, { title: title, className: "iad-confirm-dialog", initialFocus: cancel, restoreFocus: () => actionStarted.current ? restoreFocus?.() || trigger.current : trigger.current, onClose: () => { if (!busy)
                    setOpen(false); }, children: [_jsxs("div", { className: "iad-dialog-body", children: [_jsxs("p", { children: ["\u786E\u8BA4", title, "\u201C", name, "\u201D\uFF1F"] }), description && _jsx("p", { children: description }), error && _jsx("p", { role: "alert", className: "iad-error", children: error })] }), _jsxs("footer", { className: "iad-dialog-footer", children: [_jsx(Button, { ref: cancel, "aria-label": "\u53D6\u6D88\u5220\u9664", disabled: busy, onClick: () => setOpen(false), children: "\u53D6\u6D88" }), _jsx(Button, { variant: "danger", disabled: busy, onClick: () => void confirm(), children: busy ? "正在删除…" : "确认删除" })] })] })] });
}
