import json
from pathlib import PurePosixPath
from collections import Counter
from contextlib import contextmanager
from sqlite3 import Row
from typing import IO
from urllib.parse import quote

from iad_core.consistency.agent_models import ConsistencyAnchorRun, ConsistencyCheckSnapshot
from iad_core.consistency.agent_assessments import AnchorAssessments
from iad_core.consistency.agent_evidence_records import AnchorEvidenceRecords
from iad_core.consistency.agent_result_models import (AnchorResultDetail,
    AnchorResultPage, AnchorResultSummary, ConsistencyCheckReport, AnchorDiagnostics, AnchorPhaseTiming, ModelRoleDiagnostics, ModelRolesDiagnostics, ConsistencySessionLocation)
from iad_core.consistency.agent_review_models import AnchorObservation, AnchorVisualRequest
from iad_core.consistency.annotation_inventory import AnnotationObservation
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.evidence_models import FrozenEvidence
from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.consistency.gallery import GalleryItem, GalleryPage, GalleryMemberPage
from iad_core.consistency.group_analysis_models import GroupAnalysisDraft, GroupAnalysisView
from iad_core.consistency.review_repository import ConsistencyDecisionRepository
from iad_core.consistency.review_states import ReviewStates
from iad_core.storage.database import Database
from iad_core.storage.models import sample_uuid
from iad_core.workbench.job_models import JobFailure
from iad_core.workbench.calls import ModelCalls


class ConsistencyAgentResults:
    def __init__(self, db: Database):
        self.db = db

    def session_location(self, session_id: str) -> ConsistencySessionLocation:
        with self.db.connection() as connection:
            row = connection.execute('''SELECT a.job_id,a.anchor_id,j.payload_json FROM consistency_anchor_runs a
                JOIN job_runs j ON j.job_id=a.job_id WHERE a.session_id=?''', (session_id,)).fetchone()
            if row is None:
                raise LookupError('主图审核会话不存在')
            return ConsistencySessionLocation(job_id=row['job_id'], submitted_at=json.loads(row['payload_json'])['submitted_at'],
                image_name=PurePosixPath(row['anchor_id'].split(':', 1)[1]).name,
                image_id=sample_uuid(row['anchor_id']))

    @contextmanager
    def _read(self, run_id: str):
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            row = connection.execute("SELECT status,payload_json FROM job_runs WHERE job_id=? AND job_type='ANALYSIS_WORKFLOW'",
                (run_id,)).fetchone()
            payload = json.loads(row['payload_json']) if row else {}
            frozen = payload.get('request', {}).get('consistency_check')
            if frozen is None:
                raise LookupError('主图审核作业不存在')
            yield connection, row['status'], payload, ConsistencyCheckSnapshot.model_validate(frozen)

    @staticmethod
    def _anchor(row: Row, job_status: str) -> ConsistencyAnchorRun:
        anchor = ConsistencyAnchorRun.model_validate({name: row[name] for name in ConsistencyAnchorRun.model_fields
            if name not in ('candidates', 'result', 'visual_plan')} | {'session_created': bool(row['session_created']),
                'candidates': json.loads(row['candidates_json']) if row['candidates_json'] else None,
                'visual_plan': json.loads(row['visual_plan_json']) if row['visual_plan_json'] else None,
                'result': json.loads(row['result_json']) if row['result_json'] else None})
        if anchor.state in ('PENDING', 'RUNNING') and job_status in ('INTERRUPTED', 'CANCELLED'):
            anchor.state = job_status
        return anchor

    def snapshot(self, run_id: str) -> ConsistencyCheckSnapshot:
        with self._read(run_id) as (_, _, _, snapshot):
            return snapshot

    def anchors(self, run_id: str) -> list[ConsistencyAnchorRun]:
        with self._read(run_id) as (connection, status, _, _):
            return [self._anchor(row, status) for row in connection.execute(
                'SELECT * FROM consistency_anchor_runs WHERE job_id=? ORDER BY ordinal', (run_id,))]

    def anchor(self, run_id: str, anchor_id: str) -> ConsistencyAnchorRun:
        with self._read(run_id) as (connection, status, _, _):
            row = connection.execute('SELECT * FROM consistency_anchor_runs WHERE job_id=? AND anchor_id=?',
                (run_id, anchor_id)).fetchone()
            if row is None:
                raise LookupError('主图不属于当前作业')
            return self._anchor(row, status)

    @staticmethod
    def references(run_id: str, anchor_id: str) -> str:
        return '/api/iad/consistency/checks/' + quote(run_id, safe='') + '/anchors/' + quote(anchor_id, safe='')

    def _summary(self, connection, row, status, payload, snapshot) -> AnchorResultSummary:
        anchor = self._anchor(row, status)
        original = set()
        if row['group_json']:
            group = FrozenAnalysisGroup.model_validate_json(row['group_json'])
            for member in group.members:
                saved = connection.execute('SELECT snapshot_json FROM consistency_results WHERE evidence_id=?',
                    (member.comparison.evidence_id,)).fetchone()
                evidence = FrozenEvidence.model_validate_json(saved[0])
                observation = AnnotationObservation.capture(evidence.sources.left.annotations, evidence.sources.right.annotations,
                    evidence.result.annotation, evidence.result.verification.relation,
                    reverse=member.comparison.anchor_side == 'right', matching=evidence.parameters.matching)
                original.update(observation.categories)
        original_categories = [category for category in ConflictCategory if category in original]
        result = anchor.result
        reviewed = result is not None and result.reason == 'MODEL_REVIEWED'
        verdict = result.overall.verdict if reviewed else result.verdict if result else None
        categories = ([ConflictCategory(result.overall.text)] if reviewed and verdict == 'MATERIAL' else [])
        errors = [error for error in payload['errors'] if error['sample_id'] == anchor.anchor_id]
        return AnchorResultSummary(job_id=anchor.job_id, anchor_id=anchor.anchor_id, session_id=anchor.session_id,
            state=anchor.state, phase=anchor.phase, attempt=anchor.attempt,
            **snapshot.retrieval.model_dump(), selected_exact=anchor.candidates.exact.selected if anchor.candidates else None,
            selected_similar=anchor.candidates.similar.selected if anchor.candidates else None, verdict=verdict,
            reason=result.reason if result else (errors[0].get('code') or anchor.phase) if errors else anchor.phase,
            categories=categories, conclusion=result.overall.text if reviewed else result.conclusion if result else None,
            original_categories=original_categories, original_conclusion=next(iter(original_categories), None),
            model_conclusion=categories[0] if categories else '无冲突' if reviewed and verdict == 'EQUIVALENT' else None,
            result_ref=self.references(anchor.job_id, anchor.anchor_id))

    def page(self, run_id: str, *, page: int = 1, page_size: int = 18) -> AnchorResultPage:
        if page < 1 or not 1 <= page_size <= 1000:
            raise ValueError('分页参数不合法')
        with self._read(run_id) as (connection, status, payload, snapshot):
            total = connection.execute('SELECT COUNT(*) FROM consistency_anchor_runs WHERE job_id=?', (run_id,)).fetchone()[0]
            rows = connection.execute('SELECT * FROM consistency_anchor_runs WHERE job_id=? ORDER BY ordinal LIMIT ? OFFSET ?',
                (run_id, page_size, (page - 1) * page_size))
            return AnchorResultPage(job_id=run_id, total=total,
                items=[self._summary(connection, row, status, payload, snapshot) for row in rows])

    def detail(self, run_id: str, anchor_id: str) -> AnchorResultDetail:
        with self._read(run_id) as (connection, status, payload, snapshot):
            row = connection.execute('SELECT * FROM consistency_anchor_runs WHERE job_id=? AND anchor_id=?',
                (run_id, anchor_id)).fetchone()
            if row is None:
                raise LookupError('主图不属于当前作业')
            anchor = self._anchor(row, status)
            requests = connection.execute('''SELECT request_json,observation_json FROM consistency_visual_requests
                WHERE job_id=? AND anchor_id=? ORDER BY rowid''', (run_id, anchor_id)).fetchall()
            return AnchorResultDetail(**self._summary(connection, row, status, payload, snapshot).model_dump(),
                session_created=anchor.session_created, trace_state=anchor.trace_state, trace_error=anchor.trace_error,
                snapshot_ref='/api/iad/consistency/checks/' + quote(run_id, safe='') + '/config',
                trace_ref=self.references(run_id, anchor_id) + '/session.jsonl' if anchor.session_created else None,
                diagnostics_ref=self.references(run_id, anchor_id) + '/diagnostics',
                candidates=anchor.candidates, visual_plan=anchor.visual_plan, result=anchor.result,
                assessments=AnchorAssessments.list(connection, run_id, anchor_id),
                requests=[AnchorVisualRequest.model_validate_json(request['request_json']) for request in requests],
                observations=[AnchorObservation.model_validate_json(request['observation_json']) for request in requests
                    if request['observation_json'] is not None],
                evidence=AnchorEvidenceRecords.list(connection, run_id, anchor_id),
                errors=[JobFailure.model_validate(error) for error in payload['errors'] if error['sample_id'] == anchor_id],
                error_history=[JobFailure.model_validate(error) for error in payload.get('error_history', []) if error['sample_id'] == anchor_id])

    def diagnostics(self, run_id: str, anchor_id: str) -> AnchorDiagnostics:
        with self._read(run_id) as (connection, status, _, snapshot):
            row = connection.execute('SELECT * FROM consistency_anchor_runs WHERE job_id=? AND anchor_id=?',
                (run_id, anchor_id)).fetchone()
            if row is None:
                raise LookupError('主图不属于当前作业')
            anchor = self._anchor(row, status)
            calls = [call for call in ModelCalls(self.db).list(run_id, connection) if call.sample_id == anchor_id]
            no_candidates = anchor.result is not None and anchor.result.reason == 'NO_CANDIDATES'
            phases = connection.execute('''WITH timeline AS (
                SELECT *,LEAD(started_at) OVER(ORDER BY id) next_at,LEAD(attempt) OVER(ORDER BY id) next_attempt
                FROM consistency_anchor_phases WHERE job_id=? AND anchor_id=?)
                SELECT attempt,phase,state,started_at,CASE
                    WHEN state NOT IN ('PENDING','RUNNING') THEN started_at
                    WHEN next_attempt=attempt THEN next_at END ended_at FROM timeline ORDER BY id''',
                (run_id, anchor_id)).fetchall()
            return AnchorDiagnostics(job_id=run_id, anchor_id=anchor_id, session_id=anchor.session_id,
                attempt=anchor.attempt, state=anchor.state, phase=anchor.phase, calls=calls,
                phase_recording='COMPLETE' if snapshot.phase_logging == 'timeline-v1' else 'UNAVAILABLE',
                phases=[AnchorPhaseTiming.model_validate(dict(phase)) for phase in phases],
                roles=ModelRolesDiagnostics(agent=ModelRoleDiagnostics.capture([call for call in calls if call.role == 'agent'],
                    complete=snapshot.model_call_logging == 'native-v1' or no_candidates),
                    vision=ModelRoleDiagnostics.capture([call for call in calls if call.role == 'vision'], complete=True)))

    def export(self, run_id: str, output: IO[str]) -> None:
        with self._read(run_id) as (connection, status, payload, snapshot):
            for row in connection.execute('SELECT * FROM consistency_anchor_runs WHERE job_id=? ORDER BY ordinal', (run_id,)):
                output.write(self._summary(connection, row, status, payload, snapshot).model_dump_json() + '\n')

    def report(self, run_id: str) -> ConsistencyCheckReport:
        with self._read(run_id) as (connection, status, payload, snapshot):
            rows = [self._summary(connection, row, status, payload, snapshot) for row in connection.execute(
                'SELECT * FROM consistency_anchor_runs WHERE job_id=? ORDER BY ordinal', (run_id,))]
        states, verdicts = Counter(row.state for row in rows), Counter(row.verdict for row in rows if row.verdict)
        original = Counter(row.original_conclusion for row in rows if row.original_conclusion)
        model = Counter(row.model_conclusion for row in rows if row.original_conclusion and row.model_conclusion)
        agreement = Counter('一致' if row.original_conclusion == row.model_conclusion else '不一致' for row in rows
            if row.original_conclusion and row.model_conclusion)
        return ConsistencyCheckReport(job_id=run_id, status=status, total=len(rows), completed=states['COMPLETED'],
            no_candidates=sum(row.reason == 'NO_CANDIDATES' for row in rows), original_conflicts=sum(original.values()),
            states={state: states[state] for state in ('PENDING','RUNNING','COMPLETED','FAILED','CANCELLED','INTERRUPTED')},
            verdicts={verdict: verdicts[verdict] for verdict in ('MATERIAL','EQUIVALENT','UNCERTAIN')},
            original_categories=dict(original), model_categories=dict(model), agreement={'一致':agreement['一致'], '不一致':agreement['不一致']})

    def gallery(self, run_id: str, *, page: int = 1, page_size: int = 200) -> GalleryPage:
        if page < 1 or not 1 <= page_size <= 1000:
            raise ValueError('分页参数不合法')
        items = []
        with self._read(run_id) as (connection, status, payload, snapshot):
            for row in connection.execute('SELECT * FROM consistency_anchor_runs WHERE job_id=? ORDER BY ordinal', (run_id,)):
                summary = self._summary(connection, row, status, payload, snapshot)
                if not summary.original_conclusion:
                    continue
                group = FrozenAnalysisGroup.model_validate_json(row['group_json'])
                evidence = [FrozenEvidence.model_validate_json(connection.execute(
                    'SELECT snapshot_json FROM consistency_results WHERE evidence_id=?', (member.comparison.evidence_id,)).fetchone()[0])
                    for member in group.members]
                histories = ConsistencyDecisionRepository(self.db).histories((item.result.evidence_id for item in evidence), connection)
                dispositions = {ReviewStates.disposition((difference.difference_id for difference in item.result.annotation.differences),
                    histories.get(item.result.evidence_id, [])) for item in evidence if item.result.annotation.differences}
                items.append(GalleryItem(group_id=summary.anchor_id, facts_state=group.facts_state, anchor=group.anchor,
                    member_count=len(group.members) + 1, candidate_count=len(group.members),
                    dataset_count=len({image.sample.dataset_id for image in [group.anchor, *(member.image for member in group.members)]}),
                    pair_count=len(group.members), difference_types=sorted({kind for item in evidence for kind in item.result.annotation.factual_difference_types}),
                    conflict_categories=[summary.original_conclusion], model_categories=summary.categories,
                    confirmed_conflict=any(item.result.annotation.confirmed_conflict for item in evidence),
                    model_state=summary.verdict or ('RUNNING' if summary.state == 'RUNNING' else 'FAILED' if summary.state == 'FAILED' else 'NOT_ANALYZED'),
                    model_conclusion=summary.model_conclusion, annotation_conclusion=summary.original_conclusion,
                    review_state=next(iter(dispositions)) if len(dispositions) == 1 else 'pending'))
        return GalleryPage(query_id=run_id, kind='conflicts', filters=[], model_filters=[],
            items=items[(page - 1) * page_size:page * page_size], total=len(items))

    def members(self, run_id: str, anchor_id: str) -> GalleryMemberPage:
        with self._read(run_id) as (connection, _, _, _):
            row = connection.execute('SELECT group_json FROM consistency_anchor_runs WHERE job_id=? AND anchor_id=?',
                (run_id, anchor_id)).fetchone()
            if row is None:
                raise LookupError('主图不属于当前作业')
            if row['group_json'] is None:
                raise LookupError('主图尚未生成比较证据')
            group = FrozenAnalysisGroup.model_validate_json(row['group_json'])
            return GalleryMemberPage(query_id=run_id, group_id=anchor_id, anchor=group.anchor, items=group.members, total=len(group.members))

    def analysis(self, run_id: str, anchor_id: str) -> GroupAnalysisView:
        detail = self.detail(run_id, anchor_id)
        result = detail.result if detail.result and detail.result.reason == 'MODEL_REVIEWED' else None
        return GroupAnalysisView(group_id=anchor_id, status=detail.state if detail.state != 'COMPLETED' or result else 'NOT_ANALYZED',
            run_id=run_id, result=GroupAnalysisDraft.model_validate(result.model_dump(include=set(GroupAnalysisDraft.model_fields))) if result else None,
            error='；'.join(error.message for error in detail.errors) or None,
            completed_batches=len(detail.observations), total_batches=len(detail.requests))
