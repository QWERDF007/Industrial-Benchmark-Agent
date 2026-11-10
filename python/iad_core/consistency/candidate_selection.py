import hashlib
import json
from typing import Literal

from pydantic import Field, FiniteFloat

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import ConsistencyRetrievalSettings, Count, Identifier, ReviewMode, SimilarityThreshold
from iad_core.consistency.retrieval_models import RetrievalPage


ELIGIBLE_PAIR_SQL = "(relation='EXACT' OR (mode IN ('combined','visual') AND relation IN ('NEAR_CANDIDATE','VISUAL_REFERENCE')))"
REVIEW_PAIR_SQL = "(json_array_length(difference_types)>0 OR relation!='EXACT' OR annotation_issues)"


class SelectedCandidate(AnalysisModel):
    sample_id: Identifier
    content_group_id: Identifier
    kind: Literal['exact', 'similar']
    rank: int = Field(ge=1, strict=True)
    score: FiniteFloat | None = None


class CandidateBranch(AnalysisModel):
    state: Literal['done', 'disabled']
    limit: Count
    matched: Count | None
    selected: Count
    truncated: bool


class AnchorCandidates(AnalysisModel):
    anchor_id: Identifier
    scope_id: Identifier
    mode: ReviewMode
    min_similarity: SimilarityThreshold | None
    exact: CandidateBranch
    similar: CandidateBranch
    candidates: list[SelectedCandidate]

    @property
    def fingerprint(self) -> str:
        return hashlib.sha256(json.dumps(self.model_dump(mode='json'), sort_keys=True,
            separators=(',', ':')).encode()).hexdigest()

    @classmethod
    def select(cls, result: RetrievalPage, settings: ConsistencyRetrievalSettings) -> 'AnchorCandidates':
        if result.query.kind != 'sample' or result.mode != settings.mode:
            raise ConsistencyError('INVALID_SCOPE', 'Candidate retrieval must use the frozen anchor and mode')
        if settings.mode == 'combined' and result.min_similarity != settings.min_similarity:
            raise ConsistencyError('INVALID_SCOPE', 'Candidate retrieval must use the frozen similarity threshold')
        branches = [result.exact, result.visual] if settings.mode == 'combined' else [result.exact]
        for branch in branches:
            if branch.status != 'READY':
                raise ConsistencyError(branch.error_code or 'INDEX_NOT_READY', branch.reason or 'Candidate retrieval is incomplete')
            if branch.next_cursor or any(group.next_member_cursor for group in branch.groups):
                raise ConsistencyError('INVALID_SCOPE', 'Candidate selection requires the complete retrieval result')
        anchor_id = result.query.sample_id
        exact = {member.sample_id: group.content_group_id for group in result.exact.groups
            for member in group.members if member.sample_id != anchor_id and member.pixel.exact_equal is True}
        selected = [SelectedCandidate(sample_id=sample_id, content_group_id=exact[sample_id], kind='exact', rank=rank)
            for rank, sample_id in enumerate(sorted(exact)[:settings.max_exact_candidates], 1)]
        similar = {}
        if settings.mode == 'combined':
            for group in result.visual.groups:
                origin = next(item for item in group.origins if item.branch == 'visual')
                if origin.score is None:
                    raise ConsistencyError('INDEX_NOT_READY', 'Similar candidates require their stored vector scores')
                for member in group.members:
                    if member.sample_id != anchor_id and member.sample_id not in exact and member.pixel.exact_equal is not True:
                        similar[member.sample_id] = (origin.score, group.content_group_id)
        ordered = sorted(similar, key=lambda sample_id: (-similar[sample_id][0], sample_id))
        similar_limit = settings.max_similar_candidates if settings.mode == 'combined' else 0
        selected.extend(SelectedCandidate(sample_id=sample_id, content_group_id=similar[sample_id][1],
            kind='similar', rank=rank, score=similar[sample_id][0])
            for rank, sample_id in enumerate(ordered[:similar_limit], 1))
        return cls(anchor_id=anchor_id, scope_id=result.scope_id, mode=settings.mode,
            min_similarity=settings.min_similarity if settings.mode == 'combined' else None,
            exact=CandidateBranch(state='done', limit=settings.max_exact_candidates, matched=len(exact),
                selected=min(len(exact), settings.max_exact_candidates), truncated=len(exact) > settings.max_exact_candidates),
            similar=CandidateBranch(state='done' if settings.mode == 'combined' else 'disabled', limit=similar_limit,
                matched=len(similar) if settings.mode == 'combined' else None, selected=min(len(similar), similar_limit),
                truncated=len(similar) > similar_limit), candidates=selected)
