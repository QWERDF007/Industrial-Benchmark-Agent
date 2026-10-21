import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { CloseIcon } from "../AuditIcon.js";
export function Modal({ title, onClose, children, className = "", restoreFocus, header = true }) {
    const dialog = useRef(null);
    const focusTarget = useRef(restoreFocus);
    const pressedOutside = useRef(false);
    focusTarget.current = restoreFocus;
    useEffect(() => {
        const previous = document.activeElement;
        const element = dialog.current;
        element.showModal();
        return () => { element.close(); const target = focusTarget.current ? focusTarget.current() : previous; if (target instanceof HTMLElement && target.isConnected)
            target.focus(); };
    }, []);
    const outside = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        return event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
    };
    return _jsxs("dialog", { ref: dialog, "aria-label": title, className: `iad-detail-dialog ${className}`, onCancel: event => { event.preventDefault(); event.stopPropagation(); onClose(); }, onPointerDown: event => { pressedOutside.current = outside(event); }, onPointerUp: event => { if (pressedOutside.current && outside(event))
            onClose(); pressedOutside.current = false; }, children: [header && _jsxs("header", { className: "iad-dialog-header", children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", className: "iad-icon-button", "aria-label": `关闭${title}`, title: "\u5173\u95ED", onClick: onClose, children: _jsx(CloseIcon, {}) })] }), children] });
}
