import { folderRulesParameter } from "../../shared/dataset.parameters.generated.js";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { datasetDiscoveryOutput, workbenchJsonOutput } from "../tool-output.js";
import { evidenceOutput, readEvidenceAttachment } from "../evidence-attachment.js";
import { jobRetryParameters, jobStatusParameters, waitForJobStatus } from "../job-status.js";
export function createWorkbenchTools(bridge, ctx) {
    return [
        defineTool({
            name: "dataset_list",
            description: "列出已导入数据集的名称、稳定dataset_id、格式与数量摘要。真实图像引用用knowledge_sources分页查询，完整质量统计用dataset_report读取。",
            parameters: {},
            output: datasetDiscoveryOutput,
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
            name: "dataset_preview",
            description: "只读预览异常检测目录，返回实际items、冲突和preview_fingerprint；不登记数据。",
            parameters: {
                root_dir: { type: "string", required: true },
                rules: { ...folderRulesParameter, description: "可选确认规则；不传时生成建议" },
            },
            output: workbenchJsonOutput,
            execute: (args, exec) => bridge.execute("dataset_preview", args, exec.signal),
        }),
        defineTool({
            name: "dataset_import",
            description: "独立导入服务器数据集：Labelme指定image_dir、annotation_dir；目录格式先预览，再指定root_dir、一致的rules和preview_fingerprint。名称未指定时取用户根目录名。导入本身不启动知识挖掘或审计。",
            parameters: {
                format: { type: "string", enum: ["labelme", "folder_classification"], required: true },
                name: { type: "string", required: true },
                image_dir: { type: "string", description: "Labelme图像目录" },
                annotation_dir: { type: "string", description: "Labelme标注目录" },
                root_dir: { type: "string", description: "目录图像级格式根目录" },
                rules: { ...folderRulesParameter, description: "目录格式必须：预览items中的path和role" },
                preview_fingerprint: { type: "string", description: "目录格式必须：与确认规则相符的预览指纹" },
                archive_path: { type: "string", description: "明确提供ZIP时的宿主保存路径" },
                unannotated_is_normal: { type: "boolean", description: "仅Labelme的无标注初始良品约定" },
            },
            output: datasetDiscoveryOutput,
            execute: (args, exec) => bridge.execute("dataset_import", args, exec.signal),
        }),
        defineTool({
            name: "dataset_rescan",
            description: "重新扫描已接入数据集的服务器目录，更新当前图像与Labelme标注，返回实际图像/标注/问题数量；复用稳定身份，保留人工记录、旧知识与历史审计，不自动重跑模型。目录内容变化后先显式执行本工具，再读取知识来源状态和重新核验。",
            parameters: {
                dataset_id: { type: "string", required: true },
                image_dir: { type: "string", description: "新图像/根目录；Labelme同时提供annotation_dir，目录格式须重新预览确认" },
                folder_rules: { ...folderRulesParameter, description: "目录格式的新规则，先预览并提供preview_fingerprint" },
                preview_fingerprint: { type: "string", description: "修改目录规则或根目录必须提供的确认指纹" },
                annotation_dir: { type: "string", description: "与 image_dir 一起修改，原身份及历史记录保留" },
            },
            output: workbenchJsonOutput,
            execute: (args, exec) => bridge.execute("dataset_scan", args, exec.signal),
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
            execute: (args, exec) => bridge.execute("audit_start", { ...args, origin_session_id: exec.agent?.id || null }, exec.signal),
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
