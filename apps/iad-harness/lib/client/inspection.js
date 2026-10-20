import { auditImageIndex } from "./api.js";
export function resolveInspection(analysis, selection) {
    const findingId = selection?.kind === "finding" ? selection.id : selection?.findingId;
    const finding = analysis?.findings.find(item => item.finding_id === findingId);
    const evidence = analysis && selection?.kind === "evidence" ? auditImageIndex(analysis).get(selection.id) : undefined;
    const region = analysis?.regions.find(item => selection?.kind === "evidence" ? item.image.evidence_id === selection.id
        : finding?.location.scope === "local" && finding.evidence_ids.includes(item.image.evidence_id));
    return { finding, evidence, region };
}
