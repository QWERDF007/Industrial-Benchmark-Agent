import json
from typing import List, Literal

from pydantic import Field, create_model

from iad_core.advisory.analysis import AnalysisModel
from iad_core.knowledge.models import KnowledgeDraft, KnowledgeLearning
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient

LINK_INSTRUCTION = """仅为已经完成的视觉观察建立部件与判据引用，不进行新的图像判断，不改写观察或知识。
输入areas按顺序对应area_0、area_1等输出字段，每项都必须返回。
subjects从已观察parts名称中选择，check_titles从本次checks标题中选择，准确关联该项reason所描述的观察。
没有对应项时留空，不用近义词新造引用，不以关联结果宣称人审确认或检查完整。
已形成知识的观察须有实际关联判据；若提取内容不足以建立关联，不能凭空补造知识。
冻结视觉提取："""


class DiscoveryLinks(AnalysisModel):
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
