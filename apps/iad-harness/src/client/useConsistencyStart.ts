import {useEffect,useRef,useState} from 'react';
import { v4 as uuid } from "uuid";
import type {StartResultResponse} from '../shared/contracts.js';
import {message,request} from './api.js';

export function useConsistencyStart(onStarted:(batchId:string)=>void) {
  const mounted=useRef(true),pending=useRef(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  async function start(endpoint:string,body:Record<string,unknown>) {
    if(pending.current)return;
    pending.current=true;setBusy(true);setError('');setNotice('');
    try {
      const response=await request<StartResultResponse>(endpoint,{...body,request_id:uuid()});
      if(!mounted.current)return;
      if(response.kind==='started')onStarted(response.batch_id);
      else setNotice('没有需要处理的样本。');
    } catch(failure) {if(mounted.current)setError(message(failure));}
    finally {pending.current=false;if(mounted.current)setBusy(false);}
  }
  return {start,busy,error,notice};
}
