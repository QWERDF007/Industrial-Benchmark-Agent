import React, { useState } from "react";
import type { KnowledgeCheck } from "../../shared/contracts.js";
import { Modal } from "./Modal.js";

export function KnowledgeRevision({ versionId, check, busy, error, onSubmit, onClose }: {
  versionId: string; check: KnowledgeCheck; busy: boolean; error: string;
  onSubmit(instruction: string): void; onClose(): void;
}) {
  const [instruction, setInstruction] = useState(check.criterion);
  return <Modal title="修订判据" onClose={() => { if (!busy) onClose(); }}><form onSubmit={event => { event.preventDefault(); if (!busy && instruction.trim()) onSubmit(instruction.trim()); }}>
    <h2>{check.title}</h2><p className="iad-muted">基准版本 <code>{versionId}</code></p>
    <label className="iad-field">修订建议<textarea aria-label="判据修订建议" required value={instruction} disabled={busy} onChange={event => setInstruction(event.target.value)} /></label>
    <p className="iad-muted">重新看图核验后形成后继版本，当前版本保留。</p>
    {error && <p role="alert" className="iad-error">{error}</p>}
    <div className="iad-row"><button type="submit" className="iad-primary" disabled={busy || !instruction.trim()}>{busy ? "提交中…" : "提交核验"}</button><button type="button" disabled={busy} onClick={onClose}>取消</button></div>
  </form></Modal>;
}
