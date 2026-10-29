import type {AnnotationComparison,AnnotationDifference} from './domain.generated.js';
import type {RetrievalMember} from './contracts.js';

export const imageRelations:Record<RetrievalMember['relation'],string>={
  EXACT:'像素完全相同', NEAR_CANDIDATE:'近重复候选', VISUAL_REFERENCE:'视觉参考', DIFFERENT:'不同图像', UNCHECKED:'尚未核验',
};

export const differenceLabels:Record<AnnotationDifference['type'],string>={
  QUALITY_LABEL:'质量标签不同', CATEGORY:'类别不同', GEOMETRY:'几何不同',
  ONE_SIDED_REGION:'单侧标注', SPLIT_MERGE:'实例拆分或合并', AMBIGUOUS_MATCH:'匹配有歧义',
  POLICY_UNCONFIRMED:'标注规范未确认', ANNOTATION_UNREADABLE:'标注不可读取',
};

export function annotationSummary(annotation:AnnotationComparison):string {
  const count=annotation.differences.filter(row=>row.type!=='POLICY_UNCONFIRMED'&&row.type!=='ANNOTATION_UNREADABLE').length;
  return [count ? `${count} 项标注差异` : annotation.status==='COMPLETE' ? '未发现标注差异' : '标注比较不完整',
    annotation.differences.some(row=>row.type==='POLICY_UNCONFIRMED') ? '规范待确认' : '',
    annotation.confirmed_conflict ? '已确认冲突' : ''].filter(Boolean).join(' · ');
}
