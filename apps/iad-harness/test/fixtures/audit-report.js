import {randomUUID} from 'node:crypto';

export function auditMessages(body) {
  const values=body.messages.flatMap((message,index)=>{
    const parts=typeof message.content==='string'?[{type:'text',text:message.content}]:message.content||[];
    return parts.flatMap(part=>{
      if(part.type!=='text')return [];
      return part.text.split('\n').flatMap(line=>{
        try{return [{role:message.role,index,value:JSON.parse(line)}];}catch{return [];}
      });
    });
  });
  const latest=values.filter(item=>item.role==='user'&&(item.value.target||item.value.phase)).at(-1);
  return {context:latest?.value,outputs:values.filter(item=>item.role==='tool'&&item.index>latest.index).map(item=>item.value),
    pages:values.map(item=>item.value).filter(value=>Array.isArray(value?.images))};
}

export function auditReportTool(context,outputs,{includeCounter=false}={}) {
  if(context.phase==='review'){
    const refs=context.items.flatMap(item=>item.final?.execution_status==='completed'?item.final.findings.map((_,index)=>({
      sample_id:item.sample_id,result_revision:item.result_revision,kind:'finding',index})):[]);
    const prior=context.discoveries.find(item=>item.group_id==='G1');
    const detail=outputs.find(output=>output?.discovery?.group_id==='G1');
    if(context.context_policy==='evidence-on-demand-v1'&&prior&&!detail)return {
      name:'audit_discovery',arguments:{group_id:'G1',page:1,page_size:100}};
    const representatives=refs.length?[{sample_id:refs[0].sample_id,role:'representative',reason:'清楚呈现已保存的覆盖疑点。'}]:[];
    const normal=includeCounter&&context.items.find(item=>item.final?.state==='normal');
    if(normal&&representatives.length)representatives.push({sample_id:normal.sample_id,role:'counter',reason:'相似形态下原始覆盖关系不同。'});
    for(const representative of representatives){
      const item=context.items.find(item=>item.sample_id===representative.sample_id);
      if(!outputs.some(output=>output?.sample_id===item.sample_id&&output?.images?.length))return {
        name:'audit_report_evidence',arguments:{sample_id:item.sample_id,evidence_id:item.final.evidence_ids[0]}};
    }
    const discoveries=refs.length?[{group_id:'G1',kind:'quality_issue',dimension:'annotation_quality',status:'supported',title:'覆盖范围需复核',
      description:'已保存的图级覆盖疑点需人工复核。',visual_signature:'主体边缘的可见现象',annotation_relation:'可见现象与原始覆盖存在待复核差别。',
      scope:'本次已完成的冻结观察范围',support_refs:refs,counter_refs:normal?[{sample_id:normal.sample_id,result_revision:normal.result_revision,kind:'image'}]:[],
      representatives,next_batch_focus:'',key_difference:normal?'相似形态下的实际覆盖关系不同。':'',unresolved_question:'需排除成像变化。'}]:prior?[prior]:[];
    const submission={commit_key:'batch-'+context.batch.number+'-'+context.revision,
      batch_number:context.batch.number,base_revision:context.revision,discoveries,review_requests:[]};
    if(context.context_policy==='evidence-on-demand-v1'){
      const fresh=refs.length?discoveries[0]:null;
      const old=detail?.discovery;
      const key=ref=>JSON.stringify([ref.sample_id,ref.result_revision,ref.kind,ref.index??null]);
      const existing=new Set((detail?.items||[]).map(item=>item.role+':'+key(item.reference)));
      const evidence_changes=[];
      if(fresh)for(const role of ['support','counter'])for(const reference of fresh[role+'_refs'])
        if(!existing.has(role+':'+key(reference)))evidence_changes.push({group_id:'G1',action:'add',role,reference,reason:'根据本批实际图级记录核对证据关系。'});
      const body=fresh?Object.fromEntries(Object.entries(fresh).filter(([name])=>!['support_refs','counter_refs','representatives'].includes(name))):null;
      if(old&&body&&['description','visual_signature','annotation_relation','scope','key_difference'].some(name=>old[name]!==body[name]))
        for(const item of detail.items)evidence_changes.push({group_id:'G1',action:'keep',role:item.role,reference:item.reference,reason:'重新核对旧引用，仍支持当前限定主张。'});
      return {name:'audit_batch_commit',arguments:{...submission,discoveries:body?[body]:[],evidence_changes,
        representative_changes:fresh?[{group_id:'G1',representatives:fresh.representatives}]:[]}};
    }
    return {name:'audit_batch_commit',arguments:submission};
  }
  const records=outputs.find(output=>output?.kind==='audit_records')?.items;
  if(!records)return {name:'audit_records',arguments:{page:1,page_size:100}};
  const completed=records.filter(item=>item.final?.execution_status==='completed');
  const hasIssues=Object.keys(context.statistics.upstream_issue_types).length>0||Object.values(context.statistics.program_issue_types).some(Boolean);
  const scopes=Object.keys(context.statistics.consistency_cross).map(source_status=>({source_status,
    items:completed.filter(item=>item.consistency.source_status===source_status).slice(0,3)}));
  const selected=new Map([...scopes.flatMap(scope=>scope.items),...(context.knowledge||hasIssues?completed.slice(0,3):[])].map(item=>[item.sample_id,item]));
  for(const item of selected.values())if(!outputs.some(output=>output?.sample_id===item.sample_id&&output?.images?.length))
    return {name:'audit_report_evidence',arguments:{sample_id:item.sample_id,evidence_id:item.final.evidence_ids[0]}};
  const references=items=>items.map(item=>({sample_id:item.sample_id,result_revision:item.result_revision,kind:'image'}));
  const representatives=items=>items.map(item=>({sample_id:item.sample_id,reason:'外缘与邻近区域可共同核对。'}));
  return {name:'audit_report_commit',arguments:{commit_key:'report-'+randomUUID(),discovery_ids:context.discoveries.filter(item=>item.status!=='withdrawn').map(item=>item.group_id),
    consistency_analyses:hasIssues?context.applicable_issue_types.map(issue_type=>({issue_type,
      analysis:'结合双方原图和逐图结果，说明这类标注差异是否成立。',
      evidence_refs:references(completed.slice(0,3)),representatives:representatives(completed.slice(0,3))})):[],
    consistency_scopes:scopes.map(scope=>({source_status:scope.source_status,analysis:'按实际对照范围解释图像与标注关系。',
      evidence_refs:references(scope.items),representatives:representatives(scope.items)})),
    knowledge_analyses:(context.knowledge?.entries||[]).map(entry=>({check_id:entry.check.check_id,
      description:'比较可见外缘的连续关系。',applicability:'外缘可辨时适用。',analysis:'结合完整原图与相邻外缘比较。',audit_impact:'提供局部复核线索。',
      evidence_refs:references(completed.slice(0,3)),representatives:representatives(completed.slice(0,3))})),
    consistency_analysis:'逐项核对上游差异，候选不作为真值。',knowledge_analysis:context.knowledge?'所选知识按适用性核对。':'',
    conclusion:'完成范围可用于视觉探索，已保存的独立疑点需人工复核。',coverage_analysis:'覆盖主体边缘和原始标注，未采集场景未评价。',
    independence_analysis:'独立物理件、批次与序列仅依据真实元数据评价。',capabilities:[],usability:
      ['exploration','training_experiment','debug','image_evaluation','bbox_evaluation','pixel_evaluation','formal_benchmark'].map(purpose=>({
        purpose,status:['exploration','training_experiment','debug'].includes(purpose)?'candidate':'not_evaluated',reason:'评价依据为冻结原图及实际已有结果。'})),
    review_priorities:[],limitations:['未完成范围不能视为正常。']}};
}
