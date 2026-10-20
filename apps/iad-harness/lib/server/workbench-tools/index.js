import { defineTool } from "@deepseek-ai/dsh-tools";
import { workbenchJsonOutput } from "../tool-output.js";
import { evidenceOutput, readEvidenceAttachment } from "../evidence-attachment.js";
import { jobRetryParameters, jobStatusParameters, waitForJobStatus } from "../job-status.js";
export const DATASET_ANALYSIS_WORKFLOW = `数据集分析流程

用户要求“接入数据集、挖掘良品/不良品知识、审计并评估质量”时，使用以下实际操作完成任务；不要只给计划或在启动作业后就声称完成。
1. 用 dataset_list 确认已接入的数据集。数据接入以服务器目录为主：用户只提供根目录（如 /data1/data/xxx）时，用 dataset_directory_inspect 检查实际子目录及当前层文件扩展名数量，按需向下查看，识别图像目录与 Labelme JSON 标注目录；同一目录混放图像和 JSON 时两者可相同。只有一个明确的目录组合时直接用 dataset_import，不要求用户再次逐一填写路径；多个候选组合或结构不明确时只询问歧义，不猜路径。名称未指定时取用户提供根目录的目录名，后续可在数据集管理修改；名称不是必须追问的信息。用户已明确给出两目录时直接导入。不存在或不可访问的目录如实报告，不能声称已上传或分析。已接入则复用稳定 dataset_id。保留 ZIP 工具供明确提供压缩包路径时使用，普通目录任务不要求上传附件。
2. 加载 skill: mine-normal-knowledge，按其指引启动 knowledge_mine_normal，查询同一 run_id，取得发布的 knowledge_version_id 并读取知识。默认覆盖全部合格来源，不预设产品、检查点或数量预算。
3. 加载 skill: mine-defect-knowledge，将刚取得的 normal_version_id 显式传入，执行并读取实际不良知识。无异常候选时如实说明，不能虚构不良知识；仍可用良品知识进行异常筛查。
4. 用 model_audit_start 显式传入所选 dataset_id、normal_version_id 及实际可用的 defect_version_id；默认全部图像和全部适用 ROI。dataset_audit 只是技术检查，不能替代该 MLLM 联合审计。
5. 用 model_audit_status 等待同一作业达到终态。PENDING/RUNNING 不是完成，部分成功要报告完成/失败/未处理数量。用户要求停止时取消对应知识或审计作业，不把取消会话等同于取消后台作业。
失败或中断后用 model_audit_retry 或 knowledge_job_retry 创建关联的新执行。审计只处理尚未完成的单图；知识联合归纳须保留整组冻结来源，原子发布一个版本。源图、标注、反馈或冻结知识变化时须重新启动，不绕过核验。重试仍失败时查询新 run_id，再决定是否重试该执行。
6. 用 dataset_report 读取实际质量统计；必要时 model_audit_sample 读取样本综合结论，model_audit_evidence 或 knowledge_evidence 读取真正送模的全图/ROI/Mask。简要回答覆盖、版本、主要风险及最多三个优先复核项，说明范围与限制。按 quality 中的技术可用率、审计覆盖率、人工核验覆盖率分别说明分子、分母和百分比；分母为零时未评估，不显示0%或100%。单列疑点、缺证、冲突及未保存结构化分析的数量，保留实际知识版本组合、范围、限制和时间。报告未提供加权总分或准确率，不得编造，模型置信度不是准确率。
所有步骤与工作台共用同一数据集、作业、知识、建议和报告；进度按真实结果说明。修改来源需要新知识版本并明确重审，不能改写原始标签、人工决定或 Gold。

审图追问：收到 dataset_id/sample_id/suggestion_id 及可选 finding_id/evidence_id 时，先用 model_audit_context 校验并读取该次冻结分析和知识版本，再逐一用 model_audit_evidence 读取返回 evidence 中的真实全图、ROI 与配对原图。不能用最新建议替换旧引用，也不能只根据文字判断。is_latest=false 时明确这是历史建议；引用或图像缺失时报告缺失并停止基于该证据推断。结合全图关系、局部细节、位置、光照、正常替代解释与知识限制回答，不代替人工裁决。保留用户提供的返回检视链接。`;
export function createWorkbenchTools(bridge, ctx) {
    return [
        defineTool({
            name: "dataset_list",
            description: "列出工作台已导入的数据集及稳定 dataset_id，供选择知识挖掘或审计目标。",
            parameters: {},
            output: workbenchJsonOutput,
            execute: (_args, exec) => bridge.execute("dataset_list", {}, exec.signal),
        }),
        defineTool({
            name: "dataset_directory_inspect",
            description: "只读检查服务器数据集目录，返回真实子目录和当前层文件扩展名数量 file_counts（不递归，不等于有效样本数）；按需逐层识别图像与 Labelme JSON 所在目录，二者可为同一目录。不会导入或修改数据。",
            parameters: { path: { type: "string", required: true, description: "用户给出的服务器目录或已列出的子目录绝对路径" } },
            output: workbenchJsonOutput,
            execute: (args, exec) => bridge.execute("directory_list", args, exec.signal),
        }),
        defineTool({
            name: "dataset_archive_inspect",
            description: "检查用户提供的 ZIP 数据集附件或服务器压缩包，列出包内目录的图像/JSON 数量；使用宿主附件句柄中的保存路径，再据实际目录导入。",
            parameters: { archive_path: { type: "string", required: true } },
            output: workbenchJsonOutput,
            execute: (args, exec) => bridge.execute("dataset_archive_inspect", args, exec.signal),
        }),
        defineTool({
            name: "dataset_import",
            description: "从服务器目录或 ZIP 附件导入 Labelme 数据集。给 archive_path 时，image_dir/annotation_dir 是包内相对目录；否则是服务器目录。保留原始图像与标注，与工作台共享；重复目录请复用已有数据集。",
            parameters: {
                name: { type: "string", required: true },
                image_dir: { type: "string", required: true },
                annotation_dir: { type: "string", required: true },
                archive_path: { type: "string", description: "可选 ZIP 的宿主保存路径，先用 dataset_archive_inspect 确认目录；附件使用宿主提供的只读文件路径" },
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
            name: "model_audit_retry",
            description: "重试终态审计作业的失败/未处理样本，复用原冻结知识并核验来源，保留成功建议和原记录；输入变化时拒绝恢复。",
            parameters: jobRetryParameters,
            output: workbenchJsonOutput,
            execute: (args, exec) => bridge.execute("audit_retry", args, exec.signal),
        }),
        defineTool({
            name: "model_audit_sample",
            description: "读取样本原始标注、最新模型综合建议、finding/真实 evidence_id、所用知识及人工结果；各来源独立，可按引用继续查看证据。",
            parameters: { sample_id: { type: "string", required: true } },
            output: workbenchJsonOutput,
            execute: (args, exec) => bridge.execute("sample_get", args, exec.signal),
        }),
        defineTool({
            name: "model_audit_context",
            description: "校验页面追问的冻结引用，读取该次建议、疑点、知识版本及实际全图/ROI证据清单；旧建议不会被最新结果替换，缺失或错配明确拒绝。随后用 model_audit_evidence 读取清单中的真实图像。",
            parameters: {
                dataset_id: { type: "string", required: true },
                sample_id: { type: "string", required: true },
                suggestion_id: { type: "string", required: true },
                finding_id: { oneOf: [{ type: "string" }, { type: "null" }] },
                evidence_id: { oneOf: [{ type: "string" }, { type: "null" }] },
            },
            output: workbenchJsonOutput,
            execute: (args, exec) => bridge.execute("inspection_context", args, exec.signal),
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
