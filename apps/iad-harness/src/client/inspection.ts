import type { AuditAnalysis } from "../shared/contracts.js";
import { auditImageIndex } from "./api.js";

export interface InspectionContext { suggestionId: string; analysis: AuditAnalysis }
export type InspectionSelection = { kind: "finding"; id: string } | { kind: "evidence"; id: string; findingId?: string };

export function resolveInspection(analysis: AuditAnalysis | undefined, selection: InspectionSelection | null) {
  const findingId = selection?.kind === "finding" ? selection.id : selection?.findingId;
  const finding = analysis?.findings.find(item => item.finding_id === findingId);
  const evidence = analysis && selection?.kind === "evidence" ? auditImageIndex(analysis).get(selection.id) : undefined;
  const region = analysis?.regions.find(item => selection?.kind === "evidence" ? item.image.evidence_id === selection.id
    : finding?.location.scope === "local" && finding.evidence_ids.includes(item.image.evidence_id));
  return { finding, evidence, region };
}
