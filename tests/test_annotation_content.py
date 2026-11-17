import pytest

from iad_core.consistency.annotations import AnnotationMatcher
from tests.test_annotation_consistency import box, side


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
