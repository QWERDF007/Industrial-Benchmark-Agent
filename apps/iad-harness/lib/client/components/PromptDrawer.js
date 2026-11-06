import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
import { IconButton } from './IconButton.js';
import { copyText } from '../clipboard.js';
export function PromptDrawer({ title, text, onClose }) {
    const [notice, setNotice] = useState('');
    return _jsxs(Modal, { title: title, className: "iad-drawer iad-prompt-drawer", header: false, onClose: onClose, children: [_jsxs("header", { className: "iad-dialog-header", children: [_jsx("h2", { children: title }), _jsx(Button, { onClick: async () => {
                            try {
                                await copyText(text);
                                setNotice('已复制');
                            }
                            catch {
                                setNotice('复制失败');
                            }
                        }, children: "\u590D\u5236\u63D0\u793A\u8BCD" }), _jsx(IconButton, { icon: "close", label: `关闭${title}抽屉`, onClick: onClose })] }), _jsxs("div", { className: "iad-dialog-body", children: [notice && _jsx("p", { role: "status", children: notice }), _jsx("pre", { className: "iad-prompt-text", children: text })] })] });
}
