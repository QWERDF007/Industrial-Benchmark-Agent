import { jobStatuses } from "./job-display.js";
export const workbenchTools = {
    image_retrieve: '查找同图', image_index_prepare: '准备检索索引', consistency_start: '开始一致性检查', consistency_status: '一致性批次状态',
    consistency_cancel: '停止一致性检查', consistency_retry: '继续一致性检查', consistency_query: '一致性结果', consistency_report: '一致性报告',
    consistency_groups: '严格同图组', consistency_group_members: '同图组成员', consistency_compare: '保存比较证据',
    consistency_context: '解释比较证据', consistency_evidence: '查看冻结事实', consistency_evidence_media: '读取冻结图片', consistency_evidence_export: '导出比较证据',
    direction_exploration_start: "探索检查方向", direction_exploration_status: "方向探索状态", direction_exploration_get: "方向探索结果",
    direction_exploration_cancel: "停止方向探索", direction_exploration_retry: "重试方向探索", knowledge_directions_adopt: "采用探索方向",
    dataset_list: "数据集列表", dataset_import: "接入数据集", dataset_rescan: "重新扫描目录", dataset_report: "数据集质量报告", knowledge_get: "知识版本",
    knowledge_scope_open: "建立知识范围", knowledge_scope_get: "知识范围进度", knowledge_scope_stop: "停止知识范围", knowledge_scope_resume: "继续知识范围",
    knowledge_details: "知识条目", knowledge_conflict_context: "知识冲突", knowledge_job_observations: "知识观察证据",
    knowledge_sources: "查询知识来源", knowledge_mine_normal: "挖掘良品知识", knowledge_mine_defect: "挖掘不良品知识",
    knowledge_job_status: "知识作业状态", knowledge_job_cancel: "停止知识作业", knowledge_job_retry: "重试知识作业",
    model_audit_start: "启动模型审计", model_audit_status: "审计作业状态", model_audit_cancel: "停止模型审计", model_audit_retry: "重试模型审计",
};
/** A compact projection of recorded results; it contains references, never workflow state. */
export function toolPresentation(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return null;
    const record = value;
    const links = [];
    let job = null;
    if (typeof record.batch_id === 'string') {
        links.push({ label: '查看一致性批次', location: { pageId: 'industrial-consistency', tab: 'jobs', batchId: record.batch_id } });
        if (typeof record.status === 'string' && record.status in jobStatuses && typeof record.completed === 'number' && typeof record.failed === 'number' && typeof record.total === 'number') {
            job = { status: record.status, completed: record.completed, failed: record.failed, total_samples: record.total };
        }
    }
    const context = record.context && typeof record.context === 'object' ? record.context : record;
    const result = context.result && typeof context.result === 'object' ? context.result : context;
    if (typeof result.evidence_id === 'string' && typeof result.result_id === 'string') {
        const returnLocation = context.return_location;
        links.push({ label: '查看比较证据', location: returnLocation?.pageId === 'industrial-consistency' && returnLocation.evidenceId === result.evidence_id
                ? returnLocation : { pageId: 'industrial-consistency', tab: 'conflicts', evidenceId: result.evidence_id, resultId: result.result_id } });
    }
    const page = record.page && typeof record.page === 'object' ? record.page : record;
    if (typeof page.query_id === 'string' && Array.isArray(page.items))
        for (const [index, item] of page.items.slice(0, 3).entries()) {
            const evidence = item?.result || item;
            if (typeof evidence?.evidence_id === 'string')
                links.push({ label: `查看比较证据 ${index + 1}`, location: { pageId: 'industrial-consistency', tab: 'conflicts', evidenceId: evidence.evidence_id, resultId: typeof evidence.result_id === 'string' ? evidence.result_id : undefined } });
        }
    if (typeof record.dataset_id === "string") {
        const datasetId = record.dataset_id;
        const knowledgeKind = record.kind === "defect" ? "defect" : "normal";
        if (typeof record.scope_run_id === "string")
            links.push({ label: "查看连续范围", location: { pageId: "industrial-knowledge", datasetId, knowledgeKind, scopeRunId: record.scope_run_id, tab: "results" } });
        if (typeof record.run_id === "string") {
            const pageId = record.job_type === "DIRECTION_EXPLORATION" ? "industrial-exploration" : record.job_type === "MODEL_AUDIT" ? "industrial-audit" : "industrial-knowledge";
            links.push({ label: "查看作业", location: { pageId, datasetId, knowledgeKind, job: record.run_id, tab: "jobs" } });
            if (typeof record.status === "string" && record.status in jobStatuses && typeof record.completed === "number" && typeof record.failed === "number" && typeof record.total_samples === "number") {
                job = { status: record.status, completed: record.completed, failed: record.failed, total_samples: record.total_samples };
            }
            if (typeof record.knowledge_version_id === "string")
                links.push({ label: "查看知识版本", location: { pageId, datasetId, knowledgeKind, version: record.knowledge_version_id, tab: "results" } });
        }
        if (record.exploration && typeof record.exploration === "object" && "version_id" in record.exploration && typeof record.exploration.version_id === "string")
            links.push({ label: "查看探索方向", location: { pageId: "industrial-exploration", datasetId, version: record.exploration.version_id, tab: "results" } });
        links.push({ label: "数据集管理", location: { pageId: "industrial-datasets", datasetId } }, { label: "图像浏览", location: { pageId: "industrial-images", datasetId } }, { label: "质量报告", location: { pageId: "industrial-audit", datasetId, tab: "reports" } });
    }
    if (Array.isArray(record.datasets))
        for (const dataset of record.datasets) {
            if (dataset && typeof dataset === "object" && typeof dataset.dataset_id === "string" && typeof dataset.name === "string")
                links.push({ label: dataset.name, location: { pageId: "industrial-datasets", datasetId: dataset.dataset_id } });
        }
    const knowledge = record.knowledge;
    if (knowledge && typeof knowledge === "object" && "dataset_id" in knowledge && "version_id" in knowledge && "kind" in knowledge && typeof knowledge.dataset_id === "string" && typeof knowledge.version_id === "string" && (knowledge.kind === "normal" || knowledge.kind === "defect")) {
        links.push({ label: "查看知识版本", location: { pageId: "industrial-knowledge", knowledgeKind: knowledge.kind, datasetId: knowledge.dataset_id, version: knowledge.version_id, tab: "results" } });
    }
    return links.length ? { type: "industrial-workbench", links, job } : null;
}
