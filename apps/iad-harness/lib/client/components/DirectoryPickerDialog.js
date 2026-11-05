import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from 'react';
import { message, request } from '../api.js';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
export function DirectoryPickerDialog({ label, initialPath, onClose, onPick }) {
    const id = useId(), input = useRef(null), pending = useRef(null);
    const [path, setPath] = useState(initialPath || '/data1'), [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true), [error, setError] = useState('');
    async function browse(directory) {
        pending.current?.abort();
        const controller = new AbortController();
        pending.current = controller;
        setPath(directory);
        setLoading(true);
        setError('');
        try {
            const value = await request(`/directories?path=${encodeURIComponent(directory)}`, undefined, undefined, controller.signal);
            if (!controller.signal.aborted) {
                setListing(value);
                setPath(current => current === directory ? value.path : current);
            }
        }
        catch (failure) {
            if (!controller.signal.aborted)
                setError(message(failure));
        }
        finally {
            if (!controller.signal.aborted)
                setLoading(false);
        }
    }
    useEffect(() => { void browse(initialPath || '/data1'); return () => pending.current?.abort(); }, [initialPath]);
    const canPick = listing !== null && !loading && !error && path === listing.path;
    return _jsx(Modal, { title: `浏览服务器目录 - ${label}`, size: "form", initialFocus: input, onClose: onClose, children: _jsxs("form", { className: "iad-dialog-form-layout", onSubmit: event => { event.preventDefault(); void browse(path); }, children: [_jsxs("div", { className: "iad-dialog-body", children: [_jsxs("div", { className: "iad-field", children: [_jsx("label", { htmlFor: id, children: "\u76EE\u5F55\u8DEF\u5F84" }), _jsxs("div", { className: "iad-row", children: [_jsx("input", { id: id, ref: input, value: path, onChange: event => setPath(event.target.value) }), _jsx(Button, { type: "submit", disabled: loading, children: "\u8DF3\u8F6C" })] })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsxs("nav", { "aria-label": "\u76EE\u5F55\u5217\u8868", "aria-busy": loading, children: [listing?.parent && _jsx(Button, { disabled: loading, onClick: () => void browse(listing.parent), children: "\u4E0A\u7EA7\u76EE\u5F55" }), _jsx("ul", { className: "iad-directory-list", children: listing?.directories.map(directory => _jsx("li", { children: _jsx(Button, { disabled: loading, onClick: () => void browse(directory.path), children: directory.name }) }, directory.path)) }), listing && !listing.directories.length && !loading && _jsx("p", { children: "\u6CA1\u6709\u5B50\u76EE\u5F55" })] })] }), _jsxs("footer", { className: "iad-dialog-footer", children: [_jsx(Button, { onClick: onClose, children: "\u53D6\u6D88" }), _jsx(Button, { variant: "primary", disabled: !canPick, onClick: () => { if (canPick) {
                                onPick(listing.path);
                                onClose();
                            } }, children: "\u9009\u62E9\u6B64\u76EE\u5F55" })] })] }) });
}
