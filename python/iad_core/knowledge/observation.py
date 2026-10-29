import json
import uuid
from typing import List, Optional

from iad_core.knowledge.trace import KnowledgeTrace
from iad_core.knowledge.mining import KnowledgeInput, OUTPUT_RESERVE_TOKENS
from iad_core.evidence.images import EvidenceImages, PreparedImage
from iad_core.knowledge.models import KnowledgeCheck, KnowledgeDraft, KnowledgeObservationStep, KnowledgeSnapshot
from iad_core.knowledge.observation_contract import ObservationContract
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient

OBSERVATION_INSTRUCTION = """按purpose观察所给判据与实际图像：current核对冻结旧判据与新图，comparison比较相关新旧图，revision核验拟修订判据在新旧图上的适用性。记录独立观察，不直接修改判据。
输出固定完整矩阵：每个sources.source_key为行，每个checks.check_key为该行必填单元。每个来源×判据恰好一项；无法观察时明确unobservable。
单元内只写观察内容，evidence_ids及suspects.evidence_id只使用该来源raw_evidence_keys中的短引用。不输出长sample_id或check_id；真实引用由冻结映射还原。
supports仅说明所见符合旧判据，不证明样本正常；contradicts仅说明与旧判据不一致，不裁决知识或图片哪方错误。
结合全图结构、局部、位置、光照和正常替代解释。只引用本轮该样本实际raw图像，Mask只用于定位。
不要凭候选资格、数量、多数票或随后生成的规则消除矛盾。局部疑点用实际图像归一化坐标定位到suspects。
冻结观察请求："""


class KnowledgeObserver:
    def __init__(self, client: VlmClient, context: JobContext):
        self.client, self.context = client, context
        self.steps: List[KnowledgeObservationStep] = []
        self.parent: Optional[KnowledgeSnapshot] = None

    def observe(self, version: KnowledgeSnapshot, inputs: List[KnowledgeInput], model_name: str) -> List[KnowledgeObservationStep]:
        self.parent = version
        if version.checks:
            self.context.update(phase='OBSERVING_PRESET')
            self.evaluate(version.version_id, version.checks, inputs, model_name)
        return self.steps

    def revisions(self, version: KnowledgeSnapshot, draft: KnowledgeDraft, checks: List[KnowledgeCheck],
                  inputs: List[KnowledgeInput], model_name: str, images: EvidenceImages):
        prior = {check.check_id: check for check in version.checks}
        revised = {revision.previous_check_id: revision for revision in draft.revisions}
        retired = {cid for cid, revision in revised.items() if not revision.current_check_titles}
        if retired:
            self.compare(version, inputs, model_name, images, affected=retired)
        changed = [check for check in checks if any(cid in revised and (len(check.predecessor_check_ids) != 1
            or len(revised[cid].current_check_titles) != 1 or check.identity != prior[cid].identity
            or not set(check.allowed_variations) <= set(prior[cid].allowed_variations))
            for cid in check.predecessor_check_ids)]
        for check in checks:
            supported = {item.sample_id for step in self.steps if step.purpose == 'current'
                         for item in step.result.observations if item.status == 'supports' and item.check_id == check.check_id}
            check.recheck_sample_ids = sorted(set(check.recheck_sample_ids) - supported)
        if not changed:
            return
        affected = {cid for check in changed for cid in check.predecessor_check_ids}
        self.compare(version, inputs, model_name, images, affected=affected, proposals=changed)
        for check in changed:
            values = [item for step in self.steps if step.purpose == 'revision'
                      for item in step.result.observations if item.check_id == check.check_id]
            observed_support = {eid for item in values if item.status == 'supports' for eid in item.evidence_ids}
            old_support = {eid for cid in check.predecessor_check_ids for eid in prior[cid].support_evidence_ids}
            old_owners = {record.sample_id for record in version.evidence if record.image.evidence_id in old_support}
            covered = {item.sample_id for item in values if item.status == 'supports'}
            check.recheck_sample_ids = sorted((set(check.recheck_sample_ids) | old_owners) - covered)
            check.support_evidence_ids = [eid for eid in check.support_evidence_ids if eid in observed_support]
            if any(item.status == 'unobservable' for item in values) and check.status == 'supported':
                check.status = 'provisional'
                check.limitations = list(dict.fromkeys([*check.limitations, '拟修订判据在相关新旧证据中存在不可观察部分']))

    def compare(self, version: KnowledgeSnapshot, inputs: List[KnowledgeInput], model_name: str, images: EvidenceImages,
                *, affected: Optional[set[str]] = None, proposals: Optional[List[KnowledgeCheck]] = None):
        affected = affected if affected is not None else {item.check_id for step in self.steps if step.purpose == 'current'
                    for item in step.result.observations if item.status == 'contradicts'}
        checks = [check for check in version.checks if check.check_id in affected]
        if not checks:
            return
        self.context.update(phase='RECHECKING_CRITERIA' if proposals else 'COMPARING_KNOWLEDGE')
        selected = {next((eid for eid in check.support_evidence_ids if any(
                    record.image.evidence_id == eid and record.image.representation == 'raw' for record in version.evidence)), None)
                    for check in checks}
        records = [record for record in version.evidence if record.image.evidence_id in selected]
        comparison = []
        for source in version.sources:
            support = [record for record in records if record.sample_id == source.sample_id]
            if not support:
                continue
            all_views = [record for record in version.evidence if record.sample_id == source.sample_id]
            overview = next((record for record in all_views if record.image.role in ('normal', 'overview')
                            and record.image.representation == 'raw'), None)
            if overview is None:
                raise ValueError('旧判据缺少真实全图比较证据')
            boxes = {tuple(record.image.crop_bbox) for record in support}
            chosen = {record.image.evidence_id: record for record in [overview, *[
                record for record in all_views if tuple(record.image.crop_bbox) in boxes]]}
            comparison.append(KnowledgeInput(source, [PreparedImage(record.image, images.path(record.image))
                              for record in chosen.values()]))
        merged = {item.source.sample_id: item for item in comparison}
        for item in inputs:
            if item.source.sample_id in merged:
                old = merged[item.source.sample_id]
                actual = {image.evidence.evidence_id: image for image in old.images + item.images}
                merged[item.source.sample_id] = KnowledgeInput(item.source, list(actual.values()))
            else:
                merged[item.source.sample_id] = item
        KnowledgeTrace(self.context).inputs(merged.values())
        self.evaluate(version.version_id, proposals or checks, list(merged.values()), model_name, 'revision' if proposals else 'comparison')

    def evaluate(self, version_id: str, checks: List[KnowledgeCheck], inputs: List[KnowledgeInput], model_name: str, purpose: str = 'current'):
        self.context.checkpoint()
        images = {image.evidence.evidence_id: image for item in inputs for image in item.images}
        sources = {item.source.sample_id: {image.evidence.evidence_id for image in item.images
                   if image.evidence.representation == 'raw'} for item in inputs}
        contract = ObservationContract(checks, inputs)
        prompt = OBSERVATION_INSTRUCTION + json.dumps({
            **contract.context, 'version_id': version_id, 'purpose': purpose,
            'previous_checks': [check.criterion_context() for check in self.parent.checks if purpose == 'revision'
                                and any(check.check_id in value.predecessor_check_ids for value in checks)] if self.parent else [],
        }, ensure_ascii=False)
        plan = self.client.plan(contract.response_type, prompt, contract.images, model_name, OUTPUT_RESERVE_TOKENS)
        result = contract.bind(self.client.generate(plan))
        self.context.checkpoint()
        expected = {(sid, check.check_id) for sid in sources for check in checks}
        observed = [(item.sample_id, item.check_id) for item in result.observations]
        if len(observed) != len(expected) or set(observed) != expected:
            raise ValueError('冻结知识观察须完整且不重复覆盖每个来源与旧判据')
        for item in result.observations:
            allowed = sources[item.sample_id]
            if not set(item.evidence_ids) <= allowed or any(suspect.evidence_id not in allowed for suspect in item.suspects):
                raise ValueError('冻结知识观察引用了未发送或非本样本的真实证据')
        self.steps.append(KnowledgeObservationStep(step_id='observation_' + uuid.uuid4().hex,
            version_id=version_id, purpose=purpose, checks=[check.model_copy(deep=True) for check in checks], input_evidence_ids=list(images), result=result))
        self.context.update(observation_steps=[step.model_dump() for step in self.steps])
