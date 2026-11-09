import type {Context} from '@deepseek-ai/cordis';
import {defineTool} from '@deepseek-ai/dsh-tools';
import {knowledgeCommitParameters} from '../../shared/analysis-agent.parameters.generated.js';
import type {PythonBridge} from '../python-bridge/index.js';
import {workbenchJsonOutput} from '../tool-output.js';

export function registerKnowledgeCommit(scope: Context, bridge: PythonBridge, runId: string) {
  scope.tools.register(defineTool({name: 'knowledge_commit', description: '提交本轮逐登记观察与已选方向下的知识新增、修订或合并。每个登记记录全部已选方向的适用性及原因；允许不适用，但不跳过登记。知识引用本场媒体及冻结direction_refs，保留支持、反例和限制；同像素登记不增加独立支持。base_revision取最新回执，可分多次提交。',
    parameters: knowledgeCommitParameters, output: workbenchJsonOutput,
    execute: async (submission, execution) => {
      const result = await bridge.execute('analysis_agent_commit', {run_id: runId, submission}, execution.signal);
      execution.concludeTurn();
      return result;
    }}));
}
