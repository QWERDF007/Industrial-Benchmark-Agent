import pytest
from pydantic import ValidationError

from iad_core.audit.quality_models import AuditScoreWeights, QualityImage
from iad_core.audit.quality_scoring import AuditQualityScorer


def image(index, **values):
    return QualityImage(sample_id=str(index), dataset_id='dataset', **values)


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


def test_consistency_counts_each_completed_image_once_at_highest_severity():
    images = [image(i) for i in range(500)]
    for item in images[:10]:
        item.findings = ['category_mismatch', 'missing_annotation', 'extra_annotation']
    for item in images[10:30]:
        item.findings = ['missing_annotation', 'extra_annotation']
    for item in images[30:35]:
        item.findings = ['extra_annotation']
    images[35].findings = ['position_difference', 'split', 'merge']
    score = AuditQualityScorer().score(images)
    assert score.dimensions['consistency'].score == pytest.approx(93.3)
    counts = {item.code: item.count for item in score.items}
    assert counts['category_mismatch'] == 10
    assert counts['missing_annotation'] == 20
    assert counts['extra_annotation'] == 5
    assert counts['position_difference'] == counts['split'] == counts['merge'] == 1
    assert score.dataset_scores[0].dimensions['consistency'].score == pytest.approx(93.3)


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
    score = AuditQualityScorer().score(images, exact_groups=[], redundant_groups=[])
    items = {item.code: item for item in score.items}
    assert items['A2'].count == 3
    assert items['A2'].denominator == 203
    expected = 8 / 2 * ((20-3)/19 + 1)
    assert items['A2'].deduction == pytest.approx(expected)
    assert items['A3'].deduction == 0
    assert items['A3'].suppressed_by == 'A2'
    assert items['B1'].deduction == pytest.approx(expected)
    assert items['B3'].deduction > 0  # independent size and location causes
    assert items['B2'].deduction == 0
    assert items['C1'].deduction == 0
    assert len([item for item in score.items if item.dimension == 'diversity']) == 16
    assert score.total is not None


def test_redundancy_counts_extra_images_excludes_exact_extras_and_recomputes_union():
    images = [QualityImage(sample_id=str(i), dataset_id='left' if i < 4 else 'right', observation_complete=True) for i in range(10)]
    score = AuditQualityScorer().score(images, exact_groups=[['0', '1', '2']], redundant_groups=[['0', '1', '2', '3', '4']])
    items = {item.code: item for item in score.items}
    assert items['E'].count == 2
    assert items['V'].count == 2
    assert score.dimensions['redundancy'].score == 55
    assert score.total == pytest.approx(.8*100 + .15*100 + .05*55)
    assert score.total != sum(child.total for child in score.dataset_scores) / 2
    assert all(not child.dataset_scores for child in score.dataset_scores)


def test_missing_observations_or_duplicate_review_never_become_perfect_score():
    scorer = AuditQualityScorer()
    assert scorer.score([image(0)], exact_groups=[], redundant_groups=[]).total is None
    assert scorer.score([image(0, observation_complete=True)], exact_groups=[]).total is None
    assert scorer.score([image(0, observation_complete=True)], exact_groups=[], redundant_groups=[]).total == 100
    score = scorer.score([image(0, completed=False)], exact_groups=[], redundant_groups=[])
    assert score.total is None
    assert score.dimensions['consistency'].score is None


def test_similar_group_keeps_exact_duplicate_as_representative_when_excluding_overlap():
    images = [image(i, observation_complete=True) for i in range(10)]
    score = AuditQualityScorer().score(images, exact_groups=[['0', '9']], redundant_groups=[['1', '9']])
    items = {item.code: item for item in score.items}
    assert items['E'].sample_ids == ['9']
    assert items['V'].sample_ids == ['1']
    assert score.dimensions['redundancy'].score == 77.5


def test_exact_content_can_connect_separate_visual_groups_without_losing_redundant_images():
    images = [image(i, observation_complete=True) for i in range(10)]
    score = AuditQualityScorer().score(images, exact_groups=[['8', '9']], redundant_groups=[['1', '8'], ['0', '9']])
    items = {item.code: item for item in score.items}
    assert items['E'].count == 1
    assert items['V'].count == 2
    assert score.dimensions['redundancy'].score == 70
