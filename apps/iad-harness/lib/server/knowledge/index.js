import { defineTool } from "@deepseek-ai/dsh-tools";
import { workbenchJsonOutput } from "../tool-output.js";
import { evidenceOutput, readEvidenceAttachment } from "../evidence-attachment.js";
import { jobRetryParameters, jobStatusParameters, waitForJobStatus } from "../job-status.js";
export function createKnowledgeTools(bridge, ctx) {
    return [
        defineTool({
            name: "knowledge_mine_normal",
            description: "启动良品知识挖掘，复用工作台的来源资格、联合 MLLM、持久化作业和不可变知识版本。",
            parameters: {
                dataset_id: { type: "string", required: true },
                model_name: { type: "string", description: "可选；省略使用项目配置的 MLLM" },
                sample_ids: { type: "array", items: { type: "string" }, description: "可选新增来源范围，与父版本仍合格来源合并核验；省略覆盖全部合格良品" },
            },
            output: workbenchJsonOutput,
            execute: (args, exec) => bridge.execute("knowledge_start", { ...args, kind: "normal" }, exec.signal),
        }),
        defineTool({
            name: "knowledge_mine_defect",
            description: "依据显式冻结的同数据集良品版本，联合核验标注/疑点并挖掘不良知识，不改写人审或原始标签。",
            parameters: {
                dataset_id: { type: "string", required: true },
                normal_version_id: { type: "string", required: true },
                model_name: { type: "string", description: "可选；省略使用项目配置的 MLLM" },
                sample_ids: { type: "array", items: { type: "string" }, description: "可选新增来源范围，与父版本仍合格来源合并核验；省略覆盖全部合格异常候选" },
            },
            output: workbenchJsonOutput,
            execute: (args, exec) => bridge.execute("knowledge_start", { ...args, kind: "defect" }, exec.signal),
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
            description: "读取不可变知识版本及检查项、核验结果、来源和真实 evidence_id。指定 version_id，或 dataset_id 加 kind。",
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
