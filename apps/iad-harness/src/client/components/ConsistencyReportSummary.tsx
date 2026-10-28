import React from 'react';
import type {ConsistencyReport} from '../../shared/contracts.js';

export function ConsistencyReportSummary({report,facts='CURRENT',children}:{report:ConsistencyReport;facts?:'CURRENT'|'HISTORICAL'|'UNKNOWN';children?:React.ReactNode}) {
  const statistics=report.statistics[facts==='CURRENT'?'current':facts==='HISTORICAL'?'historical':'unknown'];
  const execution=report.page.execution;
  const notStarted=execution.completed===0 && execution.failed===0 && execution.unsupported===0;
  const complete=execution.total>0 && execution.completed===execution.total;
  return (
      <section aria-label="范围检查报告" className="iad-consistency-summary">
        <div className="iad-consistency-status"><strong>{execution.total===0 ? '当前范围没有图像' : notStarted ? '尚未执行检查' : complete ? '检查完成' : '范围检查不完整'}</strong>
          <span>范围 <b>{execution.total}</b> 张</span><span>已检查 <b>{execution.completed} / {execution.total}</b></span>
          <span>严格同图 <b>{statistics.strict_groups}</b> 组 · {statistics.strict_members} 成员</span><span>待复核 <b>{statistics.pending_review}</b></span>
          {!!execution.failed && <span className="iad-error">失败 {execution.failed}</span>}{!!execution.unsupported && <span>不支持 {execution.unsupported}</span>}{!!execution.pending && <span>未处理 {execution.pending}</span>}
          {children}
          <details className="iad-consistency-summary-details"><summary>检查明细</summary>
          <div className="iad-consistency-summary-body">
        <p className="iad-muted">检索库可用 {report.page.corpus.completed}/{report.page.corpus.total} · 当前结果 {report.page.facts.current} · 历史结果 {report.page.facts.historical} · 无法核实 {report.page.facts.unknown}</p>
        <div className="iad-row"><strong>严格同图 {statistics.strict_groups} 组 · {statistics.strict_members} 成员</strong><span>质量冲突 {statistics.confirmed_quality_conflicts || 0}</span><span>区域差异 {statistics.regional_differences || 0}</span><span>规范待确认 {statistics.policy_unknown || 0}</span></div>
        <p className="iad-muted">待复核 {statistics.pending_review ?? '未评估'} · 待修正 {statistics.pending_correction ?? '未评估'}</p>
        <p className="iad-muted">{facts==='CURRENT' ? '当前来源' : facts==='HISTORICAL' ? '历史来源' : '无法核实'} · 按当前筛选统计 · <time dateTime={report.page.observed_at}>{new Date(report.page.observed_at).toLocaleString()}</time></p>
        <div className="iad-row"><strong>当前范围 Gold · {report.gold.total} 张</strong><span>可确认 {report.gold.confirmed ?? '未评估'}</span><span>质量冲突 {report.gold.conflicts ?? '未评估'}</span><span>证据不足 {report.gold.excluded ?? '未评估'}</span><span>不可纳入 {report.gold_excluded ?? '未评估'}</span></div>
        {report.gold.unavailable_reason && <p className="iad-muted">{report.gold.unavailable_reason}</p>}
          </div></details></div>
      </section>
  );
}
