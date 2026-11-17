from types import SimpleNamespace

import pytest

from iad_core.consistency.annotations import AnnotationSet
from iad_core.consistency.annotation_evaluation import AnnotationEvaluation
from iad_core.consistency.group_analysis_models import GroupPairAssessment
from iad_core.consistency.errors import ConsistencyError
from iad_core.storage.models import Annotation


def source(annotation):
    return AnnotationSet(sample_id=annotation.sample_id,dataset_id='dataset',dataset_format='labelme',
        width=100,height=80,quality_status='UNCERTAIN',quality_source=None,annotations=[annotation])


@pytest.mark.parametrize('points', [None,[[1,1],[20,20]],[[1,1],[20,float('nan')],[20,1]]])
def test_malformed_polygon_is_rejected_before_visual_review(points):
    annotation=Annotation(annotation_id='a',sample_id='main',annotation_type='polygon',raw_label='dent',
        bbox=[1,1,20,20],polygon=points,geometry_status='VALID')
    with pytest.raises(ConsistencyError,match='标注无法审核'):
        source(annotation).require_task('bbox_defect')


def test_equal_polygon_bounds_do_not_hide_different_contours():
    main=Annotation(annotation_id='main:a',sample_id='main',annotation_type='polygon',raw_label='dent',
        bbox=[10,10,30,30],polygon=[[10,10],[30,10],[10,30]],geometry_status='VALID')
    candidate=main.model_copy(update={'annotation_id':'candidate:a','sample_id':'candidate',
        'polygon':[[10,10],[30,30],[10,30]]})
    assessment=GroupPairAssessment(candidate_id='candidate',verdict='MATERIAL',conclusion='位置差异',
        categories=['位置差异'],explanation='两侧轮廓覆盖的对象区域不同。',findings=['轮廓覆盖不同'],issues=[{
            'type':'missing_content','main_annotation_ids':[main.annotation_id],
            'candidate_annotation_ids':[candidate.annotation_id],'media_ids':['main_image','candidate_image'],
            'description':'一侧遗漏对象右上部分。','review_suggestion':'核对真实轮廓。',
            'coverage_effect':'material_change','coverage_reason':'一侧轮廓没有覆盖对象右上部分。'}])
    sources=[SimpleNamespace(annotations=source(annotation),descriptor=SimpleNamespace(pixel_key='same'))
        for annotation in (main,candidate)]
    AnnotationEvaluation.validate(assessment,sources,['main_image','candidate_image'])
    candidate.polygon=main.polygon
    sources[1].annotations=source(candidate)
    with pytest.raises(ValueError,match='原始标注几何完全相同'):
        AnnotationEvaluation.validate(assessment,sources,['main_image','candidate_image'])


def test_minor_contour_change_cannot_be_submitted_as_missing_content():
    main = Annotation(annotation_id='main:a', sample_id='main', annotation_type='polygon', raw_label='dent',
        bbox=[10, 10, 70, 60], polygon=[[10, 10], [70, 10], [70, 60], [10, 60]])
    candidate = main.model_copy(update={'annotation_id': 'candidate:a', 'sample_id': 'candidate',
        'bbox': [10, 10, 72, 60], 'polygon': [[10, 10], [72, 10], [72, 60], [10, 60]]})
    sources = [SimpleNamespace(annotations=source(item), descriptor=SimpleNamespace(pixel_key='same'))
        for item in (main, candidate)]
    issue = {'type': 'missing_content', 'main_annotation_ids': ['main:a'],
        'candidate_annotation_ids': ['candidate:a'], 'media_ids': ['main_image', 'candidate_image'],
        'description': '右侧边界略有差别。', 'coverage_effect': 'material_change', 'coverage_reason': '边界略宽。'}
    assessment = GroupPairAssessment(candidate_id='candidate', verdict='MATERIAL', explanation='边界不同。',
        issues=[issue])
    with pytest.raises(ValueError, match='位置差异'):
        AnnotationEvaluation.validate(assessment, sources, ['main_image', 'candidate_image'])
    assessment = GroupPairAssessment(candidate_id='candidate', verdict='MATERIAL', explanation='覆盖基本相同。',
        issues=[{**issue, 'type': 'position_difference', 'coverage_effect': 'unchanged'}])
    AnnotationEvaluation.validate(assessment, sources, ['main_image', 'candidate_image'])
