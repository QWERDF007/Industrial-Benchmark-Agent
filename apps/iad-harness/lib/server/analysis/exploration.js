import { defineTool } from '@deepseek-ai/dsh-tools';
import { explorationCommitParameters } from '../../shared/analysis-agent.parameters.generated.js';
import { workbenchJsonOutput } from '../tool-output.js';
export function registerExplorationCommit(scope, bridge, runId) {
    scope.tools.register(defineTool({ name: 'exploration_commit', description: '提交本轮逐登记观察与检查方向的新增、修订或合并。引用实际读取的本场媒体ID；原图及必需ROI全部观察才计完成。可分多次提交，base_revision取最新回执；末轮也可以新增方向。合并明确指定来源ID，服务端保留反例与来源。',
        parameters: explorationCommitParameters, output: workbenchJsonOutput,
        execute: async (submission, execution) => {
            const result = await bridge.execute('analysis_agent_commit', { run_id: runId, submission }, execution.signal);
            execution.concludeTurn();
            return result;
        } }));
}
