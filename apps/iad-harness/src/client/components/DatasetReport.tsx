import {Select} from './Select.js';
import React, {useEffect, useMemo, useState} from 'react';
import type {AuditSampleItem, DatasetReportView, ReportEvidence, ReportJobState} from '../../shared/domain.generated.js';
import {reportRequirements} from '../../shared/report-requirements.generated.js';
import {promptDefaults} from '../../shared/prompt-defaults.generated.js';
import {jobStatuses} from '../../shared/job-display.js';
import {auditEvidenceUrl, message, request} from '../api.js';
import {useResource} from '../useResource.js';
import {Button} from './Button.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {ImageViewer, type ImageSource} from './ImageViewer.js';

type ReportCatalog = {reports: Array<Pick<ReportJobState, 'run_id'|'status'|'created_at'> & {dataset_ids: string[]}>};
const statuses = {evaluable:'可评估',limited:'限定评估',needs_evidence:'待补证',unsupported:'不支持该指标'};
const outcomes = {normal_candidate:'未发现明确异常',anomaly_candidate:'异常候选',insufficient:'证据不足',not_processed:'未处理'};

function CountChart({title, values, labels}: {title:string; values:Record<string,number>; labels:Record<string,string>}) {
  const total=Object.values(values).reduce((sum,value)=>sum+value,0);
  return <figure className="iad-report-chart" aria-label={title}><figcaption>{title}</figcaption>
    {Object.entries(values).map(([key,value])=><div key={key} className="iad-report-bar"><span>{labels[key] || key}</span>
      <meter min={0} max={Math.max(1,total)} value={value} aria-label={`${labels[key] || key} ${value}`} /><span>{value}</span></div>)}
  </figure>;
}

export function DatasetReport({datasetIds,onSample}: {datasetIds:string[];onSample(sample:AuditSampleItem):void}) {
  const scope=JSON.stringify([...datasetIds].sort());
  const [revision,setRevision]=useState(0),[chosen,setChosen]=useState(''),[instruction,setInstruction]=useState(promptDefaults.report as string);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[lightbox,setLightbox]=useState<ImageSource|null>(null);
  const catalog=useResource<ReportCatalog>(datasetIds.length?`/dataset-reports?${new URLSearchParams({dataset_ids:scope})}`:null,revision);
  const runId=chosen || catalog.data?.reports[0]?.run_id || '';
  const [poll,setPoll]=useState(0);
  const state=useResource<ReportJobState>(runId?`/dataset-reports/${encodeURIComponent(runId)}/status`:null,poll);
  const running=state.data?.status==='RUNNING'||state.data?.status==='PENDING';
  useEffect(()=>{
    if(!running)return;
    const timer=window.setInterval(()=>{if(!document.hidden)setPoll(value=>value+1);},2000);
    return()=>clearInterval(timer);
  },[running]);
  const result=useResource<DatasetReportView>(state.data?.status==='COMPLETED'?`/dataset-reports/${encodeURIComponent(runId)}`:null);
  const report=result.data;
  const pictures=useMemo(()=>new Map((report?.evidence||[]).map(item=>[item.image.evidence_id,item])),[report]);
  const source=(item:ReportEvidence):ImageSource=>({src:auditEvidenceUrl(item.suggestion_id,item.image),title:'报告图像证据',
    width:item.image.original_size[0],height:item.image.original_size[1],sampleId:item.source.sample.sample_id,evidence:item.image,
    annotationLayer:{kind:'sample',sample:item.source.sample,annotations:item.source.annotations,
      maskUrls:Object.fromEntries(Object.entries(item.source.mask_evidence_ids).map(([id,eid])=>[id,auditEvidenceUrl(item.suggestion_id,{evidence_id:eid})]))}});
  async function generate(){
    setBusy(true);setError('');
    try{
      const job=await request<ReportJobState>('/dataset-reports',{submission_id:crypto.randomUUID(),dataset_ids:datasetIds,instruction});
      setChosen(job.run_id);setPoll(value=>value+1);setRevision(value=>value+1);
    }catch(failure){setError(message(failure));}finally{setBusy(false);}
  }
  async function download(){
    setBusy(true);setError('');
    try{
      const response=await fetch(`/api/iad/dataset-reports/${encodeURIComponent(runId)}/export`);
      if(!response.ok)throw new Error((await response.json()).error?.message || '报告导出失败');
      const url=URL.createObjectURL(await response.blob()),anchor=document.createElement('a');
      anchor.href=url;anchor.download=`dataset-report-${runId}.html`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),0);
    }catch(failure){setError(message(failure));}finally{setBusy(false);}
  }
  return <section className="audit-panel iad-dataset-report" id="audit-report"><header className="audit-panel-head"><h2>数据集与模型能力报告</h2>
    <div className="iad-actions"><Button variant="primary" id="generate-scope-report" disabled={!datasetIds.length||busy||running||!instruction.trim()} onClick={generate}>{busy?'正在提交…':'生成报告'}</Button>
      <Button disabled={!report||busy} onClick={download}>导出 HTML</Button></div></header>
    <div className="iad-report-body"><details className="iad-report-prompt"><summary>完整提示词</summary>
      <textarea aria-label="报告完整提示词" value={instruction} onChange={event=>setInstruction(event.target.value)} disabled={busy||running} /></details>
      {!!catalog.data?.reports.length&&<label className="iad-field">报告记录<Select aria-label="报告记录" value={runId} onChange={event=>setChosen(event.target.value)}>
        {catalog.data.reports.map(item=><option key={item.run_id} value={item.run_id}>{new Date(item.created_at).toLocaleString()}，{jobStatuses[item.status]}</option>)}
      </Select></label>}
      {(error||catalog.error||state.error||result.error)&&<p role="alert">{error||catalog.error||state.error||result.error}</p>}
      {state.data&&running&&<p role="status">正在分析冻结范围…</p>}
      {state.data?.error&&<p role="alert">{state.data.error}</p>}
      {!runId&&!catalog.loading&&<p>当前范围还没有报告，可以生成新报告。</p>}
      {report&&<><div className="iad-report-charts">
        <CountChart title="审计覆盖" values={{audited:report.audited_samples,unprocessed:report.registered_samples-report.audited_samples}} labels={{audited:'已审计',unprocessed:'未审计'}} />
        <CountChart title="审计结果分布" values={report.outcomes} labels={outcomes} />
        <CountChart title="原始标签分布" values={report.raw_labels} labels={{PASS:'OK',FAIL:'NG',UNCERTAIN:'待定'}} />
      </div>
      {Object.entries(reportRequirements).map(([key,requirement])=>{
        const section=report.conclusion.sections[key];
        const data=requirement.data.flatMap(name=>report.data[name]||[]);
        return <section key={key} data-report-section={key} className="iad-report-section"><h3>{requirement.title}</h3>
          <p>{statuses[section.status]}</p><p>{section.analysis}</p>
          <dl className="iad-report-data">{data.map((item,index)=><div key={index}><dt>{item.label}</dt><dd>{item.value}</dd><dd>{item.basis}</dd></div>)}</dl>
          <p>{section.conclusion}</p>{!!section.missing_evidence.length&&<p>待补充：{section.missing_evidence.join('；')}</p>}
          {!!section.evidence_ids.length&&<div className="iad-actions">{[...new Set(section.evidence_ids)].map((id,index)=>{
            const evidence=pictures.get(id);return evidence&&<Button key={id} onClick={()=>setLightbox(source(evidence))}>图像 {index+1}</Button>;
          })}</div>}
        </section>;
      })}
      <section className="iad-report-section"><h3>数据集能力结论</h3><p>{report.conclusion.dataset_analysis}</p><p>{report.conclusion.dataset_conclusion}</p></section>
      <section className="iad-report-section"><h3>模型能力结论</h3><p>{report.conclusion.model_analysis}</p><p>{report.conclusion.model_conclusion}</p></section>
      <section className="iad-report-section"><h3>图像证据</h3><div className="iad-thumbnail-grid">
        {report.evidence.map((item,index)=><div key={item.image.evidence_id}><ThumbnailCard src={auditEvidenceUrl(item.suggestion_id,item.image)} label={`图像 ${index+1}`} onClick={()=>setLightbox(source(item))} />
          <Button onClick={()=>onSample(item.audit_sample)}>查看审计</Button></div>)}
      </div></section></>}
    </div>{lightbox&&<ImageViewer image={lightbox} onClose={()=>setLightbox(null)} />}
  </section>;
}
