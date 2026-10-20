import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { AnnotatedImage, ImageViewer } from "./ImageViewer.js";
import { MediaLoad } from "./MediaLoad.js";
import { DatasetKnowledge } from "./DatasetKnowledge.js";
import { RuleAssessments } from "./RuleAssessments.js";
import { AuditFindings } from "./AuditFindings.js";
import { AuditEvidence } from "./AuditEvidence.js";
import { HumanReviewForm } from "./HumanReviewForm.js";
import { auditPhases, auditEvidenceUrl, regionSources, mediaUrl, message, request } from "../api.js";
export function SampleInspector({ dataset, sampleId, mode, revision, onChanged, jobs, onJobsChanged }) {
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const job = jobs.find(job => job.sample_ids.includes(sampleId));
    const jobRunning = jobs.some(job => job.status === "RUNNING" || job.status === "PENDING");
    const [lightbox, setLightbox] = useState(null);
    useEffect(() => {
        setDetail(null);
        setError("");
        setLightbox(null);
    }, [sampleId]);
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
            await request("/audit/start", { dataset_id: dataset.dataset_id, sample_ids: [sampleId] });
            onJobsChanged();
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    async function setReference() {
        setBusy(true);
        setError("");
        const ids = dataset.reference_sample_ids.includes(sampleId) ? dataset.reference_sample_ids.filter(id => id !== sampleId) : [...dataset.reference_sample_ids, sampleId];
        try {
            await request(`/datasets/${dataset.dataset_id}`, { reference_sample_ids: ids }, "PATCH");
            onChanged();
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    const annotationLayer = detail ? { kind: "sample", annotations: detail.annotations, sample: detail.sample } : undefined;
    const evidenceSource = (evidence) => {
        const suggestion = detail.suggestion;
        const analysis = suggestion.analysis;
        return {
            src: auditEvidenceUrl(suggestion.suggestion_id, analysis.overview), title: "送模全图概览",
            annotationLayer: { kind: "audit", analysis, suggestionId: suggestion.suggestion_id },
            inspection: { suggestionId: suggestion.suggestion_id, analysis }, initialSelection: { kind: "evidence", id: evidence.evidence_id },
            width: analysis.overview.sent_size[0], height: analysis.overview.sent_size[1],
        };
    };
    const image = detail ? { src: mediaUrl(detail.sample), title: detail.sample.relative_path.split("/").pop(), width: detail.sample.width, height: detail.sample.height, annotationLayer, inspection: detail.suggestion?.analysis ? { suggestionId: detail.suggestion.suggestion_id, analysis: detail.suggestion.analysis } : undefined } : null;
    return _jsxs("aside", { className: "iad-inspector", children: [_jsx("h2", { children: mode === "review" ? "复核明细" : "样本信息" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), !sampleId ? _jsx("p", { children: "\u9009\u62E9\u56FE\u50CF\u67E5\u770B\u3002" }) : !detail ? _jsx("p", { children: "\u52A0\u8F7D\u4E2D\u2026" }) : _jsxs(_Fragment, { children: [_jsx(MediaLoad, { children: _jsx("button", { className: "iad-image-button", onClick: () => setLightbox(image), title: "\u653E\u5927\u56FE\u50CF", children: _jsx(AnnotatedImage, { image: image }) }) }, image.src), _jsxs("dl", { className: "iad-info-group", children: [_jsx("dt", { children: "\u56FE\u50CF\u8DEF\u5F84" }), _jsx("dd", { title: detail.sample.image_path, children: detail.sample.image_path }), _jsx("dt", { children: "\u56FE\u50CF\u540D" }), _jsx("dd", { "data-field": "image-name", children: detail.sample.relative_path.split("/").pop() }), _jsx("dt", { children: "UUID" }), _jsx("dd", { "data-field": "sample-uuid", children: _jsx("code", { title: detail.sample.sample_uuid, children: detail.sample.sample_uuid }) }), _jsx("dt", { children: "\u539F\u59CB\u8D28\u91CF" }), _jsx("dd", { children: detail.sample.quality_status }), _jsx("dt", { children: "\u5206\u8FA8\u7387" }), _jsxs("dd", { children: [detail.sample.width, " \u00D7 ", detail.sample.height] }), _jsx("dt", { children: "\u6570\u636E\u4E0E\u6280\u672F\u8D28\u91CF" }), _jsx("dd", { children: detail.technical_quality_score })] }), _jsxs("section", { className: "iad-info-group", children: [_jsxs("h3", { children: ["Labelme \u6807\u6CE8 \u00B7 ", detail.annotations.length] }), detail.annotations.length ? detail.annotations.map(a => _jsxs("div", { className: "iad-annotation", children: [_jsx("strong", { children: a.raw_label }), _jsxs("span", { children: [a.bbox?.join(", "), " \u00B7 ", a.geometry_status] })] }, a.annotation_id)) : _jsx("p", { className: "iad-muted", children: "\u65E0\u6807\u6CE8" }), detail.technical_issues.length > 0 && _jsx("div", { className: "iad-error", children: detail.technical_issues.map((i, index) => _jsx("p", { children: i.message }, index)) })] }), _jsxs("section", { className: "iad-info-group", children: [_jsx("h3", { children: "\u6A21\u578B\u89C2\u5BDF" }), detail.suggestion ? _jsxs(_Fragment, { children: [_jsxs("p", { children: [_jsx("strong", { children: detail.suggestion.suggested_label }), " \u00B7 ", detail.suggestion.reason_category, " \u00B7 \u6A21\u578B\u81EA\u62A5\u7F6E\u4FE1\u5EA6 ", detail.suggestion.confidence === null ? "未记录" : `${Math.round(detail.suggestion.confidence * 100)}%`] }), _jsx("p", { className: "iad-observation", children: detail.suggestion.notes }), _jsx("small", { className: "iad-muted", children: detail.suggestion.model_name }), detail.suggestion.analysis && _jsx(AuditFindings, { analysis: detail.suggestion.analysis, onEvidence: (image, finding) => setLightbox({ ...evidenceSource(image), initialSelection: { kind: "evidence", id: image.evidence_id, findingId: finding.finding_id } }), onLocate: finding => {
                                            const overview = detail.suggestion.analysis.overview;
                                            setLightbox({ ...evidenceSource(overview), initialSelection: { kind: "finding", id: finding.finding_id } });
                                        } }, detail.suggestion.suggestion_id), _jsxs("p", { className: "iad-muted", children: ["\u826F\u54C1\u77E5\u8BC6\u6765\u6E90 \u00B7 ", detail.suggestion.reference_sample_ids.length, " \u5F20\u53C2\u8003\u56FE"] }), _jsx("div", { className: "iad-reference-grid", children: detail.normal_knowledge?.evidence.filter(item => item.image.role === "normal" && item.image.representation === "raw" && detail.suggestion.reference_sample_ids.includes(item.sample_id)).map(item => {
                                            const src = `/api/iad/knowledge/evidence/${encodeURIComponent(detail.normal_knowledge.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
                                            return _jsx("button", { title: "\u653E\u5927\u77E5\u8BC6\u6765\u6E90\u8BC1\u636E", onClick: () => setLightbox({ src, title: item.sample_id.split("/").pop() }), children: _jsx("img", { alt: "\u672C\u6B21\u5BA1\u8BA1\u7684\u77E5\u8BC6\u6765\u6E90", src: src }) }, item.image.evidence_id);
                                        }) }), detail.suggestion.analysis && _jsx(RuleAssessments, { analysis: detail.suggestion.analysis, knowledge: [...(detail.normal_knowledge ? [detail.normal_knowledge] : []), ...(detail.defect_knowledge ? [detail.defect_knowledge] : [])], onEvidence: image => setLightbox(evidenceSource(image)) }), detail.suggestion.analysis && _jsxs("details", { className: "iad-analysis", children: [_jsx("summary", { children: "\u5BA1\u8BA1\u8FC7\u7A0B\u4E0E\u77E5\u8BC6\u7248\u672C" }), detail.normal_knowledge ? _jsx(DatasetKnowledge, { knowledge: detail.normal_knowledge }) : _jsx("p", { className: "iad-muted", children: "\u5386\u53F2\u5BA1\u8BA1\uFF0C\u672A\u5173\u8054\u77E5\u8BC6\u7248\u672C\u3002" }), detail.defect_knowledge && _jsx(DatasetKnowledge, { knowledge: detail.defect_knowledge }), !!detail.suggestion.analysis.knowledge_limitations.length && _jsxs("p", { className: "iad-muted", children: ["\u77E5\u8BC6\u9650\u5236\uFF1A", detail.suggestion.analysis.knowledge_limitations.join("；")] }), _jsxs("p", { className: detail.suggestion.analysis.coverage.complete ? "iad-muted" : "iad-error", children: ["\u5C40\u90E8\u8986\u76D6 ", detail.suggestion.analysis.coverage.inspected_regions, " / ", detail.suggestion.analysis.coverage.planned_regions, " \u00B7 ", detail.suggestion.analysis.coverage.complete ? "计划已覆盖" : "检查未完成"] }), _jsxs("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(detail.suggestion.analysis.overview)), children: [_jsx("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, detail.suggestion.analysis.overview), alt: "\u9001\u6A21\u5168\u56FE\u6982\u89C8" }), _jsxs("span", { children: ["\u5168\u56FE \u00B7 ", detail.suggestion.analysis.overview.sent_size.join(" × "), detail.suggestion.analysis.conclusion.evidence_ids.includes(detail.suggestion.analysis.overview.evidence_id) ? " · 结论引用" : ""] })] }), _jsx("h3", { children: "\u5168\u56FE\u89C2\u5BDF" }), _jsx("p", { children: detail.suggestion.analysis.global_view.description }), detail.suggestion.analysis.regions.map((region, index) => _jsxs("div", { children: [_jsxs("h3", { children: ["\u5C40\u90E8 \u00B7 ", region.origins.map(origin => origin.label).join(" / ")] }), _jsxs("small", { children: [regionSources[region.source], " \u00B7 \u539F\u56FE\u5750\u6807 ", region.crop_bbox.join(", ")] }), _jsxs("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(region.image)), children: [_jsx("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, region.image), alt: `审计 ROI ${index + 1}` }), _jsxs("span", { children: [region.image.sent_size.join(" × "), " \u00B7 PNG", detail.suggestion.analysis.conclusion.evidence_ids.includes(region.image.evidence_id) ? " · 结论引用" : ""] })] }), _jsx("p", { children: region.observation.description }), _jsxs("p", { children: ["\u4F4D\u7F6E\uFF1A", region.observation.position_analysis] }), _jsxs("p", { children: ["\u5149\u7167\uFF1A", region.observation.illumination_analysis] })] }, index)), detail.suggestion.analysis.auxiliary_evidence.map(image => _jsxs("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(image)), children: [_jsx("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, image), alt: "\u5B9E\u9645\u9001\u6A21\u7684\u4E8C\u503C\u6807\u6CE8\u5B9A\u4F4D\u56FE" }), _jsxs("span", { children: ["\u6807\u6CE8\u5B9A\u4F4D\u56FE", detail.suggestion.analysis.conclusion.evidence_ids.includes(image.evidence_id) ? " · 结论引用" : ""] })] }, image.evidence_id)), detail.suggestion.analysis.conclusion.conflicts.length > 0 && _jsxs("p", { className: "iad-error", children: ["\u89C2\u5BDF\u77DB\u76FE\uFF1A", detail.suggestion.analysis.conclusion.conflicts.join("；")] }), detail.suggestion.analysis.conclusion.missing_evidence.length > 0 && _jsxs("p", { className: "iad-error", children: ["\u7F3A\u5931\u8BC1\u636E\uFF1A", detail.suggestion.analysis.conclusion.missing_evidence.join("；")] }), detail.suggestion.analysis.joint_steps.length > 1 && _jsxs("details", { children: [_jsxs("summary", { children: ["\u8054\u5408\u5206\u6790\u8BB0\u5F55 \u00B7 ", detail.suggestion.analysis.joint_steps.length, " \u6B65"] }), detail.suggestion.analysis.joint_steps.map(step => _jsxs("div", { children: [_jsxs("strong", { children: [step.step_id, " \u00B7 ", step.result.suggested_label] }), _jsxs("p", { children: [step.input_evidence_ids.length, " \u5F20\u56FE\u50CF", step.child_step_ids.length ? ` · 汇总 ${step.child_step_ids.join("、")}` : ""] }), _jsx("p", { children: step.result.description }), "resolved_findings" in step.result && step.result.resolved_findings.map((resolution, index) => _jsxs("div", { children: [_jsxs("p", { children: ["\u5DF2\u6392\u9664\u7591\u70B9\uFF1A", resolution.description] }), _jsxs("p", { children: ["\u6B63\u5E38\u89E3\u91CA\uFF1A", resolution.normal_explanation] }), _jsx(AuditEvidence, { analysis: detail.suggestion.analysis, ids: resolution.evidence_ids, label: resolution.description, onEvidence: image => setLightbox(evidenceSource(image)) })] }, index))] }, step.step_id))] }), _jsxs("p", { className: "iad-muted", children: ["\u7ED3\u8BBA\u5F15\u7528 ", detail.suggestion.analysis.conclusion.evidence_ids.length, " \u9879\u89C6\u89C9\u8BC1\u636E"] }), _jsxs("p", { children: ["\u4F4D\u7F6E\u5206\u6790\uFF1A", detail.suggestion.analysis.conclusion.position_analysis] }), _jsxs("p", { children: ["\u5149\u7167\u5206\u6790\uFF1A", detail.suggestion.analysis.conclusion.illumination_analysis] })] })] }) : _jsx("p", { className: "iad-muted", children: "\u5C1A\u65E0\u6A21\u578B\u89C2\u5BDF\u3002" })] }), mode === "model" && job && _jsxs("section", { className: "iad-single-job iad-info-group", "aria-live": "polite", children: [_jsx("strong", { children: job.status }), _jsx("p", { children: auditPhases[job.phase || ""] || job.message }), !!job.planned_regions && _jsxs("p", { children: ["ROI ", job.inspected_regions || 0, " / ", job.planned_regions] }), !!job.total_batches && _jsxs("p", { children: ["\u8054\u5408\u5224\u65AD ", job.completed_batches || 0, " / ", job.total_batches] }), job.errors.map((error, index) => _jsx("p", { className: "iad-error", children: error.message }, index)), (job.status === "RUNNING" || job.status === "PENDING") && _jsx("button", { onClick: async () => { try {
                                    await request(`/audit/cancel/${job.run_id}`, {});
                                    onJobsChanged();
                                }
                                catch (error) {
                                    setError(message(error));
                                } }, children: "\u53D6\u6D88\u5BA1\u8BA1" })] }), mode === "dataset" && _jsx("div", { className: "iad-actions", children: _jsx("button", { disabled: busy, onClick: setReference, children: dataset.reference_sample_ids.includes(sampleId) ? "移出良品参考" : "设为良品参考" }) }), mode === "model" ? _jsx("div", { className: "iad-actions", children: _jsx("button", { className: "iad-primary", disabled: busy || jobRunning, onClick: audit, children: busy || jobRunning ? "正在联合审计…" : "按知识审计此图" }) }) : mode === "review" ? _jsx(HumanReviewForm, { datasetId: dataset.dataset_id, sampleId: sampleId, detail: detail, onChanged: onChanged }) : null] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
}
