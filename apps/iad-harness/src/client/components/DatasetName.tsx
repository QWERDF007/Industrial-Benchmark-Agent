import {EditIcon} from "../AuditIcon.js";
import React, { useEffect, useRef, useState } from "react";
import type { Dataset } from "../../shared/contracts.js";
import { message, request } from "../api.js";

export function DatasetName({ dataset, label, onChanged }: { dataset: Dataset; label: string; onChanged(): void }) {
  const [editing, setEditing] = useState(false), [value, setValue] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null), restoreFocus = useRef(false);
  const session = useRef<"idle" | "editing" | "saving">("idle");
  useEffect(() => { if (!editing && restoreFocus.current) { trigger.current?.focus(); restoreFocus.current = false; } }, [editing]);
  function close(restore: boolean) { session.current = "idle"; restoreFocus.current = restore; setEditing(false); }
  async function save(restore: boolean) {
    if (session.current !== "editing") return;
    const name = value.trim();
    if (name === dataset.name) { close(restore); return; }
    if (!name) { setError("数据集名称不能为空"); return; }
    session.current = "saving"; setBusy(true); setError("");
    try { await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, { name }, "PATCH"); onChanged(); close(restore); }
    catch (e) { session.current = "editing"; setError(message(e)); } finally { setBusy(false); }
  }
  return <div className="iad-dataset-name">{editing ? <>
    <input aria-label={label} aria-busy={busy} autoFocus maxLength={120} disabled={busy} value={value} onChange={event => setValue(event.target.value)}
      onBlur={() => void save(false)} onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); void save(true); }
        if (event.key === "Escape" && !busy) { event.preventDefault(); event.stopPropagation(); close(true); }
      }} />
    {error && <p role="alert" className="iad-error">{error}</p>}
  </> : <button ref={trigger} type="button" className="iad-name-trigger" aria-label={`修改数据集名称 ${dataset.name}`} title="修改数据集名称" onClick={() => {
    session.current = "editing"; setValue(dataset.name); setError(""); setEditing(true);
  }}><span>{dataset.name}</span><EditIcon /></button>}</div>;
}
