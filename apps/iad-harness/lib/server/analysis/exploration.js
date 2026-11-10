import { defineTool } from '@deepseek-ai/dsh-tools';
import { explorationCommitParameters, explorationFinalizeParameters } from '../../shared/analysis-agent.parameters.generated.js';
import { workbenchJsonOutput } from '../tool-output.js';
export function registerExplorationTools(scope, bridge, runId) {
    scope.tools.register(defineTool({ name: 'exploration_commit', description: '提交本轮逐登记观察与检查方向的新增、修订或合并。仅引用实际送达且已观察的完整原图evidence_id，关联原始标注及全部局部；原图及必需局部全部观察才计完成。可分多次提交；末轮也可以新增方向。合并指定来源ID及共同检查方式，服务端保留反例与来源。成功回执返回revision、覆盖与完成状态并结束本次调用轮次；失败全部回滚，按错误修正重提。',
        parameters: explorationCommitParameters, output: workbenchJsonOutput,
        execute: async (submission, execution) => {
            const result = await bridge.execute('analysis_agent_commit', { run_id: runId, submission }, execution.signal);
            execution.concludeTurn();
            return result;
        } }));
    scope.tools.register(defineTool({ name: 'exploration_finalize', description: '目标耗尽后，在原Session按页定稿全部方向，含早期未再修改的方向。base_revision使用定稿上下文的锁定值；补齐完整论据理由并独立精选原图。最后全部复核后用complete=true提交全局摘要并原子发表，回执给出正式版本。',
        parameters: explorationFinalizeParameters, output: workbenchJsonOutput, execute: async (submission, execution) => {
            const result = await bridge.execute('analysis_agent_finalize', { run_id: runId, submission }, execution.signal);
            execution.concludeTurn();
            return result;
        } }));
}
