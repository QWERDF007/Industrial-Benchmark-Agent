import { jsx as _jsx } from "react/jsx-runtime";
import { auditStateLabels } from '../../shared/audit.generated.js';
import { auditEvidenceUrl, mediaUrl } from '../api.js';
export function auditSampleImage(sample, taskId) {
    return sample.suggestion_id && sample.overview_evidence_id
        ? auditEvidenceUrl(sample.suggestion_id, { evidence_id: sample.overview_evidence_id })
        : mediaUrl({ task_id: taskId, sample_id: sample.sample_id });
}
export function AuditStatus({ state }) {
    const colors = { suspect: 'warn', insufficient: 'neutral', normal: 'done', unprocessed: 'neutral' };
    return _jsx("span", { className: `audit-status ${colors[state]}`, children: auditStateLabels[state] });
}
