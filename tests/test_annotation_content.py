import json
from pathlib import Path

import pytest

from iad_core.consistency.annotations import AnnotationMatcher
from tests.test_annotation_consistency import box, side
from iad_core.storage.models import Annotation


def compare(left, right):
    return AnnotationMatcher().compare(side('left', left), side('right', right), relation='EXACT')


@pytest.mark.parametrize('main,candidate,expected', [
    ([0, 0, 10, 10], [0, 0, 20, 10], ['少标内容']),
    ([0, 0, 20, 10], [0, 0, 10, 10], ['多标内容']),
    ([0, 0, 20, 10], [5, 0, 25, 10], ['少标内容', '多标内容']),
])
def test_corresponding_instance_coverage_has_direction(main, candidate, expected):
    result = compare([box('left', 'a', 'dent', main)], [box('right', 'b', 'dent', candidate)])
    assert result.conflict_categories == expected
    assert len(result.matches) == 1


def test_pure_split_has_no_coverage_issue_but_partial_union_does():
    left = [box('left', 'a', 'dent', [0, 0, 10, 10]), box('left', 'b', 'dent', [10, 0, 20, 10])]
    right = [box('right', 'c', 'dent', [0, 0, 20, 10])]
    assert compare(left, right).conflict_categories == ['拆分']
    right[0].bbox = [0, 0, 25, 10]
    assert compare(left, right).conflict_categories == ['少标内容', '拆分']


@pytest.mark.parametrize('candidate', [[1, 0, 101, 60], [0, 0, 105, 60]])
def test_small_boundary_changes_remain_position_differences(candidate):
    result = compare([box('left', 'a', 'dent', [0, 0, 100, 60])],
        [box('right', 'b', 'dent', candidate)])
    assert result.conflict_categories == ['位置差异']


@pytest.mark.parametrize('example', json.loads((Path(__file__).parent / 'fixtures' /
    'annotation_coverage_examples.json').read_text()), ids=lambda item: item['image'])
def test_user_polygon_examples_separate_content_from_position(example):
    sources = []
    for key in ('main', 'candidate'):
        data = example[key]
        annotations = [Annotation(annotation_id=key + str(i), sample_id=key, **item)
            for i, item in enumerate(data['annotations'])]
        sources.append(side(key, annotations).model_copy(update={
            'width': data['width'], 'height': data['height']}))
    matcher = AnnotationMatcher()
    assert matcher.compare(*sources, relation='EXACT').conflict_categories == example['expected']
    reverse = {'少标内容': '多标内容', '多标内容': '少标内容', '位置差异': '位置差异'}
    assert matcher.compare(*reversed(sources), relation='EXACT').conflict_categories == [
        reverse[item] for item in example['expected']]
