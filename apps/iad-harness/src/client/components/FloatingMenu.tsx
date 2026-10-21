import React, { useRef, useState } from "react";
import { autoUpdate, flip, offset, shift, size, useDismiss, useFloating, useInteractions } from "@floating-ui/react";

export function FloatingMenu({ label, summary, className, detailsRef, children }: {
  label: string; summary: React.ReactNode; className: string; detailsRef?: React.RefObject<HTMLDetailsElement>; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const internalRef = useRef<HTMLDetailsElement>(null);
  const menu = detailsRef || internalRef;
  const { refs, context, floatingStyles, isPositioned } = useFloating({ open, placement: "bottom-start", whileElementsMounted: autoUpdate,
    onOpenChange(next, event, reason) {
      if (menu.current) menu.current.open = next;
      setOpen(next);
      if (!next && reason === "escape-key") {
        event?.preventDefault();
        (refs.domReference.current as HTMLElement | null)?.focus();
      }
    },
    middleware: [offset(8), flip({ padding: 12 }), shift({ padding: 12 }), size({ padding: 12, apply({ availableWidth, availableHeight, elements }) {
      Object.assign(elements.floating.style, { maxWidth: `${Math.max(0, availableWidth)}px`, maxHeight: `${Math.max(0, Math.min(300, availableHeight))}px` });
    } })],
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([useDismiss(context, { bubbles: false })]);
  return <details ref={menu} className={`iad-floating-menu ${className}`} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary ref={refs.setReference} aria-label={label} {...getReferenceProps()}><span>{summary}</span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6" /></svg></summary>
    {open && <div ref={refs.setFloating} {...getFloatingProps()} className="iad-floating-menu-panel" style={{ ...floatingStyles, visibility: isPositioned ? "visible" : "hidden" }}>{children}</div>}
  </details>;
}
