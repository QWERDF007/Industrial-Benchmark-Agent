import React, { useState } from "react";
import { autoUpdate, flip, offset, shift, size, useFloating } from "@floating-ui/react-dom";

export function FloatingMenu({ label, summary, className, detailsRef, children }: {
  label: string; summary: React.ReactNode; className: string; detailsRef?: React.RefObject<HTMLDetailsElement>; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, isPositioned } = useFloating({ open, placement: "bottom-start", whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({ padding: 12 }), shift({ padding: 12 }), size({ padding: 12, apply({ availableWidth, availableHeight, elements }) {
      Object.assign(elements.floating.style, { maxWidth: `${Math.max(0, availableWidth)}px`, maxHeight: `${Math.max(0, Math.min(300, availableHeight))}px` });
    } })],
  });
  return <details ref={detailsRef} className={`iad-floating-menu ${className}`} onToggle={event => setOpen(event.currentTarget.open)} onKeyDown={event => {
    if (event.key === "Escape" && event.currentTarget.open) {
      event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus();
    }
  }}>
    <summary ref={refs.setReference} aria-label={label}>{summary}</summary>
    {open && <div ref={refs.setFloating} className="iad-floating-menu-panel" style={{ ...floatingStyles, visibility: isPositioned ? "visible" : "hidden" }}>{children}</div>}
  </details>;
}
