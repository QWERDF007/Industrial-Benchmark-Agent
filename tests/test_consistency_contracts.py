import math

import pytest
from pydantic import ValidationError


def test_consistency_requests_use_explicit_scopes_and_truthful_pixel_counts():
    from iad_core.consistency.models import ConsistencyStart, ImageRetrieve, PixelComparison

    request = ConsistencyStart.model_validate({'subjects': {'kind': 'all_registered'}, 'request_id': 'check'})
    assert request.mode == 'exact'
    assert request.corpus_scope.kind == 'all_registered'
    assert request.profile_id is None
    query = ImageRetrieve.model_validate({'query': {'kind': 'sample', 'sample_id': 'a:one.png'}})
    assert query.mode == 'combined' and query.top_k == 50
    for subjects in [
        {'kind': 'datasets', 'dataset_ids': []},
        {'kind': 'datasets', 'dataset_ids': ['']},
        {'kind': 'datasets', 'dataset_ids': ['one', 'one']},
        {'kind': 'samples', 'sample_ids': [' ']},
        {'kind': 'filtered', 'dataset_id': 'a', 'filters': {'page_size': 24}},
    ]:
        with pytest.raises(ValidationError):
            ConsistencyStart.model_validate({'subjects': subjects, 'request_id': 'bad'})
    with pytest.raises(ValidationError):
        ImageRetrieve.model_validate({'query': {'kind': 'temporary', 'path': '/tmp/raw.png'}})
    with pytest.raises(ValidationError):
        ConsistencyStart.model_validate({'subjects': {'kind': 'all_registered'},
            'corpus_scope': {'kind': 'samples', 'sample_ids': ['one']}, 'request_id': 'bad'})
    unavailable = PixelComparison(status='UNAVAILABLE', reason='source missing')
    assert unavailable.exact_equal is None and unavailable.changed_pixels is None
    assert unavailable.max_abs_diff is None and unavailable.compared_pixels == 0
    for values in [
        {'status': 'COMPLETE', 'exact_equal': True, 'compared_pixels': 64, 'changed_pixels': 1, 'max_abs_diff': 0},
        {'status': 'COMPLETE', 'exact_equal': False, 'compared_pixels': 64, 'changed_pixels': -1, 'max_abs_diff': 1},
        {'status': 'COMPLETE', 'exact_equal': True, 'compared_pixels': 64},
    ]:
        with pytest.raises(ValidationError):
            PixelComparison.model_validate(values)
    assert PixelComparison(status='COMPLETE', exact_equal=True, compared_pixels=64,
        changed_pixels=0, max_abs_diff=0).exact_equal is True


def test_coverage_and_rank_scores_cannot_turn_unknown_into_success():
    from iad_core.consistency.models import CoverageCount, RetrievalCandidate

    assert CoverageCount(total=8, completed=3, failed=1, unsupported=2, pending=2).completed == 3
    for values in [dict(total=8, completed=9), dict(total=8, completed=3, failed=1), dict(total=-1)]:
        with pytest.raises(ValidationError):
            CoverageCount.model_validate(values)
    for score in [math.nan, math.inf]:
        with pytest.raises(ValidationError):
            RetrievalCandidate(sample_id='a:one.png', content_group_id='group', retrieval_branch='visual',
                rank=1, score=score, profile_id='encoder', relation='UNCHECKED')
