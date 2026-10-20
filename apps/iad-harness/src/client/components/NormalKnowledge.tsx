import React from "react";
import type { NormalProfile } from "../../shared/contracts.js";

const qualifications: Record<string, string> = { initial_unannotated: "初始无标注", manual_selection: "人工选取", raw_pass: "原始良品", human_pass: "人审良品", human_hard_normal: "人审困难正常" };

export function NormalKnowledge({ profile }: { profile: NormalProfile }) {
  return <div className="iad-profile"><strong>MLLM 良品模式 · 语义特征</strong><p className="iad-muted">{profile.profile_id} · {new Date(profile.created_at).toLocaleString()}</p>
    <dl><dt>结构</dt><dd>{profile.patterns.structure}</dd><dt>纹理</dt><dd>{profile.patterns.texture}</dd>
      <dt>位置变化</dt><dd>{profile.patterns.position_variation}</dd><dt>光照变化</dt><dd>{profile.patterns.illumination_variation}</dd>
      <dt>允许差异</dt><dd>{profile.patterns.normal_allowances.join("；") || "未记录"}</dd><dt>局限与关注</dt><dd>{profile.patterns.cautions.join("；") || "未记录"}</dd></dl>
    <details><summary>参考来源 · {profile.sources.length} 张</summary>{profile.sources.map(source => <p key={source.sample_id}><span>{source.sample_id.split("/").pop()}</span> · {qualifications[source.qualification]}<br /><small className="iad-muted">SHA256 {source.sha256}</small></p>)}</details>
  </div>;
}
