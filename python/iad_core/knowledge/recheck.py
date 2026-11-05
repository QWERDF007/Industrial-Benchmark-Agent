from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPhase
from typing import List, Optional

from iad_core.evidence.images import EvidenceImages, PreparedImage
from iad_core.knowledge.trace import KnowledgeTrace
from iad_core.knowledge.mining import KnowledgeInput, OUTPUT_RESERVE_TOKENS
from iad_core.knowledge.models import (KnowledgeCheck, KnowledgeConflict, KnowledgeDraft, KnowledgeRecheckDecision,
                                      KnowledgeRecheckResult, KnowledgeSnapshot)
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.knowledge_review import KnowledgeReview, KnowledgeReviewEvent
from iad_core.workbench.vision import VlmClient
from iad_core.dataset.registry import DatasetRegistry
from iad_core.storage.repositories import SampleRepository, AnnotationRepository



class KnowledgeRecheck:
    def __init__(self, review: KnowledgeReview):
        self.review = review

    def pending(self, parent: Optional[KnowledgeSnapshot]) -> List[KnowledgeReviewEvent]:
        events = []
        if parent:
            applied = {item.submission_id for item in parent.review_applications if item.status == 'resolved'}
            for conflict in parent.conflicts:
                history = self.review.events(conflict.conflict_id)
                if history and history[-1].action != 'need_evidence' and str(history[-1].submission_id) not in applied:
                    events.append(history[-1])
        return events

    def evaluate(self, parent: Optional[KnowledgeSnapshot], draft: KnowledgeDraft, inputs: List[KnowledgeInput],
                 events: List[KnowledgeReviewEvent], context: JobContext, client: VlmClient,
                 images: EvidenceImages, model_name: str) -> List[KnowledgeRecheckDecision]:
        if not parent or not events:
            return []
        decisions = []
        for event in events:
            conflict = next(item for item in parent.conflicts if item.conflict_id == event.conflict_id)
            ids = set(conflict.new_evidence_ids + conflict.comparison_evidence_ids)
            owners = {item.sample_id for item in parent.evidence if item.image.evidence_id in ids}
            supplied = {}
            for item in parent.evidence:
                if item.image.evidence_id not in ids and not (item.sample_id in owners and item.image.role in ('normal', 'overview')):
                    continue
                sample = SampleRepository(self.review.db).get(item.sample_id)
                dataset_format = DatasetRegistry(self.review.db).get(sample.dataset_id).dataset.format
                annotations = AnnotationRepository(self.review.db).list_by_sample(item.sample_id)
                supplied[item.image.evidence_id] = PreparedImage(item.image, images.path(item.image)).with_source(
                    sample, dataset_format, annotations)
            supplied.update({image.evidence.evidence_id: image for item in inputs for image in item.images})
            frozen_sources = context.payload['preset_sources'][parent.version_id]
            source_context = [dict(sample_id=source['sample_id'], qualification=source['qualification'], purpose=purpose)
                for key, purpose in (('qualified_sources', 'support_candidate'), ('comparison_sources', 'comparison'))
                for source in frozen_sources[key] if source['sample_id'] in owners]
            prompt = FrozenMiningPrompt.model_validate(context.payload['mining_prompt']).render_context('人工处置重核验',{'events': [event.model_dump(mode='json')],
                'source_context': source_context,
                'conflicts': [conflict.model_dump()], 'prior_checks': [check.criterion_context() for check in parent.checks
                    if check.check_id in conflict.check_ids], 'proposed_checks': [check.model_dump() for check in draft.checks],
                'current_evidence_ids': [image.evidence.evidence_id for item in inputs for image in item.images]},phase=MiningPhase.RECHECK)
            KnowledgeTrace(context).register(item for item in parent.evidence if item.image.evidence_id in supplied)
            context.checkpoint()
            context.update(phase='RECHECKING_HUMAN_KNOWLEDGE')
            plan = client.plan(KnowledgeRecheckResult, prompt, list(supplied.values()), model_name, OUTPUT_RESERVE_TOKENS)
            result = client.generate(plan)
            context.checkpoint()
            if len(result.decisions) != 1 or result.decisions[0].submission_id != str(event.submission_id):
                raise ValueError('知识重核验须唯一覆盖冻结人工事件')
            decision = result.decisions[0]
            raw = {eid for eid, image in supplied.items() if image.evidence.representation == 'raw'}
            if not set(decision.evidence_ids) <= raw:
                raise ValueError('知识重核验引用了未发送的真实证据')
            if decision.status == 'resolved':
                required = [conflict.new_evidence_ids, conflict.comparison_evidence_ids,
                            [image.evidence.evidence_id for item in inputs for image in item.images
                             if image.evidence.representation == 'raw']]
                if any(not set(group) & set(decision.evidence_ids) & raw for group in required):
                    raise ValueError('知识处置生效须实际核对新图及冲突新旧证据')
            decisions.append(decision)
            context.update(review_applications=[item.model_dump() for item in decisions])
        return decisions

    @staticmethod
    def apply(conflicts: List[KnowledgeConflict], checks: List[KnowledgeCheck], draft: KnowledgeDraft,
              events: List[KnowledgeReviewEvent], decisions: List[KnowledgeRecheckDecision]):
        proposals = {check.title: check for check in draft.checks}
        for decision in decisions:
            event = next(item for item in events if str(item.submission_id) == decision.submission_id)
            conflict = next(item for item in conflicts if item.conflict_id == event.conflict_id)
            conflict.resolution = decision
            if decision.status != 'resolved':
                continue
            if event.action == 'retire':
                checks[:] = [check for check in checks if check.check_id not in conflict.check_ids]
            else:
                for check in checks:
                    if check.check_id not in conflict.check_ids:
                        continue
                    proposal = proposals.get(check.title)
                    check.status = proposal.status if proposal else 'provisional'
                    check.counter_evidence_ids = [eid for eid in check.counter_evidence_ids if eid not in conflict.new_evidence_ids]
                    check.conflict_ids = [cid for cid in check.conflict_ids if cid != conflict.conflict_id]
