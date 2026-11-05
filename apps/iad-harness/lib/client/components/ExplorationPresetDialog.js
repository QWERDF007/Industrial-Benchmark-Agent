import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { message, request } from '../api.js';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
export function ExplorationPresetDialog({ text, onSaved, onClose }) {
    const [name, setName] = useState(''), [saving, setSaving] = useState(false), [error, setError] = useState('');
    const input = useRef(null);
    async function save(event) {
        event.preventDefault();
        if (saving || !name.trim())
            return;
        setSaving(true);
        setError('');
        try {
            onSaved(await request('/exploration/presets', { name: name.trim(), text }));
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setSaving(false);
        }
    }
    return _jsx(Modal, { title: "\u53E6\u5B58\u4E3A\u63D0\u793A\u8BCD\u9884\u8BBE", size: "compact", initialFocus: input, onClose: () => { if (!saving)
            onClose(); }, children: _jsxs("form", { className: "iad-dialog-form-layout", onSubmit: event => void save(event), children: [_jsxs("div", { className: "iad-dialog-body", children: [_jsxs("label", { className: "iad-field", children: ["\u9884\u8BBE\u540D\u79F0", _jsx("input", { ref: input, id: "exp-new-preset", disabled: saving, value: name, onChange: event => setName(event.target.value) })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error })] }), _jsxs("footer", { className: "iad-dialog-footer", children: [_jsx(Button, { disabled: saving, onClick: onClose, children: "\u53D6\u6D88" }), _jsx(Button, { type: "submit", variant: "primary", disabled: saving || !name.trim(), children: saving ? '保存中…' : '保存' })] })] }) });
}
