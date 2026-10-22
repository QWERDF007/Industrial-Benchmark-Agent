import { JobTable } from "./JobTable.js";
import { KnowledgeVersions } from "./KnowledgeVersions.js";
import React, { useCallback, useState } from "react";
import type { Dataset, JobSnapshot, KnowledgeGroup, KnowledgeStartRequest } from "../../shared/contracts.js";
import { initialFilters, message, request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useWorkspace } from "../workspace.js";
import { useKnowledge } from "../useKnowledge.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";
import { KnowledgeScopePanel } from "./KnowledgeScopePanel.js";
import type { KnowledgeScopeSnapshot, KnowledgeVersion } from "../../shared/domain.generated.js";
import { KnowledgeSetup } from "./KnowledgeSetup.js";
import { KnowledgeEvidenceGallery } from "./KnowledgeEvidenceGallery.js";
import { KnowledgeState } from "./KnowledgeState.js";
import { knowledgeStatuses, type KnowledgeStatusFilter } from "../../shared/knowledge-presentation.js";
import { DeleteAction } from "./DeleteAction.js";
import { KnowledgeDiscovery } from "./KnowledgeDiscovery.js";
import { PageTabs } from "./layout/PageTabs.js";
import type { DirectionProposal } from "./KnowledgeDirections.js";

export function KnowledgePage({ dataset, kind, refreshRevision }: { dataset: Dataset; kind: "normal" | "defect"; refreshRevision: number }) {
  const { workspace } = useWorkspace();
  const pageId = "industrial-knowledge";
  const view = workspace.view(pageId);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [directionProposal, setDirectionProposal] = useState<DirectionProposal>();
  const consumeDirection = useCallback(() => setDirectionProposal(undefined), []);
  const [revision, setRevision] = useState(0);
  const current = useKnowledge(dataset.dataset_id, kind, view.version, revision + refreshRevision);
  const reference = useKnowledge(dataset.dataset_id, kind === "defect" ? "normal" : null, view.normalVersion, revision + refreshRevision);
  const { knowledge, versions } = current;
  const normal = view.normalVersion ? reference.knowledge : null, normalVersions = reference.versions;
  const loading = current.loading || reference.loading, loadError = current.error || reference.error;
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const updated = useCallback(() => setRevision(value => value + 1), []);
  const polling = useJobs("knowledge", dataset.dataset_id, updated, view.job);
  const jobs = polling.jobs.filter(job => job.kind === kind);
  const running = jobs.some(job => job.status === "RUNNING" || job.status === "PENDING");

  async function start(group: KnowledgeGroup) {
    setBusy(true); setError("");
    try {
      const input: KnowledgeStartRequest = { ...group, kind };
      const job = await request<JobSnapshot>(view.scopeRunId ? `/knowledge/scopes/${encodeURIComponent(view.scopeRunId)}/start` : "/knowledge/start", input);
      const current = workspace.getSnapshot();
      if (current.datasetId === dataset.dataset_id && current.knowledgeKind === kind) workspace.updateView(pageId, { version: "", miningImages: [], job: job.run_id, tab: "jobs" });
      polling.refresh(); updated();
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  const scoped = useCallback((scope: KnowledgeScopeSnapshot) => {
    const snapshot = workspace.getSnapshot(), current = workspace.view(pageId);
    if (snapshot.datasetId === dataset.dataset_id && snapshot.knowledgeKind === kind && current.scopeRunId === scope.scope_run_id
        && (current.miningSearch !== scope.search || current.miningPreset !== (scope.current_version_id || "") || (kind === "defect" && current.normalVersion !== (scope.normal_version_id || ""))))
      workspace.updateView(pageId, { miningSearch: scope.search, miningPreset: scope.current_version_id || "", normalVersion: scope.normal_version_id || "", miningImages: [] }, true);
  }, [workspace, dataset.dataset_id, kind]);
  async function continuous() {
    setBusy(true); setError("");
    try {
      const count = Number(view.miningCount);
      if (!Number.isInteger(count) || count <= 0) throw new Error("请输入正整数图像数量");
      const scope = view.scopeRunId ? await request<KnowledgeScopeSnapshot>(`/knowledge/scopes/${encodeURIComponent(view.scopeRunId)}`)
        : await request<KnowledgeScopeSnapshot>("/knowledge/scopes/open", { dataset_id: dataset.dataset_id, kind,
          objective: `连续挖掘当前筛选的全部${kind === "normal" ? "良品" : "异常"}来源，每次${count}张，保留冲突人工确认`,
          search: view.miningSearch, starting_version_id: view.miningPreset || null, normal_version_id: kind === "defect" ? view.normalVersion || null : null });
      const current = workspace.getSnapshot();
      if (current.datasetId !== dataset.dataset_id || current.knowledgeKind !== kind) throw new Error("数据集或知识类型已切换，请在原范围继续");
      workspace.updateView(pageId, { scopeRunId: scope.scope_run_id });
      await workspace.mineScope(scope.scope_run_id, count, view.miningImages);
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  const scopeRunId = view.scopeRunId || knowledge?.scope_run_id || "";
  const term = view.knowledgeSearch.trim().normalize("NFKC").toLocaleLowerCase();
  const checks = (knowledge?.checks || []).filter(item => (!view.knowledgeStatus || item.status === view.knowledgeStatus)
    && [item.title, item.subject, item.location, item.criterion, ...item.allowed_variations, ...item.limitations].join(" ").normalize("NFKC").toLocaleLowerCase().includes(term));
  const check = checks.find(check => check.check_id === view.checkId) || checks[0];
  function evidence(ids: string[]) {
    return knowledge && <KnowledgeEvidenceGallery versionId={knowledge.version_id} items={knowledge.evidence.filter(item => ids.includes(item.image.evidence_id))} onOpen={setLightbox} />;
  }
  return <section className="iad-knowledge-page">
    <div className="iad-section-header"><h2>{kind === "normal" ? "良品知识" : "异常知识"}</h2>{view.tab === "setup" ? <button onClick={() => workspace.updateView(pageId,{tab:"results"})}>返回知识结果</button> : <button className="iad-primary" disabled={busy || running} onClick={() => workspace.updateView(pageId,{tab:"setup"})}>新建挖掘</button>}</div>
    {view.tab !== "setup" && view.tab !== "jobs" && <section className="iad-knowledge-toolbar"><div className="iad-config-bar">
      <label className="iad-field">知识版本<select aria-label="知识版本" value={view.version} onChange={event => workspace.updateView(pageId, { version: event.target.value, checkId: "" })}><option value="">当前发布版本{versions.length ? "" : " · 尚未发布"}</option>{versions.map(version => <option key={version.version_id} value={version.version_id}>{version.version_id} · {version.source_count} 张来源 · {version.created_at}</option>)}</select></label>
      {view.version && <p className="iad-muted">正在查看固定历史版本。</p>}
      </div>
      {loading && <p role="status" className="iad-muted">正在读取知识…</p>}
      {loadError && <p role="alert" className="iad-error">{loadError} <button onClick={updated}>重新读取知识</button></p>}
      <div className="iad-row"><span className="iad-muted">{kind === "normal" ? `良品来源 · ${dataset.reference_sample_ids.length} 张` : dataset.format === "folder_classification" ? "异常候选以目录标签及核验结果为准" : "异常候选以实际标注及核验结果为准"}</span><button onClick={() => workspace.openLocation({ pageId: "industrial-images", datasetId: dataset.dataset_id, tab: kind === "normal" ? "sources" : "results", selected: "", page: 1, filters: { ...initialFilters, reference_status: kind === "normal" ? "candidate" : "all", raw_label_filters: kind === "defect" && dataset.format === "folder_classification" ? ["FAIL"] : [], annotation_filters: kind === "defect" && dataset.format !== "folder_classification" ? ["present"] : [] } })}>{kind === "normal" ? "管理来源" : "查看异常候选"}</button></div>
    </section>}
    {(error || polling.error) && <p role="alert" className="iad-error">{error || polling.error}</p>}
    {scopeRunId && <KnowledgeScopePanel datasetId={dataset.dataset_id} kind={kind} scopeRunId={scopeRunId} revision={revision + refreshRevision} onScope={scoped} />}
    {view.tab === "setup" && <KnowledgeSetup dataset={dataset} kind={kind} versions={versions} normalVersions={normalVersions} busy={busy || running} directionProposal={directionProposal} onDirectionProposalUsed={consumeDirection} onStart={group => void start(group)} onContinuous={() => void continuous()} />}
    {view.tab !== "setup" && <PageTabs label="知识视图" items={[{id:"results",label:"知识条目"},{id:"findings",label:kind === "normal" ? "待核实" : "标注核验"},{id:"versions",label:"版本"},{id:"jobs",label:"作业记录"}]} value={view.tab} onChange={tab => workspace.updateView(pageId,{tab})}>
    {view.tab !== "jobs" &&
    <section className="iad-knowledge-content iad-job-section">{knowledge ? <>
      <KnowledgeState freshness={current.freshness} />
      {knowledge.normal_version_id && <p data-field="knowledge-normal-version">此知识版本依据良品 <code>{knowledge.normal_version_id}</code></p>}
      {knowledge.kind === "defect" && !loading && normal && normal.version_id !== knowledge.normal_version_id && <p className="iad-muted">下次挖掘将使用另一良品版本，当前结果保留原依据。</p>}
      {view.tab === "results" && <button onClick={() => workspace.updateView(pageId, { tab:"setup", miningPreset: knowledge.version_id, miningSourceMode: "uncovered", miningImages: [], miningPage: 1 })}>作为预设继续选图</button>}
      {knowledge.manual_edit && <p className="iad-muted">人工维护版本</p>}
      {knowledge.summary && <p>{knowledge.summary}</p>}<p className="iad-muted"><code>{knowledge.version_id}</code> · {knowledge.sources.length} 张来源 · {knowledge.checks.length} 项判据 · {knowledge.findings.length} 项核验</p>
      {view.tab === "results" && <KnowledgeDiscovery knowledge={knowledge} evidence={evidence} onPropose={proposal => {setDirectionProposal(proposal);workspace.updateView(pageId,{tab:"setup"});}} />}
      {view.tab === "results" && <><div className="iad-row" aria-label="知识条目筛选">
        <label className="iad-field">搜索知识条目<input type="search" aria-label="搜索知识条目" value={view.knowledgeSearch} onChange={event => workspace.updateView(pageId, { knowledgeSearch: event.target.value }, true)} /></label>
        <label className="iad-field">支持状态<select aria-label="知识支持状态" value={view.knowledgeStatus} onChange={event => workspace.updateView(pageId, { knowledgeStatus: event.target.value as KnowledgeStatusFilter })}><option value="">全部状态</option>{Object.entries(knowledgeStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button disabled={!view.knowledgeSearch && !view.knowledgeStatus} onClick={() => workspace.updateView(pageId, { knowledgeSearch: "", knowledgeStatus: "" })}>清除知识筛选</button>
      </div><p role="status" aria-label="知识筛选结果">显示 {checks.length} / {knowledge.checks.length} 项判据</p><div className="iad-knowledge-split" data-detail={!!view.checkId && checks.some(item=>item.check_id===view.checkId)}><div className="iad-check-list">{checks.map(item => <button key={item.check_id} aria-pressed={check?.check_id === item.check_id} onClick={() => workspace.updateView(pageId, {checkId:item.check_id}, true)}><strong>{item.title}</strong><span>{knowledgeStatuses[item.status]} · 支持 {item.support_evidence_ids.length} / 反对 {item.counter_evidence_ids.length}</span></button>)}{!checks.length && <p>{knowledge.checks.length ? "没有匹配的判据，请调整或清除筛选。" : "尚无可发布判据，请查看限制和核验结果。"}</p>}</div>{check && <article className="iad-check-detail"><button className="iad-back-to-checks" onClick={()=>workspace.updateView(pageId,{checkId:""},true)}>返回判据列表</button><div className="iad-section-header"><h2>{check.title}</h2><DeleteAction title="删除知识条目" name={check.title}
        description="发布移除该条目的新版本，保留历史知识和已有审计依据。" disabled={current.freshness?.current_version_id !== knowledge.version_id || loading}
        restoreFocus={() => document.querySelector<HTMLElement>(".iad-knowledge-page .iad-tabs button.active")}
        onDelete={async submission_id => { const next = await request<KnowledgeVersion>(`/knowledge/versions/${encodeURIComponent(knowledge.version_id)}/checks/remove`, { submission_id, check_id: check.check_id });
          workspace.updateView(pageId, { version: "", miningPreset: view.miningPreset === knowledge.version_id ? next.version_id : view.miningPreset, miningImages: [] }); workspace.updateView(pageId, {checkId:""}, true); updated(); }} /></div><p>{check.subject} · {check.location}</p><p>{check.criterion}</p>{!!check.recheck_sample_ids.length && <p><button onClick={() => workspace.updateView(pageId, { tab:"setup", miningPreset: knowledge.version_id, miningSourceMode: "recheck", miningContinuous: false, miningImages: [], miningPage: 1 })}>重核验历史来源 · {check.recheck_sample_ids.length} 张</button></p>}<p>允许变化：{check.allowed_variations.join("；") || "未记录"}</p><h3>支持证据</h3>{evidence(check.support_evidence_ids)}{!!check.counter_evidence_ids.length && <><h3>反对证据</h3>{evidence(check.counter_evidence_ids)}</>}<p className="iad-muted">{[...check.limitations, ...check.support_limitations].join("；")}</p></article>}</div></>}
      {view.tab === "findings" && <>{knowledge.conflicts.map(conflict => <article className="iad-info-group" key={conflict.conflict_id}><h3>{conflict.resolution?.status === "resolved" ? "冲突已重核验" : "知识与图像待核实"}</h3><p>{conflict.description}</p><p>正常替代解释：{conflict.normal_explanation}</p>{evidence([...conflict.new_evidence_ids, ...conflict.comparison_evidence_ids])}<button onClick={() => workspace.openLocation({ pageId: "industrial-review", datasetId: dataset.dataset_id, tab: "conflicts", version: knowledge.version_id, conflictId: conflict.conflict_id })}>人工确认此冲突</button></article>)}{knowledge.findings.map(finding => <article className="iad-info-group" key={finding.finding_id}><h3>{finding.judgment.status === "supported" ? "图像支持异常" : finding.judgment.status === "refuted" ? "正常解释成立" : "证据不足"}</h3><p>{finding.judgment.description}</p><p>正常替代解释：{finding.judgment.normal_explanation}</p><p className="iad-muted">{finding.judgment.limitations.join("；")}</p>{evidence(finding.judgment.evidence_ids)}<button onClick={() => workspace.navigate("industrial-review", finding.sample_id)}>人工核实此图</button></article>)}{!knowledge.findings.length && <p>此版本没有待核验区域。</p>}</>}
      {!!knowledge.limitations.length && <details><summary>知识限制</summary>{knowledge.limitations.map((limitation, index) => <p key={index}>{limitation}</p>)}</details>}
      {!!knowledge.corrections.length && <details><summary>人工修订候选</summary>{knowledge.corrections.map(item => <div key={item.check_id}><p>{item.instruction}</p><p className="iad-muted">{knowledge.revisions.find(revision => revision.previous_check_id === item.check_id)?.reason}</p></div>)}</details>}
      {view.tab === "versions" && <KnowledgeVersions versions={versions} onSelect={version => workspace.updateView(pageId,{version,checkId:"",tab:"results"})} />}
    </> : <p>尚无{kind === "normal" ? "良品" : "不良品"}知识版本。</p>}</section>}
    {view.tab === "jobs" && <section className="iad-knowledge-jobs iad-job-section"><h2>挖掘作业</h2><JobTable jobs={jobs} pageId={pageId} onChanged={polling.refresh} /></section>}</PageTabs>}
    {lightbox && <ImageViewer image={lightbox} onClose={() => setLightbox(null)} />}

  </section>;
}
