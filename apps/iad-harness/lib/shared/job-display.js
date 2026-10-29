export const jobStatuses = {
    PENDING: "等待执行", RUNNING: "执行中", COMPLETED: "已完成", PARTIAL: "部分成功",
    FAILED: "失败", CANCELLED: "已取消", INTERRUPTED: "已中断",
};
export const jobPhases = {
    WAITING_RESOURCE: '等待执行资源', ENCODING: '准备图像特征', INDEXING: '发布共享索引', COMPARING: '比较图像与标注',
    PREPARING_EXPLORATION: "准备图像", CHECKING_CAPACITY: "容量检查", EXPLORING_DIRECTIONS: "模型联合分析", PUBLISHING_DIRECTIONS: "校验并发布方向", DIRECTIONS_PUBLISHED: "方向已保存",
    PREPARING_KNOWLEDGE: "准备冻结知识", GLOBAL: "全图观察", REGIONS: "ROI 细看",
    SYNTHESIS: "全图与 ROI 联合分析", SAMPLE_COMPLETED: "图像审计完成",
    LEARNING_NORMAL: "归纳良品知识", LEARNING_DEFECT: "归纳不良品知识",
    LINKING_KNOWLEDGE_DISCOVERY: "关联观察与知识",
    VERIFYING_NORMAL: "核验良品疑点", VERIFYING_DEFECT: "核验标注与异常知识",
    OBSERVING_PRESET: "观察冻结判据", RECHECKING_HUMAN_KNOWLEDGE: "核验人工知识处置",
    COMPARING_KNOWLEDGE: "比较新旧证据", RECHECKING_CRITERIA: "重核验修订判据",
    KNOWLEDGE_PUBLISHED: "知识已发布", KNOWLEDGE_REUSED: "复用已核验知识",
};
