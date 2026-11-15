import json
from collections import defaultdict
from functools import lru_cache
from collections.abc import Callable, Iterator
from typing import TYPE_CHECKING

from pydantic import model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.agent_models import ConsistencyCheckSnapshot
from iad_core.consistency.candidate_selection import AnchorCandidates
from iad_core.consistency.errors import ConsistencyError, ConsistencyErrorCode
from iad_core.consistency.models import ConsistencyRetrievalSettings, ImageRetrieve, Identifier
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.consistency.visual_queries import VisualQueries
from iad_core.duplicate.index import PixelIndex, PixelIndexEntry

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


class CandidateRetrievalError(AnalysisModel):
    code: ConsistencyErrorCode
    message: NonBlankText


class AnchorRetrievalResult(AnalysisModel):
    anchor_id: Identifier
    candidates: AnchorCandidates | None = None
    error: CandidateRetrievalError | None = None

    @model_validator(mode='after')
    def one_outcome(self):
        if (self.candidates is None) == (self.error is None):
            raise ValueError('检索必须返回候选清单或明确错误')
        return self


class CandidateRetrieval:
    """Select candidates from prepared corpus proofs; visual audits own pair verification."""

    def __init__(self, runtime: 'WorkbenchRuntime'):
        self.runtime, self.db = runtime, runtime.db

    @lru_cache(maxsize=4)
    def corpus(self, scope_id: str, sample_ids: tuple[str, ...]) -> tuple[dict[str, PixelIndexEntry], dict[str, dict[str, str]]]:
        with self.db.connection() as connection:
            rows = connection.execute('''SELECT p.* FROM sample_pixel_index p JOIN json_each(?) s
                ON s.value=p.sample_id''', (json.dumps(sample_ids),)).fetchall()
        entries = {row['sample_id']: PixelIndex.entry(row) for row in rows}
        if len(entries) != len(sample_ids) or any(entry.descriptor.decode_status != 'COMPLETE' for entry in entries.values()):
            raise ConsistencyError('INDEX_NOT_READY', '候选库像素索引尚未完整准备')
        groups = defaultdict(dict)
        for identity, entry in entries.items():
            if entry.content_group_id:
                groups[entry.content_group_id][identity] = entry.content_group_id
        return entries, groups

    def select(self, snapshot: ConsistencyCheckSnapshot, anchor_ids: list[str], checkpoint: Callable[[], None]) -> Iterator[AnchorRetrievalResult]:
        scope = snapshot.scopes.corpus
        with self.db.connection() as connection:
            ConsistencyScopes(self.db).assert_scans(scope, connection)
            ConsistencyScopes(self.db).assert_scans(snapshot.scopes.subjects, connection)
        entries, groups = self.corpus(scope.scope_id, tuple(sample.sample_id for sample in scope.samples))
        settings = ConsistencyRetrievalSettings.model_validate(snapshot.retrieval.model_dump(exclude_none=True))
        requests = [ImageRetrieve(query={'kind': 'sample', 'sample_id': identity}, corpus_scope=scope.selector,
            mode=settings.mode, **({'profile_id': snapshot.image_encoder.profile.profile_id,
                'top_k': settings.max_similar_candidates, 'min_similarity': settings.min_similarity}
                if settings.mode == 'combined' else {})) for identity in anchor_ids]
        visuals = VisualQueries(self.runtime).search(requests, scope, config=snapshot.image_encoder,
            checkpoint=checkpoint, prepare=False) if settings.mode == 'combined' else [None] * len(requests)
        for identity, visual in zip(anchor_ids, visuals):
            checkpoint()
            try:
                entry = entries.get(identity) or PixelIndex(self.db).get(identity)
                if entry is None or entry.descriptor.decode_status != 'COMPLETE':
                    raise ConsistencyError('INDEX_NOT_READY', '主图像素索引尚未完整准备')
                exact = {sid: group for sid, group in groups.get(entry.content_group_id, {}).items() if sid != identity}
                similar = {}
                if visual is not None:
                    if visual.error:
                        raise visual.error
                    if visual.info is None or visual.info.coverage.completed != scope.sample_count:
                        raise ConsistencyError('INDEX_NOT_READY', '候选库特征索引尚未完整准备')
                    used = 0
                    for hit in visual.hits:
                        if hit.group_id == entry.content_group_id:
                            continue
                        members = [sid for sid in visual.members[hit.group_id] if sid != identity]
                        if not members:
                            continue
                        for sid in members:
                            similar[sid] = (hit.score, hit.group_id)
                        used += 1
                        if used == settings.max_similar_candidates:
                            break
                yield AnchorRetrievalResult(anchor_id=identity,
                    candidates=AnchorCandidates.from_matches(identity, scope.scope_id, settings, exact, similar))
            except ConsistencyError as error:
                yield AnchorRetrievalResult(anchor_id=identity, error=CandidateRetrievalError(code=error.code, message=str(error)))
