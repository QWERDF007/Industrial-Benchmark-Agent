import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { message } from '../api.js';
export function ConfirmationDialog({ title, children, confirmLabel = '确定', danger = false, confirmDisabled = false, onConfirm, onClose, restoreFocus }) {
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    const cancel = useRef(null);
    return _jsxs(Modal, { title: title, size: "compact", initialFocus: cancel, restoreFocus: restoreFocus, onClose: () => { if (!busy)
            onClose(); }, children: [_jsxs("div", { className: "iad-dialog-body", children: [children, error && _jsx("p", { role: "alert", className: "iad-error", children: error })] }), _jsxs("footer", { className: "iad-dialog-footer", children: [_jsx(Button, { ref: cancel, "aria-label": danger ? '取消删除' : '取消', disabled: busy, onClick: onClose, children: "\u53D6\u6D88" }), _jsx(Button, { variant: danger ? 'danger' : 'primary', id: "confirm-accept", disabled: busy || confirmDisabled, onClick: async () => {
                            setBusy(true);
                            setError('');
                            try {
                                await onConfirm();
                                onClose();
                            }
                            catch (error) {
                                setError(message(error));
                            }
                            finally {
                                setBusy(false);
                            }
                        }, children: busy ? '处理中…' : confirmLabel })] })] });
}
