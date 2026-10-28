import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { useWorkbenchModel, WorkbenchModelStatus } from "../models.js";
import { ExplorationSources } from "./ExplorationSources.js";
import { ExplorationPromptEditor } from "./ExplorationPromptEditor.js";
import { ExplorationProgress } from "./ExplorationProgress.js";
import { Modal } from "./Modal.js";
export function ExplorationSetup({ dataset, jobs, refreshRevision, }) {
    const { workspace } = useWorkspace(), pageId = "industrial-exploration", view = workspace.view(pageId);
    const model = useWorkbenchModel();
    const [presets, setPresets] = useState([]), [presetError, setPresetError] = useState("");
    const [error, setError] = useState(""), [busy, setBusy] = useState(false), [normalSelecting, setNormalSelecting] = useState(false), [defectSelecting, setDefectSelecting] = useState(false), [preview, setPreview] = useState(false), [uncertainAfter, setUncertainAfter] = useState(null);
    const [enteredAt] = useState(Date.now);
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    useEffect(() => jobs.refresh(), [jobs.refresh]);
    useEffect(() => {
        const controller = new AbortController();
        request("/exploration/presets", undefined, undefined, controller.signal)
            .then((value) => {
            if (controller.signal.aborted)
                return;
            setPresets(value.presets);
            setPresetError("");
            const current = workspace.view(pageId);
            const original = value.presets.find((preset) => preset.id === current.explorationPrompt?.preset_id);
            if (current.explorationPrompt &&
                !current.explorationPromptBase &&
                original &&
                workspace.getSnapshot().datasetId === dataset.dataset_id)
                workspace.updateView(pageId, { explorationPromptBase: original.text }, true);
            if (!workspace.view(pageId).explorationPrompt &&
                workspace.getSnapshot().datasetId === dataset.dataset_id) {
                const preset = value.presets[0];
                workspace.updateView(pageId, {
                    explorationPrompt: {
                        preset_id: preset.id,
                        preset_name: preset.name,
                        text: preset.text,
                    },
                    explorationPromptBase: preset.text,
                }, true);
            }
        })
            .catch((error) => {
            if (!controller.signal.aborted)
                setPresetError(message(error));
        });
        return () => controller.abort();
    }, [dataset.dataset_id, workspace, refreshRevision]);
    const active = jobs.jobs.find((job) => job.status === "RUNNING"), occupied = active || jobs.pendingCount > 0;
    const normalCount = Number(view.explorationNormalCount), defectCount = Number(view.explorationDefectCount);
    const valid = Number.isInteger(normalCount) &&
        normalCount > 0 &&
        Number.isInteger(defectCount) &&
        defectCount > 0 &&
        view.explorationNormalImages.length === normalCount &&
        view.explorationDefectImages.length === defectCount;
    const unconfirmed = uncertainAfter !== null &&
        (!jobs.lastSyncedAt || jobs.lastSyncedAt < uncertainAfter);
    const reason = busy
        ? "正在提交本次探索。"
        : normalSelecting || defectSelecting
            ? "请先完成图组选择。"
            : jobs.syncState === "stale" ||
                !jobs.lastSyncedAt ||
                jobs.lastSyncedAt < enteredAt ||
                unconfirmed
                ? "请先同步作业状态，确认已有提交。"
                : !view.explorationPrompt?.text.trim()
                    ? "请填写提示词正文。"
                    : !valid
                        ? "请按目标数量选择两组图像。"
                        : !model.ready
                            ? "请先配置工作台模型。"
                            : "";
    async function run() {
        setBusy(true);
        setError("");
        try {
            const job = await request("/exploration/start", {
                dataset_id: dataset.dataset_id,
                normal_images: view.explorationNormalImages,
                defect_images: view.explorationDefectImages,
                prompt: view.explorationPrompt,
                ...(view.explorationObjective.trim()
                    ? { objective: view.explorationObjective }
                    : {}),
            });
            if (!alive.current)
                return;
            const current = workspace.getSnapshot();
            if (current.datasetId === dataset.dataset_id && current.pageId === pageId)
                workspace.updateView(pageId, { job: job.run_id, tab: "jobs" });
            jobs.refresh();
        }
        catch (error) {
            if (alive.current) {
                setError(message(error));
                setUncertainAfter(Date.now());
                jobs.refresh();
            }
        }
        finally {
            if (alive.current)
                setBusy(false);
        }
    }
    return (_jsxs(_Fragment, { children: [error && (_jsx("p", { role: "alert", className: "iad-error", children: error })), _jsxs("div", { className: "iad-exploration-setup-layout", "aria-label": "\u65B9\u5411\u63A2\u7D22\u914D\u7F6E", children: [_jsxs("div", { className: "iad-exploration-fields iad-panel", children: [_jsxs("section", { className: "iad-setup-section", children: [_jsx("h3", { children: "1. \u63A2\u7D22\u63D0\u793A\u8BCD" }), presetError && _jsx("p", { role: "alert", children: presetError }), view.explorationPrompt ? (_jsx(ExplorationPromptEditor, { presets: presets, value: view.explorationPrompt, base: view.explorationPromptBase, disabled: busy, onChange: (explorationPrompt, explorationPromptBase) => {
                                            if (workspace.getSnapshot().datasetId === dataset.dataset_id)
                                                workspace.updateView(pageId, { explorationPrompt, explorationPromptBase }, true);
                                        }, onCreated: (preset) => setPresets((values) => [...values, preset]) })) : (_jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u63D0\u793A\u8BCD\u9884\u8BBE\u2026" })), _jsxs("label", { className: "iad-field", children: ["\u8865\u5145\u76EE\u6807\uFF08\u53EF\u9009\uFF09", _jsx("textarea", { "aria-label": "\u65B9\u5411\u63A2\u7D22\u76EE\u6807", disabled: busy, value: view.explorationObjective, rows: 2, onChange: (event) => workspace.updateView(pageId, { explorationObjective: event.target.value }, true) })] })] }), _jsxs("section", { className: "iad-setup-section", children: [_jsx("h3", { children: "2. \u5BF9\u6BD4\u6837\u4F8B" }), _jsxs("div", { className: "iad-exploration-groups", children: [_jsx(ExplorationSources, { dataset: dataset, kind: "normal", disabled: busy, count: view.explorationNormalCount, images: view.explorationNormalImages, onCount: (explorationNormalCount) => workspace.updateView(pageId, { explorationNormalCount }), onImages: (explorationNormalImages) => {
                                                    if (workspace.getSnapshot().datasetId === dataset.dataset_id)
                                                        workspace.updateView(pageId, { explorationNormalImages });
                                                }, onSelecting: setNormalSelecting }), _jsx(ExplorationSources, { dataset: dataset, kind: "defect", disabled: busy, count: view.explorationDefectCount, images: view.explorationDefectImages, onCount: (explorationDefectCount) => workspace.updateView(pageId, { explorationDefectCount }), onImages: (explorationDefectImages) => {
                                                    if (workspace.getSnapshot().datasetId === dataset.dataset_id)
                                                        workspace.updateView(pageId, { explorationDefectImages });
                                                }, onSelecting: setDefectSelecting })] })] })] }), _jsxs("aside", { className: "iad-exploration-side", children: [_jsxs("section", { className: "iad-panel", children: [_jsx("h3", { children: "3. \u8FD0\u884C\u786E\u8BA4" }), _jsx(WorkbenchModelStatus, {}), _jsxs("dl", { children: [_jsx("dt", { children: "\u63D0\u793A\u8BCD" }), _jsxs("dd", { children: [view.explorationPrompt?.preset_name || "自定义提示词", view.explorationPrompt &&
                                                        view.explorationPrompt.text !== view.explorationPromptBase &&
                                                        " · 已修改"] }), _jsx("dt", { children: "\u8F93\u5165\u56FE\u7EC4" }), _jsxs("dd", { children: ["\u826F\u54C1 ", view.explorationNormalImages.length, " \u00B7 \u5F02\u5E38", " ", view.explorationDefectImages.length] }), _jsx("dt", { children: "\u6267\u884C\u65B9\u5F0F" }), _jsx("dd", { children: "\u5168\u90E8\u56FE\u50CF\u4E00\u6B21\u8054\u5408\u8F93\u5165" })] }), _jsx("button", { disabled: !view.explorationPrompt, onClick: () => setPreview(true), children: "\u67E5\u770B\u672C\u6B21\u6267\u884C\u6587\u672C" }), _jsxs("div", { className: "iad-form-footer", children: [reason && _jsx("p", { className: "iad-muted", children: reason }), _jsx("button", { className: "iad-primary", disabled: !!reason, onClick: () => void run(), children: busy ? "提交中…" : occupied ? "加入队列" : "开始探索" })] })] }), _jsxs("section", { className: "iad-panel iad-execution-rail", children: [_jsx("h3", { children: "\u8FD0\u884C\u961F\u5217" }), active ? (_jsxs(_Fragment, { children: [_jsx(ExplorationProgress, { job: active, stale: jobs.syncState === "stale", lastSyncedAt: jobs.lastSyncedAt }), _jsx("button", { onClick: () => workspace.updateView(pageId, {
                                                    tab: "jobs",
                                                    job: active.run_id,
                                                }), children: "\u67E5\u770B\u8FD0\u884C\u72B6\u6001" })] })) : (_jsx("p", { className: "iad-muted", children: "\u6682\u65E0\u8FD0\u884C\u4EFB\u52A1\u3002" })), jobs.pendingCount > 0 && _jsxs("p", { children: ["\u6392\u961F ", jobs.pendingCount, " \u9879"] })] })] })] }), " ", preview && (_jsxs(Modal, { title: "\u672C\u6B21\u63A2\u7D22\u63D0\u793A\u8BCD", onClose: () => setPreview(false), children: [_jsxs("pre", { className: "iad-observation", children: [view.explorationPrompt?.text, view.explorationObjective.trim() &&
                                `\n\n补充目标：${view.explorationObjective}`] }), _jsx("button", { onClick: () => setPreview(false), children: "\u5173\u95ED" })] }))] }));
}
