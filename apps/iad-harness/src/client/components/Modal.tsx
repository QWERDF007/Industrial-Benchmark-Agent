import React, { useEffect, useRef } from "react";

export function Modal({ title, onClose, children, className = "", restoreFocus }: { title: string; onClose(): void; children: React.ReactNode; className?: string; restoreFocus?(): HTMLElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const focusTarget = useRef(restoreFocus);
  focusTarget.current = restoreFocus;
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current!;
    element.showModal();
    return () => { element.close(); const target = focusTarget.current ? focusTarget.current() : previous; if (target instanceof HTMLElement && target.isConnected) target.focus(); };
  }, []);
  return <dialog ref={dialog} aria-label={title} className={`iad-detail-dialog ${className}`} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>{children}</dialog>;
}
