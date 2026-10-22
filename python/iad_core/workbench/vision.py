import base64
import json
import os
from dataclasses import dataclass
from typing import Generic, List, Optional, Type, TypeVar

import httpx
from pydantic import BaseModel, Field, ValidationError
from iad_core.evidence.images import PreparedImage, file_sha256
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.model_profile import ModelProfile

T = TypeVar("T", bound=BaseModel)


class ModelCapacityError(ValueError):
    pass


class TokenCapacity(BaseModel):
    count: int = Field(ge=0)
    max_model_len: int = Field(gt=0)


@dataclass(frozen=True)
class GenerationRequest(Generic[T]):
    response_type: Type[T]
    body: dict


RESPONSE_INSTRUCTION = "\n请根据图像和上下文填写实际分析结果；Schema 是格式约束，不是答案，不要复述其定义。\n只输出符合以下 JSON Schema 的 JSON，不要 Markdown：\n"
GENERATION_PARAMETERS = {"temperature": 0.1}


class VlmClient:
    def __init__(self, http_client: Optional[httpx.Client] = None):
        endpoint = os.environ.get("LIVE_VLM_ENDPOINT", "http://127.0.0.1:8000/v1")
        self.endpoint = endpoint if endpoint.endswith("/chat/completions") else endpoint.rstrip("/") + "/chat/completions"
        self.profile = ModelProfile.configured(self.endpoint)
        self.client = http_client or httpx.Client(timeout=httpx.Timeout(self.profile.generation_timeout_seconds,
            connect=self.profile.connect_timeout_seconds), trust_env=False)
        self.profile = ModelProfile.model_validate(dict(self.profile.model_dump(),
            generation_timeout_seconds=self.client.timeout.read, connect_timeout_seconds=self.client.timeout.connect,
            write_timeout_seconds=self.client.timeout.write, pool_timeout_seconds=self.client.timeout.pool))

    def resolve_model(self, model_name: Optional[str] = None) -> str:
        value = model_name or os.environ.get('LIVE_VLM_MODEL')
        if value and value.strip():
            return value.strip()
        response = self.client.get(self.endpoint.removesuffix('/chat/completions') + '/models', headers=self._headers)
        response.raise_for_status()
        models = {item['id'] for item in response.json()['data'] if isinstance(item.get('id'), str) and item['id'].strip()}
        if len(models) != 1:
            raise ValueError('模型服务未提供唯一模型，请设置LIVE_VLM_MODEL或宿主有效模型配置')
        return next(iter(models))

    def within_limits(self, body: dict, images: List[PreparedImage]) -> bool:
        return (self.profile.max_visual_inputs is None or len(images) <= self.profile.max_visual_inputs) and (self.profile.max_request_bytes is None or
            len(json.dumps(body, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()) <= self.profile.max_request_bytes)


    @property
    def _headers(self) -> dict[str, str]:
        key = os.environ.get("LIVE_VLM_KEY")
        return {"Authorization": "Bearer " + key} if key else {}

    def plan(self, response_type: Type[T], instruction: str, images: List[PreparedImage], model_name: str,
             output_reserve: int = 2048) -> GenerationRequest[T]:
        if self.profile.capacity_mode is None:
            raise ValueError('模型容量能力未知，请配置LIVE_VLM_CAPACITY_MODE；未发送生成请求')
        if self.profile.max_visual_inputs is not None and len(images) > self.profile.max_visual_inputs:
            raise ModelCapacityError(f'完整图组含 {len(images)} 个视觉输入，超过已配置上限 {self.profile.max_visual_inputs}；未拆组，请确认是否减少图像数量')
        schema = response_type.model_json_schema()
        content = [{"type": "text", "text": instruction + RESPONSE_INSTRUCTION + json.dumps(schema, ensure_ascii=False)}]
        for image in images:
            if file_sha256(image.path) != image.evidence.sha256:
                raise ValueError("Visual input content changed")
            with open(image.path, "rb") as source:
                encoded = base64.b64encode(source.read()).decode("ascii")
            content.append({"type": "text", "text": "视觉证据：" + json.dumps(image.evidence.model_context(), ensure_ascii=False)})
            content.append({"type": "image_url", "image_url": {"url": "data:image/png;base64," + encoded}})
        body = {
            "model": model_name, "messages": [{"role": "user", "content": content}],
            "response_format": {"type": "json_schema", "json_schema": {"name": response_type.__name__, "strict": True, "schema": schema}},
            **GENERATION_PARAMETERS, **self.profile.request_parameters,
        }
        if not self.within_limits(body, images):
            raise ModelCapacityError(f'完整图组请求体超过已配置上限 {self.profile.max_request_bytes} 字节；未拆组，请确认是否减少图像数量')
        root = self.endpoint.rsplit('/chat/completions', 1)[0].removesuffix('/v1')
        request = self.client.build_request('POST', root + '/tokenize', headers=self._headers,
                                    json={key: body[key] for key in ('model', 'messages', 'chat_template_kwargs') if key in body})
        with ModelCalls.exchange(self.client, request, 'tokenize', response_type.__name__) as response:
            response.raise_for_status()
            capacity = TokenCapacity.model_validate(response.json())
            maximum = min(capacity.max_model_len, self.profile.context_tokens or capacity.max_model_len)
            available = maximum - capacity.count
            required = min(output_reserve, self.profile.max_output_tokens or output_reserve)
            if available < required:
                raise ModelCapacityError(f'完整图组输入 {capacity.count} token，上下文上限 {maximum}，输出至少预留 {required}；未拆组，请确认是否减少图像数量')
            body['max_tokens'] = min(available, self.profile.max_output_tokens or available)
        if not self.within_limits(body, images):
            raise ModelCapacityError(f'完整图组请求体超过已配置上限 {self.profile.max_request_bytes} 字节；未拆组，请确认是否减少图像数量')
        return GenerationRequest(response_type, body)

    def generate(self, plan: GenerationRequest[T]) -> T:
        response_type = plan.response_type
        request = self.client.build_request('POST', self.endpoint, headers=self._headers, json=plan.body)
        with ModelCalls.exchange(self.client, request, 'generate', response_type.__name__) as response:
            response.raise_for_status()
            choice = response.json()["choices"][0]
            if choice.get("finish_reason") == "length":
                raise ValueError(f"MLLM {response_type.__name__} 输出达到 token 上限（本次输出预算 {plan.body['max_tokens']}），分析未完整返回")
            text = choice["message"].get("content")
            if not isinstance(text, str) or not text.strip():
                raise ValueError(f"VLM returned no final answer (finish_reason={choice.get('finish_reason')})")
            text = text.strip()
            if text.startswith("```") and text.endswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            try:
                return response_type.model_validate_json(text)
            except ValidationError as error:
                validation_issues = error.errors(include_input=False)
                issues = "; ".join(f"{'.'.join(map(str, issue['loc'])) or '$'}: {issue['type']}"
                    + (f" ({issue['msg']})" if issue['type'] == 'value_error' else '') for issue in validation_issues)
                syntax = [issue.get('ctx', {}).get('error', issue['msg']) for issue in validation_issues if issue['type'] == 'json_invalid']
                if syntax:
                    issues += '；JSON语法无效：' + '; '.join(syntax)
                raise ValueError(f"MLLM {response_type.__name__} 输出格式错误 (finish_reason={choice.get('finish_reason')}): {issues}") from error

    def close(self):
        self.client.close()
