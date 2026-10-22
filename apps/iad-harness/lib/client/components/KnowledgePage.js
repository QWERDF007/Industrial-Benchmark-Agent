import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { JobCard } from "./JobCard.js";
import { useCallback, useState } from "react";
import { initialFilters, message, request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useWorkspace } from "../workspace.js";
import { useKnowledge } from "../useKnowledge.js";
import { ImageViewer } from "./ImageViewer.js";
import { KnowledgeScopePanel } from "./KnowledgeScopePanel.js";
import { KnowledgeSetup } from "./KnowledgeSetup.js";
import { KnowledgeState } from "./KnowledgeState.js";
import { knowledgeStatuses } from "../../shared/knowledge-presentation.js";
import { DeleteAction } from "./DeleteAction.js";
import { KnowledgeDiscovery } from "./KnowledgeDiscovery.js";
export function KnowledgePage({ dataset, kind, refreshRevision }) {
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
    const [checkId, setCheckId] = useState("");
    async function start(group) {
        setBusy(true);
        setError("");
        try {
            const input = { ...group, kind };
            const job = await request(view.scopeRunId ? `/knowledge/scopes/${encodeURIComponent(view.scopeRunId)}/start` : "/knowledge/start", input);
            const current = workspace.getSnapshot();
            if (current.datasetId === dataset.dataset_id && current.knowledgeKind === kind)
                workspace.updateView(pageId, { version: "", miningImages: [], job: job.run_id });
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
    const check = checks.find(check => check.check_id === checkId) || checks[0];
    function evidence(ids) {
        return _jsx("div", { className: "iad-knowledge-evidence iad-reference-grid", children: knowledge?.evidence.filter(item => ids.includes(item.image.evidence_id)).map(item => {
                const image = item.image;
                const src = `/api/iad/knowledge/evidence/${encodeURIComponent(knowledge.version_id)}/${encodeURIComponent(image.evidence_id)}`;
                return _jsxs("button", { title: `查看 ${image.role} · ${image.representation}`, onClick: () => setLightbox({ src, title: `${image.role} · ${image.representation} · ${image.crop_bbox.join(", ")}`, width: image.sent_size[0], height: image.sent_size[1] }), children: [_jsx("img", { src: src, alt: `${image.role} ${image.representation}` }), _jsxs("small", { children: [image.role, " \u00B7 ", image.representation] })] }, image.evidence_id);
            }) });
    }
    return _jsxs("section", { className: "iad-knowledge-page", children: [_jsxs("section", { className: "iad-job-section", children: [_jsxs("div", { className: "iad-config-bar", children: [_jsxs("label", { className: "iad-field", children: ["\u77E5\u8BC6\u7248\u672C", _jsxs("select", { "aria-label": "\u77E5\u8BC6\u7248\u672C", value: view.version, onChange: event => workspace.updateView(pageId, { version: event.target.value }), children: [_jsxs("option", { value: "", children: ["\u5F53\u524D\u53D1\u5E03\u7248\u672C", versions.length ? "" : " · 尚未发布"] }), versions.map(version => _jsxs("option", { value: version.version_id, children: [version.version_id, " \u00B7 ", version.source_count, " \u5F20\u6765\u6E90 \u00B7 ", version.created_at] }, version.version_id))] })] }), view.version && _jsx("p", { className: "iad-muted", children: "\u6B63\u5728\u67E5\u770B\u56FA\u5B9A\u5386\u53F2\u7248\u672C\u3002" })] }), loading && _jsx("p", { role: "status", className: "iad-muted", children: "\u6B63\u5728\u8BFB\u53D6\u77E5\u8BC6\u2026" }), loadError && _jsxs("p", { role: "alert", className: "iad-error", children: [loadError, " ", _jsx("button", { onClick: updated, children: "\u91CD\u65B0\u8BFB\u53D6\u77E5\u8BC6" })] }), (error || polling.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || polling.error }), _jsxs("div", { className: "iad-row", children: [_jsx("span", { className: "iad-muted", children: kind === "normal" ? `良品来源 · ${dataset.reference_sample_ids.length} 张` : dataset.format === "folder_classification" ? "异常候选以目录标签及核验结果为准" : "异常候选以实际标注及核验结果为准" }), _jsx("button", { onClick: () => workspace.openLocation({ pageId: "industrial-images", datasetId: dataset.dataset_id, tab: kind === "normal" ? "sources" : "results", selected: "", page: 1, filters: { ...initialFilters, reference_status: kind === "normal" ? "candidate" : "all", raw_label_filters: kind === "defect" && dataset.format === "folder_classification" ? ["FAIL"] : [], annotation_filters: kind === "defect" && dataset.format !== "folder_classification" ? ["present"] : [] } }), children: kind === "normal" ? "管理来源" : "查看异常候选" })] })] }), scopeRunId && _jsx(KnowledgeScopePanel, { datasetId: dataset.dataset_id, kind: kind, scopeRunId: scopeRunId, revision: revision + refreshRevision, onScope: scoped }), _jsx(KnowledgeSetup, { dataset: dataset, kind: kind, versions: versions, normalVersions: normalVersions, busy: busy || running, directionProposal: directionProposal, onDirectionProposalUsed: consumeDirection, onStart: group => void start(group), onContinuous: () => void continuous() }), _jsx("nav", { className: "iad-tabs", "aria-label": "\u77E5\u8BC6\u89C6\u56FE", children: [["results", "知识条目"], ["findings", kind === "normal" ? "待核实" : "标注核验"], ["versions", "版本"], ["jobs", "作业记录"]].map(([tab, title]) => _jsx("button", { className: view.tab === tab ? "active" : "", "aria-pressed": view.tab === tab, onClick: () => workspace.updateView(pageId, { tab }), children: title }, tab)) }), _jsx("section", { className: "iad-knowledge-content iad-job-section", children: knowledge ? _jsxs(_Fragment, { children: [_jsx(KnowledgeState, { freshness: current.freshness }), knowledge.normal_version_id && _jsxs("p", { "data-field": "knowledge-normal-version", children: ["\u6B64\u77E5\u8BC6\u7248\u672C\u4F9D\u636E\u826F\u54C1 ", _jsx("code", { children: knowledge.normal_version_id })] }), knowledge.kind === "defect" && !loading && normal && normal.version_id !== knowledge.normal_version_id && _jsx("p", { className: "iad-muted", children: "\u4E0B\u6B21\u6316\u6398\u5C06\u4F7F\u7528\u53E6\u4E00\u826F\u54C1\u7248\u672C\uFF0C\u5F53\u524D\u7ED3\u679C\u4FDD\u7559\u539F\u4F9D\u636E\u3002" }), _jsx("button", { onClick: () => workspace.updateView(pageId, { miningPreset: knowledge.version_id, miningSourceMode: "uncovered", miningImages: [], miningPage: 1 }), children: "\u4F5C\u4E3A\u9884\u8BBE\u7EE7\u7EED\u9009\u56FE" }), knowledge.manual_edit && _jsx("p", { className: "iad-muted", children: "\u4EBA\u5DE5\u7EF4\u62A4\u7248\u672C" }), knowledge.summary && _jsx("p", { children: knowledge.summary }), _jsxs("p", { className: "iad-muted", children: [_jsx("code", { children: knowledge.version_id }), " \u00B7 ", knowledge.sources.length, " \u5F20\u6765\u6E90 \u00B7 ", knowledge.checks.length, " \u9879\u5224\u636E \u00B7 ", knowledge.findings.length, " \u9879\u6838\u9A8C"] }), view.tab === "results" && _jsx(KnowledgeDiscovery, { knowledge: knowledge, evidence: evidence, onPropose: setDirectionProposal }), view.tab === "results" && _jsxs(_Fragment, { children: [_jsxs("div", { className: "iad-row", "aria-label": "\u77E5\u8BC6\u6761\u76EE\u7B5B\u9009", children: [_jsxs("label", { className: "iad-field", children: ["\u641C\u7D22\u77E5\u8BC6\u6761\u76EE", _jsx("input", { type: "search", "aria-label": "\u641C\u7D22\u77E5\u8BC6\u6761\u76EE", value: view.knowledgeSearch, onChange: event => workspace.updateView(pageId, { knowledgeSearch: event.target.value }, true) })] }), _jsxs("label", { className: "iad-field", children: ["\u652F\u6301\u72B6\u6001", _jsxs("select", { "aria-label": "\u77E5\u8BC6\u652F\u6301\u72B6\u6001", value: view.knowledgeStatus, onChange: event => workspace.updateView(pageId, { knowledgeStatus: event.target.value }), children: [_jsx("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }), Object.entries(knowledgeStatuses).map(([value, label]) => _jsx("option", { value: value, children: label }, value))] })] }), _jsx("button", { disabled: !view.knowledgeSearch && !view.knowledgeStatus, onClick: () => workspace.updateView(pageId, { knowledgeSearch: "", knowledgeStatus: "" }), children: "\u6E05\u9664\u77E5\u8BC6\u7B5B\u9009" })] }), _jsxs("p", { role: "status", "aria-label": "\u77E5\u8BC6\u7B5B\u9009\u7ED3\u679C", children: ["\u663E\u793A ", checks.length, " / ", knowledge.checks.length, " \u9879\u5224\u636E"] }), _jsxs("div", { className: "iad-knowledge-split", children: [_jsxs("div", { className: "iad-check-list", children: [checks.map(item => _jsxs("button", { "aria-pressed": check?.check_id === item.check_id, onClick: () => setCheckId(item.check_id), children: [_jsx("strong", { children: item.title }), _jsxs("span", { children: [knowledgeStatuses[item.status], " \u00B7 \u652F\u6301 ", item.support_evidence_ids.length, " / \u53CD\u5BF9 ", item.counter_evidence_ids.length] })] }, item.check_id)), !checks.length && _jsx("p", { children: knowledge.checks.length ? "没有匹配的判据，请调整或清除筛选。" : "尚无可发布判据，请查看限制和核验结果。" })] }), check && _jsxs("article", { className: "iad-info-group", children: [_jsxs("div", { className: "iad-section-header", children: [_jsx("h2", { children: check.title }), _jsx(DeleteAction, { title: "\u5220\u9664\u77E5\u8BC6\u6761\u76EE", name: check.title, description: "\u53D1\u5E03\u79FB\u9664\u8BE5\u6761\u76EE\u7684\u65B0\u7248\u672C\uFF0C\u4FDD\u7559\u5386\u53F2\u77E5\u8BC6\u548C\u5DF2\u6709\u5BA1\u8BA1\u4F9D\u636E\u3002", disabled: current.freshness?.current_version_id !== knowledge.version_id || loading, restoreFocus: () => document.querySelector(".iad-knowledge-page .iad-tabs button.active"), onDelete: async (submission_id) => {
                                                                const next = await request(`/knowledge/versions/${encodeURIComponent(knowledge.version_id)}/checks/remove`, { submission_id, check_id: check.check_id });
                                                                workspace.updateView(pageId, { version: "", miningPreset: view.miningPreset === knowledge.version_id ? next.version_id : view.miningPreset, miningImages: [] });
                                                                setCheckId("");
                                                                updated();
                                                            } })] }), _jsxs("p", { children: [check.subject, " \u00B7 ", check.location] }), _jsx("p", { children: check.criterion }), !!check.recheck_sample_ids.length && _jsx("p", { children: _jsxs("button", { onClick: () => workspace.updateView(pageId, { miningPreset: knowledge.version_id, miningSourceMode: "recheck", miningContinuous: false, miningImages: [], miningPage: 1 }), children: ["\u91CD\u6838\u9A8C\u5386\u53F2\u6765\u6E90 \u00B7 ", check.recheck_sample_ids.length, " \u5F20"] }) }), _jsxs("p", { children: ["\u5141\u8BB8\u53D8\u5316\uFF1A", check.allowed_variations.join("；") || "未记录"] }), _jsx("h3", { children: "\u652F\u6301\u8BC1\u636E" }), evidence(check.support_evidence_ids), !!check.counter_evidence_ids.length && _jsxs(_Fragment, { children: [_jsx("h3", { children: "\u53CD\u5BF9\u8BC1\u636E" }), evidence(check.counter_evidence_ids)] }), _jsx("p", { className: "iad-muted", children: [...check.limitations, ...check.support_limitations].join("；") })] })] })] }), view.tab === "findings" && _jsxs(_Fragment, { children: [knowledge.conflicts.map(conflict => _jsxs("article", { className: "iad-info-group", children: [_jsx("h3", { children: conflict.resolution?.status === "resolved" ? "冲突已重核验" : "知识与图像待核实" }), _jsx("p", { children: conflict.description }), _jsxs("p", { children: ["\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A", conflict.normal_explanation] }), evidence([...conflict.new_evidence_ids, ...conflict.comparison_evidence_ids]), _jsx("button", { onClick: () => workspace.openLocation({ pageId: "industrial-review", datasetId: dataset.dataset_id, tab: "conflicts", version: knowledge.version_id, conflictId: conflict.conflict_id }), children: "\u4EBA\u5DE5\u786E\u8BA4\u6B64\u51B2\u7A81" })] }, conflict.conflict_id)), knowledge.findings.map(finding => _jsxs("article", { className: "iad-info-group", children: [_jsx("h3", { children: finding.judgment.status === "supported" ? "图像支持异常" : finding.judgment.status === "refuted" ? "正常解释成立" : "证据不足" }), _jsx("p", { children: finding.judgment.description }), _jsxs("p", { children: ["\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A", finding.judgment.normal_explanation] }), _jsx("p", { className: "iad-muted", children: finding.judgment.limitations.join("；") }), evidence(finding.judgment.evidence_ids), _jsx("button", { onClick: () => workspace.navigate("industrial-review", finding.sample_id), children: "\u4EBA\u5DE5\u6838\u5B9E\u6B64\u56FE" })] }, finding.finding_id)), !knowledge.findings.length && _jsx("p", { children: "\u6B64\u7248\u672C\u6CA1\u6709\u5F85\u6838\u9A8C\u533A\u57DF\u3002" })] }), !!knowledge.limitations.length && _jsxs("details", { children: [_jsx("summary", { children: "\u77E5\u8BC6\u9650\u5236" }), knowledge.limitations.map((limitation, index) => _jsx("p", { children: limitation }, index))] }), !!knowledge.corrections.length && _jsxs("details", { children: [_jsx("summary", { children: "\u4EBA\u5DE5\u4FEE\u8BA2\u5019\u9009" }), knowledge.corrections.map(item => _jsxs("div", { children: [_jsx("p", { children: item.instruction }), _jsx("p", { className: "iad-muted", children: knowledge.revisions.find(revision => revision.previous_check_id === item.check_id)?.reason })] }, item.check_id))] }), view.tab === "versions" && versions.map(version => _jsxs("article", { className: "iad-info-group", children: [_jsx("button", { onClick: () => workspace.updateView(pageId, { version: version.version_id, tab: "results" }), children: version.version_id }), _jsxs("p", { children: [version.source_count, " \u5F20\u6765\u6E90 \u00B7 ", version.check_count, " \u9879\u5224\u636E \u00B7 ", version.created_at] }), version.parent_version_id && _jsxs("p", { className: "iad-muted", children: ["\u7236\u7248\u672C ", version.parent_version_id] }), version.normal_version_id && _jsxs("p", { className: "iad-muted", children: ["\u4F9D\u636E\u826F\u54C1\u7248\u672C ", version.normal_version_id] })] }, version.version_id))] }) : _jsxs("p", { children: ["\u5C1A\u65E0", kind === "normal" ? "良品" : "不良品", "\u77E5\u8BC6\u7248\u672C\u3002"] }) }), _jsxs("section", { className: "iad-knowledge-jobs iad-job-section", children: [_jsx("h2", { children: "\u6316\u6398\u4F5C\u4E1A" }), jobs.map(job => _jsx(JobCard, { job: job, onChanged: polling.refresh }, job.run_id)), !jobs.length && _jsx("p", { children: "\u5C1A\u65E0\u6316\u6398\u4F5C\u4E1A\u3002" })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
}
