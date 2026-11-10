import React, {useEffect,useMemo,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {ConsistencyView,type ConsistencyFilterValues} from '../consistency-view.js';
import {message} from '../api.js';
import {queryClient} from '../query-client.js';
import {ConsistencyConflictDialog} from './ConsistencyConflictDialog.js';
import {ConsistencyResultCard} from './ConsistencyResultCard.js';
import {Pagination} from './Pagination.js';

export function ConsistencyImages({jobId,revision,filters,running,onReviewed}:{
  jobId:string;revision:string;filters:ConsistencyFilterValues;running:boolean;onReviewed():void;
}) {
  const [page,setPage]=useState(1);
  const [selectedId,setSelectedId]=useState('');
  const result=useQuery({queryKey:['iad','consistency-images',jobId],
    queryFn:({signal})=>ConsistencyView.loadImages(jobId,signal),refetchInterval:running?5000:false,
  },queryClient);
  const previous=useRef(revision);
  useEffect(()=>{
    if(previous.current!==revision)void result.refetch({cancelRefetch:false});
    previous.current=revision;
  },[revision,result.refetch]);
  useEffect(()=>{setPage(1);},[filters.search,filters.model,filters.agreement,filters.review]);
  const cards=useMemo(()=>ConsistencyView.filter(result.data || [],filters),[result.data,filters.search,filters.model,filters.agreement,filters.review]);
  const currentPage=Math.min(page,Math.max(1,Math.ceil(cards.length/18)));
  const selected=cards.find(item=>item.id===selectedId);
  return <>
    {result.isPending ? <p className="iad-result-empty" role="status">正在读取图像…</p> : result.error ?
      <p className="iad-error" role="alert">{message(result.error)}</p> : result.data && <>
        <div className="iad-thumbnail-grid dc-conflict-grid">
          {cards.slice((currentPage-1)*18,currentPage*18).map(item=><ConsistencyResultCard key={item.id} item={item} action="job-image" onOpen={()=>setSelectedId(item.id)}/>)}
        </div>
        <Pagination total={cards.length} page={currentPage} size={18} unit="张" onPage={setPage}/>
      </>}
    {selected&&<ConsistencyConflictDialog key={`${jobId}:${selected.id}`} conflict={selected} items={cards}
      onSelect={setSelectedId} onClose={()=>setSelectedId('')} onReviewed={onReviewed}/>}
  </>;
}
