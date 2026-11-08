from pydantic import ValidationError
from pydantic_core import InitErrorDetails, PydanticCustomError

from iad_core.advisory.conclusions import descriptive_conclusion
from iad_core.consistency.group_analysis_conclusions import assertive_conclusion, CONCLUSION_CATEGORIES
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.group_analysis_models import GroupAnalysisDraft
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.models import ModelAssessmentVerdict


class GroupAnalysisContract:
    @staticmethod
    def validate_categories(verdict: ModelAssessmentVerdict, categories: list[ConflictCategory] | None) -> None:
        if categories is None:
            raise repairable_output_error('missing_consistency_categories',
                '逐候选必须给出categories结构化分类，按主图相对候选的方向区分类别、位置、增减、拆分、合并，无差异时返回空数组。')
        if verdict == 'MATERIAL' and not categories:
            raise repairable_output_error('missing_difference_category',
                'MATERIAL必须在categories中提供一个已确认的主要冲突分类；若关键证据不足，使用UNCERTAIN与空categories，具体限制写explanation。')
        if verdict != 'MATERIAL' and categories:
            raise repairable_output_error('inconsistent_primary_category',
                'EQUIVALENT和UNCERTAIN必须使用空categories，实际观察及具体限制保留在explanation和findings。')

    @staticmethod
    def validate_descriptions(value: GroupAnalysisDraft) -> GroupAnalysisDraft:
        fields = [(('overall', 'text'), value.overall.text),
            *[(('conclusions', index, 'text'), item.text) for index, item in enumerate(value.conclusions)],
            *[(('limitations', index), text) for index, text in enumerate(value.limitations)]]
        for index, item in enumerate(value.assessments):
            fields.extend([(('assessments', index, 'conclusion'), item.conclusion),(('assessments', index, 'explanation'), item.explanation),
                *[(('assessments', index, 'findings', finding), text) for finding, text in enumerate(item.findings)]])
        errors: list[InitErrorDetails] = []
        for index,item in enumerate(value.assessments):
            try:
                GroupAnalysisContract.validate_categories(item.verdict, item.categories)
            except PydanticCustomError as error:
                errors.append(InitErrorDetails(type=error, loc=('assessments',index,'categories'), input=item.categories))
            else:
                if item.verdict == 'MATERIAL' and item.conclusion in CONCLUSION_CATEGORIES and item.categories != [item.conclusion]:
                    errors.append(InitErrorDetails(type=repairable_output_error('inconsistent_primary_category',
                        'categories必须与conclusion完全对应：MATERIAL仅包含同名的一个主要冲突分类；EQUIVALENT和UNCERTAIN为空数组。'),
                        loc=('assessments',index,'categories'),input=item.categories))
        if value.overall.verdict=='MATERIAL' and value.overall.text in CONCLUSION_CATEGORIES and value.overall.text not in {
            item.conclusion for item in value.assessments if item.verdict=='MATERIAL'}:
            errors.append(InitErrorDetails(type=repairable_output_error('unsupported_group_conclusion',
                'overall.text必须从实际逐候选MATERIAL结论中选择主要冲突类型，不能新增未出现的分类。'),
                loc=('overall','text'),input=value.overall.text))
        for location, text in fields:
            try:
                is_conclusion = location == ('overall','text') or location[-1] == 'conclusion'
                if is_conclusion:
                    verdict = value.overall.verdict if location == ('overall','text') else value.assessments[location[1]].verdict
                    assertive_conclusion(text, verdict)
                else:
                    descriptive_conclusion(text)
            except PydanticCustomError as error:
                errors.append(InitErrorDetails(type=error, loc=location, input=text))
        if errors:
            raise ValidationError.from_exception_data(type(value).__name__, errors)
        return value
