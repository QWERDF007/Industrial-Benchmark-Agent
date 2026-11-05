import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select } from './Select.js';
import { Button } from './Button.js';
import { ThumbnailCard } from "./ThumbnailCard.js";
import { IconButton } from "./IconButton.js";
import { useEffect, useRef, useState } from "react";
import { message, request } from "../api.js";
import { Modal } from "./Modal.js";
import { ImageViewer } from "./ImageViewer.js";
import { MediaLoad } from "./MediaLoad.js";
import { directionEvidence, ReferencedText } from "../direction-evidence.js";
export function DirectionDetail({ snapshot, direction, onClose, onGo, }) {
    const [imageIndex, setImageIndex] = useState(null), [expanded, setExpanded] = useState(false), [focused, setFocused] = useState(null), [previewed, setPreviewed] = useState("");
    const [destination, setDestination] = useState(direction.applies_to === "defect" ? "defect" : "normal");
    const [promptOpen, setPromptOpen] = useState(false), [promptRevision, setPromptRevision] = useState(0), [frozenPrompt, setFrozenPrompt] = useState(snapshot.request.prompt || null), [promptError, setPromptError] = useState(""), [promptLoading, setPromptLoading] = useState(false);
    useEffect(() => {
        if (!promptOpen || frozenPrompt)
            return;
        const controller = new AbortController();
        setPromptLoading(true);
        setPromptError("");
        request(`/exploration/status/${encodeURIComponent(snapshot.run_id)}`, undefined, undefined, controller.signal)
            .then((job) => {
            if (!controller.signal.aborted) {
                setPromptLoading(false);
                setFrozenPrompt(job.exploration_prompt);
                if (!job.exploration_prompt)
                    setPromptError("原任务未记录提示词。");
            }
        })
            .catch((error) => {
            if (!controller.signal.aborted)
                setPromptError(message(error));
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setPromptLoading(false);
        });
        return () => controller.abort();
    }, [promptOpen, promptRevision, snapshot.run_id, frozenPrompt]);
    const buttons = useRef(new Map());
    const { entries, references, counters } = directionEvidence(snapshot, direction);
    const collection = {
        title: direction.title,
        instruction: direction.instruction,
        index: imageIndex || 0,
        images: entries.flatMap((entry) => entry.evidence
            ? [
                {
                    id: entry.id,
                    originalSize: entry.evidence.image.original_size,
                    label: entry.label,
                    group: entry.kind === "normal"
                        ? "候选良品"
                        : entry.kind === "defect"
                            ? "候选异常"
                            : "其他证据",
                    image: {
                        src: `/api/iad/exploration/evidence/${encodeURIComponent(snapshot.version_id)}/${encodeURIComponent(entry.id)}`,
                        title: entry.title,
                        width: entry.evidence.image.sent_size[0],
                        height: entry.evidence.image.sent_size[1], sampleId: entry.evidence.sample_id, evidence: entry.evidence.image,
                    },
                },
            ]
            : []),
    };
    useEffect(() => {
        if (focused) {
            const element = buttons.current.get(focused.id);
            element?.scrollIntoView({ block: "nearest" });
            element?.focus({ preventScroll: true });
        }
    }, [focused, expanded]);
    const locate = (id) => {
        setExpanded(true);
        setFocused({ id });
    };
    const preview = (id, active) => {
        if (active)
            setExpanded(true);
        setPreviewed((current) => active ? id : current === id ? "" : current);
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Modal, { title: direction.title, className: "iad-direction-dialog", onClose: onClose, children: [_jsxs("div", { className: "iad-direction-body", children: [_jsxs("div", { className: "iad-direction-meta", children: [_jsx("span", { children: "\u5019\u9009\u65B9\u5411" }), _jsx("span", { children: direction.applies_to === "both"
                                            ? "良品与异常"
                                            : direction.applies_to === "normal"
                                                ? "良品"
                                                : "异常" }), _jsxs("span", { title: snapshot.version_id, children: ["\u6765\u6E90 ", snapshot.created_at.slice(0, 19).replace("T", " ")] })] }), _jsxs("section", { className: "iad-direction-objective", children: [_jsx("h3", { children: "\u89C2\u5BDF\u76EE\u6807" }), _jsx("p", { children: _jsx(ReferencedText, { text: direction.instruction, references: references, onReference: locate, onPreview: preview }) })] }), _jsxs("div", { className: "iad-direction-text-grid", children: [_jsxs("section", { children: [_jsx("h3", { children: "\u6BD4\u8F83\u4F9D\u636E" }), _jsx("p", { children: _jsx(ReferencedText, { text: direction.rationale, references: references, onReference: locate, onPreview: preview }) })] }), _jsxs("section", { children: [_jsx("h3", { children: "\u9650\u5236\u4E0E\u5F85\u786E\u8BA4" }), direction.limitations.length ? (_jsx("ul", { children: direction.limitations.map((text, index) => (_jsx("li", { children: _jsx(ReferencedText, { text: text, references: references, onReference: locate, onPreview: preview }) }, index))) })) : (_jsx("p", { className: "iad-muted", children: "\u672A\u8BB0\u5F55\u9650\u5236\u3002" }))] })] }), _jsxs("section", { className: "iad-direction-evidence", children: [_jsxs("h3", { children: ["\u56FE\u50CF\u8BC1\u636E\uFF0C", entries.length] }), _jsx("div", { className: "iad-evidence-groups", style: {
                                            "--iad-normal-width": `${Math.max(counters.normal, 1)}fr`,
                                            "--iad-defect-width": `${Math.max(counters.defect, 1)}fr`,
                                        }, children: [
                                            ["normal", "候选良品"],
                                            ["defect", "候选异常"],
                                            ["unknown", "其他与缺失"],
                                        ].map(([kind, label]) => {
                                            const group = entries.filter((entry) => entry.kind === kind);
                                            return (!!group.length && (_jsxs("section", { className: "iad-evidence-group", children: [_jsxs("h4", { children: [label, " ", _jsxs("span", { children: [group.length, " \u5F20"] })] }), _jsx(MediaLoad, { className: "iad-evidence-thumbnails", children: _jsx("div", { style: {
                                                                "--iad-evidence-columns": Math.min(group.length, 8),
                                                            }, children: group
                                                                .slice(0, expanded ? undefined : 8)
                                                                .map((entry) => {
                                                                const item = collection.images.find((item) => item.id === entry.id);
                                                                return item ? (_jsx(ThumbnailCard, { ref: (element) => {
                                                                        if (element)
                                                                            buttons.current.set(entry.id, element);
                                                                        else
                                                                            buttons.current.delete(entry.id);
                                                                    }, src: item.image.src, label: item.label, "data-focused": (previewed || focused?.id) === entry.id, "aria-label": `查看证据 ${entry.label}`, onClick: () => setImageIndex(collection.images.indexOf(item)) }, entry.id)) : (_jsxs("div", { className: "iad-missing-evidence", role: "status", children: ["\u8BC1\u636E\u7F3A\u5931", _jsx("code", { children: entry.id })] }, entry.id));
                                                            }) }) }), !expanded && group.length > 8 && (_jsxs("button", { onClick: () => setExpanded(true), children: ["\u5C55\u5F00\u66F4\u591A\uFF0C", group.length - 8, " \u5F20"] }))] }, kind)));
                                        }) })] }), _jsxs("details", { className: "iad-direction-trace", children: [_jsx("summary", { children: "\u5B8C\u6574 ID \u4E0E\u6765\u6E90\u660E\u7EC6" }), _jsxs("dl", { children: [_jsx("dt", { children: "\u65B9\u5411 ID" }), _jsx("dd", { children: direction.direction_id }), _jsx("dt", { children: "\u7248\u672C ID" }), _jsx("dd", { children: snapshot.version_id }), _jsx("dt", { children: "\u4F5C\u4E1A ID" }), _jsx("dd", { children: snapshot.run_id })] }), entries.map((entry) => (_jsxs("p", { children: [entry.label, "\uFF0C", entry.id, _jsx("br", {}), entry.evidence?.sample_id || "未记录来源"] }, entry.id))), _jsxs("details", { open: promptOpen, onToggle: (event) => setPromptOpen(event.currentTarget.open), children: [_jsx("summary", { children: "\u63A2\u7D22\u51BB\u7ED3\u63D0\u793A\u8BCD" }), promptLoading ? (_jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u539F\u4EFB\u52A1\u63D0\u793A\u8BCD\u2026" })) : frozenPrompt ? (_jsx("pre", { className: "iad-observation", children: frozenPrompt.text })) : (_jsxs("p", { children: [promptError || "未记录", _jsx(IconButton, { icon: "refresh", label: "\u91CD\u65B0\u8BFB\u53D6\u63D0\u793A\u8BCD", onClick: () => setPromptRevision((value) => value + 1) })] }))] })] })] }), _jsxs("footer", { className: "iad-direction-footer", children: [_jsx("button", { onClick: onClose, children: "\u8FD4\u56DE" }), onGo && (_jsxs(_Fragment, { children: [_jsxs("label", { className: "iad-direction-destination", children: ["\u7528\u4E8E\u77E5\u8BC6\u7C7B\u578B", _jsx(Select, { "aria-label": "\u91C7\u7528\u77E5\u8BC6\u7C7B\u578B", value: destination, onChange: (event) => setDestination(event.target.value), children: [
                                                    ["normal", "良品"],
                                                    ["defect", "异常"],
                                                ]
                                                    .filter(([kind]) => direction.applies_to === "both" ||
                                                    direction.applies_to === kind)
                                                    .map(([kind, label]) => (_jsx("option", { value: kind, children: label }, kind))) })] }), _jsx(Button, { variant: "primary", onClick: () => onGo(destination), children: "\u53BB\u77E5\u8BC6\u6316\u6398" })] }))] })] }), imageIndex !== null && collection.images[imageIndex] && (_jsx(ImageViewer, { image: collection.images[imageIndex].image, collection: collection, onClose: () => setImageIndex(null) }))] }));
}
