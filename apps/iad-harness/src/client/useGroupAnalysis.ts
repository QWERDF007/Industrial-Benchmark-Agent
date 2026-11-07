import {useCallback,useEffect,useState} from 'react';
import {v4 as uuid} from 'uuid';
import type {GalleryReference,GroupAnalysisView} from '../shared/domain.generated.js';
import {message,request} from './api.js';

export function useGroupAnalysis(reference:GalleryReference|null){
  const [snapshot,setSnapshot]=useState<{key:string;analysis:GroupAnalysisView|null;error:string}>();
  const key=JSON.stringify(reference);
  const [revision,setRevision]=useState(0);
  const [starting,setStarting]=useState(false);
  const [startFailure,setStartFailure]=useState<{key:string;error:string}>();
  useEffect(()=>{
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
    setSnapshot(undefined);
    if(!reference)return;
    async function read(){
      try{
        const value=await request<GroupAnalysisView>('/consistency/gallery/analysis',reference,undefined,controller.signal);
        if(controller.signal.aborted)return;
        setSnapshot({key,analysis:value,error:''});
        if(value.status==='RUNNING'||value.status==='PENDING'||value.status==='NOT_ANALYZED')timer=setTimeout(read,value.status==='NOT_ANALYZED'?5000:1200);
      }catch(failure){if(!controller.signal.aborted)setSnapshot({key,analysis:null,error:message(failure)});}
    }
    void read();return()=>{controller.abort();clearTimeout(timer);};
  },[key,revision]);
  const analyze=useCallback(async()=>{
    if(!reference||starting)return;
    setStarting(true);setStartFailure(undefined);
    try{
      const analysis=await request<GroupAnalysisView>('/consistency/gallery/analyze',{...reference,request_id:uuid()});
      setSnapshot({key,analysis,error:''});setRevision(value=>value+1);
    }catch(error){setStartFailure({key,error:message(error)});}
    finally{setStarting(false);}
  },[key,starting]);
  const current=snapshot?.key===key?snapshot:{analysis:null,error:''};
  return {...current,error:(startFailure?.key===key?startFailure.error:'')||current.error,analyze,
    busy:starting||current.analysis?.status==='RUNNING'||current.analysis?.status==='PENDING'};
}
