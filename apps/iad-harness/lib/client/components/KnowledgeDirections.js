import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { message, request } from "../api.js";
import { useUnsavedChanges } from "../useUnsavedChanges.js";
import { useWorkspace } from "../workspace.js";
import { DirectionDetail } from "./DirectionDetail.js";
import { Modal } from "./Modal.js";
import { MiningDirectionList } from "./MiningDirectionList.js";
export function KnowledgeDirections({ datasetId, kind, proposal, onPending, onProposalUsed, onState, }) {
    const { workspace } = useWorkspace(), view = workspace.view("industrial-knowledge");
    const [catalog, setCatalog] = useState(null), [catalogError, setCatalogError] = useState("");
    const [saved, setSaved] = useState(null), [draft, setDraft] = useState(null);
    const [error, setError] = useState(""), [saving, setSaving] = useState(false), [revision, setRevision] = useState(0);
    const [focus, setFocus] = useState("");
    const [confirmation, setConfirmation] = useState(null), [preview, setPreview] = useState(null);
    const [source, setSource] = useState(null), [opening, setOpening] = useState("");
    const applied = useRef(""), alive = useRef(true);
    const query = new URLSearchParams({ dataset_id: datasetId, kind }).toString();
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        setCatalogError("");
        setCatalog(null);
        const params = new URLSearchParams({ dataset_id: datasetId });
        if (view.explorationVersion)
            params.set("version_id", view.explorationVersion);
        request(`/exploration?${params}`, undefined, undefined, controller.signal)
            .then((value) => {
            if (!controller.signal.aborted)
                setCatalog(value);
        })
            .catch((error) => {
            if (!controller.signal.aborted)
                setCatalogError(message(error));
        });
        return () => controller.abort();
    }, [datasetId, view.explorationVersion]);
    useEffect(() => {
        const controller = new AbortController();
        setSaved(null);
        setDraft(null);
        setError("");
        request(`/knowledge/prompt?${query}`, undefined, undefined, controller.signal)
            .then((value) => {
            if (!controller.signal.aborted) {
                setSaved(value);
                setDraft(value.configuration);
            }
        })
            .catch((error) => {
            if (!controller.signal.aborted)
                setError(message(error));
        });
        return () => controller.abort();
    }, [query, revision]);
    useEffect(() => {
        if (!proposal ||
            !draft ||
            saving ||
            applied.current === proposal.id ||
            proposal.datasetId !== datasetId ||
            proposal.kind !== kind)
            return;
        applied.current = proposal.id;
        onProposalUsed();
        if (draft.directions.some((item) => item.title.trim().toLocaleLowerCase() ===
            proposal.title.trim().toLocaleLowerCase())) {
            setError("已有同名方向，请编辑现有说明。");
            return;
        }
        const directionId = uuid();
        setFocus(directionId);
        setDraft({
            ...draft,
            directions: [
                ...draft.directions,
                {
                    direction_id: directionId,
                    title: proposal.title,
                    instruction: proposal.instruction,
                    enabled: true,
                    origin: "dataset",
                },
            ],
        });
    }, [proposal, draft, saving, datasetId, kind, onProposalUsed]);
    const dirty = !!saved && JSON.stringify(saved.configuration) !== JSON.stringify(draft);
    const invalid = !!draft &&
        (!draft.objective.trim() ||
            draft.directions.some((item) => !item.title.trim() || !item.instruction.trim()) ||
            new Set(draft.directions.map((item) => item.title.trim().toLocaleLowerCase())).size !== draft.directions.length);
    const reason = saving
        ? "正在保存挖掘方向。"
        : invalid
            ? "请填写目标、方向名称和说明，方向名称不能重复。"
            : error
                ? "方向保存或读取失败，请先处理。"
                : !saved
                    ? "正在读取挖掘方向。"
                    : dirty
                        ? "请先保存有效的挖掘方向。"
                        : "";
    useUnsavedChanges(dirty);
    useEffect(() => {
        onPending(!!reason);
        onState?.({
            reason,
            count: saved?.configuration.directions.filter((item) => item.enabled).length ||
                0,
            revision: saved?.revision || "",
        });
    }, [reason, saved, onPending, onState]);
    async function save(reset = false) {
        if (!saved || !draft)
            return;
        setSaving(true);
        setError("");
        try {
            const value = await request("/knowledge/prompt", {
                dataset_id: datasetId,
                kind,
                expected_revision: saved.revision,
                configuration: reset ? null : draft,
            });
            if (alive.current) {
                setSaved(value);
                setDraft(value.configuration);
            }
        }
        catch (error) {
            if (alive.current)
                setError(message(error));
        }
        finally {
            if (alive.current)
                setSaving(false);
        }
    }
    async function openSource(id) {
        setOpening(id);
        setCatalogError("");
        try {
            const value = catalog?.exploration?.directions.some((direction) => direction.direction_id === id)
                ? catalog
                : await request(`/exploration?${new URLSearchParams({ dataset_id: datasetId, direction_id: id })}`);
            const snapshot = value?.exploration, direction = snapshot?.directions.find((item) => item.direction_id === id);
            if (!snapshot || !direction)
                throw new Error("没有找到该方向的原始探索记录。");
            if (alive.current)
                setSource({ snapshot, direction });
        }
        catch (error) {
            if (alive.current)
                setCatalogError(message(error));
        }
        finally {
            if (alive.current)
                setOpening("");
        }
    }
    return (_jsxs("div", { className: "iad-mining-directions", children: [!draft ? (_jsxs("section", { className: "iad-setup-section", children: [_jsx("h3", { children: "2. \u6316\u6398\u76EE\u6807" }), !error && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u6316\u6398\u65B9\u5411\u2026" })] })) : (_jsxs(_Fragment, { children: [_jsxs("section", { className: "iad-setup-section", children: [_jsx("h3", { children: "2. \u6316\u6398\u76EE\u6807" }), _jsxs("label", { className: "iad-field", children: ["\u672C\u6B21\u89C2\u5BDF\u76EE\u6807", _jsx("textarea", { "aria-label": "\u6316\u6398\u76EE\u6807", disabled: saving, rows: 3, value: draft.objective, onChange: (event) => {
                                            setDraft({ ...draft, objective: event.target.value });
                                            setError("");
                                        } })] })] }), _jsxs("section", { className: "iad-setup-section", children: [_jsx("h3", { "data-action": "mining-directions", children: "3. \u6316\u6398\u65B9\u5411" }), _jsxs("fieldset", { className: "iad-directions-form", disabled: saving, children: [catalogError && _jsx("p", { role: "alert", children: catalogError }), _jsx(MiningDirectionList, { configuration: draft, catalog: catalog, opening: opening, focusId: focus || view.directionFocus, savedRevision: saved?.revision || "", onChange: (value) => {
                                            setDraft(value);
                                            setError("");
                                        }, onSource: (id) => void openSource(id) }), invalid && _jsx("p", { role: "alert", children: reason }), _jsxs("div", { className: "iad-direction-savebar", children: [_jsx("span", { className: "iad-muted", children: dirty ? "未保存" : "已保存" }), _jsx("button", { className: "iad-primary", "data-action": "save-mining-directions", disabled: !dirty || invalid || saving, onClick: () => void save(), children: saving ? "保存中…" : "保存方向" }), _jsx("button", { disabled: !dirty || saving, onClick: () => setConfirmation("discard"), children: "\u653E\u5F03\u4FEE\u6539" }), _jsx("button", { disabled: saving || (!saved?.customized && !dirty), onClick: () => setConfirmation("reset"), children: "\u6062\u590D\u9ED8\u8BA4\u65B9\u5411" }), _jsx("button", { disabled: !saved, onClick: () => setPreview(saved), children: "\u9884\u89C8\u5DF2\u4FDD\u5B58\u63D0\u793A\u8BCD" })] })] })] })] })), error && (_jsxs("p", { role: "alert", className: "iad-error", children: [error, " ", _jsx("button", { onClick: () => dirty
                            ? setConfirmation("reload")
                            : setRevision((value) => value + 1), children: "\u91CD\u65B0\u8F7D\u5165" }), _jsx("button", { onClick: () => {
                            void request(`/knowledge/prompt?${query}`)
                                .then((value) => {
                                if (alive.current)
                                    setPreview(value);
                            })
                                .catch((error) => {
                                if (alive.current)
                                    setError(message(error));
                            });
                        }, children: "\u67E5\u770B\u670D\u52A1\u5668\u7248\u672C" })] })), confirmation && (_jsxs(Modal, { title: confirmation === "reset"
                    ? "恢复默认方向？"
                    : confirmation === "discard"
                        ? "放弃修改？"
                        : "载入服务器配置？", className: "iad-confirm-dialog", onClose: () => setConfirmation(null), children: [_jsx("p", { children: confirmation === "reset"
                            ? "恢复默认会移除自定义和已采用方向。"
                            : confirmation === "discard"
                                ? "恢复上次保存的目标和方向。"
                                : "服务器配置将替换当前草稿。" }), _jsxs("div", { className: "iad-form-actions", children: [_jsx("button", { onClick: () => setConfirmation(null), children: "\u4FDD\u7559\u5F53\u524D\u7F16\u8F91" }), _jsx("button", { className: "iad-primary", onClick: () => {
                                    if (confirmation === "reset")
                                        void save(true);
                                    else if (confirmation === "discard") {
                                        setDraft(saved.configuration);
                                        setError("");
                                    }
                                    else
                                        setRevision((value) => value + 1);
                                    setConfirmation(null);
                                }, children: confirmation === "reset"
                                    ? "确认恢复默认"
                                    : confirmation === "discard"
                                        ? "确认放弃"
                                        : "重新载入服务器配置" })] })] })), preview && (_jsxs(Modal, { title: "\u5DF2\u4FDD\u5B58\u7684\u6316\u6398\u63D0\u793A\u8BCD", onClose: () => setPreview(null), children: [_jsxs("p", { className: "iad-muted", title: preview.revision, children: ["\u4FDD\u5B58\u7248\u672C ", preview.revision] }), _jsx("pre", { className: "iad-observation", children: preview.instruction }), _jsx("button", { onClick: () => setPreview(null), children: "\u5173\u95ED" })] })), source && (_jsx(DirectionDetail, { ...source, onClose: () => setSource(null) }))] }));
}
