import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef } from "react";
import { CloseIcon } from "../AuditIcon.js";
export function Modal({ title, onClose, children, className = "", restoreFocus, initialFocus, header = true, presentation = "modal" }) {
    const dialog = useRef(null);
    const focusTarget = useRef(restoreFocus);
    const pressedOutside = useRef(false);
    const previousFocus = useRef(null), currentPresentation = useRef(presentation);
    focusTarget.current = restoreFocus;
    useLayoutEffect(() => {
        const element = dialog.current;
        const active = document.activeElement, wasModal = element.matches(":modal");
        if (!previousFocus.current)
            previousFocus.current = active;
        currentPresentation.current = presentation;
        if (element.open)
            element.close();
        if (presentation === "inline")
            element.show();
        if (presentation === "modal") {
            element.showModal();
            if (initialFocus?.current)
                initialFocus.current.focus();
            else if (active instanceof HTMLElement && element.contains(active))
                active.focus();
        }
        if (presentation === "closed" && (wasModal || (active && element.contains(active)))) {
            const target = focusTarget.current ? focusTarget.current() : previousFocus.current;
            if (target instanceof HTMLElement && target.isConnected)
                target.focus();
        }
    }, [presentation, initialFocus]);
    useEffect(() => {
        const element = dialog.current;
        return () => { element.close(); if (currentPresentation.current !== "modal")
            return; const target = focusTarget.current ? focusTarget.current() : previousFocus.current; if (target instanceof HTMLElement && target.isConnected)
            target.focus(); };
    }, []);
    const outside = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        return event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
    };
    return _jsxs("dialog", { ref: dialog, "aria-label": title, role: presentation === "inline" ? "region" : undefined, className: `iad-detail-dialog ${presentation === "inline" ? "iad-inline-dialog" : ""} ${className}`, onCancel: event => { event.preventDefault(); event.stopPropagation(); onClose(); }, onPointerDown: event => { pressedOutside.current = outside(event); }, onPointerUp: event => { if (pressedOutside.current && outside(event))
            onClose(); pressedOutside.current = false; }, children: [header && presentation === "modal" && _jsxs("header", { className: "iad-dialog-header", children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", className: "iad-icon-button", "aria-label": `关闭${title}`, title: "\u5173\u95ED", onClick: onClose, children: _jsx(CloseIcon, {}) })] }), children] });
}
