import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
export function PromptDrawer({ title, text, onClose }) {
    const [notice, setNotice] = useState('');
    return _jsxs(Modal, { title: title, className: "iad-drawer", onClose: onClose, children: [_jsx("div", { className: "iad-dialog-body", children: _jsx("pre", { className: "iad-prompt-text", children: text }) }), _jsxs("footer", { className: "iad-dialog-footer", children: [notice && _jsx("p", { role: "status", children: notice }), _jsx(Button, { onClick: async () => {
                            try {
                                await navigator.clipboard.writeText(text);
                                setNotice('已复制');
                            }
                            catch {
                                setNotice('复制失败');
                            }
                        }, children: "\u590D\u5236\u63D0\u793A\u8BCD" })] })] });
}
