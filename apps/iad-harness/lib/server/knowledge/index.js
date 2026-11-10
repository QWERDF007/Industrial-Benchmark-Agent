import { defineTool } from '@deepseek-ai/dsh-tools';
import { knowledgeAgentStartParameters, analysisScopeParameters } from '../../shared/analysis-agent.parameters.generated.js';
import { knowledgeDetailParameters } from '../../shared/knowledge-detail.parameters.generated.js';
import { workbenchJsonOutput } from '../tool-output.js';
import { evidenceOutput, readEvidenceAttachment } from '../evidence-attachment.js';
import { jobStatusParameters, waitForJobStatus } from '../job-status.js';
import { analysisJobOutput } from '../analysis/output.js';
export function createKnowledgeTools(bridge, ctx) {
    return [
        defineTool({ name: 'knowledge_presets', description: '读取当前预设方向、完整来源身份和可编辑的默认挖掘正文。只选有效探索方向时预设目录可以为空。',
            parameters: {}, output: workbenchJsonOutput,
            execute: (args, execution) => bridge.execute('knowledge_presets', args, execution.signal) }),
        defineTool({ name: 'knowledge_direction_choices', description: '读取所选范围已正式发布的探索方向，包括部分失败作业成果。采用时保留完整source，不用同名标题或局部ID代替版本身份。',
            parameters: analysisScopeParameters, output: workbenchJsonOutput,
            execute: (args, execution) => bridge.execute('analysis_direction_choices', args, execution.signal) }),
        defineTool({ name: 'knowledge_mine', description: '按用户选择的子数据集、方向来源和完整正文启动一个原生挖掘作业。整个登记范围自动分批，一场一个Session；不传图组数量、父知识或每请求批量。submission_id标识同一次创建，重传保持不变。',
            parameters: knowledgeAgentStartParameters, output: analysisJobOutput,
            execute: (args, execution) => bridge.execute('analysis_start', { request: { ...args, analysis_kind: 'knowledge' } }, execution.signal) }),
        defineTool({ name: 'knowledge_job_status', description: '等待同一个挖掘作业的真实状态、完成/失败/未处理数量和发布版本。运行中不是完成；失败时报告真实错误与已发布部分成果。',
            parameters: jobStatusParameters, output: analysisJobOutput,
            execute: (args, execution) => waitForJobStatus(bridge, 'analysis_status', args, execution.signal) }),
        ...['cancel', 'retry'].map(action => defineTool({ name: `knowledge_job_${action}`,
            description: action === 'cancel' ? '停止当前挖掘作业，保留已提交观察与可发布成果。' : '按用户要求继续原冻结登记范围和同一Session，保留已完成观察；不新建子作业或混入新输入。',
            parameters: { run_id: { type: 'string', required: true } }, output: analysisJobOutput,
            execute: (args, execution) => bridge.execute(`analysis_${action}`, args, execution.signal) })),
        defineTool({ name: 'knowledge_get', description: '按run_id读取该作业的正式成果与覆盖，或按version_id读取固定发布版本。不默认采用其他作业的知识。',
            parameters: { run_id: { type: 'string' }, version_id: { type: 'string' } },
            output: workbenchJsonOutput,
            execute: (args, execution) => bridge.execute('knowledge_get', args, execution.signal) }),
        defineTool({ name: 'knowledge_details', description: '分页读取固定知识版本的判据、支持/反对证据及人工核实记录。提供check_id查对应证据，图片通过knowledge_evidence读取。',
            parameters: knowledgeDetailParameters, output: workbenchJsonOutput,
            execute: (args, execution) => bridge.execute('knowledge_details', args, execution.signal) }),
        defineTool({ name: 'knowledge_evidence', description: '按固定version_id读取本场原图、原始ROI或标注定位图的真实附件。不补造缺失证据。',
            parameters: { version_id: { type: 'string', required: true }, evidence_id: { type: 'string', required: true } },
            output: evidenceOutput, execute: (args, execution) => readEvidenceAttachment(bridge, ctx, 'knowledge_evidence', args, execution.signal) }),
    ];
}
