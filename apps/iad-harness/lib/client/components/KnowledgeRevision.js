import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Modal } from "./Modal.js";
export function KnowledgeRevision({ versionId, check, busy, error, onSubmit, onClose }) {
    const [instruction, setInstruction] = useState(check.criterion);
    return _jsx(Modal, { title: "\u4FEE\u8BA2\u5224\u636E", onClose: () => { if (!busy)
            onClose(); }, children: _jsxs("form", { onSubmit: event => { event.preventDefault(); if (!busy && instruction.trim())
                onSubmit(instruction.trim()); }, children: [_jsx("h2", { children: check.title }), _jsxs("p", { className: "iad-muted", children: ["\u57FA\u51C6\u7248\u672C ", _jsx("code", { children: versionId })] }), _jsxs("label", { className: "iad-field", children: ["\u4FEE\u8BA2\u5EFA\u8BAE", _jsx("textarea", { "aria-label": "\u5224\u636E\u4FEE\u8BA2\u5EFA\u8BAE", required: true, value: instruction, disabled: busy, onChange: event => setInstruction(event.target.value) })] }), _jsx("p", { className: "iad-muted", children: "\u91CD\u65B0\u770B\u56FE\u6838\u9A8C\u540E\u5F62\u6210\u540E\u7EE7\u7248\u672C\uFF0C\u5F53\u524D\u7248\u672C\u4FDD\u7559\u3002" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsxs("div", { className: "iad-row", children: [_jsx("button", { type: "submit", className: "iad-primary", disabled: busy || !instruction.trim(), children: busy ? "提交中…" : "提交核验" }), _jsx("button", { type: "button", disabled: busy, onClick: onClose, children: "\u53D6\u6D88" })] })] }) });
}
