import React from 'react';
import type {AuditSampleItem} from '../../shared/domain.generated.js';
import {auditStateLabels} from '../../shared/audit.generated.js';
import {auditEvidenceUrl, mediaUrl} from '../api.js';

export function auditSampleImage(sample: AuditSampleItem, taskId: string) {
  return sample.suggestion_id && sample.overview_evidence_id
    ? auditEvidenceUrl(sample.suggestion_id, {evidence_id: sample.overview_evidence_id})
    : mediaUrl({task_id: taskId, sample_id: sample.sample_id});
}

export function AuditStatus({state}: {state: AuditSampleItem['audit_state']}) {
  const colors = {suspect: 'warn', insufficient: 'neutral', normal: 'done', unprocessed: 'neutral'};
  return <span className={`audit-status ${colors[state]}`}>{auditStateLabels[state]}</span>;
}
