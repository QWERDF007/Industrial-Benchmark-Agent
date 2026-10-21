import React, { useEffect, useState } from "react";
import type { Dataset, KnowledgeGroup, KnowledgeSnapshot, KnowledgeSourcePage, KnowledgeVersion } from "../../shared/contracts.js";
import { mediaUrl, message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";

export function KnowledgeSetup({ dataset, kind, versions, normalVersions, busy, onStart, onContinuous }: {
  dataset: Dataset; kind: KnowledgeSnapshot["kind"]; versions: KnowledgeVersion[]; normalVersions: KnowledgeVersion[];
  busy: boolean; onStart(input: KnowledgeGroup): void; onContinuous(): void;
}) {
  const { workspace } = useWorkspace(), pageId = "industrial-knowledge";
  const view = workspace.view(pageId);
  const [sources, setSources] = useState<KnowledgeSourcePage | null>(null), [error, setError] = useState("");
  const [selecting, setSelecting] = useState(false);
  const query = new URLSearchParams({ dataset_id: dataset.dataset_id, kind, page: String(view.miningPage), page_size: "10", search: view.miningSearch, include_observed: String(view.miningSourceMode === "all"),
    ...(view.miningSourceMode === "recheck" && view.miningPreset ? { recheck_from_version: view.miningPreset } : {}),
    ...(view.scopeRunId ? { scope_run_id: view.scopeRunId } : view.miningPreset ? { uncovered_from_version: view.miningPreset } : {}),
    ...(kind === "defect" && view.normalVersion ? { normal_version_id: view.normalVersion } : {}) }).toString();
  useEffect(() => {
    const controller = new AbortController(); setSources(null); setError("");
    request<KnowledgeSourcePage>(`/knowledge/sources?${query}`, undefined, undefined, controller.signal)
      .then(value => { if (!controller.signal.aborted) setSources(value); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); });
    return () => controller.abort();
  }, [query]);
  const count = Number(view.miningCount), valid = Number.isInteger(count) && count > 0;
  async function choose() {
    if (!valid) return;
    setSelecting(true); setError("");
    try {
      const ids: string[] = [], pageSize = Math.min(count, 200);
      for (let page = 1; ids.length < count; page++) {
        const parameters = new URLSearchParams(query); parameters.set("page", String(page)); parameters.set("page_size", String(pageSize));
        const result = await request<KnowledgeSourcePage>(`/knowledge/sources?${parameters}`);
        if (result.total < count) throw new Error(`当前筛选仅有 ${result.total} 张合格来源，请调整数量。`);
        ids.push(...result.items.map(item => item.sample_id));
        if (!result.items.length) throw new Error("来源范围已变化，请重新选择。");
      }
      const current = workspace.getSnapshot(), latest = workspace.view(pageId);
      if (current.datasetId === dataset.dataset_id && current.knowledgeKind === kind && latest.miningCount === view.miningCount
          && latest.miningSearch === view.miningSearch && latest.normalVersion === view.normalVersion
          && latest.miningPreset === view.miningPreset && latest.scopeRunId === view.scopeRunId && latest.miningSourceMode === view.miningSourceMode)
        workspace.updateView(pageId, { miningImages: ids.slice(0, count) });
    } catch (error) { setError(message(error)); } finally { setSelecting(false); }
  }
  const unavailable = !valid || (view.miningContinuous ? !!view.miningImages.length && view.miningImages.length !== count : view.miningImages.length !== count);
  return <section className="iad-job-section" aria-label="知识挖掘配置">
    <div className="iad-config-bar">
      <label className="iad-field">执行方式<select aria-label="知识执行方式" value={view.miningContinuous ? "continuous" : "group"} disabled={busy} onChange={event => workspace.updateView(pageId, { miningContinuous: event.target.value === "continuous" })}><option value="group">当前图组</option><option value="continuous">连续范围 · Agent执行</option></select></label>
      <label className="iad-field">知识预设<select aria-label="知识预设" value={view.miningPreset} disabled={busy || !!view.scopeRunId} onChange={e => workspace.updateView(pageId, { miningPreset: e.target.value, miningPage: 1, miningImages: [] })}>
        <option value="">不使用预设</option>{view.miningPreset && !versions.some(item => item.version_id === view.miningPreset) && <option value={view.miningPreset}>已选版本 · {view.miningPreset}</option>}{versions.map(version => <option key={version.version_id} value={version.version_id}>{version.version_id}</option>)}
      </select></label>
      {kind === "defect" && <label className="iad-field">良品比较基准<select aria-label="依据良品知识版本" value={view.normalVersion} disabled={busy || !!view.scopeRunId} onChange={e => workspace.updateView(pageId, { normalVersion: e.target.value, miningImages: [], miningPage: 1 })}>
        <option value="">不使用基准 · 仅整理假设</option>{view.normalVersion && !normalVersions.some(item => item.version_id === view.normalVersion) && <option value={view.normalVersion}>已选版本 · {view.normalVersion}</option>}{normalVersions.map(version => <option key={version.version_id} value={version.version_id}>{version.version_id}</option>)}
      </select></label>}
      <label className="iad-field">图像数量<input type="number" min="1" step="1" aria-label="挖掘图像数量" value={view.miningCount} disabled={busy} onChange={e => workspace.updateView(pageId, { miningCount: e.target.value }, true)} /></label>
      <button disabled={busy || selecting || !valid} onClick={() => void choose()}>{selecting ? "选择中…" : "按数量选择"}</button>
      <button data-action={view.miningContinuous ? "knowledge-agent-run" : "knowledge-group-run"} className="iad-primary" disabled={busy || selecting || !!error || unavailable} onClick={() => {
        if (view.miningContinuous) { onContinuous(); return; }
        const [first, ...rest] = view.miningImages;
        if (!first || unavailable) return;
        onStart({ image_count: count, images: [first, ...rest], knowledge_preset: [view.miningPreset, ...(kind === "defect" ? [view.normalVersion] : [])].filter(Boolean) });
      }}>{busy ? "启动中…" : view.miningContinuous ? "在Agent中连续挖掘" : `开始挖掘${kind === "normal" ? "良品" : "异常"}知识`}</button>
    </div>
    <div className="iad-row"><label className="iad-field">来源范围<select aria-label="来源范围" value={view.miningSourceMode} disabled={busy} onChange={e => workspace.updateView(pageId, { miningSourceMode: e.target.value as "uncovered" | "all" | "recheck", miningPage: 1, miningImages: [] })}><option value="uncovered">仅未观察</option><option value="all">全部合格 · 含历史来源</option><option value="recheck" disabled={!view.miningPreset}>判据待重核验</option></select></label><label className="iad-field">筛选来源<input type="search" aria-label="筛选挖掘来源" disabled={!!view.scopeRunId} value={view.miningSearch} onChange={e => workspace.updateView(pageId, { miningSearch: e.target.value, miningPage: 1 }, true)} /></label>
      <span role="status">已选 {view.miningImages.length} / {valid ? count : "—"} 张{sources ? ` · 可选 ${sources.total} 张` : ""}</span>
      <button disabled={busy || !view.miningImages.length} onClick={() => workspace.updateView(pageId, { miningImages: [] })}>清空选择</button>
    </div>
    {sources?.coverage && <p className="iad-muted">已观察 {sources.coverage.observed} · 剩余 {sources.coverage.remaining} · 待核实 {sources.coverage.pending_review} · 来源失效 {sources.coverage.stale} · 判据待重核验 {sources.coverage.recheck}</p>}
    {error && <p role="alert" className="iad-error">{error}</p>}
    {!valid && <p role="alert">请输入正整数图像数量。</p>}
    <fieldset disabled={busy || selecting} className="iad-source-picker"><legend>本次图像</legend><div className="iad-reference-grid">
      {sources?.items.map(item => <label key={item.sample_id} className="iad-source-option"><img loading="lazy" src={mediaUrl({ task_id: dataset.task_id, sample_id: item.sample_id }, "thumbnail")} alt="" />
        <span><input type="checkbox" aria-label={`选择来源 ${item.relative_path}`} checked={view.miningImages.includes(item.sample_id)} onChange={e => { setError(""); workspace.updateView(pageId, { miningImages: e.target.checked ? [...view.miningImages, item.sample_id] : view.miningImages.filter(id => id !== item.sample_id) }); }} />{item.relative_path}</span></label>)}
      {!sources && !error && <p role="status">正在读取来源…</p>}{sources && !sources.total && <p>没有匹配的合格来源。</p>}
    </div></fieldset>
    <div className="iad-row"><button disabled={view.miningPage <= 1} onClick={() => workspace.updateView(pageId, { miningPage: view.miningPage - 1 })}>上一页来源</button>
      <span>第 {view.miningPage} 页</span><button disabled={!sources || view.miningPage * 10 >= sources.total} onClick={() => workspace.updateView(pageId, { miningPage: view.miningPage + 1 })}>下一页来源</button></div>
  </section>;
}
