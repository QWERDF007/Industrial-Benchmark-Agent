import React, { useEffect, useRef, useState } from "react";
import type { AuditJob, Dataset, Decision, SampleDetail, VisualEvidence } from "../../shared/contracts.js";
import { AnnotatedImage, ImageViewer, type ImageSource } from "./ImageViewer.js";
import { MediaLoad } from "./MediaLoad.js";
import type { AnnotationLayerSource } from "./AnnotationLayer.js";
import { DatasetKnowledge } from "./DatasetKnowledge.js";
import { RuleAssessments } from "./RuleAssessments.js";
import { AuditFindings } from "./AuditFindings.js";
import { AuditEvidence } from "./AuditEvidence.js";
import { useReviewDraft } from "../useReviewDraft.js";
import { auditPhases, auditEvidenceUrl, regionSources, mediaUrl, message, request } from "../api.js";

export function SampleInspector({ dataset, sampleId, mode, revision, onChanged, jobs, onJobsChanged }: {
  jobs: AuditJob[]; onJobsChanged(): void;
  dataset: Dataset; sampleId: string; mode: "model" | "review" | "browse" | "dataset"; revision: number; onChanged(): void;
}) {
  const [detail, setDetail] = useState<SampleDetail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const job = jobs.find(job => job.sample_ids.includes(sampleId));
  const jobRunning = jobs.some(job => job.status === "RUNNING" || job.status === "PENDING");
  const draft = useReviewDraft(dataset.dataset_id, sampleId);
  const { reviewer, comment } = draft;
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const activeId = useRef(sampleId);
  const openedAt = useRef(Date.now());
  useEffect(() => {
    activeId.current = sampleId;
    setDetail(null); setError(""); setNotice(""); setLightbox(null); openedAt.current = Date.now();
  }, [sampleId]);
  useEffect(() => {
    if (!sampleId) return;
    const controller = new AbortController();
    request<SampleDetail>(`/sample/${encodeURIComponent(sampleId)}`, undefined, undefined, controller.signal).then(setDetail).catch(e => {
      if (!controller.signal.aborted) setError(message(e));
    });
    return () => controller.abort();
  }, [sampleId, revision]);
  async function audit() {
    setBusy(true); setError("");
    try { await request<AuditJob>("/audit/start", { dataset_id: dataset.dataset_id, sample_ids: [sampleId] }); onJobsChanged(); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function setReference() {
    setBusy(true); setError("");
    const ids = dataset.reference_sample_ids.includes(sampleId) ? dataset.reference_sample_ids.filter(id => id !== sampleId) : [...dataset.reference_sample_ids, sampleId];
    try { await request(`/datasets/${dataset.dataset_id}`, { reference_sample_ids: ids }, "PATCH"); onChanged(); }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  async function submit(decision: Decision) {
    if (!reviewer.trim()) { setError("请填写复核人"); return; }
    const id = sampleId; setBusy(true); setError("");
    try {
      localStorage.setItem("iad.reviewer", reviewer.trim());
      const session = await request<{ session_id: string }>("/review/session", { task_id: dataset.task_id, dataset_id: dataset.dataset_id, reviewer: reviewer.trim() });
      await request("/review/submit", { session_id: session.session_id, sample_id: id, decision, comment, duration_ms: Date.now() - openedAt.current });
      await request("/review/finish", { session_id: session.session_id });
      draft.discard();
      if (activeId.current === id) { onChanged(); setNotice(`已提交 ${decision}`); }
    } catch (e) { if (activeId.current === id) setError(message(e)); } finally { setBusy(false); }
  }
  const annotationLayer: AnnotationLayerSource | undefined = detail ? { kind: "sample", annotations: detail.annotations, sample: detail.sample } : undefined;
  const evidenceSource = (evidence: VisualEvidence): ImageSource => {
    const suggestion = detail!.suggestion!;
    const analysis = suggestion.analysis!;
    return {
      src: auditEvidenceUrl(suggestion.suggestion_id,analysis.overview), title: "送模全图概览",
      annotationLayer: { kind: "audit", analysis, suggestionId: suggestion.suggestion_id },
      inspection: { suggestionId: suggestion.suggestion_id, analysis }, initialSelection: { kind: "evidence", id: evidence.evidence_id },
      width: analysis.overview.sent_size[0], height: analysis.overview.sent_size[1],
    };
  };
  const image = detail ? { src: mediaUrl(detail.sample), title: detail.sample.relative_path.split("/").pop()!, width: detail.sample.width, height: detail.sample.height, annotationLayer, inspection: detail.suggestion?.analysis ? { suggestionId: detail.suggestion.suggestion_id, analysis: detail.suggestion.analysis } : undefined } : null;
  return <aside className="iad-inspector"><h2>{mode === "review" ? "复核明细" : "样本信息"}</h2>
    {error && <p role="alert" className="iad-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    {!sampleId ? <p>选择图像查看。</p> : !detail ? <p>加载中…</p> : <>
      <MediaLoad key={image!.src}><button className="iad-image-button" onClick={() => setLightbox(image)} title="放大图像"><AnnotatedImage image={image!} /></button></MediaLoad>
      <dl className="iad-info-group"><dt>图像路径</dt><dd title={detail.sample.image_path}>{detail.sample.image_path}</dd>
        <dt>图像名</dt><dd data-field="image-name">{detail.sample.relative_path.split("/").pop()}</dd>
        <dt>UUID</dt><dd data-field="sample-uuid"><code title={detail.sample.sample_uuid}>{detail.sample.sample_uuid}</code></dd>
        <dt>原始质量</dt><dd>{detail.sample.quality_status}</dd><dt>分辨率</dt><dd>{detail.sample.width} × {detail.sample.height}</dd>
        <dt>数据与技术质量</dt><dd>{detail.technical_quality_score}</dd></dl>
      <section className="iad-info-group">
      <h3>Labelme 标注 · {detail.annotations.length}</h3>
      {detail.annotations.length ? detail.annotations.map(a => <div className="iad-annotation" key={a.annotation_id}><strong>{a.raw_label}</strong><span>{a.bbox?.join(", ")} · {a.geometry_status}</span></div>) : <p className="iad-muted">无标注</p>}
      {detail.technical_issues.length > 0 && <div className="iad-error">{detail.technical_issues.map((i, index) => <p key={index}>{i.message}</p>)}</div>}
      </section><section className="iad-info-group"><h3>模型观察</h3>{detail.suggestion ? <><p><strong>{detail.suggestion.suggested_label}</strong> · {detail.suggestion.reason_category} · 模型自报置信度 {detail.suggestion.confidence === null ? "未记录" : `${Math.round(detail.suggestion.confidence * 100)}%`}</p>
        <p className="iad-observation">{detail.suggestion.notes}</p><small className="iad-muted">{detail.suggestion.model_name}</small>
        {detail.suggestion.analysis && <AuditFindings key={detail.suggestion.suggestion_id} analysis={detail.suggestion.analysis}
          onEvidence={(image, finding) => setLightbox({ ...evidenceSource(image), initialSelection: { kind: "evidence", id: image.evidence_id, findingId: finding.finding_id } })} onLocate={finding => {
            const overview = detail.suggestion!.analysis!.overview;
            setLightbox({ ...evidenceSource(overview), initialSelection: { kind: "finding", id: finding.finding_id } });
          }} />}
        <p className="iad-muted">良品知识来源 · {detail.suggestion.reference_sample_ids.length} 张参考图</p>
        <div className="iad-reference-grid">{detail.normal_knowledge?.evidence.filter(item => item.image.role === "normal" && item.image.representation === "raw" && detail.suggestion!.reference_sample_ids.includes(item.sample_id)).map(item => {
          const src = `/api/iad/knowledge/evidence/${encodeURIComponent(detail.normal_knowledge!.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
          return <button key={item.image.evidence_id} title="放大知识来源证据" onClick={() => setLightbox({ src, title: item.sample_id.split("/").pop()! })}><img alt="本次审计的知识来源" src={src} /></button>;
        })}</div>
        {detail.suggestion.analysis && <RuleAssessments analysis={detail.suggestion.analysis} knowledge={[...(detail.normal_knowledge ? [detail.normal_knowledge] : []), ...(detail.defect_knowledge ? [detail.defect_knowledge] : [])]} onEvidence={image => setLightbox(evidenceSource(image))} />}
        {detail.suggestion.analysis && <details className="iad-analysis"><summary>审计过程与知识版本</summary>{detail.normal_knowledge ? <DatasetKnowledge knowledge={detail.normal_knowledge} /> : <p className="iad-muted">历史审计，未关联知识版本。</p>}{detail.defect_knowledge && <DatasetKnowledge knowledge={detail.defect_knowledge} />}
          {!!detail.suggestion.analysis.knowledge_limitations.length && <p className="iad-muted">知识限制：{detail.suggestion.analysis.knowledge_limitations.join("；")}</p>}
          <p className={detail.suggestion.analysis.coverage.complete ? "iad-muted" : "iad-error"}>局部覆盖 {detail.suggestion.analysis.coverage.inspected_regions} / {detail.suggestion.analysis.coverage.planned_regions} · {detail.suggestion.analysis.coverage.complete ? "计划已覆盖" : "检查未完成"}</p>
          <button className="iad-evidence-preview" onClick={() => setLightbox(evidenceSource(detail.suggestion!.analysis!.overview))}><img src={auditEvidenceUrl(detail.suggestion.suggestion_id,detail.suggestion.analysis.overview)} alt="送模全图概览" /><span>全图 · {detail.suggestion.analysis.overview.sent_size.join(" × ")}{detail.suggestion.analysis.conclusion.evidence_ids.includes(detail.suggestion.analysis.overview.evidence_id) ? " · 结论引用" : ""}</span></button>
          <h3>全图观察</h3><p>{detail.suggestion.analysis.global_view.description}</p>
          {detail.suggestion.analysis.regions.map((region, index) => <div key={index}><h3>局部 · {region.origins.map(origin => origin.label).join(" / ")}</h3><small>{regionSources[region.source]} · 原图坐标 {region.crop_bbox.join(", ")}</small>
            <button className="iad-evidence-preview" onClick={() => setLightbox(evidenceSource(region.image))}><img src={auditEvidenceUrl(detail.suggestion!.suggestion_id,region.image)} alt={`审计 ROI ${index + 1}`} /><span>{region.image.sent_size.join(" × ")} · PNG{detail.suggestion!.analysis!.conclusion.evidence_ids.includes(region.image.evidence_id) ? " · 结论引用" : ""}</span></button><p>{region.observation.description}</p><p>位置：{region.observation.position_analysis}</p><p>光照：{region.observation.illumination_analysis}</p></div>)}
          {detail.suggestion.analysis.auxiliary_evidence.map(image => <button key={image.evidence_id} className="iad-evidence-preview" onClick={() => setLightbox(evidenceSource(image))}><img src={auditEvidenceUrl(detail.suggestion!.suggestion_id,image)} alt="实际送模的二值标注定位图" /><span>标注定位图{detail.suggestion!.analysis!.conclusion.evidence_ids.includes(image.evidence_id) ? " · 结论引用" : ""}</span></button>)}
          {detail.suggestion.analysis.conclusion.conflicts.length > 0 && <p className="iad-error">观察矛盾：{detail.suggestion.analysis.conclusion.conflicts.join("；")}</p>}
          {detail.suggestion.analysis.conclusion.missing_evidence.length > 0 && <p className="iad-error">缺失证据：{detail.suggestion.analysis.conclusion.missing_evidence.join("；")}</p>}
          {detail.suggestion.analysis.joint_steps.length > 1 && <details><summary>联合分析记录 · {detail.suggestion.analysis.joint_steps.length} 步</summary>{detail.suggestion.analysis.joint_steps.map(step => <div key={step.step_id}><strong>{step.step_id} · {step.result.suggested_label}</strong><p>{step.input_evidence_ids.length} 张图像{step.child_step_ids.length ? ` · 汇总 ${step.child_step_ids.join("、")}` : ""}</p><p>{step.result.description}</p>
            {"resolved_findings" in step.result && step.result.resolved_findings.map((resolution, index) => <div key={index}>
              <p>已排除疑点：{resolution.description}</p><p>正常解释：{resolution.normal_explanation}</p>
              <AuditEvidence analysis={detail.suggestion!.analysis!} ids={resolution.evidence_ids} label={resolution.description} onEvidence={image => setLightbox(evidenceSource(image))} />
            </div>)}
          </div>)}</details>}
          <p className="iad-muted">结论引用 {detail.suggestion.analysis.conclusion.evidence_ids.length} 项视觉证据</p>
          <p>位置分析：{detail.suggestion.analysis.conclusion.position_analysis}</p><p>光照分析：{detail.suggestion.analysis.conclusion.illumination_analysis}</p>
        </details>}
      </> : <p className="iad-muted">尚无模型观察。</p>}</section>
      {mode === "model" && job && <section className="iad-single-job iad-info-group" aria-live="polite"><strong>{job.status}</strong><p>{auditPhases[job.phase || ""] || job.message}</p>
        {!!job.planned_regions && <p>ROI {job.inspected_regions || 0} / {job.planned_regions}</p>}
        {!!job.total_batches && <p>联合判断 {job.completed_batches || 0} / {job.total_batches}</p>}
        {job.errors.map((error, index) => <p className="iad-error" key={index}>{error.message}</p>)}
        {(job.status === "RUNNING" || job.status === "PENDING") && <button onClick={async () => { try { await request<AuditJob>(`/audit/cancel/${job.run_id}`, {}); onJobsChanged(); } catch (error) { setError(message(error)); } }}>取消审计</button>}
      </section>}
      {mode === "dataset" && <div className="iad-actions"><button disabled={busy} onClick={setReference}>{dataset.reference_sample_ids.includes(sampleId) ? "移出良品参考" : "设为良品参考"}</button></div>}
      {mode === "model" ? <div className="iad-actions"><button className="iad-primary" disabled={busy || jobRunning} onClick={audit}>{busy || jobRunning ? "正在联合审计…" : "按知识审计此图"}</button></div> : mode === "review" ? <section className="iad-decision">
        <h3>人工裁决</h3>{draft.dirty && <div className="iad-row"><span role="status">草稿未提交</span><button disabled={busy} onClick={draft.discard}>放弃草稿</button></div>}{detail.review_decision && <p>当前：{detail.review_decision.decision} · {detail.review_decision.reviewer}<br />{detail.review_decision.comment}</p>}
        <label className="iad-field">复核人<input value={reviewer} onChange={e => draft.update({ reviewer: e.target.value })} /></label>
        <label className="iad-field">复核说明<textarea value={comment} onChange={e => draft.update({ comment: e.target.value })} /></label>
        <div className="iad-actions">{([['PASS', '良品'], ['HARD_NORMAL', '困难正常'], ['FAIL', '异常'], ['UNCERTAIN', '不确定'], ['SKIP', '跳过']] as [Decision, string][]).map(([value, label]) =>
          <button key={value} className={value === "FAIL" ? "iad-danger" : ""} disabled={busy} onClick={() => submit(value)}>{label}</button>)}</div>
      </section> : null}
    </>}
    {lightbox && <ImageViewer image={lightbox} onClose={() => setLightbox(null)} />}
  </aside>;
}
