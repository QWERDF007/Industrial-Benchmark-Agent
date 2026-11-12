import { defineTool } from '@deepseek-ai/dsh-tools';
import { explorationCommitParameters, explorationFinalizeParameters } from '../../shared/analysis-agent.parameters.generated.js';
import { workbenchJsonOutput } from '../tool-output.js';
import { explorationDeltaCommitParameters, explorationDeltaFinalizeParameters } from '../../shared/analysis-context.parameters.generated.js';
export function registerExplorationTools(scope, bridge, runId, onDemand = false) {
    scope.tools.register(defineTool({ name: 'exploration_commit', description: onDemand ? '主Agent正式提交首批或整波目录更新。base_revision和round_id取最新上下文。directions只提交新增或正文变化的完整业务条目，不含累计证据数组或精选；未变传[]。正文描述现象和比较关系，不写文件名、图号或图像ID。arguments仅提交新增或需复核的论据，selections独立确认精选，每条最多4张且有效反例需有代表。改变已有主张须change_reason并分页读齐旧有效论据逐项复核。复核时observations传[]，report_reviews必须一次覆盖本波全部报告及每项候选，new/merge指定目标与实际理由，reject说明依据。子报告不是自动接收的目录论据。覆盖依整批成功业务请求核验，压缩调用不计观察；幂等键仅相同内容重用，整波失败全部回滚，成功结束本轮。' : '主Agent正式提交首批或整波目录更新。base_revision与round_id使用当前上下文。role=reviewer时observations传[]，report_reviews一次覆盖reports全部报告及全部候选；各round_id取对应报告，discovery_decisions中new指定新方向ID，merge指定兼容目标及理由，reject说明依据。宿主导入已核验子报告并保留原批次，统一提交成功后才推进覆盖。首批observations可省略；directions.rationale、arguments.reason提供所引原图的实际可见依据，宿主只保存明确引用的事实，不为未引用登记填充文本。整批完整原图和可用必需局部须有自身成功请求的送达；可读原图的材料错误保留限制，不可读原图单列失败。report_preparation_error只能对应材料回执的真实error。directions仅填新增或修改项，未变条目传[]；只增加论据可仅填arguments。改变instruction、rationale、适用条件或limitations须填change_reason，并通过analysis_arguments读齐旧有效论据后，在arguments逐项复核角色、保留/解释/移出范围及理由；新论据可省observation_id由宿主绑定。key_evidence按完整有效论据角色选择原图，正常对照可关联support或allowed_variation；裁图归属原登记。merges填写来源ID及兼容依据。成功回执返回revision、覆盖和完成状态并结束本轮；校验失败全部回滚，按错误修正重提。',
        parameters: onDemand ? explorationDeltaCommitParameters : explorationCommitParameters, output: workbenchJsonOutput,
        execute: async (submission, execution) => {
            const result = await bridge.execute('analysis_agent_commit', { run_id: runId, submission }, execution.signal);
            execution.concludeTurn();
            return result;
        } }));
    scope.tools.register(defineTool({ name: 'exploration_finalize', description: onDemand ? '在原Session按页定稿。base_revision始终取定稿上下文锁定值，不能用递增revision替代。先按pending_entry_ids读取analysis_catalog与analysis_arguments，directions仅提交正文变化项，未变传[]；selections明确确认本页已复核条目与精选，arguments仅提交变化或需要补理由的关系。改变主张需change_reason并逐项复核旧有效论据。正文不用文件名、图像ID或图号，精选最多4张且有效反例须有代表。全部条目确认后complete=true提交全局摘要原子发布，允许空目录。失败本页全部回滚。' : '全部登记处理后，在原Session正式定稿。先读analysis_context，base_revision始终使用锁定值；按pending_entry_ids读取analysis_catalog和analysis_arguments，directions仅提交本页完整条目。改写主张、适用条件或限制需change_reason并复核全部既有有效论据，arguments补齐实际作用理由；可用analysis_evidence回看。key_evidence只能使用完整有效论据中的原图和对应角色，最多4张；重要反例需有代表，不要求良品与异常同时入选。失败本页全部回滚，按错误修正重提。所有pending_entry_ids处理后，以complete=true提交全局摘要、有效限制和未决项并原子发布；无可靠方向允许空目录。回执提供正式version_id，成功后结束本轮。',
        parameters: onDemand ? explorationDeltaFinalizeParameters : explorationFinalizeParameters, output: workbenchJsonOutput, execute: async (submission, execution) => {
            const result = await bridge.execute('analysis_agent_finalize', { run_id: runId, submission }, execution.signal);
            execution.concludeTurn();
            return result;
        } }));
}
