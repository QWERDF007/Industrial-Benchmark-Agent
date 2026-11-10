import {v4 as uuid} from 'uuid';
import React, {useRef, useState} from 'react';
import type {AuditStartRequest, Dataset, JobSnapshot} from '../../shared/contracts.js';
import type {AuditSourceCatalog, AuditKnowledgeSource} from '../../shared/domain.generated.js';
import {message, request} from '../api.js';
import {useModuleSettings} from '../useModuleSettings.js';
import {promptDefaults} from '../../shared/prompt-defaults.generated.js';
import {useResource} from '../useResource.js';
import {Button} from './Button.js';
import {AgentPromptEditors,PromptTextEditor} from './AgentPromptEditors.js';
import {Pagination} from './Pagination.js';

function sourceDuration(job: {started_at:string|null;finished_at:string|null}): string {
  if (!job.started_at || !job.finished_at) return '—';
  const seconds=Math.max(0,Math.round((Date.parse(job.finished_at)-Date.parse(job.started_at))/1000));
  return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}

export function AuditSetup({datasets, jobs, revision, onStarted, onCancel, onBusyChange}: {
  datasets:Dataset[];jobs:JobSnapshot[];revision:number;
  onStarted(jobs:JobSnapshot[]):void;onCancel():void;onBusyChange(busy:boolean):void;
}) {
  const model=useModuleSettings('audit');
  const scope=JSON.stringify(datasets.map(dataset=>dataset.dataset_id).sort());
  const catalog=useResource<AuditSourceCatalog>(`/audit/sources?${new URLSearchParams({dataset_ids:scope})}`,revision);
  const [versionId,setVersionId]=useState(''),[entryIds,setEntryIds]=useState<Set<string>>(new Set());
  const [consistencyId,setConsistencyId]=useState('');
  const [knowledgePage,setKnowledgePage]=useState(1),[entryPage,setEntryPage]=useState(1),[consistencyPage,setConsistencyPage]=useState(1);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [systemPrompt,setSystemPrompt]=useState<string>(promptDefaults.system.audit);
  const [userPrompt,setUserPrompt]=useState<string>(promptDefaults.audit);
  const [reportPrompt,setReportPrompt]=useState<string>(promptDefaults.auditReport);
  const submission=useRef<{identity:string;id:string}>();
  const knowledgeJobs=catalog.data?.knowledge_jobs || [], consistencyJobs=catalog.data?.consistency_jobs || [];
  const chosen=knowledgeJobs.find(item=>item.version_id===versionId);
  const selectedEntries=chosen?.entries.filter(item=>entryIds.has(item.check_id)) || [];
  const selectedConsistency=consistencyJobs.find(item=>item.job_id===consistencyId);
  const reason=catalog.error || (catalog.loading?'正在读取来源作业':!datasets.length?'请选择审计子数据集':
    !selectedConsistency?'请选择一个已完成的一致性作业':!model.settings?.model?model.error || '请先配置模型审计分析模型':
    jobs.some(job=>['PENDING','RUNNING'].includes(job.status))?'当前范围仍有审计作业执行中':
    !systemPrompt.trim()?'请填写系统提示词':!userPrompt.trim()?'请填写用户提示词':!reportPrompt.trim()?'请填写报告用户提示词':'');
  function selectKnowledge(job:AuditKnowledgeSource) {
    if (job.version_id===versionId) return;
    setVersionId(job.version_id);setEntryIds(new Set());setEntryPage(1);setError('');
  }
  async function start() {
    if (reason || !selectedConsistency || busy) return;
    const body:Omit<AuditStartRequest,'submission_id'>={subset_ids:[datasets[0].dataset_id,...datasets.slice(1).map(dataset=>dataset.dataset_id)],
      knowledge:chosen&&selectedEntries.length?{job_id:chosen.job_id,version_id:chosen.version_id,entry_ids:selectedEntries.map(item=>item.check_id)}:null,
      consistency_job_id:selectedConsistency.job_id,system_prompt:systemPrompt,instruction:userPrompt,report_instruction:reportPrompt};
    const identity=JSON.stringify(body);
    if(submission.current?.identity!==identity)submission.current={identity,id:uuid()};
    setBusy(true);onBusyChange(true);setError('');
    try {onStarted([await request<JobSnapshot>('/audit/start',{...body,submission_id:submission.current.id})]);}
    catch(failure){setError(message(failure));}
    finally{setBusy(false);onBusyChange(false);}
  }
  return <div className="audit-create-page" id="audit-create-view" aria-busy={busy}>
    <section className="audit-panel audit-source-panel"><header className="audit-panel-head"><h2>知识挖掘</h2></header>
      <div id="audit-create-knowledge-jobs">{knowledgeJobs.length?<>
        <div className="audit-source-table"><table className="audit-table"><colgroup><col style={{width:'35%'}}/><col style={{width:'12%'}}/><col style={{width:'11%'}}/><col style={{width:'21%'}}/><col style={{width:'11%'}}/><col style={{width:'10%'}}/></colgroup><thead><tr><th>作业名称</th><th>状态</th><th>判据数</th><th>提交时间</th><th>耗时</th><th>选择</th></tr></thead>
          <tbody>{knowledgeJobs.slice((knowledgePage-1)*6,knowledgePage*6).map(job=><tr key={job.version_id} data-version-id={job.version_id} aria-selected={job.version_id===versionId}
            onClick={()=>!busy&&selectKnowledge(job)}><td title={`${job.name}\n${job.version_id}`}>{job.name}</td><td><span className="audit-status done">{job.publication_status==='partial'?'部分成果':'已完成'}</span></td>
            <td>{job.entries.length}</td><td>{new Date(job.submitted_at).toLocaleString('zh-CN',{hour12:false})}</td><td>{sourceDuration(job)}</td>
            <td><input type="radio" name="audit-knowledge-source" aria-label={`选择${job.name}`} checked={job.version_id===versionId} disabled={busy}
              onChange={()=>selectKnowledge(job)} /></td></tr>)}</tbody></table></div>
        <Pagination total={knowledgeJobs.length} page={knowledgePage} size={6} label="知识挖掘来源" hideSinglePage onPage={setKnowledgePage} />
      </>:<p className="iad-result-empty" role="status">{catalog.loading?'正在读取来源作业…':'当前没有已发布的挖掘知识'}</p>}</div>
      {chosen&&<div id="audit-create-entries" className="audit-entry-area"><header className="audit-entry-header"><h3>知识条目</h3>
        <label className="audit-pick-all"><input id="audit-entries-all" type="checkbox" disabled={busy}
          checked={!!selectedEntries.length&&selectedEntries.length===chosen.entries.length}
          onChange={event=>setEntryIds(event.target.checked?new Set(chosen.entries.map(item=>item.check_id)):new Set())} />全选</label></header>
        <div className="audit-source-table"><table className="audit-table"><colgroup><col style={{width:64}}/><col style={{width:'27%'}}/><col/><col style={{width:'14%'}}/></colgroup><thead><tr><th>选择</th><th>知识条目</th><th>描述</th><th>支持/反对</th></tr></thead><tbody>
          {chosen.entries.slice((entryPage-1)*8,entryPage*8).map(entry=><tr key={entry.check_id} aria-selected={entryIds.has(entry.check_id)}>
            <td><input type="checkbox" aria-label={`选择知识条目 ${entry.title}`} checked={entryIds.has(entry.check_id)} disabled={busy}
              onChange={event=>setEntryIds(previous=>{const next=new Set(previous);event.target.checked?next.add(entry.check_id):next.delete(entry.check_id);return next;})} /></td>
            <td>{entry.title}</td><td className="audit-description">{entry.criterion}</td><td>{entry.support_count}/{entry.counter_count}</td>
          </tr>)}</tbody></table></div>
        <Pagination total={chosen.entries.length} page={entryPage} size={8} label="知识条目" hideSinglePage onPage={setEntryPage} />
      </div>}
    </section>
    <section className="audit-panel audit-source-panel"><header className="audit-panel-head"><h2>数据一致性</h2></header>
      <div id="audit-create-consistency-jobs">{consistencyJobs.length?<>
        <div className="audit-source-table"><table className="audit-table"><colgroup><col style={{width:64}}/><col style={{width:'20%'}}/><col style={{width:'10%'}}/><col style={{width:'23%'}}/><col style={{width:'11%'}}/><col style={{width:'20%'}}/><col/></colgroup><thead><tr><th>选择</th><th>作业</th><th>状态</th><th>检查范围</th><th>冲突总数</th><th>提交时间</th><th>耗时</th></tr></thead><tbody>
          {consistencyJobs.slice((consistencyPage-1)*7,consistencyPage*7).map(job=><tr key={job.job_id} aria-selected={consistencyId===job.job_id}>
            <td><input type="radio" name="audit-consistency-source" aria-label={`选择一致性作业 ${job.job_id}`} checked={consistencyId===job.job_id} disabled={busy}
              onChange={()=>setConsistencyId(job.job_id)} /></td>
            <td title={job.job_id}>{job.job_id}</td><td><span className="audit-status done">已完成</span></td>
            <td title={job.dataset_ids.map(id=>datasets.find(dataset=>dataset.dataset_id===id)?.name || id).join('、')}>
              {job.dataset_ids.map(id=>datasets.find(dataset=>dataset.dataset_id===id)?.name || id).join('、')}</td>
            <td>{job.conflict_count}</td><td>{new Date(job.submitted_at).toLocaleString('zh-CN',{hour12:false})}</td><td>{sourceDuration(job)}</td>
          </tr>)}</tbody></table></div>
        <Pagination total={consistencyJobs.length} page={consistencyPage} size={7} label="一致性来源" hideSinglePage onPage={setConsistencyPage} />
      </>:<p className="iad-result-empty" role="status">{catalog.loading?'正在读取来源作业…':'当前没有已完成的数据一致性检查作业'}</p>}</div>
    </section>
    <section className="audit-panel audit-source-panel"><header className="audit-panel-head"><h2>提示词</h2></header>
      <AgentPromptEditors id="audit-prompt" system={systemPrompt} user={userPrompt}
        onSystemChange={setSystemPrompt} onUserChange={setUserPrompt} disabled={busy}>
        <PromptTextEditor id="audit-report-prompt" label="报告用户提示词" value={reportPrompt} onChange={setReportPrompt} disabled={busy}/>
      </AgentPromptEditors>
    </section>
    <section className="audit-panel audit-source-panel"><header className="audit-panel-head"><h2>确认并启动</h2></header>
      <div className="audit-create-confirm"><dl className="audit-create-facts" id="audit-create-summary" aria-live="polite">
        <div><dt>审计范围</dt><dd>{datasets.map(dataset=>dataset.name).join('、') || '未选择'}</dd></div>
        <div><dt>知识挖掘</dt><dd>{chosen?.name || '未选择'}</dd></div>
        <div><dt>知识条目</dt><dd>{selectedEntries.length} 条</dd></div>
        <div><dt>数据一致性</dt><dd>{selectedConsistency?1:0} 个已完成作业</dd></div>
      </dl><div className="audit-create-actions"><Button id="audit-create-cancel" disabled={busy} onClick={onCancel}>取消</Button>
        <Button id="audit-create-submit" variant="primary" disabled={busy||!!reason} title={reason} onClick={()=>void start()}>{busy?'启动中…':'开始审计'}</Button></div></div>
      {error&&<p className="audit-source-error" role="alert">{error}</p>}{catalog.error&&<p className="audit-source-error" role="alert">{catalog.error}</p>}
    </section>
  </div>;
}
