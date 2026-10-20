import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
export function Modal({ title, onClose, children, className = "" }) {
    const dialog = useRef(null);
    useEffect(() => {
        const previous = document.activeElement;
        const element = dialog.current;
        element.showModal();
        return () => { element.close(); if (previous instanceof HTMLElement && previous.isConnected)
            previous.focus(); };
    }, []);
    return _jsx("dialog", { ref: dialog, "aria-label": title, className: `iad-detail-dialog ${className}`, onCancel: event => { event.preventDefault(); event.stopPropagation(); onClose(); }, children: children });
}
