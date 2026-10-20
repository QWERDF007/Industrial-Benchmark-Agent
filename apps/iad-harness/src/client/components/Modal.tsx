import React, { useEffect, useRef } from "react";

export function Modal({ title, onClose, children }: { title: string; onClose(): void; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current!;
    element.showModal();
    return () => { element.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} aria-label={title} className="iad-detail-dialog" onCancel={event => { event.preventDefault(); onClose(); }}>{children}</dialog>;
}
