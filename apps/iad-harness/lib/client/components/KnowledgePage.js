import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconButton } from "./IconButton.js";
import { CloseIcon, DocumentSearchIcon, RefreshIcon } from "../AuditIcon.js";
import { JobTable } from "./JobTable.js";
import { KnowledgeVersions } from "./KnowledgeVersions.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { initialFilters, message, request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useWorkspace } from "../workspace.js";
import { useKnowledge } from "../useKnowledge.js";
import { ImageViewer } from "./ImageViewer.js";
import { KnowledgeScopePanel } from "./KnowledgeScopePanel.js";
import { KnowledgeSetup } from "./KnowledgeSetup.js";
import { KnowledgeEvidenceGallery } from "./KnowledgeEvidenceGallery.js";
import { KnowledgeState } from "./KnowledgeState.js";
import { knowledgeStatuses } from "../../shared/knowledge-presentation.js";
import { KnowledgeDiscovery } from "./KnowledgeDiscovery.js";
import { WorkbenchHeader } from "./layout/WorkbenchHeader.js";
import { PageTabs } from "./layout/PageTabs.js";
export function KnowledgePage({ dataset, kind, refreshRevision, headerActions }) {
    const { workspace } = useWorkspace();
    const pageId = "industrial-knowledge";
    const view = workspace.view(pageId);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [directionProposal, setDirectionProposal] = useState();
    const consumeDirection = useCallback(() => setDirectionProposal(undefined), []);
    const [revision, setRevision] = useState(0);
    const current = useKnowledge(dataset.dataset_id, kind, view.version, revision + refreshRevision);
    const reference = useKnowledge(dataset.dataset_id, kind === "defect" ? "normal" : null, view.normalVersion, revision + refreshRevision);
    const { knowledge, versions } = current;
    const normal = view.normalVersion ? reference.knowledge : null, normalVersions = reference.versions;
    const loading = current.loading || reference.loading, loadError = current.error || reference.error;
    const [lightbox, setLightbox] = useState(null);
    const updated = useCallback(() => setRevision(value => value + 1), []);
    const polling = useJobs("knowledge", dataset.dataset_id, updated, view.job);
    const jobs = polling.jobs.filter(job => job.kind === kind);
    const running = jobs.some(job => job.status === "RUNNING" || job.status === "PENDING");
    const [entryPage, setEntryPage] = useState(1);
    const [detailCheck, setDetailCheck] = useState(null);
    const detailTriggerRef = useRef(null);
    const [reviewStatus, setReviewStatus] = useState("pending");
    const [reviewNote, setReviewNote] = useState("");
    const openDetail = (item, triggerEl) => {
        if (triggerEl)
            detailTriggerRef.current = triggerEl;
        setDetailCheck(item);
        setReviewStatus("pending");
        setReviewNote("");
    };
    const closeDetail = () => {
        setDetailCheck(null);
        detailTriggerRef.current?.focus();
    };
    useEffect(() => {
        if (!detailCheck)
            return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKeyDown = (e) => {
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
    async function start(group) {
        setBusy(true);
        setError("");
        try {
            const input = { ...group, kind };
            const job = await request(view.scopeRunId ? `/knowledge/scopes/${encodeURIComponent(view.scopeRunId)}/start` : "/knowledge/start", input);
            const current = workspace.getSnapshot();
            if (current.datasetId === dataset.dataset_id && current.knowledgeKind === kind)
                workspace.updateView(pageId, { version: "", miningImages: [], job: job.run_id, tab: "jobs" });
            polling.refresh();
            updated();
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    const scoped = useCallback((scope) => {
        const snapshot = workspace.getSnapshot(), current = workspace.view(pageId);
        if (snapshot.datasetId === dataset.dataset_id && snapshot.knowledgeKind === kind && current.scopeRunId === scope.scope_run_id
            && (current.miningSearch !== scope.search || current.miningPreset !== (scope.current_version_id || "") || (kind === "defect" && current.normalVersion !== (scope.normal_version_id || ""))))
            workspace.updateView(pageId, { miningSearch: scope.search, miningPreset: scope.current_version_id || "", normalVersion: scope.normal_version_id || "", miningImages: [] }, true);
    }, [workspace, dataset.dataset_id, kind]);
    async function continuous() {
        setBusy(true);
        setError("");
        try {
            const count = Number(view.miningCount);
            if (!Number.isInteger(count) || count <= 0)
                throw new Error("请输入正整数图像数量");
            const scope = view.scopeRunId ? await request(`/knowledge/scopes/${encodeURIComponent(view.scopeRunId)}`)
                : await request("/knowledge/scopes/open", { dataset_id: dataset.dataset_id, kind,
                    objective: `连续挖掘当前筛选的全部${kind === "normal" ? "良品" : "异常"}来源，每次${count}张，保留冲突人工确认`,
                    search: view.miningSearch, starting_version_id: view.miningPreset || null, normal_version_id: kind === "defect" ? view.normalVersion || null : null });
            const current = workspace.getSnapshot();
            if (current.datasetId !== dataset.dataset_id || current.knowledgeKind !== kind)
                throw new Error("数据集或知识类型已切换，请在原范围继续");
            workspace.updateView(pageId, { scopeRunId: scope.scope_run_id });
            await workspace.mineScope(scope.scope_run_id, count, view.miningImages);
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
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
    function evidence(ids) {
        return knowledge && _jsx(KnowledgeEvidenceGallery, { versionId: knowledge.version_id, items: knowledge.evidence.filter(item => ids.includes(item.image.evidence_id)), onOpen: setLightbox });
    }
    return _jsxs("section", { className: "iad-knowledge-page", children: [_jsxs(WorkbenchHeader, { pageId: pageId, title: view.tab === "setup" ? "新建知识挖掘" : undefined, children: [headerActions, view.tab === "setup" ? _jsx("button", { onClick: () => workspace.updateView(pageId, { tab: "results" }), children: "\u8FD4\u56DE\u77E5\u8BC6\u7ED3\u679C" }) : _jsx("button", { className: "iad-primary", disabled: busy || running, onClick: () => workspace.updateView(pageId, { tab: "setup" }), children: "\u65B0\u5EFA\u6316\u6398" })] }), _jsxs("section", { className: "iad-knowledge-context", children: [_jsx("div", { className: "iad-type-switch", role: "group", "aria-label": "\u77E5\u8BC6\u7C7B\u578B", children: [["normal", "良品"], ["defect", "异常"]].map(([value, label]) => _jsx("button", { "aria-pressed": kind === value, onClick: () => workspace.selectKnowledgeKind(value), children: label }, value)) }), view.tab !== "setup" && view.tab !== "jobs" && _jsxs(_Fragment, { children: [_jsxs("label", { className: "iad-field", children: [_jsx("span", { className: "iad-visually-hidden", children: "\u77E5\u8BC6\u7248\u672C" }), _jsxs("select", { "aria-label": "\u77E5\u8BC6\u7248\u672C", value: view.version, onChange: event => workspace.updateView(pageId, { version: event.target.value, checkId: "" }), children: [_jsxs("option", { value: "", children: ["\u5F53\u524D\u53D1\u5E03\u7248\u672C", versions.length ? "" : " · 尚未发布"] }), versions.map(version => _jsxs("option", { value: version.version_id, children: [version.version_id, " \u00B7 ", version.source_count, " \u5F20\u6765\u6E90 \u00B7 ", version.created_at] }, version.version_id))] })] }), view.version && _jsx("p", { className: "iad-muted", children: "\u6B63\u5728\u67E5\u770B\u56FA\u5B9A\u5386\u53F2\u7248\u672C\u3002" }), loading && _jsx("p", { role: "status", className: "iad-muted", children: "\u6B63\u5728\u8BFB\u53D6\u77E5\u8BC6\u2026" }), loadError && _jsxs("p", { role: "alert", className: "iad-error", children: [loadError, " ", _jsx(IconButton, { label: "\u91CD\u65B0\u8BFB\u53D6\u77E5\u8BC6", onClick: updated, children: _jsx(RefreshIcon, {}) })] }), _jsxs("div", { className: "iad-row", children: [_jsx("span", { className: "iad-muted", children: kind === "normal" ? `良品来源 · ${dataset.reference_sample_ids.length} 张` : dataset.format === "folder_classification" ? "异常候选以目录标签及核验结果为准" : "异常候选以实际标注及核验结果为准" }), _jsx("button", { onClick: () => workspace.openLocation({ pageId: "industrial-images", datasetId: dataset.dataset_id, tab: kind === "normal" ? "sources" : "results", selected: "", page: 1, filters: { ...initialFilters, reference_status: kind === "normal" ? "candidate" : "all", raw_label_filters: kind === "defect" && dataset.format === "folder_classification" ? ["FAIL"] : [], annotation_filters: kind === "defect" && dataset.format !== "folder_classification" ? ["present"] : [] } }), children: kind === "normal" ? "管理来源" : "查看异常候选" })] })] })] }), (error || polling.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || polling.error }), scopeRunId && _jsx(KnowledgeScopePanel, { datasetId: dataset.dataset_id, kind: kind, scopeRunId: scopeRunId, revision: revision + refreshRevision, onScope: scoped }), view.tab === "setup" && _jsx(KnowledgeSetup, { dataset: dataset, kind: kind, versions: versions, normalVersions: normalVersions, busy: busy || running, directionProposal: directionProposal, onDirectionProposalUsed: consumeDirection, onStart: group => void start(group), onContinuous: () => void continuous() }), view.tab !== "setup" && _jsxs(PageTabs, { label: "\u77E5\u8BC6\u89C6\u56FE", items: [{ id: "results", label: "知识条目" }, { id: "findings", label: kind === "normal" ? "待核实" : "标注核验" }, { id: "versions", label: "版本" }, { id: "jobs", label: "作业记录" }], value: view.tab, onChange: tab => workspace.updateView(pageId, { tab }), children: [view.tab !== "jobs" &&
                        _jsx("section", { className: "iad-knowledge-content", children: knowledge ? _jsxs(_Fragment, { children: [_jsx(KnowledgeState, { freshness: current.freshness }), knowledge.normal_version_id && _jsxs("p", { "data-field": "knowledge-normal-version", children: ["\u6B64\u77E5\u8BC6\u7248\u672C\u4F9D\u636E\u826F\u54C1 ", _jsx("code", { children: knowledge.normal_version_id })] }), knowledge.kind === "defect" && !loading && normal && normal.version_id !== knowledge.normal_version_id && _jsx("p", { className: "iad-muted", children: "\u4E0B\u6B21\u6316\u6398\u5C06\u4F7F\u7528\u53E6\u4E00\u826F\u54C1\u7248\u672C\uFF0C\u5F53\u524D\u7ED3\u679C\u4FDD\u7559\u539F\u4F9D\u636E\u3002" }), knowledge.manual_edit && _jsx("p", { className: "iad-muted", children: "\u4EBA\u5DE5\u7EF4\u62A4\u7248\u672C" }), knowledge.summary && _jsx("p", { children: knowledge.summary }), _jsxs("details", { className: "iad-knowledge-overview", children: [_jsx("summary", { children: "\u7248\u672C\u4FE1\u606F" }), _jsxs("p", { className: "iad-muted", children: [_jsx("code", { children: knowledge.version_id }), " \u00B7 ", knowledge.sources.length, " \u5F20\u6765\u6E90 \u00B7 ", knowledge.checks.length, " \u9879\u5224\u636E \u00B7 ", knowledge.findings.length, " \u9879\u6838\u9A8C"] })] }), view.tab === "results" && _jsx(KnowledgeDiscovery, { knowledge: knowledge, evidence: evidence, onPropose: proposal => { setDirectionProposal(proposal); workspace.updateView(pageId, { tab: "setup" }); } }), view.tab === "results" && (_jsxs("div", { id: "knowledge-body", children: [_jsxs("div", { className: "iad-row", "aria-label": "\u77E5\u8BC6\u6761\u76EE\u7B5B\u9009", style: { marginBottom: 12 }, children: [_jsxs("label", { className: "iad-field", children: ["\u641C\u7D22\u77E5\u8BC6\u6761\u76EE", _jsx("input", { id: "knowledge-search", type: "search", "aria-label": "\u641C\u7D22\u77E5\u8BC6\u6761\u76EE", value: view.knowledgeSearch, onChange: event => {
                                                                    workspace.updateView(pageId, { knowledgeSearch: event.target.value }, true);
                                                                    setEntryPage(1);
                                                                } })] }), _jsxs("label", { className: "iad-field", children: ["\u652F\u6301\u72B6\u6001", _jsxs("select", { id: "knowledge-status", "aria-label": "\u77E5\u8BC6\u652F\u6301\u72B6\u6001", value: view.knowledgeStatus, onChange: event => {
                                                                    workspace.updateView(pageId, { knowledgeStatus: event.target.value });
                                                                    setEntryPage(1);
                                                                }, children: [_jsx("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }), Object.entries(knowledgeStatuses).map(([value, label]) => (_jsx("option", { value: value, children: label }, value)))] })] }), _jsx("button", { disabled: !view.knowledgeSearch && !view.knowledgeStatus, onClick: () => {
                                                            workspace.updateView(pageId, { knowledgeSearch: "", knowledgeStatus: "" });
                                                            setEntryPage(1);
                                                        }, children: "\u6E05\u9664\u77E5\u8BC6\u7B5B\u9009" })] }), _jsxs("div", { className: "knowledge-list", children: [_jsxs("div", { className: "knowledge-head", children: [_jsx("span", { children: "\u77E5\u8BC6\u6761\u76EE" }), _jsx("span", { children: "\u8BC1\u636E\u5224\u65AD" }), _jsx("span", { children: "\u652F\u6301" }), _jsx("span", { children: "\u53CD\u5BF9" }), _jsx("span", { children: "\u4EBA\u5DE5\u6838\u5B9E" }), _jsx("span", { children: "\u64CD\u4F5C" })] }), _jsxs("div", { className: "knowledge-items", children: [pagedChecks.map((item) => (_jsxs("div", { className: "knowledge-row", "data-detail-entry": item.check_id, role: "row", tabIndex: 0, "aria-label": `查看知识条目：${item.title}`, onClick: (e) => openDetail(item, e.currentTarget), onKeyDown: (e) => {
                                                                    if (e.key === "Enter" || e.key === " ") {
                                                                        e.preventDefault();
                                                                        openDetail(item, e.currentTarget);
                                                                    }
                                                                }, children: [_jsxs("span", { children: [_jsx("strong", { className: "row-title", children: item.title }), _jsx("span", { className: "row-desc", title: item.criterion, children: item.criterion })] }), _jsx("span", { className: "col-evidence", children: _jsx("span", { className: `status ${item.status === "supported" ? "green" : item.status === "conflicted" ? "red" : "amber"}`, children: knowledgeStatuses[item.status] }) }), _jsxs("span", { className: "row-count col-support", children: [item.support_evidence_ids.length, " \u5F20"] }), _jsxs("span", { className: "row-count col-counter", children: [item.counter_evidence_ids.length, " \u5F20"] }), _jsx("span", { className: "col-review", children: _jsx("span", { className: "status green", children: "\u5F85\u6838\u5B9E" }) }), _jsx("span", { className: "col-action", children: _jsxs("button", { type: "button", className: "knowledge-view-action", "data-view-entry": item.check_id, "aria-label": `查看知识条目 ${item.title}`, title: "\u67E5\u770B\u77E5\u8BC6\u6761\u76EE", onClick: (e) => {
                                                                                e.stopPropagation();
                                                                                openDetail(item, e.currentTarget);
                                                                            }, children: [_jsx(DocumentSearchIcon, {}), _jsx("span", { children: "\u67E5\u770B" })] }) })] }, item.check_id))), !checks.length && (_jsx("div", { className: "iad-empty-text", style: { padding: 24, textAlign: "center", color: "var(--iad-muted)" }, children: knowledge.checks.length ? "没有匹配的知识条目，请调整筛选条件。" : "尚无可发布知识条目。" }))] }), _jsxs("div", { className: "knowledge-pager", children: [_jsxs("div", { className: "pages", children: [_jsx("button", { type: "button", className: "pagebtn", disabled: currentEntryPage <= 1, onClick: () => setEntryPage(Math.max(1, currentEntryPage - 1)), children: "\u4E0A\u4E00\u9875" }), Array.from({ length: maxEntryPages }, (_, i) => i + 1).map((p) => (_jsx("button", { type: "button", className: "pagebtn", "data-entry-set": p, "aria-current": p === currentEntryPage ? "page" : undefined, onClick: () => setEntryPage(p), children: p }, p))), _jsx("button", { type: "button", className: "pagebtn", disabled: currentEntryPage >= maxEntryPages, onClick: () => setEntryPage(Math.min(maxEntryPages, currentEntryPage + 1)), children: "\u4E0B\u4E00\u9875" })] }), _jsxs("span", { className: "page-total", children: ["\u7B2C ", currentEntryPage, " / ", maxEntryPages, " \u9875\uFF0C\u5171 ", checks.length, " \u6761"] })] })] })] })), view.tab === "findings" && _jsxs(_Fragment, { children: [knowledge.conflicts.map(conflict => _jsxs("article", { className: "iad-info-group", children: [_jsx("h3", { children: conflict.resolution?.status === "resolved" ? "冲突已重核验" : "知识与图像待核实" }), _jsx("p", { children: conflict.description }), _jsxs("p", { children: ["\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A", conflict.normal_explanation] }), evidence([...conflict.new_evidence_ids, ...conflict.comparison_evidence_ids]), _jsx("button", { onClick: () => workspace.openLocation({ pageId: "industrial-review", datasetId: dataset.dataset_id, tab: "conflicts", version: knowledge.version_id, conflictId: conflict.conflict_id }), children: "\u4EBA\u5DE5\u786E\u8BA4\u6B64\u51B2\u7A81" })] }, conflict.conflict_id)), knowledge.findings.map(finding => _jsxs("article", { className: "iad-info-group", children: [_jsx("h3", { children: finding.judgment.status === "supported" ? "图像支持异常" : finding.judgment.status === "refuted" ? "正常解释成立" : "证据不足" }), _jsx("p", { children: finding.judgment.description }), _jsxs("p", { children: ["\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A", finding.judgment.normal_explanation] }), _jsx("p", { className: "iad-muted", children: finding.judgment.limitations.join("；") }), evidence(finding.judgment.evidence_ids), _jsx("button", { onClick: () => workspace.navigate("industrial-review", finding.sample_id), children: "\u4EBA\u5DE5\u6838\u5B9E\u6B64\u56FE" })] }, finding.finding_id)), !knowledge.findings.length && _jsx("p", { children: "\u6B64\u7248\u672C\u6CA1\u6709\u5F85\u6838\u9A8C\u533A\u57DF\u3002" })] }), !!knowledge.limitations.length && _jsxs("details", { children: [_jsx("summary", { children: "\u77E5\u8BC6\u9650\u5236" }), knowledge.limitations.map((limitation, index) => _jsx("p", { children: limitation }, index))] }), !!knowledge.corrections.length && _jsxs("details", { children: [_jsx("summary", { children: "\u4EBA\u5DE5\u4FEE\u8BA2\u5019\u9009" }), knowledge.corrections.map(item => _jsxs("div", { children: [_jsx("p", { children: item.instruction }), _jsx("p", { className: "iad-muted", children: knowledge.revisions.find(revision => revision.previous_check_id === item.check_id)?.reason })] }, item.check_id))] }), view.tab === "results" && _jsx("button", { onClick: () => workspace.updateView(pageId, { tab: "setup", miningPreset: knowledge.version_id, miningSourceMode: "uncovered", miningImages: [], miningPage: 1 }), children: "\u4F5C\u4E3A\u9884\u8BBE\u7EE7\u7EED\u9009\u56FE" }), view.tab === "versions" && _jsx(KnowledgeVersions, { versions: versions, onSelect: version => workspace.updateView(pageId, { version, checkId: "", tab: "results" }) })] }) : _jsxs("p", { children: ["\u5C1A\u65E0", kind === "normal" ? "良品" : "不良品", "\u77E5\u8BC6\u7248\u672C\u3002"] }) }), view.tab === "jobs" && _jsxs("section", { className: "iad-knowledge-jobs iad-job-section", children: [_jsx("h2", { children: "\u6316\u6398\u4F5C\u4E1A" }), _jsx(JobTable, { jobs: jobs, pageId: pageId, onChanged: polling.refresh, stale: polling.syncState === "stale", lastSyncedAt: polling.lastSyncedAt }, dataset.dataset_id + kind)] })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) }), typeof document !== "undefined" && detailCheck && createPortal(_jsx("div", { className: "overlay detail-overlay", id: "detail-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "kb-detail-title", onClick: closeDetail, children: _jsxs("section", { className: "modal detail-modal iad-detail-dialog", id: "entry-dialog", tabIndex: -1, onClick: (e) => e.stopPropagation(), children: [_jsxs("header", { className: "modalheader iad-dialog-header", children: [_jsx("div", { children: _jsx("h2", { id: "kb-detail-title", children: detailCheck.title }) }), _jsx("button", { type: "button", className: "iconbtn modal-x", id: "close-detail", "aria-label": "\u5173\u95ED\u77E5\u8BC6\u8BE6\u60C5", title: "\u5173\u95ED\u77E5\u8BC6\u8BE6\u60C5", onClick: closeDetail, children: _jsx(CloseIcon, {}) })] }), _jsxs("div", { className: "modalcontent detail-scroll", id: "detail-content", children: [_jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "\u77E5\u8BC6\u7ED3\u8BBA" }), _jsxs("p", { children: [detailCheck.subject, " \u00B7 ", detailCheck.location, " \u00B7 ", knowledgeStatuses[detailCheck.status]] })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "\u5224\u5B9A\u4F9D\u636E" }), _jsx("p", { children: detailCheck.criterion })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "\u5141\u8BB8\u53D8\u5316" }), _jsx("p", { children: detailCheck.allowed_variations.join("；") || "未记录" })] }), _jsxs("section", { className: "detail-section", children: [_jsxs("h3", { children: ["\u652F\u6301\u8BC1\u636E\uFF0C", detailCheck.support_evidence_ids.length, " \u5F20"] }), evidence(detailCheck.support_evidence_ids)] }), _jsxs("section", { className: "detail-section", children: [_jsxs("h3", { children: ["\u53CD\u5BF9\u8BC1\u636E\uFF0C", detailCheck.counter_evidence_ids.length, " \u5F20"] }), evidence(detailCheck.counter_evidence_ids)] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "\u9002\u7528\u9650\u5236" }), _jsx("p", { className: "iad-muted", children: [...detailCheck.limitations, ...detailCheck.support_limitations].join("；") || "未记录额外限制" })] }), _jsxs("section", { className: "detail-section detail-review", children: [_jsx("h3", { children: "\u4EBA\u5DE5\u6838\u5B9E" }), _jsxs("div", { className: "knowledge-review-options", role: "radiogroup", "aria-label": "\u4EBA\u5DE5\u6838\u5B9E\u7ED3\u8BBA", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "knowledge-review", value: "pending", checked: reviewStatus === "pending", onChange: () => setReviewStatus("pending") }), "\u5F85\u6838\u5B9E"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "knowledge-review", value: "confirmed", checked: reviewStatus === "confirmed", onChange: () => setReviewStatus("confirmed") }), "\u6838\u5B9E\u901A\u8FC7"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "knowledge-review", value: "rejected", checked: reviewStatus === "rejected", onChange: () => setReviewStatus("rejected") }), "\u9A73\u56DE"] })] }), _jsx("label", { className: "label", htmlFor: "review-note", children: "\u590D\u6838\u5907\u6CE8" }), _jsx("textarea", { className: "f textarea", id: "review-note", placeholder: "\u586B\u5199\u590D\u6838\u4F9D\u636E\uFF08\u53EF\u9009\uFF09", value: reviewNote, onChange: (e) => setReviewNote(e.target.value) })] })] }), _jsxs("footer", { className: "modalfooter", children: [_jsx("span", {}), _jsxs("div", { className: "actions", children: [_jsx("button", { type: "button", className: "btn cancel", id: "cancel-review", onClick: closeDetail, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "btn primary", id: "save-review", onClick: closeDetail, children: "\u4FDD\u5B58" })] })] })] }) }), document.body)] });
}
