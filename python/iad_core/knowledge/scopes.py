import hashlib
import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.dataset.registry import DatasetRegistry
from iad_core.dataset.path_safety import AuthorizedDatasetPaths
from iad_core.knowledge.models import (KnowledgeCoverage, KnowledgeKind, KnowledgeSnapshot, KnowledgeSourceItem,
                                      KnowledgeSourceMetadata, KnowledgeSourcePage, KnowledgeSourceQuery)
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.knowledge.recheck import KnowledgeRecheck
from iad_core.workbench.knowledge_review import KnowledgeReview
from iad_core.knowledge.sources import KnowledgeSources
from iad_core.storage.database import Database


class KnowledgeScopeOpen(AnalysisModel):
    dataset_id: str
    kind: KnowledgeKind
    objective: NonBlankText
    search: str = ''
    seed: Optional[int] = None
    starting_version_id: Optional[str] = None
    normal_version_id: Optional[str] = None


class KnowledgeScopeDefinition(KnowledgeScopeOpen):
    objective: NonBlankText = Field(exclude=True)
    scope_run_id: str
    origin_session_id: Optional[str]
    sources: List[KnowledgeSourceMetadata]
    fingerprint: str = Field(pattern='^[a-f0-9]{64}$')

    @model_validator(mode='after')
    def verify_frozen_content(self):
        content = dict(self.model_dump(mode='json', exclude={'fingerprint'}), objective=self.objective)
        if hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest() != self.fingerprint:
            raise ValueError('连续范围冻结内容或任务目标已变化，请重新建立明确范围')
        return self


class KnowledgeScopeSnapshot(AnalysisModel):
    search: str
    seed: Optional[int]
    scope_run_id: str
    dataset_id: str
    kind: KnowledgeKind
    objective: str
    status: Literal['ACTIVE', 'STOPPED']
    current_version_id: Optional[str]
    normal_version_id: Optional[str]
    total: int
    observed: int
    valid_observed: int
    stale: int
    excluded: int
    recheck: int
    unprocessed: int
    remaining: int
    pending_review: int
    run_ids: List[str]
    version_ids: List[str]
    active_run_ids: List[str]


@dataclass(frozen=True)
class ScopeState:
    definition: KnowledgeScopeDefinition
    status: str
    current: Optional[KnowledgeSnapshot]
    observed: set[str]
    stale: set[str]
    excluded: set[str]
    remaining: List[KnowledgeSourceMetadata]
    jobs: list[dict]
    version_ids: List[str]
    bound_session_id: str

    @property
    def recheck(self) -> set[str]:
        return self.current.recheck_sample_ids & {source.sample_id for source in self.definition.sources} if self.current else set()

    @property
    def pending_review(self) -> set[str]:
        if self.current is None:
            return set()
        pending = {item.sample_id for item in self.current.conflicts if not item.resolution or item.resolution.status != 'resolved'}
        pending.update(item.sample_id for item in self.current.findings if item.judgment.status != 'refuted')
        return pending & {source.sample_id for source in self.definition.sources}


class KnowledgeScopes:
    def __init__(self, db: Database):
        self.db = db
        self.sources = KnowledgeSources(db)
        self.repository = KnowledgeRepository(db)

    def open(self, request: KnowledgeScopeOpen, origin_session_id: Optional[str] = None) -> KnowledgeScopeSnapshot:
        config = DatasetRegistry(self.db).resolve(dataset_id=request.dataset_id)
        normal = self.repository.get(request.normal_version_id) if request.normal_version_id else None
        if normal and (normal.dataset_id != request.dataset_id or normal.kind != 'normal' or request.kind != 'defect'):
            raise ValueError('比较基准必须为同数据集良品知识，且仅用于异常范围')
        if request.starting_version_id:
            previous = self.repository.get(request.starting_version_id)
            if previous.dataset_id != request.dataset_id or previous.kind != request.kind:
                raise ValueError('起点知识须属于所选数据集与知识类型')
        _, items = self.sources.list_candidates(request.dataset_id, request.kind, normal, request.search)
        if request.seed is not None:
            items.sort(key=lambda item: hashlib.sha256(f'{request.seed}:{item.sample_id}'.encode()).digest())
        paths = AuthorizedDatasetPaths(self.db.db_path)
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            sources = [self.sources.capture_metadata(item.sample_id, item.qualification, paths=paths, connection=connection) for item in items]
        if not sources:
            raise ValueError('当前范围没有合格候选，未建立连续任务')
        scope_run_id = 'scope_' + uuid.uuid4().hex
        frozen = dict(request.model_dump(), scope_run_id=scope_run_id, origin_session_id=origin_session_id,
                      sources=[source.model_dump(mode='json') for source in sources])
        definition = KnowledgeScopeDefinition(**frozen, fingerprint=hashlib.sha256(json.dumps(frozen, sort_keys=True).encode()).hexdigest())
        with self.db.connection() as conn:
            conn.execute('BEGIN IMMEDIATE')
            if origin_session_id and self.active(origin_session_id, request.dataset_id, request.kind):
                raise ValueError('此会话已有活动连续范围，请先查询或停止该范围')
            conn.execute("""INSERT INTO agent_runs(run_id,task_id,session_id,goal,status,scope_json)
                VALUES(?,?,?,?,'ACTIVE',?)""", (scope_run_id, config.task.task_id,
                origin_session_id or 'workbench', request.objective, definition.model_dump_json()))
        return self.read(scope_run_id)

    def active(self, session_id: Optional[str], dataset_id: str, kind: str) -> Optional[str]:
        if not session_id:
            return None
        with self.db.connection() as conn:
            row = conn.execute("""SELECT run_id FROM agent_runs WHERE session_id=? AND status='ACTIVE'
                AND json_extract(scope_json,'$.dataset_id')=? AND json_extract(scope_json,'$.kind')=?
                ORDER BY id DESC LIMIT 1""", (session_id, dataset_id, kind)).fetchone()
        return row[0] if row else None

    def state(self, scope_run_id: str) -> ScopeState:
        with self.db.connection() as conn:
            row = conn.execute('SELECT scope_json,status,goal,session_id FROM agent_runs WHERE run_id=? AND scope_json IS NOT NULL', (scope_run_id,)).fetchone()
            rows = conn.execute("""SELECT job_id,status,payload_json FROM job_runs
                WHERE deleted_at IS NULL AND json_extract(payload_json,'$.request.scope_run_id')=? ORDER BY id""", (scope_run_id,)).fetchall()
            versions = conn.execute("""SELECT version_id FROM knowledge_versions
                WHERE json_extract(snapshot_json,'$.scope_run_id')=? ORDER BY created_at,version_id""", (scope_run_id,)).fetchall()
        if not row:
            raise LookupError('连续范围不存在或已删除')
        definition = KnowledgeScopeDefinition.model_validate(dict(json.loads(row['scope_json']), objective=row['goal']))
        DatasetRegistry(self.db).get(definition.dataset_id)
        jobs = [dict(run_id=item['job_id'], status=item['status'], payload=json.loads(item['payload_json'])) for item in rows]
        version_ids = [version[0] for version in versions]
        current_id = version_ids[-1] if version_ids else definition.starting_version_id
        head = self.repository.current(definition.dataset_id, definition.kind)
        edits = []
        while head and head.manual_edit and head.version_id != current_id:
            edits.append(head.version_id)
            head = self.repository.get(head.parent_version_id) if head.parent_version_id else None
        if head and head.version_id == current_id:
            version_ids.extend(reversed(edits))
            current_id = version_ids[-1] if version_ids else current_id
        current = self.repository.get(current_id) if current_id else None
        observed, visited = set(), set()
        ancestor = current
        while ancestor:
            if ancestor.version_id in visited or ancestor.observed_source_ids is None:
                raise ValueError('连续范围的知识链缺少可核验的观察记录')
            visited.add(ancestor.version_id)
            observed.update(ancestor.observed_source_ids)
            ancestor = self.repository.get(ancestor.parent_version_id) if ancestor.parent_version_id else None
        expected = {source.sample_id: source for source in definition.sources}
        observed &= expected.keys()
        for source in current.sources + current.comparison_sources if current else []:
            if source.sample_id in observed:
                expected[source.sample_id] = KnowledgeSourceMetadata.model_validate(source.model_dump(exclude={'pixel_sha256'}))
        normal = self.repository.get(definition.normal_version_id) if definition.normal_version_id else None
        available = self.sources.eligible(definition.dataset_id, definition.kind, normal)
        stale, excluded = set(), set()
        comparison = {source.sample_id for source in current.comparison_sources} if current else set()
        paths = AuthorizedDatasetPaths(self.db.db_path)
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            for sample_id, source in expected.items():
                try:
                    qualification = available.qualifications.get(sample_id, source.qualification)
                    if self.sources.capture_metadata(sample_id, qualification, paths=paths, connection=connection) != source:
                        stale.add(sample_id)
                    elif sample_id not in available.qualifications:
                        (excluded if sample_id in comparison else stale).add(sample_id)
                except (OSError, LookupError, ValueError):
                    stale.add(sample_id)
        return ScopeState(definition, row['status'], current, observed, stale, excluded,
            [source for source in definition.sources if source.sample_id not in observed | stale | excluded], jobs, version_ids, row['session_id'])

    def read(self, scope_run_id: str) -> KnowledgeScopeSnapshot:
        state = self.state(scope_run_id)
        current = state.current
        return KnowledgeScopeSnapshot(scope_run_id=scope_run_id, dataset_id=state.definition.dataset_id, kind=state.definition.kind,
            objective=state.definition.objective, search=state.definition.search, seed=state.definition.seed, status=state.status, normal_version_id=state.definition.normal_version_id, current_version_id=current.version_id if current else None,
            total=len(state.definition.sources), observed=len(state.observed), valid_observed=len(state.observed - state.stale - state.excluded),
            stale=len(state.stale), excluded=len(state.excluded), recheck=len(state.recheck), unprocessed=len(state.definition.sources) - len(state.observed), remaining=len(state.remaining),
            pending_review=len(state.pending_review),
            run_ids=[job['run_id'] for job in state.jobs], version_ids=state.version_ids,
            active_run_ids=[job['run_id'] for job in state.jobs if job['status'] in ('RUNNING', 'PENDING')])

    def source_page(self, query: KnowledgeSourceQuery) -> KnowledgeSourcePage:
        state = self.state(query.scope_run_id)
        definition = state.definition
        if (query.dataset_id != definition.dataset_id or query.kind != definition.kind
                or query.search not in ('', definition.search) or query.normal_version_id not in (None, definition.normal_version_id)
                or (query.uncovered_from_version and query.uncovered_from_version != (state.current.version_id if state.current else None))):
            raise ValueError('查询不得改变已冻结连续范围的类型、筛选或比较基准')
        with self.db.connection() as conn:
            relative_paths = {row['sample_id']: row['relative_path'] for row in conn.execute(
                'SELECT sample_id,relative_path FROM samples WHERE dataset_id=?', (definition.dataset_id,))}
        candidates = state.remaining
        if query.include_observed or query.recheck_from_version:
            normal = self.repository.get(definition.normal_version_id) if definition.normal_version_id else None
            eligible = self.sources.eligible(definition.dataset_id, definition.kind, normal).qualifications
            paths = AuthorizedDatasetPaths(self.db.db_path)
            with self.db.connection() as connection:
                connection.execute('BEGIN')
                candidates = [self.sources.capture_metadata(source.sample_id, eligible[source.sample_id], paths=paths, connection=connection)
                              for source in definition.sources if source.sample_id in eligible]
        if query.recheck_from_version:
            if not state.current or query.recheck_from_version != state.current.version_id:
                raise ValueError('连续范围仅重核验当前冻结判据，不得换用其他版本')
            candidates = [source for source in candidates if source.sample_id in state.current.recheck_sample_ids]
        start = (query.page - 1) * query.page_size
        coverage = KnowledgeCoverage(version_id=state.current.version_id if state.current else None, total=len(definition.sources),
            observed=len(state.observed - state.stale - state.excluded), stale=len(state.stale), remaining=len(state.remaining),
            pending_review=len(state.pending_review), recheck=len(state.recheck))
        return KnowledgeSourcePage(dataset_id=definition.dataset_id, kind=definition.kind, normal_version_id=definition.normal_version_id,
            total=len(candidates), unavailable_source_count=len(state.stale), page=query.page, page_size=query.page_size,
            coverage=coverage, items=[KnowledgeSourceItem(sample_id=source.sample_id, relative_path=relative_paths[source.sample_id],
                qualification=source.qualification) for source in candidates[start:start + query.page_size]])

    def validate_group(self, scope_run_id: str, sample_ids: List[str], parent_version_id: Optional[str], fingerprint: Optional[str] = None, normal_version_id: Optional[str] = None) -> str:
        state = self.state(scope_run_id)
        if normal_version_id != state.definition.normal_version_id:
            raise ValueError('连续范围必须使用明确冻结的良品比较基准')
        if state.status != 'ACTIVE':
            raise ValueError('连续范围已停止，明确继续后才可执行新图组')
        if fingerprint is not None and fingerprint != state.definition.fingerprint:
            raise ValueError('连续范围冻结内容已变化，请重新建立范围')
        if parent_version_id != (state.current.version_id if state.current else None):
            raise ValueError('须显式使用此连续范围刚发布的知识版本，不得换用其他分支')
        allowed = {source.sample_id for source in state.remaining}
        if state.current:
            allowed.update(state.current.recheck_sample_ids & state.observed - state.stale - state.excluded)
        if state.current and KnowledgeRecheck(KnowledgeReview(self.db)).pending(state.current):
            allowed.update(state.observed - state.excluded)
        if not set(sample_ids) <= allowed:
            raise ValueError('图组含已观察、已失效或冻结连续范围之外的来源；已观察图仅用于明确人工处置重核验')
        return state.definition.fingerprint

    def set_active(self, scope_run_id: str, active: bool, session_id: Optional[str] = None) -> KnowledgeScopeSnapshot:
        state = self.state(scope_run_id)
        target_session = session_id or state.bound_session_id
        with self.db.connection() as conn:
            conn.execute('BEGIN IMMEDIATE')
            existing = self.active(target_session, state.definition.dataset_id, state.definition.kind) if target_session != 'workbench' else None
            if active and existing and existing != scope_run_id:
                raise ValueError('当前会话已有其他活动连续范围，请先明确停止或使用另一会话')
            conn.execute("UPDATE agent_runs SET status=?,session_id=COALESCE(?,session_id),finished_at=? WHERE run_id=?",
                ('ACTIVE' if active else 'STOPPED', session_id, None if active else datetime.now(timezone.utc).isoformat(), scope_run_id))
        return self.read(scope_run_id)
