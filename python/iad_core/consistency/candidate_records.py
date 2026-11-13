import hashlib
import json
from typing import Literal

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.agent_review_models import AnchorAssessmentRecord, AnchorAssessmentSubmission, AnchorObservation, AnchorVisualStart
from iad_core.consistency.identity_models import CandidateIdentityRecord
from iad_core.consistency.candidate_selection import AnchorCandidates
from iad_core.consistency.identity_prompts import IDENTITY_PIPELINE, IDENTITY_PROMPT_VERSION


class CandidatePhaseRecord(AnalysisModel):
    record_id: int
    candidate_id: str
    phase: Literal['gate', 'audit']
    revision: int
    gate_revision: int
    request_id: str
    active: bool
    gate: CandidateIdentityRecord | None = None
    audit: AnchorAssessmentSubmission | None = None


class CandidateRecords:
    @staticmethod
    def enabled(connection, run_id):
        row = connection.execute("SELECT json_extract(payload_json,'$.request.consistency_check.review_pipeline') FROM job_runs WHERE job_id=?",
            (run_id,)).fetchone()
        return row is not None and row[0] in ('identity-v5', 'identity-v7', 'identity-v8')

    @staticmethod
    def gates(connection, run_id, anchor_id):
        rows = connection.execute('''SELECT revision,record_json FROM consistency_candidate_records
            WHERE job_id=? AND anchor_id=? AND phase='gate' AND id IN (
                SELECT MAX(id) FROM consistency_candidate_records WHERE job_id=? AND anchor_id=? AND phase='gate' GROUP BY candidate_id)
            ORDER BY id''', (run_id, anchor_id, run_id, anchor_id))
        return [CandidateIdentityRecord.model_validate_json(row['record_json']).model_copy(update={'revision': row['revision']}) for row in rows]

    @classmethod
    def audits(cls, connection, run_id, anchor_id):
        gates = {gate.candidate_id: gate for gate in cls.gates(connection, run_id, anchor_id)}
        observations = {item.observation_id: item.request for row in connection.execute('''SELECT observation_json
            FROM consistency_visual_requests WHERE job_id=? AND anchor_id=? AND observation_json IS NOT NULL''', (run_id, anchor_id))
            if (item := AnchorObservation.model_validate_json(row[0]))}
        rows = connection.execute('''SELECT id,candidate_id,gate_revision,record_json FROM consistency_candidate_records
            WHERE job_id=? AND anchor_id=? AND phase='audit' AND id IN (
                SELECT MAX(id) FROM consistency_candidate_records WHERE job_id=? AND anchor_id=? AND phase='audit' GROUP BY candidate_id)
            ORDER BY id''', (run_id, anchor_id, run_id, anchor_id))
        return [AnchorAssessmentRecord(assessment_id=row['id'], submission=submission)
            for row in rows if row['candidate_id'] in gates and gates[row['candidate_id']].gate_status == 'eligible'
            and gates[row['candidate_id']].revision == row['gate_revision']
            and (submission := AnchorAssessmentSubmission.model_validate_json(row['record_json']))
            and all(reference in observations and cls.observation_current(gates, observations[reference]) for reference in submission.observation_ids)]

    @staticmethod
    def observation_current(gates: dict[str, CandidateIdentityRecord], request: AnchorVisualStart) -> bool:
        return set(request.candidate_ids) == request.gate_revisions.keys() and all(identity in gates
            and gates[identity].gate_status == 'eligible' and gates[identity].revision == revision
            for identity, revision in request.gate_revisions.items())

    @staticmethod
    def replay(connection, run_id, anchor_id, request_id, digest):
        row = connection.execute('''SELECT * FROM consistency_candidate_records
            WHERE job_id=? AND anchor_id=? AND request_id=?''', (run_id, anchor_id, request_id)).fetchone()
        if row is not None and row['request_sha256'] != digest:
            raise ValueError('请求ID已用于不同的候选、阶段、版本或内容')
        return row

    @classmethod
    def append(cls, connection, run_id, anchor_id, candidate_id, phase, expected_revision, request_id, record):
        if not connection.in_transaction:
            connection.execute('BEGIN IMMEDIATE')
        version = connection.execute("""SELECT json_extract(payload_json,'$.request.consistency_check.review_pipeline'),
            json_extract(payload_json,'$.request.consistency_check.prompt_version') FROM job_runs WHERE job_id=?""", (run_id,)).fetchone()
        if version is None or tuple(version) != (IDENTITY_PIPELINE, IDENTITY_PROMPT_VERSION):
            raise ValueError('历史一致性作业只读保留')
        raw = record.model_dump(mode='json', exclude={'revision', 'gate_id', 'gate_status'} if phase == 'gate' else set())
        digest = hashlib.sha256(json.dumps([candidate_id, phase, expected_revision, raw], sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        if saved := cls.replay(connection, run_id, anchor_id, request_id, digest):
            return saved
        anchor = connection.execute('SELECT state,candidates_json FROM consistency_anchor_runs WHERE job_id=? AND anchor_id=?',
            (run_id, anchor_id)).fetchone()
        if anchor is None or anchor['state'] != 'RUNNING':
            raise ValueError('主图已停止，不能保存候选记录')
        frozen = AnchorCandidates.model_validate_json(anchor['candidates_json'])
        if record.fingerprint != frozen.fingerprint:
            raise ValueError('候选记录与当前冻结指纹不一致')
        if candidate_id not in {item.sample_id for item in frozen.candidates}:
            raise ValueError('候选不属于当前主图冻结清单')
        gate = next((item for item in cls.gates(connection, run_id, anchor_id) if item.candidate_id == candidate_id), None)
        current = gate.revision if gate else 0
        if current != expected_revision:
            raise ValueError('候选资格版本已变化，请重新读取上下文')
        if phase == 'gate' and record.execution_status == 'pending' and (gate is None or gate.gate_status != 'eligible'):
            raise ValueError('只有当前合格候选可以因审核疑点重新验证')
        if phase == 'audit' and (gate is None or gate.gate_status != 'eligible'):
            raise ValueError('只有当前资格有效的候选可以保存标注审核')
        revision = connection.execute('''SELECT COALESCE(MAX(revision),0)+1 FROM consistency_candidate_records
            WHERE job_id=? AND anchor_id=? AND candidate_id=? AND phase=?''', (run_id, anchor_id, candidate_id, phase)).fetchone()[0]
        if phase == 'gate':
            raw['gate_id'] = 'gate_' + hashlib.sha256(json.dumps([run_id, anchor_id, candidate_id, revision]).encode()).hexdigest()
        else:
            raw['gate_revision'] = current
        row = connection.execute('''INSERT INTO consistency_candidate_records(
            job_id,anchor_id,candidate_id,phase,revision,gate_revision,request_id,request_sha256,record_json)
            VALUES(?,?,?,?,?,?,?,?,?) RETURNING *''', (run_id, anchor_id, candidate_id, phase, revision,
            current if phase == 'audit' else revision, request_id, digest, json.dumps(raw, ensure_ascii=False))).fetchone()
        if phase == 'gate':
            connection.execute('''UPDATE consistency_anchor_runs SET visual_plan_json=NULL,
                phase=CASE WHEN ?='pending' THEN 'VERIFYING_CONTENT' ELSE phase END WHERE job_id=? AND anchor_id=?''',
                (record.execution_status, run_id, anchor_id))
        return row

    @classmethod
    def history(cls, connection, run_id, anchor_id):
        gates = {gate.candidate_id: gate for gate in cls.gates(connection, run_id, anchor_id)}
        audits = {record.assessment_id for record in cls.audits(connection, run_id, anchor_id)}
        result = []
        for row in connection.execute('SELECT * FROM consistency_candidate_records WHERE job_id=? AND anchor_id=? ORDER BY id', (run_id, anchor_id)):
            is_gate = row['phase'] == 'gate'
            result.append(CandidatePhaseRecord(record_id=row['id'], candidate_id=row['candidate_id'], phase=row['phase'],
                revision=row['revision'], gate_revision=row['gate_revision'], request_id=row['request_id'],
                active=gates[row['candidate_id']].revision == row['revision'] if is_gate else row['id'] in audits,
                gate=CandidateIdentityRecord.model_validate_json(row['record_json']).model_copy(update={'revision': row['revision']}) if is_gate else None,
                audit=None if is_gate else AnchorAssessmentSubmission.model_validate_json(row['record_json'])))
        return result
