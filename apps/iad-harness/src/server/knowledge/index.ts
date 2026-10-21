import type { Context } from "@deepseek-ai/cordis";
import { defineTool, type ToolDefinition } from "@deepseek-ai/dsh-tools";
import { PythonBridge } from "../python-bridge/index.js";
import { workbenchJsonOutput } from "../tool-output.js";
import { evidenceOutput, readEvidenceAttachment } from "../evidence-attachment.js";
import { jobRetryParameters, jobStatusParameters, waitForJobStatus } from "../job-status.js";
import { miningParameters } from "../../shared/mining.parameters.generated.js";

const { kind: _kind, origin_session_id: _origin, normal_version_id: normalVersion, ...sourceParameters } = miningParameters;

export function createKnowledgeTools(bridge: PythonBridge, ctx: Context): ToolDefinition[] {
  return [
    defineTool({
      name: "knowledge_mine_normal",
      description: "独立启动用户要求的良品知识挖掘，无需加载技能；先核对来源资格和用户范围，复用工作台联合MLLM、持久化作业与知识版本。",
      parameters: sourceParameters,
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_start", { ...args, kind: "normal", origin_session_id: exec.agent?.id || null }, exec.signal),
    }),
    defineTool({
      name: "knowledge_mine_defect",
      description: "独立启动用户要求的异常知识挖掘，无需加载技能；依据显式同数据集良品版本核验标注/疑点，缺少依赖时说明，不自动启动其他阶段，不改人审或原标签。",
      parameters: { ...sourceParameters, normal_version_id: { ...normalVersion, required: true } },
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_start", { ...args, kind: "defect", origin_session_id: exec.agent?.id || null }, exec.signal),
    }),
    defineTool({
      name: "knowledge_job_status",
      description: "读取同一知识作业的真实完成、失败、未处理数量及已发布版本；RUNNING 不表示完成。",
      parameters: jobStatusParameters,
      output: workbenchJsonOutput,
      execute: (args, exec) => waitForJobStatus(bridge, "knowledge_status", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_job_cancel",
      description: "请求停止知识作业，保留已完成记录；当前模型请求返回后停止，之后查询最终状态。",
      parameters: { run_id: { type: "string", required: true } },
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_cancel", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_job_retry",
      description: "用全部冻结来源重试失败、取消或中断的联合知识挖掘，核验原图、标注、反馈及冻结版本；保留原运行和已发布知识，变化时要求重新启动。",
      parameters: { run_id: jobRetryParameters.run_id },
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_retry", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_get",
      description: "读取不可变知识及检查项、核验、真实 evidence_id，并返回实际来源变化、未覆盖候选和良品依赖状态。指定 version_id，或 dataset_id 加 kind；freshness 是查询时状态，不会改写旧版。",
      parameters: {
        version_id: { type: "string" },
        dataset_id: { type: "string" },
        kind: { type: "string", enum: ["normal", "defect"] },
      },
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_get", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_evidence",
      description: "读取指定知识版本实际送模的全图、原生 ROI 或二值标注图，返回真实图像附件；拒绝不属于该版本的证据。",
      parameters: {
        version_id: { type: "string", required: true },
        evidence_id: { type: "string", required: true },
      },
      output: evidenceOutput,
      execute: (args, exec) => readEvidenceAttachment(bridge, ctx, "knowledge_evidence", args, exec.signal),
    }),
  ];
}
