import hashlib
import json
from contextlib import contextmanager, ExitStack
from collections.abc import Iterator
from pydantic import Field
from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.identity import CandidateIdentity
from iad_core.consistency.identity_inputs import IdentityInputs
from iad_core.consistency.identity_models import PAIR_REVIEW_BATCH_SIZE, CandidateIdentityRecord, CandidateObservationRequest, candidate_pair_key
from iad_core.consistency.candidate_records import CandidateRecords
from iad_core.consistency.pair_locks import CandidatePairLocks


class PairReviewLink(AnalysisModel):
    anchor_id: str
    candidate_id: str


class PairReviewTask(AnalysisModel):
    pair_key: str
    links: list[PairReviewLink]
    estimated_annotation_count: int = Field(default=0, ge=0, description='仅用于批次调度的标注数量估计，程序判定仍需核验冻结证据')


class PairReviewResult(AnalysisModel):
    anchor_id: str
    record: CandidateIdentityRecord


class PairReviewReceipt(PairReviewTask):
    observation_owner_id: str
    observation_call_ids: list[str]


class ConsistencyPairReviews:
    def __init__(self, runtime, client=None):
        self.runtime, self.db, self.client = runtime, runtime.db, client
        self.checks = ConsistencyAgentJobs(runtime)
        self.identity = CandidateIdentity(runtime, client)

    def plan(self, run_id: str) -> list[PairReviewTask]:
        snapshot = self.checks.snapshot(run_id)
        snapshot_hash = hashlib.sha256(snapshot.model_dump_json().encode()).hexdigest()
        pairs, pending = {}, set()
        for anchor in self.checks.anchors(run_id):
            if anchor.candidates is None:
                continue
            active = anchor.state == 'RUNNING' and anchor.result is None
            current = {gate.candidate_id: gate for gate in self.identity.read(run_id, anchor.anchor_id).gates} if active else {}
            for candidate in anchor.candidates.candidates:
                if candidate.kind == 'exact':
                    continue
                key = candidate_pair_key(anchor.anchor_id, candidate.sample_id)
                pairs.setdefault(key, []).append(PairReviewLink(anchor_id=anchor.anchor_id, candidate_id=candidate.sample_id))
                if active and (candidate.sample_id not in current or current[candidate.sample_id].execution_status != 'completed'):
                    pending.add(key)
        result, owner_weights = [], {}
        with self.db.connection() as connection:
            sample_ids = sorted({identity for key, links in pairs.items() if key in pending for link in links
                for identity in (link.anchor_id, link.candidate_id)})
            counts = {row['sample_id']: row['n'] for row in connection.execute(
                '''SELECT value sample_id,(SELECT count(*) FROM annotations WHERE sample_id=requested.value) n
                    FROM json_each(?) requested''', (json.dumps(sample_ids),))}
            annotation_counts = {(row['anchor_id'], row['candidate_id']): row['annotation_count']
                for row in connection.execute('''SELECT captured.anchor_id,captured.candidate_id,
                    json_array_length(result.snapshot_json,'$.sources.left.annotations.annotations') +
                    json_array_length(result.snapshot_json,'$.sources.right.annotations.annotations') annotation_count
                    FROM consistency_anchor_evidence captured JOIN consistency_results result USING(evidence_id)
                    WHERE captured.job_id=?''', (run_id,))}
            for key, links in pairs.items():
                if key not in pending:
                    continue
                links = sorted(links, key=lambda link: link.anchor_id)
                owner = links[0]
                weight = annotation_counts.get((owner.anchor_id, owner.candidate_id),
                    counts.get(owner.anchor_id, 0) + counts.get(owner.candidate_id, 0))
                task = PairReviewTask(pair_key=key, links=links, estimated_annotation_count=weight)
                fingerprint = hashlib.sha256((snapshot_hash + key).encode()).hexdigest()
                saved = connection.execute('SELECT input_fingerprint FROM consistency_pair_reviews WHERE job_id=? AND pair_key=?',
                    (run_id, key)).fetchone()
                if saved is not None and saved[0] != fingerprint:
                    raise ValueError('图像对的冻结来源、模型或提示词发生变化')
                connection.execute('''INSERT INTO consistency_pair_reviews(job_id,pair_key,input_fingerprint,task_json)
                    VALUES(?,?,?,?) ON CONFLICT(job_id,pair_key) DO UPDATE SET task_json=excluded.task_json
                    WHERE consistency_pair_reviews.task_json IS NOT excluded.task_json''',
                    (run_id, key, fingerprint, task.model_dump_json()))
                owner_weights[owner.anchor_id] = max(owner_weights.get(owner.anchor_id, 0), weight)
                result.append(task)
        return sorted(result, key=lambda task: (task.estimated_annotation_count == 0,
            -owner_weights[task.links[0].anchor_id], task.links[0].anchor_id,
            -task.estimated_annotation_count, task.pair_key))

    @contextmanager
    def exclusive(self, run_id, pair_key):
        with CandidatePairLocks.exclusive(self.db.db_path, run_id, pair_key):
            yield

    @contextmanager
    def _pending(self, run_id: str, pair_keys: list[str]) -> Iterator[list[CandidateObservationRequest]]:
        if not pair_keys or len(pair_keys) > PAIR_REVIEW_BATCH_SIZE or len(set(pair_keys)) != len(pair_keys):
            raise ValueError(f'每批要求一至{PAIR_REVIEW_BATCH_SIZE}个不重复的图像对')
        with ExitStack() as locks:
            for key in sorted(pair_keys):
                locks.enter_context(self.exclusive(run_id, key))
            requests = []
            for key in pair_keys:
                with self.db.connection() as connection:
                    row = connection.execute('SELECT task_json,result_json FROM consistency_pair_reviews WHERE job_id=? AND pair_key=?',
                        (run_id, key)).fetchone()
                if row is None:
                    raise ValueError('图像对不属于当前冻结检查')
                if row['result_json'] is not None:
                    continue
                task = PairReviewTask.model_validate_json(row['task_json'])
                active = [link for link in task.links if self.checks.anchor(run_id, link.anchor_id).state == 'RUNNING']
                if not active:
                    continue
                owner = active[0]
                anchor = self.checks.anchor(run_id, owner.anchor_id)
                state = self.identity.prepare(run_id, owner.anchor_id, attempt=anchor.attempt)
                gate = next((gate for gate in state.gates if gate.candidate_id == owner.candidate_id), None)
                if gate is not None and gate.execution_status == 'completed':
                    result = PairReviewResult(anchor_id=owner.anchor_id, record=gate.model_copy(update={'pair_key': key}))
                    with self.db.connection() as connection:
                        connection.execute('UPDATE consistency_pair_reviews SET result_json=? WHERE job_id=? AND pair_key=?',
                            (result.model_dump_json(), run_id, key))
                    continue
                revision = gate.revision if gate else 0
                requests.append(CandidateObservationRequest(anchor_id=owner.anchor_id, candidate_id=owner.candidate_id,
                    expected_revision=revision, request_id=key+'-'+str(revision), attempt=anchor.attempt))
            yield requests

    def prepare_many(self, run_id: str, pair_keys: list[str]) -> int:
        context = self.runtime.jobs.context(run_id)
        with self._pending(run_id, pair_keys) as requests:
            prompts = self.checks.snapshot(run_id).prompts
            for request in requests:
                context.checkpoint()
                group = ConsistencyAgentEvidence(self.runtime).freeze(run_id, request.anchor_id,
                    checkpoint=context.checkpoint)
                member = next(member for member in group.members if member.image.sample_id == request.candidate_id)
                saved = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
                IdentityInputs(self.db).freeze(run_id, request.anchor_id, request.candidate_id,
                    (saved.sources.left, saved.sources.right), prompts)
            return len(requests)

    def review_many(self, run_id: str, pair_keys: list[str]) -> list[PairReviewReceipt]:
        with self._pending(run_id, pair_keys) as requests:
            if requests:
                for request, observed in self.identity.observe_many(run_id, requests):
                    key = candidate_pair_key(request.anchor_id, request.candidate_id)
                    result = PairReviewResult(anchor_id=request.anchor_id, record=observed.model_copy(update={'pair_key': key}))
                    with self.db.connection() as connection:
                        connection.execute('UPDATE consistency_pair_reviews SET result_json=? WHERE job_id=? AND pair_key=?',
                            (result.model_dump_json(), run_id, key))
                    self.review(run_id, key)
            return [receipt for key in pair_keys if (receipt := self.review(run_id, key)) is not None]

    def review(self, run_id: str, pair_key: str) -> PairReviewReceipt | None:
        with self.exclusive(run_id, pair_key):
            with self.db.connection() as connection:
                row = connection.execute('SELECT task_json,result_json FROM consistency_pair_reviews WHERE job_id=? AND pair_key=?',
                    (run_id, pair_key)).fetchone()
            if row is None:
                raise ValueError('图像对不属于当前冻结检查')
            task = PairReviewTask.model_validate_json(row['task_json'])
            active = [link for link in task.links if self.checks.anchor(run_id, link.anchor_id).state == 'RUNNING']
            if not active:
                return None
            if row['result_json'] is None:
                owner = active[0]
                anchor = self.checks.anchor(run_id, owner.anchor_id)
                previous = next((gate for gate in self.identity.read(run_id, owner.anchor_id).gates
                    if gate.candidate_id == owner.candidate_id), None)
                revision = previous.revision if previous else 0
                observed = self.identity.observe(run_id, owner.anchor_id, owner.candidate_id,
                    expected_revision=revision, request_id=pair_key + '-' + str(revision), attempt=anchor.attempt)
                observed = observed.model_copy(update={'pair_key': pair_key})
                result = PairReviewResult(anchor_id=owner.anchor_id, record=observed)
                with self.db.connection() as connection:
                    connection.execute('UPDATE consistency_pair_reviews SET result_json=? WHERE job_id=? AND pair_key=?',
                        (result.model_dump_json(), run_id, pair_key))
            else:
                result = PairReviewResult.model_validate_json(row['result_json'])
            if result.record.source == 'vision':
                IdentityInputs(self.db).validate_record(run_id, result.anchor_id, result.record)
            for link in active:
                anchor = self.checks.anchor(run_id, link.anchor_id)
                previous = next((gate for gate in self.identity.read(run_id, link.anchor_id).gates
                    if gate.candidate_id == link.candidate_id), None)
                if previous is not None and previous.execution_status == 'completed' and previous.pair_key == pair_key:
                    continue
                record = result.record
                if link.anchor_id != result.anchor_id:
                    checks = [check.model_copy(update={'main_media_id': check.candidate_media_id,
                        'candidate_media_id': check.main_media_id, 'main_description': check.candidate_description,
                        'candidate_description': check.main_description}) for check in record.region_checks]
                    record = record.model_copy(update={'region_checks': checks,
                        'media': [record.media[1], record.media[0], *record.media[2:]]})
                record = record.model_copy(update={'candidate_id': link.candidate_id,
                    'fingerprint': anchor.candidates.fingerprint, 'gate_id': 'pending', 'revision': 0})
                group = ConsistencyAgentEvidence(self.runtime).freeze(run_id, link.anchor_id, checkpoint=lambda: None)
                if record.source == 'vision':
                    member = next(member for member in group.members if member.image.sample_id == link.candidate_id)
                    evidence = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
                    plan = IdentityInputs(self.db).freeze(run_id, link.anchor_id, link.candidate_id,
                        (evidence.sources.left, evidence.sources.right), self.checks.snapshot(run_id).prompts)
                    record = record.model_copy(update={'geometry': plan.geometry, 'region_pairs': plan.region_pairs})
                self.identity.commit(run_id, link.anchor_id, record, expected_revision=previous.revision if previous else 0,
                    request_id=pair_key + '-commit-' + str(previous.revision if previous else 0), attempt=anchor.attempt)
            return PairReviewReceipt(**task.model_dump(), observation_owner_id=result.anchor_id,
                observation_call_ids=result.record.observation_call_ids)

    def invalidate(self, run_id, anchor_id, candidate_id, *, expected_revision, request_id, attempt):
        current = next(gate for gate in self.identity.read(run_id, anchor_id).gates if gate.candidate_id == candidate_id)
        with self.exclusive(run_id, current.pair_key), self.runtime.jobs.lock, self.db.connection() as connection:
            self.checks.attempt(run_id, anchor_id, attempt)
            current = next(gate for gate in CandidateRecords.gates(connection, run_id, anchor_id) if gate.candidate_id == candidate_id)
            pending = CandidateIdentityRecord(gate_id='pending', candidate_id=current.candidate_id,
                fingerprint=current.fingerprint, execution_status='pending', relation=None,
                pair_key=current.pair_key, reason='图像内容存在疑点，需要重新核对。')
            saved = CandidateRecords.append(connection, run_id, anchor_id, candidate_id, 'gate', expected_revision,
                request_id, pending)
            receipt = CandidateIdentityRecord.model_validate_json(saved['record_json']).model_copy(update={'revision': saved['revision']})
            if saved['revision'] <= current.revision:
                return receipt
            rows = connection.execute('''SELECT candidate.anchor_id,candidate.candidate_id,candidate.revision,candidate.record_json
                FROM consistency_candidate_records candidate JOIN consistency_anchor_runs anchor
                ON anchor.job_id=candidate.job_id AND anchor.anchor_id=candidate.anchor_id
                WHERE candidate.job_id=? AND candidate.phase='gate' AND anchor.state IN ('RUNNING','FAILED')
                AND anchor.result_json IS NULL
                AND json_extract(candidate.record_json,'$.pair_key')=? AND candidate.id IN (
                    SELECT MAX(id) FROM consistency_candidate_records WHERE job_id=? AND phase='gate'
                    GROUP BY anchor_id,candidate_id)''', (run_id, current.pair_key, run_id)).fetchall()
            for row in rows:
                gate = CandidateIdentityRecord.model_validate_json(row['record_json'])
                if gate.gate_status != 'eligible':
                    continue
                pending = CandidateIdentityRecord(gate_id='pending', candidate_id=gate.candidate_id,
                    fingerprint=gate.fingerprint, execution_status='pending', relation=None,
                    pair_key=gate.pair_key, reason='图像内容存在疑点，需要重新核对。')
                CandidateRecords.append(connection, run_id, row['anchor_id'], row['candidate_id'], 'gate', row['revision'],
                    request_id + '-reverse', pending)
            connection.execute('UPDATE consistency_pair_reviews SET result_json=NULL WHERE job_id=? AND pair_key=?',
                (run_id, current.pair_key))
        return receipt
