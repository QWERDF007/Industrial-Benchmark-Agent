import {useEffect,useRef,useState} from 'react';
import type {JobSnapshot} from '../shared/contracts.js';
import {IBA_JOBS_PAGE_SIZE} from './components/Pagination.js';

export function useJobList(jobs:JobSnapshot[],scope:string,selectedRunId='',onSelect?:(job:JobSnapshot)=>void) {
  const empty={scope,search:'',status:'',page:1,runId:selectedRunId};
  const [saved,setSaved]=useState(empty);
  const state=saved.scope===scope?saved:empty;
  const navigation=useRef({scope,runId:selectedRunId,resolved:false});
  useEffect(()=>{
    const previous=navigation.current;
    if(previous.scope===scope&&previous.runId===selectedRunId&&previous.resolved)return;
    const index=jobs.findIndex(job=>job.run_id===selectedRunId||job.root_run_id===selectedRunId);
    const page=index<0?1:Math.floor(index/IBA_JOBS_PAGE_SIZE)+1;
    setSaved(current=>current.scope===scope&&current.runId===selectedRunId&&current.page===page?current:{...empty,page});
    navigation.current={scope,runId:selectedRunId,resolved:!selectedRunId||index>=0};
  },[scope,selectedRunId,jobs]);
  const search=state.search.trim().toLocaleLowerCase();
  const filtered=jobs.filter(job=>(!state.status||job.status===state.status)
    && [job.run_id,job.root_run_id,job.model_name||'',job.submitted_at].some(value=>value.toLocaleLowerCase().includes(search)));
  const selected=filtered.find(job=>job.run_id===state.runId||job.root_run_id===state.runId)||filtered[0]||null;
  const pages=Math.max(1,Math.ceil(filtered.length/IBA_JOBS_PAGE_SIZE));
  const page=Math.min(state.page,pages);
  const update=(patch:Partial<typeof state>)=>setSaved({...state,...patch});
  const select=(job:JobSnapshot)=>{update({runId:job.root_run_id});onSelect?.(job);};
  return {state,selected,filtered,hasJobs:jobs.length>0,page,visible:filtered.slice((page-1)*IBA_JOBS_PAGE_SIZE,page*IBA_JOBS_PAGE_SIZE),
    select,search:(search:string)=>update({search,page:1}),status:(status:string)=>update({status,page:1}),
    clear:()=>update({search:'',status:'',page:1}),
    setPage:(value:number)=>{
      const page=Math.max(1,Math.min(pages,value));
      const job=filtered[(page-1)*IBA_JOBS_PAGE_SIZE];
      update({page,runId:job?.root_run_id||''});if(job)onSelect?.(job);
    }};
}
