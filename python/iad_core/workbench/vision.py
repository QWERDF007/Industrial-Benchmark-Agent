import base64
import json
import os
from dataclasses import dataclass
from typing import Generic, List, Optional, Type, TypeVar

import httpx
from pydantic import BaseModel, Field, ValidationError, computed_field
from iad_core.evidence.images import PreparedImage, file_sha256
from iad_core.advisory.output_validation import REPAIRABLE_OUTPUT
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.completion import CompletionResponse, ModelOutputError
from iad_core.workbench.prompt_text import RESPONSE_SCHEMA_SLOT
from iad_core.workbench.model_profile import ModelProfile
from iad_core.workbench.model_settings import ModelConnection

T = TypeVar("T", bound=BaseModel)


class ModelCapacityError(ValueError):
    pass


class TokenCapacity(BaseModel):
    count: int = Field(ge=0)
    max_model_len: int = Field(gt=0)


class TokenBudget(BaseModel):
    input_tokens: int = Field(ge=0)
    context_tokens: int = Field(gt=0)
    output_reserve: int = Field(gt=0)

    @computed_field
    @property
    def fits(self) -> bool:
        return self.input_tokens + self.output_reserve <= self.context_tokens


@dataclass(frozen=True)
class GenerationRequest(Generic[T]):
    response_type: Type[T]
    body: dict
    images: tuple[PreparedImage, ...]
    output_reserve: int
    context: dict | None = None


MODEL_PROMPT_CONTRACT = 'complete-editable-prompt-v4'
GENERATION_PARAMETERS = {"temperature": 0.1}


class VlmClient:
    def __init__(self, http_client: Optional[httpx.Client] = None, *, profile: Optional[ModelProfile] = None,
                 api_key: Optional[str] = None):
        endpoint = profile.endpoint if profile else os.environ.get("LIVE_VLM_ENDPOINT", "http://127.0.0.1:8000/v1")
        self.endpoint = endpoint if endpoint.endswith("/chat/completions") else endpoint.rstrip("/") + "/chat/completions"
        self.profile = profile.model_copy(update={'endpoint': self.endpoint}) if profile else ModelProfile.configured(self.endpoint)
        self._api_key = api_key if profile is not None else os.environ.get('LIVE_VLM_KEY')
        self.client = http_client or httpx.Client(timeout=httpx.Timeout(self.profile.generation_timeout_seconds,
            connect=self.profile.connect_timeout_seconds,
            write=self.profile.write_timeout_seconds if self.profile.write_timeout_seconds is not None else self.profile.generation_timeout_seconds,
            pool=self.profile.pool_timeout_seconds if self.profile.pool_timeout_seconds is not None else self.profile.generation_timeout_seconds), trust_env=False)
        self.profile = ModelProfile.model_validate(dict(self.profile.model_dump(),
            generation_timeout_seconds=self.client.timeout.read, connect_timeout_seconds=self.client.timeout.connect,
            write_timeout_seconds=self.client.timeout.write, pool_timeout_seconds=self.client.timeout.pool))

    def resolve_model(self, model_name: Optional[str] = None) -> str:
        if self.profile.model_id:
            if model_name and model_name != self.profile.model_id:
                raise ValueError('模型名称与工作台已选配置不一致，请使用统一模型设置')
            return self.profile.model_id
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

    def check_connection(self) -> dict:
        model = self.resolve_model()
        timeout = httpx.Timeout(20, connect=self.profile.connect_timeout_seconds if self.profile.connect_timeout_seconds is not None else 10)
        response = self.client.get(self.endpoint.removesuffix('/chat/completions') + '/models', headers=self._headers, timeout=timeout)
        response.raise_for_status()
        if model not in {item.get('id') for item in response.json()['data']}:
            raise ValueError('服务模型目录中没有所选模型，请刷新提供商模型列表')
        root = self.endpoint.removesuffix('/chat/completions').removesuffix('/v1')
        response = self.client.post(root + '/tokenize', headers=self._headers, timeout=timeout,
            json={'model': model, 'messages': [{'role': 'user', 'content': '模型容量接口检查'}]})
        response.raise_for_status()
        capacity = TokenCapacity.model_validate(response.json())
        return ModelConnection(model_id=model, capacity_mode='vllm_tokenize', context_tokens=capacity.max_model_len).model_dump()


    @property
    def _headers(self) -> dict[str, str]:
        return {"Authorization": "Bearer " + self._api_key} if self._api_key else {}

    def token_budget(self, body: dict, output_reserve: int, schema_name: str) -> TokenBudget:
        root = self.endpoint.rsplit('/chat/completions', 1)[0].removesuffix('/v1')
        request = self.client.build_request('POST', root + '/tokenize', headers=self._headers,
            json={key: body[key] for key in ('model', 'messages', 'tools', 'tool_choice',
                'parallel_tool_calls', 'chat_template_kwargs') if key in body})
        with ModelCalls.exchange(self.client, request, 'tokenize', schema_name) as response:
            response.raise_for_status()
            capacity = TokenCapacity.model_validate(response.json())
        return TokenBudget(input_tokens=capacity.count,
            context_tokens=min(capacity.max_model_len, self.profile.context_tokens or capacity.max_model_len),
            output_reserve=min(output_reserve, self.profile.max_output_tokens or output_reserve))

    def plan(self, response_type: Type[T], instruction: str, images: List[PreparedImage], model_name: str,
             output_reserve: int = 2048, *, context: dict | None = None, correction: Optional[ModelOutputError] = None) -> GenerationRequest[T]:
        if self.profile.capacity_mode is None:
            raise ValueError('模型容量能力未知，请配置LIVE_VLM_CAPACITY_MODE；未发送生成请求')
        if self.profile.max_visual_inputs is not None and len(images) > self.profile.max_visual_inputs:
            raise ModelCapacityError(f'完整图组含 {len(images)} 个视觉输入，超过已配置上限 {self.profile.max_visual_inputs}；未拆组，请确认是否减少图像数量')
        schema = response_type.model_json_schema()
        rendered='\n'.join(json.dumps(schema,ensure_ascii=False) if line.strip()==RESPONSE_SCHEMA_SLOT else line
            for line in instruction.split('\n'))
        content = [{"type": "text", "text": rendered}]
        if context is not None:
            content.append({"type": "text", "text": json.dumps(context, ensure_ascii=False)})
        for image in images:
            if file_sha256(image.path) != image.evidence.sha256:
                raise ValueError("Visual input content changed")
            with open(image.path, "rb") as source:
                encoded = base64.b64encode(source.read()).decode("ascii")
            content.append({"type": "text", "text": "视觉证据：" + json.dumps(image.model_context(), ensure_ascii=False)})
            content.append({"type": "image_url", "image_url": {"url": "data:image/png;base64," + encoded}})
        messages = [{"role": "user", "content": content}]
        if correction is not None:
            messages.extend([{"role": "assistant", "content": correction.response},
                {"role": "user", "content": '请根据以下校验结果修正上一条回答，重新输出完整结果，保持原任务的JSON结构。不要复述校验错误对象，不要只返回修改字段。输出校验结果：' + json.dumps(
                    {'schema_validation_errors': correction.issues}, ensure_ascii=False)}])
        body = {
            "model": model_name, "messages": messages,
            "response_format": {"type": "json_schema", "json_schema": {"name": response_type.__name__, "strict": True, "schema": schema}},
            "stream": True, "stream_options": {"include_usage": True},
            **GENERATION_PARAMETERS, **self.profile.request_parameters,
        }
        if not self.within_limits(body, images):
            raise ModelCapacityError(f'完整图组请求体超过已配置上限 {self.profile.max_request_bytes} 字节；未拆组，请确认是否减少图像数量')
        budget = self.token_budget(body, output_reserve, response_type.__name__)
        if not budget.fits:
            raise ModelCapacityError(f'完整图组输入 {budget.input_tokens} token，上下文上限 {budget.context_tokens}，输出至少预留 {budget.output_reserve}；未拆组，请确认是否减少图像数量')
        available = budget.context_tokens - budget.input_tokens
        body['max_tokens'] = min(available, self.profile.max_output_tokens or available)
        if not self.within_limits(body, images):
            raise ModelCapacityError(f'完整图组请求体超过已配置上限 {self.profile.max_request_bytes} 字节；未拆组，请确认是否减少图像数量')
        return GenerationRequest(response_type, body, tuple(images), output_reserve, context)

    def generate(self, plan: GenerationRequest[T]) -> T:
        for attempt in range(2):
            try:
                return self.generate_once(plan)
            except ModelOutputError as error:
                if attempt:
                    raise
                known = {image.evidence.evidence_id for image in plan.images}
                repairable = True
                parsed = None
                for issue in error.issues:
                    if issue.get('ctx',{}).get(REPAIRABLE_OUTPUT):
                        continue
                    if issue['type'] in {'missing','model_type','list_type','dict_type','too_short','too_long','extra_forbidden',
                                         'greater_than','greater_than_equal','less_than','less_than_equal'}:
                        continue
                    if issue['type'] == 'literal_error' and any(field in issue['loc'] for field in
                            ('evidence_id','evidence_ids','support_evidence_ids','counter_evidence_ids')):
                        if parsed is None:
                            parsed=json.loads(error.response)
                        value = parsed
                        try:
                            for part in issue['loc']:
                                value = value[part]
                        except (KeyError, IndexError, TypeError):
                            value = None
                        if isinstance(value, str) and value in known:
                            continue
                    repairable = False
                    break
                if not repairable:
                    raise
                instruction = plan.body['messages'][0]['content'][0]['text']
                plan = self.plan(plan.response_type, instruction, list(plan.images), plan.body['model'],
                    plan.output_reserve, context=plan.context, correction=error)

    def generate_once(self, plan: GenerationRequest[T]) -> T:
        response_type = plan.response_type
        request = self.client.build_request('POST', self.endpoint,
            headers={**self._headers, 'Accept': 'text/event-stream', 'Accept-Encoding': 'identity'},
            json=plan.body)
        with ModelCalls.exchange(self.client, request, 'generate', response_type.__name__, stream=True) as response:
            response.raise_for_status()
            completion = CompletionResponse.read(response, validate_json_object=True)
            if not completion.complete:
                raise ValueError('模型流未完整结束，分析结果未发布')
            choice = completion.body["choices"][0]
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
                    + (f" ({issue['msg']})" if issue['type']=='value_error' or issue.get('ctx',{}).get(REPAIRABLE_OUTPUT) else '') for issue in validation_issues)
                syntax = [issue.get('ctx', {}).get('error', issue['msg']) for issue in validation_issues if issue['type'] == 'json_invalid']
                if syntax:
                    issues += '；JSON语法无效：' + '; '.join(syntax)
                raise ModelOutputError(f"MLLM {response_type.__name__} 输出格式错误 (finish_reason={choice.get('finish_reason')}): {issues}", validation_issues, text) from error

    def close(self):
        self.client.close()
