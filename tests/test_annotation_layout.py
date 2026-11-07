from iad_core.consistency.annotations import AnnotationMatcher, AnnotationSet
from iad_core.consistency.annotation_inventory import AnnotationObservation
from iad_core.storage.models import Annotation
import json


def test_similar_images_compare_annotation_locations_in_relative_image_coordinates():
    main = AnnotationSet(sample_id='main', dataset_id='dataset', width=100, height=80,
        quality_status='UNCERTAIN', quality_source=None, annotations=[Annotation(
            annotation_id='main-box', sample_id='main', annotation_type='bbox', raw_label='15', bbox=[10,10,30,30])])
    candidate = main.model_copy(update={'sample_id':'candidate','width':200,'height':160,
        'annotations':[Annotation(annotation_id='candidate-box',sample_id='candidate',annotation_type='bbox',
            raw_label='15',bbox=[24,20,64,60])]})
    comparison = AnnotationMatcher().compare(main,candidate,relation='VISUAL_REFERENCE')
    assert len(comparison.matches)==1
    assert comparison.conflict_categories==['位置差异']
    assert comparison.coordinate_frame=='RELATIVE_IMAGE'
    observation=AnnotationObservation.capture(main,candidate,comparison,'VISUAL_REFERENCE')
    assert observation.geometry_compared
    assert '位置未' not in observation.summary
    assert comparison.differences[-1].left[0].bbox==[10,10,30,30]
    assert comparison.differences[-1].right[0].bbox==[24,20,64,60]
    assert not comparison.confirmed_conflict


def test_old_frozen_sources_are_position_compared_without_changing_the_record():
    from iad_core.consistency.annotation_models import AnnotationComparison
    main=AnnotationSet(sample_id='main',dataset_id='dataset',width=100,height=80,quality_status='PASS',quality_source=None,
        annotations=[Annotation(annotation_id='a',sample_id='main',annotation_type='bbox',raw_label='15',bbox=[10,10,30,30])])
    candidate=main.model_copy(update={'sample_id':'candidate','width':200,'height':160,
        'annotations':[Annotation(annotation_id='b',sample_id='candidate',annotation_type='bbox',raw_label='15',bbox=[20,20,60,60])]})
    previous=AnnotationComparison(status='COMPLETE',policy_relation='UNKNOWN',matches=[],differences=[],
        invalid_left=0,invalid_right=0,confirmed_conflict=False)
    frozen=previous.model_dump_json()
    observed=AnnotationObservation.capture(main,candidate,previous,'VISUAL_REFERENCE')
    assert observed.geometry_compared and observed.categories==[]
    assert '已匹配 1 对' in observed.summary
    assert previous.model_dump_json()==frozen


def test_relative_position_evidence_crops_remain_in_each_original_image(dataset,tmp_path):
    from PIL import Image
    from iad_core.consistency.service import ConsistencyService
    from iad_core.consistency.evidence_models import ConsistencyCompare
    db,registry,config=dataset
    for name,size,points in [('main',(100,80),[[10,10],[30,30]]),('candidate',(200,160),[[24,20],[64,60]])]:
        Image.new('RGB',size,'blue').save(tmp_path/'images'/f'{name}.png')
        (tmp_path/'labels'/f'{name}.json').write_text(json.dumps({'imageWidth':size[0],'imageHeight':size[1],
            'shapes':[{'label':'15','shape_type':'rectangle','points':points}]}))
    registry.rescan(config.dataset.id)
    service=ConsistencyService(db)
    result=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':main.png',sample_b=config.dataset.id+':candidate.png'))
    bundle=service.evidence(result.evidence_id)
    difference=next(item for item in result.annotation.differences if item.type=='GEOMETRY')
    crops={item.side:item.bbox for item in bundle.media if item.difference_id==difference.difference_id and item.representation=='preview'}
    assert crops=={'left':(6,6,36,34),'right':(12,12,72,68)}
    assert bundle.annotation_observations['left'].categories==['位置差异']
