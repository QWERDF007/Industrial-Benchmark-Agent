from itertools import permutations

import pytest

from iad_core.consistency.agent_review_models import AnchorAssessmentDecision
from iad_core.consistency.group_analysis_models import GroupPairAssessment


@pytest.mark.parametrize('lower', ['position_difference', 'split', 'merge'])
@pytest.mark.parametrize(('higher', 'expected'), [
    ('category_mismatch', '类别不一致'), ('extra_annotation', '多类别'), ('missing_annotation', '少类别'),
])
@pytest.mark.parametrize('severe_first', [False, True])
def test_candidate_conclusion_uses_severity_and_preserves_all_model_issues(lower, higher, expected, severe_first):
    issues = []
    for kind in ([higher, lower] if severe_first else [lower, higher]):
        main = [] if kind == 'missing_annotation' else ['main_a0', 'main_a1'] if kind == 'split' else ['main_a0']
        candidate = [] if kind == 'extra_annotation' else ['candidate_a0', 'candidate_a1'] if kind == 'merge' else ['candidate_a0']
        issues.append({'type': kind, 'description': '两侧该区域标注存在差异。',
            'main_annotation_ids': main, 'candidate_annotation_ids': candidate,
            'media_ids': ['main_image', 'candidate_image']})
    decision = AnchorAssessmentDecision(candidate_id='candidate', verdict='MATERIAL',
        explanation='同一对图像同时存在两项标注差异。', issues=issues)
    assessment = decision.as_assessment()
    assert assessment.conclusion == expected
    assert assessment.categories == [expected]
    assert assessment.issues == decision.issues
    saved = assessment.model_dump(mode='json')
    saved.update(conclusion='位置差异', categories=['位置差异'])
    restored = GroupPairAssessment.model_validate(saved)
    assert restored.conclusion == expected
    assert restored.categories == [expected]
    assert restored.issues == decision.issues


@pytest.mark.parametrize('order', list(permutations(['位置差异', '拆分', '少类别'])))
def test_group_conclusion_uses_all_candidates_and_normalizes_saved_results(order):
    from iad_core.consistency.group_analysis_models import GroupAnalysisDraft

    assessments = [{'candidate_id': 'candidate_' + str(index), 'verdict': 'MATERIAL',
        'explanation': '当前候选有已确认的标注差异。', 'conclusion': category, 'categories': [category]}
        for index, category in enumerate(order)]
    references = [{'candidate_id': item['candidate_id']} for item in assessments]
    saved = {'assessments': assessments,
        'overall': {'verdict': 'MATERIAL', 'text': '位置差异', 'references': references},
        'conclusions': [{'text': '各候选存在不同的标注差异。', 'references': references}]}
    result = GroupAnalysisDraft.model_validate(saved)
    assert result.overall.text == '少类别'
    assert result.model_dump(mode='json')['assessments'] == [
        {**item, 'findings': [], 'limitations': [], 'issues': []} for item in assessments]
    assert result.model_dump(mode='json')['overall']['references'] == [
        {**reference, 'comparison': None} for reference in references]
    assert GroupAnalysisDraft.model_validate_json(result.model_dump_json()).overall.text == '少类别'


@pytest.mark.parametrize('verdict,conclusion', [('EQUIVALENT', '一致'), ('UNCERTAIN', None)])
def test_nonconflict_conclusions_keep_their_meaning(verdict, conclusion):
    decision = AnchorAssessmentDecision(candidate_id='candidate', verdict=verdict, explanation='当前核对结果。')
    assessment = decision.as_assessment()
    assert assessment.conclusion == conclusion
    assert assessment.categories == []
