import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { useJobs } from "../useJobs.js";
import { DirectionDetail } from "./DirectionDetail.js";
import { ExplorationSetup } from "./ExplorationSetup.js";
import { JobSync } from "./JobSync.js";
import { JobTable } from "./JobTable.js";
import { WorkbenchHeader } from "./layout/WorkbenchHeader.js";
import { PageTabs } from "./layout/PageTabs.js";
export function ExplorationPage({ dataset, refreshRevision, headerActions, }) {
    const { workspace } = useWorkspace(), pageId = "industrial-exploration", view = workspace.view(pageId);
    const [catalog, setCatalog] = useState(null), [revision, setRevision] = useState(0);
    const [error, setError] = useState("");
    const [detail, setDetail] = useState(null);
    const changed = useCallback(() => setRevision((value) => value + 1), []);
    const jobs = useJobs("exploration", dataset.dataset_id, changed, view.job, refreshRevision);
    useEffect(() => {
        const controller = new AbortController();
        const query = new URLSearchParams({ dataset_id: dataset.dataset_id });
        if (view.version)
            query.set("version_id", view.version);
        request(`/exploration?${query}`, undefined, undefined, controller.signal)
            .then((value) => {
            if (!controller.signal.aborted) {
                setCatalog((previous) => !view.version && previous?.exploration
                    ? { ...value, exploration: previous.exploration }
                    : value);
                setError("");
            }
        })
            .catch((error) => {
            if (!controller.signal.aborted)
                setError(message(error));
        });
        return () => controller.abort();
    }, [dataset.dataset_id, view.version, revision, refreshRevision]);
    const active = jobs.jobs.find((job) => job.status === "RUNNING");
    function refresh() {
        jobs.refresh();
        changed();
    }
    function copy(job) {
        const input = job.exploration_request;
        if (!input)
            return;
        const prompt = job.exploration_prompt;
        workspace.updateView(pageId, {
            tab: "setup",
            explorationNormalImages: [...input.normal_images],
            explorationDefectImages: [...input.defect_images],
            explorationNormalCount: String(input.normal_images.length),
            explorationDefectCount: String(input.defect_images.length),
            explorationObjective: input.objective || "",
            explorationPrompt: prompt,
            explorationPromptBase: prompt?.preset_id ? "" : prompt?.text || "",
        });
    }
    const result = catalog?.exploration, latest = catalog?.versions[0];
    return (_jsxs("div", { className: "iad-exploration-page", children: [_jsxs(WorkbenchHeader, { pageId: pageId, title: view.tab === "setup" ? "新建探索" : undefined, children: [headerActions, _jsx("button", { className: view.tab === "setup" ? "" : "iad-primary", onClick: () => workspace.updateView(pageId, {
                            tab: view.tab === "setup" ? "results" : "setup",
                        }), children: view.tab === "setup" ? "返回探索结果" : "新建探索" })] }), _jsx(JobSync, { ...jobs, refresh: refresh }), error && (_jsx("p", { role: "alert", className: "iad-error", children: error })), view.tab === "setup" ? (_jsx(ExplorationSetup, { dataset: dataset, jobs: jobs, refreshRevision: refreshRevision })) : (_jsx(PageTabs, { label: "\u65B9\u5411\u63A2\u7D22\u89C6\u56FE", items: [
                    { id: "results", label: "探索结果" },
                    { id: "jobs", label: "探索作业" },
                ], value: view.tab, onChange: (tab) => workspace.updateView(pageId, { tab }), children: view.tab === "jobs" ? (_jsxs("section", { className: "iad-job-section", children: [_jsxs("div", { className: "iad-section-header", children: [_jsx("h2", { children: "\u63A2\u7D22\u4F5C\u4E1A" }), _jsxs("span", { children: ["\u6392\u961F ", jobs.pendingCount, " \u9879"] })] }), _jsx(JobTable, { jobs: jobs.jobs, pageId: pageId, onChanged: jobs.refresh, stale: jobs.syncState === "stale", lastSyncedAt: jobs.lastSyncedAt, onCopy: copy })] })) : !result ? (_jsxs("div", { className: "iad-empty", children: [_jsx("h2", { children: active || jobs.pendingCount ? "探索正在进行" : "尚无探索结果" }), _jsx("p", { children: active || jobs.pendingCount
                                ? "整组结果返回后发布方向。"
                                : "选择良品和异常样例，建立适合当前数据集的探索方向。" }), _jsx("button", { className: "iad-primary", onClick: () => workspace.updateView(pageId, {
                                tab: active || jobs.pendingCount ? "jobs" : "setup",
                            }), children: active || jobs.pendingCount ? "查看运行状态" : "新建探索" })] })) : (_jsxs("section", { className: "iad-exploration-results", children: [_jsxs("div", { className: "iad-section-header", children: [_jsx("h2", { children: "\u5019\u9009\u65B9\u5411" }), _jsx("select", { "aria-label": "\u63A2\u7D22\u7ED3\u679C\u7248\u672C", value: result.version_id, onChange: (event) => workspace.updateView(pageId, {
                                        version: event.target.value,
                                    }), children: catalog.versions.map((version) => (_jsxs("option", { value: version.version_id, children: [version.created_at.slice(0, 19).replace("T", " "), " \u00B7", " ", version.direction_count, " \u9879\u65B9\u5411"] }, version.version_id))) })] }), latest && latest.version_id !== result.version_id && (_jsx("button", { onClick: () => workspace.updateView(pageId, { version: latest.version_id }), children: "\u67E5\u770B\u65B0\u53D1\u5E03\u7ED3\u679C" })), _jsx("p", { className: "iad-muted", children: result.summary }), result.directions.length ? (_jsx("div", { className: "iad-table-scroll", children: _jsxs("table", { className: "iad-resource-table", "aria-label": "\u63A2\u7D22\u65B9\u5411", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u65B9\u5411" }), _jsx("th", { children: "\u9002\u7528\u77E5\u8BC6" }), _jsx("th", { className: "iad-number", children: "\u8BC1\u636E" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: result.directions.map((direction) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("strong", { children: direction.title }) }), _jsx("td", { children: direction.applies_to === "both"
                                                        ? "良品与异常"
                                                        : direction.applies_to === "normal"
                                                            ? "良品"
                                                            : "异常" }), _jsx("td", { className: "iad-number", children: direction.evidence_ids.length }), _jsx("td", { children: _jsx("button", { onClick: () => setDetail({ snapshot: result, direction }), children: "\u67E5\u770B\u65B9\u5411" }) })] }, direction.direction_id))) })] }) })) : (_jsx("p", { children: "\u672C\u6279\u6837\u4F8B\u672A\u5F62\u6210\u53EF\u7528\u63A2\u7D22\u65B9\u5411\u3002" })), !!result.limitations.length && (_jsxs("details", { children: [_jsx("summary", { children: "\u6574\u4F53\u9650\u5236" }), result.limitations.map((text, index) => (_jsx("p", { children: text }, index)))] }))] })) })), detail && (_jsx(DirectionDetail, { ...detail, onClose: () => setDetail(null), onGo: (kind) => workspace.openLocation({
                    pageId: "industrial-knowledge",
                    datasetId: dataset.dataset_id,
                    knowledgeKind: kind,
                    explorationVersion: detail.snapshot.version_id,
                    directionFocus: detail.direction.direction_id,
                    tab: "setup",
                }) }))] }));
}
