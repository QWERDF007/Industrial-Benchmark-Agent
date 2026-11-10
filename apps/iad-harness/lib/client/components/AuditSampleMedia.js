import { jsx as _jsx } from "react/jsx-runtime";
import { auditStateLabels } from '../../shared/audit.generated.js';
import { mediaUrl, nativeAuditEvidenceUrl } from '../api.js';
export function auditSampleImage(sample, taskId) {
    if (sample.overview_evidence_id) {
        return nativeAuditEvidenceUrl(sample.run_id, sample.sample_id, { evidence_id: sample.overview_evidence_id });
    }
    return mediaUrl({ task_id: taskId, sample_id: sample.sample_id });
}
export function AuditStatus({ state }) {
    const colors = { suspect: 'warn', insufficient: 'neutral', normal: 'done', unprocessed: 'neutral', incomplete: 'neutral' };
    return _jsx("span", { className: `audit-status ${colors[state]}`, children: auditStateLabels[state] });
}
