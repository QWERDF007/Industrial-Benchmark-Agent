import React, { useEffect, useRef, useState } from "react";
import type { Dataset } from "../../shared/contracts.js";
import { message, request } from "../api.js";

export function DatasetName({ dataset, label, onChanged }: { dataset: Dataset; label: string; onChanged(): void }) {
  const [editing, setEditing] = useState(false), [value, setValue] = useState(dataset.name);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null), restoreFocus = useRef(false);
  useEffect(() => setValue(dataset.name), [dataset.name]);
  useEffect(() => { if (!editing && restoreFocus.current) { trigger.current?.focus(); restoreFocus.current = false; } }, [editing]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, { name: value.trim() }, "PATCH"); onChanged(); setEditing(false); }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <div className="iad-dataset-name">{editing ? <form aria-label={`${label}重命名`} onSubmit={save} onKeyDown={event => {
    if (event.key === "Escape" && !busy) { event.preventDefault(); event.stopPropagation(); setEditing(false); }
  }}>
    <input aria-label={label} autoFocus required maxLength={120} disabled={busy} value={value} onChange={event => setValue(event.target.value)} />
    <div className="iad-row"><button type="button" disabled={busy} onClick={() => setEditing(false)}>取消</button>
      <button type="submit" className="iad-primary" disabled={busy || !value.trim() || value.trim() === dataset.name}>{busy ? "保存中…" : "保存名称"}</button></div>
    {error && <p role="alert" className="iad-error">{error}</p>}
  </form> : <button ref={trigger} type="button" className="iad-name-trigger" aria-label={`修改数据集名称 ${dataset.name}`} title="修改数据集名称" onClick={() => {
    setValue(dataset.name); setError(""); restoreFocus.current = true; setEditing(true);
  }}><span>{dataset.name}</span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m16 3 5 5L8 21H3v-5L16 3Z M13 6l5 5" /></svg></button>}</div>;
}
