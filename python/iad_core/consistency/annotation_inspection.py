from typing import Literal

from pydantic import Field, create_model, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.agent_review_models import AnchorAssessmentDecision, AnchorObservation, AnchorVisualResult, CandidateVisualObservation, GateDispute
from iad_core.consistency.annotation_issues import BboxAnnotationIssue
from iad_core.consistency.annotation_evaluation import AnnotationEvaluation
from iad_core.consistency.references import ReferenceAliases
from iad_core.evidence.images import PreparedImageBundle


ReviewIssue = create_model('ReviewIssue', __base__=AnalysisModel, **{
    name: (field.annotation, field) for name, field in BboxAnnotationIssue.model_fields.items() if name != 'media_ids'})


class AnnotationDecision(AnalysisModel):
    verdict: Literal['EQUIVALENT', 'MATERIAL', 'UNCERTAIN', 'GATE_DISPUTE']
    explanation: NonBlankText = Field(description='直接说明两侧框、类别和实际覆盖的比较结果，不复述流程。')
    issues: list[ReviewIssue] = Field(default_factory=list)
    limitations: list[NonBlankText] = Field(default_factory=list, description='只记录本次实际看不清或无法比较的具体部分。')
    disputed_regions: list[str] = Field(default_factory=list, description='仅资格争议时填写实际发生内容矛盾的区域短引用。')


class AnnotationInspection:
    def __init__(self, inputs):
        self.inputs = inputs
        request = inputs.request
        aliases = {request.anchor_id: 'main', **{identity: 'c' + str(index)
            for index, identity in enumerate(request.candidate_ids)}}
        for source in request.facts['sources'].values():
            side = aliases[source['sample_id']]
            aliases[source['evidence_id']] = side + '_image'
            for index, annotation in enumerate(source['annotations']):
                aliases[annotation['annotation_id']] = side + '_a' + str(index)
        for identity, candidate in request.facts['candidates'].items():
            for index, region in enumerate(candidate.get('gate', {}).get('verified_region_pair_ids', [])):
                aliases[region] = aliases[identity] + '_r' + str(index)
        self.references = ReferenceAliases(aliases)

    def normalize(self, response) -> AnchorVisualResult:
        observations = []
        request = self.inputs.request
        for identity in request.candidate_ids:
            alias = self.references.public[identity]
            decision = getattr(response.reviews, alias)
            media = request.facts['required_image_ids'][identity]
            if decision.verdict == 'GATE_DISPUTE':
                if decision.issues:
                    raise ValueError('资格争议不能同时提交标注差异')
                observation = CandidateVisualObservation(candidate_id=identity, description=decision.explanation,
                    media_ids=media, limitations=decision.limitations, gate_dispute=GateDispute(reason=decision.explanation,
                        region_pair_ids=self.references.translate(decision.disputed_regions, internal=True)))
            else:
                if decision.disputed_regions:
                    raise ValueError('普通标注判断不能包含资格争议区域')
                issues = [BboxAnnotationIssue.model_validate({**self.references.translate(issue.model_dump(), internal=True),
                    'media_ids': media}) for issue in decision.issues]
                assessment = AnchorAssessmentDecision(candidate_id=identity, verdict=decision.verdict,
                    explanation=decision.explanation, limitations=decision.limitations, issues=issues)
                observation = CandidateVisualObservation(candidate_id=identity, description=decision.explanation,
                    media_ids=media, limitations=decision.limitations, assessment=assessment)
            observations.append(observation)
        normalized = self.inputs.response_type(observations=observations)
        pending = AnchorObservation(observation_id='pending-validation', request=request, result=normalized)
        for observation in observations:
            if observation.assessment is not None:
                evidence = self.inputs.evidence[observation.candidate_id]
                AnnotationEvaluation.validate(observation.assessment.as_assessment(),
                    (evidence.sources.left, evidence.sources.right), observation.media_ids, observations=[pending],
                    matching=evidence.parameters.matching, gate=self.inputs.gates[observation.candidate_id])
        return normalized

    def plan(self, client):
        inspection = self

        @model_validator(mode='after')
        def validate_reviews(value):
            try:
                inspection.normalize(value)
            except ValueError as error:
                raise repairable_output_error('annotation_decision', str(error)) from error
            return value

        decisions = create_model('CandidateReviews', __base__=AnalysisModel, **{
            self.references.public[identity]: (AnnotationDecision, ...) for identity in self.inputs.request.candidate_ids})
        response_type = create_model('AnnotationReview', __base__=AnalysisModel,
            __validators__={'validate_reviews': validate_reviews}, reviews=(decisions, ...))
        facts = self.inputs.request.facts
        sources = {self.references.public[source['sample_id']]: source for source in facts['sources'].values()}
        context = self.references.translate({'facts': {**facts, 'sources': sources}})
        bundles = [PreparedImageBundle(self.references.public.get(bundle.evidence_id, bundle.evidence_id),
            self.references.translate(bundle.context), bundle.images) for bundle in self.inputs.images]
        return client.plan(response_type, self.inputs.prompt, bundles, client.resolve_model(),
            context=context, system_prompt=self.inputs.system_prompt)
