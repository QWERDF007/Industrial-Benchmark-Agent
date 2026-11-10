export function auditMessages(body) {
  const texts=body.messages.flatMap(message=>typeof message.content==='string'?[{role:message.role,text:message.content}]:
    Array.isArray(message.content)?message.content.filter(part=>part.type==='text').map(part=>({role:message.role,text:part.text})):[]);
  const values=texts.flatMap(({role,text})=>{try{return [{role,value:JSON.parse(text.split(String.fromCharCode(10))[0])}];}catch{return [];}});
  return {context:values.find(item=>item.role==='user'&&(item.value.target||item.value.phase==='report'))?.value,
    outputs:values.filter(item=>item.role==='tool').map(item=>item.value),pages:values.map(item=>item.value).filter(value=>Array.isArray(value?.images))};
}

export function auditReportTool(context,outputs) {
  const records=outputs.find(value=>value?.items);
  if(!records)return {name:'audit_records',arguments:{page:1,page_size:100}};
  const issues=records.items.flatMap(item=>item.final?.execution_status==='completed'?item.final.findings.map(finding=>({sample_id:item.sample_id,finding_id:finding.finding_id})):[]);
  if(issues.length&&!outputs.some(value=>value?.groups?.length))return {name:'audit_group_issues',arguments:{commit_key:'groups-'+context.generation,groups:[{
    group_id:'G1',title:'已保存的标注疑点',description:'逐图观察形成的标注质量疑点。',issue_refs:issues,
    representatives:[{...issues[0],role:'representative',reason:'清楚呈现已保存疑点。'}],normal_explanations:['仍需排除成像变化。'],limitations:[]}]}};
  return {name:'audit_report_commit',arguments:{commit_key:'report-'+context.generation,scope_analysis:'限定为本作业冻结范围与已完成图像。',
    issue_analysis:issues.length?'已完成图像保留标注疑点。':'已完成范围没有保存的充分疑点。',consistency_analysis:'逐项核对上游差异，候选不作为真值。',
    knowledge_analysis:context.knowledge?'知识按适用性核对。':'没有选用知识。',conclusion:'结论仅适用于已完成观察的范围。',limitations:['未完成范围不能视为正常。']}};
}
