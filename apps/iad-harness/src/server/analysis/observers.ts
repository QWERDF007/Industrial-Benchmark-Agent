import type {Context} from '@deepseek-ai/cordis';
import type {Agent} from '@deepseek-ai/dsh-agent';
import type {SubagentRuntime} from '@deepseek-ai/dsh-subagent';
import {SessionId} from '@deepseek-ai/dsh-session';
import type {ContentBlock} from '@deepseek-ai/dsh-llm';
import {defineTool} from '@deepseek-ai/dsh-tools';
import type {AnalysisAgentContext, AnalysisWorkflowSnapshot, AnalysisWave, AnalysisWorkerMaterials, RegistrationMediaPage} from '../../shared/domain.generated.js';
import {knowledgeBatchReportParameters} from '../../shared/analysis-agent.parameters.generated.js';
import {explorationBatchReportParameters} from '../../shared/exploration.parameters.generated.js';
import type {PythonBridge} from '../python-bridge/index.js';
import {NativeMediaAttachments,nativeMediaOutput} from '../sessions/media.js';
import {workbenchJsonOutput} from '../tool-output.js';
import {runConcurrent} from '../jobs/concurrency.js';
import {AnalysisPromptContext} from './context.js';
import {explorationEvidenceReportParameters,knowledgeEvidenceReportParameters} from '../../shared/analysis-context.parameters.generated.js';

export class AnalysisObservers {
  constructor(private readonly bridge:PythonBridge, private readonly runId:string, private readonly attachments:NativeMediaAttachments,
    private readonly subagents:SubagentRuntime, private readonly snapshot:AnalysisWorkflowSnapshot,
    private readonly prompt:AnalysisPromptContext) {}

  register(scope:Context):void {
    scope.tools.register(defineTool({name:this.snapshot.module==='knowledge'?'knowledge_observe':'exploration_observe',
      description:this.prompt.onDemand?'观察子Agent只提交本批报告，无全局目录写权限。assessments引用冻结稳定条目ID说明实际关系及可见理由，discoveries逐候选写检查动作与准确的完整原图引用；知识候选必须关联所选方向。selected_evidence为[{evidence_id,reason}]，每个候选至少推荐一张本批完整原图，说明解释作用，不附图也不自动发布为正式精选。所有引用必须是本子Session成功业务请求实际送达的本批原图，局部归属原登记。知识observations简短覆盖每图全部所选方向适用性；探索observations可省略。discovery_summary说明实际范围，允许零候选；限制与未决项如实填写。成功保存后结束本轮。':this.snapshot.module==='knowledge'?'提交本批完整观察报告，不修改全局知识。observations简短记录每图事实及全部所选方向适用性。assessments引用冻结check_id说明支持、反例、允许变化或限制；discoveries为所选direction_refs下的候选判据，不填全局check_id。所有引用和key_evidence_ids只能用本批已实际观察的完整原图，每个候选至少有一张关键原图。良品/异常不设精选配额。discovery_summary填写实际检查范围，允许零候选。成功结束本轮。':"观察子代理一次正式提交本批报告，无全局目录写权限。observations可省略，仅填写明确图像事实；assessments只填有依据的冻结方向，同一方向可有不同关系，role为support、normal_control、counter、not_comparable、uncertain或not_present，reason写明所引原图的可见依据。normal_control只能引用真实良品组原图。discoveries填写唯一candidate_id、检查动作、原图引用及rationale；每个候选须在key_evidence_ids中至少有一张对应原图。discovery_summary说明实际检查范围，即使没有发现也须填写；limitations与unresolved_questions记录实际限制和未决问题。key_evidence_ids提供供主Agent复核的少数关键原图，不设良/异常配额。引用只能来自本批自身成功请求送达的完整原图；整批媒体与有效报告核验通过后保存，成功结束本轮。",
      parameters:this.prompt.onDemand
        ?(this.snapshot.module==='knowledge'?knowledgeEvidenceReportParameters:explorationEvidenceReportParameters)
        :(this.snapshot.module==='knowledge'?knowledgeBatchReportParameters:explorationBatchReportParameters),output:workbenchJsonOutput,
      execute:async(report,execution)=>{
        if(!execution.agent)throw new Error('子代理执行身份缺失');
        const result=await this.bridge.execute('analysis_agent_worker_report',
          {run_id:this.runId,session_id:execution.agent.id,report},execution.signal);
        execution.concludeTurn();return result;
      }}));
  }

  async context(sessionId:string,signal:AbortSignal):Promise<AnalysisWorkerMaterials> {
    return this.bridge.execute('analysis_agent_worker_materials',{run_id:this.runId,session_id:sessionId},signal);
  }

  async review(context:AnalysisAgentContext,signal:AbortSignal):Promise<AnalysisAgentContext & {
    role:'reviewer';reports:Omit<AnalysisWave['tasks'][number],'catalog'>[];
    observation_catalog?:AnalysisAgentContext['catalog'];
  }> {
    const wave=await this.bridge.execute<AnalysisWave>('analysis_agent_wave',{run_id:this.runId},signal);
    const samples=new Set(wave.tasks.flatMap(task=>task.round.targets.map(target=>target.sample_id)));
    const observed=wave.tasks[0];
    return {...context,role:'reviewer',
      registrations:this.snapshot.manifest.records.filter(record=>samples.has(record.sample.sample_id)),
      ...(observed&&observed.catalog_revision!==context.revision?{observation_catalog:observed.catalog}:{}),
      reports:wave.tasks.map(({catalog,...task})=>task)};
  }

  async wave(parent:Agent,context:AnalysisAgentContext,signal:AbortSignal):Promise<{
    context:Awaited<ReturnType<AnalysisObservers['review']>>;media:ContentBlock[];
  }> {
    const pending=await this.bridge.execute<AnalysisWave>('analysis_agent_wave',{run_id:this.runId},signal);
    await runConcurrent(pending.tasks,pending.tasks.length||1,signal,async task=>{
      if(task.report)return;
      const materials=await this.context(task.session_id,signal);
      const content:ContentBlock[]=[{type:'text',text:JSON.stringify({...this.prompt.worker(materials),registrations:undefined})+'\n\n'}];
      for(const page of materials.registrations)
        content.push(...nativeMediaOutput.render({},await this.attachments.prepare(page,signal)));
      content.push({type:'text',text:this.snapshot.observer_prompt?.user_prompt??this.snapshot.instruction});
      const stages=this.snapshot.knowledge_tasks??this.snapshot.exploration_tasks;
      if(stages)content.push({type:'text',text:stages.observe});
      const childId=SessionId(task.session_id);
      const abort=()=>this.subagents.interrupt(childId,{kind:'ancestor',agent:parent});
      signal.addEventListener('abort',abort,{once:true});
      try {
        if(await parent.ctx.sessionPersistence.stat(childId))
          await this.subagents.sendMessage(parent,childId,this.prompt.onDemand
            ? [...content.filter(block=>block.type!=='image'),{type:'text',text:'沿原Session继续本批。尚未成功提交观察报告时，已有附件保留供联合比较；需要时显式补看缺少的材料。成功提交报告后才以已保存文字事实替代本批附件，不重复读取已有比较材料。'}]
            : content,{signal});
        else await this.subagents.startContinuable({provider:'spawn',label:`观察批次 ${task.round.round_id}`,childId,signal,
          request:{parent,prompt:content,maxDepth:1,toolFilter:{allow:[
            'analysis_context','analysis_catalog','analysis_arguments','analysis_evidence','analysis_images','analysis_crop',this.snapshot.module==='knowledge'?'knowledge_observe':'exploration_observe']}}});
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
      for(const evidence_id of !this.prompt.onDemand && 'key_evidence_ids' in task.report ? task.report.key_evidence_ids : []){
        const page=await this.bridge.execute<RegistrationMediaPage>('analysis_agent_reference',
          {run_id:this.runId,query:{evidence_id}},signal);
        media.push(...nativeMediaOutput.render({},await this.attachments.prepare(page,signal)));
      }
    }
    return {context:review,media};
  }
}
