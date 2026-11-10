import { defineTool } from '@deepseek-ai/dsh-tools';
import { knowledgeCommitParameters, knowledgeFinalizeParameters } from '../../shared/analysis-agent.parameters.generated.js';
import { workbenchJsonOutput } from '../tool-output.js';
export function registerKnowledgeTools(scope, bridge, runId) {
    scope.tools.register(defineTool({ name: 'knowledge_commit', description: '提交本轮逐登记观察与已选方向下的知识新增、修订或合并。每个登记恰好记录selected_directions全部ref的适用性及原因，不跳过登记。仅引用实际送达且已观察的完整原图ID，关联原始标注及全部局部；全部必需视图观察才计完成。同像素登记不增加独立支持。可分多次提交，成功回执返回revision、覆盖与完成状态并结束本次调用轮次；失败全部回滚，按错误修正重提。',
        parameters: knowledgeCommitParameters, output: workbenchJsonOutput,
        execute: async (submission, execution) => {
            const result = await bridge.execute('analysis_agent_commit', { run_id: runId, submission }, execution.signal);
            execution.concludeTurn();
            return result;
        } }));
    scope.tools.register(defineTool({ name: 'knowledge_finalize', description: '目标耗尽后，在原Session按页定稿全部判据，核对完整支持、反例、范围、允许变化与精选原图。base_revision使用锁定值；direction_reviews说明全部所选方向的产出或零产出。最后pending_entry_ids为空后用complete=true提交全局摘要并原子发表。',
        parameters: knowledgeFinalizeParameters, output: workbenchJsonOutput, execute: async (submission, execution) => {
            const result = await bridge.execute('analysis_agent_finalize', { run_id: runId, submission }, execution.signal);
            execution.concludeTurn();
            return result;
        } }));
}
