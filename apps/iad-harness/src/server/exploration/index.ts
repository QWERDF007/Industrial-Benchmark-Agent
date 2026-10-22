import type { Context } from "@deepseek-ai/cordis";
import { defineTool } from "@deepseek-ai/dsh-tools";
import type { SkillRegistration } from "@deepseek-ai/dsh-skill";
import type { ExplorationCatalog } from "../../shared/domain.generated.js";
import { explorationParameters, directionAdoptionParameters } from "../../shared/exploration.parameters.generated.js";
import { PythonBridge } from "../python-bridge/index.js";
import { workbenchJsonOutput } from "../tool-output.js";
import { knowledgeJobOutput, knowledgePromptOutput } from "../knowledge/output.js";
import { jobStatusParameters, waitForJobStatus } from "../job-status.js";
import { evidenceOutput, readEvidenceAttachment } from "../evidence-attachment.js";

export const DIRECTION_EXPLORATION_SKILL: SkillRegistration = {
  name: "explore-inspection-directions",
  description: "用户明确要求时，同时观察一组候选良品与异常图，探索可编辑的检查方向；结果可在知识挖掘中勾选采用。",
  source: "bundled",
  provider: "iad-harness",
  content: `用户要求探索检查方向时才执行本技能。它独立于导入、知识挖掘和审计，不因导入完成自动启动。
1. dataset_list确认数据集。用knowledge_sources分别按kind:normal和defect查询真实候选sample_id，两组都需要。
2. 用户指定数量就按该数量选取；未指定时先建议各10张并等待确认，不默认全库。图组必须同数据集、无重复，角色是候选来源，不是质量真值。
3. direction_exploration_start传dataset_id、normal_images、defect_images及可选objective。全部两组一次联合输入，不拆组或按图逐个归纳，不把当前通用方向当固定答案。
4. 用direction_exploration_status等待同一run_id的终态；失败先报告真实原因并等用户决定重试或降低数量，不能自行重试。用户要求停止调用direction_exploration_cancel。
5. 成功后direction_exploration_get读取实际版本、方向与限制，可分页；必要时direction_exploration_evidence查看原图。方向只是候选检查议题，不是已证实知识。
6. 告知用户在侧栏方向探索查阅结果，在知识挖掘的探索方向组选用。只有用户明确要求采用时，先knowledge_prompt_get读取当前配置及revision，用knowledge_directions_adopt传所选direction_id和可选名称/说明，服务端保留其他配置；可按用户要求修改名称和说明。遵守applies_to的normal/defect/both适用范围。
7. 不因探索完成自动启动知识挖掘或审计，不写原始标签、人审或Gold。模型与容量从当前配置及实际服务信息读取，不假定模型名称。`,
};

export function createExplorationTools(bridge: PythonBridge, ctx: Context) {
  return [
    defineTool({ name: "direction_exploration_start", description: "仅用户明确要求时，一次联合观察已确认的良品与异常图组，提出待选方向；不发布质量知识或自动挖掘。失败后等待用户决定，不自动拆组、减张或重试。",
      parameters: explorationParameters, output: knowledgeJobOutput,
      execute: (args, exec) => bridge.execute("direction_exploration_start", { request: args, origin_session_id: exec.agent?.id || null }, exec.signal) }),
    defineTool({ name: "direction_exploration_status", description: "查询并等待同一个方向探索作业的实际状态，RUNNING不代表完成。", parameters: jobStatusParameters,
      output: knowledgeJobOutput, execute: (args, exec) => waitForJobStatus(bridge, "direction_exploration_status", args, exec.signal) }),
    ...(["cancel", "retry"] as const).map(action => defineTool({ name: `direction_exploration_${action}`,
      description: action === "cancel" ? "用户要求停止时取消方向探索。" : "仅用户明确要求时按原冻结图组重试方向探索；来源变化要求重新启动。",
      parameters: { run_id: { type: "string", required: true } } as const, output: knowledgeJobOutput,
      execute: (args, exec) => bridge.execute(`direction_exploration_${action}`, args, exec.signal) })),
    defineTool({ name: "direction_exploration_get", description: "分页查阅数据集方向探索结果、版本与证据引用，不启动模型。",
      parameters: { dataset_id: { type: "string", required: true }, version_id: { type: "string" }, direction_id: { type: "string", description: "按已采用方向ID追溯原探索版本" }, page: { type: "number" }, page_size: { type: "number" } } as const,
      output: workbenchJsonOutput,
      execute: async ({ page = 1, page_size = 20, ...args }, exec) => {
        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(page_size) || page_size < 1 || page_size > 100) throw new Error("页码需为正整数，每页1..100项");
        const result = await bridge.execute<ExplorationCatalog>("direction_exploration_get", args, exec.signal);
        const s = result.exploration;
        return { dataset_id: result.dataset_id, versions: result.versions.slice(0, 10).map(v => ({ ...v })), exploration: s ? {
          version_id: s.version_id, run_id: s.run_id, summary: s.summary, limitations: s.limitations, model_name: s.model_name,
          normal_count: s.request.normal_images.length, defect_count: s.request.defect_images.length,
          total: s.directions.length, page, page_size, directions: s.directions.slice((page - 1) * page_size, page * page_size).map(d => ({ ...d })),
        } : null };
      } }),
    defineTool({ name: "direction_exploration_evidence", description: "读取指定方向探索版本真正送入模型的图像附件。",
      parameters: { version_id: { type: "string", required: true }, evidence_id: { type: "string", required: true } } as const,
      output: evidenceOutput, execute: (args, exec) => readEvidenceAttachment(bridge, ctx, "direction_exploration_evidence", args, exec.signal) }),
    defineTool({ name: "knowledge_directions_adopt", description: "仅用户明确要求采用或调整方向时采用所选探索方向；先读取knowledge_prompt_get，传expected_revision、真实direction_id和可选名称/说明，服务端保留其他选项。不改历史作业或人审。",
      parameters: directionAdoptionParameters, output: knowledgePromptOutput,
      execute: (args, exec) => bridge.execute("knowledge_directions_adopt", args, exec.signal) }),
  ];
}
