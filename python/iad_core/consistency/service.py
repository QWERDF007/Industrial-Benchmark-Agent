import json
import threading
from typing import Callable,TYPE_CHECKING
from collections.abc import Iterator

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import ConsistencyCoverage, ConsistencyScopesSnapshot, CoverageCount, FrozenScope, ImageQuery, ImageRetrieve
from iad_core.consistency.retrieval_models import RetrievalBranchPage, RetrievalOrigin, RetrievalPage, RetrievalPaging
from iad_core.consistency.retrieval_paging import RetrievalPagination
from iad_core.consistency.retrieval_sources import SourceImage
from iad_core.consistency.retrieval_verification import RetrievalVerifier
from iad_core.consistency.retrieval_batch import RetrievalOutcome
from iad_core.consistency.visual_queries import VisualQueries, VisualQuery
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.duplicate.index import PixelIndex
from iad_core.feature.profiles import ImageEncoderConfig,ImageEncoders
from iad_core.feature.index_models import IndexLimits
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.consistency.evidence_models import ConsistencyCompare, ConsistencyResult, EvidenceBundle
from iad_core.contracts import ArtifactRef

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime
    from iad_core.evidence.consistency import ConsistencyEvidence


class ConsistencyService:
    def __init__(self, db: Database, *, paging: RetrievalPaging | None = None, runtime: 'WorkbenchRuntime | None' = None):
        self.db = db
        self.pagination = RetrievalPagination(paging)
        self._runtime=runtime
        self._evidence: 'ConsistencyEvidence | None'=None
        self._evidence_lock=threading.RLock()

    @property
    def evidence_store(self) -> 'ConsistencyEvidence':
        with self._evidence_lock:
            if self._evidence is None:
                from iad_core.evidence.consistency import ConsistencyEvidence
                self._evidence=ConsistencyEvidence(self.db)
            return self._evidence

    def close(self):
        with self._evidence_lock:
            if self._evidence is not None:self._evidence.images.close()

    @property
    def runtime(self) -> 'WorkbenchRuntime':
        if self._runtime is None:
            from iad_core.workbench.runtime import workbench
            self._runtime=workbench(self.db.db_path)
        return self._runtime

    def compare(self, request: ConsistencyCompare, *, checkpoint: Callable[[],None] | None = None,
                frozen_scopes: ConsistencyScopesSnapshot | None = None) -> ConsistencyResult:
        return self.evidence_store.compare(request,checkpoint=checkpoint,frozen_scopes=frozen_scopes)

    def evidence(self, evidence_id: str) -> EvidenceBundle:
        return self.evidence_store.get(evidence_id)

    def evidence_media(self, evidence_id: str, media_id: str, *, max_side: int | None = None) -> dict:
        return self.evidence_store.media(evidence_id,media_id,max_side=max_side)

    def evidence_export(self, evidence_id: str) -> ArtifactRef:
        return self.evidence_store.export(evidence_id)

    def retrieve(self, request: ImageRetrieve, *, owner_id: str | None = None) -> RetrievalPage:
        request = ImageRetrieve.model_validate(request)
        return self.pagination.page(self.retrieve_full(request, owner_id=owner_id), request.cursor)

    def retrieve_full(self, request: ImageRetrieve, *, owner_id: str | None = None, exclude_self: bool = True,
                      frozen_scope: FrozenScope | None = None, checkpoint: Callable[[],None] | None = None,
                      encoder: ImageEncoderConfig | None = None, prepare_query: bool = True) -> RetrievalPage:
        outcome = next(self.retrieve_many([request], owner_id=owner_id, exclude_self=exclude_self, frozen_scope=frozen_scope,
            checkpoint=checkpoint, encoder=encoder, prepare_query=prepare_query))
        if outcome.error is not None:
            raise outcome.error
        return outcome.page

    def retrieve_many(self, requests: list[ImageRetrieve], *, owner_id: str | None = None, exclude_self: bool = True,
                      frozen_scope: FrozenScope | None = None, checkpoint: Callable[[],None] | None = None,
                      encoder: ImageEncoderConfig | None = None, prepare_query: bool = True,
                      query_started: Callable[[ImageQuery], None] | None = None) -> Iterator[RetrievalOutcome]:
        requests = [ImageRetrieve.model_validate(request) for request in requests]
        if not requests:
            return
        first = requests[0]
        if any((request.corpus_scope, request.mode, request.profile_id, request.top_k) !=
                (first.corpus_scope, first.mode, first.profile_id, first.top_k) for request in requests):
            raise ConsistencyError('INVALID_SCOPE', 'A retrieval batch requires one corpus, mode, profile and neighbor budget')
        limit = self.runtime.indexes.limits.query_batch_size if first.mode != 'exact' else IndexLimits().query_batch_size
        for offset in range(0, len(requests), limit):
            if checkpoint:
                checkpoint()
            chunk = requests[offset:offset + limit]
            scope = ConsistencyScopes(self.db).resolve(first.corpus_scope)
            if frozen_scope is not None and scope.scope_id != frozen_scope.scope_id:
                raise ConsistencyError('SOURCE_UNAVAILABLE', 'Frozen retrieval corpus changed; start a new batch')
            visuals = VisualQueries(self.runtime).search(chunk, scope, owner_id=owner_id, config=encoder,
                checkpoint=checkpoint, prepare=prepare_query) if first.mode != 'exact' else [None] * len(chunk)
            for request, visual in zip(chunk, visuals):
                if checkpoint:
                    checkpoint()
                if query_started:
                    query_started(request.query)
                try:
                    page = self._retrieve(request, visual, owner_id=owner_id, exclude_self=exclude_self,
                        frozen_scope=scope, checkpoint=checkpoint, encoder=encoder)
                    yield RetrievalOutcome(request.query, page=page)
                except ConsistencyError as error:
                    yield RetrievalOutcome(request.query, error=error)

    def _retrieve(self, request: ImageRetrieve, visual_query: VisualQuery | None, *, owner_id: str | None,
                  exclude_self: bool, frozen_scope: FrozenScope, checkpoint: Callable[[],None] | None,
                  encoder: ImageEncoderConfig | None) -> RetrievalPage:
        if checkpoint:checkpoint()
        if request.query.kind == 'sample':
            query_id = request.query.sample_id
            query = SampleRepository(self.db).get(query_id)
            if query is None:
                raise ConsistencyError('REFERENCE_NOT_FOUND', 'Query sample does not exist')
            if query.is_excluded:
                raise ConsistencyError('INVALID_SCOPE', 'Excluded samples cannot be queried')
            source = SourceImage.read(query.image_path, PixelIndex(self.db).get(query_id))
        else:
            query_id = None
            source = self.runtime.temporary_images.read(request.query.image_ref, owner_id=owner_id)
        pixels = source.pixels()
        if checkpoint:checkpoint()
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            scope = ConsistencyScopes(self.db).resolve(request.corpus_scope, connection)
            if frozen_scope is not None and scope.scope_id!=frozen_scope.scope_id:
                raise ConsistencyError('SOURCE_UNAVAILABLE','Frozen retrieval corpus changed; start a new batch')
            rows = connection.execute('''SELECT p.* FROM sample_pixel_index p
                JOIN json_each(?) scope ON scope.value=p.sample_id ORDER BY p.sample_id''',
                (json.dumps([sample.sample_id for sample in scope.samples]),)).fetchall()
        entries = {row['sample_id']: PixelIndex.entry(row) for row in rows}
        counts = dict(completed=0, failed=0, unsupported=0, pending=scope.sample_count - len(rows))
        for entry in entries.values():
            counts[{'COMPLETE': 'completed', 'UNAVAILABLE': 'failed', 'UNSUPPORTED': 'unsupported'}[entry.descriptor.decode_status]] += 1
        corpus = CoverageCount(total=scope.sample_count, **counts)
        exact = RetrievalBranchPage(status='NOT_REQUESTED', corpus_coverage=CoverageCount(total=0))
        visual = exact.model_copy(deep=True)
        candidates, origins = {}, {}
        exact_ids, visual_ids = [], []
        if request.mode != 'visual':
            exact = RetrievalBranchPage(status='READY' if corpus.completed == corpus.total else 'PARTIAL', corpus_coverage=corpus)
            if pixels.descriptor.decode_status != 'COMPLETE':
                exact.status = 'UNSUPPORTED'
                exact.error_code, exact.reason = 'UNSUPPORTED_IMAGE', pixels.descriptor.reason
            else:
                for entry in entries.values():
                    if (entry.content_group_id and entry.descriptor.pixel_key == pixels.descriptor.pixel_key and (not exclude_self or entry.sample_id != query_id)):
                        candidates.setdefault(entry.content_group_id, []).append(entry)
                exact_ids = sorted(candidates)
                origins = {identity: [RetrievalOrigin(branch='exact', rank=rank)] for rank, identity in enumerate(exact_ids, 1)}
        profile_id = None
        if request.mode != 'exact':
            visual = RetrievalBranchPage(status='NOT_READY', corpus_coverage=CoverageCount(total=scope.sample_count, pending=scope.sample_count))
            try:
                profile_id = visual_query.profile_id
                if visual_query.info is not None:
                    visual.corpus_coverage = visual_query.info.coverage
                if visual_query.error is not None:
                    raise visual_query.error
                used = 0
                for hit in visual_query.hits:
                    members = [entries[identity] for identity in visual_query.members[hit.group_id] if not exclude_self or identity != query_id]
                    if not members:
                        continue
                    origins.setdefault(hit.group_id, []).append(RetrievalOrigin(branch='visual', rank=hit.rank, score=hit.score, profile_id=profile_id))
                    if hit.group_id not in candidates:
                        visual_ids.append(hit.group_id)
                        candidates[hit.group_id] = members
                    used += 1
                    if used == request.top_k:
                        break
                visual.status = 'READY' if visual.corpus_coverage.completed == scope.sample_count else 'PARTIAL'
            except ConsistencyError as error:
                if error.code in ('INVALID_SCOPE', 'REFERENCE_NOT_FOUND', 'SOURCE_UNAVAILABLE'):
                    raise
                visual.error_code, visual.reason = error.code, str(error)
        settings = ImageEncoders(self.db).read()
        verified = RetrievalVerifier(self.db).verify(scope, pixels, query_id, candidates, origins,checkpoint=checkpoint,
            resources=encoder or settings.resources)
        for branch, identities in [(exact, exact_ids), (visual, visual_ids)]:
            branch.groups = [verified.groups[identity] for identity in identities]
            branch.group_count = len(identities)
            branch.member_count = sum(group.member_count for group in branch.groups)
        for name, branch in [('exact', exact), ('visual', visual)]:
            if branch.status == 'READY' and any(member.pixel.exact_equal is None
                    for group in verified.groups.values() if any(origin.branch == name for origin in group.origins)
                    for member in group.members):
                branch.status = 'PARTIAL'
        completeness = ('PARTIAL' if any(branch.status not in ('READY', 'NOT_REQUESTED') for branch in (exact, visual))
            else 'EXACT_SCOPE' if request.mode == 'exact' else 'TOP_K')
        result = RetrievalPage(query=request.query, scope_id=scope.scope_id, mode=request.mode, profile_id=profile_id,
            exact=exact, visual=visual, coverage=ConsistencyCoverage(corpus=visual.corpus_coverage if request.mode == 'visual' else corpus,
                verification=verified.verification, annotation=verified.annotation),
            group_count=len(verified.groups), member_count=sum(group.member_count for group in verified.groups.values()),
            visual_k=request.top_k, retrieval_completeness=completeness)
        return result
