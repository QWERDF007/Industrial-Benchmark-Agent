import React,{useEffect,useState} from 'react';
import type {KnowledgeCheckPage,KnowledgeCheckSummary} from '../../shared/domain.generated.js';
import type {AnalysisReadSource} from '../analysis-results.js';
import type {RowSelection} from '../row-selection.js';
import {useResource} from '../useResource.js';
import {SectionHeading} from './layout/SectionHeading.js';
import {Select} from './Select.js';
import {ClearFilterButton} from './CommonFilterControls.js';
import {IconButton} from './IconButton.js';
import {Pagination} from './Pagination.js';

export function KnowledgeEntryList({source,revision=0,actions,selection,headerActions,children}:{
  source:AnalysisReadSource|null;revision?:number;selection?:RowSelection;headerActions?:React.ReactNode;children?:React.ReactNode;
  actions:{view(entry:KnowledgeCheckSummary):void;remove?:{enabled:boolean;run(entry:KnowledgeCheckSummary):void}};
}) {
  const [search,setSearch]=useState(''),[status,setStatus]=useState('all'),[page,setPage]=useState(1);
  const query=new URLSearchParams({version_id:source?.kind==='published'?source.versionId:'',page:String(page),page_size:'8',search,review_status:status});
  const checks=useResource<KnowledgeCheckPage>(source?.kind==='published'?`/knowledge/details?${query}`:null,revision);
  const preview=source?.kind==='current'?source.view.checks.filter(check=>(!search||`${check.title} ${check.criterion}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    &&(status==='all'||status===check.review.status||status==='conflict'&&check.status==='conflicted')):[];
  const total=source?.kind==='published'?checks.data?.total||0:preview.length;
  const pages=Math.max(1,Math.ceil(total/8));
  const rows=source?.kind==='published'?checks.data?.items||[]:preview.slice((page-1)*8,page*8);
  useEffect(()=>{if(!checks.loading&&page>pages)setPage(pages);},[page,pages,checks.loading]);
  const available=!!source&&(total>0||!!search||status!=='all');
  return <>
    <SectionHeading title="知识条目">
      {headerActions}
      {available&&<div className="iad-knowledge-filters">
        <input type="search" aria-label="搜索知识条目" placeholder="搜索知识条目" value={search} onChange={event=>{setSearch(event.target.value);setPage(1);}}/>
        <Select aria-label="筛选核实状态" value={status} onChange={event=>{setStatus(event.target.value);setPage(1);}}>
          <option value="all">全部条目</option><option value="pending">待核实</option><option value="confirmed">已通过</option>
          <option value="rejected">已驳回</option><option value="conflict">存在矛盾</option>
        </Select>
        <ClearFilterButton ariaLabel="清除筛选条件" title="清除筛选条件" disabled={!search&&status==='all'}
          onClick={()=>{setSearch('');setStatus('all');setPage(1);}}/>
      </div>}
    </SectionHeading>
    {children}
    {checks.error?<p role="alert">{checks.error}</p>:checks.loading?<p className="iad-result-empty" role="status">正在读取作业冻结知识</p>:!rows.length?
      <p className="iad-result-empty" role="status">{search||status!=='all'?'没有符合筛选条件的知识条目。':'当前没有知识条目'}</p>:
      <div className="iad-knowledge-entries">
        <div className="knowledge-list" role="table" aria-label="知识条目" data-selectable={!!selection}>
          <div className="knowledge-head" role="row">
            {selection&&<span role="columnheader">选择</span>}
            <span role="columnheader">知识条目</span><span role="columnheader">描述</span><span role="columnheader">支持/反对</span><span role="columnheader">操作</span>
          </div>
          <div className="knowledge-items" role="rowgroup">{rows.map(entry=><div key={entry.check_id} className="knowledge-row" data-detail-entry={entry.check_id}
            role="row" tabIndex={0} aria-label={`查看知识条目：${entry.title}`} aria-selected={selection?.selectedIds.has(entry.check_id)}
            onClick={()=>actions.view(entry)} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();actions.view(entry);}}}>
            {selection&&<span role="cell" onClick={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}>
              <input type="checkbox" name={selection.name} aria-label={`${selection.label} ${entry.title}`} checked={selection.selectedIds.has(entry.check_id)} disabled={selection.disabled}
                onChange={event=>{const next=new Set(selection.selectedIds);event.target.checked?next.add(entry.check_id):next.delete(entry.check_id);selection.onChange(next);}}/>
            </span>}
            <span role="cell" className="row-title knowledge-entry-name">{entry.title}</span>
            <span role="cell" className="row-desc knowledge-entry-description" title={entry.criterion}>{entry.criterion}</span>
            <span role="cell" className="row-count col-evidence-count" title={`支持 ${entry.support_count} 张，反对 ${entry.counter_count} 张`}>{entry.support_count}/{entry.counter_count}</span>
            <span role="cell" className="col-action" onClick={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}>
              <IconButton icon="details" className="knowledge-entry-view" data-view-entry={entry.check_id} label={`查看知识条目 ${entry.title}`} title="查看知识条目" onClick={()=>actions.view(entry)}/>
              {actions.remove&&<IconButton icon="delete" className="knowledge-entry-delete" data-delete-entry={entry.check_id} disabled={!actions.remove.enabled}
                label={`删除知识条目 ${entry.title}`} title="删除知识条目" onClick={()=>actions.remove!.run(entry)}/>}
            </span>
          </div>)}</div>
        </div>
        <Pagination hideSinglePage total={total} page={page} size={8} onPage={setPage} label="知识条目"/>
      </div>}
  </>;
}
