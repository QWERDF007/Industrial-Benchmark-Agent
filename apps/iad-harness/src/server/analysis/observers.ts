import type {Context} from '@deepseek-ai/cordis';
import type {Agent} from '@deepseek-ai/dsh-agent';
import type {SubagentRuntime} from '@deepseek-ai/dsh-subagent';
import {SessionId} from '@deepseek-ai/dsh-session';
import type {ContentBlock} from '@deepseek-ai/dsh-llm';
import {defineTool} from '@deepseek-ai/dsh-tools';
import type {AnalysisAgentContext, AnalysisWorkflowSnapshot, ExplorationWave, ExplorationWorkerMaterials, RegistrationMediaPage} from '../../shared/domain.generated.js';
import {explorationBatchReportParameters} from '../../shared/exploration.parameters.generated.js';
import type {PythonBridge} from '../python-bridge/index.js';
import {NativeMediaAttachments,nativeMediaOutput} from '../sessions/media.js';
import {workbenchJsonOutput} from '../tool-output.js';
import {runConcurrent} from '../jobs/concurrency.js';

export class ExplorationObservers {
  constructor(private readonly bridge:PythonBridge, private readonly runId:string, private readonly attachments:NativeMediaAttachments,
    private readonly subagents:SubagentRuntime, private readonly snapshot:AnalysisWorkflowSnapshot) {}

  register(scope:Context):void {
    scope.tools.register(defineTool({name:'exploration_observe',
      description:"子代理提交本批全部登记的实际视觉观察和冻结旧方向的核对，不修改全局目录。逐图observations必须引用实际看过的完整原图；取证失败只按真实error报告。assessments分别标明support支持、normal_control可比较正常对照、counter实质反例、not_comparable不可比、uncertain受限或not_present未出现；正常身份不自动构成反例。独立搜索目录之外现象：discoveries记录候选编号、部位现象、可执行动作和实际依据；无新发现也填写discovery_summary说明检查范围。不得为凑数拆分，也不得将不同检查动作塞进宽泛方向。每项新候选至少精选一张说明它的原图，key_evidence_ids按实际解释作用提供代表原图供主Agent复核，良品可说明正常结构、比较基准或相容变化；不要求良品和异常同时入选，无固定图片数。覆盖依据真实请求核验，工具成功结束本轮。",
      parameters:explorationBatchReportParameters,output:workbenchJsonOutput,
      execute:async(report,execution)=>{
        if(!execution.agent)throw new Error('子代理执行身份缺失');
        const result=await this.bridge.execute('exploration_agent_worker_report',
          {run_id:this.runId,session_id:execution.agent.id,report},execution.signal);
        execution.concludeTurn();return result;
      }}));
  }

  async context(sessionId:string,signal:AbortSignal):Promise<ExplorationWorkerMaterials> {
    return this.bridge.execute('exploration_agent_worker_materials',{run_id:this.runId,session_id:sessionId},signal);
  }

  async review(context:AnalysisAgentContext,signal:AbortSignal):Promise<AnalysisAgentContext & {
    role:'reviewer';reports:Omit<ExplorationWave['tasks'][number],'catalog'>[];
    observation_catalog?:AnalysisAgentContext['catalog'];
  }> {
    const wave=await this.bridge.execute<ExplorationWave>('exploration_agent_wave',{run_id:this.runId},signal);
    const samples=new Set(wave.tasks.flatMap(task=>task.round.targets.map(target=>target.sample_id)));
    const observed=wave.tasks[0];
    return {...context,role:'reviewer',
      registrations:this.snapshot.manifest.records.filter(record=>samples.has(record.sample.sample_id)),
      ...(observed&&observed.catalog_revision!==context.revision?{observation_catalog:observed.catalog}:{}),
      reports:wave.tasks.map(({catalog,...task})=>task)};
  }

  async wave(parent:Agent,context:AnalysisAgentContext,signal:AbortSignal):Promise<{
    context:Awaited<ReturnType<ExplorationObservers['review']>>;media:ContentBlock[];
  }> {
    const pending=await this.bridge.execute<ExplorationWave>('exploration_agent_wave',{run_id:this.runId},signal);
    await runConcurrent(pending.tasks,pending.tasks.length||1,signal,async task=>{
      if(task.report)return;
      const materials=await this.context(task.session_id,signal);
      const content:ContentBlock[]=[{type:'text',text:JSON.stringify({...materials,registrations:undefined})+'\n\n'}];
      for(const page of materials.registrations)
        content.push(...nativeMediaOutput.render({},await this.attachments.prepare(page,signal))
          .map(block=>block.type==='text'?{...block,text:block.text+'\n\n'}:block));
      content.push({type:'text',text:this.snapshot.observer_prompt?.user_prompt??this.snapshot.instruction});
      const childId=SessionId(task.session_id);
      const abort=()=>this.subagents.interrupt(childId,{kind:'ancestor',agent:parent});
      signal.addEventListener('abort',abort,{once:true});
      try {
        if(await parent.ctx.sessionPersistence.stat(childId))
          await this.subagents.sendMessage(parent,childId,content,{signal});
        else await this.subagents.startContinuable({provider:'spawn',label:`观察批次 ${task.round.round_id}`,childId,signal,
          request:{parent,prompt:content,maxDepth:1,toolFilter:{allow:[
            'analysis_context','analysis_catalog','analysis_arguments','analysis_evidence','analysis_images','analysis_crop','exploration_observe']}}});
        const child=parent.ctx.agents.get(childId);
        if(!child)throw new Error('DSH已接收子代理但未提供可等待的执行实例');
        await child.whenIdle();signal.throwIfAborted();
      } finally {
        signal.removeEventListener('abort',abort);
        await this.subagents.drainContinuableChildren(parent,[childId]);
      }
    });
    const review=await this.review(context,signal),media:ContentBlock[]=[];
    for(const task of review.reports){
      if(!task.report)throw new Error(`子代理批次 ${task.round.round_id} 已停止但没有有效观察报告，请查看对应Session后继续`);
      for(const evidence_id of task.report.key_evidence_ids){
        const page=await this.bridge.execute<RegistrationMediaPage>('analysis_agent_reference',
          {run_id:this.runId,query:{evidence_id}},signal);
        media.push(...nativeMediaOutput.render({},await this.attachments.prepare(page,signal)));
      }
    }
    return {context:review,media};
  }
}
