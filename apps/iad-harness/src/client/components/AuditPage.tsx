import {SectionHeading} from './layout/SectionHeading.js';
import {WorkbenchHeader} from './layout/WorkbenchHeader.js';
import {TabBar} from './layout/TabBar.js';
import {Button} from './Button.js';
import {ThumbnailCard} from "./ThumbnailCard.js";
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import type {Dataset, DatasetGroup, JobSnapshot} from '../../shared/contracts.js';
import type {AuditSampleItem, AuditSamplePage} from '../../shared/domain.generated.js';
import {auditStateLabels,auditIssueLabels,auditAssessmentLabels} from '../../shared/audit.generated.js';
import {buildHierarchyGroups, getDatasetGroupId} from '../dataset-hierarchy.js';
import {useJobs} from '../useJobs.js';
import {useResource} from '../useResource.js';
import {useJobList} from '../useJobList.js';
import {useWorkspace} from '../workspace.js';
import {DatasetScopeSelector} from './DatasetScopeSelector.js';
import {PageTabs} from './layout/PageTabs.js';
import {RefreshIconButton, ClearFilterButton} from './CommonFilterControls.js';
import {JobList} from './JobList.js';
import {AuditStatisticsDrawer} from './AuditStatisticsDrawer.js';
import {AuditReport} from './AuditReport.js';
import {AuditSampleDialog} from './AuditSampleDialog.js';
import {auditSampleImage} from './AuditSampleMedia.js';
import {AuditPromptDrawer} from './AuditPromptDrawer.js';
import {AuditSetup} from './AuditSetup.js';
import {Select} from './Select.js';
import {Pagination} from './Pagination.js';
import {JobStatusDrawer} from './JobStatusDrawer.js';
import {request} from '../api.js';

export function AuditPage({dataset, datasets, groups, refreshRevision, onDatasetsChanged}: {
  dataset: Dataset; datasets: Dataset[]; groups: DatasetGroup[]; refreshRevision: number; onDatasetsChanged(): void;
}) {
  const {workspace} = useWorkspace();
  const view = workspace.view('industrial-audit');
  const hierarchy = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
  const groupId = hierarchy.find(group => group.group_id === view.datasetGroupId)?.group_id ?? getDatasetGroupId(dataset);
  const children = useMemo(() => datasets.filter(item => getDatasetGroupId(item) === groupId), [datasets, groupId]);
  const ids = (view.datasetIds ?? [dataset.dataset_id]).filter(id => children.some(child => child.dataset_id === id));
  const scope = JSON.stringify([...ids].sort());
  const [tab, setTab] = useState<'audit' | 'reports'>('audit');
  const [revision, setRevision] = useState(0);
  const [promptJob,setPromptJob]=useState('');
  const progress = useCallback(() => setRevision(value => value + 1), []);
  const jobs = useJobs('audit', ids, progress, view.job, refreshRevision);
  const selection = useJobList(jobs.jobs,scope,view.job,job=>workspace.updateView('industrial-audit',{job:job.root_run_id}));
  const [statisticsJob,setStatisticsJob]=useState<JobSnapshot|null>(null);
  const job = selection.selected;
  const [issueType,setIssueType]=useState(''),[sourceAssessment,setSourceAssessment]=useState('');
  const [search, setSearch] = useState(''), [status, setStatus] = useState('all'), [page, setPage] = useState(1);
  const createOpen=view.tab==='setup';
  const setCreateOpen=(open:boolean)=>workspace.updateView('industrial-audit',{tab:open?'setup':'results'});
  const [jobDetails, setJobDetails] = useState<JobSnapshot | null>(null);
  const [creatingBusy, setCreatingBusy] = useState(false);
  const [sample, setSample] = useState<AuditSampleItem | null>(null);
  useEffect(() => {setPage(1); setSearch(''); setStatus('all');setIssueType('');setSourceAssessment('');setSample(null);}, [job?.run_id]);
  const query = new URLSearchParams({page: String(page), page_size: '18', status, search,...(issueType?{issue_type:issueType}:{}),...(sourceAssessment?{consistency_assessment:sourceAssessment}:{})});
  const result = useResource<AuditSamplePage>(job && !createOpen && tab === 'audit'
    ? `/audit/jobs/${encodeURIComponent(job.run_id)}/samples?${query}` : null, revision);
  const hasResults=!!job&&job.total_samples>0&&!result.data?.archived;
  const setupDatasets = datasets.filter(item => ids.includes(item.dataset_id));
  const refresh = () => {jobs.refresh(); progress(); onDatasetsChanged();};
  return <div id="audit-page">
    <WorkbenchHeader pageId="industrial-audit" className="audit-heading" title={createOpen?'新建审计':undefined}>{createOpen
      ? <Button type="button" disabled={creatingBusy} onClick={() => setCreateOpen(false)}>返回作业与结果</Button>
      : <Button id="audit-new" variant="primary" type="button" disabled={!ids.length}
        title="新建审计" onClick={() => setCreateOpen(true)}>新建审计</Button>}</WorkbenchHeader>
    <DatasetScopeSelector groups={hierarchy} selectedGroupId={groupId} onGroupChange={next => {
      const first = datasets.find(item => getDatasetGroupId(item) === next);
      workspace.openLocation({pageId:'industrial-audit',datasetId:first?.dataset_id || dataset.dataset_id,
        datasetGroupId:next,datasetIds:first ? [first.dataset_id] : [],job:'',tab:'results'});
    }} childDatasets={children} selectedChildIds={ids} onChildToggle={id => {
      const next = ids.includes(id) ? ids.filter(value => value !== id) : [...ids,id];
      workspace.openLocation({pageId:'industrial-audit',datasetId:next[0] || dataset.dataset_id,
        datasetGroupId:groupId,datasetIds:next,job:'',tab:'results'});
    }} disabled={createOpen} className="audit-scope"
      groupId="audit-dataset" childId="audit-child-trigger" childMenuId="audit-child-menu">
      <RefreshIconButton onClick={refresh} />
    </DatasetScopeSelector>
    {jobs.error && <p role="alert">{jobs.error}</p>}
    {createOpen ? <AuditSetup key={scope} datasets={setupDatasets} availableDatasets={datasets} jobs={jobs.jobs}
        revision={revision + refreshRevision} onBusyChange={setCreatingBusy} onCancel={()=>setCreateOpen(false)} onStarted={started => {
          workspace.updateView('industrial-audit', {job: started[0]?.run_id || ''});
          selection.clear(); setCreateOpen(false); setTab('audit'); refresh();
        }} /> : <PageTabs<'audit' | 'reports'> label="审计视图" className="audit-tabs"
          items={[{id: 'audit', label: '模型审计'}, {id: 'reports', label: '报告'}]} value={tab} onChange={setTab}>
      <div hidden={tab !== 'audit'}>
        <JobList title="审计作业" list={selection} datasets={datasets} loading={jobs.loading} actions={{
          status:setJobDetails,prompt:job=>setPromptJob(job.run_id),delete:async job=>{
            await request(`/audit/delete/${encodeURIComponent(job.run_id)}`,{});refresh();
          },additional:[{id:'statistics',label:'统计',icon:'stats',onClick:setStatisticsJob}],
        }}/>
        <section className="audit-panel" aria-label="审计结果"><SectionHeading title="审计结果">
          {hasResults&&<div className="audit-filters"><label className="audit-field"><span>文件名</span><input type="search" aria-label="搜索审计图像"
            value={search} onChange={event => {setSearch(event.target.value); setPage(1);}} /></label>
            <label className="audit-field"><span>问题类别</span><Select aria-label="审计问题类别" value={issueType} onChange={event=>{setIssueType(event.target.value);setPage(1);}}><option value="">全部类别</option>{Object.entries(auditIssueLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></label>
            {result.data?.audit_scope!=='consistency'&&<label className="audit-field"><span>一致性核对</span><Select aria-label="一致性差异处理" value={sourceAssessment} onChange={event=>{setSourceAssessment(event.target.value);setPage(1);}}><option value="">全部处理</option>{Object.entries(auditAssessmentLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></label>}
            <ClearFilterButton onClick={() => {setIssueType('');setSourceAssessment('');setSearch(''); setStatus('all');setPage(1);}} /></div>}</SectionHeading>
          {hasResults&&<TabBar label="审计图像状态" value={status} onChange={value => {setStatus(value); setPage(1);}}
            items={(['all', ...Object.keys(result.data?.distribution||{})] as Array<'all' | keyof typeof auditStateLabels>).map(value => ({id: value,
              label: <>{value === 'all' ? '全部图像' : (result.data?.audit_scope==='consistency'&&value==='suspect'?'标注冲突':auditStateLabels[value])}{result.data && <span className="iad-tab-count">{value === 'all'
                ? Object.values(result.data.distribution).reduce((sum, value) => sum + value, 0) : result.data.distribution[value]}</span>}</>}))} />}<div id="audit-images">
            {!job && <p className="iad-result-empty" role="status">当前没有结果</p>}
            {result.loading && <p className="audit-empty" role="status">正在读取作业图像…</p>}
            {result.error && <p role="alert">{result.error}</p>}
            {result.data?.archived&&<p>历史审计已归档，可在报告页下载冻结报告。</p>}
            {job && result.data && !result.data.archived && <><div className="iad-thumbnail-grid">{result.data.items.map(item=><ThumbnailCard key={item.sample_id} src={auditSampleImage(item,job.task_id)} label={item.filename.split('/').pop()!}
              onClick={()=>setSample(item)} data-sample-id={item.sample_id} />)}</div>
              <Pagination total={result.data.total} page={page} size={18} unit="张图像" onPage={setPage} /></>}
          </div></section>
      </div>
      {tab === 'reports' && <AuditReport key={job?.run_id} job={job} revision={revision} />}
    </PageTabs>}
    {statisticsJob&&<AuditStatisticsDrawer job={jobs.jobs.find(job=>job.run_id===statisticsJob.run_id)||statisticsJob} revision={revision} onClose={()=>setStatisticsJob(null)}/>}
    {promptJob&&<AuditPromptDrawer runId={promptJob} onClose={()=>setPromptJob('')}/>}
    {sample && <AuditSampleDialog key={`${sample.run_id}:${sample.sample_id}`} sample={sample}
      taskId={datasets.find(item=>item.dataset_id===sample.dataset_id)?.task_id || dataset.task_id} onClose={() => setSample(null)} />}
    {jobDetails && <JobStatusDrawer job={jobs.jobs.find(job => job.root_run_id === jobDetails.root_run_id) || jobDetails}
      onClose={()=>setJobDetails(null)} stale={jobs.syncState === 'stale'} />}

  </div>;
}
