import json
from typing import List, Literal

from pydantic import Field, create_model

from iad_core.advisory.analysis import AnalysisModel
from iad_core.knowledge.models import DiscoveryArea, DiscoveryStatus, KnowledgeDraft, KnowledgeLearning
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient

LINK_INSTRUCTION = """为已经完成的视觉观察建立部件与判据引用，并依据实际关联确定每个方向的最终status；不进行新的图像判断，不改写观察事实、reason、图像证据或知识判据。
输入areas按顺序对应area_0、area_1等输出字段，每项都必须返回。
subjects从已观察parts名称中选择，check_titles从本次checks标题中选择，准确关联该项reason所描述的观察。
没有对应项时引用留空，不用近义词新造引用，不以关联结果宣称人审确认或检查完整。
提取阶段的status是候选判断，不能直接照抄。已形成知识必须关联本次checks中的对应判据并有实际图像证据；没有对应判据时按观察事实确定证据不足、不可观察或不适用。
仅复核已有规则、但本轮增量checks未形成对应判据时保留全部观察，不能强行关联无关的新判据，也不能复制旧判据凑引用。
冻结视觉提取："""


class DiscoveryLinks(AnalysisModel):
    status: DiscoveryStatus = Field(description=DiscoveryArea.model_fields['status'].description)
    subjects: List[str]
    check_titles: List[str]


class KnowledgeDiscoveryLinker:
    def __init__(self, client: VlmClient, context: JobContext):
        self.client, self.context = client, context

    def link(self, learning: KnowledgeLearning, model_name: str) -> KnowledgeDraft:
        result = learning.model_dump(mode='json')
        discovery = learning.discovery
        if discovery and discovery.areas:
            parts = tuple(part.name for part in discovery.parts)
            checks = tuple(check.title for check in learning.checks)
            links = create_model('DiscoveryLinks', __base__=DiscoveryLinks,
                subjects=(List[Literal[parts]] if parts else List[str], Field(**({} if parts else {'max_length': 0}))),
                check_titles=(List[Literal[checks]] if checks else List[str], Field(**({} if checks else {'max_length': 0}))))
            response = create_model('KnowledgeDiscoveryLinks', __base__=AnalysisModel,
                **{f'area_{index}': (links, ...) for index in range(len(discovery.areas))})
            self.context.checkpoint()
            self.context.update(phase='LINKING_KNOWLEDGE_DISCOVERY')
            prompt = LINK_INSTRUCTION + json.dumps(result, ensure_ascii=False)
            plan = self.client.plan(response, prompt, [], model_name)
            self.context.checkpoint()
            linked = self.client.generate(plan).model_dump(mode='json')
            self.context.checkpoint()
            for index, area in enumerate(result['discovery']['areas']):
                area.update(linked[f'area_{index}'])
        return KnowledgeDraft.model_validate(result)
