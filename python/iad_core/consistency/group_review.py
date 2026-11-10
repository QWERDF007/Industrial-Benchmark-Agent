import hashlib
import json
from datetime import datetime, timezone
from sqlite3 import Connection, Row
from uuid import uuid4

from pydantic import TypeAdapter

from iad_core.consistency.agent_assessments import AnchorAssessments
from iad_core.consistency.agent_models import AnchorResult
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import FrozenEvidence
from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.consistency.group_review_models import (GROUP_REVIEW_DISPOSITIONS, GroupReviewContext,
    GroupReviewDecision, GroupReviewReference, GroupReviewSubmission)
from iad_core.consistency.review_models import ReviewDisposition
from iad_core.storage.database import Database


class ConsistencyGroupReview:
    def __init__(self, db: Database):
        self.db = db

    @staticmethod
    def fingerprint(row: Row) -> str:
        frozen = {key: json.loads(row[key]) if key.endswith('_json') and row[key] else row[key]
            for key in ('job_id', 'anchor_id', 'result_json', 'group_json')}
        return hashlib.sha256(json.dumps(frozen, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

    @staticmethod
    def dispositions(run_id: str, connection: Connection) -> dict[tuple[str, str], ReviewDisposition]:
        rows = connection.execute('''SELECT anchor_id,result_fingerprint,action FROM consistency_group_decisions
            WHERE job_id=? AND id IN (SELECT MAX(id) FROM consistency_group_decisions
                WHERE job_id=? GROUP BY anchor_id,result_fingerprint)''', (run_id, run_id))
        return {(row['anchor_id'], row['result_fingerprint']): GROUP_REVIEW_DISPOSITIONS[row['action']] for row in rows}

    def _context(self, run_id: str, anchor_id: str, connection: Connection) -> GroupReviewContext:
        row = connection.execute('''SELECT a.*,j.status AS job_status FROM consistency_anchor_runs a
            JOIN job_runs j ON j.job_id=a.job_id WHERE a.job_id=? AND a.anchor_id=?''', (run_id, anchor_id)).fetchone()
        if row is None:
            raise LookupError('主图不属于当前作业')
        if row['state'] != 'COMPLETED' or row['job_status'] not in ('COMPLETED', 'PARTIAL'):
            raise ConsistencyError('SOURCE_UNAVAILABLE', '图组完成后才能提交整组复核')
        result = TypeAdapter(AnchorResult).validate_json(row['result_json'])
        group = FrozenAnalysisGroup.model_validate_json(row['group_json']) if row['group_json'] else None
        members = {member.image.sample_id: member for member in group.members} if group else {}
        assessments = {record.submission.assessment.candidate_id: record
            for record in AnchorAssessments.list(connection, run_id, anchor_id)}
        references = []
        for assessment in result.assessments:
            identity = assessment.candidate_id
            member, record = members[identity], assessments[identity]
            saved = connection.execute('SELECT snapshot_json FROM consistency_results WHERE evidence_id=?',
                (member.comparison.evidence_id,)).fetchone()
            evidence = FrozenEvidence.model_validate_json(saved['snapshot_json'])
            references.append(GroupReviewReference(candidate_id=identity, assessment_id=record.assessment_id,
                evidence_id=member.comparison.evidence_id, result_id=member.comparison.result_id,
                difference_ids=[item.difference_id for item in evidence.result.annotation.differences]))
        fingerprint = self.fingerprint(row)
        decisions = [GroupReviewDecision.model_validate_json(item['record_json']) for item in connection.execute(
            'SELECT record_json FROM consistency_group_decisions WHERE job_id=? AND anchor_id=? ORDER BY id', (run_id, anchor_id))]
        latest = next((decision for decision in reversed(decisions) if decision.request.result_fingerprint == fingerprint), None)
        return GroupReviewContext(job_id=run_id, anchor_id=anchor_id, result_fingerprint=fingerprint,
            references=references, decisions=decisions,
            disposition=GROUP_REVIEW_DISPOSITIONS[latest.request.action.kind] if latest else 'pending')

    def context(self, run_id: str, anchor_id: str) -> GroupReviewContext:
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            return self._context(run_id, anchor_id, connection)

    def submit(self, run_id: str, anchor_id: str, request: dict | GroupReviewSubmission) -> GroupReviewDecision:
        request = GroupReviewSubmission.model_validate(request)
        request_sha256 = hashlib.sha256(request.model_dump_json().encode()).hexdigest()
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            existing = connection.execute('''SELECT job_id,anchor_id,request_sha256,record_json
                FROM consistency_group_decisions WHERE client_request_id=?''', (str(request.client_request_id),)).fetchone()
            if existing is not None:
                if (existing['job_id'], existing['anchor_id'], existing['request_sha256']) != (run_id, anchor_id, request_sha256):
                    raise ValueError('client_request_id 已用于不同的图组或复核内容')
                return GroupReviewDecision.model_validate_json(existing['record_json'])
            context = self._context(run_id, anchor_id, connection)
            if request.result_fingerprint != context.result_fingerprint:
                raise ConsistencyError('SOURCE_UNAVAILABLE', '图组结果版本已变化，请重新读取后复核')
            decision = GroupReviewDecision(decision_id='group_decision_' + uuid4().hex, job_id=run_id, anchor_id=anchor_id,
                request=request, references=context.references, submitted_at=datetime.now(timezone.utc))
            connection.execute('''INSERT INTO consistency_group_decisions(decision_id,client_request_id,job_id,anchor_id,
                result_fingerprint,action,request_sha256,record_json) VALUES(?,?,?,?,?,?,?,?)''',
                (decision.decision_id, str(request.client_request_id), run_id, anchor_id, request.result_fingerprint,
                    request.action.kind, request_sha256, decision.model_dump_json()))
            return decision
