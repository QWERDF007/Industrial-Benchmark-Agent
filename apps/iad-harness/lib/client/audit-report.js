const sections = [
    ['conclusion', '总体结论'], ['distribution', '数据分布'], ['consistency', '数据是否自洽'],
    ['quality', '标注质量与复核重点'], ['coverage', '覆盖了哪些视觉场景'],
    ['independence', '样本独立性与代表性'], ['capabilities', '能够检验模型哪些能力'],
    ['usability', '当前适合哪些用途、还缺什么'], ['knowledge', '引用知识及审计结果'],
];
export const auditReportSections = Object.fromEntries(sections.map(([key, title], index) => [key, {
        title: `${['一', '二', '三', '四', '五', '六', '七', '八', '九'][index]}、${title}`, prefix: `${index + 1}.`,
    }]));
export const auditMetadataLabels = { physical_sample_id: '物理件', capture_sequence_id: '采集序列',
    batch_id: '批次', station: '站点', camera: '相机', data_origin: '来源' };
const originLabels = { LEGACY_TRAIN: '原训练集', LEGACY_TEST: '原测试集', AUGMENTED: '增强数据',
    MISSED_CASE: '漏检案例', PRODUCTION: '生产采集' };
export function auditMetadataValue(key, value) {
    if (!value || value === 'UNKNOWN')
        return '未登记';
    return key === 'data_origin' ? originLabels[value] || value : value;
}
