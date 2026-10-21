import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { autoUpdate, flip, offset, shift, size, useDismiss, useFloating, useInteractions } from "@floating-ui/react";
export function FloatingMenu({ label, summary, className, detailsRef, children }) {
    const [open, setOpen] = useState(false);
    const internalRef = useRef(null);
    const menu = detailsRef || internalRef;
    const { refs, context, floatingStyles, isPositioned } = useFloating({ open, placement: "bottom-start", whileElementsMounted: autoUpdate,
        onOpenChange(next, event, reason) {
            if (menu.current)
                menu.current.open = next;
            setOpen(next);
            if (!next && reason === "escape-key") {
                event?.preventDefault();
                refs.domReference.current?.focus();
            }
        },
        middleware: [offset(8), flip({ padding: 12 }), shift({ padding: 12 }), size({ padding: 12, apply({ availableWidth, availableHeight, elements }) {
                    Object.assign(elements.floating.style, { maxWidth: `${Math.max(0, availableWidth)}px`, maxHeight: `${Math.max(0, Math.min(300, availableHeight))}px` });
                } })], });
    const { getReferenceProps, getFloatingProps } = useInteractions([useDismiss(context, { bubbles: false })]);
    return _jsxs("details", { ref: menu, className: `iad-floating-menu ${className}`, onToggle: event => setOpen(event.currentTarget.open), children: [_jsxs("summary", { ref: refs.setReference, "aria-label": label, ...getReferenceProps(), children: [_jsx("span", { children: summary }), _jsx("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { d: "m6 9 6 6 6-6" }) })] }), open && _jsx("div", { ref: refs.setFloating, ...getFloatingProps(), className: "iad-floating-menu-panel", style: { ...floatingStyles, visibility: isPositioned ? "visible" : "hidden" }, children: children })] });
}
