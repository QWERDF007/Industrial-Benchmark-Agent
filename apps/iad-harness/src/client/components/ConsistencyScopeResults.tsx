import React,{useEffect,useState} from 'react';
import type {ConsistencyBatch,ConsistencyQuery,ConsistencyReport,Dataset} from '../../shared/contracts.js';
import {imageRelations} from '../../shared/consistency-presentation.js';
import {mediaUrl,message,request} from '../api.js';
import {useWorkspace} from '../workspace.js';
import {ConsistencyScopePicker} from './ConsistencyScopePicker.js';
import {ConsistencyGroups} from './ConsistencyGroups.js';
import {ConsistencyReportSummary} from './ConsistencyReportSummary.js';
import {ConsistencyEmpty} from './ConsistencyEmpty.js';
import {ConsistencyEvidencePreview} from './ConsistencyEvidencePreview.js';
import {useConsistencyStart} from '../useConsistencyStart.js';
import {jobStatuses} from '../../shared/job-display.js';

export function ConsistencyScopeResults({datasets,tab}:{datasets:Dataset[];tab:'conflicts'|'groups'}) {
  const {state,workspace}=useWorkspace();
  const scope=state.consistency.scope || {kind:'all_registered' as const};
  const facts=state.consistency.facts || 'CURRENT';
  const [subject,setSubject]=useState('all'),[conflict,setConflict]=useState('confirmed');
  const [review,setReview]=useState<NonNullable<ConsistencyQuery['review_state']>|''>('');
  const [report,setReport]=useState<ConsistencyReport|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [cursor,setCursor]=useState<string|undefined>(),[revision,setRevision]=useState(0);
  const selected=state.consistency.resultId;
  const batchId=state.consistency.batchId || '';
  const [batch,setBatch]=useState<ConsistencyBatch|null>(null);
  const [batchError,setBatchError]=useState('');
  const actions=useConsistencyStart(id=>{setBatch(null);workspace.updateConsistency({batchId:id},true);});
  useEffect(()=>{
    if(!batchId)return;
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
    setBatch(null);setBatchError('');
    async function poll(){
      try {
        const current=await request<ConsistencyBatch>(`/consistency/runs/${encodeURIComponent(batchId)}`,undefined,undefined,AbortSignal.any([controller.signal,AbortSignal.timeout(10000)]));
        if(controller.signal.aborted)return;setBatch(current);setBatchError('');
        if(['PENDING','RUNNING'].includes(current.status))timer=setTimeout(poll,1200);
        else {setCursor(undefined);setRevision(value=>value+1);}
      } catch(failure){if(!controller.signal.aborted){setBatchError(message(failure));timer=setTimeout(poll,5000);}}
    }
    void poll();return()=>{controller.abort();clearTimeout(timer);};
  },[batchId]);
  const scopeKey=JSON.stringify(scope);
  useEffect(()=>{setCursor(undefined);},[scopeKey,subject,conflict,facts,tab,review]);
  useEffect(()=>{
    const controller=new AbortController();setBusy(true);setError('');setReport(null);
    const input:ConsistencyQuery={selection:{kind:'scope',subjects:subject==='all' ? {kind:'all_registered'} : {kind:'datasets',dataset_ids:[subject]},corpus_scope:scope,facts,mode:'exact'},
      relation:tab==='groups' ? 'EXACT' : undefined,confirmed_conflict:tab==='conflicts' && conflict==='confirmed' ? true : undefined,
      review_state:review||undefined,cursor,page_size:20};
    request<ConsistencyReport>('/consistency/report',input,undefined,controller.signal)
      .then(data=>{if(!controller.signal.aborted)setReport(data);}).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));})
      .finally(()=>{if(!controller.signal.aborted)setBusy(false);});
    return()=>controller.abort();
  },[scopeKey,subject,conflict,facts,tab,cursor,revision,review]);
  const item=report?.page.items.find(row=>row.result.result_id===selected) || report?.page.items[0];
  return <section aria-label="范围一致性结果">
    <form className="iad-consistency-query" onSubmit={event=>{event.preventDefault();setCursor(undefined);setRevision(value=>value+1);}}><fieldset disabled={busy}><legend className="iad-visually-hidden">结果范围</legend><div className="iad-row">
      <label className="iad-filter">检查范围<select aria-label="结果检查范围" value={subject} onChange={event=>setSubject(event.target.value)}><option value="all">全部已注册数据集</option>{datasets.map(item=><option key={item.dataset_id} value={item.dataset_id}>{item.name}</option>)}</select></label>
      <ConsistencyScopePicker datasets={datasets} value={scope} onChange={value=>workspace.updateConsistency({scope:value,groupId:undefined,groupPage:1,memberPage:1},true)} />
      <label className="iad-filter">事实来源<select aria-label="事实来源" value={facts} onChange={event=>workspace.updateConsistency({facts:event.target.value as 'CURRENT'|'HISTORICAL'|'UNKNOWN'},true)}>
        <option value="CURRENT">当前来源</option><option value="HISTORICAL">历史来源</option><option value="UNKNOWN">无法核实</option></select></label>
      {tab==='conflicts' && <label className="iad-filter">差异筛选<select aria-label="差异筛选" value={conflict} onChange={event=>setConflict(event.target.value)}><option value="confirmed">已确认冲突</option><option value="all">全部比较与待确认</option></select></label>}
      <label className="iad-filter">处置状态<select aria-label="处置状态筛选" value={review} onChange={event=>setReview(event.target.value as typeof review)}><option value="">全部处置状态</option><option value="OPEN">待复核</option><option value="NEEDS_CONTEXT">待补充依据</option><option value="RESOLVED">已裁决</option></select></label>
      <button className="iad-primary" type="button" disabled={!datasets.length||actions.busy||!!batchId&&!batch||!!batch&&['PENDING','RUNNING'].includes(batch.status)} onClick={()=>void actions.start('/consistency/start',{subjects:subject==='all' ? {kind:'all_registered'} : {kind:'datasets',dataset_ids:[subject]},corpus_scope:scope,mode:'exact'})}>{actions.busy ? '正在启动…' : '开始批量检查'}</button>
      <button type="submit">刷新结果</button>
    </div></fieldset></form>
    {(error||actions.error) && <p role="alert" className="iad-error">{error||actions.error}</p>}{actions.notice && <p role="status">{actions.notice}</p>}{busy && <p role="status">正在读取范围结果…</p>}
    {batchId && (batchError||!batch||batch.status!=='COMPLETED') && <div className="iad-consistency-status" role="status"><strong>{batchError ? '批次状态未核实' : batch ? jobStatuses[batch.status] : '正在读取批次状态'}</strong>{batch && <span>完成 {batch.completed} / {batch.total} · 失败 {batch.failed} · 未处理 {batch.unprocessed}</span>}{batchError && <span className="iad-error" role="alert">{batchError}</span>}<button onClick={()=>workspace.updateConsistency({tab:'jobs',batchId},true)}>查看作业</button></div>}
    {report && <>
      <ConsistencyReportSummary report={report} facts={facts}>{batchId && <button className="iad-consistency-text-button" onClick={()=>workspace.updateConsistency({tab:'jobs',batchId},true)}>查看作业</button>}</ConsistencyReportSummary>
      {tab==='groups' ? <ConsistencyGroups queryId={report.page.query_id} datasets={datasets} /> : <section aria-label="范围比较结果">
        {!report.page.total ? <ConsistencyEmpty title={report.page.execution.failed||report.page.execution.unsupported ? '当前范围检查不完整' : report.page.execution.completed ? '当前筛选没有比较结果' : '尚未执行一致性检查'} description={report.page.execution.failed||report.page.execution.unsupported ? '请到作业记录查看失败或不支持的原因；未成功检查的图像不代表没有冲突。' : report.page.execution.completed ? '可调整差异或处置状态筛选，查看已保存的检查事实。' : '选择检查范围与检索范围后开始检查，结果将在此显示。'}><button onClick={()=>workspace.updateConsistency({tab:'jobs'})}>前往批量检查</button></ConsistencyEmpty> : <div className="iad-consistency-master-detail">
          <aside className="iad-consistency-list" aria-label="冲突比较列表"><header className="iad-consistency-panel-header"><strong>标注冲突</strong><span>{report.page.total} 对比较</span></header>
            <div className="iad-consistency-list-scroll">{report.page.items.map(row=>{const source=row.facts_state==='CURRENT' ? datasets.find(dataset=>row.sample_a.startsWith(dataset.dataset_id+':')) : undefined;return <button className={source ? 'iad-consistency-thumbnail-item' : undefined} key={row.result.result_id} data-facts-state={row.facts_state} aria-pressed={row===item} onClick={()=>workspace.updateConsistency({resultId:row.result.result_id,differenceId:undefined},true)}>
              {source && <img alt="比较图像缩略图" loading="lazy" src={mediaUrl({task_id:source.task_id,sample_id:row.sample_a},'thumbnail')} />}<span className="iad-consistency-list-caption">
              <strong title={`${row.sample_a} ↔ ${row.sample_b}`}>{row.sample_a.split(':').slice(1).join(':')} ↔ {row.sample_b.split(':').slice(1).join(':')}</strong>
              <span>{imageRelations[row.result.verification.relation]} · {row.result.annotation.differences.length} 项差异</span>
              <small>{row.facts_state==='CURRENT' ? '当前' : row.facts_state==='HISTORICAL' ? '历史' : '无法核实'} · {row.result.annotation.confirmed_conflict ? '已确认冲突' : '待确认'}{!row.evidence_available && ' · 原图不可恢复'}</small>
            </span></button>;})}</div>
          </aside>
          {item?.evidence_available ? <ConsistencyEvidencePreview key={item.result.evidence_id} evidenceId={item.result.evidence_id} /> : <ConsistencyEmpty title="证据不可恢复" description="保留已有比较事实；当前无法读取该组的原图证据。" />}
        </div>}
        {report.page.next_cursor && <button onClick={()=>setCursor(report.page.next_cursor!)}>下一页比较</button>}{cursor && <button onClick={()=>setCursor(undefined)}>返回首批比较</button>}
      </section>}
    </>}
  </section>;
}
