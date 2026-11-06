import {WorkbenchHeader} from './layout/WorkbenchHeader.js';
import {TabBar} from './layout/TabBar.js';
import {Button} from './Button.js';
import {ThumbnailCard} from "./ThumbnailCard.js";
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import type {Dataset, DatasetGroup, JobSnapshot} from '../../shared/contracts.js';
import type {AuditSampleItem, AuditSamplePage} from '../../shared/domain.generated.js';
import {auditStateLabels} from '../../shared/audit.generated.js';
import {buildHierarchyGroups, getDatasetGroupId} from '../dataset-hierarchy.js';
import {useJobs} from '../useJobs.js';
import {useResource} from '../useResource.js';
import {useAuditJobSelection} from '../useAuditJobSelection.js';
import {useWorkspace} from '../workspace.js';
import {initialFilters} from '../api.js';
import {DatasetScopeSelector} from './DatasetScopeSelector.js';
import {PageTabs} from './layout/PageTabs.js';
import {RefreshIconButton, ClearFilterButton} from './CommonFilterControls.js';
import {AuditJobs} from './AuditJobs.js';
import {DatasetReport} from './DatasetReport.js';
import {AuditSampleDialog} from './AuditSampleDialog.js';
import {auditSampleImage} from './AuditSampleMedia.js';
import {AuditSetup} from './AuditSetup.js';
import {Pagination} from './Pagination.js';
import {JobStatusDrawer} from './JobStatusDrawer.js';

export function AuditPage({dataset, datasets, groups, refreshRevision, onDatasetsChanged}: {
  dataset: Dataset; datasets: Dataset[]; groups: DatasetGroup[]; refreshRevision: number; onDatasetsChanged(): void;
}) {
  const {workspace} = useWorkspace();
  const hierarchy = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
  const [groupId, setGroupId] = useState(() => getDatasetGroupId(dataset));
  const children = useMemo(() => datasets.filter(item => getDatasetGroupId(item) === groupId), [datasets, hierarchy, groupId]);
  const [selectedIds, setSelectedIds] = useState([dataset.dataset_id]);
  const ids = selectedIds.filter(id => children.some(child => child.dataset_id === id));
  const scope = JSON.stringify([...ids].sort());
  const [tab, setTab] = useState<'audit' | 'reports'>('audit');
  const [revision, setRevision] = useState(0);
  const progress = useCallback(() => setRevision(value => value + 1), []);
  const jobs = useJobs('audit', ids, progress, '', refreshRevision);
  const selection = useAuditJobSelection(jobs.jobs, scope);
  const job = selection.selected;
  const [search, setSearch] = useState(''), [status, setStatus] = useState('all'), [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false), [jobDetails, setJobDetails] = useState<JobSnapshot | null>(null);
  const [creatingBusy, setCreatingBusy] = useState(false);
  const [sample, setSample] = useState<AuditSampleItem | null>(null);
  useEffect(() => {setPage(1); setSearch(''); setStatus('all'); setSample(null);}, [job?.run_id]);
  useEffect(() => {
    if (!hierarchy.some(group => group.group_id === groupId)) {
      const next = hierarchy[0]?.group_id || '';
      setGroupId(next);
      setSelectedIds(datasets.filter(item => getDatasetGroupId(item) === next).slice(0, 1).map(item => item.dataset_id));
    }
  }, [datasets, hierarchy, groupId]);
  const query = new URLSearchParams({page: String(page), page_size: '18', status, search});
  const result = useResource<AuditSamplePage>(job?.status==='COMPLETED' && !createOpen && tab === 'audit'
    ? `/audit/jobs/${encodeURIComponent(job.run_id)}/samples?${query}` : null, revision);
  const hasResults=job?.status==='COMPLETED'&&!!result.data&&Object.values(result.data.distribution).some(value=>value>0);
  const setupDatasets = datasets.filter(item => ids.includes(item.dataset_id));
  const refresh = () => {jobs.refresh(); progress(); onDatasetsChanged();};
  return <div id="audit-page">
    <WorkbenchHeader pageId="industrial-audit" className="audit-heading" title={createOpen?'新建审计':undefined}>{createOpen
      ? <Button type="button" disabled={creatingBusy} onClick={() => setCreateOpen(false)}>返回作业与结果</Button>
      : <Button variant="primary" type="button" disabled={!ids.length}
        title="新建审计" onClick={() => {
          workspace.selectDataset(ids[0]); setCreateOpen(true);
        }}>新建审计</Button>}</WorkbenchHeader>
    <DatasetScopeSelector groups={hierarchy} selectedGroupId={groupId} onGroupChange={next => {
      setGroupId(next); setSelectedIds(datasets.filter(item => getDatasetGroupId(item) === next).slice(0, 1).map(item => item.dataset_id));
    }} childDatasets={children} selectedChildIds={ids} onChildToggle={id => setSelectedIds(previous => previous.includes(id)
      ? previous.filter(value => value !== id) : [...previous, id])} disabled={createOpen} className="audit-scope"
      groupId="audit-dataset" childId="audit-child-trigger" childMenuId="audit-child-menu">
      <RefreshIconButton onClick={refresh} />
    </DatasetScopeSelector>
    {jobs.error && <p role="alert">{jobs.error}</p>}
    {createOpen ? <AuditSetup key={scope} datasets={setupDatasets} filters={initialFilters} jobs={jobs.jobs}
        revision={revision + refreshRevision} onBusyChange={setCreatingBusy} onCancel={()=>setCreateOpen(false)} onStarted={started => {
          workspace.updateView('industrial-audit', {job: started[0]?.run_id || ''});
          selection.clear(); setCreateOpen(false); setTab('audit'); refresh();
        }} /> : <PageTabs<'audit' | 'reports'> label="审计视图" className="audit-tabs"
          items={[{id: 'audit', label: '模型审计'}, {id: 'reports', label: '报告'}]} value={tab} onChange={setTab}>
      <div hidden={tab !== 'audit'}>
        <AuditJobs loading={jobs.loading} selection={selection} datasets={datasets} onDetails={setJobDetails} />
        <section className="audit-panel" aria-label="审计图像"><header className="audit-panel-head"><h2>审计图像</h2>
          {hasResults&&<div className="audit-filters"><label className="audit-field"><span>文件名</span><input type="search" aria-label="搜索审计图像"
            value={search} onChange={event => {setSearch(event.target.value); setPage(1);}} /></label>
            <ClearFilterButton onClick={() => {setSearch(''); setStatus('all'); setPage(1);}} /></div>}</header>
          {hasResults&&<TabBar label="审计图像状态" value={status} onChange={value => {setStatus(value); setPage(1);}}
            items={(['all', ...Object.keys(auditStateLabels)] as Array<'all' | keyof typeof auditStateLabels>).map(value => ({id: value,
              label: <>{value === 'all' ? '全部图像' : auditStateLabels[value]}{result.data && <span className="iad-tab-count">{value === 'all'
                ? Object.values(result.data.distribution).reduce((sum, value) => sum + value, 0) : result.data.distribution[value]}</span>}</>}))} />}<div id="audit-images">
            {!job && <p className="iad-result-empty" role="status">当前没有结果</p>}
            {job&&job.status!=='COMPLETED'&&<p className="iad-result-empty" role="status">当前作业没有已发布结果</p>}
            {result.loading && <p className="audit-empty" role="status">正在读取作业图像…</p>}
            {result.error && <p role="alert">{result.error}</p>}
            {job && result.data && <><div className="iad-thumbnail-grid">{result.data.items.map(item=><ThumbnailCard key={item.sample_id} src={auditSampleImage(item,job.task_id)} label={item.filename}
              onClick={()=>setSample(item)} data-sample-id={item.sample_id} />)}</div>{!result.data.items.length && <p className="audit-empty">没有匹配的审计图像。</p>}
              <Pagination total={result.data.total} page={page} size={18} unit="张图像" onPage={setPage} /></>}
          </div></section>
      </div>
      {tab === 'reports' && <DatasetReport key={scope} datasetIds={ids} onSample={setSample} />}
    </PageTabs>}
    {sample && <AuditSampleDialog key={`${sample.run_id}:${sample.sample_id}`} sample={sample}
      taskId={datasets.find(item=>item.dataset_id===sample.dataset_id)?.task_id || dataset.task_id} onClose={() => setSample(null)} />}
    {jobDetails && <JobStatusDrawer job={jobs.jobs.find(job => job.root_run_id === jobDetails.root_run_id) || jobDetails}
      onClose={()=>setJobDetails(null)} stale={jobs.syncState === 'stale'} />}

  </div>;
}
