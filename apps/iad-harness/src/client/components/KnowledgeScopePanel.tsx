import React, { useCallback, useEffect, useState } from "react";
import type { KnowledgeScopeSnapshot } from "../../shared/domain.generated.js";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";

export function KnowledgeScopePanel({ scopeRunId, datasetId, kind, revision, onScope }: { scopeRunId: string; datasetId: string; kind: "normal" | "defect"; revision: number; onScope(scope: KnowledgeScopeSnapshot): void }) {
  const { workspace } = useWorkspace(), view = workspace.view("industrial-knowledge");
  const [scope, setScope] = useState<KnowledgeScopeSnapshot | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const update = useCallback((value: KnowledgeScopeSnapshot) => { if (value.dataset_id !== datasetId || value.kind !== kind) throw new Error("范围不属于当前数据集和知识类型"); onScope(value); setScope(value); setError(""); }, [onScope, datasetId, kind]);
  useEffect(() => {
    const controller = new AbortController(); setScope(current => current?.scope_run_id === scopeRunId ? current : null);
    request<KnowledgeScopeSnapshot>(`/knowledge/scopes/${encodeURIComponent(scopeRunId)}`, undefined, undefined, controller.signal)
      .then(value => { if (!controller.signal.aborted) update(value); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); });
    return () => controller.abort();
  }, [scopeRunId, revision, update]);
  async function change(action: "stop" | "resume") {
    setBusy(true); setError("");
    try { update(await request<KnowledgeScopeSnapshot>(`/knowledge/scopes/${encodeURIComponent(scopeRunId)}/${action}`, {})); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return <section className="iad-job-section" aria-label="连续来源范围">
    <div className="iad-row"><h2>连续范围</h2>{scope && <span data-field="knowledge-scope-state">{scope.status === "STOPPED" ? "已停止" : scope.active_run_ids.length ? "执行中" : !scope.unprocessed ? "观察完成" : "待继续"}</span>}</div>
    {error && <p role="alert" className="iad-error">{error}</p>}
    {!scope && !error && <p role="status">正在读取范围…</p>}
    {scope && <><p role="status" aria-atomic="true" aria-label="连续范围进度">已观察 {scope.observed} / {scope.total} · 剩余 {scope.remaining}{!!scope.pending_review && ` · 待人审 ${scope.pending_review}`}{!!scope.stale && ` · 来源失效 ${scope.stale}`}{!!scope.recheck && ` · 判据待重核验 ${scope.recheck}`}{!!scope.excluded && ` · 已移出支持 ${scope.excluded}`}</p>
      <div className="iad-row"><button disabled={busy} onClick={() => void change(scope.status === "STOPPED" ? "resume" : "stop")}>{scope.status === "STOPPED" ? "继续范围" : "停止范围"}</button>
        <button disabled={busy} onClick={() => workspace.updateView("industrial-knowledge", { tab:"setup", scopeRunId, scopeSessionId: view.scopeRunId === scopeRunId ? view.scopeSessionId : "", miningPreset: scope.current_version_id || "", normalVersion: scope.normal_version_id || "", miningImages: [], miningPage: 1 })}>选择此范围</button>
        {scope.current_version_id && <button onClick={() => workspace.updateView("industrial-knowledge", { version: scope.current_version_id || "", tab: "results" })}>查看范围知识</button>}
        {view.scopeSessionId && <button onClick={() => void workspace.openSession(view.scopeSessionId)}>查看会话</button>}
        {scope.status === "STOPPED" && view.scopeRunId && <button onClick={() => workspace.updateView("industrial-knowledge", { scopeRunId: "", scopeSessionId: "", miningContinuous: false, miningImages: [] })}>返回单组配置</button>}
      </div></>}
  </section>;
}
