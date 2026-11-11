import { defineTool } from '@deepseek-ai/dsh-tools';
import { explorationAgentStartParameters, analysisScopeParameters } from '../../shared/analysis-agent.parameters.generated.js';
import { explorationPresetParameters } from '../../shared/exploration.parameters.generated.js';
import { workbenchJsonOutput } from '../tool-output.js';
import { analysisJobOutput } from '../analysis/output.js';
import { jobStatusParameters, waitForJobStatus } from '../job-status.js';
import { evidenceOutput, readEvidenceAttachment } from '../evidence-attachment.js';
export const DIRECTION_EXPLORATION_SKILL = {
    name: 'explore-inspection-directions',
    description: '用户明确要求时，在选定范围探索可复查的检查方向，正式发布后可在知识挖掘中显式采用。',
    source: 'bundled', provider: 'iad-harness',
    content: `探索独立于导入、知识挖掘和审计，只执行用户已请求的阶段。
1. dataset_list确认子数据集，analysis_sources读取真实登记sample_id供用户选择首轮样例。良品/异常栏是选样角色，不是质量真值；可以只选一侧，合计至少一张。同一登记不能同时扮演两种角色，不自动补图。
2. direction_exploration_presets读取P00至P12与自定义预设的完整可编辑正文，默认P00；系统默认按真实数据集元信息选择类型适配，只组合同一标注类型的子集；用户可改写或另存。direction_exploration_start传submission_id、dataset_ids、手选normal_images/defect_images与prompt完整正文。同一次创建重传保持submission_id和输入不变。
3. 首轮严格按手选，后续在同一个Session中自动按模块设置观察完整登记范围，无需用户逐轮确认。设置的后续批量、良异比例、推理强度和分析模型在创建时冻结；每批首次请求联合发送全部完整原图、原始标注和每条有效标注外扩10%的局部，原图不缩放，不传旧initial_batch_size或每请求批量。
4. direction_exploration_status等待同一run_id。用direction_exploration_get读取该作业的正式方向、支持反例、限制和真实覆盖；失败/取消也可有正式部分成果，无发布版本时如实说明。需要图片时用direction_exploration_evidence读取固定版本证据。
5. 用户要求停止调用direction_exploration_cancel；明确继续时调用direction_exploration_retry沿原Session继续，不重建范围。不要因一场发布自动启动下一模块。
6. 用户要挖掘时，用knowledge_direction_choices读取可选方向，在knowledge_mine的mining_prompt.directions中保留完整source及本场有效标题/指令；正文可编辑，结构化source决定正式关联身份。不通过改写历史方向或保存一套隐式配置完成采用。
7. 不写原始标签、人工核实或Gold；模型和容量从实际模块配置读取。`,
};
export function createExplorationTools(bridge, ctx) {
    return [
        defineTool({ name: 'analysis_sources', description: '只读列出所选子数据集全部登记图像的真实ID与路径，用于首轮显式选样；不按标签补图，也不排除未知或不可读登记。',
            parameters: analysisScopeParameters, output: workbenchJsonOutput,
            execute: (args, execution) => bridge.execute('analysis_sources', args, execution.signal) }),
        defineTool({ name: 'direction_exploration_presets', description: '读取完整可编辑的探索提示词预设，不启动模型。',
            parameters: {}, output: workbenchJsonOutput, execute: (args, execution) => bridge.execute('direction_exploration_presets', args, execution.signal) }),
        defineTool({ name: 'direction_exploration_preset_save', description: '另存完整探索提示词为新预设，不改已受理作业。',
            parameters: explorationPresetParameters, output: workbenchJsonOutput, execute: (args, execution) => bridge.execute('direction_exploration_preset_save', args, execution.signal) }),
        defineTool({ name: 'direction_exploration_start', description: '按用户选定子数据集和至少一张首轮样例，启动一场探索。首轮不补图，后续自动观察整个登记范围；submission_id用于同次创建重传，模型/推理强度/比例/后续批量取模块设置，原图保持原像素尺寸。',
            parameters: explorationAgentStartParameters, output: analysisJobOutput,
            execute: (args, execution) => bridge.execute('analysis_start', { request: { ...args, analysis_kind: 'exploration' } }, execution.signal) }),
        defineTool({ name: 'direction_exploration_status', description: '等待同一探索作业的真实状态和发布版本，报告完成/失败/未处理数量。',
            parameters: jobStatusParameters, output: analysisJobOutput, execute: (args, execution) => waitForJobStatus(bridge, 'analysis_status', args, execution.signal) }),
        ...['cancel', 'retry', 'delete'].map(action => defineTool({ name: `direction_exploration_${action}`,
            description: action === 'cancel' ? '停止探索并保留已提交成果。' : action === 'delete' ? '删除所选探索作业及关联产物。' : '按用户要求继续原冻结范围和同一Session，不重做已完成登记。',
            parameters: { run_id: { type: 'string', required: true } }, output: analysisJobOutput,
            execute: (args, execution) => bridge.execute(`analysis_${action}`, args, execution.signal) })),
        defineTool({ name: 'direction_exploration_get', description: '按所选run_id读取正式方向目录、覆盖及支持反例，失败/取消时也读取该作业已发布部分成果；历史作业保留原结果。',
            parameters: { run_id: { type: 'string', required: true } }, output: workbenchJsonOutput,
            execute: (args, execution) => bridge.execute('analysis_results', args, execution.signal) }),
        defineTool({ name: 'direction_exploration_evidence', description: '读取固定探索版本的真实图像证据。',
            parameters: { version_id: { type: 'string', required: true }, evidence_id: { type: 'string', required: true } },
            output: evidenceOutput, execute: (args, execution) => readEvidenceAttachment(bridge, ctx, 'direction_exploration_evidence', args, execution.signal) }),
    ];
}
