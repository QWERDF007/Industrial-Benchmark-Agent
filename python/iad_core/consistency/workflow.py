import json

from iad_core.consistency.agent_context import AnchorAgentContext
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.consistency.agent_review_models import AnchorAssessmentSubmission
from iad_core.consistency.identity import CandidateIdentity
from iad_core.consistency.identity_models import CandidateIdentityRecord
from iad_core.consistency.workflow_models import (AnomalyWorkflowAssess, AnomalyWorkflowObserve, BboxWorkflowAssess,
    BboxWorkflowObserve, WorkflowContextQuery, WorkflowSubmit)
from iad_core.storage.models import sample_uuid


class WorkflowImages:
    def __init__(self, anchor):
        self.public = {identity: sample_uuid(identity) for identity in
            [anchor.anchor_id, *[candidate.sample_id for candidate in anchor.candidates.candidates]]}
        self.internal = {public: internal for internal, public in self.public.items()}

    def translate(self, value, *, internal=False):
        identities = self.internal if internal else self.public
        if isinstance(value, str):
            return identities.get(value, value)
        if isinstance(value, list):
            return [self.translate(item, internal=internal) for item in value]
        if isinstance(value, dict):
            return {identities.get(key, key): self.translate(item, internal=internal) for key, item in value.items()}
        return value

    def candidate(self, identity):
        if identity not in self.internal:
            raise ValueError('图像身份不属于当前冻结清单')
        return self.internal[identity]


class ConsistencyWorkflow:
    def __init__(self, runtime, client=None):
        self.runtime, self.client = runtime, client
        self.checks = ConsistencyAgentJobs(runtime)
        self.review = ConsistencyAgentReview(runtime, client)
        self.identity = CandidateIdentity(runtime, client)

    def prepare(self, run_id, anchor_id, *, attempt=1):
        anchor = self.checks.attempt(run_id, anchor_id, attempt)
        if not anchor.candidates.candidates:
            self.checks.submit_empty(run_id, anchor_id, attempt=attempt)
            return {'completed': True, 'main_image_id': sample_uuid(anchor_id)}
        state = self.identity.prepare(run_id, anchor_id, attempt=attempt)
        result = self.review.finish_rules(run_id, anchor_id, attempt=attempt) if state.completed else None
        if state.completed and result is None and self.client is not None:
            self.review.plan(run_id, anchor_id, attempt=attempt)
        return {'completed': result is not None, 'main_image_id': sample_uuid(anchor_id)}

    def context(self, run_id, anchor_id, query, *, attempt=1):
        query = WorkflowContextQuery.model_validate(query)
        anchor = self.checks.attempt(run_id, anchor_id, attempt)
        snapshot = self.checks.snapshot(run_id)
        images = WorkflowImages(anchor)
        state = self.identity.read(run_id, anchor_id)
        base = {'task_type': snapshot.task_type, 'fingerprint': state.fingerprint,
            'gates':[gate.model_dump(mode='json', include={'candidate_id','gate_status','execution_status','reason','limitations',
                'source','required_region_pair_ids','region_checks'}) for gate in state.gates],
            'anchor': {'anchor_id': anchor_id, 'session_id': anchor.session_id, 'attempt': attempt, 'state': anchor.state},
            'candidate_ids': [candidate.sample_id for candidate in anchor.candidates.candidates],
            'gate_revisions': {candidate.sample_id: next((gate.revision for gate in state.gates if gate.candidate_id == candidate.sample_id), 0)
                for candidate in anchor.candidates.candidates}}
        if not state.completed:
            pending = set(base['candidate_ids']) - {gate.candidate_id for gate in state.gates if gate.execution_status == 'completed'}
            with self.runtime.db.connection() as connection:
                observed = [dict(candidate_id=row['candidate_id'], request_id=row['request_id'],
                    expected_revision=row['gate_revision'], observation_id=row['request_id']) for row in connection.execute(
                    '''SELECT candidate_id,gate_revision,request_id FROM consistency_gate_observations
                    WHERE job_id=? AND anchor_id=? AND page_index=-1 ORDER BY rowid''', (run_id, anchor_id))
                    if row['candidate_id'] in pending and row['gate_revision'] == base['gate_revisions'][row['candidate_id']]]
            return images.translate({**base, 'phase': 'gate', 'pending_candidate_ids': sorted(pending), 'gate_observations': observed})
        if not state.eligible_ids:
            return images.translate({**base, 'phase': 'submit', 'candidate_ids': [], 'assessments': []})
        if snapshot.task_type == 'bbox_defect':
            if anchor.visual_plan is None and self.client is not None:
                self.review.plan(run_id, anchor_id, attempt=attempt)
            requested = {'candidate_id': images.candidate(query.candidate_id)} if query.candidate_id else {}
            context = AnchorAgentContext(self.runtime).read(run_id, anchor_id, requested, attempt=attempt)
            for page in (context['anchor'].get('visual_plan') or {}).get('pages', []):
                page['phase'] = 'audit'
            for observation in context['observations']:
                for source in observation['facts']['sources'].values():
                    source.pop('quality_status', None)
                    source.pop('quality_source', None)
            return images.translate({**base, **context, 'phase': 'audit'})
        group = self.identity.review_group(run_id, anchor_id)
        labels = {}
        for member in group.members:
            evidence = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
            labels[member.image.sample_id] = {'main_label': {'PASS': 'OK', 'FAIL': 'NG'}[evidence.sources.left.sample.quality_status],
                'candidate_label': {'PASS': 'OK', 'FAIL': 'NG'}[evidence.sources.right.sample.quality_status]}
        return images.translate({**base, 'phase': 'audit', 'candidate_ids': state.eligible_ids,
            'label_comparisons': labels, 'assessments': [AnchorAgentContext.assessment(record) for record in self.review.assessments(run_id, anchor_id)]})

    def observe(self, run_id, anchor_id, request, *, attempt=1):
        anchor = self.checks.attempt(run_id, anchor_id, attempt)
        snapshot = self.checks.snapshot(run_id)
        model = AnomalyWorkflowObserve if snapshot.task_type == 'anomaly_detection' else BboxWorkflowObserve
        request = model.model_validate(request)
        images = WorkflowImages(anchor)
        data = images.translate(request.model_dump(), internal=True)
        if request.fingerprint != anchor.candidates.fingerprint:
            raise ValueError('观察请求与当前冻结指纹不一致')
        for identity in request.candidate_ids:
            images.candidate(identity)
        state = self.identity.read(run_id, anchor_id)
        revisions = {identity: next((gate.revision for gate in state.gates if gate.candidate_id == identity), 0) for identity in data['candidate_ids']}
        if data['gate_revisions'] != revisions:
            raise ValueError('观察请求使用了过期的资格版本')
        if request.phase == 'audit':
            if not state.completed:
                raise ValueError('资格尚未完成，不能进入标注审核')
            assessed = {record.submission.assessment.candidate_id for record in self.review.assessments(run_id, anchor_id)}
            pending = {identity for observation in self.review.observations(run_id, anchor_id)
                for identity in observation.request.candidate_ids if identity not in assessed}
            if pending and not set(data['candidate_ids']) <= pending:
                raise ValueError('先完成已观察候选的审核，再读取下一组')
            data.pop('phase')
            data['question'] = data.get('question') or snapshot.instruction
            observed = self.review.observe(run_id, anchor_id, data, attempt=attempt)
            return images.translate({**AnchorAgentContext.observed(observed),
                'phase':'gate' if any(finding.gate_dispute for finding in observed.result.observations) else 'audit'})
        if len(data['candidate_ids']) != 1:
            raise ValueError('身份观察每次只处理一张候选')
        candidate = data['candidate_ids'][0]
        revision = revisions[candidate]
        record = self.identity.observe(run_id, anchor_id, candidate, expected_revision=revision,
            request_id=request.request_id, attempt=attempt)
        with self.runtime.db.connection() as connection:
            connection.execute('''INSERT INTO consistency_gate_observations(
                job_id,anchor_id,candidate_id,gate_revision,request_id,page_index,fingerprint,record_json)
                VALUES(?,?,?,?,?,-1,?,?) ON CONFLICT DO NOTHING''',
                (run_id, anchor_id, candidate, revision, request.request_id, request.fingerprint, record.model_dump_json()))
        return images.translate({'phase': 'gate', 'candidate_id': candidate, 'observation_id': request.request_id,
            'expected_revision': revision, **record.model_dump(mode='json',include={'relation','reason','limitations','source',
                'required_region_pair_ids','region_checks'})})

    def assess(self, run_id, anchor_id, submission, *, attempt=1):
        anchor = self.checks.attempt(run_id, anchor_id, attempt)
        snapshot = self.checks.snapshot(run_id)
        model = AnomalyWorkflowAssess if snapshot.task_type == 'anomaly_detection' else BboxWorkflowAssess
        submission = model.model_validate(submission)
        images = WorkflowImages(anchor)
        candidate = images.candidate(submission.candidate_id)
        if candidate == anchor_id or submission.fingerprint != anchor.candidates.fingerprint:
            raise ValueError('提交不属于当前冻结候选')
        if submission.phase == 'gate':
            if submission.action == 'recheck':
                record = self.identity.recheck(run_id, anchor_id, candidate, expected_revision=submission.expected_revision,
                    request_id=submission.request_id, attempt=attempt)
            else:
                if len(submission.observation_ids) != 1:
                    raise ValueError('资格提交须引用本次候选的实际身份观察')
                with self.runtime.db.connection() as connection:
                    saved = connection.execute('''SELECT record_json FROM consistency_gate_observations WHERE job_id=? AND anchor_id=?
                        AND candidate_id=? AND gate_revision=? AND request_id=? AND page_index=-1''',
                        (run_id, anchor_id, candidate, submission.expected_revision, submission.observation_ids[0])).fetchone()
                if saved is None:
                    raise ValueError('身份观察不存在或不属于当前候选版本')
                record = self.identity.commit(run_id, anchor_id, CandidateIdentityRecord.model_validate_json(saved[0]),
                    expected_revision=submission.expected_revision, request_id=submission.request_id, attempt=attempt)
            return images.translate({'phase': 'gate', **record.model_dump(mode='json', include={'candidate_id', 'revision', 'gate_status', 'execution_status'})})
        if submission.action != 'commit':
            raise ValueError('身份复核应通过资格阶段提交')
        state = self.identity.read(run_id, anchor_id)
        gate = next((gate for gate in state.gates if gate.candidate_id == candidate), None)
        if not state.completed or gate is None or gate.gate_status != 'eligible' or gate.revision != submission.expected_revision:
            raise ValueError('候选未通过当前版本的资格验证')
        if snapshot.task_type == 'anomaly_detection':
            from iad_core.consistency.annotation_evaluation import AnnotationEvaluation
            member = next(member for member in self.identity.review_group(run_id, anchor_id).members if member.image.sample_id == candidate)
            evidence = self.runtime.consistency_service.evidence(member.comparison.evidence_id)
            assessment = AnnotationEvaluation.labels((evidence.sources.left, evidence.sources.right), candidate,
                [media.evidence_id for media in gate.media[:2]])
            saved = self.review.save_assessment(run_id, anchor_id, AnchorAssessmentSubmission(fingerprint=state.fingerprint,
                observation_ids=[], assessment=assessment, gate_revision=gate.revision,
                comparison=member.comparison.model_dump(exclude={'anchor_side'})), attempt=attempt, request_id=submission.request_id)
        else:
            if submission.assessment is None or submission.assessment.candidate_id != submission.candidate_id:
                raise ValueError('标注审核必须提供当前候选的完整评估')
            data = images.translate(submission.model_dump(), internal=True)
            saved = self.review.assess(run_id, anchor_id, {'fingerprint': state.fingerprint,
                'observation_ids': submission.observation_ids, 'assessment': data['assessment']}, attempt=attempt,
                expected_revision=submission.expected_revision, request_id=submission.request_id)
        return images.translate(AnchorAgentContext.assessment(saved))

    def submit(self, run_id, anchor_id, submission, *, attempt=1):
        submission = WorkflowSubmit.model_validate(submission)
        result = self.review.finalize(run_id, anchor_id, submission.model_dump(), attempt=attempt)
        return WorkflowImages(self.checks.anchor(run_id, anchor_id)).translate(result.model_dump(mode='json'))
