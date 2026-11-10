import React from 'react';
import type {AuditJobPrompts} from '../../shared/domain.generated.js';
import {useResource} from '../useResource.js';
import {PromptDrawer} from './PromptDrawer.js';

export function AuditPromptDrawer({runId,onClose}:{runId:string;onClose():void}) {
  const prompts=useResource<AuditJobPrompts>(`/audit/jobs/${encodeURIComponent(runId)}/prompts`);
  return <PromptDrawer title="查看提示词" systemText={prompts.data?.system_prompt} text={prompts.data?.instruction||prompts.error||''}
    additionalSections={prompts.data?[{title:'报告用户提示词',text:prompts.data.report_instruction}]:[]} onClose={onClose}/>;
}
