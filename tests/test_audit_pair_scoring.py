import pytest

from iad_core.audit.quality_models import QualityImage
from iad_core.audit.quality_scoring import AuditQualityScorer


def review(code='instance_count_mismatch', coefficient=1, scope_id='overall'):
    return dict(scope_id=scope_id, code=code, coefficient=coefficient,
        analysis='完整实例的有无存在分歧，会影响缺陷识别。', evidence_refs=[f'{scope_id}:{code}'])


def test_consistent_pairs_and_reverse_records_do_not_dilute_the_same_problem():
    images = [QualityImage(sample_id=str(i), dataset_id='one') for i in range(100)]
    comparisons = [dict(main_id='0', candidate_id='1', categories=['少类别'])]
    options = dict(scope='consistency', distribution_reviews=[], consistency_reviews=[review()])
    first = AuditQualityScorer().score(images, comparisons=comparisons, **options)
    comparisons += [dict(main_id='1', candidate_id='0', categories=['多类别'])]
    comparisons += [dict(main_id=str(i), candidate_id=str(j), categories=[])
        for i in range(2, 100) for j in range(i+1, 100)]
    second = AuditQualityScorer().score(images, comparisons=comparisons, **options)
    assert first.dimensions['consistency'] == second.dimensions['consistency']
    item = next(i for i in second.items if i.code == 'instance_count_mismatch')
    assert item.count == item.charged_count == 2 and item.denominator == 100
    assert item.pair_count == 1
    assert item.base_deduction == item.deduction == pytest.approx(21.2132034356)
    assert item.impact_coefficient == 1


def test_repeated_problem_pairs_charge_each_image_once_at_its_highest_priority():
    images = [QualityImage(sample_id=str(i), dataset_id='one') for i in range(100)]
    comparisons = [dict(main_id='0', candidate_id='1', categories=['类别不一致']),
        dict(main_id='0', candidate_id='2', categories=['少类别']),
        dict(main_id='2', candidate_id='3', categories=['少标内容'])]
    result = AuditQualityScorer().score(images, comparisons=comparisons, scope='consistency',
        distribution_reviews=[], consistency_reviews=[review(code) for code in
            ['category_mismatch','instance_count_mismatch','coverage_mismatch']])
    items = {i.code:i for i in result.items}
    assert items['category_mismatch'].charged_count == 2
    assert items['instance_count_mismatch'].charged_count == 1
    assert items['coverage_mismatch'].charged_count == 1
    assert items['coverage_mismatch'].count == 2
    assert items['category_mismatch'].deduction == pytest.approx(17.3205080757)
    assert items['instance_count_mismatch'].deduction == pytest.approx(8.6602540378)
    assert items['coverage_mismatch'].deduction == 3


@pytest.mark.parametrize('coefficient', [.5, 1, 2])
def test_model_coefficient_scales_the_base_and_score_stays_bounded(coefficient):
    images = [QualityImage(sample_id=str(i), dataset_id='one') for i in range(100)]
    result = AuditQualityScorer().score(images, comparisons=[dict(main_id='0', candidate_id='1', categories=['少类别'])],
        scope='consistency', distribution_reviews=[], consistency_reviews=[review(coefficient=coefficient)])
    item = next(i for i in result.items if i.code == 'instance_count_mismatch')
    assert item.deduction == pytest.approx(21.2132034356*coefficient)
    assert 0 <= result.dimensions['consistency'].score <= 100


def test_missing_coefficients_do_not_become_perfect_scores_and_invalid_reviews_are_rejected():
    images = [QualityImage(sample_id='a', dataset_id='one')]
    comparisons = [dict(main_id='a', candidate_id='reference', categories=['少类别'])]
    options = dict(images=images, comparisons=comparisons, scope='consistency', distribution_reviews=[])
    assert AuditQualityScorer().score(**options).total is None
    for reviews in ([], [review(coefficient=.49)], [review(coefficient=2.01)], [review(),review()],
                    [dict(review(), evidence_refs=['other:instance_count_mismatch'])], [review(scope_id='other')]):
        with pytest.raises(ValueError):
            AuditQualityScorer().score(**options, consistency_reviews=reviews)


def test_serious_deductions_cap_proportionately_and_content_uses_remaining_points():
    images = [QualityImage(sample_id=str(i), dataset_id='one') for i in range(6)]
    comparisons = [dict(main_id='0',candidate_id='1',categories=['类别不一致']),
        dict(main_id='2',candidate_id='3',categories=['多类别']),
        dict(main_id='4',candidate_id='5',categories=['多标内容'])]
    result = AuditQualityScorer().score(images, comparisons=comparisons, scope='consistency', distribution_reviews=[],
        consistency_reviews=[review(code,2) for code in ['category_mismatch','instance_count_mismatch','coverage_mismatch']])
    items = {i.code:i for i in result.items}
    assert items['category_mismatch'].deduction == items['instance_count_mismatch'].deduction == 50
    assert items['coverage_mismatch'].deduction == 0
    assert result.dimensions['consistency'].score == 0


def test_subsets_use_their_own_population_and_model_coefficients():
    images = [QualityImage(sample_id=str(i), dataset_id='left' if i<2 else 'right') for i in range(100)]
    comparisons = [dict(main_id='0',candidate_id='1',categories=['少类别'])]
    result = AuditQualityScorer().score(images, comparisons=comparisons, scope='consistency', distribution_reviews=[],
        consistency_reviews=[review(),review(coefficient=.5,scope_id='left')])
    subsets = {s.dataset_id:s for s in result.dataset_scores}
    assert subsets['left'].dimensions['consistency'].score == 50
    assert subsets['right'].dimensions['consistency'].score == 100
    assert result.dimensions['consistency'].score == pytest.approx(78.7867965644)
