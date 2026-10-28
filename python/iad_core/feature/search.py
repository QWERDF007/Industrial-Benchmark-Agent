from pydantic import BaseModel

from iad_core.consistency.errors import ConsistencyError, ConsistencyErrorCode
from iad_core.consistency.models import ImageRetrieve, SampleImageQuery, CoverageCount, Relation
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository


class SearchResult(BaseModel):
    rank: int
    group_id: str
    group_rank: int
    sample_id: str
    score: float
    image_path: str
    relative_path: str
    quality_status: str
    data_origin: str
    batch_id: str | None = None
    physical_sample_id: str | None = None
    phenomenon_summary: str | None = None
    relation: Relation
    error_code: ConsistencyErrorCode | None = None


class VisualMatches(BaseModel):
    items: list[SearchResult]
    scope_id: str
    profile_id: str
    coverage: CoverageCount
    verification: CoverageCount
    annotation: CoverageCount


def search_by_sample(sample_id: str, *, corpus_scope=None, profile_id: str | None = None,
                     top_k: int = 50, exclude_self: bool = True, db_path: str = 'data/benchmark.db',
                     filter_data_origin: str | None = None, filter_quality_status: str | None = None) -> VisualMatches:
    from iad_core.consistency.service import ConsistencyService
    request = ImageRetrieve(query=SampleImageQuery(sample_id=sample_id),
        corpus_scope=corpus_scope or {'kind': 'all_registered'}, profile_id=profile_id,
        top_k=top_k, mode='visual')
    if filter_data_origin or filter_quality_status:
        request = request.model_copy(update={'top_k': max(top_k, 64)})
    db = Database(db_path)
    matches = ConsistencyService(db).retrieve_full(request, exclude_self=exclude_self)
    if matches.visual.status == 'NOT_READY':
        raise ConsistencyError(matches.visual.error_code or 'INDEX_NOT_READY',
            matches.visual.reason or 'Visual retrieval is not ready')
    members = {sample.sample_id: sample for sample in SampleRepository(db).get_many(
        [member.sample_id for group in matches.visual.groups for member in group.members])}
    results = []
    used = 0
    for group in matches.visual.groups:
        origin = next(origin for origin in group.origins if origin.branch == 'visual')
        selected = []
        for member in sorted(group.members, key=lambda value: (value.sample_id != sample_id, value.sample_id)):
            sample = members[member.sample_id]
            if filter_data_origin and sample.data_origin.value != filter_data_origin:
                continue
            if filter_quality_status and sample.quality_status.value != filter_quality_status:
                continue
            selected.append(SearchResult(rank=len(results) + len(selected) + 1, group_id=group.content_group_id,
                group_rank=origin.rank, sample_id=sample.sample_id, score=origin.score,
                image_path=sample.image_path, relative_path=sample.relative_path, quality_status=sample.quality_status.value,
                data_origin=sample.data_origin.value, batch_id=sample.batch_id, physical_sample_id=sample.physical_sample_id,
                relation=member.relation, error_code=member.error_code))
        if selected:
            results.extend(selected)
            used += 1
            if used == top_k:
                break
    return VisualMatches(items=results, scope_id=matches.scope_id, profile_id=matches.profile_id,
        coverage=matches.visual.corpus_coverage, verification=matches.coverage.verification, annotation=matches.coverage.annotation)
