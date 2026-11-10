import hashlib
import json

from iad_core.consistency.annotation_issues import ImageLabelIssue, BboxAnnotationIssue, MainAnnotationIssue, MainIssueEvidence
from iad_core.consistency.group_analysis_models import GroupPairAssessment
from iad_core.consistency.annotation_models import AnnotationMatchingConfig
from iad_core.consistency.geometry import bbox_iou


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
    def validate(assessment, sources, media_ids, *, observations=(), matching=None, gate=None):
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
            if issue.type == 'position_difference' and (issue.coverage_effect != 'material_change' or not issue.coverage_reason):
                raise ValueError('位置差异必须说明实际缺陷覆盖的实质变化；无害边界抖动视为一致')
            if len(set(issue.media_ids)) != 2 or set(issue.media_ids) != set(media_ids):
                raise ValueError('问题只能引用当前候选实际观察的两侧原图')
            if not set(issue.main_annotation_ids) <= annotations[0].keys() or not set(issue.candidate_annotation_ids) <= annotations[1].keys():
                raise ValueError('问题引用了不存在或属于另一侧的标注ID')
            if gate is not None and gate.source == 'vision':
                checked = {check.region_pair_id for check in gate.region_checks if check.visual_relation == 'same'}
                if not set(issue.region_pair_ids) <= checked:
                    raise ValueError('问题引用了未经核实的关注区域')
                if issue.type in ('extra_annotation','missing_annotation'):
                    side = 'main' if issue.type == 'extra_annotation' else 'candidate'
                    ids = issue.main_annotation_ids if side == 'main' else issue.candidate_annotation_ids
                    covered = {origin.annotation_id for pair in gate.region_pairs
                        if pair.region_pair_id in issue.region_pair_ids for origin in pair.source_annotations if origin.side == side}
                    if not set(ids) <= covered:
                        raise ValueError('单侧框问题必须关联该标注来源的已核实双向区域')
            for reference in issue.same_main_object_as:
                if reference.candidate_id == assessment.candidate_id:
                    raise ValueError('同对象引用必须指向其他候选')
                confirmed = False
                minimum_iou = (matching or AnnotationMatchingConfig()).minimum_iou
                for observed in observations:
                    candidates = observed.request.facts['candidates']
                    if not {assessment.candidate_id, reference.candidate_id} <= candidates.keys():
                        continue
                    regions = []
                    unique = True
                    for identity, annotation_id in ((assessment.candidate_id, issue.candidate_annotation_ids[0]),
                            (reference.candidate_id, reference.annotation_ids[0])):
                        mapped = candidates[identity]['mapped_annotations']
                        if annotation_id not in mapped:
                            unique = False
                            break
                        points = mapped[annotation_id]
                        region = [min(point[0] for point in points), min(point[1] for point in points),
                            max(point[0] for point in points), max(point[1] for point in points)]
                        regions.append(region)
                        for other_id, polygon in mapped.items():
                            other = [min(point[0] for point in polygon), min(point[1] for point in polygon),
                                max(point[0] for point in polygon), max(point[1] for point in polygon)]
                            if other_id != annotation_id and bbox_iou(region, other) >= minimum_iou:
                                unique = False
                    if unique and bbox_iou(*regions) >= minimum_iou:
                        confirmed = True
                        break
                if not confirmed:
                    raise ValueError('同对象归并需要实际共同观察、真实主图映射区域与唯一框对应')
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
        positions = [item for item in assessment.issues if item.type == 'position_difference']
        for index,issue in enumerate(positions):
            if any(set(issue.main_annotation_ids)&set(other.main_annotation_ids)
                    or set(issue.candidate_annotation_ids)&set(other.candidate_annotation_ids) for other in positions[:index]):
                raise ValueError('同一对象的边界、中心和尺寸偏差只能记录一个位置问题')

    @staticmethod
    def aggregate(records):
        objects = {(record.submission.assessment.candidate_id, tuple(issue.candidate_annotation_ids)): issue
            for record in records for issue in record.submission.assessment.issues
            if issue.type == 'missing_annotation'}
        correspondence = {identity: {identity} for identity in objects}
        for identity, issue in objects.items():
            for reference in issue.same_main_object_as:
                other = (reference.candidate_id, tuple(reference.annotation_ids))
                if other in objects:
                    merged = correspondence[identity] | correspondence[other]
                    for member in merged:
                        correspondence[member] = merged
        issues = {}
        for record in records:
            assessment = record.submission.assessment
            for issue in assessment.issues:
                main_ids = issue.main_annotation_ids if isinstance(issue, BboxAnnotationIssue) else []
                candidate_ids = issue.candidate_annotation_ids if isinstance(issue, BboxAnnotationIssue) else []
                identity = [issue.type, sorted(main_ids)]
                if not main_ids and issue.type != 'image_label_mismatch':
                    own = (assessment.candidate_id, tuple(candidate_ids))
                    identity.extend(min(correspondence.get(own, {own})))
                issue_id = 'issue_' + hashlib.sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest()
                support = MainIssueEvidence(assessment_id=record.assessment_id, candidate_id=assessment.candidate_id,
                    candidate_annotation_ids=candidate_ids, media_ids=issue.media_ids,
                    same_main_object_as=issue.same_main_object_as if isinstance(issue, BboxAnnotationIssue) else [],
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
