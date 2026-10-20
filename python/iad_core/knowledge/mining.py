import json
import uuid
from typing import List

from iad_core.evidence.images import PreparedImage
from iad_core.knowledge.models import KnowledgeDraft, KnowledgeSource, KnowledgeStep
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient

OUTPUT_TOKENS = 8192
SYNTHESIS_INSTRUCTION = """依据子批次结果综合数据集知识。这是对已记录观察的归纳，不是直接观察新图。
保留有证据的判据、支持与反对引用、候选异常和限制。不要凭多数票抹去少数异常或冲突；
不得把某组独有特征推及全部来源，不得编造新的证据或遗漏未解决的疑点。
子批次结果："""


class KnowledgeMiner:
    def __init__(self, client: VlmClient, context: JobContext):
        self.client, self.context = client, context
        self.steps: List[KnowledgeStep] = []

    def record(self, draft: KnowledgeDraft, images: List[PreparedImage], children: List[KnowledgeStep]) -> KnowledgeStep:
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

    def learn(self, instruction: str, sources: List[KnowledgeSource], images: List[PreparedImage], model_name: str) -> KnowledgeStep:
        self.context.checkpoint()
        prompt = instruction + json.dumps([source.model_dump() for source in sources], ensure_ascii=False)
        if self.client.fits(KnowledgeDraft, prompt, images, model_name, max_tokens=OUTPUT_TOKENS):
            self.context.checkpoint()
            draft = self.client.generate(KnowledgeDraft, prompt, images, model_name, max_tokens=OUTPUT_TOKENS)
            self.context.checkpoint()
            return self.record(draft, images, [])
        if len(images) < 2:
            raise ValueError("One knowledge source exceeds the model context; no knowledge version was published")
        middle = len(images) // 2
        children = [self.learn(instruction, sources[:middle], images[:middle], model_name),
                    self.learn(instruction, sources[middle:], images[middle:], model_name)]
        self.context.checkpoint()
        prompt = SYNTHESIS_INSTRUCTION + json.dumps([child.model_dump(mode="json") for child in children], ensure_ascii=False)
        if not self.client.fits(KnowledgeDraft, prompt, [], model_name, max_tokens=OUTPUT_TOKENS):
            raise ValueError("Knowledge synthesis exceeds the model context; partial observations remain in the job")
        self.context.checkpoint()
        draft = self.client.generate(KnowledgeDraft, prompt, [], model_name, max_tokens=OUTPUT_TOKENS)
        self.context.checkpoint()
        return self.record(draft, [], children)
