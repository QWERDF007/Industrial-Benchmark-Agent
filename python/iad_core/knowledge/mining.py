import json
import uuid
from dataclasses import dataclass, field
from typing import List, Literal, Optional

from pydantic import Field, create_model, model_validator

from iad_core.evidence.images import PreparedImage
from iad_core.knowledge.models import CheckRevision, ObservedArea, ObservedDiscovery, KnowledgeLearning, KnowledgeDraft, KnowledgeFinding, KnowledgeObservationStep, KnowledgeTextRetraction, KnowledgeSource, KnowledgeStep
from iad_core.knowledge.evolution import KnowledgeEvolution
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient
from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPhase
from iad_core.knowledge.discovery import KnowledgeDiscoveryLinker
from iad_core.knowledge.mining_contract import MiningContract

OUTPUT_RESERVE_TOKENS = 8192



@dataclass(frozen=True)
class KnowledgeInput:
    source: KnowledgeSource
    images: List[PreparedImage]
    verified_findings: List[KnowledgeFinding] = field(default_factory=list)


class KnowledgeMiner:
    def __init__(self, client: VlmClient, context: JobContext, observations: Optional[List[KnowledgeObservationStep]] = None,
                 *, evolution: KnowledgeEvolution, mining_prompt: FrozenMiningPrompt):
        self.client, self.context = client, context
        self.steps: List[KnowledgeStep] = []
        self.observations = observations or []
        self.mining_prompt = mining_prompt
        parent = evolution.parent
        ids = tuple(check.check_id for check in parent.checks) if parent else ()
        has_statements = parent is not None and bool(parent.limitations or
            any(check.limitations or check.allowed_variations for check in parent.checks))
        revision = create_model('CheckRevision', __base__=CheckRevision, previous_check_id=(Literal[ids], ...)) if ids else CheckRevision
        selected = tuple(item.direction_id for item in mining_prompt.configuration.directions if item.enabled)
        area = create_model('ObservedArea', __base__=ObservedArea, direction_id=(Literal[tuple([None, *selected])], None))
        self.area_type = area
        discovery = create_model('ObservedDiscovery', __base__=ObservedDiscovery, areas=(List[area], ...))
        def validate_retractions(value):
            return evolution.validate_text_retractions(value)

        self.response_type = create_model('KnowledgeDraft', __base__=KnowledgeLearning,
            __validators__={'valid_text_retractions': model_validator(mode='after')(validate_retractions)},
            discovery=(Optional[discovery], Field(default=None)),
            text_retractions=(List[KnowledgeTextRetraction], Field(default_factory=list, **({} if has_statements else {'max_length': 0}))),
            revisions=(List[revision], Field(default_factory=list, **({} if ids else {'max_length': 0}))))

    def record(self, draft: KnowledgeDraft, images: List[PreparedImage]) -> KnowledgeStep:
        available = {image.evidence.evidence_id for image in images}
        referenced = {ref for check in draft.checks for ref in check.support_evidence_ids + check.counter_evidence_ids}
        referenced.update(suspect.evidence_id for suspect in draft.suspects)
        if not referenced.issubset(available):
            raise ValueError("Knowledge output references visual evidence that was not supplied")
        if draft.discovery:
            raw = {image.evidence.evidence_id for image in images if image.evidence.representation == 'raw'}
            observed = {eid for part in draft.discovery.parts for eid in part.evidence_ids}
            observed.update(eid for area in draft.discovery.areas for eid in area.evidence_ids)
            if observed - raw:
                raise ValueError('观察范围必须引用本次实际输入的raw图像证据')
            selected = {item.direction_id for item in self.mining_prompt.configuration.directions if item.enabled}
            for area in draft.discovery.areas:
                if area.direction_id is not None and area.direction_id not in selected:
                    raise ValueError(f'观察记录引用了未选方向：{area.direction_id}')
        step = KnowledgeStep(step_id="mining_" + uuid.uuid4().hex,
                             image_evidence_ids=[image.evidence.evidence_id for image in images],
                             child_step_ids=[], result=draft)
        self.steps.append(step)
        self.context.update(mining_steps=[item.model_dump(mode="json") for item in self.steps])
        return step

    def learn(self, comparison: dict, inputs: List[KnowledgeInput], model_name: str,
              evolution_context: Optional[dict] = None) -> KnowledgeStep:
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
        contract = MiningContract(images, self.response_type, self.area_type)
        prompt = (self.mining_prompt.render_context('冻结父版本候选', contract.project(evolution_context or {}),
              phase=MiningPhase.LEARN)
                  + '\n比较基准：' + json.dumps(contract.project(comparison), ensure_ascii=False)
                  + '\n来源：' + json.dumps(contract.project(source_context), ensure_ascii=False))
        plan = self.client.plan(contract.response_type, prompt, contract.images, model_name, OUTPUT_RESERVE_TOKENS)
        self.context.checkpoint()
        draft = contract.bind(self.client.generate(plan))
        self.context.checkpoint()
        linked = KnowledgeDiscoveryLinker(self.client, self.context).link(draft, model_name)
        return self.record(linked, images)
