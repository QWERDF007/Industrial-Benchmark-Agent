from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPhase
import uuid
from dataclasses import dataclass
from typing import List, Literal, Optional

from pydantic import Field, create_model, field_validator

from iad_core.advisory.output_validation import repairable_output_error

from iad_core.evidence.images import PreparedImage
from iad_core.knowledge.trace import KnowledgeTrace
from iad_core.knowledge.support import KnowledgeSupport
from iad_core.storage.database import Database
from iad_core.knowledge.mining import KnowledgeInput, OUTPUT_RESERVE_TOKENS
from iad_core.knowledge.models import (FindingTarget, LearnedCheck, KnowledgeEvidence, KnowledgeFinding,
                                      KnowledgeJudgment, KnowledgeVerification, VerificationStep)
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient



@dataclass(frozen=True)
class VerificationOutcome:
    findings: List[KnowledgeFinding]
    evidence: List[KnowledgeEvidence]
    steps: List[VerificationStep]


class FindingVerification:
    def __init__(self, db: Database, client: VlmClient, context: JobContext):
        self.client, self.context = client, context
        self.support = KnowledgeSupport(db)
        self.steps: List[VerificationStep] = []

    def review(self, targets: List[FindingTarget], inputs: List[KnowledgeInput], references: List[PreparedImage],
               images: dict[str, PreparedImage], checks: List[LearnedCheck], model_name: str,
               purpose: str) -> VerificationOutcome:
        self.inputs, self.by_id, self.checks = inputs, images, checks
        groups = self.support.groups([item.source for item in inputs])
        self.owners = {image.evidence.evidence_id: item.source.sample_id for item in inputs for image in item.images}
        self.purpose = purpose
        self.reference_ids = {image.evidence.evidence_id for image in references if image.evidence.representation == 'raw'}
        self.overviews = {}
        for item in inputs:
            self.overviews.setdefault(item.source.sample_id, item.images[0])
        trace = KnowledgeTrace(self.context)
        trace.inputs(inputs)
        trace.register(KnowledgeEvidence(sample_id=target.sample_id, image=region.image) for target in targets for region in target.regions)
        result = self._evaluate(targets, references, model_name)
        judgments = {item.finding_id: item.model_copy(deep=True) for item in result.findings}
        findings = []
        for target in targets:
            judgment = judgments[target.finding_id]
            if judgment.conflicts:
                judgment.status = 'insufficient'
            target_group = groups.get(target.sample_id)
            if target_group is None or not any(eid in self.reference_ids and self.owners.get(eid) in groups
                       and groups[self.owners[eid]] != target_group for eid in judgment.evidence_ids):
                judgment.status = 'insufficient'
                judgment.limitations.append('缺少独立来源的比较证据')
            findings.append(KnowledgeFinding(**target.model_dump(), judgment=judgment))
        return VerificationOutcome(findings, [], self.steps)

    def _evaluate(self, targets: List[FindingTarget], references: List[PreparedImage], model_name: str) -> KnowledgeVerification:
        self.context.checkpoint()
        supplied = {image.evidence.evidence_id: image for image in references}
        for target in targets:
            overview = self.overviews[target.sample_id]
            supplied[overview.evidence.evidence_id] = overview
            supplied.update({region.image.evidence_id: self.by_id[region.image.evidence_id] for region in target.regions})
        findings = {f'finding_{index}':target.finding_id for index,target in enumerate(targets)}
        aliases = {identity:alias for alias,identity in findings.items()}
        payload = {'findings': [dict(target.model_dump(),finding_id=aliases[target.finding_id]) for target in targets],
                   'planned_roi_evidence_ids': {aliases[target.finding_id]: [region.image.evidence_id
                       for region in target.regions if region.image.representation == 'raw'] for target in targets},
                   'checks': [check.model_dump() for check in self.checks],
                   'sources': [{'source':item.source.model_dump(), 'overview_evidence_id':item.images[0].evidence.evidence_id}
                               for item in self.inputs if item.images[0].evidence.evidence_id in supplied]}
        prompt = FrozenMiningPrompt.model_validate(self.context.payload['mining_prompt']).render_context('待核验疑点',payload,phase=MiningPhase(self.purpose))
        images = list(supplied.values())
        ids = tuple(findings)
        allowed = set(supplied)
        titles = tuple(check.title for check in self.checks)

        @field_validator('finding_id', mode='before')
        def frozen_finding_reference(value):
            if isinstance(value, str) and value not in findings:
                raise repairable_output_error('frozen_finding_reference',
                    'finding_id必须逐字使用本次待核验疑点的引用：' + '、'.join(ids))
            return value

        judgment = create_model('KnowledgeJudgment', __base__=KnowledgeJudgment,
            __validators__={'frozen_finding_reference': frozen_finding_reference},
            finding_id=(Literal[ids], ...), evidence_ids=(List[Literal[tuple(sorted(allowed))]], Field(min_length=1)),
            affected_check_titles=(List[Literal[titles]] if titles else List[str], Field(..., **({} if titles else {'max_length': 0}))))
        response_type = create_model('KnowledgeVerification', __base__=KnowledgeVerification,
            findings=(List[judgment], Field(min_length=len(ids), max_length=len(ids))))
        plan = self.client.plan(response_type, prompt, images, model_name, OUTPUT_RESERVE_TOKENS)
        self.context.checkpoint()
        response = self.client.generate(plan)
        result = KnowledgeVerification(findings=[item.model_copy(update={'finding_id':findings[item.finding_id]})
            for item in response.findings])
        self.context.checkpoint()
        expected = {target.finding_id for target in targets}
        if len(result.findings) != len(expected) or {item.finding_id for item in result.findings} != expected:
            raise ValueError("Knowledge verification must cover each requested finding exactly once")
        for target in targets:
            judgment = next(item for item in result.findings if item.finding_id == target.finding_id)
            if not set(judgment.evidence_ids) <= allowed or not set(judgment.affected_check_titles) <= set(titles):
                raise ValueError("Knowledge verification references unknown evidence or checks")
            if not set(judgment.evidence_ids) & {region.image.evidence_id for region in target.regions
                                                if region.image.representation == 'raw'}:
                raise ValueError("Knowledge verification must cite the actual raw ROI")
        step = VerificationStep(step_id="verification_" + uuid.uuid4().hex, input_evidence_ids=list(supplied),
                                child_step_ids=[], result=result)
        self.steps.append(step)
        self.context.update(verification_steps=[step.model_dump() for step in self.steps])
        return result
