import {useEffect,useRef} from 'react';
import {useQuery} from '@tanstack/react-query';
import {ConsistencyView,type ConsistencyComparisonItem} from './consistency-view.js';
import {message} from './api.js';
import {queryClient} from './query-client.js';
import {JOB_POLL_INTERVAL} from '../shared/job-display.js';

export interface ConsistencyImageCollection {
  items:ConsistencyComparisonItem[];
  pending:boolean;
  error:string|null;
}

export function useConsistencyImages(jobId:string|undefined,revision:string,running:boolean):ConsistencyImageCollection {
  const result=useQuery({queryKey:['iad','consistency-images',jobId],enabled:!!jobId,
    queryFn:({signal})=>ConsistencyView.loadImages(jobId!,signal),refetchInterval:running?JOB_POLL_INTERVAL:false,
  },queryClient);
  const previous=useRef(revision);
  useEffect(()=>{
    if(jobId&&previous.current!==revision)void result.refetch({cancelRefetch:false});
    previous.current=revision;
  },[jobId,revision,result.refetch]);
  return {items:result.data||[],pending:result.isPending,error:result.error?message(result.error):null};
}
