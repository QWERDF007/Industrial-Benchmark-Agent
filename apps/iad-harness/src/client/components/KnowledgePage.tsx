import { JobCard } from "./JobCard.js";
import React, { useCallback, useState } from "react";
import type { Dataset, JobSnapshot, KnowledgeCheck, KnowledgeCorrection, KnowledgeStartRequest } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useWorkspace } from "../workspace.js";
import { useKnowledge } from "../useKnowledge.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";
import { KnowledgeRevision } from "./KnowledgeRevision.js";
import { KnowledgeState } from "./KnowledgeState.js";
import { knowledgeStatuses, type KnowledgeStatusFilter } from "../../shared/knowledge-presentation.js";

export function KnowledgePage({ dataset, kind, refreshRevision }: { dataset: Dataset; kind: "normal" | "defect"; refreshRevision: number }) {
  const { workspace } = useWorkspace();
  const pageId = kind === "normal" ? "industrial-normal" : "industrial-defect";
  const view = workspace.view(pageId);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const current = useKnowledge(dataset.dataset_id, kind, view.version, revision + refreshRevision);
  const reference = useKnowledge(dataset.dataset_id, kind === "defect" ? "normal" : null, view.normalVersion, revision + refreshRevision);
  const { knowledge, versions } = current;
  const normal = reference.knowledge, normalVersions = reference.versions;
  const loading = current.loading || reference.loading, loadError = current.error || reference.error;
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const [model, setModel] = useState("");
  const updated = useCallback(() => setRevision(value => value + 1), []);
  const polling = useJobs("knowledge", dataset.dataset_id, updated, view.job);
  const jobs = polling.jobs.filter(job => job.kind === kind);
  const running = jobs.some(job => job.status === "RUNNING" || job.status === "PENDING");
  const [checkId, setCheckId] = useState("");
  const [editing, setEditing] = useState<{ versionId: string; check: KnowledgeCheck } | null>(null);
  async function start(correction?: { base_version_id: string; corrections: KnowledgeCorrection[] }) {
    setBusy(true); setError("");
    try {
      const input: KnowledgeStartRequest = { dataset_id: dataset.dataset_id, kind, ...(kind === "defect" ? { normal_version_id: normal?.version_id } : {}), ...(model.trim() ? { model_name: model.trim() } : {}), ...correction };
      await request<JobSnapshot>("/knowledge/start", input);
      setEditing(null);
      workspace.updateView(pageId, { version: "" }); polling.refresh(); updated();
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  const term = view.knowledgeSearch.trim().normalize("NFKC").toLocaleLowerCase();
  const checks = (knowledge?.checks || []).filter(item => (!view.knowledgeStatus || item.status === view.knowledgeStatus)
    && [item.title, item.subject, item.location, item.criterion, ...item.allowed_variations, ...item.limitations].join(" ").normalize("NFKC").toLocaleLowerCase().includes(term));
  const check = checks.find(check => check.check_id === checkId) || checks[0];
  function evidence(ids: string[]) {
    return <div className="iad-knowledge-evidence iad-reference-grid">{knowledge?.evidence.filter(item => ids.includes(item.image.evidence_id)).map(item => {
      const image = item.image;
      const src = `/api/iad/knowledge/evidence/${encodeURIComponent(knowledge.version_id)}/${encodeURIComponent(image.evidence_id)}`;
      return <button key={image.evidence_id} title={`查看 ${image.role} · ${image.representation}`} onClick={() => setLightbox({ src, title: `${image.role} · ${image.representation} · ${image.crop_bbox.join(", ")}`, width: image.sent_size[0], height: image.sent_size[1] })}><img src={src} alt={`${image.role} ${image.representation}`} /><small>{image.role} · {image.representation}</small></button>;
    })}</div>;
  }
  return <section className="iad-knowledge-page">
    <section className="iad-job-section"><div className="iad-row"><strong>全部合格{kind === "normal" ? "良品" : "异常"}候选</strong><label className="iad-field">模型<input aria-label="知识挖掘模型" placeholder="使用项目配置" value={model} onChange={event => setModel(event.target.value)} /></label>
      <button className="iad-primary" disabled={busy || loading || !!loadError || running || (kind === "normal" ? !dataset.reference_sample_ids.length : !normal?.checks.some(check => check.status === "supported") || (!!view.normalVersion && normal.version_id !== view.normalVersion))} onClick={() => void start()}>{busy ? "启动中…" : `开始挖掘${kind === "normal" ? "良品" : "不良品"}知识`}</button></div>
      <label className="iad-field">知识版本<select aria-label="知识版本" value={view.version} onChange={event => workspace.updateView(pageId, { version: event.target.value })}><option value="">当前发布版本{versions.length ? "" : " · 尚未发布"}</option>{versions.map(version => <option key={version.version_id} value={version.version_id}>{version.version_id} · {version.source_count} 张来源 · {version.created_at}</option>)}</select></label>
      {view.version && <p className="iad-muted">正在查看固定版本；新作业从当前已发布版本继续核验。</p>}
      {kind === "defect" && <>
        <label className="iad-field">下次挖掘依据的良品版本<select aria-label="依据良品知识版本" value={view.normalVersion || ""} onChange={event => workspace.updateView(pageId, { normalVersion: event.target.value })} disabled={busy || running}>
          <option value="">当前发布版本</option>{normalVersions.map(version => <option key={version.version_id} value={version.version_id}>{version.version_id} · {version.created_at}</option>)}
        </select></label>
        {!loading && !normal?.checks.some(check => check.status === "supported") && <p>所选版本没有可用的良品判据。<button onClick={() => workspace.navigate("industrial-normal")}>前往良品知识</button></p>}
      </>}
      {loading && <p role="status" className="iad-muted">正在读取知识…</p>}
      {loadError && <p role="alert" className="iad-error">{loadError} <button onClick={updated}>重新读取知识</button></p>}
      {(error || polling.error) && <p role="alert" className="iad-error">{error || polling.error}</p>}
      <p className="iad-muted">参考资格与初始无标注约定在数据集管理维护。</p><button onClick={() => workspace.navigate("industrial-datasets")}>维护候选来源</button>
    </section>
    <nav className="iad-tabs" aria-label="知识视图">{[["results", "知识条目"], ["findings", kind === "normal" ? "待核实" : "标注核验"], ["versions", "版本"], ["jobs", "作业记录"]].map(([tab, title]) => <button key={tab} className={view.tab === tab ? "active" : ""} aria-pressed={view.tab === tab} onClick={() => workspace.updateView(pageId, { tab })}>{title}</button>)}</nav>
    <section className="iad-knowledge-content iad-job-section">{knowledge ? <>
      <KnowledgeState freshness={current.freshness} />
      {knowledge.normal_version_id && <p data-field="knowledge-normal-version">此知识版本依据良品 <code>{knowledge.normal_version_id}</code></p>}
      {knowledge.kind === "defect" && !loading && normal && normal.version_id !== knowledge.normal_version_id && <p className="iad-muted">下次挖掘将使用另一良品版本，当前结果保留原依据。</p>}
      <p>{knowledge.summary}</p><p className="iad-muted"><code>{knowledge.version_id}</code> · {knowledge.sources.length} 张来源 · {knowledge.checks.length} 项判据 · {knowledge.findings.length} 项核验</p>
      {view.tab === "results" && <><div className="iad-row" aria-label="知识条目筛选">
        <label className="iad-field">搜索知识条目<input type="search" aria-label="搜索知识条目" value={view.knowledgeSearch} onChange={event => workspace.updateView(pageId, { knowledgeSearch: event.target.value }, true)} /></label>
        <label className="iad-field">支持状态<select aria-label="知识支持状态" value={view.knowledgeStatus} onChange={event => workspace.updateView(pageId, { knowledgeStatus: event.target.value as KnowledgeStatusFilter })}><option value="">全部状态</option>{Object.entries(knowledgeStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button disabled={!view.knowledgeSearch && !view.knowledgeStatus} onClick={() => workspace.updateView(pageId, { knowledgeSearch: "", knowledgeStatus: "" })}>清除知识筛选</button>
      </div><p role="status" aria-label="知识筛选结果">显示 {checks.length} / {knowledge.checks.length} 项判据</p><div className="iad-knowledge-split"><div className="iad-check-list">{checks.map(item => <button key={item.check_id} aria-pressed={check?.check_id === item.check_id} onClick={() => setCheckId(item.check_id)}><strong>{item.title}</strong><span>{knowledgeStatuses[item.status]} · 支持 {item.support_evidence_ids.length} / 反对 {item.counter_evidence_ids.length}</span></button>)}{!checks.length && <p>{knowledge.checks.length ? "没有匹配的判据，请调整或清除筛选。" : "尚无可发布判据，请查看限制和核验结果。"}</p>}</div>{check && <article className="iad-info-group"><h2>{check.title}</h2><p>{check.subject} · {check.location}</p><p>{check.criterion}</p>{!view.version && <button disabled={busy || loading || !!loadError || running} onClick={() => { setError(""); setEditing({ versionId: knowledge.version_id, check }); }}>修订判据</button>}<p>允许变化：{check.allowed_variations.join("；") || "未记录"}</p><h3>支持证据</h3>{evidence(check.support_evidence_ids)}{!!check.counter_evidence_ids.length && <><h3>反对证据</h3>{evidence(check.counter_evidence_ids)}</>}<p className="iad-muted">{check.limitations.join("；")}</p></article>}</div></>}
      {view.tab === "findings" && <>{knowledge.findings.map(finding => <article className="iad-info-group" key={finding.finding_id}><h3>{finding.judgment.status === "supported" ? "图像支持异常" : finding.judgment.status === "refuted" ? "正常解释成立" : "证据不足"}</h3><p>{finding.judgment.description}</p><p>正常替代解释：{finding.judgment.normal_explanation}</p><p className="iad-muted">{finding.judgment.limitations.join("；")}</p>{evidence(finding.judgment.evidence_ids)}<button onClick={() => workspace.navigate("industrial-review", finding.sample_id)}>人工核实此图</button></article>)}{!knowledge.findings.length && <p>此版本没有待核验区域。</p>}</>}
      {!!knowledge.limitations.length && <details><summary>知识限制</summary>{knowledge.limitations.map((limitation, index) => <p key={index}>{limitation}</p>)}</details>}
      {!!knowledge.corrections.length && <details><summary>人工修订候选</summary>{knowledge.corrections.map(item => <div key={item.check_id}><p>{item.instruction}</p><p className="iad-muted">{knowledge.revisions.find(revision => revision.previous_check_id === item.check_id)?.reason}</p></div>)}</details>}
      {view.tab === "versions" && versions.map(version => <article className="iad-info-group" key={version.version_id}><button onClick={() => workspace.updateView(pageId, { version: version.version_id, tab: "results" })}>{version.version_id}</button><p>{version.source_count} 张来源 · {version.check_count} 项判据 · {version.created_at}</p>{version.parent_version_id && <p className="iad-muted">父版本 {version.parent_version_id}</p>}{version.normal_version_id && <p className="iad-muted">依据良品版本 {version.normal_version_id}</p>}</article>)}
    </> : <p>尚无{kind === "normal" ? "良品" : "不良品"}知识版本。</p>}</section>
    <section className="iad-knowledge-jobs iad-job-section"><h2>挖掘作业</h2>{jobs.map(job => <JobCard key={job.run_id} job={job} onChanged={polling.refresh} />)}{!jobs.length && <p>尚无挖掘作业。</p>}</section>
    {lightbox && <ImageViewer image={lightbox} onClose={() => setLightbox(null)} />}
    {editing && <KnowledgeRevision versionId={editing.versionId} check={editing.check} busy={busy} error={error} onClose={() => { setEditing(null); setError(""); }} onSubmit={instruction => void start({ base_version_id: editing.versionId, corrections: [{ check_id: editing.check.check_id, instruction }] })} />}
  </section>;
}
