import React,{useEffect,useState} from 'react';
import type {Dataset,GroupMemberPage,StrictGroupPage} from '../../shared/contracts.js';
import {message,request} from '../api.js';
import {useWorkspace} from '../workspace.js';
import {Pagination} from './Pagination.js';
import {ConsistencyEmpty} from './ConsistencyEmpty.js';
import {ConsistencyEvidencePreview} from './ConsistencyEvidencePreview.js';

export function ConsistencyGroups({queryId,datasets}:{queryId:string;datasets:Dataset[]}) {
  const {workspace,state}=useWorkspace();
  const [groups,setGroups]=useState<StrictGroupPage|null>(null),[members,setMembers]=useState<GroupMemberPage|null>(null);
  const page=state.consistency.groupPage || 1,memberPage=state.consistency.memberPage || 1,selected=state.consistency.groupId || '';
  const [error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();setGroups(null);setError('');
    request<StrictGroupPage>('/consistency/groups',{query_id:queryId,page,page_size:20},undefined,controller.signal)
      .then(data=>{if(!controller.signal.aborted)setGroups(data);}).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[queryId,page]);
  const group=groups?.items.find(item=>item.group_id===selected) || groups?.items[0];
  useEffect(()=>{
    const controller=new AbortController();setMembers(null);if(!group)return;
    request<GroupMemberPage>('/consistency/groups/members',{query_id:queryId,group_id:group.group_id,facts_state:group.facts_state,page:memberPage,page_size:20},undefined,controller.signal)
      .then(data=>{if(!controller.signal.aborted)setMembers(data);}).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[queryId,group?.group_id,group?.facts_state,memberPage]);
  const member=members?.items.find(item=>item.sample_id===state.consistency.memberId) || members?.items[0];
  return <section aria-label="范围重复图组">
    {error && <p className="iad-error" role="alert">{error}</p>}
    {groups && !groups.total ? <ConsistencyEmpty title="当前范围没有已保存的重复图组" description="可调整事实来源和处置筛选，或启动当前范围的严格同图检查。" /> : <div className="iad-consistency-master-detail">
      <aside className="iad-consistency-list" aria-label="严格同图组"><header className="iad-consistency-panel-header"><strong>重复图组</strong><span>{groups?.total || 0} 组</span></header><div className="iad-consistency-list-scroll">{groups?.items.map(item=><button key={item.group_id+item.facts_state} aria-pressed={group?.group_id===item.group_id} onClick={()=>workspace.updateConsistency({groupId:item.group_id,memberPage:1,memberId:undefined},true)}>
        <strong>{item.member_count} 成员 · {item.dataset_count} 个数据集</strong><span>{item.pair_count} 对比较 · {item.facts_state==='CURRENT' ? '当前' : item.facts_state==='HISTORICAL' ? '历史' : '待核实'}</span></button>)}</div></aside>
      <section>{member && <ConsistencyEvidencePreview key={member.evidence_id} evidenceId={member.evidence_id} />}{group && <><h2>严格同图成员 · {group.member_count}</h2><div className="iad-table-scroll"><table className="iad-resource-table"><thead><tr><th>图像</th><th>数据集</th><th>证据</th></tr></thead><tbody>
        {members?.items.map(item=><tr key={item.sample_id}><td><button className="iad-consistency-text-button" aria-pressed={item===member} onClick={()=>workspace.updateConsistency({memberId:item.sample_id},true)}>{item.relative_path}</button></td><td title={item.dataset_id}>{datasets.find(dataset=>dataset.dataset_id===item.dataset_id)?.name || item.dataset_id}</td><td><button onClick={()=>workspace.updateConsistency({evidenceId:item.evidence_id,batchId:undefined,tab:'groups'},true)}>打开比较证据</button></td></tr>)}
      </tbody></table></div><Pagination total={members?.total || 0} page={memberPage} size={20} unit="个成员" onPage={value=>workspace.updateConsistency({memberPage:value},true)} /></>}</section>
    </div>}
    <Pagination total={groups?.total || 0} page={page} size={20} unit="个图组" onPage={value=>workspace.updateConsistency({groupPage:value,groupId:undefined,memberPage:1},true)} />
  </section>;
}
