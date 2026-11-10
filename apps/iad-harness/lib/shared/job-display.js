const jobTimeFormat = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
export function formatJobTime(value) {
    return jobTimeFormat.format(new Date(value));
}
export const jobStatuses = {
    PENDING: "等待执行", RUNNING: "执行中", COMPLETED: "已完成", PARTIAL: "部分成功",
    FAILED: "失败", CANCELLED: "已取消", INTERRUPTED: "已中断",
};
export const jobPhases = {
    WAITING_RESOURCE: '等待执行资源', ENCODING: '准备图像特征', INDEXING: '发布共享索引', COMPARING: '比较图像与标注',
    PREPARING_EXPLORATION: "准备图像", CHECKING_CAPACITY: "容量检查", EXPLORING_DIRECTIONS: "模型联合分析", PUBLISHING_DIRECTIONS: "校验并发布方向", DIRECTIONS_PUBLISHED: "方向已保存",
    PREPARING_KNOWLEDGE: "准备冻结知识", GLOBAL: "全图观察", REGIONS: "ROI 细看",
    SYNTHESIS: "全图与 ROI 联合分析", SAMPLE_COMPLETED: "图像审计完成",
    AUDITING_IMAGES: "正在审计图像",
    ANALYZING_SELECTED_DATASETS: "分析所选子集",
    ANALYZING_SCOPE: '逐登记观察', FINALIZING_SCOPE: '全局定稿', ANALYSIS_PUBLISHED: '成果已发布',
    COMPARING_SELECTED_DATASETS: "检查所选范围",
    ANALYZING_CONFLICT_GROUPS: "分析冲突图组",
    LEARNING_KNOWLEDGE: "归纳知识", VERIFYING_KNOWLEDGE: "核验疑点", LEARNING_NORMAL: "归纳良品知识", LEARNING_DEFECT: "归纳不良品知识",
    LINKING_KNOWLEDGE_DISCOVERY: "关联观察与知识",
    VERIFYING_NORMAL: "核验良品疑点", VERIFYING_DEFECT: "核验标注与异常知识",
    OBSERVING_PRESET: "观察冻结判据", RECHECKING_HUMAN_KNOWLEDGE: "核验人工知识处置",
    COMPARING_KNOWLEDGE: "比较新旧证据", RECHECKING_CRITERIA: "重核验修订判据",
    KNOWLEDGE_PUBLISHED: "知识已发布", KNOWLEDGE_REUSED: "复用已核验知识",
    MINING_BATCHES: "逐批联合挖掘",
    EXPLORING_BATCHES: "逐批迭代探索",
    ANALYZING_GROUP_BATCHES: "逐批比较图组",
    SUMMARIZING_GROUP_BATCHES: "汇总图组分析",
    ANALYZING_CONSISTENCY_BATCHES: "逐批核验标注一致性",
    CONSISTENCY_MODEL_BATCHES_FINISHED: "一致性批次处理已结束",
    CREATING_ANCHOR_SESSIONS: '创建主图审核会话', RETRIEVING_ANCHOR: '检索主图候选',
    PLANNING_VISUAL_PAGES: '检查视觉页预算', AWAITING_REVIEW: '等待主图审核',
    PREPARING_SHARED_INDEX: '准备共享图像索引', SHARED_INDEX_READY: '共享索引就绪',
    OBSERVING_ANCHOR: '视觉核对', AWAITING_SUBMISSION: '校验主图结论', AGENT_REVIEWING: '主图审核',
};
const workflows = {
    exploration: { title: '方向探索', stages: [
            { title: '准备图像', phases: ['PREPARING_EXPLORATION'] },
            { title: '容量检查', phases: ['CHECKING_CAPACITY'] },
            { title: '模型联合分析', phases: ['ANALYZING_SCOPE', 'ANALYZING_SELECTED_DATASETS', 'EXPLORING_BATCHES', 'EXPLORING_DIRECTIONS'] },
            { title: '校验并发布方向', phases: ['FINALIZING_SCOPE', 'ANALYSIS_PUBLISHED', 'PUBLISHING_DIRECTIONS', 'DIRECTIONS_PUBLISHED'] }
        ] },
    knowledge: { title: '知识挖掘', stages: [
            { title: '准备数据范围', phases: ['PREPARING_KNOWLEDGE'] },
            { title: '读取与整理图像', phases: ['GLOBAL', 'REGIONS'] },
            { title: '模型挖掘知识', phases: ['ANALYZING_SCOPE', 'ANALYZING_SELECTED_DATASETS', 'MINING_BATCHES', 'LEARNING_KNOWLEDGE', 'LEARNING_NORMAL', 'LEARNING_DEFECT', 'COMPARING_KNOWLEDGE'] },
            { title: '校验与整理证据', phases: ['FINALIZING_SCOPE', 'VERIFYING_KNOWLEDGE', 'VERIFYING_NORMAL', 'VERIFYING_DEFECT', 'LINKING_KNOWLEDGE_DISCOVERY', 'RECHECKING_CRITERIA'] },
            { title: '发布知识版本', phases: ['ANALYSIS_PUBLISHED', 'KNOWLEDGE_PUBLISHED', 'KNOWLEDGE_REUSED'] }
        ] },
    consistency: { title: '数据一致性', stages: [
            { title: '准备输入及索引', phases: ['ENCODING', 'INDEXING', 'CREATING_ANCHOR_SESSIONS', 'PREPARING_SHARED_INDEX', 'SHARED_INDEX_READY'] },
            { title: '检索候选图像', phases: ['ANALYZING_SELECTED_DATASETS', 'COMPARING_SELECTED_DATASETS', 'RETRIEVING_ANCHOR'] },
            { title: '冲突比对与分析', phases: ['COMPARING', 'ANALYZING_CONFLICT_GROUPS', 'ANALYZING_GROUP_BATCHES', 'SUMMARIZING_GROUP_BATCHES', 'ANALYZING_CONSISTENCY_BATCHES', 'PLANNING_VISUAL_PAGES', 'AWAITING_REVIEW', 'OBSERVING_ANCHOR', 'AGENT_REVIEWING'] },
            { title: '发布检查结果', phases: ['CONSISTENCY_FINISHED', 'CONSISTENCY_MODEL_BATCHES_FINISHED', 'AWAITING_SUBMISSION'] }
        ] },
    audit: { title: '模型审计', stages: [
            { title: '准备样本和知识', phases: ['PREPARING_KNOWLEDGE'] },
            { title: '检查数据一致性', phases: ['COMPARING'] },
            { title: '执行逐图模型审计', phases: ['AUDITING_IMAGES', 'GLOBAL', 'REGIONS', 'SYNTHESIS'] },
            { title: '保存审计与证据', phases: ['SAMPLE_COMPLETED'] }
        ] },
};
export function jobWorkflow(job, now = Date.now()) {
    const kind = job.analysis_kind || (['MODEL_AUDIT', 'MODEL_AUDIT_SAMPLE'].includes(job.job_type) ? 'audit'
        : ['DIRECTION_EXPLORATION', 'EXPLORATION_BATCH'].includes(job.job_type) ? 'exploration' : 'knowledge');
    const workflow = workflows[kind];
    const timings = job.phase_timings || [];
    const stages = workflow.stages.map(stage => {
        const durations = timings.flatMap((timing, index) => {
            if (!stage.phases.includes(timing.phase))
                return [];
            const end = timing.finished_at ? Date.parse(timing.finished_at) : job.status === 'RUNNING' && index === timings.length - 1 ? now : null;
            return end === null ? [] : [Math.max(0, (end - Date.parse(timing.started_at)) / 1000)];
        });
        if (!timings.length && stage.phases.includes(job.phase || '') && job.phase_started_at) {
            const end = job.finished_at ? Date.parse(job.finished_at) : job.status === 'RUNNING' ? now : null;
            if (end !== null)
                durations.push(Math.max(0, (end - Date.parse(job.phase_started_at)) / 1000));
        }
        return { ...stage, elapsedSeconds: durations.length ? durations.reduce((sum, value) => sum + value, 0) : null };
    });
    return { ...workflow, stages, index: stages.findIndex(stage => stage.phases.includes(job.phase || '')) };
}
