import React, { useEffect, useRef } from "react";
import { CloseIcon } from "../AuditIcon.js";

export function Modal({ title, onClose, children, className = "", restoreFocus, header = true }: { title: string; onClose(): void; children: React.ReactNode; className?: string; restoreFocus?(): HTMLElement | null; header?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const focusTarget = useRef(restoreFocus);
  const pressedOutside = useRef(false);
  focusTarget.current = restoreFocus;
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current!;
    element.showModal();
    return () => { element.close(); const target = focusTarget.current ? focusTarget.current() : previous; if (target instanceof HTMLElement && target.isConnected) target.focus(); };
  }, []);
  const outside = (event: React.PointerEvent<HTMLDialogElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  };
  return <dialog ref={dialog} aria-label={title} className={`iad-detail-dialog ${className}`} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}
    onPointerDown={event => { pressedOutside.current = outside(event); }} onPointerUp={event => { if (pressedOutside.current && outside(event)) onClose(); pressedOutside.current = false; }}>
    {header && <header className="iad-dialog-header"><h2>{title}</h2><button type="button" className="iad-icon-button" aria-label={`关闭${title}`} title="关闭" onClick={onClose}><CloseIcon /></button></header>}
    {children}
  </dialog>;
}
