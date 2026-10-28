import json
from pathlib import Path

import pytest
from PIL import Image, ImageDraw

from iad_core.consistency.annotations import AnnotationMatcher, AnnotationSet
from iad_core.consistency.policy import AnnotationPolicy
from iad_core.storage.models import Annotation, GeometryStatus


def box(sample, identity, label, coordinates):
    return Annotation(annotation_id=identity, sample_id=sample, annotation_type='bbox',
        raw_label=label, bbox=coordinates)


def side(identity, annotations, **policy):
    return AnnotationSet(sample_id=identity, dataset_id=identity, width=160, height=80,
        quality_status='PASS', quality_source='folder:OK', annotations=annotations,
        policy=AnnotationPolicy(policy_id='same', annotation_role='REFERENCE',
            annotation_coverage='EXHAUSTIVE', **policy))


def test_seven_vs_four_instances_locate_b_e_f_with_same_coordinate_reference():
    left = side('left', [box('left', label, label, [i*20,10,i*20+10,30]) for i,label in enumerate('ABCDEFG')])
    right = side('right', [box('right', label+'-copy',label,[i*20,10,i*20+10,30]) for i,label in enumerate('ABCDEFG') if label in 'ACDG'])
    result = AnnotationMatcher().compare(left, right, relation='EXACT')
    assert len(result.matches) == 4
    differences = [d for d in result.differences if d.type == 'ONE_SIDED_REGION']
    assert [d.left[0].raw_label for d in differences] == ['B','E','F']
    assert [d.region for d in differences] == [[20,10,30,30],[80,10,90,30],[100,10,110,30]]
    assert all(d.reference_from_other == 'right' and d.suspected_missing == 'right' for d in differences)
    assert result.confirmed_conflict
    assert AnnotationMatcher().compare(left, right, relation='EXACT') == result


def test_duplicate_categories_are_instances_and_same_geometry_wrong_class_is_one_difference():
    left = side('left', [box('left','a','dent',[0,0,10,10]),box('left','b','dent',[30,0,40,10])])
    right = side('right', [box('right','c','scratch',[0,0,10,10])])
    result = AnnotationMatcher().compare(left,right,relation='EXACT')
    assert [(m.left_id,m.right_id) for m in result.matches] == [('a','c')]
    assert sorted(d.type for d in result.differences) == ['CATEGORY','ONE_SIDED_REGION']
    assert next(d for d in result.differences if d.type=='CATEGORY').left[0].annotation_id == 'a'


@pytest.mark.parametrize('policy_id,role,relation', [(None,'REFERENCE','EXACT'),('different','REFERENCE','EXACT'),
    ('same','PREDICTION','EXACT'),('same','REFERENCE','VISUAL_REFERENCE')])
def test_unknown_policy_predictions_and_non_exact_images_do_not_confirm_conflicts(policy_id,role,relation):
    left = side('left',[])
    right = side('right',[])
    right.quality_status = 'FAIL'
    right.policy = AnnotationPolicy(policy_id=policy_id,annotation_role=role)
    result = AnnotationMatcher().compare(left,right,relation=relation)
    assert not result.confirmed_conflict
    assert any(d.type=='QUALITY_LABEL' for d in result.differences)
    if policy_id is None:
        assert result.policy_relation=='UNKNOWN'
    elif policy_id=='different':
        assert result.policy_relation=='DIFFERENT'


def test_only_explicit_category_mapping_aligns_names():
    left=side('left',[box('left','a','dent',[0,0,10,10])])
    right=side('right',[box('right','b','凹陷',[0,0,10,10])],category_mapping={'凹陷':'dent'})
    assert AnnotationMatcher().compare(left,right,relation='EXACT').differences==[]
    right.policy.category_mapping={}
    assert [d.type for d in AnnotationMatcher().compare(left,right,relation='EXACT').differences]==['CATEGORY']


def test_opposing_quality_labels_are_conflicting_under_one_confirmed_reference_policy():
    left,right=side('left',[]),side('right',[])
    right.quality_status='FAIL'
    result=AnnotationMatcher().compare(left,right,relation='EXACT')
    assert result.policy_relation=='SAME' and result.confirmed_conflict
    assert [d.type for d in result.differences]==['QUALITY_LABEL']
    assert result.differences[0].facts=={'left_quality':'PASS','right_quality':'FAIL',
        'left_source':'folder:OK','right_source':'folder:OK'}


def test_unmatched_nodes_do_not_force_distant_pairs_and_subpixel_geometry_is_retained():
    left=side('left',[box('left','a','dent',[.25,.5,10.25,10.5])])
    right=side('right',[box('right','b','dent',[100.25,.5,110.25,10.5])])
    result=AnnotationMatcher().compare(left,right,relation='EXACT')
    assert result.matches==[]
    assert len([d for d in result.differences if d.type=='ONE_SIDED_REGION'])==2
    assert result.differences[0].left[0].bbox==[.25,.5,10.25,10.5]


def test_merged_box_and_overlapping_duplicate_instances_are_not_simple_missing_labels():
    left=side('left',[box('left','a','dent',[0,0,10,10]),box('left','b','dent',[10,0,20,10])])
    right=side('right',[box('right','merged','dent',[0,0,20,10])])
    result=AnnotationMatcher().compare(left,right,relation='EXACT')
    split=[d for d in result.differences if d.type=='SPLIT_MERGE']
    assert len(split)==1 and len(split[0].left)==2 and len(split[0].right)==1
    assert not any(d.type=='ONE_SIDED_REGION' for d in result.differences)
    left.annotations[1].bbox=[0,0,10,10]
    right.annotations[0].bbox=[0,0,10,10]
    ambiguous=AnnotationMatcher().compare(left,right,relation='EXACT')
    assert any(d.type=='AMBIGUOUS_MATCH' for d in ambiguous.differences)
    assert not any(d.type=='ONE_SIDED_REGION' for d in ambiguous.differences)


def test_real_mask_coverage_differs_from_its_bbox_and_polygon_matches_mask(tmp_path):
    from iad_core.evidence.masks import MaskImages
    masks=MaskImages(str(tmp_path/'db.sqlite'))
    image=Image.new('L',(160,80));ImageDraw.Draw(image).polygon([(10,10),(30,10),(10,30)],fill=255)
    path,sha=masks.store(MaskImages.encode(image))
    mask=Annotation(annotation_id='mask',sample_id='right',annotation_type='mask',raw_label='dent',
        bbox=[10,10,31,31],mask_path=path,mask_sha256=sha)
    polygon=Annotation(annotation_id='poly',sample_id='left',annotation_type='polygon',raw_label='dent',
        bbox=[10,10,30,30],polygon=[[10,10],[30,10],[10,30]])
    matcher=AnnotationMatcher()
    result=matcher.compare(side('left',[polygon]),side('right',[mask]),relation='EXACT')
    assert result.matches[0].segmentation_iou==1
    assert result.differences==[]
    rectangle=box('left','rectangle','dent',[10,10,31,31])
    mixed=matcher.compare(side('left',[rectangle]),side('right',[mask]),relation='EXACT')
    assert mixed.matches[0].segmentation_iou is None
    assert mixed.matches[0].comparison_kind=='LOCATION_ONLY'
    Path(path).write_bytes(b'broken')
    broken=matcher.compare(side('left',[polygon]),side('right',[mask]),relation='EXACT')
    assert broken.invalid_right==1 and broken.status=='PARTIAL'
    assert any(d.type=='ANNOTATION_UNREADABLE' for d in broken.differences)
    assert not any(d.type=='ONE_SIDED_REGION' for d in broken.differences)


def test_imported_policy_and_parse_failure_remain_distinct_from_empty_annotations(dataset):
    from pathlib import Path
    db,registry,config=dataset
    config.annotations.policy_id='line-a'
    config.annotations.annotation_coverage='EXHAUSTIVE'
    config.annotations.annotation_role='REFERENCE'
    config.annotations.category_mapping={'dent':'凹陷'}
    registry.save(config,require_existing=True)
    (Path(config.annotations.root)/'dent.json').write_text('{broken')
    registry.rescan(config.dataset.id)
    snapshot=AnnotationSet.capture(db,config.dataset.id+':dent.png')
    assert snapshot.policy.policy_id=='line-a'
    assert snapshot.policy.category_mapping=={'dent':'凹陷'}
    assert snapshot.errors
    empty=AnnotationSet.capture(db,config.dataset.id+':normal.png')
    assert empty.errors==[] and empty.annotations==[]
    result=AnnotationMatcher().compare(snapshot,empty,relation='EXACT')
    assert result.status=='PARTIAL' and not result.confirmed_conflict
    assert any(d.type=='ANNOTATION_UNREADABLE' for d in result.differences)


def test_global_assignment_keeps_both_matches_when_the_greedy_choice_loses_one():
    left=side('left',[box('left','a','dent',[0,0,10,10]),box('left','b','dent',[4,0,14,10])])
    right=side('right',[box('right','x','dent',[1,0,11,10]),box('right','y','dent',[0,0,8,10])])
    result=AnnotationMatcher().compare(left,right,relation='EXACT')
    assert {(m.left_id,m.right_id) for m in result.matches}=={('a','y'),('b','x')}
    assert not any(d.type=='ONE_SIDED_REGION' for d in result.differences)


def test_equal_cost_and_tiny_regions_are_ambiguous_without_missing_label_inference():
    left=side('left',[box('left','a','dent',[0,0,10,10]),box('left','b','dent',[2,0,12,10])])
    right=side('right',[box('right','x','dent',[1,0,11,10]),box('right','y','dent',[1,0,11,10])])
    result=AnnotationMatcher().compare(left,right,relation='EXACT')
    assert [d.type for d in result.differences]==['AMBIGUOUS_MATCH']
    tiny=AnnotationMatcher().compare(side('left',[box('left','a','dent',[0,0,1,1])]),
        side('right',[box('right','b','dent',[.05,0,1.05,1])]),relation='EXACT')
    assert [d.type for d in tiny.differences]==['AMBIGUOUS_MATCH']


def test_partial_coverage_does_not_claim_a_missing_label_and_frozen_values_survive_mutation():
    left=side('left',[box('left','a','dent',[0,0,10,10])])
    right=side('right',[])
    right.policy.annotation_coverage='PARTIAL'
    result=AnnotationMatcher().compare(left,right,relation='EXACT')
    difference=result.differences[0]
    assert difference.type=='ONE_SIDED_REGION' and difference.suspected_missing is None
    assert not result.confirmed_conflict
    left.annotations[0].bbox=[40,40,50,50]
    assert difference.left[0].bbox==[0,0,10,10]


def test_policy_can_be_supplied_at_the_existing_import_boundary(tmp_path):
    from iad_core.entry import dataset_import
    from iad_core.storage.database import Database
    images,labels=tmp_path/'images',tmp_path/'labels'
    images.mkdir();labels.mkdir()
    Image.new('RGB',(20,20),'red').save(images/'a.png')
    db_path=str(tmp_path/'import.db')
    imported=dataset_import({'format':'labelme','name':'明确规范','image_dir':str(images),'annotation_dir':str(labels),
        'annotation_policy':{'policy_id':'line-a','annotation_role':'REFERENCE','annotation_coverage':'EXHAUSTIVE'}},db_path)
    frozen=AnnotationSet.capture(Database(db_path),imported['dataset_id']+':a.png')
    assert frozen.policy.policy_id=='line-a'
    assert frozen.policy.annotation_role=='REFERENCE'
    assert imported['annotation_policy']['policy_id']=='line-a'


def test_polygon_at_image_edge_uses_clipped_original_raster_bounds():
    polygon=Annotation(annotation_id='p',sample_id='left',annotation_type='polygon',raw_label='dent',
        bbox=[150,70,160,80],polygon=[[150,70],[160,70],[160,80],[150,80]])
    other=polygon.model_copy(update={'annotation_id':'q','sample_id':'right'})
    result=AnnotationMatcher().compare(side('left',[polygon]),side('right',[other]),relation='EXACT')
    assert result.invalid_left==result.invalid_right==0
    assert result.matches[0].segmentation_iou==1


def test_two_small_regions_inside_a_large_extent_do_not_prove_a_merge():
    left=side('left',[box('left','a','dent',[0,0,10,10]),box('left','b','dent',[90,0,100,10])])
    right=side('right',[box('right','large','dent',[0,0,100,10])])
    result=AnnotationMatcher().compare(left,right,relation='EXACT')
    assert not any(d.type=='SPLIT_MERGE' for d in result.differences)


def test_same_extent_different_mask_pixels_report_geometry_instead_of_two_missing_instances(tmp_path):
    from iad_core.evidence.masks import MaskImages
    masks=MaskImages(str(tmp_path/'mask.db'))
    annotations=[]
    for sample,diagonal in [('left',False),('right',True)]:
        pixels=Image.new('L',(160,80))
        for i in range(10):
            pixels.putpixel((10+i,10+(9-i if diagonal else i)),255)
        path,sha=masks.store(MaskImages.encode(pixels))
        annotations.append(Annotation(annotation_id=sample,sample_id=sample,annotation_type='mask',
            raw_label='dent',bbox=[10,10,20,20],mask_path=path,mask_sha256=sha))
    result=AnnotationMatcher().compare(side('left',[annotations[0]]),side('right',[annotations[1]]),relation='EXACT')
    assert len(result.matches)==1 and result.matches[0].segmentation_iou==0
    assert [d.type for d in result.differences]==['GEOMETRY']


def test_invalid_geometry_and_unknown_quality_do_not_manufacture_missing_or_conflicting_labels():
    invalid=box('left','invalid','dent',[0,0,10,10]);invalid.geometry_status=GeometryStatus.INVALID
    left=side('left',[invalid]);left.quality_status='UNCERTAIN'
    right=side('right',[box('right','valid','dent',[0,0,10,10])])
    result=AnnotationMatcher().compare(left,right,relation='EXACT')
    assert not result.confirmed_conflict
    assert not any(d.type=='ONE_SIDED_REGION' for d in result.differences)
    assert result.invalid_left==1


def test_original_coordinate_ambiguity_pauses_geometry_but_keeps_the_frozen_inputs():
    left=side('left',[box('left','a','dent',[0,0,10,10])])
    right=side('right',[])
    left.annotation_coordinates='EXIF_AMBIGUOUS'
    result=AnnotationMatcher().compare(left,right,relation='EXACT')
    assert result.status=='UNAVAILABLE' and result.matches==[]
    assert not any(d.type=='ONE_SIDED_REGION' for d in result.differences)


def test_image_labels_are_compared_without_inventing_segmentation_regions():
    left=side('left',[Annotation(annotation_id='a',sample_id='left',annotation_type='image',raw_label='dent')])
    right=side('right',[Annotation(annotation_id='b',sample_id='right',annotation_type='image',raw_label='scratch')])
    result=AnnotationMatcher().compare(left,right,relation='EXACT')
    assert result.invalid_left==result.invalid_right==0
    assert result.matches[0].comparison_kind=='IMAGE_LABEL'
    assert [d.type for d in result.differences]==['CATEGORY']


def test_identical_instance_ambiguity_includes_other_plausible_correspondences():
    left=side('left',[box('left','a','dent',[0,0,10,10]),box('left','b','dent',[0,0,10,10])])
    right=side('right',[box('right','x','dent',[0,0,10,10]),box('right','y','dent',[1,0,11,10])])
    result=AnnotationMatcher().compare(left,right,relation='EXACT')
    assert [d.type for d in result.differences]==['AMBIGUOUS_MATCH']
    assert len(result.differences[0].left)==len(result.differences[0].right)==2
    assert not result.confirmed_conflict


def test_crowded_ambiguity_is_resolved_before_committing_individual_exact_matches():
    left=side('left',[box('left','a','dent',[0,0,10,10]),box('left','b','dent',[1,0,11,10]),
        box('left','c','dent',[1,0,11,10])])
    right=side('right',[box('right','x','dent',[0,0,10,10]),box('right','y','dent',[1,0,11,10])])
    result=AnnotationMatcher().compare(left,right,relation='EXACT')
    assert result.matches==[]
    assert [d.type for d in result.differences]==['AMBIGUOUS_MATCH']
