import React from "react";
import type { Report } from "../../shared/contracts.js";

export function QualityReport({ report }: { report: Report }) {
  const quality = report.quality;
  const dimensions = [
    ["技术可用率", quality.technical_usability],
    ["审计覆盖率", quality.audit_coverage],
    ["人工核验覆盖率", quality.human_verification_coverage],
  ] as const;
  return <>
    <dl>{dimensions.map(([label, ratio]) => <React.Fragment key={label}>
      <dt>{label}</dt><dd><strong>{ratio.percent === null ? "未评估" : `${ratio.percent}%`}</strong> · {ratio.numerator} / {ratio.denominator}</dd>
    </React.Fragment>)}</dl>
    <dl>
      <dt>疑点图像 / 数</dt><dd>{quality.model.suspect_samples} / {quality.model.finding_count}</dd>
      <dt>缺证 / 冲突图像</dt><dd>{quality.model.missing_evidence_samples} / {quality.model.conflict_samples}</dd>
      <dt>模型不确定</dt><dd>{quality.model.uncertain_samples}</dd>
      <dt>无结构化分析</dt><dd>{quality.model.unstructured_samples}</dd>
      <dt>人审良品 / 异常</dt><dd>良品 {report.human_pass_count} · 异常 {report.human_fail_count}</dd>
      <dt>人工待定 / 跳过</dt><dd>{report.human_uncertain_count} / {report.human_skipped_count}</dd>
    </dl>
    <details className="iad-analysis"><summary>口径、范围与版本</summary>
      <dl>
        <dt>输入 / 已登记</dt><dd>{quality.scope.observed_inputs} / {quality.scope.registered_samples}，未登记 {quality.scope.unregistered_inputs}</dd>
        <dt>范围</dt><dd>全部已保存图像，每张取最新记录；不受当前网格筛选影响。</dd>
        <dt>统计时间</dt><dd><time dateTime={report.generated_at}>{report.generated_at}</time></dd>
        {dimensions.map(([label, ratio]) => <React.Fragment key={label}><dt>{label}</dt><dd>{ratio.basis}</dd></React.Fragment>)}
      </dl>
      <h3>审计使用的知识组合</h3>
      {quality.knowledge_versions.length ? quality.knowledge_versions.map((usage, index) => <dl key={index}>
        <dt>图像数</dt><dd>{usage.sample_count}</dd>
        <dt>良品版本</dt><dd>{usage.normal_version_id || "未记录"}</dd>
        <dt>不良品版本</dt><dd>{usage.defect_version_id || "未使用"}</dd>
        {usage.legacy_profile_id && <><dt>参考模式</dt><dd>{usage.legacy_profile_id}</dd></>}
      </dl>) : <p>尚无可追溯的知识版本。</p>}
      <h3>审计作业</h3>
      {quality.audit_run_ids.length ? <ul>{quality.audit_run_ids.map(id => <li key={id}>{id}</li>)}</ul> : <p>尚无已记录的审计作业。</p>}
      <ul>{quality.scope.limitations.map(text => <li key={text}>{text}</li>)}</ul>
    </details>
  </>;
}
