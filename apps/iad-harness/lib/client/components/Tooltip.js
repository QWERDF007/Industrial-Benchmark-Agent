import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { autoUpdate, flip, FloatingPortal, offset, shift, useClick, useDismiss, useFloating, useFocus, useHover, useInteractions, useRole } from "@floating-ui/react";
import { themeStyles } from "../theme.js";
export function Tooltip({ label, content, className, children }) {
    const [open, setOpen] = useState(false);
    const { refs, context, floatingStyles } = useFloating({ open, onOpenChange: setOpen, placement: "top", whileElementsMounted: autoUpdate,
        middleware: [offset(8), flip(), shift({ padding: 12, crossAxis: true })] });
    const { getReferenceProps, getFloatingProps } = useInteractions([
        useHover(context, { move: false, delay: { open: 200, close: 100 } }), useFocus(context), useClick(context),
        useDismiss(context, { bubbles: false }), useRole(context, { role: "tooltip" }),
    ]);
    return _jsxs(_Fragment, { children: [_jsx("button", { type: "button", ref: refs.setReference, className: className, "aria-label": label, ...getReferenceProps(), children: children }), open && _jsx(FloatingPortal, { children: _jsxs("div", { ref: refs.setFloating, className: "iad-tooltip", style: floatingStyles, ...getFloatingProps(), children: [_jsxs("style", { children: [themeStyles, `.iad-tooltip{box-sizing:border-box;z-index:10020;max-width:min(340px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;padding:12px;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);font:var(--dsh-content-font-size,14px)/1.5 system-ui,sans-serif;overflow-wrap:anywhere;box-shadow:0 4px 16px #0002}.iad-tooltip p{margin:4px 0}`] }), content] }) })] });
}
