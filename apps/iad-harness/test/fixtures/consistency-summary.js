export function sendConsistencySummary(res,input,{model='summary'}={}) {
  const result={conclusion:input.context.problem_groups.length?'同内容图像具有不同整图标签。':'本次未发现标注冲突。',
    consistency_analysis:input.context.problem_groups.length?'上游记录存在整图标签冲突。':'图像标注没有冲突。',
    distribution_analysis:'图像尺寸一致。',
    analyses:input.context.problem_groups.map(g=>({issue_type:g.issue_type,analysis:'正常与异常目录中的同内容图像标签冲突。'})),
    consistency_reviews:input.context.consistency_scoring.flatMap(scope=>scope.items.map(item=>({
      scope_id:scope.scope_id,code:item.code,coefficient:1,evidence_refs:[item.ref],analysis:'不同标签会直接影响识别。'}))),
    distribution_reviews:input.context.distribution_facts.flatMap(scope=>Object.entries(scope.axes).map(([axis,facts])=>({
      scope_id:scope.scope_id,axis,status:facts.base_deduction>0?'problem':facts.metrics.length?'normal':'not_applicable',
      coefficient:facts.base_deduction>0?1:null,grouping:'当前范围按真实统计评价。',
      evidence_refs:[facts.ref],analysis:'当前范围未见明显失衡。'})))};
  res.writeHead(200,{'content-type':'text/event-stream'});
  res.end('data: '+JSON.stringify({id:'summary',model,choices:[{index:0,delta:{role:'assistant',content:JSON.stringify(result)},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');
}
