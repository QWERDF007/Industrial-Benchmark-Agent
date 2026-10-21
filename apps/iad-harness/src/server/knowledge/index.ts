import type { Context } from "@deepseek-ai/cordis";
import { defineTool, type ToolDefinition } from "@deepseek-ai/dsh-tools";
import { PythonBridge } from "../python-bridge/index.js";
import { workbenchJsonOutput } from "../tool-output.js";
import { evidenceOutput, readEvidenceAttachment } from "../evidence-attachment.js";
import { jobRetryParameters, jobStatusParameters, waitForJobStatus } from "../job-status.js";
import { miningParameters } from "../../shared/mining.parameters.generated.js";
import { knowledgeOutput, knowledgeScopeOutput, knowledgeJobOutput } from "./output.js";
import { knowledgeScopeParameters } from "../../shared/knowledge-scope.parameters.generated.js";
import { knowledgeDetailParameters } from "../../shared/knowledge-detail.parameters.generated.js";
import { knowledgeSourceParameters } from "../../shared/knowledge-source.parameters.generated.js";

export function createKnowledgeTools(bridge: PythonBridge, ctx: Context): ToolDefinition[] {
  return [
    defineTool({
      name: "knowledge_scope_open",
      description: "仅在用户明确要求连续处理整个范围时，保存授权任务与当前候选范围；此操作不发模型请求。objective记录实际用户意图，search/seed冻结筛选及顺序，可提供starting_version_id与异常的normal_version_id。只看一组不建立范围。每次数量仍由Agent在三输入图组工具中选择，不增加循环或首批参数。",
      parameters: knowledgeScopeParameters,
      output: knowledgeScopeOutput,
      execute: (args, exec) => bridge.execute("knowledge_scope_open", { request: args, origin_session_id: exec.agent?.id || null }, exec.signal),
    }),
    defineTool({
      name: "knowledge_scope_get",
      description: "读取连续范围真实版本、已观察/待核验/剩余及活动作业。传scope_run_id，或dataset_id与kind查询当前会话活动范围。首组完成不等于整个范围完成。用scope_run_id查询knowledge_sources下一组，等待上组发布，显式携带刚返回的current_version_id继续，直到真实剩余耗尽；不重发全部历史图，不枚举全库。",
      parameters: { scope_run_id: { type: "string" }, dataset_id: { type: "string" }, kind: { type: "string", enum: ["normal", "defect"] } },
      output: knowledgeScopeOutput,
      execute: (args, exec) => bridge.execute("knowledge_scope_get", { ...args, origin_session_id: exec.agent?.id || null }, exec.signal),
    }),
    defineTool({
      name: "knowledge_scope_stop",
      description: "用户要求停止连续挖掘时撤销范围继续执行并取消其活动知识作业，保留实际观察与版本；停止会话不代表后台已停。",
      parameters: { scope_run_id: { type: "string", required: true } },
      output: knowledgeScopeOutput,
      execute: (args, exec) => bridge.execute("knowledge_scope_stop", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_scope_resume",
      description: "仅用户明确继续原连续任务时重新关联该范围到当前会话；不启动模型，不扩展冻结来源。先查询其真实进度，运行中作业不重复启动，失败组通过关联retry恢复；来源或知识变化不得混用。",
      parameters: { scope_run_id: { type: "string", required: true } },
      output: knowledgeScopeOutput,
      execute: (args, exec) => bridge.execute("knowledge_scope_resume", { ...args, origin_session_id: exec.agent?.id || null }, exec.signal),
    }),
    defineTool({
      name: "knowledge_sources",
      description: "只读分页查询合格来源，返回真实sample_id、路径和资格。page_size范围1..200，默认10；只查询当前已确认图组所需引用，不预先枚举全库。用户未给图组数量时先建议10或20张并等待确认，不能把未给数量理解为全部来源。连续任务传scope_run_id查询冻结范围内真实剩余；不传时kind为normal/defect，search筛选路径。结果资格是候选身份，不是视觉真值；不会启动作业。",
      parameters: knowledgeSourceParameters,
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_sources", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_mine_normal",
      description: "独立挖掘明确图组的良品知识。仅提供knowledge_preset、image_count、images；引用从knowledge_sources复制，数量严格一致。无预设不读当前知识，不合并全部历史来源。总范围与每次数量按用户上下文区分，缺少数量建议10或20，不预先枚举全库。",
      parameters: miningParameters,
      output: knowledgeJobOutput,
      execute: (args, exec) => bridge.execute("knowledge_start", { request: { ...args, kind: "normal" }, model_name: process.env.LIVE_VLM_MODEL || exec.agent?.options.model, origin_session_id: exec.agent?.id || null }, exec.signal),
    }),
    defineTool({
      name: "knowledge_mine_defect",
      description: "独立挖掘明确图组的异常候选知识。三输入与良品工具相同，可选良品基准及异常预设。没有正常基准时仅整理待验证假设，不自动挖掘良品或执行审计。images只用真实引用，工具只处理本组。",
      parameters: miningParameters,
      output: knowledgeJobOutput,
      execute: (args, exec) => bridge.execute("knowledge_start", { request: { ...args, kind: "defect" }, model_name: process.env.LIVE_VLM_MODEL || exec.agent?.options.model, origin_session_id: exec.agent?.id || null }, exec.signal),
    }),
    defineTool({
      name: "knowledge_job_observations",
      description: "只读分页查阅同一知识作业实际规划和已接受的观察证据，包含失败/取消/尚未发布的作业；observed不代表已发布或人工确认。图像用knowledge_evidence传run_id读取。",
      parameters: { run_id: { type: "string", required: true }, page: { type: "integer", default: 1 }, page_size: { type: "integer", default: 10 } },
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_observations", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_job_status",
      description: "读取同一知识作业的真实完成、失败、未处理数量及已发布版本；RUNNING 不表示完成。",
      parameters: jobStatusParameters,
      output: knowledgeJobOutput,
      execute: (args, exec) => waitForJobStatus(bridge, "knowledge_status", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_job_cancel",
      description: "请求停止知识作业，保留已完成记录；当前模型请求返回后停止，之后查询最终状态。",
      parameters: { run_id: { type: "string", required: true } },
      output: knowledgeJobOutput,
      execute: (args, exec) => bridge.execute("knowledge_cancel", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_job_retry",
      description: "用全部冻结来源重试失败、取消或中断的联合知识挖掘，核验原图、标注、反馈及冻结版本；保留原运行和已发布知识，变化时要求重新启动。",
      parameters: { run_id: jobRetryParameters.run_id },
      output: knowledgeJobOutput,
      execute: (args, exec) => bridge.execute("knowledge_retry", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_get",
      description: "读取知识版本、真实计数、新鲜度和最多三个优先疑点的紧凑摘要。指定version_id，或dataset_id加kind。判据与证据用knowledge_details按需分页；冲突用knowledge_conflict_context读取。不会展开全库或改写历史。",
      parameters: {
        version_id: { type: "string" },
        dataset_id: { type: "string" },
        kind: { type: "string", enum: ["normal", "defect"] },
      },
      output: knowledgeOutput,
      execute: (args, exec) => bridge.execute("knowledge_get", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_details",
      description: "只读分页获取固定版本的完整判据。提供check_id时分页读取该判据真实支持/反对证据元数据，随后knowledge_evidence读取图像。page_size默认10，上限50；不预先枚举全部历史来源。",
      parameters: knowledgeDetailParameters,
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_details", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_conflict_context",
      description: "只读解析固定版本冲突、关联判据、真实新旧证据及人工处置记录。只供解释和定位，不能提交或代填人工裁决；图像用knowledge_evidence读取。",
      parameters: {version_id: {type: "string", required: true}, conflict_id: {type: "string", required: true}},
      output: workbenchJsonOutput,
      execute: (args, exec) => bridge.execute("knowledge_review_context", args, exec.signal),
    }),
    defineTool({
      name: "knowledge_evidence",
      description: "读取冻结全图、原生ROI或二值标注图；提供已发布version_id或作业run_id之一，返回真实图像附件。拒绝不属于所选版本/作业的证据，不补造缺失图像。",
      parameters: {
        run_id: { type: "string" },
        version_id: { type: "string" },
        evidence_id: { type: "string", required: true },
      },
      output: evidenceOutput,
      execute: (args, exec) => readEvidenceAttachment(bridge, ctx, "knowledge_evidence", args, exec.signal),
    }),
  ];
}
