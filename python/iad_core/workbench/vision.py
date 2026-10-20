import base64
import json
import os
from typing import List, Optional, Type, TypeVar

import httpx
from pydantic import BaseModel, ValidationError
from iad_core.evidence.images import PreparedImage, file_sha256

T = TypeVar("T", bound=BaseModel)


class VlmClient:
    def __init__(self, http_client: Optional[httpx.Client] = None):
        self.client = http_client or httpx.Client(timeout=90, trust_env=False)
        endpoint = os.environ.get("LIVE_VLM_ENDPOINT", "http://127.0.0.1:8000/v1")
        self.endpoint = endpoint if endpoint.endswith("/chat/completions") else endpoint.rstrip("/") + "/chat/completions"

    def generate(self, response_type: Type[T], instruction: str, images: List[PreparedImage], model_name: str) -> T:
        schema = response_type.model_json_schema()
        content = [{"type": "text", "text": instruction + "\n请根据图像和上下文填写实际分析结果；Schema 是格式约束，不是答案，不要复述其定义。\n只输出符合以下 JSON Schema 的 JSON，不要 Markdown：\n" + json.dumps(schema, ensure_ascii=False)}]
        for image in images:
            if file_sha256(image.path) != image.evidence.sha256:
                raise ValueError("Visual input content changed")
            with open(image.path, "rb") as source:
                encoded = base64.b64encode(source.read()).decode("ascii")
            content.append({"type": "text", "text": "视觉证据：" + image.evidence.model_dump_json()})
            content.append({"type": "image_url", "image_url": {"url": "data:image/png;base64," + encoded}})
        response = self.client.post(self.endpoint, headers={"Authorization": "Bearer " + os.environ.get("LIVE_VLM_KEY", "sk-123456")}, json={
            "model": model_name, "messages": [{"role": "user", "content": content}],
            "response_format": {"type": "json_schema", "json_schema": {"name": response_type.__name__, "strict": True, "schema": schema}},
            "temperature": 0.1, "max_tokens": 2048, "chat_template_kwargs": {"enable_thinking": False},
        })
        response.raise_for_status()
        choice = response.json()["choices"][0]
        if choice.get("finish_reason") == "length":
            raise ValueError(f"MLLM {response_type.__name__} 输出达到 token 上限，分析未完整返回")
        text = choice["message"].get("content")
        if not isinstance(text, str) or not text.strip():
            raise ValueError(f"VLM returned no final answer (finish_reason={choice.get('finish_reason')})")
        text = text.strip()
        if text.startswith("```") and text.endswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        try:
            return response_type.model_validate_json(text)
        except ValidationError as error:
            issues = "; ".join(f"{'.'.join(map(str, issue['loc'])) or '$'}: {issue['type']}" for issue in error.errors())
            raise ValueError(f"MLLM {response_type.__name__} 输出格式错误 (finish_reason={choice.get('finish_reason')}): {issues}") from error

    def close(self):
        self.client.close()
