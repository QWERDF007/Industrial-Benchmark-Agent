import React, { useRef, useState } from "react";
import { v4 as uuid } from "uuid";

import { message } from "../api.js";
import { Modal } from "./Modal.js";
import { IconButton } from "./IconButton.js";
import { Button } from './Button.js';

export function DeleteAction({ title, name, description, onDelete, disabled, className = "", restoreFocus }: {
  title: string; name: string; description?: string; onDelete(submissionId: string): Promise<void>;
  disabled?: boolean; className?: string; restoreFocus?(): HTMLElement | null;
}) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null), cancel = useRef<HTMLButtonElement>(null);
  const submission = useRef(""), actionStarted = useRef(false);
  async function confirm() {
    if (busy) return;
    actionStarted.current = true; setBusy(true); setError("");
    try { await onDelete(submission.current); setOpen(false); }
    catch (error) { actionStarted.current = false; setError(message(error)); }
    finally { setBusy(false); }
  }
  return <>
    <IconButton icon="delete" ref={trigger} className={className} label={`${title} ${name}`} title={title} disabled={disabled || busy} onClick={event => { event.stopPropagation(); submission.current = uuid(); actionStarted.current = false; setError(""); setOpen(true); }} />
    {open && <Modal title={title} size="compact" initialFocus={cancel}
      restoreFocus={() => actionStarted.current ? restoreFocus?.() || trigger.current : trigger.current}
      onClose={() => { if (!busy) setOpen(false); }}>
      <div className="iad-dialog-body"><p>确认{title}“{name}”？</p>{description && <p>{description}</p>}
        {error && <p role="alert" className="iad-error">{error}</p>}</div>
      <footer className="iad-dialog-footer"><Button ref={cancel} aria-label="取消删除" disabled={busy} onClick={() => setOpen(false)}>取消</Button>
        <Button variant="danger" disabled={busy} onClick={() => void confirm()}>{busy ? "正在删除…" : "确认删除"}</Button></footer>
    </Modal>}
  </>;
}
