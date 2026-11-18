from datetime import datetime, timezone

import pytest

from iad_core.audit.distribution_scoring import AuditDistributionScoring
from iad_core.storage.models import Annotation, Sample
from iad_core.workbench.analysis_manifest import AnalysisManifest, AnalysisRegistration


def distribution(image_counts=None, instance_counts=None, *, widths=None):
    image_counts = image_counts or {}
    instance_counts = instance_counts or image_counts
    n = len(widths) if widths else max(image_counts.values(),default=2)
    annotations = [[] for _ in range(n)]
    for label,count in instance_counts.items():
        for i in range(count):
            sid = i % image_counts[label]
            annotations[sid].append(Annotation(annotation_id=f'{label}-{i}',sample_id=str(sid),
                raw_label=label,annotation_type='bbox',bbox=(0,0,5,5)))
    records = [AnalysisRegistration(dataset_format='labelme',annotations=annotations[i],source_fingerprint=None,
        sample=Sample(sample_id=str(i),task_id='task',dataset_id='one',image_path=f'/images/{i}.png',
            relative_path=f'{i}.png',quality_status='UNCERTAIN',width=widths[i] if widths else 200,height=100)) for i in range(n)]
    return AuditDistributionScoring(AnalysisManifest(dataset_ids=['one'],frozen_at=datetime.now(timezone.utc),records=records))


def reviews(service):
    return [dict(scope_id=scope['scope_id'],axis=axis,status='problem' if facts.get('base_deduction',0)>0 else
        'normal' if facts['metrics'] else 'not_applicable',coefficient=1 if facts.get('base_deduction',0)>0 else None,
        grouping='比较实际存在的类别或具有意义的规格。',analysis='少数类别的样本支持偏弱。',
        evidence_refs=[facts['ref']]) for scope in service.context() for axis,facts in scope['axes'].items()]


def score(service, values=None):
    return {i.code:i for i in service.items(service.validate(values or reviews(service)),'overall',factor=1)}


def test_category_deductions_distinguish_extreme_tails_from_supported_minority_classes():
    glasses = distribution({'脏污':1467,'划伤':135,'磨伤':112,'流纹':226,'料花':53,'碰伤':4,'浇口喷痕':84,'麻点':4,'黏膜点':3},
        {'脏污':1819,'划伤':197,'磨伤':146,'流纹':234,'料花':66,'碰伤':4,'浇口喷痕':84,'麻点':4,'黏膜点':3})
    grid = distribution({'4':685,'2':42},{'4':784,'2':89})
    severe = score(glasses)['class_balance']
    moderate = score(grid)['class_balance']
    assert severe.base_deduction == severe.deduction == pytest.approx(25.1053,abs=.0001)
    assert moderate.base_deduction == moderate.deduction == pytest.approx(11.6515036496)
    assert severe.deduction > moderate.deduction > 0
    assert moderate.scoring_basis == '图像类别'
    assert severe.scoring_basis == '实例类别'
    assert sum(e.deduction for e in severe.distribution_evidence) == pytest.approx(severe.deduction)
    assert len(severe.distribution_evidence) == 8
    rare = next(e for e in severe.distribution_evidence if e.bucket=='黏膜点')
    assert rare.image_count == rare.annotation_count == 3


def test_balanced_or_single_category_has_no_penalty_and_more_minority_support_reduces_it():
    assert score(distribution({'a':4,'b':4}))['class_balance'].deduction == 0
    assert score(distribution({'a':4}))['class_balance'].deduction == 0
    thin = score(distribution({'major':500,'minor':4}))['class_balance'].deduction
    supported = score(distribution({'major':500,'minor':42}))['class_balance'].deduction
    assert 0 < supported < thin
    assert score(distribution({'major':500,'minor':250}))['class_balance'].deduction == 0


def test_coefficients_are_required_and_scale_without_replacing_real_distribution_evidence():
    service = distribution({'major':500,'minor':42})
    base = score(service)['class_balance']
    values = reviews(service)
    target = next(r for r in values if r['axis']=='class_balance')
    target['coefficient'] = 1.5
    changed = score(service,values)['class_balance']
    assert changed.deduction == pytest.approx(base.deduction*1.5)
    assert changed.impact_coefficient == 1.5
    for coefficient in (None,.49,2.01,float('nan')):
        with pytest.raises(ValueError):
            score(service,[dict(r,coefficient=coefficient) if r is target else r for r in values])
    with pytest.raises(ValueError):
        score(service,[dict(r,evidence_refs=['wrong']) if r is target else r for r in values])
    with pytest.raises(ValueError):
        score(service,[dict(r,status='normal',coefficient=None) if r is target else r for r in values])


def geometry_comparison():
    return dict(metric='image_dimensions',groups=[
        dict(label='常规规格',members=[dict(kind='bins',metric='image_dimensions',x=[0,3],y=[0,7])]),
        dict(label='另一规格',members=[dict(kind='bins',metric='image_dimensions',x=[4,7],y=[0,7])])])


def test_meaningful_groups_are_counted_from_real_bins_and_invalid_partitions_are_rejected():
    service = distribution(widths=[100]*950+[200]*50)
    values = reviews(service)
    target = next(r for r in values if r['axis']=='image_geometry')
    target.update(status='problem',coefficient=1,comparisons=[geometry_comparison()])
    item = score(service,values)['image_geometry']
    assert item.deduction == pytest.approx(4.0263157895)
    assert item.distribution_evidence[0].image_count == 50
    assert item.distribution_evidence[0].bucket == '另一规格'
    for comparison in (
        dict(metric='image_dimensions',groups=geometry_comparison()['groups'][:1]),
        dict(metric='image_dimensions',groups=[geometry_comparison()['groups'][0],geometry_comparison()['groups'][0]]),
        dict(metric='box_centers',groups=geometry_comparison()['groups']),
    ):
        with pytest.raises(ValueError):
            score(service,[dict(r,comparisons=[comparison]) if r is target else r for r in values])


def test_uniform_specifications_balanced_groups_and_absent_source_metadata_are_not_penalized():
    items = score(distribution(widths=[100]*50+[200]*50))
    assert items['image_geometry'].deduction == 0
    assert items['capture_source'].deduction == 0
    assert not items['capture_source'].distribution_evidence


def test_full_scope_scales_distribution_once_and_only_suppresses_the_same_visual_cause():
    from iad_core.audit.quality_models import QualityScoreItem
    service = distribution(widths=[100]*950+[200]*50)
    values = reviews(service)
    target = next(r for r in values if r['axis']=='image_geometry')
    target.update(status='problem',coefficient=2,comparisons=[geometry_comparison()])
    result = service.items(service.validate(values),'overall',factor=.5)
    assert next(i for i in result if i.code=='image_geometry').deduction == pytest.approx(4.0263157895)
    visual = QualityScoreItem(code='B1',dimension='diversity',direction='缺陷尺寸与位置',label='微小缺陷样本稀缺',
        maximum=5,count=1,denominator=100,ratio=.01,deduction=5)
    separate = [i.model_copy(deep=True) for i in result]+[visual]
    AuditDistributionScoring.suppress_overlaps(separate)
    assert visual.deduction == 5


def test_many_instances_from_one_image_do_not_replace_image_coverage_and_overlap_is_not_double_charged():
    from iad_core.audit.quality_models import QualityScoreItem
    records=[]
    for i in range(101):
        size,count=(5,600) if i==0 else (20,4)
        records.append(AnalysisRegistration(dataset_format='labelme',source_fingerprint=None,
            sample=Sample(sample_id=str(i),task_id='task',dataset_id='one',image_path=f'/images/{i}.png',
                relative_path=f'{i}.png',quality_status='UNCERTAIN',width=100,height=100),
            annotations=[Annotation(annotation_id=f'{i}-{j}',sample_id=str(i),raw_label='c',
                annotation_type='bbox',bbox=(0,0,size,size)) for j in range(count)]))
    service=AuditDistributionScoring(AnalysisManifest(dataset_ids=['one'],frozen_at=datetime.now(timezone.utc),records=records))
    values=reviews(service)
    target=next(r for r in values if r['axis']=='instance_geometry')
    comparison=geometry_comparison()
    comparison['metric']='box_dimensions'
    for group in comparison['groups']:
        for member in group['members']:member['metric']='box_dimensions'
    target.update(status='problem',coefficient=1,comparisons=[comparison],overlap_codes=['B1'])
    items=service.items(service.validate(values),'overall',factor=.5)
    statistical=next(i for i in items if i.code=='instance_geometry')
    assert statistical.scoring_basis=='box_dimensions:图像'
    assert statistical.deduction==pytest.approx(4.8608)
    assert statistical.distribution_evidence[0].image_count==1
    assert statistical.distribution_evidence[0].annotation_count==600
    items.append(QualityScoreItem(code='B1',dimension='diversity',direction='缺陷尺寸与位置',label='微小缺陷稀缺',
        maximum=5,count=1,denominator=100,ratio=.01,deduction=5))
    service.suppress_overlaps(items)
    assert statistical.deduction==0
    assert sum(e.deduction for e in statistical.distribution_evidence)==0


def test_two_nonempty_groups_cannot_omit_the_rest_of_a_metric():
    service=distribution(widths=[100]*60+[150]*30+[200]*10)
    values=reviews(service)
    target=next(r for r in values if r['axis']=='image_geometry')
    comparison=geometry_comparison()
    comparison['groups'][1]['members'][0]['x']=[4,6]
    target.update(status='problem',coefficient=1,comparisons=[comparison])
    with pytest.raises(ValueError,match='覆盖'):
        service.validate(values)
