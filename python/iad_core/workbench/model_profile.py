import json
import os
from typing import Literal, Optional

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel


class ModelProfile(AnalysisModel):
    endpoint: str
    capacity_mode: Optional[Literal['vllm_tokenize']] = None
    max_visual_inputs: int = Field(ge=1)
    max_structured_items: int = Field(default=20, ge=1)
    max_request_bytes: Optional[int] = Field(default=None, gt=0)
    context_tokens: Optional[int] = Field(default=None, gt=0)
    max_output_tokens: Optional[int] = Field(default=None, gt=0)
    request_parameters: dict = Field(default_factory=dict)
    generation_timeout_seconds: Optional[float] = Field(default=None, ge=0)
    connect_timeout_seconds: Optional[float] = Field(default=None, ge=0)
    write_timeout_seconds: Optional[float] = Field(default=None, ge=0)
    pool_timeout_seconds: Optional[float] = Field(default=None, ge=0)

    @model_validator(mode='after')
    def protected_request_fields(self):
        if set(self.request_parameters) & {'model', 'messages', 'response_format', 'max_tokens', 'max_completion_tokens', 'stream'}:
            raise ValueError('模型扩展参数不可覆盖请求范围或输出契约')
        return self

    @classmethod
    def configured(cls, endpoint: str):
        project = int(os.environ.get('IAD_VLM_MAX_VISUAL_INPUTS', '20'))
        provider = int(os.environ['LIVE_VLM_MAX_IMAGES']) if os.environ.get('LIVE_VLM_MAX_IMAGES') else project
        return cls(endpoint=endpoint, capacity_mode=os.environ.get('LIVE_VLM_CAPACITY_MODE') or None,
            max_visual_inputs=min(project, provider), max_structured_items=int(os.environ.get('IAD_VLM_MAX_STRUCTURED_ITEMS', '20')),
            max_request_bytes=os.environ.get('LIVE_VLM_MAX_REQUEST_BYTES') or None,
            context_tokens=os.environ.get('LIVE_VLM_CONTEXT_TOKENS') or None,
            max_output_tokens=os.environ.get('LIVE_VLM_MAX_OUTPUT_TOKENS') or None,
            request_parameters=json.loads(os.environ.get('LIVE_VLM_REQUEST_PARAMETERS', '{}')),
            generation_timeout_seconds=os.environ.get('LIVE_VLM_TIMEOUT_SECONDS') or None,
            connect_timeout_seconds=os.environ.get('LIVE_VLM_CONNECT_TIMEOUT_SECONDS') or None)
