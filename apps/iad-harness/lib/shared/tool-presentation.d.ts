import type { JobSnapshot } from "./contracts.js";
import type { WorkbenchLocation } from "./navigation.js";
export declare const workbenchTools: {
    readonly dataset_list: "数据集列表";
    readonly dataset_import: "接入数据集";
    readonly dataset_rescan: "重新扫描目录";
    readonly dataset_report: "数据集质量报告";
    readonly knowledge_get: "知识版本";
    readonly knowledge_scope_open: "建立知识范围";
    readonly knowledge_scope_get: "知识范围进度";
    readonly knowledge_scope_stop: "停止知识范围";
    readonly knowledge_scope_resume: "继续知识范围";
    readonly knowledge_details: "知识条目";
    readonly knowledge_conflict_context: "知识冲突";
    readonly knowledge_job_observations: "知识观察证据";
    readonly knowledge_sources: "查询知识来源";
    readonly knowledge_mine_normal: "挖掘良品知识";
    readonly knowledge_mine_defect: "挖掘不良品知识";
    readonly knowledge_job_status: "知识作业状态";
    readonly knowledge_job_cancel: "停止知识作业";
    readonly knowledge_job_retry: "重试知识作业";
    readonly model_audit_start: "启动模型审计";
    readonly model_audit_status: "审计作业状态";
    readonly model_audit_cancel: "停止模型审计";
    readonly model_audit_retry: "重试模型审计";
};
export type ToolPresentation = {
    type: "industrial-workbench";
    links: Array<{
        label: string;
        location: WorkbenchLocation;
    }>;
    job: Pick<JobSnapshot, "status" | "completed" | "failed" | "total_samples"> | null;
};
/** A compact projection of recorded results; it contains references, never workflow state. */
export declare function toolPresentation(value: unknown): ToolPresentation | null;
//# sourceMappingURL=tool-presentation.d.ts.map