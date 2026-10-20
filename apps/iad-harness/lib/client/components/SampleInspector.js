import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { AnnotatedImage, ImageViewer } from "./ImageViewer.js";
import { NormalKnowledge } from "./NormalKnowledge.js";
import { auditPhases, mediaUrl, message, request } from "../api.js";
export function SampleInspector({ dataset, sampleId, mode, revision, onChanged }) {
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    const [job, setJob] = useState(null);
    const jobRunning = job?.status === "RUNNING" || job?.status === "PENDING";
    const [reviewer, setReviewer] = useState(localStorage.getItem("iad.reviewer") || "auditor_qc");
    const [comment, setComment] = useState("");
    const [lightbox, setLightbox] = useState(null);
    const activeId = useRef(sampleId);
    const openedAt = useRef(Date.now());
    useEffect(() => {
        activeId.current = sampleId;
        setDetail(null);
        setError("");
        setNotice("");
        setComment("");
        setLightbox(null);
        openedAt.current = Date.now();
        if (!sampleId)
            return;
        const controller = new AbortController();
        request(`/sample/${encodeURIComponent(sampleId)}`, undefined, undefined, controller.signal).then(setDetail).catch(e => {
            if (!controller.signal.aborted)
                setError(message(e));
        });
        return () => controller.abort();
    }, [sampleId, revision]);
    useEffect(() => {
        if (!job)
            return;
        const controller = new AbortController();
        let timer;
        async function refresh() {
            try {
                const latest = await request(`/audit/status/${job.run_id}`, undefined, undefined, controller.signal);
                if (controller.signal.aborted)
                    return;
                setJob(latest);
                if (latest.status === "RUNNING" || latest.status === "PENDING")
                    timer = setTimeout(refresh, 1000);
                else
                    onChanged();
            }
            catch (error) {
                if (!controller.signal.aborted)
                    setError(message(error));
            }
        }
        refresh();
        return () => { controller.abort(); clearTimeout(timer); };
    }, [job?.run_id, onChanged]);
    async function audit() {
        setBusy(true);
        setError("");
        try {
            setJob(await request("/audit/start", { dataset_id: dataset.dataset_id, sample_ids: [sampleId] }));
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    async function setReference() {
        setError("");
        const ids = dataset.reference_sample_ids.includes(sampleId) ? dataset.reference_sample_ids.filter(id => id !== sampleId) : [...dataset.reference_sample_ids, sampleId];
        try {
            await request(`/datasets/${dataset.dataset_id}`, { reference_sample_ids: ids }, "PATCH");
            onChanged();
        }
        catch (e) {
            setError(message(e));
        }
    }
    async function submit(decision) {
        if (!reviewer.trim()) {
            setError("请填写复核人");
            return;
        }
        const id = sampleId;
        setBusy(true);
        setError("");
        try {
            localStorage.setItem("iad.reviewer", reviewer.trim());
            const session = await request("/review/session", { task_id: dataset.task_id, dataset_id: dataset.dataset_id, reviewer: reviewer.trim() });
            await request("/review/submit", { session_id: session.session_id, sample_id: id, decision, comment, duration_ms: Date.now() - openedAt.current });
            await request("/review/finish", { session_id: session.session_id });
            if (activeId.current === id) {
                onChanged();
                setNotice(`已提交 ${decision}`);
            }
        }
        catch (e) {
            if (activeId.current === id)
                setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    const evidenceSource = (image) => ({
        src: `/api/iad/evidence/${encodeURIComponent(detail.suggestion.suggestion_id)}/${image.evidence_id}`,
        title: image.role === "overview" ? "送模全图概览" : `ROI · ${image.crop_bbox.join(", ")}`,
        width: image.sent_size[0], height: image.sent_size[1],
    });
    const image = detail ? { src: mediaUrl(detail.sample), title: detail.sample.relative_path.split("/").pop(), width: detail.sample.width, height: detail.sample.height, annotations: detail.annotations } : null;
    return _jsxs("aside", { className: "iad-inspector", children: [_jsx("h2", { children: mode === "review" ? "复核明细" : "样本信息" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), notice && _jsx("p", { role: "status", children: notice }), !sampleId ? _jsx("p", { children: "\u9009\u62E9\u56FE\u50CF\u67E5\u770B\u3002" }) : !detail ? _jsx("p", { children: "\u52A0\u8F7D\u4E2D\u2026" }) : _jsxs(_Fragment, { children: [_jsx("button", { className: "iad-image-button", onClick: () => setLightbox(image), title: "\u653E\u5927\u56FE\u50CF", children: _jsx(AnnotatedImage, { image: image }) }), _jsxs("dl", { className: "iad-info-group", children: [_jsx("dt", { children: "\u56FE\u50CF\u8DEF\u5F84" }), _jsx("dd", { title: detail.sample.image_path, children: detail.sample.image_path }), _jsx("dt", { children: "\u56FE\u50CF\u540D" }), _jsx("dd", { "data-field": "image-name", children: detail.sample.relative_path.split("/").pop() }), _jsx("dt", { children: "UUID" }), _jsx("dd", { "data-field": "sample-uuid", children: _jsx("code", { title: detail.sample.sample_uuid, children: detail.sample.sample_uuid }) }), _jsx("dt", { children: "\u539F\u59CB\u8D28\u91CF" }), _jsx("dd", { children: detail.sample.quality_status }), _jsx("dt", { children: "\u5206\u8FA8\u7387" }), _jsxs("dd", { children: [detail.sample.width, " \u00D7 ", detail.sample.height] }), _jsx("dt", { children: "\u6570\u636E\u4E0E\u6280\u672F\u8D28\u91CF" }), _jsx("dd", { children: detail.technical_quality_score })] }), _jsxs("section", { className: "iad-info-group", children: [_jsxs("h3", { children: ["Labelme \u6807\u6CE8 \u00B7 ", detail.annotations.length] }), detail.annotations.length ? detail.annotations.map(a => _jsxs("div", { className: "iad-annotation", children: [_jsx("strong", { children: a.raw_label }), _jsxs("span", { children: [a.bbox?.join(", "), " \u00B7 ", a.geometry_status] })] }, a.annotation_id)) : _jsx("p", { className: "iad-muted", children: "\u65E0\u6807\u6CE8" }), detail.technical_issues.length > 0 && _jsx("div", { className: "iad-error", children: detail.technical_issues.map((i, index) => _jsx("p", { children: i.message }, index)) })] }), _jsxs("section", { className: "iad-info-group", children: [_jsx("h3", { children: "\u6A21\u578B\u89C2\u5BDF" }), detail.suggestion ? _jsxs(_Fragment, { children: [_jsxs("p", { children: [_jsx("strong", { children: detail.suggestion.suggested_label }), " \u00B7 ", detail.suggestion.reason_category, " \u00B7 \u6A21\u578B\u81EA\u62A5\u7F6E\u4FE1\u5EA6 ", detail.suggestion.confidence === null ? "未记录" : `${Math.round(detail.suggestion.confidence * 100)}%`] }), _jsx("p", { className: "iad-observation", children: detail.suggestion.notes }), _jsx("small", { className: "iad-muted", children: detail.suggestion.model_name }), _jsxs("p", { className: "iad-muted", children: ["\u826F\u54C1\u6A21\u5F0F\u6765\u6E90 \u00B7 ", detail.suggestion.reference_sample_ids.length, " \u5F20\u53C2\u8003\u56FE"] }), _jsx("div", { className: "iad-reference-grid", children: detail.suggestion.reference_sample_ids.map(id => _jsx("button", { title: "\u653E\u5927\u53C2\u8003\u826F\u54C1", onClick: () => setLightbox({ src: mediaUrl({ task_id: dataset.task_id, sample_id: id }), title: id.split("/").pop() }), children: _jsx("img", { alt: "\u672C\u6B21\u5BA1\u8BA1\u7684\u6B63\u5E38\u53C2\u8003\u56FE", src: mediaUrl({ task_id: dataset.task_id, sample_id: id }, true) }) }, id)) }), detail.suggestion.analysis && _jsxs("details", { className: "iad-analysis", children: [_jsx("summary", { children: "\u5BA1\u8BA1\u8FC7\u7A0B\u4E0E\u6A21\u5F0F\u7248\u672C" }), detail.normal_profile && _jsx(NormalKnowledge, { profile: detail.normal_profile }), _jsxs("p", { className: detail.suggestion.analysis.coverage.complete ? "iad-muted" : "iad-error", children: ["\u5C40\u90E8\u8986\u76D6 ", detail.suggestion.analysis.coverage.inspected_regions, " / ", detail.suggestion.analysis.coverage.planned_regions, " \u00B7 ", detail.suggestion.analysis.coverage.complete ? "计划已覆盖" : "检查未完成"] }), _jsxs("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(detail.suggestion.analysis.overview)), children: [_jsx("img", { src: evidenceSource(detail.suggestion.analysis.overview).src, alt: "\u9001\u6A21\u5168\u56FE\u6982\u89C8" }), _jsxs("span", { children: ["\u5168\u56FE \u00B7 ", detail.suggestion.analysis.overview.sent_size.join(" × "), detail.suggestion.analysis.conclusion.evidence_ids.includes(detail.suggestion.analysis.overview.evidence_id) ? " · 结论引用" : ""] })] }), _jsx("h3", { children: "\u5168\u56FE\u89C2\u5BDF" }), _jsx("p", { children: detail.suggestion.analysis.global_view.description }), detail.suggestion.analysis.regions.map((region, index) => _jsxs("div", { children: [_jsxs("h3", { children: ["\u5C40\u90E8 \u00B7 ", region.origins.map(origin => origin.label).join(" / ")] }), _jsxs("small", { children: [{ annotation: "Labelme 线索", model: "MLLM 候选", coverage: "细节覆盖" }[region.source], " \u00B7 \u539F\u56FE\u5750\u6807 ", region.crop_bbox.join(", ")] }), _jsxs("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(region.image)), children: [_jsx("img", { src: evidenceSource(region.image).src, alt: `审计 ROI ${index + 1}` }), _jsxs("span", { children: [region.image.sent_size.join(" × "), " \u00B7 PNG", detail.suggestion.analysis.conclusion.evidence_ids.includes(region.image.evidence_id) ? " · 结论引用" : ""] })] }), _jsx("p", { children: region.observation.description }), _jsxs("p", { children: ["\u4F4D\u7F6E\uFF1A", region.observation.position_analysis] }), _jsxs("p", { children: ["\u5149\u7167\uFF1A", region.observation.illumination_analysis] })] }, index)), detail.suggestion.analysis.conclusion.conflicts.length > 0 && _jsxs("p", { className: "iad-error", children: ["\u89C2\u5BDF\u77DB\u76FE\uFF1A", detail.suggestion.analysis.conclusion.conflicts.join("；")] }), detail.suggestion.analysis.conclusion.missing_evidence.length > 0 && _jsxs("p", { className: "iad-error", children: ["\u7F3A\u5931\u8BC1\u636E\uFF1A", detail.suggestion.analysis.conclusion.missing_evidence.join("；")] }), _jsxs("p", { className: "iad-muted", children: ["\u7ED3\u8BBA\u5F15\u7528 ", detail.suggestion.analysis.conclusion.evidence_ids.length, " \u9879\u89C6\u89C9\u8BC1\u636E"] }), _jsxs("p", { children: ["\u4F4D\u7F6E\u5206\u6790\uFF1A", detail.suggestion.analysis.conclusion.position_analysis] }), _jsxs("p", { children: ["\u5149\u7167\u5206\u6790\uFF1A", detail.suggestion.analysis.conclusion.illumination_analysis] })] })] }) : _jsx("p", { className: "iad-muted", children: "\u5C1A\u65E0\u6A21\u578B\u89C2\u5BDF\u3002" })] }), mode === "model" && job && _jsxs("section", { className: "iad-single-job iad-info-group", "aria-live": "polite", children: [_jsx("strong", { children: job.status }), _jsx("p", { children: auditPhases[job.phase || ""] || job.message }), !!job.planned_regions && _jsxs("p", { children: ["ROI ", job.inspected_regions || 0, " / ", job.planned_regions] }), job.errors.map((error, index) => _jsx("p", { className: "iad-error", children: error.message }, index)), jobRunning && _jsx("button", { onClick: async () => { try {
                                    setJob(await request(`/audit/cancel/${job.run_id}`, {}));
                                }
                                catch (error) {
                                    setError(message(error));
                                } }, children: "\u53D6\u6D88\u5BA1\u8BA1" })] }), mode === "model" ? _jsxs("div", { className: "iad-actions", children: [_jsx("button", { className: "iad-primary", disabled: busy || jobRunning, onClick: audit, children: busy || jobRunning ? "正在分阶段审计…" : "按良品模式审计此图" }), _jsx("button", { disabled: busy, onClick: setReference, children: dataset.reference_sample_ids.includes(sampleId) ? "移出良品参考" : "设为良品参考" })] }) : _jsxs("section", { className: "iad-decision", children: [_jsx("h3", { children: "\u4EBA\u5DE5\u88C1\u51B3" }), detail.review_decision && _jsxs("p", { children: ["\u5F53\u524D\uFF1A", detail.review_decision.decision, " \u00B7 ", detail.review_decision.reviewer, _jsx("br", {}), detail.review_decision.comment] }), _jsxs("label", { className: "iad-field", children: ["\u590D\u6838\u4EBA", _jsx("input", { value: reviewer, onChange: e => setReviewer(e.target.value) })] }), _jsxs("label", { className: "iad-field", children: ["\u590D\u6838\u8BF4\u660E", _jsx("textarea", { value: comment, onChange: e => setComment(e.target.value) })] }), _jsx("div", { className: "iad-actions", children: [['PASS', '良品'], ['HARD_NORMAL', '困难正常'], ['FAIL', '异常'], ['UNCERTAIN', '不确定'], ['SKIP', '跳过']].map(([value, label]) => _jsx("button", { className: value === "FAIL" ? "iad-danger" : "", disabled: busy, onClick: () => submit(value), children: label }, value)) })] })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
}
