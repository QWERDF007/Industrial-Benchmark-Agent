import { defineTool } from '@deepseek-ai/dsh-tools';
import { knowledgeCommitParameters, knowledgeFinalizeParameters } from '../../shared/analysis-agent.parameters.generated.js';
import { workbenchJsonOutput } from '../tool-output.js';
import { knowledgeDeltaCommitParameters, knowledgeDeltaFinalizeParameters } from '../../shared/analysis-context.parameters.generated.js';
export function registerKnowledgeTools(scope, bridge, runId, onDemand = false) {
    scope.tools.register(defineTool({ name: 'knowledge_commit', description: onDemand ? '主Agent提交首批或整波知识更新。base_revision与round_id取当前上下文。首次observations简短记录每图全部所选方向的适用性；复核时observations传[]并一次review全部报告及候选。checks只提交新增或正文变化的完整业务条目，不带累计证据数组或精选；arguments提交论据增量及实际理由，selections独立确认最多4张精选，有有效反例时保留代表。改变已有主张须change_reason并逐项复核旧有效论据。正文不写文件名、图号或内部ID。所选方向关联、适用范围、媒体送达、幂等键与整波原子提交均由宿主核验；子报告关系不自动转为正式论据。成功结束本轮。' : '主Agent正式提交首批或整波知识更新。首次observations简短记录本批每图全部selected_directions的适用性和依据；复核时observations传[]，宿主导入本波全部报告。report_reviews一次覆盖全部报告及候选，discovery_decisions的new/merge填写check_id，reject说明依据。checks只提交新增或修改项，未变项传[]；只增加论据可填arguments。正文不堆放图像、标注或作业ID，引用放在结构化字段。key_evidence从首批起持续维护最多4张典型完整原图，与完整支持及反例分开；不要求良品和异常同时入选。改变已有主张需change_reason并逐项复核旧有效论据。整批媒体须进入自身成功请求，取证错误须有实际回执。整波成功提交才推进覆盖，失败全部回滚。',
        parameters: onDemand ? knowledgeDeltaCommitParameters : knowledgeCommitParameters, output: workbenchJsonOutput,
        execute: async (submission, execution) => {
            const result = await bridge.execute('analysis_agent_commit', { run_id: runId, submission }, execution.signal);
            execution.concludeTurn();
            return result;
        } }));
    scope.tools.register(defineTool({ name: 'knowledge_finalize', description: onDemand ? '在原Session按页定稿全部判据。base_revision取锁定值；checks只提交正文变化项，selections明确确认本页已复核条目与最多4张精选，arguments仅提交变化或待补理由的关系。改变主张需change_reason并逐项复核旧有效论据。direction_reviews逐所选方向说明产出或零产出；全部条目和方向确认后complete=true提交全局摘要原子发布。' : '目标耗尽后，在原Session按页定稿全部判据，核对完整支持、反例、范围、允许变化与精选原图。base_revision使用锁定值；direction_reviews说明全部所选方向的产出或零产出。最后pending_entry_ids为空后用complete=true提交全局摘要并原子发表。',
        parameters: onDemand ? knowledgeDeltaFinalizeParameters : knowledgeFinalizeParameters, output: workbenchJsonOutput, execute: async (submission, execution) => {
            const result = await bridge.execute('analysis_agent_finalize', { run_id: runId, submission }, execution.signal);
            execution.concludeTurn();
            return result;
        } }));
}
