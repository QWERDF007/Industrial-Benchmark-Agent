import React from 'react';
import type {AnalysisJobPrompts} from '../../shared/domain.generated.js';
import {useResource} from '../useResource.js';
import {PromptDrawer} from './PromptDrawer.js';

export function AnalysisPromptDrawer({jobId,onClose}:{jobId:string;onClose():void}) {
  const {data,loading,error}=useResource<AnalysisJobPrompts>(`/analysis/prompts/${encodeURIComponent(jobId)}`);
  const sections=data?.observer?[
    {title:'子 Agent 系统提示词',text:data.observer.system_prompt||'本作业未记录系统提示词。'},
    {title:'子 Agent 用户提示词',text:data.observer.user_prompt},
  ]:[];
  return <PromptDrawer title="探索提示词" systemText={data?.main.system_prompt||(!loading&&!error?'本作业未记录系统提示词。':null)}
    text={data?.main.user_prompt||(loading?'正在读取提示词…':error||'本作业未记录提示词正文。')}
    systemLabel="主 Agent 系统提示词" userLabel="主 Agent 用户提示词" additionalSections={sections} onClose={onClose}/>;
}
