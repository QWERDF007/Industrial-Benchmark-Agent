from typing import List, Optional

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel
from iad_core.knowledge.models import KnowledgeKind


class MiningStart(AnalysisModel):
    knowledge_preset: Optional[List[str]] = Field(default=None, description="可选知识版本引用；省略或空列表表示不使用预设，不隐式读取当前版本")
    image_count: int = Field(gt=0, strict=True, description="本次原始图像数量，必须严格等于images长度")
    images: List[str] = Field(min_length=1, description="从knowledge_sources查询复制的已导入sample_id引用，不接受相对路径或图像编码")

    @model_validator(mode='after')
    def exact_group(self):
        if self.image_count != len(self.images):
            raise ValueError('image_count必须等于images长度')
        if len(set(self.images)) != len(self.images):
            raise ValueError('images不能包含重复引用')
        presets = self.knowledge_preset or []
        if len(set(presets)) != len(presets):
            raise ValueError('knowledge_preset不能包含重复版本')
        return self


class MiningRequest(MiningStart):
    kind: KnowledgeKind


class MiningInvocation(AnalysisModel):
    scope_run_id: Optional[str] = None
    request: MiningRequest
    model_name: Optional[str] = Field(default=None, min_length=1)
    origin_session_id: Optional[str] = None
