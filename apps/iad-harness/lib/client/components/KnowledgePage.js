import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { message, request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useWorkspace } from "../workspace.js";
import { ImageViewer } from "./ImageViewer.js";
const statuses = { supported: "有证据支持", provisional: "待验证", conflicted: "存在矛盾" };
export function KnowledgePage({ dataset, kind }) {
    const { workspace } = useWorkspace();
    const pageId = kind === "normal" ? "industrial-normal" : "industrial-defect";
    const view = workspace.view(pageId);
    const [knowledge, setKnowledge] = useState(null);
    const [normal, setNormal] = useState(null);
    const [versions, setVersions] = useState([]);
    const [normalVersions, setNormalVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [revision, setRevision] = useState(0);
    const [lightbox, setLightbox] = useState(null);
    const [model, setModel] = useState("");
    const updated = useCallback(() => setRevision(value => value + 1), []);
    const polling = useJobs("knowledge", dataset.dataset_id, updated);
    const jobs = polling.jobs.filter(job => job.kind === kind);
    const running = jobs.some(job => job.status === "RUNNING" || job.status === "PENDING");
    const [checkId, setCheckId] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        const query = new URLSearchParams({ dataset_id: dataset.dataset_id, kind, ...(view.version ? { version_id: view.version } : {}) });
        Promise.all([
            request(`/knowledge?${query}`, undefined, undefined, controller.signal),
            kind === "defect" ? request(`/knowledge?${new URLSearchParams({ dataset_id: dataset.dataset_id, kind: "normal", ...(view.normalVersion ? { version_id: view.normalVersion } : {}) })}`, undefined, undefined, controller.signal) : Promise.resolve({ knowledge: null, versions: [] }),
        ]).then(([current, reference]) => { if (!controller.signal.aborted) {
            setKnowledge(current.knowledge);
            setVersions(current.versions);
            setNormal(reference.knowledge);
            setNormalVersions(reference.versions);
            setLoadError("");
        } })
            .catch(error => { if (!controller.signal.aborted)
            setLoadError(message(error)); })
            .finally(() => { if (!controller.signal.aborted)
            setLoading(false); });
        return () => controller.abort();
    }, [dataset.dataset_id, kind, revision, view.version, view.normalVersion]);
    async function start() {
        setBusy(true);
        setError("");
        try {
            const input = { dataset_id: dataset.dataset_id, kind, ...(kind === "defect" ? { normal_version_id: normal?.version_id } : {}), ...(model.trim() ? { model_name: model.trim() } : {}) };
            await request("/knowledge/start", input);
            workspace.updateView(pageId, { version: "" });
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
    const check = knowledge?.checks.find(check => check.check_id === checkId) || knowledge?.checks[0];
    function evidence(ids) {
        return _jsx("div", { className: "iad-knowledge-evidence iad-reference-grid", children: knowledge?.evidence.filter(item => ids.includes(item.image.evidence_id)).map(item => {
                const image = item.image;
                const src = `/api/iad/knowledge/evidence/${encodeURIComponent(knowledge.version_id)}/${encodeURIComponent(image.evidence_id)}`;
                return _jsxs("button", { title: `查看 ${image.role} · ${image.representation}`, onClick: () => setLightbox({ src, title: `${image.role} · ${image.representation} · ${image.crop_bbox.join(", ")}`, width: image.sent_size[0], height: image.sent_size[1] }), children: [_jsx("img", { src: src, alt: `${image.role} ${image.representation}` }), _jsxs("small", { children: [image.role, " \u00B7 ", image.representation] })] }, image.evidence_id);
            }) });
    }
    return _jsxs("section", { className: "iad-knowledge-page", children: [_jsxs("section", { className: "iad-job-section", children: [_jsxs("div", { className: "iad-row", children: [_jsxs("strong", { children: ["\u5168\u90E8\u5408\u683C", kind === "normal" ? "良品" : "异常", "\u5019\u9009"] }), _jsxs("label", { children: ["\u6A21\u578B", _jsx("input", { "aria-label": "\u77E5\u8BC6\u6316\u6398\u6A21\u578B", placeholder: "\u4F7F\u7528\u9879\u76EE\u914D\u7F6E", value: model, onChange: event => setModel(event.target.value) })] }), _jsx("button", { className: "iad-primary", disabled: busy || loading || !!loadError || running || (kind === "normal" ? !dataset.reference_sample_ids.length : !normal?.checks.some(check => check.status === "supported") || (!!view.normalVersion && normal.version_id !== view.normalVersion)), onClick: start, children: busy ? "启动中…" : `开始挖掘${kind === "normal" ? "良品" : "不良品"}知识` })] }), _jsxs("label", { className: "iad-field", children: ["\u77E5\u8BC6\u7248\u672C", _jsxs("select", { "aria-label": "\u77E5\u8BC6\u7248\u672C", value: view.version, onChange: event => workspace.updateView(pageId, { version: event.target.value }), children: [_jsxs("option", { value: "", children: ["\u5F53\u524D\u53D1\u5E03\u7248\u672C", versions.length ? "" : " · 尚未发布"] }), versions.map(version => _jsxs("option", { value: version.version_id, children: [version.version_id, " \u00B7 ", version.source_count, " \u5F20\u6765\u6E90 \u00B7 ", version.created_at] }, version.version_id))] })] }), view.version && _jsx("p", { className: "iad-muted", children: "\u6B63\u5728\u67E5\u770B\u56FA\u5B9A\u7248\u672C\uFF1B\u65B0\u4F5C\u4E1A\u4ECE\u5F53\u524D\u5DF2\u53D1\u5E03\u7248\u672C\u7EE7\u7EED\u6838\u9A8C\u3002" }), kind === "defect" && _jsxs(_Fragment, { children: [_jsxs("label", { className: "iad-field", children: ["\u4E0B\u6B21\u6316\u6398\u4F9D\u636E\u7684\u826F\u54C1\u7248\u672C", _jsxs("select", { "aria-label": "\u4F9D\u636E\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.normalVersion || "", onChange: event => workspace.updateView(pageId, { normalVersion: event.target.value }), disabled: busy || running, children: [_jsx("option", { value: "", children: "\u5F53\u524D\u53D1\u5E03\u7248\u672C" }), normalVersions.map(version => _jsxs("option", { value: version.version_id, children: [version.version_id, " \u00B7 ", version.created_at] }, version.version_id))] })] }), !loading && !normal?.checks.some(check => check.status === "supported") && _jsxs("p", { children: ["\u6240\u9009\u7248\u672C\u6CA1\u6709\u53EF\u7528\u7684\u826F\u54C1\u5224\u636E\u3002", _jsx("button", { onClick: () => workspace.navigate("industrial-normal"), children: "\u524D\u5F80\u826F\u54C1\u77E5\u8BC6" })] })] }), loading && _jsx("p", { role: "status", className: "iad-muted", children: "\u6B63\u5728\u8BFB\u53D6\u77E5\u8BC6\u2026" }), loadError && _jsxs("p", { role: "alert", className: "iad-error", children: [loadError, " ", _jsx("button", { onClick: updated, children: "\u91CD\u65B0\u8BFB\u53D6\u77E5\u8BC6" })] }), (error || polling.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || polling.error }), _jsx("p", { className: "iad-muted", children: "\u53C2\u8003\u8D44\u683C\u4E0E\u521D\u59CB\u65E0\u6807\u6CE8\u7EA6\u5B9A\u5728\u6570\u636E\u96C6\u7BA1\u7406\u7EF4\u62A4\u3002" }), _jsx("button", { onClick: () => workspace.navigate("industrial-datasets"), children: "\u7EF4\u62A4\u5019\u9009\u6765\u6E90" })] }), _jsx("nav", { className: "iad-tabs", "aria-label": "\u77E5\u8BC6\u89C6\u56FE", children: [["results", "知识条目"], ["findings", kind === "normal" ? "待核实" : "标注核验"], ["versions", "版本"], ["jobs", "作业记录"]].map(([tab, title]) => _jsx("button", { className: view.tab === tab ? "active" : "", "aria-pressed": view.tab === tab, onClick: () => workspace.updateView(pageId, { tab }), children: title }, tab)) }), _jsx("section", { className: "iad-knowledge-content iad-job-section", children: knowledge ? _jsxs(_Fragment, { children: [knowledge.normal_version_id && _jsxs("p", { "data-field": "knowledge-normal-version", children: ["\u6B64\u77E5\u8BC6\u7248\u672C\u4F9D\u636E\u826F\u54C1 ", _jsx("code", { children: knowledge.normal_version_id })] }), knowledge.kind === "defect" && !loading && normal && normal.version_id !== knowledge.normal_version_id && _jsx("p", { className: "iad-muted", children: "\u4E0B\u6B21\u6316\u6398\u5C06\u4F7F\u7528\u53E6\u4E00\u826F\u54C1\u7248\u672C\uFF0C\u5F53\u524D\u7ED3\u679C\u4FDD\u7559\u539F\u4F9D\u636E\u3002" }), _jsx("p", { children: knowledge.summary }), _jsxs("p", { className: "iad-muted", children: [_jsx("code", { children: knowledge.version_id }), " \u00B7 ", knowledge.sources.length, " \u5F20\u6765\u6E90 \u00B7 ", knowledge.checks.length, " \u9879\u5224\u636E \u00B7 ", knowledge.findings.length, " \u9879\u6838\u9A8C"] }), view.tab === "results" && _jsxs("div", { className: "iad-knowledge-split", children: [_jsxs("div", { className: "iad-check-list", children: [knowledge.checks.map(item => _jsxs("button", { "aria-pressed": check?.check_id === item.check_id, onClick: () => setCheckId(item.check_id), children: [_jsx("strong", { children: item.title }), _jsxs("span", { children: [statuses[item.status], " \u00B7 \u652F\u6301 ", item.support_evidence_ids.length, " / \u53CD\u5BF9 ", item.counter_evidence_ids.length] })] }, item.check_id)), !knowledge.checks.length && _jsx("p", { children: "\u5C1A\u65E0\u53EF\u53D1\u5E03\u5224\u636E\uFF0C\u8BF7\u67E5\u770B\u9650\u5236\u548C\u6838\u9A8C\u7ED3\u679C\u3002" })] }), check && _jsxs("article", { className: "iad-info-group", children: [_jsx("h2", { children: check.title }), _jsxs("p", { children: [check.subject, " \u00B7 ", check.location] }), _jsx("p", { children: check.criterion }), _jsxs("p", { children: ["\u5141\u8BB8\u53D8\u5316\uFF1A", check.allowed_variations.join("；") || "未记录"] }), _jsx("h3", { children: "\u652F\u6301\u8BC1\u636E" }), evidence(check.support_evidence_ids), !!check.counter_evidence_ids.length && _jsxs(_Fragment, { children: [_jsx("h3", { children: "\u53CD\u5BF9\u8BC1\u636E" }), evidence(check.counter_evidence_ids)] }), _jsx("p", { className: "iad-muted", children: check.limitations.join("；") })] })] }), view.tab === "findings" && _jsxs(_Fragment, { children: [knowledge.findings.map(finding => _jsxs("article", { className: "iad-info-group", children: [_jsx("h3", { children: finding.judgment.status === "supported" ? "图像支持异常" : finding.judgment.status === "refuted" ? "正常解释成立" : "证据不足" }), _jsx("p", { children: finding.judgment.description }), _jsxs("p", { children: ["\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A", finding.judgment.normal_explanation] }), _jsx("p", { className: "iad-muted", children: finding.judgment.limitations.join("；") }), evidence(finding.judgment.evidence_ids), _jsx("button", { onClick: () => workspace.navigate("industrial-review", finding.sample_id), children: "\u4EBA\u5DE5\u6838\u5B9E\u6B64\u56FE" })] }, finding.finding_id)), !knowledge.findings.length && _jsx("p", { children: "\u6B64\u7248\u672C\u6CA1\u6709\u5F85\u6838\u9A8C\u533A\u57DF\u3002" })] }), !!knowledge.limitations.length && _jsxs("details", { children: [_jsx("summary", { children: "\u77E5\u8BC6\u9650\u5236" }), knowledge.limitations.map((limitation, index) => _jsx("p", { children: limitation }, index))] }), view.tab === "versions" && versions.map(version => _jsxs("article", { className: "iad-info-group", children: [_jsx("button", { onClick: () => workspace.updateView(pageId, { version: version.version_id, tab: "results" }), children: version.version_id }), _jsxs("p", { children: [version.source_count, " \u5F20\u6765\u6E90 \u00B7 ", version.check_count, " \u9879\u5224\u636E \u00B7 ", version.created_at] }), version.parent_version_id && _jsxs("p", { className: "iad-muted", children: ["\u7236\u7248\u672C ", version.parent_version_id] }), version.normal_version_id && _jsxs("p", { className: "iad-muted", children: ["\u4F9D\u636E\u826F\u54C1\u7248\u672C ", version.normal_version_id] })] }, version.version_id))] }) : _jsxs("p", { children: ["\u5C1A\u65E0", kind === "normal" ? "良品" : "不良品", "\u77E5\u8BC6\u7248\u672C\u3002"] }) }), _jsxs("section", { className: "iad-knowledge-jobs iad-job-section", children: [_jsx("h2", { children: "\u6316\u6398\u4F5C\u4E1A" }), jobs.map(job => _jsxs("article", { className: "iad-job", children: [_jsxs("div", { className: "iad-row", children: [_jsx("strong", { children: job.status }), _jsx("code", { children: job.run_id }), (job.status === "RUNNING" || job.status === "PENDING") && _jsx("button", { onClick: async () => { try {
                                            await request(`/knowledge/cancel/${job.run_id}`, {});
                                            polling.refresh();
                                        }
                                        catch (error) {
                                            setError(message(error));
                                        } }, children: "\u53D6\u6D88\u6316\u6398" })] }), _jsx("progress", { value: job.progress, max: 1 }), _jsxs("p", { children: ["\u5B8C\u6210 ", job.completed, " \u00B7 \u5931\u8D25 ", job.failed, " \u00B7 \u672A\u5904\u7406 ", job.unprocessed, " \u00B7 \u5171 ", job.total_samples, " \u5F20"] }), _jsx("p", { className: "iad-muted", children: job.message }), job.knowledge_version_id && _jsx("button", { onClick: () => workspace.updateView(pageId, { version: job.knowledge_version_id, tab: "results" }), children: "\u67E5\u770B\u5DF2\u53D1\u5E03\u7248\u672C" }), job.errors.length > 0 && _jsxs("details", { children: [_jsx("summary", { children: "\u5931\u8D25\u8BE6\u60C5" }), job.errors.map((error, index) => _jsx("p", { children: error.message }, index))] })] }, job.run_id)), !jobs.length && _jsx("p", { children: "\u5C1A\u65E0\u6316\u6398\u4F5C\u4E1A\u3002" })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
}
