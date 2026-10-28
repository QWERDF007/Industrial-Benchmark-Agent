import React from 'react';
import type {AuditConsistencyView, ConsistencyResult} from '../../shared/domain.generated.js';
import {imageRelations} from '../../shared/consistency-presentation.js';

export function AuditConsistency({record, onEvidence}: {
  record: AuditConsistencyView;
  onEvidence(result: ConsistencyResult): void;
}) {
  const conflicts = record.results.filter(result => result.annotation.confirmed_conflict).length;
  const pending = record.results.filter(result => result.annotation.policy_relation === 'UNKNOWN' && result.annotation.differences.length).length;
  return <section className="iad-info-group" aria-label="审计一致性检查" data-check-id={record.check_id}>
    <h3>数据一致性</h3>
    <p>{record.mode === 'exact' ? '精确检查' : record.mode === 'combined' ? '精确与视觉检查' : '视觉候选检查'} · {{COMPLETE:'已完成', PARTIAL:'部分完成', FAILED:'检查失败'}[record.status]}</p>
    <p>确认冲突 {conflicts} · 规范待确认 {pending} · 证据 {record.results.length}</p>
    {record.coverage && <p className="iad-muted">检索库 {record.coverage.corpus.completed} / {record.coverage.corpus.total}</p>}
    {record.coverage && <p className="iad-muted">成员核验 {record.coverage.verification.completed} / {record.coverage.verification.total}</p>}
    {record.reason && <p className="iad-error">{record.reason}</p>}
    <details><summary>检查证据 · {record.results.length}</summary>{record.results.map(result =>
      <div className="iad-annotation" key={result.result_id}>
        <span>{imageRelations[result.verification.relation]} · {result.annotation.confirmed_conflict ? '确认冲突' : result.annotation.policy_relation === 'UNKNOWN' && result.annotation.differences.length ? '规范待确认' : result.annotation.differences.length ? '存在差异' : '未发现标注差异'}</span>
        <button onClick={() => onEvidence(result)}>查看比较证据</button>
      </div>)}</details>
  </section>;
}
