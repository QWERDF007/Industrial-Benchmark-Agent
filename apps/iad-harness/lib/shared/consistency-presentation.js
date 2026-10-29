export const imageRelations = {
    EXACT: '像素完全相同', NEAR_CANDIDATE: '近重复候选', VISUAL_REFERENCE: '视觉参考', DIFFERENT: '不同图像', UNCHECKED: '尚未核验',
};
export const differenceLabels = {
    QUALITY_LABEL: '质量标签不同', CATEGORY: '类别不同', GEOMETRY: '几何不同',
    ONE_SIDED_REGION: '单侧标注', SPLIT_MERGE: '实例拆分或合并', AMBIGUOUS_MATCH: '匹配有歧义',
    POLICY_UNCONFIRMED: '标注规范未确认', ANNOTATION_UNREADABLE: '标注不可读取',
};
export function annotationState(types, confirmed) {
    if (confirmed)
        return '已确认标注冲突';
    if (types.some(type => type !== 'POLICY_UNCONFIRMED' && type !== 'ANNOTATION_UNREADABLE'))
        return '标注差异待核对';
    if (types.includes('ANNOTATION_UNREADABLE'))
        return '标注读取待核对';
    return types.includes('POLICY_UNCONFIRMED') ? '规范待确认' : '未发现标注差异';
}
export function annotationSummary(annotation) {
    const count = annotation.differences.filter(row => row.type !== 'POLICY_UNCONFIRMED' && row.type !== 'ANNOTATION_UNREADABLE').length;
    return [count ? `${count} 项标注差异` : annotation.status === 'COMPLETE' ? '未发现标注差异' : '标注比较不完整',
        annotation.differences.some(row => row.type === 'POLICY_UNCONFIRMED') ? '规范待确认' : '',
        annotation.confirmed_conflict ? '已确认冲突' : ''].filter(Boolean).join(' · ');
}
