import React from 'react';
import type {AuditJobPrompts} from '../../shared/domain.generated.js';
import {useResource} from '../useResource.js';
import {PromptDrawer} from './PromptDrawer.js';

export function AuditPromptDrawer({runId,onClose}:{runId:string;onClose():void}) {
  const prompts=useResource<AuditJobPrompts>(`/audit/jobs/${encodeURIComponent(runId)}/prompts`);
  const sections=prompts.data?.sections||[];
  return <PromptDrawer title="查看提示词" systemText={sections[0]?.text} text={sections[1]?.text||prompts.error||''}
    systemLabel={sections[0]?.title} userLabel={sections[1]?.title} additionalSections={sections.slice(2)} onClose={onClose}/>;
}
