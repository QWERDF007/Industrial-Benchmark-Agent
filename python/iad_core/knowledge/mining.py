import json
import uuid
from dataclasses import dataclass, field
from typing import List, Literal, Optional

from pydantic import Field, create_model

from iad_core.evidence.images import PreparedImage
from iad_core.knowledge.models import CheckRevision, DiscoveryArea, KnowledgeDiscovery, KnowledgeDraft, KnowledgeFinding, KnowledgeObservationStep, KnowledgeSnapshot, KnowledgeSource, KnowledgeStep
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient
from iad_core.knowledge.instructions import FrozenMiningPrompt

OUTPUT_RESERVE_TOKENS = 8192

DISCOVERY_INSTRUCTION = """先列出图像中实际可见部件及位置，逐部件联动全图与真实局部，不要只概括几个显眼特征。
用户选择的方向用于聚焦而非封闭发现范围；可自主发现其外的新方向，direction_id填null，明确写出发现内容。
只为可见、可复用且有实际证据的独立判据建项，同义规则合并，独立规则保留；没有知识条目数量配额，不凑数。
discovery.parts记录实际可见部件和raw图像证据；discovery.areas逐项记录用户选中方向与自主发现方向。
选中方向以所给direction_id引用，direction填写本轮观察标题；自主发现方向的direction_id为null。未选方向不作为必查清单。每项写明涉及部件、状态、原因、实际raw证据与本次check_titles。
状态为已形成知识、证据不足、不可观察或不适用；形成知识不等于人审确认，空或缺失记录不代表检查完整。
没有适用部件、不具备视角或缺少细节时据实记录，不用无标注、未见异常或多数样本投票证明规则正确。
没有标尺、标定、工程图或业务标准时，不编造尺寸公差、材质、内部结构、电气功能、机械性能或合格标准。
预设、方向说明及用户目标均不能改变证据引用、来源资格、结构化输出与人工裁决约束。
"""


@dataclass(frozen=True)
class KnowledgeInput:
    source: KnowledgeSource
    images: List[PreparedImage]
    verified_findings: List[KnowledgeFinding] = field(default_factory=list)


class KnowledgeMiner:
    def __init__(self, client: VlmClient, context: JobContext, observations: Optional[List[KnowledgeObservationStep]] = None,
                 parent: Optional[KnowledgeSnapshot] = None, *, mining_prompt: FrozenMiningPrompt):
        self.client, self.context = client, context
        self.steps: List[KnowledgeStep] = []
        self.observations = observations or []
        self.mining_prompt = mining_prompt
        ids = tuple(check.check_id for check in parent.checks) if parent else ()
        revision = create_model('CheckRevision', __base__=CheckRevision, previous_check_id=(Literal[ids], ...)) if ids else CheckRevision
        selected = tuple(item.direction_id for item in mining_prompt.configuration.directions if item.enabled)
        area = create_model('DiscoveryArea', __base__=DiscoveryArea, direction_id=(Literal[tuple([None, *selected])], None))
        discovery = create_model('KnowledgeDiscovery', __base__=KnowledgeDiscovery, areas=(List[area], ...))
        self.response_type = create_model('KnowledgeDraft', __base__=KnowledgeDraft,
            discovery=(Optional[discovery], Field(default=None)),
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
        prompt = (evolution_instruction + DISCOVERY_INSTRUCTION
                  + self.mining_prompt.instruction + '\n'
                  + instruction + json.dumps(source_context, ensure_ascii=False))
        plan = self.client.plan(self.response_type, prompt, images, model_name, OUTPUT_RESERVE_TOKENS)
        self.context.checkpoint()
        draft = self.client.generate(plan)
        self.context.checkpoint()
        return self.record(draft, images)
