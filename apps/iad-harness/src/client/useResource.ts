import {useEffect,useRef} from 'react';
import {useQuery} from '@tanstack/react-query';
import {message,request} from './api.js';
import {queryClient} from './query-client.js';
import {JOB_POLL_INTERVAL} from '../shared/job-display.js';

export function useResource<T>(path:string|null,revision:number|string=0,live=false) {
  const result=useQuery({queryKey:['iad','resource',path],enabled:!!path,
    queryFn:({signal})=>request<T>(path!,undefined,undefined,signal),
    refetchInterval:live?JOB_POLL_INTERVAL:false,refetchOnWindowFocus:live,
  },queryClient);
  const previous=useRef({path,revision});
  useEffect(()=>{
    if(previous.current.path===path && previous.current.revision!==revision && path)
      void queryClient.invalidateQueries({queryKey:['iad','resource',path],exact:true},{cancelRefetch:false});
    previous.current={path,revision};
  },[path,revision]);
  return {data:path ? result.data ?? null : null,error:path && result.error ? message(result.error) : '',
    loading:!!path && result.isPending,refreshing:!!path && result.isFetching};
}
