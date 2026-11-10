import React, {useRef,useState} from 'react';
import {v4 as uuid} from 'uuid';
import type {DatasetCatalog,JobSnapshot} from '../../shared/contracts.js';
import type {IdentityPrompts} from '../../shared/domain.generated.js';
import {consistencyTaskPrompts,consistencyIdentityPrompts,consistencyTaskFormats} from '../../shared/prompt-defaults.generated.js';
import {identityPromptFields} from '../consistency-prompts.js';
import {buildHierarchyGroups,getDatasetGroupId} from '../dataset-hierarchy.js';
import {message,request} from '../api.js';
import {WorkbenchHeader} from './layout/WorkbenchHeader.js';
import {DatasetScopeSelector} from './DatasetScopeSelector.js';
import {AgentPromptEditors,PromptTextEditor} from './AgentPromptEditors.js';
import {Button} from './Button.js';
import {Modal} from './Modal.js';

export function ConsistencyCheckCreate({datasets,groups,parentId,datasetIds,onCancel,onStarted}:DatasetCatalog&{
  parentId:string;datasetIds:string[];onCancel():void;
  onStarted(job:JobSnapshot,parentId:string,datasetIds:string[]):void;
}) {
  const [parent,setParent]=useState(parentId),[selectedIds,setSelectedIds]=useState(datasetIds);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [drafts,setDrafts]=useState<Record<keyof typeof consistencyTaskPrompts,{system:string;user:string}>>({...consistencyTaskPrompts});
  const [identity,setIdentity]=useState<IdentityPrompts>({...consistencyIdentityPrompts});
  const submission=useRef<{key:string;id:string}|null>(null);
  const submitButton=useRef<HTMLButtonElement>(null),confirmButton=useRef<HTMLButtonElement>(null);
  const taskTypes=[...new Set(datasets.filter(dataset=>selectedIds.includes(dataset.dataset_id)).map(dataset=>consistencyTaskFormats[dataset.format]))];
  const task=taskTypes.length===1?taskTypes[0]:null;
  const system=task?drafts[task].system:'',user=task?drafts[task].user:'';
  const valid=!!selectedIds.length&&!!system.trim()&&!!user.trim()&&identityPromptFields.every(({name})=>!!identity[name].trim());
  async function start() {
    if(!valid||busy)return;
    const key=JSON.stringify([selectedIds,system,user,identity]);
    if(submission.current?.key!==key)submission.current={key,id:uuid()};
    setBusy(true);setError('');
    try {
      const job=await request<JobSnapshot>('/analysis/start',{submission_id:submission.current.id,analysis_kind:'consistency',
        dataset_ids:selectedIds,system_prompt:system,instruction:user,identity_prompts:identity});
      onStarted(job,parent,selectedIds);
    } catch(failure) {setError(message(failure));}
    finally {setBusy(false);}
  }
  return <section id="dc-create-page" aria-label="新建一致性检查" aria-busy={busy}>
    <WorkbenchHeader pageId="industrial-consistency" title="新建检查">
      <Button disabled={busy} onClick={onCancel}>返回作业与结果</Button>
    </WorkbenchHeader>
    <DatasetScopeSelector groups={buildHierarchyGroups(datasets,groups)} selectedGroupId={parent}
      onGroupChange={next=>{setParent(next);setSelectedIds(datasets.filter(dataset=>getDatasetGroupId(dataset)===next).map(dataset=>dataset.dataset_id));}}
      childDatasets={datasets.filter(dataset=>getDatasetGroupId(dataset)===parent)} selectedChildIds={selectedIds}
      onChildToggle={id=>setSelectedIds(previous=>previous.includes(id)?previous.filter(value=>value!==id):[...previous,id])}
      disabled={busy} className="dc-scope" groupId="dc-new-parent" childId="dc-new-child-trigger" childMenuId="dc-new-child-options"/>
    <section className="iad-panel iad-form-fields">
      <AgentPromptEditors id="dc-new-prompt" system={system} user={user} disabled={busy}
        onSystemChange={text=>{if(task)setDrafts(previous=>({...previous,[task]:{...previous[task],system:text}}));}}
        onUserChange={text=>{if(task)setDrafts(previous=>({...previous,[task]:{...previous[task],user:text}}));}}/>
      <div className="iad-agent-prompts">{identityPromptFields.map(({name,label})=><PromptTextEditor key={name}
        id={'dc-identity-'+name} label={label} value={identity[name]} disabled={busy}
        onChange={text=>setIdentity(previous=>({...previous,[name]:text}))}/>)}</div>
      <footer className="iad-form-footer">
        <Button data-dc="close-new" disabled={busy} onClick={onCancel}>取消</Button>
        <Button variant="primary" data-dc="create-job" ref={submitButton} disabled={!valid||busy} onClick={start}>
          {busy?'启动中…':'开始检查'}
        </Button>
      </footer>
    </section>
    {error&&<Modal title="创建检查失败" size="compact" initialFocus={confirmButton}
      restoreFocus={()=>submitButton.current} onClose={()=>setError('')}>
      <div className="iad-dialog-body"><p role="alert" className="iad-error">{error}</p></div>
      <footer className="iad-dialog-footer"><Button ref={confirmButton} variant="primary" onClick={()=>setError('')}>知道了</Button></footer>
    </Modal>}
  </section>;
}
