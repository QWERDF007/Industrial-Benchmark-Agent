import type { Context } from "@deepseek-ai/cordis";
import { defineTool, type ToolDefinition } from "@deepseek-ai/dsh-tools";
import { PythonBridge } from "../python-bridge/index.js";
import { workbenchJsonOutput } from "../tool-output.js";
import { evidenceOutput, readEvidenceAttachment } from "../evidence-attachment.js";
import { jobStatusParameters, waitForJobStatus } from "../job-status.js";

export const DATASET_ANALYSIS_WORKFLOW = `数据集分析流程

用户要求“接入数据集、挖掘良品/不良品知识、审计并评估质量”时，使用以下实际操作完成任务；不要只给计划或在启动作业后就声称完成。
1. 用 dataset_list 确认已接入的数据集。用户给出服务器图像目录、Labelme 标注目录和名称时调用 dataset_import；已接入则复用稳定 dataset_id。不猜目录或数据集身份，只询问确实缺少的输入。未接入的附件不能声称已上传或已分析。
2. 加载 skill: mine-normal-knowledge，按其指引启动 knowledge_mine_normal，查询同一 run_id，取得发布的 knowledge_version_id 并读取知识。默认覆盖全部合格来源，不预设产品、检查点或数量预算。
3. 加载 skill: mine-defect-knowledge，将刚取得的 normal_version_id 显式传入，执行并读取实际不良知识。无异常候选时如实说明，不能虚构不良知识；仍可用良品知识进行异常筛查。
4. 用 model_audit_start 显式传入所选 dataset_id、normal_version_id 及实际可用的 defect_version_id；默认全部图像和全部适用 ROI。dataset_audit 只是技术检查，不能替代该 MLLM 联合审计。
5. 用 model_audit_status 等待同一作业达到终态。PENDING/RUNNING 不是完成，部分成功要报告完成/失败/未处理数量。用户要求停止时取消对应知识或审计作业，不把取消会话等同于取消后台作业。
6. 用 dataset_report 读取实际质量统计；必要时 model_audit_sample 读取样本综合结论，model_audit_evidence 或 knowledge_evidence 读取真正送模的全图/ROI/Mask。简要回答覆盖、版本、主要风险及最多三个优先复核项，说明范围与限制。现有报告不提供准确率或综合质量分时不得编造，模型置信度不是准确率。
所有步骤与工作台共用同一数据集、作业、知识、建议和报告；进度按真实结果说明。修改来源需要新知识版本并明确重审，不能改写原始标签、人工决定或 Gold。`;

export function createWorkbenchTools(bridge: PythonBridge, ctx: Context): ToolDefinition[] {
  return [
    defineTool({
      name: "dataset_list",
      description: "列出工作台已导入的数据集及稳定 dataset_id，供选择知识挖掘或审计目标。",
      parameters: {},
      output: workbenchJsonOutput,
      execute: (_args, exec) => bridge.execute("dataset_list", {}, exec.signal),
    }),
    defineTool({
      name: "dataset_import",
      description: "从用户提供的服务器图像目录和 Labelme 标注目录导入数据集；名称可指定，结果立即与工作台共享。目录必须真实存在，已导入的目录请复用 dataset_list 中的数据集。",
      parameters: {
        name: { type: "string", required: true },
        image_dir: { type: "string", required: true },
        annotation_dir: { type: "string", required: true },
        unannotated_is_normal: { type: "boolean", description: "省略时将无标注图作为初始良品候选，不赋予人工 PASS" },
      },
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("dataset_import", args, exec.signal),
    }),
    defineTool({
      name: "model_audit_start",
      description: "用显式冻结的良品知识及可选不良知识启动 MLLM 联合审计。默认审计该数据集全部图像、每张全图和全部适用 ROI；这是知识审计，与 dataset_audit 技术检查不同。",
      parameters: {
        dataset_id: { type: "string", required: true },
        normal_version_id: { type: "string", required: true },
        defect_version_id: { type: "string" },
        model_name: { type: "string", description: "省略使用项目配置的 MLLM" },
        sample_ids: { type: "array", items: { type: "string" }, description: "仅用户明确指定子集时传入；省略审计全部图像" },
      },
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("audit_start", args, exec.signal),
    }),
    defineTool({
      name: "model_audit_status",
      description: "查询同一 MLLM 审计作业的冻结版本、当前阶段及完成/失败/未处理数量，运行中不能声称已完成。",
      parameters: jobStatusParameters,
      output: workbenchJsonOutput,
      execute: (args, exec) => waitForJobStatus(bridge, "audit_status", args, exec.signal),
    }),
    defineTool({
      name: "model_audit_cancel",
      description: "请求停止 MLLM 审计作业并保留已完成建议；当前请求结束后停止，需查询最终状态。",
      parameters: { run_id: { type: "string", required: true } },
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("audit_cancel", args, exec.signal),
    }),
    defineTool({
      name: "model_audit_sample",
      description: "读取样本原始标注、最新模型综合建议、finding/真实 evidence_id、所用知识及人工结果；各来源独立，可按引用继续查看证据。",
      parameters: { sample_id: { type: "string", required: true } },
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("sample_get", args, exec.signal),
    }),
    defineTool({
      name: "model_audit_evidence",
      description: "读取指定模型建议真正送模的全图、ROI 或 Mask，返回图像附件用于追问；拒绝不属于该建议的证据。",
      parameters: {
        suggestion_id: { type: "string", required: true },
        evidence_id: { type: "string", required: true },
      },
      output: evidenceOutput,
      execute: (args, exec) => readEvidenceAttachment(bridge, ctx, "audit_evidence", args, exec.signal),
    }),
    defineTool({
      name: "dataset_report",
      description: "读取所选数据集的当前质量报告、审计覆盖和人工复核统计，与工作台一致；模型风险和人工真值分开，覆盖率或模型置信度不是准确率。",
      parameters: { dataset_id: { type: "string", required: true } },
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("report_get", args, exec.signal),
    }),
  ];
}
