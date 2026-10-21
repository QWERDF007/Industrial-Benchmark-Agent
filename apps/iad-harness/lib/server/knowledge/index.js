import { defineTool } from "@deepseek-ai/dsh-tools";
import { workbenchJsonOutput } from "../tool-output.js";
import { evidenceOutput, readEvidenceAttachment } from "../evidence-attachment.js";
import { jobRetryParameters, jobStatusParameters, waitForJobStatus } from "../job-status.js";
import { miningParameters } from "../../shared/mining.parameters.generated.js";
import { knowledgeSourceParameters } from "../../shared/knowledge-source.parameters.generated.js";
const { kind: _kind, origin_session_id: _origin, normal_version_id: normalVersion, ...sourceParameters } = miningParameters;
const selectedSourceParameters = { ...sourceParameters, sample_ids: { ...sourceParameters.sample_ids, required: true,
        description: "必须显式提供选择的真实sample_id数组，从knowledge_sources查询复制。新增来源仍与父版本合并，先核对已有来源与用户范围。不可猜测、改用relative_path或省略来扩大到全库。" } };
export function createKnowledgeTools(bridge, ctx) {
    return [
        defineTool({
            name: "knowledge_sources",
            description: "只读分页查询合格来源，返回真实sample_id、路径和资格。page_size范围1..200，默认10；只查询当前已确认图组所需引用，不预先枚举全库。用户未给图组数量时先建议10或20张并等待确认，不能把未给数量理解为全部来源。kind为normal/defect，search筛选路径。结果资格是候选身份，不是视觉真值；不会启动作业。",
            parameters: knowledgeSourceParameters,
            output: workbenchJsonOutput,
            execute: (args, exec) => bridge.execute("knowledge_sources", args, exec.signal),
        }),
        defineTool({
            name: "knowledge_mine_normal",
            description: "独立启动良品知识挖掘，无需加载完整流程技能。未明确本次图组数量时先建议10或20张并等待用户确认，不自动解释成全部来源或预先枚举全库；明确数量后用knowledge_sources查询真实引用并显式选择sample_ids。已有父版本会合并历史来源，执行前核对范围，不能声称支持尚未实现的逐组续用。",
            parameters: selectedSourceParameters,
            output: workbenchJsonOutput,
            execute: (args, exec) => bridge.execute("knowledge_start", { ...args, kind: "normal", origin_session_id: exec.agent?.id || null }, exec.signal),
        }),
        defineTool({
            name: "knowledge_mine_defect",
            description: "独立启动异常知识挖掘，无需加载完整流程技能。未明确图组数量时先建议10或20张并等待确认，不预先枚举全库；先用knowledge_sources查询真实引用，显式选择sample_ids并提供同数据集良品版本，缺依赖时说明，不自动启动其他阶段。",
            parameters: { ...selectedSourceParameters, normal_version_id: { ...normalVersion, required: true } },
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
