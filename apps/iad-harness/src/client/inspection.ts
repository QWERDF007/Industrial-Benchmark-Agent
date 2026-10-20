import type { AuditAnalysis, InspectionReference } from "../shared/contracts.js";
import { auditEvidenceUrl, auditImageIndex } from "./api.js";
import type { ImageSource } from "./components/ImageViewer.js";

export interface InspectionContext { reference: InspectionReference; analysis: AuditAnalysis; historical?: boolean }
export type InspectionSelection = { kind: "finding"; id: string } | { kind: "evidence"; id: string; findingId?: string };
export interface InspectionTransform { zoom: number; x: number; y: number }
export interface ImageView { selection: InspectionSelection | null; transform: InspectionTransform }
export interface InspectionView extends ImageView { reference: InspectionReference; sessionId?: string }

export function inspectionImage(inspection: InspectionContext, selection?: InspectionSelection | null, transform?: InspectionTransform): ImageSource {
  const { analysis, reference } = inspection;
  return { src: auditEvidenceUrl(reference.suggestion_id, analysis.overview), title: "送模全图概览",
    width: analysis.overview.sent_size[0], height: analysis.overview.sent_size[1],
    annotationLayer: { kind: "audit", analysis, suggestionId: reference.suggestion_id }, inspection,
    initialSelection: selection, initialTransform: transform };
}

export function restoreInspection(value: unknown, datasetId: string, sampleId: string): InspectionView | null {
  if (!value || typeof value !== "object") return null;
  const { reference, selection, transform, sessionId } = value as InspectionView;
  if (!reference || reference.dataset_id !== datasetId || reference.sample_id !== sampleId || !reference.suggestion_id || typeof reference.suggestion_id !== "string") return null;
  for (const id of [reference.finding_id, reference.evidence_id]) if (id != null && typeof id !== "string") return null;
  if (selection && (!['finding', 'evidence'].includes(selection.kind) || typeof selection.id !== 'string' || ('findingId' in selection && typeof selection.findingId !== 'string'))) return null;
  if (!transform || ![transform.zoom, transform.x, transform.y].every(Number.isFinite) || transform.zoom < 0) return null;
  return { reference, selection: selection || null, transform, ...(typeof sessionId === "string" ? { sessionId } : {}) };
}

export function resolveInspection(analysis: AuditAnalysis | undefined, selection: InspectionSelection | null) {
  const findingId = selection?.kind === "finding" ? selection.id : selection?.findingId;
  const finding = analysis?.findings.find(item => item.finding_id === findingId);
  const evidence = analysis && selection?.kind === "evidence" ? auditImageIndex(analysis).get(selection.id) : undefined;
  const region = analysis?.regions.find(item => selection?.kind === "evidence" ? item.image.evidence_id === selection.id
    : finding?.location.scope === "local" && finding.evidence_ids.includes(item.image.evidence_id));
  return { finding, evidence, region };
}
