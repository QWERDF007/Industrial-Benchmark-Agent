import json
import uuid
from dataclasses import dataclass, field
from typing import List, Literal, Optional

from pydantic import Field, create_model

from iad_core.evidence.images import PreparedImage
from iad_core.knowledge.models import CheckRevision, KnowledgeDraft, KnowledgeFinding, KnowledgeObservationStep, KnowledgeSnapshot, KnowledgeSource, KnowledgeStep
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient

OUTPUT_RESERVE_TOKENS = 8192


@dataclass(frozen=True)
class KnowledgeInput:
    source: KnowledgeSource
    images: List[PreparedImage]
    verified_findings: List[KnowledgeFinding] = field(default_factory=list)


class KnowledgeMiner:
    def __init__(self, client: VlmClient, context: JobContext, observations: Optional[List[KnowledgeObservationStep]] = None,
                 parent: Optional[KnowledgeSnapshot] = None):
        self.client, self.context = client, context
        self.steps: List[KnowledgeStep] = []
        self.observations = observations or []
        ids = tuple(check.check_id for check in parent.checks) if parent else ()
        revision = create_model('CheckRevision', __base__=CheckRevision, previous_check_id=(Literal[ids], ...)) if ids else CheckRevision
        self.response_type = create_model('KnowledgeDraft', __base__=KnowledgeDraft,
            revisions=(List[revision], Field(default_factory=list, **({} if ids else {'max_length': 0}))))

    def record(self, draft: KnowledgeDraft, images: List[PreparedImage]) -> KnowledgeStep:
        available = {image.evidence.evidence_id for image in images}
        referenced = {ref for check in draft.checks for ref in check.support_evidence_ids + check.counter_evidence_ids}
        referenced.update(suspect.evidence_id for suspect in draft.suspects)
        if not referenced.issubset(available):
            raise ValueError("Knowledge output references visual evidence that was not supplied")
        step = KnowledgeStep(step_id="mining_" + uuid.uuid4().hex,
                             image_evidence_ids=[image.evidence.evidence_id for image in images],
                             child_step_ids=[], result=draft)
        self.steps.append(step)
        self.context.update(mining_steps=[item.model_dump(mode="json") for item in self.steps])
        return step

    def learn(self, instruction: str, inputs: List[KnowledgeInput], model_name: str,
              evolution_instruction: str = '') -> KnowledgeStep:
        self.context.checkpoint()
        images = [image for item in inputs for image in item.images]
        actual = {image.evidence.evidence_id for image in images}
        source_context = []
        for item in inputs:
            findings = []
            for finding in item.verified_findings:
                regions = [region.model_dump() for region in finding.regions if region.image.evidence_id in actual]
                if not regions:
                    continue
                findings.append(dict(finding.model_dump(exclude={'proposal', 'audit_finding', 'regions', 'judgment'}),
                    regions=regions, planned_region_count=len(finding.regions),
                    judgment=dict(finding.judgment.model_dump(), evidence_ids=[eid for eid in finding.judgment.evidence_ids if eid in actual])))
            observed = []
            for step in self.observations:
                rows = [dict(row.model_dump(exclude={'evidence_ids', 'suspects'}),
                    evidence_ids=[eid for eid in row.evidence_ids if eid in actual],
                    suspects=[value.model_dump() for value in row.suspects if value.evidence_id in actual])
                    for row in step.result.observations if row.sample_id == item.source.sample_id]
                if rows:
                    observed.append(dict(step_id=step.step_id, purpose=step.purpose, observations=rows))
            source_context.append(dict(source=item.source.model_dump(),
                image_evidence_ids=[image.evidence.evidence_id for image in item.images],
                verified_findings=findings, prior_observations=observed))
        prompt = evolution_instruction + instruction + json.dumps(source_context, ensure_ascii=False)
        plan = self.client.plan(self.response_type, prompt, images, model_name, OUTPUT_RESERVE_TOKENS)
        self.context.checkpoint()
        draft = self.client.generate(plan)
        self.context.checkpoint()
        return self.record(draft, images)
