from collections.abc import Callable
from dataclasses import dataclass

import json

import httpx
from httpx_sse import EventSource

from iad_core.advisory.output_validation import REPAIRABLE_OUTPUT


def raise_for_model_status(response: httpx.Response) -> None:
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as error:
        response.read()
        try:
            body = response.json()
        except (ValueError, UnicodeError):
            body = None
        detail = body.get('error') if isinstance(body, dict) else None
        message = detail.get('message') if isinstance(detail, dict) else None
        if isinstance(message, str) and message.strip():
            raise httpx.HTTPStatusError(f'{error}\n模型服务返回：{message.strip()}',
                request=error.request, response=error.response) from error
        raise


class ModelOutputError(ValueError):
    def __init__(self, message: str, issues: list[dict], response: str):
        super().__init__(message)
        self.issues, self.response = issues, response


@dataclass(frozen=True)
class CompletionResponse:
    body: dict
    complete: bool

    @classmethod
    def read(cls, response: httpx.Response, *, validate_json_object: bool = False) -> 'CompletionResponse':
        if response.headers.get('content-type', '').split(';')[0].strip() != 'text/event-stream':
            response.read()
            return cls(response.json(), True)
        content, metadata, reason, done = [], {}, None, False
        response_body = None
        decoder, json_closed = json.JSONDecoder(), False
        for event in EventSource(response).iter_sse():
            if event.data == '[DONE]':
                done = True
                break
            if not event.data:
                continue
            chunk = event.json()
            if chunk.get('type', '').startswith('response.'):
                if isinstance(chunk.get('response'), dict):
                    response_body = chunk['response']
                if chunk['type'] in ('response.completed','response.incomplete','response.failed'):
                    return cls(response_body, True)
                continue
            if chunk.get('error'):
                raise ValueError(f"模型流返回错误：{chunk['error']}")
            metadata.update({key: chunk[key] for key in ('id', 'model', 'usage') if chunk.get(key) is not None})
            for choice in chunk.get('choices', []):
                if choice.get('index', 0) != 0:
                    continue
                delta = choice.get('delta', {}).get('content')
                if delta is not None:
                    if not isinstance(delta, str):
                        raise ValueError('模型流包含非文本内容')
                    content.append(delta)
                    if validate_json_object and delta.strip() and (json_closed or '}' in delta):
                        text = ''.join(content).lstrip()
                        if text.startswith('{'):
                            try:
                                _, end = decoder.raw_decode(text)
                            except json.JSONDecodeError:
                                pass
                            else:
                                if text[end:].strip():
                                    raise ModelOutputError('MLLM在完整JSON对象后继续输出额外内容，结果未发布',
                                        [{'loc':(), 'type':'json_trailing_data', 'msg':'根JSON对象闭合后只能结束输出', 'ctx':{REPAIRABLE_OUTPUT:True}}], text)
                                json_closed = True
                if choice.get('finish_reason') is not None:
                    reason = choice['finish_reason']
        if response_body is not None:
            return cls(response_body, False)
        body = {**metadata, 'choices': [{'finish_reason': reason, 'message': {'content': ''.join(content)}}]}
        return cls(body, done and reason is not None)


class ResponseCapture(httpx.SyncByteStream):
    def __init__(self, source: httpx.SyncByteStream, checkpoint: Callable[[], None] | None):
        self.source, self.checkpoint = source, checkpoint
        self.content = bytearray()

    def __iter__(self):
        for chunk in self.source:
            self.content.extend(chunk)
            if self.checkpoint:
                self.checkpoint()
            yield chunk

    def close(self):
        self.source.close()
