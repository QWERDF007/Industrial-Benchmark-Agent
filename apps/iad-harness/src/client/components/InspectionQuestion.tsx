import React, { useState } from "react";
import { message } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { resolveInspection, type InspectionContext, type InspectionSelection, type InspectionTransform } from "../inspection.js";

export function InspectionQuestion({ inspection, selection, transform }: {
  inspection: InspectionContext; selection: InspectionSelection | null; transform(): InspectionTransform;
}) {
  const { workspace } = useWorkspace();
  const [expanded, setExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function send(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const { finding, evidence } = resolveInspection(inspection.analysis, selection);
    try {
      await workspace.ask({ ...inspection.reference, finding_id: finding?.finding_id || null,
        evidence_id: evidence?.evidence_id || null }, selection, transform(), question.trim());
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return expanded ? <form className="iad-inspection-question" onSubmit={send} aria-label="向 Agent 追问">
    <label className="iad-field">追问内容<textarea aria-label="追问内容" rows={3} value={question} disabled={busy} onChange={event => setQuestion(event.target.value)} /></label>
    <p className="iad-muted">携带当前疑点、冻结知识与实际图像引用。</p>
    {error && <p role="alert" className="iad-error">{error}</p>}
    <div className="iad-actions"><button type="submit" className="iad-primary" disabled={busy}>{busy ? "正在提交…" : "发送到会话"}</button><button type="button" disabled={busy} onClick={() => setExpanded(false)}>取消</button></div>
  </form> : <button onClick={() => setExpanded(true)}>向 Agent 追问</button>;
}
