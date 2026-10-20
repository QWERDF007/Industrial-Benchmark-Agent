import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
export function Modal({ title, onClose, children }) {
    const dialog = useRef(null);
    useEffect(() => {
        const previous = document.activeElement;
        const element = dialog.current;
        element.showModal();
        return () => { element.close(); if (previous instanceof HTMLElement && previous.isConnected)
            previous.focus(); };
    }, []);
    return _jsx("dialog", { ref: dialog, "aria-label": title, className: "iad-detail-dialog", onCancel: event => { event.preventDefault(); onClose(); }, children: children });
}
