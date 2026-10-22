import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { JobCard } from "./JobCard.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnnotatedImage, ImageViewer } from "./ImageViewer.js";
import { MediaLoad } from "./MediaLoad.js";
import { DatasetKnowledge } from "./DatasetKnowledge.js";
import { RuleAssessments } from "./RuleAssessments.js";
import { AuditFindings } from "./AuditFindings.js";
import { AuditEvidence } from "./AuditEvidence.js";
import { HumanReviewForm } from "./HumanReviewForm.js";
import { auditEvidenceUrl, regionSources, mediaUrl, message, request, reviewLabel, modelLabels } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { useWorkbenchModel } from "../models.js";
import { inspectionImage } from "../inspection.js";
export function SampleInspector({ dataset, sampleId, mode, revision, onReviewed, jobs, onJobsChanged, navigation }) {
    const { workspace, state } = useWorkspace();
    const model = useWorkbenchModel();
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const job = jobs.find(job => job.sample_ids.includes(sampleId));
    const jobRunning = jobs.some(job => job.status === "RUNNING" || job.status === "PENDING");
    const [lightbox, setLightbox] = useState(null);
    const imageButton = useRef(null);
    useEffect(() => {
        setDetail(null);
        setError("");
        setLightbox(null);
    }, [sampleId]);
    useEffect(() => {
        const saved = workspace.view(workspace.getSnapshot().pageId).inspection;
        if (!saved || saved.reference.sample_id !== sampleId)
            return;
        const controller = new AbortController();
        request("/inspection/context", saved.reference, undefined, controller.signal)
            .then(snapshot => { if (!controller.signal.aborted)
            setLightbox(inspectionImage({ reference: snapshot.reference, analysis: snapshot.analysis, historical: !snapshot.is_latest }, saved.selection, saved.transform)); })
            .catch(error => { if (!controller.signal.aborted)
            setError(message(error)); });
        return () => controller.abort();
    }, [sampleId, workspace]);
    useEffect(() => {
        if (!sampleId)
            return;
        const controller = new AbortController();
        request(`/sample/${encodeURIComponent(sampleId)}`, undefined, undefined, controller.signal).then(setDetail).catch(e => {
            if (!controller.signal.aborted)
                setError(message(e));
        });
        return () => controller.abort();
    }, [sampleId, revision]);
    async function audit() {
        setBusy(true);
        setError("");
        try {
            const view = workspace.view("industrial-audit");
            const input = { dataset_id: dataset.dataset_id, sample_ids: [sampleId],
                normal_version_id: view.normalVersion || undefined, defect_version_id: view.defectVersion || undefined };
            await request("/audit/start", input);
            onJobsChanged();
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    const evidenceSource = (evidence) => {
        const suggestion = detail.suggestion;
        const analysis = suggestion.analysis;
        return inspectionImage({ reference: { dataset_id: dataset.dataset_id, sample_id: sampleId, suggestion_id: suggestion.suggestion_id }, analysis }, { kind: "evidence", id: evidence.evidence_id });
    };
    const image = useMemo(() => detail ? { src: mediaUrl(detail.sample), title: detail.sample.relative_path.split("/").pop(), width: detail.sample.width, height: detail.sample.height,
        annotationLayer: { kind: "sample", annotations: detail.annotations, sample: detail.sample },
        inspection: detail.suggestion?.analysis ? { reference: { dataset_id: dataset.dataset_id, sample_id: sampleId, suggestion_id: detail.suggestion.suggestion_id }, analysis: detail.suggestion.analysis } : undefined } : null, [detail, dataset.dataset_id, sampleId]);
    useEffect(() => {
        if (navigation?.open && image && detail?.sample.sample_id === sampleId) {
            imageButton.current?.focus({ preventScroll: true });
            setLightbox({ ...image, initialSelection: null, initialTransform: { zoom: 0, x: 0, y: 0 } });
            navigation.opened();
        }
    }, [navigation, image, detail, sampleId]);
    return _jsxs("aside", { className: "iad-inspector", children: [_jsx("h2", { children: mode === "review" ? "复核明细" : "样本信息" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), !sampleId ? _jsx("p", { children: "\u9009\u62E9\u56FE\u50CF\u67E5\u770B\u3002" }) : !detail ? _jsx("p", { children: "\u52A0\u8F7D\u4E2D\u2026" }) : _jsxs(_Fragment, { children: [_jsx(MediaLoad, { children: _jsx("button", { ref: imageButton, className: "iad-image-button", onClick: () => setLightbox(image), title: "\u653E\u5927\u56FE\u50CF", children: _jsx(AnnotatedImage, { image: image }) }) }, image.src), _jsxs("dl", { className: "iad-info-group", children: [_jsx("dt", { children: "\u56FE\u50CF\u8DEF\u5F84" }), _jsx("dd", { title: detail.sample.image_path, children: detail.sample.image_path }), _jsx("dt", { children: "\u56FE\u50CF\u540D" }), _jsx("dd", { "data-field": "image-name", children: detail.sample.relative_path.split("/").pop() }), _jsx("dt", { children: "UUID" }), _jsx("dd", { "data-field": "sample-uuid", children: _jsx("code", { title: detail.sample.sample_uuid, children: detail.sample.sample_uuid }) }), _jsx("dt", { children: "\u539F\u59CB\u6807\u7B7E" }), _jsxs("dd", { "data-field": "raw-label", children: [detail.sample.quality_status === "PASS" ? "OK" : detail.sample.quality_status === "FAIL" ? "NG" : "未标记", detail.sample.quality_source ? ` · ${detail.sample.quality_source}` : ""] }), _jsx("dt", { children: "\u5206\u8FA8\u7387" }), _jsxs("dd", { children: [detail.sample.width, " \u00D7 ", detail.sample.height] }), mode !== "review" && _jsxs(_Fragment, { children: [_jsx("dt", { children: "\u4EBA\u5DE5\u7ED3\u679C" }), _jsx("dd", { children: detail.review_decision ? `${reviewLabel(detail.review_decision.decision)} · ${detail.review_decision.reviewer}` : "待人工复核" })] }), _jsx("dt", { children: "\u6570\u636E\u4E0E\u6280\u672F\u8D28\u91CF" }), _jsx("dd", { children: detail.technical_quality_score })] }), dataset.format !== "folder_classification" && _jsxs("section", { className: "iad-info-group", children: [_jsxs("h3", { children: ["Labelme \u6807\u6CE8 \u00B7 ", detail.annotations.length] }), detail.annotations.length ? detail.annotations.map(a => _jsxs("div", { className: "iad-annotation", children: [_jsx("strong", { children: a.raw_label }), _jsxs("span", { children: [a.bbox?.join(", "), " \u00B7 ", a.geometry_status] })] }, a.annotation_id)) : _jsx("p", { className: "iad-muted", children: "\u65E0\u6807\u6CE8" }), detail.technical_issues.length > 0 && _jsx("div", { className: "iad-error", children: detail.technical_issues.map((i, index) => _jsx("p", { children: i.message }, index)) })] }), dataset.format === "folder_classification" && detail.technical_issues.length > 0 && _jsx("section", { className: "iad-info-group", children: _jsx("div", { className: "iad-error", children: detail.technical_issues.map((i, index) => _jsx("p", { children: i.message }, index)) }) }), _jsxs("section", { className: "iad-info-group", children: [_jsx("h3", { children: "\u6A21\u578B\u89C2\u5BDF" }), detail.suggestion ? _jsxs(_Fragment, { children: [_jsxs("p", { children: [_jsx("strong", { children: modelLabels[detail.suggestion.suggested_label] }), " \u00B7 ", detail.suggestion.reason_category, " \u00B7 \u6A21\u578B\u81EA\u62A5\u7F6E\u4FE1\u5EA6 ", detail.suggestion.confidence === null ? "未记录" : `${Math.round(detail.suggestion.confidence * 100)}%`] }), _jsx("p", { className: "iad-observation", children: detail.suggestion.notes }), _jsx("small", { className: "iad-muted", children: detail.suggestion.model_name }), detail.suggestion.analysis && _jsx(AuditFindings, { analysis: detail.suggestion.analysis, onEvidence: (image, finding) => setLightbox({ ...evidenceSource(image), initialSelection: { kind: "evidence", id: image.evidence_id, findingId: finding.finding_id } }), onLocate: finding => {
                                            const overview = detail.suggestion.analysis.overview;
                                            setLightbox({ ...evidenceSource(overview), initialSelection: { kind: "finding", id: finding.finding_id } });
                                        } }, detail.suggestion.suggestion_id), _jsxs("p", { className: "iad-muted", children: ["\u826F\u54C1\u77E5\u8BC6\u6765\u6E90 \u00B7 ", detail.suggestion.reference_sample_ids.length, " \u5F20\u53C2\u8003\u56FE"] }), _jsx("div", { className: "iad-reference-grid", children: detail.normal_knowledge?.evidence.filter(item => item.image.role === "normal" && item.image.representation === "raw" && detail.suggestion.reference_sample_ids.includes(item.sample_id)).map(item => {
                                            const src = `/api/iad/knowledge/evidence/${encodeURIComponent(detail.normal_knowledge.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
                                            return _jsx("button", { title: "\u653E\u5927\u77E5\u8BC6\u6765\u6E90\u8BC1\u636E", onClick: () => setLightbox({ src, title: item.sample_id.split("/").pop() }), children: _jsx("img", { alt: "\u672C\u6B21\u5BA1\u8BA1\u7684\u77E5\u8BC6\u6765\u6E90", src: src }) }, item.image.evidence_id);
                                        }) }), detail.suggestion.analysis && _jsx(RuleAssessments, { analysis: detail.suggestion.analysis, knowledge: [...(detail.normal_knowledge ? [detail.normal_knowledge] : []), ...(detail.defect_knowledge ? [detail.defect_knowledge] : [])], onEvidence: image => setLightbox(evidenceSource(image)) }), detail.suggestion.analysis && _jsxs("details", { className: "iad-analysis", children: [_jsx("summary", { children: "\u5BA1\u8BA1\u8FC7\u7A0B\u4E0E\u77E5\u8BC6\u7248\u672C" }), detail.normal_knowledge ? _jsx(DatasetKnowledge, { knowledge: detail.normal_knowledge }) : _jsx("p", { className: "iad-muted", children: "\u5386\u53F2\u5BA1\u8BA1\uFF0C\u672A\u5173\u8054\u77E5\u8BC6\u7248\u672C\u3002" }), detail.defect_knowledge && _jsx(DatasetKnowledge, { knowledge: detail.defect_knowledge }), !!detail.suggestion.analysis.knowledge_limitations.length && _jsxs("p", { className: "iad-muted", children: ["\u77E5\u8BC6\u9650\u5236\uFF1A", detail.suggestion.analysis.knowledge_limitations.join("；")] }), _jsxs("p", { className: detail.suggestion.analysis.coverage.complete ? "iad-muted" : "iad-error", children: ["\u5C40\u90E8\u8986\u76D6 ", detail.suggestion.analysis.coverage.inspected_regions, " / ", detail.suggestion.analysis.coverage.planned_regions, " \u00B7 ", detail.suggestion.analysis.coverage.complete ? "计划已覆盖" : "检查未完成"] }), _jsxs("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(detail.suggestion.analysis.overview)), children: [_jsx("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, detail.suggestion.analysis.overview), alt: "\u9001\u6A21\u5168\u56FE\u6982\u89C8" }), _jsxs("span", { children: ["\u5168\u56FE \u00B7 ", detail.suggestion.analysis.overview.sent_size.join(" × "), detail.suggestion.analysis.conclusion.evidence_ids.includes(detail.suggestion.analysis.overview.evidence_id) ? " · 结论引用" : ""] })] }), _jsx("h3", { children: "\u5168\u56FE\u89C2\u5BDF" }), _jsx("p", { children: detail.suggestion.analysis.global_view.description }), detail.suggestion.analysis.regions.map((region, index) => _jsxs("div", { children: [_jsxs("h3", { children: ["\u5C40\u90E8 \u00B7 ", region.origins.map(origin => origin.label).join(" / ")] }), _jsxs("small", { children: [regionSources[region.source], " \u00B7 \u539F\u56FE\u5750\u6807 ", region.crop_bbox.join(", ")] }), _jsxs("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(region.image)), children: [_jsx("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, region.image), alt: `审计 ROI ${index + 1}` }), _jsxs("span", { children: [region.image.sent_size.join(" × "), " \u00B7 PNG", detail.suggestion.analysis.conclusion.evidence_ids.includes(region.image.evidence_id) ? " · 结论引用" : ""] })] }), _jsx("p", { children: region.observation.description }), _jsxs("p", { children: ["\u4F4D\u7F6E\uFF1A", region.observation.position_analysis] }), _jsxs("p", { children: ["\u5149\u7167\uFF1A", region.observation.illumination_analysis] })] }, index)), detail.suggestion.analysis.auxiliary_evidence.map(image => _jsxs("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(image)), children: [_jsx("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, image), alt: "\u5B9E\u9645\u9001\u6A21\u7684\u4E8C\u503C\u6807\u6CE8\u5B9A\u4F4D\u56FE" }), _jsxs("span", { children: ["\u6807\u6CE8\u5B9A\u4F4D\u56FE", detail.suggestion.analysis.conclusion.evidence_ids.includes(image.evidence_id) ? " · 结论引用" : ""] })] }, image.evidence_id)), detail.suggestion.analysis.conclusion.conflicts.length > 0 && _jsxs("p", { className: "iad-error", children: ["\u89C2\u5BDF\u77DB\u76FE\uFF1A", detail.suggestion.analysis.conclusion.conflicts.join("；")] }), detail.suggestion.analysis.conclusion.missing_evidence.length > 0 && _jsxs("p", { className: "iad-error", children: ["\u7F3A\u5931\u8BC1\u636E\uFF1A", detail.suggestion.analysis.conclusion.missing_evidence.join("；")] }), detail.suggestion.analysis.joint_steps.length > 1 && _jsxs("details", { children: [_jsxs("summary", { children: ["\u8054\u5408\u5206\u6790\u8BB0\u5F55 \u00B7 ", detail.suggestion.analysis.joint_steps.length, " \u6B65"] }), detail.suggestion.analysis.joint_steps.map(step => _jsxs("div", { children: [_jsxs("strong", { children: [step.step_id, " \u00B7 ", modelLabels[step.result.suggested_label]] }), _jsxs("p", { children: [step.input_evidence_ids.length, " \u5F20\u56FE\u50CF", step.child_step_ids.length ? ` · 汇总 ${step.child_step_ids.join("、")}` : ""] }), _jsx("p", { children: step.result.description }), "resolved_findings" in step.result && step.result.resolved_findings.map((resolution, index) => _jsxs("div", { children: [_jsxs("p", { children: ["\u5DF2\u6392\u9664\u7591\u70B9\uFF1A", resolution.description] }), _jsxs("p", { children: ["\u6B63\u5E38\u89E3\u91CA\uFF1A", resolution.normal_explanation] }), _jsx(AuditEvidence, { analysis: detail.suggestion.analysis, ids: resolution.evidence_ids, label: resolution.description, onEvidence: image => setLightbox(evidenceSource(image)) })] }, index))] }, step.step_id))] }), _jsxs("p", { className: "iad-muted", children: ["\u7ED3\u8BBA\u5F15\u7528 ", detail.suggestion.analysis.conclusion.evidence_ids.length, " \u9879\u89C6\u89C9\u8BC1\u636E"] }), _jsxs("p", { children: ["\u4F4D\u7F6E\u5206\u6790\uFF1A", detail.suggestion.analysis.conclusion.position_analysis] }), _jsxs("p", { children: ["\u5149\u7167\u5206\u6790\uFF1A", detail.suggestion.analysis.conclusion.illumination_analysis] })] })] }) : _jsx("p", { className: "iad-muted", children: "\u5C1A\u65E0\u6A21\u578B\u89C2\u5BDF\u3002" })] }), mode === "model" && job && _jsx("section", { className: "iad-single-job", "aria-label": "\u5F53\u524D\u6837\u672C\u4F5C\u4E1A", children: _jsx(JobCard, { job: job, onChanged: onJobsChanged }, job.run_id) }), mode === "review" ? _jsx(HumanReviewForm, { datasetId: dataset.dataset_id, sampleId: sampleId, detail: detail, onSubmitted: record => onReviewed(record, detail.sample.relative_path) }) : mode === "model" && _jsxs("div", { className: "iad-actions", children: [_jsx("button", { className: "iad-primary", disabled: busy || jobRunning || !model.ready, onClick: audit, children: busy || jobRunning ? "正在联合审计…" : "按知识审计此图" }), _jsx("button", { onClick: () => workspace.navigate("industrial-review", sampleId), children: "\u524D\u5F80\u4EBA\u5DE5\u590D\u6838" })] })] }), lightbox && _jsx(ImageViewer, { image: lightbox, navigation: navigation, onClose: () => { navigation?.cancel(); setLightbox(null); if (workspace.view(state.pageId).inspection)
                    workspace.updateView(state.pageId, { inspection: null }, true); } })] });
}
