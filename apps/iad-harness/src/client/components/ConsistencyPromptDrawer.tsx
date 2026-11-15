import React from 'react';
import type {JobSnapshot} from '../../shared/contracts.js';
import {identityPromptFields} from '../consistency-prompts.js';
import {PromptDrawer} from './PromptDrawer.js';

export function ConsistencyPromptDrawer({job,onClose}:{job:JobSnapshot;onClose():void}) {
  return <PromptDrawer title="查看提示词" text={job.consistency_prompt||'该作业没有保存提示词。'} systemText={job.system_prompt}
    additionalSections={job.consistency_identity_prompts?identityPromptFields.map(({name,label})=>({title:label,text:job.consistency_identity_prompts![name]})):[]}
    onClose={onClose}/>;
}
