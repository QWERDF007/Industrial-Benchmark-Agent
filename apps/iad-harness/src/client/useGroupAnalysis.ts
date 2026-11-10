import {useEffect,useState} from 'react';
import type {GroupAnalysisView} from '../shared/domain.generated.js';
import type {ConsistencyAnalysisReference} from './consistency-view.js';
import {message,request} from './api.js';

export function useGroupAnalysis(reference:ConsistencyAnalysisReference|null){
  const [snapshot,setSnapshot]=useState<{key:string;analysis:GroupAnalysisView|null;error:string}>();
  const key=JSON.stringify(reference);
  useEffect(()=>{
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
    setSnapshot(undefined);
    if(!reference)return;
    async function read(){
      try{
        const value=await ('job_id' in reference!
          ? request<GroupAnalysisView>(`/consistency/checks/${encodeURIComponent(reference.job_id)}/anchors/${encodeURIComponent(reference.anchor_id)}/analysis`,undefined,undefined,controller.signal)
          : request<GroupAnalysisView>('/consistency/gallery/analysis',reference,undefined,controller.signal));
        if(controller.signal.aborted)return;
        setSnapshot({key,analysis:value,error:''});
        if(value.status==='RUNNING'||value.status==='PENDING'||value.status==='NOT_ANALYZED')timer=setTimeout(read,value.status==='NOT_ANALYZED'?5000:1200);
      }catch(failure){if(!controller.signal.aborted)setSnapshot({key,analysis:null,error:message(failure)});}
    }
    void read();return()=>{controller.abort();clearTimeout(timer);};
  },[key]);
  return snapshot?.key===key?snapshot:{analysis:null,error:''};
}
