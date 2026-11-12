import React from 'react';
import type {AuditRunReport,AuditReportImage} from '../../shared/domain.generated.js';
import {auditCapabilityLabels,auditCoverageLabels,auditDiscoveryStatusLabels,auditPurposeLabels,auditUsabilityLabels,auditReadinessLabels,auditIssueLabels,auditIssueTypesByFormat} from '../../shared/audit.generated.js';
import {AuditEvidenceGallery} from './AuditEvidenceGallery.js';
import {AuditReportChart} from './AuditReportChart.js';

const metadataLabels:Record<string,string>={physical_sample_id:'物理件',capture_sequence_id:'采集序列',batch_id:'批次',station:'站点',camera:'相机',data_origin:'来源'};

export function AuditReportContent({report,imageUrl}:{report:AuditRunReport;imageUrl(item:AuditReportImage):string}) {
  const stats=report.statistics,profile=report.dataset_profile;
  const {coverage_topics:topics=[],consistency_analyses:analyses=[]}=report;
  const kinds=profile?auditIssueTypesByFormat[profile.dataset_format]:Object.keys(stats?.issue_types||{}) as (keyof typeof auditIssueLabels)[];
  const showReadiness=report.capabilities.some(item=>item.readiness_status!=='not_evaluated');
  return <article className="iad-audit-document">
    <header className="iad-audit-report-intro"><h1>模型审计报告</h1>
      <p>{Object.values(report.dataset_names).join('、')}</p>
      <div className="iad-audit-report-meta"><span>审计覆盖 {report.audited_samples} / {report.total_samples} 张</span>
        {report.model_name&&<span>审计模型 {report.model_name}</span>}
        {report.finished_at&&<span>报告完成时间 {new Date(report.finished_at).toLocaleString('zh-CN',{hour12:false})}</span>}
        {profile&&<span>数据格式 {profile.dataset_format==='labelme'?'Labelme':'目录分类'}</span>}
      </div>
    </header>
    <section className="iad-report-section"><h2>总体结论与统计</h2>
      <p>{report.conclusion||'整体分析尚未完成。'}</p>
      <AuditReportChart kind="outcomes" title="本轮审计结果" unit="张" rows={[
        {label:'审计正常',value:stats?.normal_images??report.distribution.normal??0},
        {label:'发现疑点',value:report.suspect_samples},{label:'未完成',value:report.total_samples-report.audited_samples}]}/>
    </section>
    <section className="iad-report-section"><h2>标注质量与疑点</h2>
      {stats?<><p>保留模型疑点 {stats.suspect_images} 张图像，{stats.issue_occurrences} 项。
        {stats.suspect_rate_among_completed!==null&&<>占已完成图像的 {(100*stats.suspect_rate_among_completed).toLocaleString('zh-CN',{maximumFractionDigits:2})}%。</>}</p>
        <p>普通观察 {stats.observation_images} 张图像，{stats.observation_occurrences} 条。普通观察不计入质量疑点，模型疑点需人工复核。</p>
      </>:<p>本作业尚无质量汇总统计。</p>}
    </section>
    <section className="iad-report-section"><h2>覆盖画像</h2><p>{report.coverage_analysis}</p>
      {topics.map((topic,index)=><article className="iad-audit-discovery" key={index}>
        <h3>{topic.title}</h3><p>{topic.analysis}</p>
        <AuditEvidenceGallery items={report.evidence_groups['coverage:'+index]||[]} imageUrl={imageUrl}/>
      </article>)}
      <h3>独立性与代表性</h3><p>{report.independence_analysis}</p>
      {profile&&<dl className="iad-report-data">{Object.entries(profile.metadata).filter(([,item])=>item.covered_images>0).map(([key,item])=><div key={key}>
        <dt>{metadataLabels[key]}</dt><dd>{item.distinct_count} 种登记值，覆盖 {item.covered_images} / {profile.total_images} 张图像</dd></div>)}
        {profile.strict_duplicate_groups!==null&&<div><dt>严格重复</dt><dd>{profile.strict_duplicate_groups} 组，涉及 {profile.strict_duplicate_images} 张图像</dd></div>}
        {profile.near_candidate_pairs>0&&<div><dt>相近候选</dt><dd>{profile.near_candidate_pairs} 对</dd></div>}
      </dl>}
    </section>
    <section className="iad-report-section"><h2>数据一致性分析</h2><p>{report.consistency_analysis}</p>
      {!!kinds.length&&<><AuditReportChart kind="issues" title="各类模型疑点数" unit="项"
        rows={kinds.map(kind=>({label:auditIssueLabels[kind],value:stats?.issue_types[kind]?.occurrences??0}))}/>
        {kinds.map(kind=>{const entry=analyses.find(item=>item.issue_type===kind),count=stats?.issue_types[kind];return <article className="iad-audit-discovery" key={kind}>
          <h3>{auditIssueLabels[kind]}</h3>
          {stats&&<p className="iad-audit-scope">{count?.image_count??0} 张图像，{count?.occurrences??0} 项模型疑点</p>}
          {entry&&<p>{entry.analysis}</p>}
          <AuditEvidenceGallery items={report.evidence_groups['consistency:'+kind]||[]} imageUrl={imageUrl}/>
        </article>;})}</>}
    </section>
    <section className="iad-report-section"><h2>数据用途与可评测能力</h2>
      {!!report.usability.length&&<><h3>数据用途</h3><div className="iad-table-scroll"><table className="iad-audit-report-table">
        <thead><tr><th scope="col">用途</th><th scope="col">本次判断</th><th scope="col">实际依据</th></tr></thead><tbody>
          {report.usability.map(item=><tr key={item.purpose}><th scope="row">{auditPurposeLabels[item.purpose]}</th>
            <td><span className="iad-audit-status" data-status={item.status}>{auditUsabilityLabels[item.status]}</span></td><td>{item.reason}</td></tr>)}
        </tbody></table></div></>}
      {!!report.capabilities.length&&<><h3>可评测能力</h3><div className="iad-table-scroll"><table className="iad-audit-report-table">
        <thead><tr><th scope="col">能力</th><th scope="col">覆盖情况</th><th scope="col">实际依据与缺失条件</th>{showReadiness&&<th scope="col">正式就绪</th>}</tr></thead><tbody>
          {report.capabilities.map(item=><tr key={item.tag}><th scope="row">{auditCapabilityLabels[item.tag]}</th>
            <td><span className="iad-audit-status" data-status={item.coverage_status}>{auditCoverageLabels[item.coverage_status]}</span></td>
            <td>{item.reason}{!!item.missing_conditions.length&&<p>{item.missing_conditions.join('；')}</p>}</td>
            {showReadiness&&<td>{item.readiness_track&&<>{item.readiness_track}<br/></>}{auditReadinessLabels[item.readiness_status]}</td>}</tr>)}
        </tbody></table></div>
        {report.capabilities.filter(item=>report.evidence_groups['capability:'+item.tag]?.length).map(item=><article className="iad-audit-discovery" key={item.tag}>
          <h3>{auditCapabilityLabels[item.tag]}</h3><AuditEvidenceGallery items={report.evidence_groups['capability:'+item.tag]} imageUrl={imageUrl}/>
        </article>)}
      </>}
      {profile?.benchmark&&<><h3>已有 Benchmark 成果</h3>
        <p>划分覆盖本次审计 {profile.benchmark.covered_images} / {profile.total_images} 张图像，
          {profile.benchmark.source_matches_scope?'与审计范围一致。':'成果范围与审计范围不同。'}</p>
        <div className="iad-table-scroll"><table className="iad-audit-report-table"><thead><tr><th scope="col">评测轨道</th><th scope="col">就绪情况</th><th scope="col">已有依据</th></tr></thead><tbody>
          {Object.entries(profile.benchmark.readiness).map(([key,track])=><tr key={key}><th scope="row">{track.track_name}</th>
            <td>{auditReadinessLabels[track.status.toLowerCase() as keyof typeof auditReadinessLabels]}</td><td>{track.reason}</td></tr>)}
        </tbody></table></div>
      </>}
    </section>
    <section className="iad-report-section"><h2>关键发现与规律</h2>
      {report.discoveries.length?report.discoveries.map(discovery=><article className="iad-audit-discovery" key={discovery.group_id} data-audit-discovery={discovery.group_id}>
        <header><h3>{discovery.title}</h3><span className="iad-audit-status" data-status={discovery.status}>{auditDiscoveryStatusLabels[discovery.status]}</span></header>
        <p>{discovery.description}</p>
        {discovery.annotation_relation&&<p>{discovery.annotation_relation}</p>}
        {discovery.key_difference&&<p>{discovery.key_difference}</p>}
        <p className="iad-audit-scope">涉及 {discovery.affected_image_count} 张图像；{discovery.scope}</p>
        {discovery.unresolved_question&&<p>{discovery.unresolved_question}</p>}
        <AuditEvidenceGallery items={report.evidence_groups[discovery.group_id]||[]} imageUrl={imageUrl}/>
      </article>):<p>本作业尚无正式保存的关键发现。</p>}
    </section>
    <section className="iad-report-section"><h2>审计依据与适用边界</h2>
      <p>依据本次冻结原图、原始标注、逐图审计结果和所选数据一致性结果。</p>
      {!!Object.keys(report.knowledge_titles).length?<><h3>所选知识的实际作用</h3><p>{Object.values(report.knowledge_titles).join('、')}</p>
        {report.knowledge_analysis&&<p>{report.knowledge_analysis}</p>}</>:<p>本次未选用知识条目。</p>}
      {!!report.review_priorities.length&&<><h3>复核重点</h3><ul>{report.review_priorities.map((item,index)=><li key={index}>{item}</li>)}</ul></>}
      {!!report.limitations.length&&<><h3>适用边界</h3>{report.limitations.map((item,index)=><p key={index}>{item}</p>)}</>}
    </section>
  </article>;
}
