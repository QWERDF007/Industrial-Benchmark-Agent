import {IconButton} from "./IconButton.js";
import {CloseIcon, DocumentSearchIcon, RefreshIcon} from "../AuditIcon.js";
import { JobTable } from "./JobTable.js";
import { KnowledgeVersions } from "./KnowledgeVersions.js";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Dataset, JobSnapshot, KnowledgeGroup, KnowledgeStartRequest } from "../../shared/contracts.js";
import { initialFilters, message, request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useWorkspace } from "../workspace.js";
import { useKnowledge } from "../useKnowledge.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";
import { KnowledgeScopePanel } from "./KnowledgeScopePanel.js";
import type { KnowledgeCheck, KnowledgeScopeSnapshot, KnowledgeVersion } from "../../shared/domain.generated.js";
import { KnowledgeSetup } from "./KnowledgeSetup.js";
import { KnowledgeEvidenceGallery } from "./KnowledgeEvidenceGallery.js";
import { KnowledgeState } from "./KnowledgeState.js";
import { knowledgeStatuses, type KnowledgeStatusFilter } from "../../shared/knowledge-presentation.js";
import { DeleteAction } from "./DeleteAction.js";
import { KnowledgeDiscovery } from "./KnowledgeDiscovery.js";
import { WorkbenchHeader } from "./layout/WorkbenchHeader.js";
import { PageTabs } from "./layout/PageTabs.js";
import type { DirectionProposal } from "./KnowledgeDirections.js";

export function KnowledgePage({ dataset, kind, refreshRevision, headerActions }: { dataset: Dataset; kind: "normal" | "defect"; refreshRevision: number; headerActions: React.ReactNode }) {
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
  const [entryPage, setEntryPage] = useState(1);
  const [detailCheck, setDetailCheck] = useState<KnowledgeCheck | null>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const [reviewStatus, setReviewStatus] = useState("pending");
  const [reviewNote, setReviewNote] = useState("");

  const openDetail = (item: KnowledgeCheck, triggerEl?: HTMLElement | null) => {
    if (triggerEl) detailTriggerRef.current = triggerEl;
    setDetailCheck(item);
    setReviewStatus("pending");
    setReviewNote("");
  };

  const closeDetail = () => {
    setDetailCheck(null);
    detailTriggerRef.current?.focus();
  };

  useEffect(() => {
    if (!detailCheck) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDetail();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [detailCheck]);

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
  const pageSize = 8;
  const maxEntryPages = Math.max(1, Math.ceil(checks.length / pageSize));
  const currentEntryPage = Math.min(maxEntryPages, Math.max(1, entryPage));
  const pagedChecks = checks.slice((currentEntryPage - 1) * pageSize, currentEntryPage * pageSize);
  function evidence(ids: string[]) {
    return knowledge && <KnowledgeEvidenceGallery versionId={knowledge.version_id} items={knowledge.evidence.filter(item => ids.includes(item.image.evidence_id))} onOpen={setLightbox} />;
  }
  return <section className="iad-knowledge-page">
    <WorkbenchHeader pageId={pageId} title={view.tab === "setup" ? "新建知识挖掘" : undefined}>{headerActions}{view.tab === "setup" ? <button onClick={() => workspace.updateView(pageId,{tab:"results"})}>返回知识结果</button> : <button className="iad-primary" disabled={busy || running} onClick={() => workspace.updateView(pageId,{tab:"setup"})}>新建挖掘</button>}</WorkbenchHeader>
    <section className="iad-knowledge-context">
      <div className="iad-type-switch" role="group" aria-label="知识类型">{([["normal", "良品"], ["defect", "异常"]] as const).map(([value, label]) => <button key={value} aria-pressed={kind === value} onClick={() => workspace.selectKnowledgeKind(value)}>{label}</button>)}</div>
      {view.tab !== "setup" && view.tab !== "jobs" && <>
      <label className="iad-field"><span className="iad-visually-hidden">知识版本</span><select aria-label="知识版本" value={view.version} onChange={event => workspace.updateView(pageId, { version: event.target.value, checkId: "" })}><option value="">当前发布版本{versions.length ? "" : " · 尚未发布"}</option>{versions.map(version => <option key={version.version_id} value={version.version_id}>{version.version_id} · {version.source_count} 张来源 · {version.created_at}</option>)}</select></label>
      {view.version && <p className="iad-muted">正在查看固定历史版本。</p>}
      {loading && <p role="status" className="iad-muted">正在读取知识…</p>}
      {loadError && <p role="alert" className="iad-error">{loadError} <IconButton label="重新读取知识" onClick={updated}><RefreshIcon /></IconButton></p>}
      <div className="iad-row"><span className="iad-muted">{kind === "normal" ? `良品来源 · ${dataset.reference_sample_ids.length} 张` : dataset.format === "folder_classification" ? "异常候选以目录标签及核验结果为准" : "异常候选以实际标注及核验结果为准"}</span><button onClick={() => workspace.openLocation({ pageId: "industrial-images", datasetId: dataset.dataset_id, tab: kind === "normal" ? "sources" : "results", selected: "", page: 1, filters: { ...initialFilters, reference_status: kind === "normal" ? "candidate" : "all", raw_label_filters: kind === "defect" && dataset.format === "folder_classification" ? ["FAIL"] : [], annotation_filters: kind === "defect" && dataset.format !== "folder_classification" ? ["present"] : [] } })}>{kind === "normal" ? "管理来源" : "查看异常候选"}</button></div>
    </>}</section>
    {(error || polling.error) && <p role="alert" className="iad-error">{error || polling.error}</p>}
    {scopeRunId && <KnowledgeScopePanel datasetId={dataset.dataset_id} kind={kind} scopeRunId={scopeRunId} revision={revision + refreshRevision} onScope={scoped} />}
    {view.tab === "setup" && <KnowledgeSetup dataset={dataset} kind={kind} versions={versions} normalVersions={normalVersions} busy={busy || running} directionProposal={directionProposal} onDirectionProposalUsed={consumeDirection} onStart={group => void start(group)} onContinuous={() => void continuous()} />}
    {view.tab !== "setup" && <PageTabs label="知识视图" items={[{id:"results",label:"知识条目"},{id:"findings",label:kind === "normal" ? "待核实" : "标注核验"},{id:"versions",label:"版本"},{id:"jobs",label:"作业记录"}]} value={view.tab} onChange={tab => workspace.updateView(pageId,{tab})}>
    {view.tab !== "jobs" &&
    <section className="iad-knowledge-content">{knowledge ? <>
      <KnowledgeState freshness={current.freshness} />
      {knowledge.normal_version_id && <p data-field="knowledge-normal-version">此知识版本依据良品 <code>{knowledge.normal_version_id}</code></p>}
      {knowledge.kind === "defect" && !loading && normal && normal.version_id !== knowledge.normal_version_id && <p className="iad-muted">下次挖掘将使用另一良品版本，当前结果保留原依据。</p>}
      {knowledge.manual_edit && <p className="iad-muted">人工维护版本</p>}
      {knowledge.summary && <p>{knowledge.summary}</p>}<details className="iad-knowledge-overview"><summary>版本信息</summary><p className="iad-muted"><code>{knowledge.version_id}</code> · {knowledge.sources.length} 张来源 · {knowledge.checks.length} 项判据 · {knowledge.findings.length} 项核验</p></details>
      {view.tab === "results" && <KnowledgeDiscovery knowledge={knowledge} evidence={evidence} onPropose={proposal => {setDirectionProposal(proposal);workspace.updateView(pageId,{tab:"setup"});}} />}
      {view.tab === "results" && (
        <div id="knowledge-body">
          <div className="iad-row" aria-label="知识条目筛选" style={{ marginBottom: 12 }}>
            <label className="iad-field">
              搜索知识条目
              <input
                id="knowledge-search"
                type="search"
                aria-label="搜索知识条目"
                value={view.knowledgeSearch}
                onChange={event => {
                  workspace.updateView(pageId, { knowledgeSearch: event.target.value }, true);
                  setEntryPage(1);
                }}
              />
            </label>
            <label className="iad-field">
              支持状态
              <select
                id="knowledge-status"
                aria-label="知识支持状态"
                value={view.knowledgeStatus}
                onChange={event => {
                  workspace.updateView(pageId, { knowledgeStatus: event.target.value as KnowledgeStatusFilter });
                  setEntryPage(1);
                }}
              >
                <option value="">全部状态</option>
                {Object.entries(knowledgeStatuses).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <button
              disabled={!view.knowledgeSearch && !view.knowledgeStatus}
              onClick={() => {
                workspace.updateView(pageId, { knowledgeSearch: "", knowledgeStatus: "" });
                setEntryPage(1);
              }}
            >
              清除知识筛选
            </button>
          </div>
          <div className="knowledge-list">
            <div className="knowledge-head">
              <span>知识条目</span>
              <span>证据判断</span>
              <span>支持</span>
              <span>反对</span>
              <span>人工核实</span>
              <span>操作</span>
            </div>
            <div className="knowledge-items">
              {pagedChecks.map((item) => (
                <div
                  key={item.check_id}
                  className="knowledge-row"
                  data-detail-entry={item.check_id}
                  role="row"
                  tabIndex={0}
                  aria-label={`查看知识条目：${item.title}`}
                  onClick={(e) => openDetail(item, e.currentTarget)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDetail(item, e.currentTarget);
                    }
                  }}
                >
                  <span>
                    <strong className="row-title">{item.title}</strong>
                    <span className="row-desc" title={item.criterion}>
                      {item.criterion}
                    </span>
                  </span>
                  <span className="col-evidence">
                    <span className={`status ${item.status === "supported" ? "green" : item.status === "conflicted" ? "red" : "amber"}`}>
                      {knowledgeStatuses[item.status]}
                    </span>
                  </span>
                  <span className="row-count col-support">
                    {item.support_evidence_ids.length} 张
                  </span>
                  <span className="row-count col-counter">
                    {item.counter_evidence_ids.length} 张
                  </span>
                  <span className="col-review">
                    <span className="status green">待核实</span>
                  </span>
                  <span className="col-action">
                    <button
                      type="button"
                      className="knowledge-view-action"
                      data-view-entry={item.check_id}
                      aria-label={`查看知识条目 ${item.title}`}
                      title="查看知识条目"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(item, e.currentTarget);
                      }}
                    >
                      <DocumentSearchIcon />
                      <span>查看</span>
                    </button>
                  </span>
                </div>
              ))}
              {!checks.length && (
                <div className="iad-empty-text" style={{ padding: 24, textAlign: "center", color: "var(--iad-muted)" }}>
                  {knowledge.checks.length ? "没有匹配的知识条目，请调整筛选条件。" : "尚无可发布知识条目。"}
                </div>
              )}
            </div>
            <div className="knowledge-pager">
              <div className="pages">
                <button
                  type="button"
                  className="pagebtn"
                  disabled={currentEntryPage <= 1}
                  onClick={() => setEntryPage(Math.max(1, currentEntryPage - 1))}
                >
                  上一页
                </button>
                {Array.from({ length: maxEntryPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="pagebtn"
                    data-entry-set={p}
                    aria-current={p === currentEntryPage ? "page" : undefined}
                    onClick={() => setEntryPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="pagebtn"
                  disabled={currentEntryPage >= maxEntryPages}
                  onClick={() => setEntryPage(Math.min(maxEntryPages, currentEntryPage + 1))}
                >
                  下一页
                </button>
              </div>
              <span className="page-total">
                第 {currentEntryPage} / {maxEntryPages} 页，共 {checks.length} 条
              </span>
            </div>
          </div>
        </div>
      )}
      {view.tab === "findings" && <>{knowledge.conflicts.map(conflict => <article className="iad-info-group" key={conflict.conflict_id}><h3>{conflict.resolution?.status === "resolved" ? "冲突已重核验" : "知识与图像待核实"}</h3><p>{conflict.description}</p><p>正常替代解释：{conflict.normal_explanation}</p>{evidence([...conflict.new_evidence_ids, ...conflict.comparison_evidence_ids])}<button onClick={() => workspace.openLocation({ pageId: "industrial-review", datasetId: dataset.dataset_id, tab: "conflicts", version: knowledge.version_id, conflictId: conflict.conflict_id })}>人工确认此冲突</button></article>)}{knowledge.findings.map(finding => <article className="iad-info-group" key={finding.finding_id}><h3>{finding.judgment.status === "supported" ? "图像支持异常" : finding.judgment.status === "refuted" ? "正常解释成立" : "证据不足"}</h3><p>{finding.judgment.description}</p><p>正常替代解释：{finding.judgment.normal_explanation}</p><p className="iad-muted">{finding.judgment.limitations.join("；")}</p>{evidence(finding.judgment.evidence_ids)}<button onClick={() => workspace.navigate("industrial-review", finding.sample_id)}>人工核实此图</button></article>)}{!knowledge.findings.length && <p>此版本没有待核验区域。</p>}</>}
      {!!knowledge.limitations.length && <details><summary>知识限制</summary>{knowledge.limitations.map((limitation, index) => <p key={index}>{limitation}</p>)}</details>}
      {!!knowledge.corrections.length && <details><summary>人工修订候选</summary>{knowledge.corrections.map(item => <div key={item.check_id}><p>{item.instruction}</p><p className="iad-muted">{knowledge.revisions.find(revision => revision.previous_check_id === item.check_id)?.reason}</p></div>)}</details>}
      {view.tab === "results" && <button onClick={() => workspace.updateView(pageId, { tab:"setup", miningPreset: knowledge.version_id, miningSourceMode: "uncovered", miningImages: [], miningPage: 1 })}>作为预设继续选图</button>}
      {view.tab === "versions" && <KnowledgeVersions versions={versions} onSelect={version => workspace.updateView(pageId,{version,checkId:"",tab:"results"})} />}
    </> : <p>尚无{kind === "normal" ? "良品" : "不良品"}知识版本。</p>}</section>}
    {view.tab === "jobs" && <section className="iad-knowledge-jobs iad-job-section"><h2>挖掘作业</h2><JobTable key={dataset.dataset_id+kind} jobs={jobs} pageId={pageId} onChanged={polling.refresh} stale={polling.syncState === "stale"} lastSyncedAt={polling.lastSyncedAt} /></section>}</PageTabs>}
    {lightbox && <ImageViewer image={lightbox} onClose={() => setLightbox(null)} />}
    {typeof document !== "undefined" && detailCheck && createPortal(
      <div
        className="overlay detail-overlay"
        id="detail-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-detail-title"
        onClick={closeDetail}
      >
        <section
          className="modal detail-modal iad-detail-dialog"
          id="entry-dialog"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="modalheader iad-dialog-header">
            <div>
              <h2 id="kb-detail-title">{detailCheck.title}</h2>
            </div>
            <button
              type="button"
              className="iconbtn modal-x"
              id="close-detail"
              aria-label="关闭知识详情"
              title="关闭知识详情"
              onClick={closeDetail}
            >
              <CloseIcon />
            </button>
          </header>
          <div className="modalcontent detail-scroll" id="detail-content">
            <section className="detail-section">
              <h3>知识结论</h3>
              <p>{detailCheck.subject} · {detailCheck.location} · {knowledgeStatuses[detailCheck.status]}</p>
            </section>
            <section className="detail-section">
              <h3>判定依据</h3>
              <p>{detailCheck.criterion}</p>
            </section>
            <section className="detail-section">
              <h3>允许变化</h3>
              <p>{detailCheck.allowed_variations.join("；") || "未记录"}</p>
            </section>
            <section className="detail-section">
              <h3>支持证据，{detailCheck.support_evidence_ids.length} 张</h3>
              {evidence(detailCheck.support_evidence_ids)}
            </section>
            <section className="detail-section">
              <h3>反对证据，{detailCheck.counter_evidence_ids.length} 张</h3>
              {evidence(detailCheck.counter_evidence_ids)}
            </section>
            <section className="detail-section">
              <h3>适用限制</h3>
              <p className="iad-muted">
                {[...detailCheck.limitations, ...detailCheck.support_limitations].join("；") || "未记录额外限制"}
              </p>
            </section>
            <section className="detail-section detail-review">
              <h3>人工核实</h3>
              <div className="knowledge-review-options" role="radiogroup" aria-label="人工核实结论">
                <label>
                  <input
                    type="radio"
                    name="knowledge-review"
                    value="pending"
                    checked={reviewStatus === "pending"}
                    onChange={() => setReviewStatus("pending")}
                  />
                  待核实
                </label>
                <label>
                  <input
                    type="radio"
                    name="knowledge-review"
                    value="confirmed"
                    checked={reviewStatus === "confirmed"}
                    onChange={() => setReviewStatus("confirmed")}
                  />
                  核实通过
                </label>
                <label>
                  <input
                    type="radio"
                    name="knowledge-review"
                    value="rejected"
                    checked={reviewStatus === "rejected"}
                    onChange={() => setReviewStatus("rejected")}
                  />
                  驳回
                </label>
              </div>
              <label className="label" htmlFor="review-note">复核备注</label>
              <textarea
                className="f textarea"
                id="review-note"
                placeholder="填写复核依据（可选）"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
            </section>
          </div>
          <footer className="modalfooter">
            <span />
            <div className="actions">
              <button type="button" className="btn cancel" id="cancel-review" onClick={closeDetail}>
                取消
              </button>
              <button type="button" className="btn primary" id="save-review" onClick={closeDetail}>
                保存
              </button>
            </div>
          </footer>
        </section>
      </div>,
      document.body
    )}

  </section>;
}
