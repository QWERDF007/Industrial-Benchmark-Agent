import fs from "node:fs/promises";
import type { Context } from "@deepseek-ai/cordis";
import type { ImageAttachmentRef } from "@deepseek-ai/dsh-attachment";
import type { ContentBlock } from "@deepseek-ai/dsh-llm";
import { defineTool, type ToolDefinition, type InferValue } from "@deepseek-ai/dsh-tools";
import { PythonBridge } from "../python-bridge/index.js";

type JsonResult = InferValue<{ type: "json" }>;
type EvidenceResult = { version_id: string; evidence_id: string;
  attachment: { [Key in keyof ImageAttachmentRef]: ImageAttachmentRef[Key] } };

const jsonOutput = {
  schema: { type: "json" } as const,
  render(_args: unknown, value: JsonResult): ContentBlock[] {
    return [{ type: "text", text: JSON.stringify(value, (key, item) =>
      key === "mining_steps" || key === "verification_steps" ? undefined : item) }];
  },
};

export function createKnowledgeTools(bridge: PythonBridge, ctx: Context): ToolDefinition[] {
  return [
    defineTool({
      name: "dataset_list",
      description: "列出工作台已导入的数据集及稳定 dataset_id，供选择知识挖掘目标。",
      parameters: {},
      output: jsonOutput,
      execute: (_args, exec) => bridge.execute("dataset_list", {}, exec.signal),
    }),
    defineTool({
      name: "knowledge_mine_normal",
      description: "启动良品知识挖掘，复用工作台的来源资格、联合 MLLM、持久化作业和不可变知识版本。",
      parameters: {
        dataset_id: { type: "string", required: true },
        model_name: { type: "string", description: "可选；省略使用项目配置的 MLLM" },
        sample_ids: { type: "array", items: { type: "string" }, description: "可选新增来源范围，与父版本仍合格来源合并核验；省略覆盖全部合格良品" },
      },
      output: jsonOutput,
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
      output: jsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_start", { ...args, kind: "defect" }, exec.signal),
    }),
    defineTool({
      name: "knowledge_job_status",
      description: "读取同一知识作业的真实完成、失败、未处理数量及已发布版本；RUNNING 不表示完成。",
      parameters: { run_id: { type: "string", required: true } },
      output: jsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_status", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_job_cancel",
      description: "请求停止知识作业，保留已完成记录；当前模型请求返回后停止，之后查询最终状态。",
      parameters: { run_id: { type: "string", required: true } },
      output: jsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_cancel", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_get",
      description: "读取不可变知识版本及检查项、核验结果、来源和真实 evidence_id。指定 version_id，或 dataset_id 加 kind。",
      parameters: {
        version_id: { type: "string" },
        dataset_id: { type: "string" },
        kind: { type: "string", enum: ["normal", "defect"] },
      },
      output: jsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_get", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_evidence",
      description: "读取指定知识版本实际送模的全图、原生 ROI 或二值标注图，返回真实图像附件；拒绝不属于该版本的证据。",
      parameters: {
        version_id: { type: "string", required: true },
        evidence_id: { type: "string", required: true },
      },
      output: {
        schema: { type: "json" },
        render(_args, value) {
          const media = value as EvidenceResult;
          return [{ type: "text", text: JSON.stringify(media) }, { type: "image", attachment: media.attachment }];
        },
      },
      async execute(args, exec) {
        if (!ctx.attachments) throw new Error("Knowledge evidence requires the DSH attachment store");
        const media = await bridge.execute<{ path: string; media_type: "image/png" }>("knowledge_evidence", args, exec.signal);
        exec.signal.throwIfAborted();
        const data = await fs.readFile(media.path, { signal: exec.signal });
        const attachment = await ctx.attachments.saveImage({ data, mediaType: media.media_type, name: args.evidence_id + ".png" });
        return { ...args, attachment: { ...attachment } };
      },
    }),
  ];
}
