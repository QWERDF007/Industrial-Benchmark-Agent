from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Callable

import numpy as np

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import FrozenScope, ImageRetrieve
from iad_core.consistency.query_features import QueryFeatures
from iad_core.duplicate.index import PixelIndex
from iad_core.feature.index_models import CorpusIndexInfo, GroupHit
from iad_core.feature.profiles import ImageEncoderConfig, ImageEncoders

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


@dataclass
class VisualQuery:
    profile_id: str | None = None
    info: CorpusIndexInfo | None = None
    hits: tuple[GroupHit, ...] = ()
    members: dict[str, tuple[str, ...]] = field(default_factory=dict)
    error: ConsistencyError | None = None


class VisualQueries:
    def __init__(self, runtime: 'WorkbenchRuntime'):
        self.runtime = runtime
        self.db = runtime.db

    def search(self, requests: list[ImageRetrieve], scope: FrozenScope, *, owner_id: str | None = None,
               config: ImageEncoderConfig | None = None, checkpoint: Callable[[], None] | None = None,
               prepare: bool = True) -> list[VisualQuery]:
        queries = [VisualQuery() for _ in requests]
        try:
            profile_id = ImageEncoders(self.db).profile(requests[0].profile_id).profile_id
            info = self.runtime.indexes.prepare(scope, profile_id)
            keys, vectors, positions = {}, [], []
            for request, query in zip(requests, queries):
                if checkpoint:
                    checkpoint()
                query.profile_id, query.info = profile_id, info
                try:
                    source = PixelIndex(self.db).get(request.query.sample_id) if request.query.kind == 'sample' else None
                    key = ('content', source.content_group_id) if source and source.content_group_id else (
                        request.query.kind, request.query.sample_id if request.query.kind == 'sample' else request.query.image_ref)
                    if key not in keys:
                        _, vector = QueryFeatures(self.db, self.runtime).vector(request.query, profile_id, owner_id=owner_id,
                            config=config, checkpoint=checkpoint, prepare=prepare)
                        keys[key] = len(vectors)
                        vectors.append(vector)
                    positions.append((query, keys[key]))
                except ConsistencyError as error:
                    query.error = error
            if positions:
                if checkpoint:
                    checkpoint()
                with self.runtime.indexes.acquire(scope, profile_id) as index:
                    if not index.info.vector_count and scope.sample_count:
                        raise ConsistencyError('INDEX_NOT_READY', 'Corpus vectors are not ready for this profile')
                    hits = index.search(np.concatenate(vectors), top_k=requests[0].top_k + 1)
                    members = {hit.group_id: index.members(hit.group_id) for row in hits for hit in row}
                    for query, position in positions:
                        query.info, query.hits, query.members = index.info, hits[position], members
                if checkpoint:
                    checkpoint()
        except ConsistencyError as error:
            for query in queries:
                if query.error is None:
                    query.error = error
        return queries
