import React, { useEffect, useRef, useState } from "react";
import type { MiningDirection, MiningPrompt, MiningPromptConfiguration } from "../../shared/domain.generated.js";
import { message, request } from "../api.js";
import type { ExplorationCatalog } from "../../shared/domain.generated.js";
import { useWorkspace } from "../workspace.js";

export interface DirectionProposal { id: string; datasetId: string; kind: "normal" | "defect"; title: string; instruction: string }

export function KnowledgeDirections({ datasetId, kind, proposal, onPending, onProposalUsed }: {
  datasetId: string; kind: "normal" | "defect"; proposal?: DirectionProposal; onPending(value: boolean): void; onProposalUsed(): void;
}) {
  const { workspace } = useWorkspace();
  const explorationVersion = workspace.view("industrial-knowledge").explorationVersion;
  const [catalog, setCatalog] = useState<ExplorationCatalog | null>(null), [catalogError, setCatalogError] = useState("");
  const [saved, setSaved] = useState<MiningPrompt | null>(null), [draft, setDraft] = useState<MiningPromptConfiguration | null>(null);
  const [error, setError] = useState(""), [saving, setSaving] = useState(false), [revision, setRevision] = useState(0);
  const [title, setTitle] = useState(""), [instruction, setInstruction] = useState(""), [open, setOpen] = useState(false);
  const applied = useRef(""), alive = useRef(true);
  const query = new URLSearchParams({ dataset_id: datasetId, kind }).toString();
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ dataset_id: datasetId });
    if (explorationVersion) params.set("version_id", explorationVersion);
    setCatalog(null); setCatalogError("");
    request<ExplorationCatalog>(`/exploration?${params}`, undefined, undefined, controller.signal)
      .then(value => { if (!controller.signal.aborted) setCatalog(value); }).catch(e => { if (!controller.signal.aborted) setCatalogError(message(e)); });
    return () => controller.abort();
  }, [datasetId, explorationVersion, revision]);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  useEffect(() => {
    const controller = new AbortController(); setSaved(null); setDraft(null); setError("");
    request<MiningPrompt>(`/knowledge/prompt?${query}`, undefined, undefined, controller.signal)
      .then(value => { if (!controller.signal.aborted) { setSaved(value); setDraft(value.configuration); } })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); });
    return () => controller.abort();
  }, [query, revision]);
  useEffect(() => {
    if (!proposal || !draft || saving || applied.current === proposal.id || proposal.datasetId !== datasetId || proposal.kind !== kind) return;
    applied.current = proposal.id; setOpen(true);
    onProposalUsed();
    if (draft.directions.some(item => item.title.trim().toLocaleLowerCase() === proposal.title.trim().toLocaleLowerCase())) {
      setError("已有同名方向，请编辑现有说明。"); return;
    }
    setDraft({ ...draft, directions: [...draft.directions, { direction_id: crypto.randomUUID(), title: proposal.title,
      instruction: proposal.instruction, enabled: true, origin: "dataset" }] });
  }, [proposal, draft, saving, datasetId, kind, onProposalUsed]);
  const dirty = !!saved && JSON.stringify(saved.configuration) !== JSON.stringify(draft);
  const invalid = !!draft && (!draft.objective.trim() || draft.directions.some(item => !item.title.trim() || !item.instruction.trim())
    || new Set(draft.directions.map(item => item.title.trim().toLocaleLowerCase())).size !== draft.directions.length);
  useEffect(() => onPending(!saved || dirty || saving || invalid || !!error), [saved, dirty, saving, invalid, error, onPending]);
  function change(index: number, patch: Partial<MiningDirection>) {
    if (draft) setDraft({ ...draft, directions: draft.directions.map((item, i) => i === index ? { ...item, ...patch } : item) });
    setError("");
  }
  async function save(reset = false) {
    if (!saved || !draft) return;
    setSaving(true); setError("");
    try {
      const result = await request<MiningPrompt>("/knowledge/prompt", { dataset_id: datasetId, kind, expected_revision: saved.revision,
        configuration: reset ? null : draft });
      if (alive.current) { setSaved(result); setDraft(result.configuration); }
    } catch (error) { if (alive.current) setError(message(error)); } finally { if (alive.current) setSaving(false); }
  }
  return <details className="iad-mining-directions" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary data-action="mining-directions">挖掘方向{draft ? ` · 已选 ${draft.directions.filter(item => item.enabled).length} 项` : ""}{dirty ? " · 未保存" : ""}</summary>
    {!saved && !error && <p role="status">正在读取挖掘方向…</p>}
    {error && <p role="alert" className="iad-error">{error} <button onClick={() => setRevision(value => value + 1)}>重新读取</button></p>}
    {draft && <fieldset disabled={saving} className="iad-directions-form">
      <label className="iad-field">挖掘目标<textarea aria-label="挖掘目标" rows={3} value={draft.objective} onChange={event => { setDraft({ ...draft, objective: event.target.value }); setError(""); }} /></label>
      {([['preset', '通用方向'], ['dataset', '数据集方向'], ['explored', '探索方向']] as const).map(([origin, label]) => <fieldset key={origin} className="iad-direction-group"><legend>{label}</legend>
        {origin === "explored" && <><label className="iad-field">探索结果版本<select aria-label="选用探索版本" value={catalog?.exploration?.version_id || ""} onChange={e => workspace.updateView("industrial-knowledge", { explorationVersion: e.target.value })}><option value="" disabled>尚无探索结果</option>{catalog?.versions.map(v => <option key={v.version_id} value={v.version_id}>{v.created_at.slice(0, 19).replace("T", " ")} · {v.direction_count} 项</option>)}</select></label>
          {catalogError && <p role="alert">{catalogError}</p>}</>}
        <div className="iad-direction-grid">
        {draft.directions.map((item, index) => item.origin !== origin ? null : <div className="iad-direction" key={item.direction_id}>
          <label className="iad-direction-toggle"><input type="checkbox" aria-label={`启用方向 ${item.title}`} checked={item.enabled} onChange={event => change(index, { enabled: event.target.checked })} />{item.title}</label>
          {origin === "explored" && <button onClick={() => {
            request<ExplorationCatalog>(`/exploration?${new URLSearchParams({ dataset_id: datasetId, direction_id: item.direction_id })}`)
              .then(value => { if (value.exploration && workspace.getSnapshot().datasetId === datasetId && workspace.getSnapshot().knowledgeKind === kind) workspace.openLocation({ pageId: "industrial-exploration", datasetId, version: value.exploration.version_id }); })
              .catch(e => setError(message(e)));
          }}>查看来源</button>}
          <details><summary aria-label={`编辑方向 ${item.title}`}>编辑</summary>
            <label className="iad-field">名称<input aria-label={`方向名称 ${item.direction_id}`} value={item.title} onChange={event => change(index, { title: event.target.value })} /></label>
            <label className="iad-field">观察说明<textarea aria-label={`方向说明 ${item.direction_id}`} rows={4} value={item.instruction} onChange={event => change(index, { instruction: event.target.value })} /></label>
            <button onClick={() => { setDraft({ ...draft, directions: draft.directions.filter((_, i) => i !== index) }); setError(""); }}>删除方向</button>
          </details>
        </div>)}
        {origin === "explored" && catalog?.exploration?.directions.filter(item => (item.applies_to === "both" || item.applies_to === kind) && !draft.directions.some(d => d.direction_id === item.direction_id)).map(item => <label className="iad-direction iad-direction-toggle" key={item.direction_id}>
          <input type="checkbox" aria-label={`启用探索方向 ${item.title}`} checked={false} onChange={() => setDraft({ ...draft, directions: [...draft.directions, { direction_id: item.direction_id, title: item.title, instruction: item.instruction, origin: "explored", enabled: true }] })} />{item.title}
          <span className="iad-muted">{item.instruction}</span></label>)}
      </div>{origin === "dataset" && !draft.directions.some(item => item.origin === origin) && <p className="iad-muted">尚无数据集专属方向。</p>}</fieldset>)}
      <details className="iad-direction-add"><summary>添加自定义方向</summary>
        <label className="iad-field">名称<input aria-label="新方向名称" value={title} onChange={event => setTitle(event.target.value)} /></label>
        <label className="iad-field">观察说明<textarea aria-label="新方向说明" rows={3} value={instruction} onChange={event => setInstruction(event.target.value)} /></label>
        <button disabled={!title.trim() || !instruction.trim()} onClick={() => {
          setDraft({ ...draft, directions: [...draft.directions, { direction_id: crypto.randomUUID(), title: title.trim(), instruction: instruction.trim(), enabled: true, origin: "dataset" }] });
          setTitle(""); setInstruction(""); setError("");
        }}>添加数据集方向</button>
      </details>
      <p className="iad-muted">模型可自主发现新方向。保存用于下一次启动的图组；未保存的修改不参与挖掘。</p>
      {invalid && <p role="alert">请填写目标、方向名称和说明，方向名称不能重复。</p>}
      <div className="iad-row"><button data-action="save-mining-directions" disabled={!dirty || invalid || saving} onClick={() => void save()}>{saving ? "保存中…" : "保存方向"}</button>
        <button disabled={!dirty || saving} onClick={() => { setDraft(saved!.configuration); setError(""); }}>放弃修改</button>
        <button disabled={saving || (!saved?.customized && !dirty)} onClick={() => void save(true)}>恢复默认方向</button></div>
      {saved && <details><summary>已保存的挖掘提示词</summary><pre className="iad-observation">{saved.instruction}</pre></details>}
    </fieldset>}
  </details>;
}
