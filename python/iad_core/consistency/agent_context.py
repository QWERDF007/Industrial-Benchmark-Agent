from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.consistency.agent_review_models import AnchorContextQuery, AnchorObservation, AnchorObservationReceipt, AnchorVisualStart, AnchorAssessmentRecord


class AnchorAgentContext:
    def __init__(self, runtime):
        self.checks = ConsistencyAgentJobs(runtime)
        self.review = ConsistencyAgentReview(runtime)

    @staticmethod
    def receipt(item: AnchorObservation) -> dict:
        return AnchorObservationReceipt(observation_id=item.observation_id, request_id=item.request.request_id,
            candidate_ids=item.request.candidate_ids).model_dump(mode='json')

    @staticmethod
    def observation(item: AnchorObservation, candidate_id: str) -> dict:
        facts = item.request.facts
        selected = facts['candidates'][candidate_id]
        return {'observation_id': item.observation_id, 'candidate_id': candidate_id,
            'request': item.request.model_dump(mode='json', include=set(AnchorVisualStart.model_fields)),
            'result': {'observations': [value.model_dump(mode='json') for value in item.result.observations if value.candidate_id == candidate_id]},
            'facts': {'anchor': {'sample_id': facts['anchor']['sample_id'],
                'evidence_id': selected['comparison']['evidence_id'], 'side': selected['comparison']['anchor_side']},
                'candidates': {candidate_id: selected},
                'sources': {key: {name: value for name, value in source.items()
                    if name not in {'visual_inputs', 'scan_ref', 'name', 'quality_source', 'issues'}} for key, source in facts['sources'].items()
                    if source['sample_id'] in (facts['anchor']['sample_id'], candidate_id)},
                'evidence': [{**{key: row[key] for key in ('annotation_observations', 'annotation_applicability')},
                    'verification': {key: row['verification'][key] for key in ('relation', 'registration')}}
                    for row in facts['evidence'] if row['evidence_id'] == selected['comparison']['evidence_id']]}}

    @staticmethod
    def assessment(item: AnchorAssessmentRecord) -> dict:
        return {'assessment_id': item.assessment_id,
            **item.submission.assessment.model_dump(mode='json', include={'candidate_id', 'verdict', 'conclusion'})}

    def read(self, run_id: str, anchor_id: str, query: dict, *, attempt: int) -> dict:
        anchor = self.checks.attempt(run_id, anchor_id, attempt)
        requested = AnchorContextQuery.model_validate(query).candidate_id
        if requested is not None and requested not in {item.sample_id for item in anchor.candidates.candidates}:
            raise ValueError('上下文候选不属于本场冻结清单')
        assessments = self.review.assessments(run_id, anchor_id)
        observations = self.review.observations(run_id, anchor_id)
        return {'anchor': anchor.model_dump(mode='json', include={'anchor_id', 'session_id', 'attempt', 'state', 'visual_plan'}),
            'fingerprint': anchor.candidates.fingerprint,
            'candidate_ids': [item.sample_id for item in anchor.candidates.candidates],
            'observation_index': [self.receipt(item) for item in observations],
            'observations': [self.observation(item, requested) for item in observations
                if requested is not None and requested in item.request.candidate_ids],
            'assessments': [self.assessment(item) for item in assessments]}
