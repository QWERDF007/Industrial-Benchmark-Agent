import React from 'react';
import type {AuditSampleItem} from '../../shared/domain.generated.js';
import {auditStateLabels} from '../../shared/audit.generated.js';
import {mediaUrl, nativeAuditEvidenceUrl} from '../api.js';

export function auditSampleImage(sample: AuditSampleItem, taskId: string) {
  if(sample.overview_evidence_id) {
    return nativeAuditEvidenceUrl(sample.run_id,sample.sample_id,{evidence_id:sample.overview_evidence_id});
  }
  return mediaUrl({task_id: taskId, sample_id: sample.sample_id});
}

export function AuditStatus({state}: {state: AuditSampleItem['audit_state']}) {
  const colors = {suspect: 'warn', insufficient: 'neutral', normal: 'done', unprocessed: 'neutral', incomplete:'neutral'};
  return <span className={`audit-status ${colors[state]}`}>{auditStateLabels[state]}</span>;
}
