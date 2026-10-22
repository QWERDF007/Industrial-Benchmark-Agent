import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { useJobs } from "../useJobs.js";
import { jobStatuses, jobPhases } from "../../shared/job-display.js";
import { ExplorationSources } from "./ExplorationSources.js";
import { ImageViewer } from "./ImageViewer.js";
import { useWorkbenchModel } from '../models.js';
export function ExplorationPage({ dataset, refreshRevision }) {
    const model = useWorkbenchModel();
    const { workspace } = useWorkspace(), pageId = "industrial-exploration", view = workspace.view(pageId);
    const [catalog, setCatalog] = useState(null), [revision, setRevision] = useState(0);
    const [error, setError] = useState(""), [busy, setBusy] = useState(false), [normalSelecting, setNormalSelecting] = useState(false), [defectSelecting, setDefectSelecting] = useState(false);
    const [image, setImage] = useState(null);
    const changed = useCallback(() => setRevision(v => v + 1), []);
    const jobs = useJobs("exploration", dataset.dataset_id, changed, view.job);
    useEffect(() => {
        const controller = new AbortController();
        const query = new URLSearchParams({ dataset_id: dataset.dataset_id });
        if (view.version)
            query.set("version_id", view.version);
        request(`/exploration?${query}`, undefined, undefined, controller.signal)
            .then(value => { if (!controller.signal.aborted) {
            setCatalog(value);
            setError("");
        } }).catch(e => { if (!controller.signal.aborted)
            setError(message(e)); });
        return () => controller.abort();
    }, [dataset.dataset_id, view.version, revision, refreshRevision]);
    const active = jobs.jobs.find(j => j.status === "RUNNING" || j.status === "PENDING");
    const blocked = busy || !!active;
    const normalCount = Number(view.explorationNormalCount), defectCount = Number(view.explorationDefectCount);
    const valid = Number.isInteger(normalCount) && normalCount > 0 && Number.isInteger(defectCount) && defectCount > 0
        && view.explorationNormalImages.length === normalCount && view.explorationDefectImages.length === defectCount;
    async function run(path, body) {
        setBusy(true);
        setError("");
        try {
            const job = await request(path, body || {});
            if (workspace.getSnapshot().datasetId === dataset.dataset_id)
                workspace.updateView(pageId, { job: job.run_id });
            jobs.refresh();
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    const result = catalog?.exploration;
    return _jsxs("div", { className: "iad-exploration-page", children: [(error || jobs.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || jobs.error }), _jsxs("section", { className: "iad-info-group", children: [_jsxs("div", { className: "iad-section-header", children: [_jsx("h2", { children: "\u8054\u5408\u63A2\u7D22\u68C0\u67E5\u65B9\u5411" }), _jsx("button", { className: "iad-primary", disabled: blocked || normalSelecting || defectSelecting || !valid || !model.ready, onClick: () => void run("/exploration/start", {
                                    dataset_id: dataset.dataset_id, normal_images: view.explorationNormalImages, defect_images: view.explorationDefectImages,
                                    ...(view.explorationObjective.trim() ? { objective: view.explorationObjective } : {}),
                                }), children: busy ? "提交中…" : "开始方向探索" })] }), _jsxs("label", { className: "iad-field", children: ["\u63A2\u7D22\u76EE\u6807\uFF08\u53EF\u9009\uFF09", _jsx("textarea", { "aria-label": "\u65B9\u5411\u63A2\u7D22\u76EE\u6807", disabled: blocked, value: view.explorationObjective, rows: 2, onChange: e => workspace.updateView(pageId, { explorationObjective: e.target.value }, true) })] }), _jsxs("div", { className: "iad-exploration-groups", children: [_jsx(ExplorationSources, { dataset: dataset, kind: "normal", disabled: blocked, count: view.explorationNormalCount, images: view.explorationNormalImages, onCount: explorationNormalCount => workspace.updateView(pageId, { explorationNormalCount }), onImages: explorationNormalImages => { if (workspace.getSnapshot().datasetId === dataset.dataset_id)
                                    workspace.updateView(pageId, { explorationNormalImages }); }, onSelecting: setNormalSelecting }), _jsx(ExplorationSources, { dataset: dataset, kind: "defect", disabled: blocked, count: view.explorationDefectCount, images: view.explorationDefectImages, onCount: explorationDefectCount => workspace.updateView(pageId, { explorationDefectCount }), onImages: explorationDefectImages => { if (workspace.getSnapshot().datasetId === dataset.dataset_id)
                                    workspace.updateView(pageId, { explorationDefectImages }); }, onSelecting: setDefectSelecting })] }), _jsxs("p", { className: "iad-muted", children: ["\u4E24\u7EC4\u5171 ", view.explorationNormalImages.length + view.explorationDefectImages.length, " \u5F20\u8054\u5408\u89C2\u5BDF\u3002\u6765\u6E90\u89D2\u8272\u4E3A\u5019\u9009\uFF0C\u63A2\u7D22\u7ED3\u679C\u9700\u9009\u62E9\u540E\u4F7F\u7528\u3002"] })] }), active && _jsxs("p", { role: "status", children: [active.cancel_requested ? "正在停止方向探索" : "方向探索执行中", " \u00B7 ", jobPhases[active.phase || ""] || active.message, " \u00B7 ", active.total_samples, " \u5F20"] }), _jsxs("details", { className: "iad-info-group", children: [_jsxs("summary", { children: ["\u63A2\u7D22\u4F5C\u4E1A \u00B7 ", jobs.jobs.length] }), jobs.jobs.map(job => _jsxs("article", { className: "iad-job", children: [_jsxs("div", { className: "iad-row", children: [_jsx("strong", { children: jobStatuses[job.status] }), _jsxs("span", { children: [job.model_profile?.provider_name ? `${job.model_profile.provider_name} · ` : '', job.model_name] }), _jsxs("span", { children: [job.completed + job.failed, " / ", job.total_samples, " \u5F20"] }), job.status === "RUNNING" || job.status === "PENDING" ? _jsx("button", { disabled: busy || job.cancel_requested, onClick: () => void run(`/exploration/cancel/${job.run_id}`), children: job.cancel_requested ? "正在停止…" : "取消" }) : job.status !== "COMPLETED" && _jsx("button", { disabled: blocked, onClick: () => void run(`/exploration/retry/${job.run_id}`), children: "\u6309\u539F\u56FE\u7EC4\u91CD\u8BD5" })] }), _jsx("p", { children: jobPhases[job.phase || ""] || job.message }), job.errors.length > 0 && _jsxs("details", { children: [_jsx("summary", { children: "\u5931\u8D25\u8BE6\u60C5" }), job.errors.map(item => _jsxs("p", { children: [item.relative_path, "\uFF1A", item.message] }, item.sample_id))] }), job.exploration_version_id && _jsx("button", { onClick: () => workspace.updateView(pageId, { version: job.exploration_version_id, job: job.run_id }), children: "\u67E5\u770B\u63A2\u7D22\u7ED3\u679C" })] }, job.run_id))] }), _jsxs("section", { className: "iad-info-group", children: [_jsxs("div", { className: "iad-section-header", children: [_jsx("h2", { children: "\u63A2\u7D22\u7ED3\u679C" }), _jsxs("select", { "aria-label": "\u63A2\u7D22\u7ED3\u679C\u7248\u672C", value: result?.version_id || "", onChange: e => workspace.updateView(pageId, { version: e.target.value }), children: [_jsx("option", { value: "", disabled: true, children: "\u9009\u62E9\u7ED3\u679C\u7248\u672C" }), catalog?.versions.map(v => _jsxs("option", { value: v.version_id, children: [v.created_at.slice(0, 19).replace("T", " "), " \u00B7 ", v.direction_count, " \u9879\u65B9\u5411"] }, v.version_id))] })] }), !result && _jsx("p", { className: "iad-muted", children: "\u5C1A\u65E0\u5DF2\u5B8C\u6210\u7684\u65B9\u5411\u63A2\u7D22\u3002" }), result && _jsxs(_Fragment, { children: [_jsx("p", { children: result.summary }), _jsx("div", { className: "iad-row", children: [['normal', '良品'], ['defect', '异常']].map(([kind, label]) => _jsxs("button", { onClick: () => workspace.openLocation({ pageId: "industrial-knowledge", datasetId: dataset.dataset_id, knowledgeKind: kind, explorationVersion: result.version_id }), children: ["\u7528\u4E8E", label, "\u77E5\u8BC6\u6316\u6398"] }, kind)) }), !result.directions.length && _jsx("p", { children: "\u672C\u6279\u6837\u4F8B\u672A\u5F62\u6210\u53EF\u7528\u63A2\u7D22\u65B9\u5411\u3002" }), result.directions.map(direction => _jsxs("article", { className: "iad-discovery-area", children: [_jsxs("h3", { children: [direction.title, " ", _jsx("small", { className: "iad-muted", children: direction.applies_to === "both" ? "良品与异常" : direction.applies_to === "normal" ? "良品" : "异常" })] }), _jsx("p", { children: direction.instruction }), _jsxs("details", { children: [_jsx("summary", { children: "\u4F9D\u636E\u4E0E\u9650\u5236" }), _jsx("p", { children: direction.rationale }), direction.limitations.map((v, i) => _jsx("p", { children: v }, i)), _jsx("div", { className: "iad-reference-grid", children: direction.evidence_ids.map(id => {
                                                    const src = `/api/iad/exploration/evidence/${encodeURIComponent(result.version_id)}/${encodeURIComponent(id)}`;
                                                    return _jsx("button", { "aria-label": `查看方向证据 ${direction.title}`, onClick: () => setImage({ src, title: direction.title }), children: _jsx("img", { src: src, alt: direction.title, loading: "lazy" }) }, id);
                                                }) })] })] }, direction.direction_id)), !!result.limitations.length && _jsxs("details", { children: [_jsx("summary", { children: "\u6574\u4F53\u9650\u5236" }), result.limitations.map((v, i) => _jsx("p", { children: v }, i))] })] })] }), image && _jsx(ImageViewer, { image: image, onClose: () => setImage(null) })] });
}
