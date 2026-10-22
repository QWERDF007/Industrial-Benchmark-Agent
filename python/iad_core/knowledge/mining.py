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
SYNTHESIS_INSTRUCTION = """结合子批次观察记录及当前实际附带的代表性全图/ROI综合知识。子记录不是本轮重新看过的图，当前图像不能代替其他已观察局部。
保留有证据的判据、支持与反对引用、候选异常和限制。不要凭多数票抹去少数异常或冲突；
不得把某组独有特征推及全部来源，不得编造新的证据或遗漏未解决的疑点。
子批次结果："""


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

    def record(self, draft: KnowledgeDraft, images: List[PreparedImage], children: List[KnowledgeStep]) -> KnowledgeStep:
        if children:
            draft = draft.model_copy(deep=True)
            for check in draft.checks:
                for prior in [item for child in children for item in child.result.checks if item.identity == check.identity]:
                    for field in ('support_evidence_ids', 'counter_evidence_ids', 'allowed_variations', 'limitations'):
                        setattr(check, field, list(dict.fromkeys([*getattr(prior, field), *getattr(check, field)])))
                    if prior.status == 'conflicted':
                        check.status = 'conflicted'
            proposals = {(item.evidence_id, tuple(item.bbox_1000)): item for child in children for item in child.result.suspects}
            proposals.update({(item.evidence_id, tuple(item.bbox_1000)): item for item in draft.suspects})
            draft.suspects = list(proposals.values())
            draft.limitations = list(dict.fromkeys([*[limit for child in children for limit in child.result.limitations], *draft.limitations]))
        available = {image.evidence.evidence_id for image in images}
        for child in children:
            available.update(ref for check in child.result.checks
                             for ref in check.support_evidence_ids + check.counter_evidence_ids)
            available.update(suspect.evidence_id for suspect in child.result.suspects)
        referenced = {ref for check in draft.checks for ref in check.support_evidence_ids + check.counter_evidence_ids}
        referenced.update(suspect.evidence_id for suspect in draft.suspects)
        if not referenced.issubset(available):
            raise ValueError("Knowledge output references visual evidence that was not supplied")
        step = KnowledgeStep(step_id="mining_" + uuid.uuid4().hex,
                             image_evidence_ids=[image.evidence.evidence_id for image in images],
                             child_step_ids=[child.step_id for child in children], result=draft)
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
        if plan is not None:
            self.context.checkpoint()
            draft = self.client.generate(plan)
            self.context.checkpoint()
            return self.record(draft, images, [])
        if len(inputs) > 1:
            middle = len(inputs) // 2
            groups = [inputs[:middle], inputs[middle:]]
        elif len(images) > 2:
            bundles: dict[tuple[int, ...], List[PreparedImage]] = {}
            for image in images[1:]:
                bundles.setdefault(tuple(image.evidence.crop_bbox), []).append(image)
            details = list(bundles.values())
            if len(details) < 2:
                raise ValueError("One overview and its paired native detail exceed the model context")
            middle = len(details) // 2
            groups = [[KnowledgeInput(inputs[0].source, [images[0], *[image for bundle in part for image in bundle]], inputs[0].verified_findings)]
                      for part in [details[:middle], details[middle:]]]
        else:
            raise ValueError("One overview and its native detail exceed the model context; no knowledge version was published")
        children = [self.learn(instruction, group, model_name, evolution_instruction) for group in groups]
        self.context.checkpoint()
        prompt = evolution_instruction + SYNTHESIS_INSTRUCTION + json.dumps([child.model_dump(mode="json") for child in children], ensure_ascii=False)
        by_id = {image.evidence.evidence_id: image for image in images}
        owners = {image.evidence.evidence_id: item for item in inputs for image in item.images}
        required = set()
        for child in children:
            cited = {eid for check in child.result.checks for eid in check.counter_evidence_ids}
            cited.update(item.evidence_id for item in child.result.suspects)
            cited.update(check.support_evidence_ids[0] for check in child.result.checks if check.support_evidence_ids)
            if not cited:
                cited.add(child.image_evidence_ids[0])
            required.update(cited)
        for eid in list(required):
            owner = owners[eid]
            required.add(owner.images[0].evidence.evidence_id)
            required.update(image.evidence.evidence_id for image in owner.images
                            if image.evidence.crop_bbox == by_id[eid].evidence.crop_bbox)
        synthesis_images = [image for eid, image in by_id.items() if eid in required]
        plan = self.client.plan(self.response_type, prompt, synthesis_images, model_name, OUTPUT_RESERVE_TOKENS)
        if plan is None:
            raise ValueError("Knowledge synthesis exceeds the model context; partial observations remain in the job")
        self.context.checkpoint()
        draft = self.client.generate(plan)
        self.context.checkpoint()
        return self.record(draft, synthesis_images, children)
