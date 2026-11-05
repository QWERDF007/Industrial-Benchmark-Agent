import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from './Button.js';
import { IconButton } from "./IconButton.js";
import { useState } from 'react';
import { Modal } from './Modal.js';
import { message } from '../api.js';
export function KnowledgeConfirmation({ state, onClose }) {
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    if (!state)
        return null;
    return _jsxs(Modal, { title: state.title, onClose: () => { if (!busy)
            onClose(); }, size: "compact", className: "knowledge-confirm-dialog", header: false, children: [_jsxs("header", { className: "iad-dialog-header", children: [_jsx("h2", { children: state.title }), _jsx(IconButton, { icon: "close", label: "\u5173\u95ED\u786E\u8BA4\u7A97\u53E3", disabled: busy, onClick: onClose })] }), _jsxs("div", { className: "iad-dialog-body", id: "confirm-message", children: [state.message, error && _jsx("p", { role: "alert", children: error })] }), _jsxs("footer", { className: "iad-dialog-footer", children: [_jsx(Button, { disabled: busy, onClick: onClose, children: "\u53D6\u6D88" }), _jsx(Button, { variant: state.danger ? "danger" : "primary", id: "confirm-accept", disabled: busy, onClick: async () => {
                            setBusy(true);
                            setError('');
                            try {
                                await state.onConfirm();
                                onClose();
                            }
                            catch (error) {
                                setError(message(error));
                            }
                            finally {
                                setBusy(false);
                            }
                        }, children: busy ? '处理中…' : '确定' })] })] });
}
