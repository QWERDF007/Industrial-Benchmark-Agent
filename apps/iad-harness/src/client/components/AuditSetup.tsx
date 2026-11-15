import {v4 as uuid} from 'uuid';
import React, {useRef, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import type {AuditStartRequest, Dataset, JobSnapshot} from '../../shared/contracts.js';
import type {AuditSourceCatalog, AuditKnowledgeSource} from '../../shared/domain.generated.js';
import {message, request} from '../api.js';
import {useModuleSettings} from '../useModuleSettings.js';
import {promptDefaults} from '../../shared/prompt-defaults.generated.js';
import {useResource} from '../useResource.js';
import {Button} from './Button.js';
import {AgentPromptEditors,PromptTextEditor} from './AgentPromptEditors.js';
import {Select} from './Select.js';
import {KnowledgeEntryDialog} from './KnowledgeEntryDialog.js';
import {ConsistencyStatisticsDrawer} from './ConsistencyStatisticsDrawer.js';
import {ConsistencyView} from '../consistency-view.js';
import {queryClient} from '../query-client.js';
import {JobList} from './JobList.js';
import {useJobList} from '../useJobList.js';
import {KnowledgeEntryList} from './KnowledgeEntryList.js';
import {JobStatusDrawer} from './JobStatusDrawer.js';
import {AnalysisPromptDrawer} from './AnalysisPromptDrawer.js';
import {ConsistencyPromptDrawer} from './ConsistencyPromptDrawer.js';

export function AuditSetup({datasets, availableDatasets, jobs, revision, onStarted, onCancel, onBusyChange}: {
  datasets:Dataset[];availableDatasets:Dataset[];jobs:JobSnapshot[];revision:number;
  onStarted(jobs:JobSnapshot[]):void;onCancel():void;onBusyChange(busy:boolean):void;
}) {
  const model=useModuleSettings('audit');
  const scope=JSON.stringify(datasets.map(dataset=>dataset.dataset_id).sort());
  const catalog=useResource<AuditSourceCatalog>(`/audit/sources?${new URLSearchParams({dataset_ids:scope})}`,revision);
  const [versionId,setVersionId]=useState(''),[entryIds,setEntryIds]=useState<Set<string>>(new Set());
  const [consistencyId,setConsistencyId]=useState('');
  const [detail,setDetail]=useState<Pick<React.ComponentProps<typeof KnowledgeEntryDialog>,'source'|'checkId'>|null>(null);
  const [statisticsId,setStatisticsId]=useState('');
  const statistics=useQuery({queryKey:['iad','consistency-statistics',statisticsId],enabled:!!statisticsId,
    queryFn:({signal})=>ConsistencyView.statistics(statisticsId,signal)},queryClient);
  const [benchmarkId,setBenchmarkId]=useState('');
  const [statusJob,setStatusJob]=useState<JobSnapshot|null>(null),[promptJob,setPromptJob]=useState<JobSnapshot|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [systemPrompt,setSystemPrompt]=useState<string>(promptDefaults.system.audit);
  const [userPrompt,setUserPrompt]=useState<string>(promptDefaults.audit);
  const [masterSystem,setMasterSystem]=useState<string>(promptDefaults.auditMasterSystem);
  const [masterUser,setMasterUser]=useState<string>(promptDefaults.auditBatch);
  const [reportPrompt,setReportPrompt]=useState<string>(promptDefaults.auditReport);
  const submission=useRef<{identity:string;id:string}>();
  const knowledgeJobs=catalog.data?.knowledge_jobs || [], consistencyJobs=catalog.data?.consistency_jobs || [];
  const sourceJobs=catalog.data?.jobs||[];
  const knowledgeList=useJobList(sourceJobs.filter(job=>knowledgeJobs.some(source=>source.job_id===job.run_id)),scope);
  const consistencyList=useJobList(sourceJobs.filter(job=>consistencyJobs.some(source=>source.job_id===job.run_id)),scope);
  const chosen=knowledgeJobs.find(item=>item.version_id===versionId);
  const selectedEntries=chosen?.entries.filter(item=>entryIds.has(item.check_id)) || [];
  const selectedConsistency=consistencyJobs.find(item=>item.job_id===consistencyId);
  const reason=catalog.error || (catalog.loading?'正在读取来源作业':!datasets.length?'请选择审计子数据集':
    !selectedConsistency?'请选择一个已完成的一致性作业':!model.settings?.model?model.error || '请先配置模型审计分析模型':
    jobs.some(job=>['PENDING','RUNNING'].includes(job.status))?'当前范围仍有审计作业执行中':
    !masterSystem.trim()||!masterUser.trim()?'请填写主 Agent 提示词':!systemPrompt.trim()||!userPrompt.trim()?'请填写子 Agent 提示词':!reportPrompt.trim()?'请填写报告用户提示词':'');
  function selectKnowledge(job:AuditKnowledgeSource|null) {
    setVersionId(job?.version_id||'');setEntryIds(new Set());setDetail(null);setError('');
  }
  async function start() {
    if (reason || !selectedConsistency || busy) return;
    const body:Omit<AuditStartRequest,'submission_id'>={subset_ids:[datasets[0].dataset_id,...datasets.slice(1).map(dataset=>dataset.dataset_id)],
      knowledge:chosen&&selectedEntries.length?{job_id:chosen.job_id,version_id:chosen.version_id,entry_ids:selectedEntries.map(item=>item.check_id)}:null,
      consistency_job_id:selectedConsistency.job_id,master_prompt:{system_prompt:masterSystem,user_prompt:masterUser},
      observer_prompt:{system_prompt:systemPrompt,user_prompt:userPrompt},report_instruction:reportPrompt,benchmark_build_id:benchmarkId||null};
    const identity=JSON.stringify(body);
    if(submission.current?.identity!==identity)submission.current={identity,id:uuid()};
    setBusy(true);onBusyChange(true);setError('');
    try {onStarted([await request<JobSnapshot>('/audit/start',{...body,submission_id:submission.current.id})]);}
    catch(failure){setError(message(failure));}
    finally{setBusy(false);onBusyChange(false);}
  }
  return <div className="audit-create-page" id="audit-create-view" aria-busy={busy}>
    <JobList id="audit-create-knowledge-jobs" title="知识挖掘" list={knowledgeList} datasets={availableDatasets} loading={catalog.loading}
      actions={{status:setStatusJob,prompt:setPromptJob}}
      selection={{name:'audit-knowledge-source',label:'选择知识作业',selectedIds:new Set(chosen?[chosen.job_id]:[]),disabled:busy,onChange:ids=>{
        const added=[...ids].find(id=>id!==chosen?.job_id);
        const job=sourceJobs.find(job=>job.run_id===added);
        selectKnowledge(added?(knowledgeJobs.find(source=>source.job_id===added&&source.version_id===job?.knowledge_version_id)
          ||knowledgeJobs.find(source=>source.job_id===added)!) :null);
      }}}/>
    {chosen&&<section id="audit-create-entries" className="audit-panel audit-source-panel">
      <KnowledgeEntryList key={chosen.version_id} source={{kind:'published',versionId:chosen.version_id}} revision={revision}
        actions={{view:entry=>setDetail({source:{kind:'published',versionId:chosen.version_id},checkId:entry.check_id})}}
        selection={{name:'audit-knowledge-entry',label:'选择知识条目',selectedIds:entryIds,onChange:setEntryIds,disabled:busy}}
        headerActions={<label className="audit-pick-all"><input id="audit-entries-all" type="checkbox" disabled={busy}
          checked={!!selectedEntries.length&&selectedEntries.length===chosen.entries.length}
          ref={node=>{if(node)node.indeterminate=selectedEntries.length>0&&selectedEntries.length<chosen.entries.length;}}
          onChange={event=>setEntryIds(event.target.checked?new Set(chosen.entries.map(entry=>entry.check_id)):new Set())}/>全选</label>}>
        {knowledgeJobs.filter(source=>source.job_id===chosen.job_id).length>1&&<label className="iad-knowledge-version">结果版本
          <Select aria-label="知识结果版本" value={chosen.version_id} disabled={busy} onChange={event=>selectKnowledge(knowledgeJobs.find(source=>source.version_id===event.target.value)!)}>
            {knowledgeJobs.filter(source=>source.job_id===chosen.job_id).map(source=><option key={source.version_id} value={source.version_id}>知识版本 {source.version_id.slice(-8)}</option>)}
          </Select>
        </label>}
      </KnowledgeEntryList>
    </section>}
    <JobList id="audit-create-consistency-jobs" title="数据一致性" list={consistencyList} datasets={availableDatasets} loading={catalog.loading}
      actions={{status:setStatusJob,prompt:setPromptJob,additional:[{id:'statistics',label:'统计',icon:'stats',onClick:job=>setStatisticsId(job.run_id)}]}}
      selection={{name:'audit-consistency-source',label:'选择一致性作业',selectedIds:new Set(selectedConsistency?[selectedConsistency.job_id]:[]),disabled:busy,
        onChange:ids=>setConsistencyId([...ids].find(id=>id!==consistencyId)||'')}}/>
    {!!catalog.data?.benchmark_builds.length&&<section className="audit-panel audit-source-panel"><header className="audit-panel-head"><h2>已有 Benchmark 成果</h2></header>
      <Select aria-label="已有 Benchmark 成果" value={benchmarkId} disabled={busy} onChange={event=>setBenchmarkId(event.target.value)}>
        <option value="">不关联</option>{catalog.data.benchmark_builds.map(build=><option key={build.build_id} value={build.build_id}>
          {build.name}，覆盖 {build.covered_images} 张，来源共 {build.source_images} 张</option>)}
      </Select>
    </section>}
    <section className="audit-panel audit-source-panel"><header className="audit-panel-head"><h2>提示词</h2></header>
      <AgentPromptEditors id="audit-master-prompt" agentLabel="主 Agent" system={masterSystem} user={masterUser}
        onSystemChange={setMasterSystem} onUserChange={setMasterUser} disabled={busy}/>
      <AgentPromptEditors id="audit-observer-prompt" agentLabel="子 Agent" system={systemPrompt} user={userPrompt}
        onSystemChange={setSystemPrompt} onUserChange={setUserPrompt} disabled={busy}/>
      <div className="iad-agent-prompts"><PromptTextEditor id="audit-report-prompt" label="报告用户提示词" value={reportPrompt} onChange={setReportPrompt} disabled={busy}/></div>
    </section>
    <section className="audit-panel audit-source-panel"><header className="audit-panel-head"><h2>确认并启动</h2></header>
      <div className="audit-create-confirm"><dl className="audit-create-facts" id="audit-create-summary" aria-live="polite">
        <div><dt>审计范围</dt><dd>{datasets.map(dataset=>dataset.name).join('、') || '未选择'}</dd></div>
        <div><dt>知识挖掘</dt><dd>{chosen?.job_id || '未选择'}</dd></div>
        <div><dt>知识条目</dt><dd>{selectedEntries.length} 条</dd></div>
        <div><dt>数据一致性</dt><dd>{selectedConsistency?1:0} 个已完成作业</dd></div>
      </dl><div className="audit-create-actions"><Button id="audit-create-cancel" disabled={busy} onClick={onCancel}>取消</Button>
        <Button id="audit-create-submit" variant="primary" disabled={busy||!!reason} title={reason} onClick={()=>void start()}>{busy?'启动中…':'开始审计'}</Button></div></div>
      {error&&<p className="audit-source-error" role="alert">{error}</p>}{catalog.error&&<p className="audit-source-error" role="alert">{catalog.error}</p>}
    </section>
    {statusJob&&<JobStatusDrawer job={statusJob} onClose={()=>setStatusJob(null)}/>}
    {promptJob&&(promptJob.analysis_kind==='knowledge'?<AnalysisPromptDrawer title="知识挖掘提示词" jobId={promptJob.run_id} onClose={()=>setPromptJob(null)}/>
      :<ConsistencyPromptDrawer job={promptJob} onClose={()=>setPromptJob(null)}/>)}
    {detail&&<KnowledgeEntryDialog {...detail} onClose={()=>setDetail(null)}/>}
    {statisticsId&&<ConsistencyStatisticsDrawer statistics={statistics.data} loading={statistics.isPending}
      error={statistics.error?.message} onClose={()=>setStatisticsId('')}/>}
  </div>;
}
