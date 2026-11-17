import json
from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.audit.quality_models import QualityAssessment


class AuditToolPageQuery(AnalysisModel):
    cursor: int = Field(default=0, ge=0)
    page_size: int = Field(default=8, ge=1, le=30)
    max_chars: int = Field(default=24000, ge=4000, le=64000)


class AuditDraftQuery(AuditToolPageQuery):
    field: str | None = None


class AuditDatasetQuery(AuditToolPageQuery):
    section: Literal['duplicates', 'similar_candidates', 'benchmark', 'benchmark_leakage']


class AuditQualityQuery(QualityAssessment, AuditToolPageQuery):
    item_code: str | None = None
    dataset_id: str | None = None


class AuditToolPages:
    @staticmethod
    def page(items: list, query: AuditToolPageQuery, **metadata) -> dict:
        result = dict(**metadata, total=len(items), items=[], next_cursor=None)
        used = len(json.dumps(result, ensure_ascii=False)) + 128
        if used > query.max_chars:
            raise ValueError('索引超过页面预算，请按子数据集或字段读取')
        for index in range(query.cursor, len(items)):
            size = len(json.dumps(items[index], ensure_ascii=False)) + 2
            if len(result['items']) >= query.page_size or used + size > query.max_chars:
                if not result['items']:
                    raise ValueError('单项内容超过页面预算，请增加 max_chars')
                result['next_cursor'] = index
                break
            result['items'].append(items[index])
            used += size
        return result

    @classmethod
    def dataset(cls, profile, request: dict) -> dict:
        query = AuditDatasetQuery.model_validate(request)
        if query.section == 'benchmark':
            from iad_core.audit.master_models import AuditMasterDatasetProfile
            return dict(benchmark=AuditMasterDatasetProfile.capture(profile).model_dump(mode='json')['benchmark'])
        if query.section == 'benchmark_leakage':
            leakage = profile.benchmark.leakage.model_dump() if profile.benchmark else {}
            items = [dict(type=kind, facts=facts) for kind, values in leakage.items() if isinstance(values, list) for facts in values]
        else:
            items = (profile.strict_duplicate_members if query.section == 'duplicates' else profile.near_candidate_members) or []
        return cls.page(items, query, section=query.section)

    @classmethod
    def draft(cls, drafts, run_id: str, request: dict) -> dict:
        query = AuditDraftQuery.model_validate(request)
        draft = drafts.read(run_id)
        index = {key: dict(count=len(value) if isinstance(value, list) else 1,
            chars=len(json.dumps(value, ensure_ascii=False))) for key, value in draft.fields.items()}
        if query.field is None:
            return dict(revision=draft.revision, fields=index)
        if query.field not in draft.fields:
            raise ValueError('草稿未保存该字段')
        value = draft.fields[query.field]
        return cls.page(value if isinstance(value, list) else [value], query, revision=draft.revision, field=query.field)

    @classmethod
    def notes(cls, notes, run_id: str, session_id: str, request: dict) -> dict:
        return cls.page([note.model_dump(mode='json') for note in notes.read(run_id, session_id)],
            AuditToolPageQuery.model_validate(request))

    @classmethod
    def quality(cls, reports, run_id: str, request: dict) -> dict:
        query = AuditQualityQuery.model_validate(request)
        assessment = QualityAssessment.model_validate(query.model_dump(include=set(QualityAssessment.model_fields)))
        preview = reports.preview(run_id, assessment)
        score = preview.score if query.dataset_id is None else next((item for item in preview.score.dataset_scores
            if item.dataset_id == query.dataset_id), None)
        if score is None:
            raise ValueError('子数据集不属于本次评分范围')
        metadata = dict(assessment=preview.assessment.model_dump(mode='json'),
            score=score.model_dump(mode='json', exclude={'items', 'dataset_scores'}),
            dataset_count=len(preview.score.dataset_scores))
        if query.item_code is not None:
            item = next((item for item in score.items if item.code == query.item_code), None)
            if item is None:
                raise ValueError('评分条目不存在')
            return cls.page(item.sample_ids, query, item=item.model_dump(mode='json', exclude={'sample_ids'}), **metadata)
        return cls.page([item.model_dump(mode='json', exclude={'sample_ids'}) for item in score.items], query, **metadata)
