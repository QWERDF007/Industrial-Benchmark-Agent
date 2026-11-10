import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

// Controlled providers declare repeated visual facts and one representative per entry.
export function finalizeFixtureCatalog(context,outputs,module) {
  const section=module==='exploration'?'directions':'checks';
  const page=outputs.find(item=>item?.section===section);
  const common={base_revision:context.base_revision,summary:context.summary,limitations:context.limitations,
    unresolved_questions:context.unresolved_questions,...(module==='knowledge'?{direction_reviews:context.selected_directions.map(item=>({
      direction_ref:item.ref,reason:context.directions.find(direction=>direction.direction_ref===item.ref).entry_ids.length
        ?'可观察登记形成限定范围的检查条目。':'目标已核对，现有证据未形成可复用条目。'}))}:{})};
  if(!context.pending_entry_ids.length)return [{name:module+'_finalize',arguments:{...common,commit_key:'summary',complete:true,[section]:[]}}];
  if(!page)return [{name:'analysis_catalog',arguments:{section,ids:context.pending_entry_ids.slice(0,20)}}];
  const graphs=outputs.filter(item=>item?.items?.[0]?.origin_entry_id);
  if(graphs.length<page.items.length)return page.items.map(entry=>({name:'analysis_arguments',arguments:{
    entry_id:entry.direction_id||entry.check_id,limit:100}}));
  const arguments_=[];
  const entries=page.items.map(value=>{
    const {independent_source_count,support_limitations,predecessor_check_ids,predecessor_direction_ids,
      suggested_status,assessment_reason,...entry}=value;
    const id=entry.direction_id||entry.check_id;
    const graph=graphs.find(item=>item.items[0].entry_id===id);
    assert.equal(graph.next_offset,null,'the fixture must explicitly page larger argument sets');
    const active=graph.items.filter(item=>item.state==='active');
    const counter=active.find(item=>item.role==='counter');
    const representative=counter||active.find(item=>item.role==='support');
    assert.ok(representative);
    entry.key_evidence=[{evidence_id:representative.evidence_id,role:representative.role,
      reason:counter?'保留影响本条目解释的同源反例。':'该原图清楚呈现此条目声明的可见关系。'}];
    arguments_.push(...active.map(item=>({entry_id:id,evidence_id:item.evidence_id,observation_id:item.observation_id,
      role:item.role,state:item.state,
      reason:item.reason||(item.role==='counter'?'该原图作为尚未解释的反对依据。':'该原图支持限定条件内的检查动作。')})));
    return entry;
  });
  return [{name:module+'_finalize',arguments:{...common,commit_key:'page-'+context.revision,[section]:entries,
    arguments:arguments_,complete:page.items.length===context.pending_entry_ids.length}}];
}

export function respondFixtureTools(response,calls) {
  response.writeHead(200,{'Content-Type':'text/event-stream'});
  response.write('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',tool_calls:calls.map((call,index)=>({
    index,id:randomUUID(),type:'function',function:{name:call.name,arguments:JSON.stringify(call.arguments)}}))},finish_reason:null}]})+'\n\n');
  response.end('data: '+JSON.stringify({choices:[{index:0,delta:{},finish_reason:'tool_calls'}],
    usage:{prompt_tokens:500,completion_tokens:200,total_tokens:700}})+'\n\ndata: [DONE]\n\n');
}
