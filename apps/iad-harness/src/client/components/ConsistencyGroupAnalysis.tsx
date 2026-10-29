import React,{useEffect,useState} from 'react';
import type {GalleryReference,GroupAnalysisView} from '../../shared/domain.generated.js';
import {jobStatuses} from '../../shared/job-display.js';
import {modelAssessmentLabels} from '../../shared/consistency.parameters.generated.js';
import {message,request} from '../api.js';

export function ConsistencyGroupAnalysis({reference}:{reference:GalleryReference}) {
  const [analysis,setAnalysis]=useState<GroupAnalysisView|null>(null),[error,setError]=useState('');
  const key=JSON.stringify(reference);
  useEffect(()=>{
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
    setAnalysis(null);setError('');
    async function read(){
      try{
        const value=await request<GroupAnalysisView>('/consistency/gallery/analysis',reference,undefined,controller.signal);
        if(controller.signal.aborted)return;
        setAnalysis(value);setError('');
        if(value.status==='RUNNING'||value.status==='PENDING')timer=setTimeout(read,1200);
        else if(value.status==='NOT_ANALYZED')timer=setTimeout(read,5000);
      }catch(failure){if(!controller.signal.aborted)setError(message(failure));}
    }
    void read();return()=>{controller.abort();clearTimeout(timer);};
  },[key]);
  return <section aria-label="MLLM 组级分析"><h3>MLLM 组级分析 {analysis && <span className="iad-consistency-badge">{analysis.status==='NOT_ANALYZED' ? '未分析' : analysis.status==='COMPLETED' ? 'MLLM 已分析' : jobStatuses[analysis.status]}</span>}</h3>
    {error && <p role="alert" className="iad-error">分析状态读取失败：{error}</p>}
    {!analysis&&!error && <p role="status">正在读取分析状态…</p>}
    {analysis?.status==='NOT_ANALYZED' && <p className="iad-muted">暂无已保存的模型分析结果。</p>}
    {analysis?.error && <p role="alert" className="iad-error">{analysis.error}</p>}
    {analysis?.status==='COMPLETED' && analysis.result && <>
      <p className="iad-muted">{analysis.model_name}</p>
      <div className="iad-group-conclusions">{analysis.result.conclusions.map((conclusion,index)=><p key={index}>{conclusion.text}</p>)}</div>
      {!!analysis.result.limitations.length && <div className="iad-group-limitations">{analysis.result.limitations.map((limit,index)=><p key={index}>{limit}</p>)}</div>}
      <div className="iad-group-overall"><h4>整体结论 · {modelAssessmentLabels[analysis.result.overall.verdict]}</h4><p>{analysis.result.overall.text}</p></div>
    </>}
  </section>;
}
