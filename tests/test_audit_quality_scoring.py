import pytest
from pydantic import ValidationError

from iad_core.audit.quality_models import AuditScoreWeights, QualityImage
from iad_core.audit.quality_scoring import AuditQualityScorer
from iad_core.consistency.conflict_categories import ConflictCategory


def image(index, **values):
    return QualityImage(sample_id=str(index), dataset_id='dataset', **values)


def score(images, *, categories=None, **options):
    options.setdefault('distribution_reviews', [])
    options.setdefault('comparisons', [dict(main_id=item.sample_id, candidate_id='reference:'+item.sample_id,
        categories=(categories or {}).get(item.sample_id, [])) for item in images])
    from iad_core.audit.pair_scoring import AuditPairScoring
    from iad_core.audit.quality_models import QualityComparison
    facts = AuditPairScoring.context(images,[QualityComparison.model_validate(c) for c in options['comparisons']])
    options.setdefault('consistency_reviews',[dict(scope_id=scope['scope_id'],code=item['code'],coefficient=1,
        analysis='完整实例或覆盖分歧影响识别。',evidence_refs=[item['ref']]) for scope in facts for item in scope['items']])
    return AuditQualityScorer().score(images, **options)


def test_score_weights_default_normalize_and_reject_invalid_values():
    assert AuditScoreWeights().normalized() == pytest.approx({'consistency': .8, 'diversity': .15, 'redundancy': .05})
    assert AuditScoreWeights(consistency=8, diversity=1.5, redundancy=.5).normalized() == pytest.approx(
        {'consistency': .8, 'diversity': .15, 'redundancy': .05})
    assert AuditScoreWeights(consistency=1e308, diversity=1e308, redundancy=1e308).normalized() == pytest.approx(
        {'consistency': 1/3, 'diversity': 1/3, 'redundancy': 1/3})
    for values in ({'consistency': -1}, {'diversity': float('nan')}, {'redundancy': float('inf')},
                   {'consistency': 0, 'diversity': 0, 'redundancy': 0}):
        with pytest.raises(ValidationError):
            AuditScoreWeights(**values)


def test_consistency_counts_each_completed_comparison_once_at_highest_severity():
    images = [image(i) for i in range(500)]
    categories = {str(i): [ConflictCategory.CATEGORY, ConflictCategory.MISSING, ConflictCategory.EXTRA] for i in range(10)}
    categories.update({str(i): [ConflictCategory.MISSING, ConflictCategory.EXTRA] for i in range(10, 30)})
    categories.update({str(i): [ConflictCategory.EXTRA] for i in range(30, 35)})
    categories['35'] = [ConflictCategory.MISSING_CONTENT, ConflictCategory.SPLIT, ConflictCategory.MERGE]
    result = score(images, categories=categories)
    assert result.dimensions['consistency'].score == pytest.approx(58.9720899136)
    counts = {item.code: item.count for item in result.items}
    assert counts['category_mismatch'] == 10
    assert counts['instance_count_mismatch'] == 25
    assert counts['coverage_mismatch'] == 1
    assert counts['split'] == counts['merge'] == 0
    assert result.dataset_scores[0].dimensions['consistency'].score == pytest.approx(58.9720899136)


def test_position_differences_do_not_reduce_score_or_override_content_and_structure():
    images = [image(i) for i in range(3)]
    result = score(images, categories={'0': [ConflictCategory.POSITION],
        '1': [ConflictCategory.POSITION, ConflictCategory.MISSING_CONTENT],
        '2': [ConflictCategory.POSITION, ConflictCategory.SPLIT]})
    items = {item.code: item for item in result.items}
    assert items['position_difference'].count == 1
    assert items['position_difference'].deduction == 0
    assert items['coverage_mismatch'].count == 1
    assert items['split'].count == 1
    assert result.dimensions['consistency'].score == pytest.approx(82.6794919243)


def defect(index, category='划痕', **values):
    from iad_core.audit.quality_models import QualityDefect
    return QualityDefect(annotation_id=str(index), category=category, morphology='直线', appearance='亮线',
        size='large', location='center', contrast='high', **values)


def test_diversity_uses_instance_scope_and_does_not_penalize_absent_scenes():
    images = [image(i, observation_complete=True, defects=[defect(i)]) for i in range(203)]
    for item in images[:3]:
        item.defects[0].morphology = '弯曲'
        item.defects[0].special_morphology = '弯曲'
        item.defects[0].size = 'tiny'
        item.defects[0].location = 'edge'
    result = score(images, exact_groups=[], redundant_groups=[])
    items = {item.code: item for item in result.items}
    assert items['A2'].count == 3
    assert items['A2'].denominator == 203
    expected = 5.921052631578947
    assert items['A2'].deduction == pytest.approx(expected)
    assert items['A2'].label == '类内视觉变化覆盖不足'
    assert items['A2'].maximum == 6.25
    assert 'A3' not in items and 'A4' not in items
    assert items['B1'].deduction == pytest.approx(4.736842105263158)
    assert items['B3'].deduction > 0  # independent size and location causes
    assert items['B2'].deduction == 0
    assert items['C1'].deduction == 0
    assert len([item for item in result.items if item.dimension == 'diversity']) == 12
    assert result.total is not None


def test_redundancy_counts_extra_images_excludes_exact_extras_and_recomputes_union():
    images = [QualityImage(sample_id=str(i), dataset_id='left' if i < 4 else 'right', observation_complete=True) for i in range(10)]
    result = score(images, exact_groups=[['0', '1', '2']], redundant_groups=[['0', '1', '2', '3', '4']])
    items = {item.code: item for item in result.items}
    assert items['E'].count == 2
    assert items['V'].count == 2
    assert result.dimensions['redundancy'].score == 55
    assert result.total == pytest.approx(.8*100 + .15*100 + .05*55)
    assert result.total != sum(child.total for child in result.dataset_scores) / 2
    assert all(not child.dataset_scores for child in result.dataset_scores)


def test_missing_observations_or_duplicate_review_never_become_perfect_score():
    assert score([image(0)], exact_groups=[], redundant_groups=[]).total is None
    assert score([image(0, observation_complete=True)], exact_groups=[]).total is None
    assert score([image(0, observation_complete=True)], exact_groups=[], redundant_groups=[]).total == 100
    result = score([image(0, completed=False)], exact_groups=[], redundant_groups=[])
    assert result.total is None
    assert result.dimensions['consistency'].score == 100


def test_similar_group_keeps_exact_duplicate_as_representative_when_excluding_overlap():
    images = [image(i, observation_complete=True) for i in range(10)]
    result = score(images, exact_groups=[['0', '9']], redundant_groups=[['1', '9']])
    items = {item.code: item for item in result.items}
    assert items['E'].sample_ids == ['9']
    assert items['V'].sample_ids == ['1']
    assert result.dimensions['redundancy'].score == 77.5


def test_exact_content_can_connect_separate_visual_groups_without_losing_redundant_images():
    images = [image(i, observation_complete=True) for i in range(10)]
    result = score(images, exact_groups=[['8', '9']], redundant_groups=[['1', '8'], ['0', '9']])
    items = {item.code: item for item in result.items}
    assert items['E'].count == 1
    assert items['V'].count == 2
    assert result.dimensions['redundancy'].score == 70


@pytest.mark.parametrize('axis', ['morphology', 'special_morphology', 'appearance'])
def test_visual_variations_share_one_budget_across_descriptions(axis):
    images = [image(i, observation_complete=True, defects=[defect(i)]) for i in range(203)]
    for item in images[:3]:
        setattr(item.defects[0], axis, '弯曲细线')
    if axis == 'special_morphology':
        for item in images[3:]:
            item.defects[0].special_morphology = '平直细线'
    result = score(images, exact_groups=[], redundant_groups=[])
    visual = [item for item in result.items if item.direction == '缺陷类别与形态']
    assert [item.label for item in visual] == ['类内视觉变化覆盖不足']
    assert visual[0].count == 3 and visual[0].denominator == 203
    assert visual[0].deduction == pytest.approx(5.921052631578947)
    assert visual[0].sample_ids == ['0', '1', '2']
    assert result.dimensions['diversity'].deduction == pytest.approx(5.921052631578947)


def test_visual_variations_use_worst_coverage_once_without_combining_axes():
    images = [image(i, observation_complete=True, defects=[defect(i)]) for i in range(203)]
    for item in images[:3]:
        item.defects[0].morphology = '弯曲'
    for item in images[1:6]:
        item.defects[0].appearance = '暗色细线'
    for item in images[2:8]:
        item.defects[0].special_morphology = '分叉'
    for item in images[8:]:
        item.defects[0].special_morphology = '平直'
    result = score(images, exact_groups=[], redundant_groups=[])
    visual = next(item for item in result.items if item.code == 'A2')
    assert visual.scenario == '划痕：弯曲'
    assert visual.count == 3 and visual.denominator == 203
    assert visual.deduction == pytest.approx(5.921052631578947)
    assert result.dimensions['diversity'].deduction == pytest.approx(5.921052631578947)


def test_full_scope_reserves_twenty_points_for_statistical_category_coverage():
    images = [image(i, observation_complete=True, defects=[defect(i)]) for i in range(100)]
    images[0].defects[0].category = '稀有类别'
    from tests.test_audit_distribution_scoring import distribution, reviews
    service = distribution({'划痕':99,'稀有类别':1})
    result = score(images, exact_groups=[], redundant_groups=[], distribution_reviews=service.validate(reviews(service)))
    assert next(i for i in result.items if i.code=='class_balance').maximum == 20
    visual = next(item for item in result.items if item.code == 'A2')
    assert visual.maximum == 6.25 and visual.deduction == 0
    assert result.dimensions['diversity'].score == pytest.approx(90.2412121212)
    assert result.total == pytest.approx(98.5361818182)
    assert [(item.code, item.direction) for item in result.items if item.code.startswith('C')] == [
        ('C1', '对比度'), ('C2', '对比度'), ('C3', '缺陷组合'), ('C4', '缺陷组合')]


def test_content_has_lower_penalty_and_each_image_has_one_scoring_bucket():
    images = [image(i) for i in range(4)]
    result = score(images, categories={'0': [ConflictCategory.MISSING_CONTENT, ConflictCategory.EXTRA],
        '1': [ConflictCategory.EXTRA_CONTENT, ConflictCategory.MISSING_CONTENT],
        '2': [ConflictCategory.SPLIT, ConflictCategory.MERGE]})
    items = {item.code: item for item in result.items}
    assert result.dimensions['consistency'].score == pytest.approx(10)
    assert items['instance_count_mismatch'].count == 1
    assert items['coverage_mismatch'].count == 1
    assert items['split'].count == 1 and items['merge'].count == 0
    assert sum(item.count for item in result.items if item.dimension == 'consistency') == 3



def test_hard_normal_budget_requires_qualification_before_scarcity():
    from iad_core.audit.quality_models import QualityNormalScene
    images = [image(i, observation_complete=True, is_normal=True,
        normal=QualityNormalScene(hard=False)) for i in range(100)]
    images[0].normal = QualityNormalScene(hard=True, hard_type='与划痕相似的接缝')
    assert next(item for item in score(images).items if item.code == 'D1').count == 0
    images[0].normal = QualityNormalScene(hard=True, hard_type='与划痕相似的接缝', profile_revision=1,
        qualification=dict(feature_id='scratch', reference=dict(sample_id='real_defect', result_revision=1, kind='image'),
            similar_features=['均为表面细暗线'], normal_reason='接缝沿完整结构边缘连续延伸', difficulty_reason='短段局部与浅划痕形态相近'))
    items = {item.code:item for item in score(images).items}
    assert items['D1'].count == 1 and items['D1'].maximum == items['D1'].deduction == 10
    assert 'D3' not in items
    assert sum(item.maximum for item in items.values() if item.direction == '困难良品') == 15.625
