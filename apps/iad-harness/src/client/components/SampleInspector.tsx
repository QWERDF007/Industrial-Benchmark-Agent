import React, { useEffect, useMemo, useRef, useState } from "react";
import type { AuditStartRequest, InspectionSnapshot, JobSnapshot, Dataset, ReviewDecisionRecord, SampleDetail, VisualEvidence } from "../../shared/contracts.js";
import { AnnotatedImage, ImageViewer, type ImageSource } from "./ImageViewer.js";
import { ImageCanvas } from "./ImageCanvas.js";
import { ReviewWorkspace } from "./ReviewWorkspace.js";
import { Modal, type ModalPresentation, type ModalProps } from "./Modal.js";
import { MediaLoad } from "./MediaLoad.js";
import { KnowledgeEvidenceGallery } from "./KnowledgeEvidenceGallery.js";
import { DatasetKnowledge } from "./DatasetKnowledge.js";
import { RuleAssessments } from "./RuleAssessments.js";
import { AuditFindings } from "./AuditFindings.js";
import { AuditEvidence } from "./AuditEvidence.js";
import { AuditConsistency } from "./AuditConsistency.js";
import { HumanReviewForm } from "./HumanReviewForm.js";
import { auditEvidenceUrl, regionSources, mediaUrl, message, request, reviewLabel, modelLabels } from "../api.js";
import { useWorkspace } from "../workspace.js";
import {useWorkbenchModel} from "../models.js";
import { inspectionImage } from "../inspection.js";
import { jobStatuses, jobPhases } from "../../shared/job-display.js";
import type { SampleNavigation } from "../useSampleNavigation.js";

export function SampleInspector({ dataset, sampleId, mode, revision, onReviewed, jobs, onJobsChanged, navigation, queue, filters, advanceOnSubmit = false, panel }: {
  panel?: Pick<ModalProps, "onClose" | "restoreFocus"> & { presentation: ModalPresentation; onOpen(open: boolean): void };
  queue?: React.ReactNode; filters?: React.ReactNode; advanceOnSubmit?: boolean;
  navigation?: SampleNavigation;
  jobs: JobSnapshot[]; onJobsChanged(): void;
  dataset: Dataset; sampleId: string; mode: "model" | "review" | "browse"; revision: number;
  onReviewed(record: ReviewDecisionRecord, relativePath: string): void;
}) {
  const { workspace, state } = useWorkspace();
  const model = useWorkbenchModel();
  const [loadedDetail, setDetail] = useState<SampleDetail | null>(null);
  const detail = loadedDetail?.sample.sample_id === sampleId ? loadedDetail : null;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const job = jobs.find(job => job.sample_ids.includes(sampleId));
  const jobRunning = jobs.some(job => job.status === "RUNNING" || job.status === "PENDING");
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const onPanelOpen = panel?.onOpen;
  useEffect(() => {if (lightbox) onPanelOpen?.(true);}, [lightbox, onPanelOpen]);
  const imageButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setDetail(null); setError(""); setLightbox(null);
  }, [sampleId]);
  useEffect(() => {
    const saved = workspace.view(workspace.getSnapshot().pageId).inspection;
    if (!saved || saved.reference.sample_id !== sampleId) return;
    const controller = new AbortController();
    request<InspectionSnapshot>("/inspection/context", saved.reference, undefined, controller.signal)
      .then(snapshot => { if (!controller.signal.aborted) setLightbox(inspectionImage({ reference: snapshot.reference, analysis: snapshot.analysis, historical: !snapshot.is_latest }, saved.selection, saved.transform)); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); });
    return () => controller.abort();
  }, [sampleId, workspace]);
  useEffect(() => {
    if (!sampleId) return;
    const controller = new AbortController();
    request<SampleDetail>(`/sample/${encodeURIComponent(sampleId)}`, undefined, undefined, controller.signal).then(value => { if (!controller.signal.aborted) setDetail(value); }).catch(e => {
      if (!controller.signal.aborted) setError(message(e));
    });
    return () => controller.abort();
  }, [sampleId, revision]);
  async function audit() {
    setBusy(true); setError("");
    try {
      const view = workspace.view("industrial-audit");
      const input: AuditStartRequest = { dataset_id: dataset.dataset_id, sample_ids: [sampleId],
        normal_version_id: view.normalVersion || undefined, defect_version_id: view.defectVersion || undefined,
        consistency_mode:view.auditConsistencyMode };
      const job = await request<JobSnapshot>("/audit/start", input); workspace.updateView("industrial-audit", {job:job.run_id}); onJobsChanged();
    }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  const evidenceSource = (evidence: VisualEvidence): ImageSource => {
    const suggestion = detail!.suggestion!;
    const analysis = suggestion.analysis!;
    return inspectionImage({ reference: { dataset_id: dataset.dataset_id, sample_id: sampleId, suggestion_id: suggestion.suggestion_id }, analysis }, { kind: "evidence", id: evidence.evidence_id });
  };
  const image = useMemo<ImageSource | null>(() => detail ? { src: mediaUrl(detail.sample), title: detail.sample.relative_path.split("/").pop()!, width: detail.sample.width, height: detail.sample.height,
    annotationLayer: { kind: "sample", annotations: detail.annotations, sample: detail.sample },
    inspection: detail.suggestion?.analysis ? { reference: { dataset_id: dataset.dataset_id, sample_id: sampleId, suggestion_id: detail.suggestion.suggestion_id }, analysis: detail.suggestion.analysis } : undefined } : null, [detail, dataset.dataset_id, sampleId]);
  useEffect(() => {
    if (navigation?.open && image && detail?.sample.sample_id === sampleId) {
      imageButton.current?.focus({ preventScroll: true });
      setLightbox({ ...image, initialSelection: null, initialTransform: { zoom: 0, x: 0, y: 0 } }); navigation.opened();
    }
  }, [navigation, image, detail, sampleId]);
  const information = detail && <>      <dl className="iad-info-group"><dt>图像路径</dt><dd title={detail.sample.image_path}>{detail.sample.image_path}</dd>
        <dt>图像名</dt><dd data-field="image-name">{detail.sample.relative_path.split("/").pop()}</dd>
        <dt>UUID</dt><dd data-field="sample-uuid"><code title={detail.sample.sample_uuid}>{detail.sample.sample_uuid}</code></dd>
        <dt>原始标签</dt><dd data-field="raw-label">{detail.sample.quality_status === "PASS" ? "OK" : detail.sample.quality_status === "FAIL" ? "NG" : "未标记"}{detail.sample.quality_source ? ` · ${detail.sample.quality_source}` : ""}</dd><dt>分辨率</dt><dd>{detail.sample.width} × {detail.sample.height}</dd>
        {mode !== "review" && <><dt>人工结果</dt><dd>{detail.review_decision ? `${reviewLabel(detail.review_decision.decision)} · ${detail.review_decision.reviewer}` : "待人工复核"}</dd></>}
        <dt>数据与技术质量</dt><dd>{detail.technical_quality_score}</dd></dl>
      {dataset.format !== "folder_classification" && <section className="iad-info-group">
        <h3>Labelme 标注 · {detail.annotations.length}</h3>
        {detail.annotations.length ? detail.annotations.map(a => <div className="iad-annotation" key={a.annotation_id}><strong>{a.raw_label}</strong><span>{a.bbox?.join(", ")} · {a.geometry_status}</span></div>) : <p className="iad-muted">无标注</p>}
        {detail.technical_issues.length > 0 && <div className="iad-error">{detail.technical_issues.map((i, index) => <p key={index}>{i.message}</p>)}</div>}
      </section>}
      {dataset.format === "folder_classification" && detail.technical_issues.length > 0 && <section className="iad-info-group">
        <div className="iad-error">{detail.technical_issues.map((i, index) => <p key={index}>{i.message}</p>)}</div>
      </section>}<section className="iad-info-group"><h3>模型观察</h3>{detail.suggestion ? <><p><strong>{modelLabels[detail.suggestion.suggested_label]}</strong> · {detail.suggestion.reason_category} · 模型自报置信度 {detail.suggestion.confidence === null ? "未记录" : `${Math.round(detail.suggestion.confidence * 100)}%`}</p>
        <p className="iad-observation">{detail.suggestion.notes}</p><small className="iad-muted">{detail.suggestion.model_name}</small>
        {detail.suggestion.analysis && <AuditFindings key={detail.suggestion.suggestion_id} analysis={detail.suggestion.analysis}
          onEvidence={(image, finding) => setLightbox({ ...evidenceSource(image), initialSelection: { kind: "evidence", id: image.evidence_id, findingId: finding.finding_id } })} onLocate={finding => {
            const overview = detail.suggestion!.analysis!.overview;
            setLightbox({ ...evidenceSource(overview), initialSelection: { kind: "finding", id: finding.finding_id } });
          }} />}
        <details><summary>良品知识来源 · {detail.suggestion.reference_sample_ids.length} 张</summary>{detail.normal_knowledge && <KnowledgeEvidenceGallery versionId={detail.normal_knowledge.version_id} items={detail.normal_knowledge.evidence.filter(item=>item.image.role === "normal" && item.image.representation === "raw" && detail.suggestion!.reference_sample_ids.includes(item.sample_id))} onOpen={setLightbox} />}</details>
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
          {detail.suggestion.analysis.joint_steps.length > 1 && <details><summary>联合分析记录 · {detail.suggestion.analysis.joint_steps.length} 步</summary>{detail.suggestion.analysis.joint_steps.map(step => <div key={step.step_id}><strong>{step.step_id} · {modelLabels[step.result.suggested_label]}</strong><p>{step.input_evidence_ids.length} 张图像{step.child_step_ids.length ? ` · 汇总 ${step.child_step_ids.join("、")}` : ""}</p><p>{step.result.description}</p>
            {"resolved_findings" in step.result && step.result.resolved_findings.map((resolution, index) => <div key={index}>
              <p>已排除疑点：{resolution.description}</p><p>正常解释：{resolution.normal_explanation}</p>
              <AuditEvidence analysis={detail.suggestion!.analysis!} ids={resolution.evidence_ids} label={resolution.description} onEvidence={image => setLightbox(evidenceSource(image))} />
            </div>)}
          </div>)}</details>}
          <p className="iad-muted">结论引用 {detail.suggestion.analysis.conclusion.evidence_ids.length} 项视觉证据</p>
          <p>位置分析：{detail.suggestion.analysis.conclusion.position_analysis}</p><p>光照分析：{detail.suggestion.analysis.conclusion.illumination_analysis}</p>
        </details>}
      </> : <p className="iad-muted">尚无模型观察。</p>}</section>
</>;
  const consistency = detail?.consistency && <AuditConsistency record={detail.consistency} onEvidence={result => workspace.openLocation({
    pageId:'industrial-consistency', tab:'search', query:{kind:'sample',sample_id:sampleId},
    evidenceId:result.evidence_id, resultId:result.result_id,
    returnPage:mode === 'model' ? 'industrial-audit' : mode === 'review' ? 'industrial-review' : 'industrial-images',
  })} />;
  const decision = detail && <HumanReviewForm key={sampleId} datasetId={dataset.dataset_id} sampleId={sampleId} detail={detail} advanceOnSubmit={advanceOnSubmit} onSubmitted={record => onReviewed(record, detail.sample.relative_path)} />;
  const lightboxView = <>    {lightbox && <ImageViewer image={lightbox} navigation={navigation} onClose={() => { navigation?.cancel(); setLightbox(null); if (workspace.view(state.pageId).inspection) workspace.updateView(state.pageId, { inspection: null }, true); }} />}
</>;
  if (queue !== undefined) return <div className="iad-inspector iad-focused-inspector">
    {error && <p role="alert" className="iad-error">{error}</p>}
    <ReviewWorkspace key={sampleId} queue={queue} filters={filters} information={<>{consistency}{information}</>} decision={decision} image={image && !lightbox ? <ImageCanvas image={image} embedded navigation={navigation ? {...navigation, move: offset => navigation.move(offset,"embedded")} : undefined} onExpand={view => setLightbox({...image,initialSelection:view.selection,initialTransform:view.transform})} /> : !sampleId ? <p className="iad-empty">当前复核队列已处理完成，或没有匹配的样本。</p> : !detail ? <p role="status">正在读取样本…</p> : null} />
    {lightboxView}
  </div>;
  const body = <aside className="iad-inspector"><h2>{mode === "review" ? "复核明细" : "样本详情"}</h2>
    {error && <p role="alert" className="iad-error">{error}</p>}
    {!sampleId ? <p>选择图像查看。</p> : !detail ? <p role="status">加载中…</p> : <>
      <MediaLoad key={image!.src}><button ref={imageButton} className="iad-image-button" onClick={() => setLightbox(image)} title="放大图像"><AnnotatedImage image={image!} /></button></MediaLoad>
      {consistency}
      {mode === "model" ? <>
        <strong className="iad-inspector-filename" data-field="image-name" title={detail.sample.relative_path}>{detail.sample.relative_path.split("/").pop()}</strong>
        <dl><dt>原始标签</dt><dd>{detail.sample.quality_status === "PASS" ? "OK" : detail.sample.quality_status === "FAIL" ? "NG" : "未标记"}</dd>
          <dt>人工结果</dt><dd>{detail.review_decision ? `${reviewLabel(detail.review_decision.decision)} · ${detail.review_decision.reviewer}` : "待人工复核"}</dd>
          <dt>模型建议</dt><dd>{detail.suggestion ? modelLabels[detail.suggestion.suggested_label] : "尚未审计"}</dd></dl>
        <h3>模型观察</h3><p className="iad-observation iad-observation-summary">{detail.suggestion?.notes || "尚无模型观察。"}</p>
        {detail.suggestion && <p className="iad-muted iad-inspector-basis">冻结依据：良品 {detail.normal_knowledge ? "已关联" : "未关联"} · 异常 {detail.defect_knowledge ? "已关联" : "未关联"}</p>}
        <div className="iad-actions">
          <button onClick={() => workspace.navigate("industrial-review", sampleId)}>前往人工复核</button>
          <button disabled={busy || jobRunning || !model.ready} onClick={audit}>{busy || jobRunning ? "正在联合审计…" : "按知识审计此图"}</button>
        </div>
        <details className="iad-audit-details"><summary>样本信息与审计详情</summary>{information}</details>
      </> : information}
      {mode === "model" && job && <section className="iad-single-job" aria-label="当前样本作业"><p role="status">{job.cancel_requested && ["PENDING","RUNNING"].includes(job.status) ? "正在停止" : jobStatuses[job.status]} · {jobPhases[job.phase || ""] || job.message}</p><button onClick={() => workspace.updateView("industrial-audit", {tab:"jobs",job:job.run_id})}>查看此图审计作业</button></section>}
      {mode === "review" && <HumanReviewForm key={sampleId} datasetId={dataset.dataset_id} sampleId={sampleId} detail={detail} advanceOnSubmit={advanceOnSubmit} onSubmitted={record => onReviewed(record, detail.sample.relative_path)} />}
    </>}
    {lightboxView}
  </aside>;
  const presentation = lightbox ? "inline" : panel?.presentation;
  return panel ? <Modal title="样本详情" onClose={panel.onClose} restoreFocus={panel.restoreFocus} presentation={presentation} className={`iad-audit-sample ${presentation === "modal" ? "iad-drawer" : ""}`}>{body}</Modal> : body;
}
