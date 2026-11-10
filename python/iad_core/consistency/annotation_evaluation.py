import hashlib
import json

from iad_core.consistency.annotation_issues import ImageLabelIssue, BboxAnnotationIssue, MainAnnotationIssue, MainIssueEvidence
from iad_core.consistency.group_analysis_models import GroupPairAssessment


class AnnotationEvaluation:
    @staticmethod
    def labels(sources, candidate_id, media_ids):
        main, candidate = (source.sample.quality_status for source in sources)
        if main not in ('PASS', 'FAIL') or candidate not in ('PASS', 'FAIL'):
            raise ValueError('导入阶段的正常／异常分类无效，不能补造图像级标签')
        labels = {'PASS': 'OK', 'FAIL': 'NG'}
        different = main != candidate
        description = f'同内容图像的登记标签：主图{labels[main]}，候选{labels[candidate]}。'
        return GroupPairAssessment(candidate_id=candidate_id, verdict='MATERIAL' if different else 'EQUIVALENT',
            conclusion='类别不一致' if different else '一致', categories=['类别不一致'] if different else [],
            explanation=description, findings=[description] if different else [], issues=[ImageLabelIssue(
                main_label=labels[main], candidate_label=labels[candidate], description=description, media_ids=media_ids,
                review_suggestion='人工核对导入时确认的正常／异常目录分类。')] if different else [])

    @staticmethod
    def validate(assessment, sources, media_ids):
        main, candidate = sources
        if main.annotations.dataset_format == 'folder_classification':
            expected = AnnotationEvaluation.labels(sources, assessment.candidate_id, media_ids)
            if assessment != expected:
                raise ValueError('图像级标签审核必须使用程序依据导入分类生成的完整结果')
            return
        if assessment.verdict == 'MATERIAL' and not assessment.issues:
            raise ValueError('存在差异必须结构化保存全部独立问题及真实框ID')
        if assessment.verdict != 'MATERIAL' and assessment.issues:
            raise ValueError('一致或证据不足不能包含已确认差异')
        annotations = [{item.annotation_id: item for item in source.annotations.annotations} for source in sources]
        identities = [(issue.type, tuple(sorted(issue.main_annotation_ids)), tuple(sorted(issue.candidate_annotation_ids)))
            for issue in assessment.issues]
        if len(identities) != len(set(identities)):
            raise ValueError('同一对象的同类问题不得重复提交')
        for issue in assessment.issues:
            if issue.type == 'image_label_mismatch':
                raise ValueError('矩形标注审核不能包含图像级标签问题')
            if len(set(issue.media_ids)) != 2 or set(issue.media_ids) != set(media_ids):
                raise ValueError('问题只能引用当前候选实际观察的两侧原图')
            if not set(issue.main_annotation_ids) <= annotations[0].keys() or not set(issue.candidate_annotation_ids) <= annotations[1].keys():
                raise ValueError('问题引用了不存在或属于另一侧的标注ID')
            if len(issue.main_annotation_ids) == len(issue.candidate_annotation_ids) == 1:
                pair = [side[identity] for side, identity in zip(annotations,
                    (issue.main_annotation_ids[0], issue.candidate_annotation_ids[0]))]
                if issue.type == 'category_mismatch':
                    categories = [source.annotations.policy.category_mapping.get(annotation.raw_label, annotation.raw_label)
                        for source, annotation in zip(sources, pair)]
                    if categories[0] == categories[1]:
                        raise ValueError('按已登记类别映射相同的类别不能报告类别不一致')
                if (issue.type == 'position_difference' and main.descriptor.pixel_key is not None
                        and main.descriptor.pixel_key == candidate.descriptor.pixel_key and pair[0].bbox == pair[1].bbox):
                    raise ValueError('像素相同且原始框完全相同，不能报告位置差异')
        for structural in (item for item in assessment.issues if item.type in ('split', 'merge')):
            for count in (item for item in assessment.issues if item.type in ('extra_annotation', 'missing_annotation')):
                if (set(structural.main_annotation_ids) & set(count.main_annotation_ids)
                        or set(structural.candidate_annotation_ids) & set(count.candidate_annotation_ids)):
                    raise ValueError('同组对象的拆分／合并不能重复计为多标／少标')

    @staticmethod
    def aggregate(records):
        issues = {}
        for record in records:
            assessment = record.submission.assessment
            for issue in assessment.issues:
                main_ids = issue.main_annotation_ids if isinstance(issue, BboxAnnotationIssue) else []
                candidate_ids = issue.candidate_annotation_ids if isinstance(issue, BboxAnnotationIssue) else []
                identity = [issue.type, sorted(main_ids)]
                if not main_ids and issue.type != 'image_label_mismatch':
                    # Without a main annotation, no cross-candidate object identity is implied.
                    identity.extend([assessment.candidate_id, sorted(candidate_ids)])
                issue_id = 'issue_' + hashlib.sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest()
                support = MainIssueEvidence(assessment_id=record.assessment_id, candidate_id=assessment.candidate_id,
                    candidate_annotation_ids=candidate_ids, media_ids=issue.media_ids,
                    candidate_label=issue.candidate_label if isinstance(issue, ImageLabelIssue) else None)
                if issue_id in issues:
                    existing = issues[issue_id]
                    existing.supporting_assessment_ids.append(record.assessment_id)
                    existing.evidence.append(support)
                    existing.limitations = list(dict.fromkeys([*existing.limitations, *issue.limitations]))
                else:
                    issues[issue_id] = MainAnnotationIssue(issue_id=issue_id, type=issue.type,
                        main_annotation_ids=main_ids, description=issue.description,
                        supporting_assessment_ids=[record.assessment_id], evidence=[support], limitations=issue.limitations,
                        review_suggestion=issue.review_suggestion,
                        main_label=issue.main_label if isinstance(issue, ImageLabelIssue) else None)
        return list(issues.values())
