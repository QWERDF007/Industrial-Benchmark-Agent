import hashlib
import json
from contextlib import contextmanager
from threading import Lock
from weakref import WeakValueDictionary

import numpy as np

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.identity import CandidateIdentity
from iad_core.consistency.identity_geometry import ImageCorrespondence
from iad_core.consistency.identity_inputs import IdentityInputPlan, IdentityInputs
from iad_core.consistency.identity_models import CandidateIdentityRecord
from iad_core.consistency.candidate_records import CandidateRecords


class PairReviewLink(AnalysisModel):
    anchor_id: str
    candidate_id: str


class PairReviewTask(AnalysisModel):
    pair_key: str
    links: list[PairReviewLink]


class PairReviewResult(AnalysisModel):
    anchor_id: str
    record: CandidateIdentityRecord


class PairReviewReceipt(PairReviewTask):
    observation_owner_id: str
    observation_call_ids: list[str]


class ConsistencyPairReviews:
    _locks = WeakValueDictionary()
    _locks_guard = Lock()

    def __init__(self, runtime, client=None):
        self.runtime, self.db, self.client = runtime, runtime.db, client
        self.checks = ConsistencyAgentJobs(runtime)
        self.identity = CandidateIdentity(runtime, client)

    def plan(self, run_id: str) -> list[PairReviewTask]:
        snapshot = self.checks.snapshot(run_id)
        snapshot_hash = hashlib.sha256(snapshot.model_dump_json().encode()).hexdigest()
        pairs = {}
        for anchor in self.checks.anchors(run_id):
            if anchor.state != 'RUNNING' or anchor.result is not None or anchor.candidates is None:
                continue
            current = {gate.candidate_id: gate for gate in self.identity.read(run_id, anchor.anchor_id).gates}
            for candidate in anchor.candidates.candidates:
                if candidate.sample_id in current and current[candidate.sample_id].execution_status == 'completed':
                    continue
                key = 'pair_' + hashlib.sha256(json.dumps(sorted((anchor.anchor_id, candidate.sample_id))).encode()).hexdigest()
                pairs.setdefault(key, []).append(PairReviewLink(anchor_id=anchor.anchor_id, candidate_id=candidate.sample_id))
        result = []
        with self.db.connection() as connection:
            annotation_counts = {(row['anchor_id'], row['candidate_id']): row['annotation_count']
                for row in connection.execute('''SELECT captured.anchor_id,captured.candidate_id,
                    json_array_length(result.snapshot_json,'$.sources.left.annotations.annotations') +
                    json_array_length(result.snapshot_json,'$.sources.right.annotations.annotations') annotation_count
                    FROM consistency_anchor_evidence captured JOIN consistency_results result USING(evidence_id)
                    WHERE captured.job_id=?''', (run_id,))}
            for key, links in pairs.items():
                task = PairReviewTask(pair_key=key, links=sorted(links, key=lambda link: link.anchor_id))
                fingerprint = hashlib.sha256((snapshot_hash + key).encode()).hexdigest()
                saved = connection.execute('SELECT input_fingerprint FROM consistency_pair_reviews WHERE job_id=? AND pair_key=?',
                    (run_id, key)).fetchone()
                if saved is not None and saved[0] != fingerprint:
                    raise ValueError('图像对的冻结来源、模型或提示词发生变化')
                connection.execute('''INSERT INTO consistency_pair_reviews(job_id,pair_key,input_fingerprint,task_json)
                    VALUES(?,?,?,?) ON CONFLICT(job_id,pair_key) DO UPDATE SET task_json=excluded.task_json''',
                    (run_id, key, fingerprint, task.model_dump_json()))
                result.append(task)
        return sorted(result, key=lambda task: -annotation_counts[(task.links[0].anchor_id, task.links[0].candidate_id)])

    @contextmanager
    def exclusive(self, run_id, pair_key):
        key = (str(self.db.db_path), run_id, pair_key)
        with self._locks_guard:
            lock = self._locks.setdefault(key, Lock())
        with lock:
            yield

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
            for link in active:
                anchor = self.checks.anchor(run_id, link.anchor_id)
                previous = next((gate for gate in self.identity.read(run_id, link.anchor_id).gates
                    if gate.candidate_id == link.candidate_id), None)
                if previous is not None and previous.execution_status == 'completed' and previous.pair_key == pair_key:
                    continue
                record = result.record
                if link.anchor_id != result.anchor_id:
                    geometry = record.geometry
                    if geometry.candidate_to_main is not None:
                        geometry = ImageCorrespondence(np.asarray(geometry.candidate_to_main), geometry).inverted().facts
                    pairs = [pair.model_copy(update={'main_window': pair.candidate_window, 'candidate_window': pair.main_window,
                        'main_media': pair.candidate_media, 'candidate_media': pair.main_media,
                        'source_annotations': [origin.model_copy(update={'side': 'candidate' if origin.side == 'main' else 'main'})
                            for origin in pair.source_annotations]}) for pair in record.region_pairs]
                    checks = [check.model_copy(update={'main_media_id': check.candidate_media_id,
                        'candidate_media_id': check.main_media_id, 'main_description': check.candidate_description,
                        'candidate_description': check.main_description}) for check in record.region_checks]
                    record = record.model_copy(update={'geometry': geometry, 'region_pairs': pairs, 'region_checks': checks,
                        'media': [record.media[1], record.media[0], *record.media[2:]]})
                record = record.model_copy(update={'candidate_id': link.candidate_id,
                    'fingerprint': anchor.candidates.fingerprint, 'gate_id': 'pending', 'revision': 0})
                group = ConsistencyAgentEvidence(self.runtime).freeze(run_id, link.anchor_id, checkpoint=lambda: None)
                member = next(member for member in group.members if member.image.sample_id == link.candidate_id)
                evidence = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
                IdentityInputs(self.db).save(run_id, link.anchor_id, link.candidate_id,
                    (evidence.sources.left, evidence.sources.right), self.checks.snapshot(run_id).prompts,
                    IdentityInputPlan(geometry=record.geometry, region_pairs=record.region_pairs))
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
                WHERE candidate.job_id=? AND candidate.phase='gate' AND anchor.state='RUNNING'
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
