import type { JobSnapshot } from "./contracts.js";
import type { WorkbenchLocation } from "./navigation.js";
export declare const workbenchTools: {
    readonly image_retrieve: '查找同图';
    readonly image_index_prepare: '准备检索索引';
    readonly consistency_start: '开始一致性检查';
    readonly consistency_status: '一致性批次状态';
    readonly consistency_cancel: '停止一致性检查';
    readonly consistency_retry: '继续一致性检查';
    readonly consistency_query: '一致性结果';
    readonly consistency_report: '一致性报告';
    readonly consistency_groups: '严格同图组';
    readonly consistency_group_members: '同图组成员';
    readonly consistency_compare: '保存比较证据';
    readonly consistency_context: '解释比较证据';
    readonly consistency_evidence: '查看冻结事实';
    readonly consistency_evidence_media: '读取冻结图片';
    readonly consistency_evidence_export: '导出比较证据';
    readonly direction_exploration_start: "探索检查方向";
    readonly direction_exploration_status: "方向探索状态";
    readonly direction_exploration_get: "方向探索结果";
    readonly direction_exploration_cancel: "停止方向探索";
    readonly direction_exploration_retry: "重试方向探索";
    readonly knowledge_directions_adopt: "采用探索方向";
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